import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieResponseDto, PrerequisiteMovieDto } from './dto/movie-response.dto';
import { RewatchOrderResponseDto } from './dto/rewatch-order-response.dto';
import { CircularDependencyException } from '../common/exceptions/circular-dependency.exception';
import { validateNoCycles } from './algorithms/cycle-detector';
import { computeRewatchOrder, MovieNode } from './algorithms/rewatch-order';
import { Movie, MoviePrerequisite, Prisma } from '@prisma/client';

type MovieWithPrerequisites = Movie & {
  prerequisites: (MoviePrerequisite & {
    prerequisite: Movie;
  })[];
};

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovieDto): Promise<MovieResponseDto> {
    const trimmedTitle = dto.title.trim();

    // 1. Check title uniqueness
    const existing = await this.prisma.movie.findUnique({
      where: { title: trimmedTitle },
    });
    if (existing) {
      throw new ConflictException(`Movie with title '${trimmedTitle}' already exists.`);
    }

    // 2. Validate prerequisites exist
    const rawPrereqIds = dto.prerequisiteIds || [];
    const uniquePrereqIds = Array.from(new Set(rawPrereqIds));

    if (uniquePrereqIds.length > 0) {
      const existingPrereqs = await this.prisma.movie.findMany({
        where: { id: { in: uniquePrereqIds } },
        select: { id: true },
      });
      const foundIds = new Set(existingPrereqs.map((p) => p.id));
      const missingIds = uniquePrereqIds.filter((id) => !foundIds.has(id));

      if (missingIds.length > 0) {
        throw new BadRequestException(
          `Prerequisite movie(s) not found: ${missingIds.join(', ')}`,
        );
      }
    }

    // 3. Atomically create movie and prerequisites
    const movie = await this.prisma.$transaction(async (tx) => {
      const created = await tx.movie.create({
        data: {
          title: trimmedTitle,
          releaseYear: dto.releaseYear,
          runtimeMinutes: dto.runtimeMinutes,
          watched: dto.watched ?? false,
          prerequisites: {
            create: uniquePrereqIds.map((prereqId) => ({
              prerequisiteId: prereqId,
            })),
          },
        },
        include: {
          prerequisites: {
            include: {
              prerequisite: true,
            },
          },
        },
      });
      return created;
    });

    return this.mapToDto(movie);
  }

  async findAll(): Promise<MovieResponseDto[]> {
    const movies = await this.prisma.movie.findMany({
      orderBy: { releaseYear: 'asc' },
      include: {
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    return movies.map((m) => this.mapToDto(m));
  }

  async findOne(id: string): Promise<MovieResponseDto> {
    const movie = await this.prisma.movie.findUnique({
      where: { id },
      include: {
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
      },
    });

    if (!movie) {
      throw new NotFoundException(`Movie with ID '${id}' not found.`);
    }

    return this.mapToDto(movie);
  }

  async update(id: string, dto: UpdateMovieDto): Promise<MovieResponseDto> {
    // 1. Verify target movie exists
    const target = await this.prisma.movie.findUnique({
      where: { id },
    });
    if (!target) {
      throw new NotFoundException(`Movie with ID '${id}' not found.`);
    }

    // 2. Validate title uniqueness if changing title
    if (dto.title !== undefined) {
      const trimmedTitle = dto.title.trim();
      if (trimmedTitle !== target.title) {
        const titleConflict = await this.prisma.movie.findUnique({
          where: { title: trimmedTitle },
        });
        if (titleConflict) {
          throw new ConflictException(`Movie with title '${trimmedTitle}' already exists.`);
        }
      }
    }

    // 3. Validate prerequisites and cycle guard if prerequisiteIds is specified
    let uniquePrereqIds: string[] | undefined = undefined;

    if (dto.prerequisiteIds !== undefined) {
      uniquePrereqIds = Array.from(new Set(dto.prerequisiteIds));

      // Direct self-dependency check
      if (uniquePrereqIds.includes(id)) {
        throw new CircularDependencyException('A movie cannot depend on itself directly.');
      }

      // Check all prerequisite IDs exist
      if (uniquePrereqIds.length > 0) {
        const existingPrereqs = await this.prisma.movie.findMany({
          where: { id: { in: uniquePrereqIds } },
          select: { id: true },
        });
        const foundIds = new Set(existingPrereqs.map((p) => p.id));
        const missingIds = uniquePrereqIds.filter((pid) => !foundIds.has(pid));

        if (missingIds.length > 0) {
          throw new BadRequestException(
            `Prerequisite movie(s) not found: ${missingIds.join(', ')}`,
          );
        }
      }

      // Cycle detection: load existing edges and test proposed state in memory
      const allEdges = await this.prisma.moviePrerequisite.findMany({
        select: { movieId: true, prerequisiteId: true },
      });

      const isAcyclic = validateNoCycles(id, uniquePrereqIds, allEdges);
      if (!isAcyclic) {
        throw new CircularDependencyException('The prerequisite change would create a cycle.');
      }
    }

    // 4. Atomically persist scalar and relation changes
    await this.prisma.$transaction(async (tx) => {
      const dataToUpdate: Prisma.MovieUpdateInput = {};
      if (dto.title !== undefined) dataToUpdate.title = dto.title.trim();
      if (dto.releaseYear !== undefined) dataToUpdate.releaseYear = dto.releaseYear;
      if (dto.runtimeMinutes !== undefined) dataToUpdate.runtimeMinutes = dto.runtimeMinutes;
      if (dto.watched !== undefined) dataToUpdate.watched = dto.watched;

      if (Object.keys(dataToUpdate).length > 0) {
        await tx.movie.update({
          where: { id },
          data: dataToUpdate,
        });
      }

      if (uniquePrereqIds !== undefined) {
        // Clear old prerequisites for this movie
        await tx.moviePrerequisite.deleteMany({
          where: { movieId: id },
        });

        // Insert new prerequisites if any
        if (uniquePrereqIds.length > 0) {
          await tx.moviePrerequisite.createMany({
            data: uniquePrereqIds.map((prereqId) => ({
              movieId: id,
              prerequisiteId: prereqId,
            })),
          });
        }
      }
    });

    return this.findOne(id);
  }

  async getRewatchOrder(targetId: string): Promise<RewatchOrderResponseDto> {
    const allMovies = await this.prisma.movie.findMany({
      include: {
        prerequisites: true,
      },
    });

    const movieMap = new Map<string, MovieNode>();
    for (const m of allMovies) {
      movieMap.set(m.id, {
        id: m.id,
        title: m.title,
        releaseYear: m.releaseYear,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
        prerequisiteIds: m.prerequisites.map((p) => p.prerequisiteId),
      });
    }

    const result = computeRewatchOrder(targetId, movieMap);
    if (!result) {
      throw new NotFoundException(`Movie with ID '${targetId}' not found.`);
    }

    return result;
  }

  private mapToDto(movie: MovieWithPrerequisites): MovieResponseDto {
    const prereqList: PrerequisiteMovieDto[] = movie.prerequisites.map((p) => ({
      id: p.prerequisite.id,
      title: p.prerequisite.title,
      releaseYear: p.prerequisite.releaseYear,
      runtimeMinutes: p.prerequisite.runtimeMinutes,
      watched: p.prerequisite.watched,
    }));

    return {
      id: movie.id,
      title: movie.title,
      releaseYear: movie.releaseYear,
      runtimeMinutes: movie.runtimeMinutes,
      watched: movie.watched,
      prerequisiteIds: movie.prerequisites.map((p) => p.prerequisiteId),
      prerequisites: prereqList,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };
  }
}
