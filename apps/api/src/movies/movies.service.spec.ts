import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CircularDependencyException } from '../common/exceptions/circular-dependency.exception';

describe('MoviesService (Unit)', () => {
  let service: MoviesService;
  let prisma: {
    movie: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    moviePrerequisite: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      createMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      movie: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      moviePrerequisite: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MoviesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws ConflictException if title already exists', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce({ id: '1', title: 'Iron Man' });

      await expect(
        service.create({
          title: 'Iron Man',
          releaseYear: 2008,
          runtimeMinutes: 126,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if any prerequisite does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce(null);
      prisma.movie.findMany.mockResolvedValueOnce([{ id: 'existing-id' }]);

      await expect(
        service.create({
          title: 'The Avengers',
          releaseYear: 2012,
          runtimeMinutes: 143,
          prerequisiteIds: ['existing-id', 'nonexistent-id'],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('update (PATCH)', () => {
    it('throws NotFoundException if movie does not exist', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.update('fake-id', { watched: true }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws CircularDependencyException on direct self-dependency', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce({ id: 'm-iron-man', title: 'Iron Man' });

      await expect(
        service.update('m-iron-man', { prerequisiteIds: ['m-iron-man'] }),
      ).rejects.toThrow(CircularDependencyException);
    });

    it('throws CircularDependencyException on indirect cycle', async () => {
      prisma.movie.findUnique.mockResolvedValueOnce({ id: 'm-iron-man', title: 'Iron Man' });
      // prerequisite exists check
      prisma.movie.findMany.mockResolvedValueOnce([{ id: 'm-endgame' }]);
      // existing edges: endgame -> infinity war -> avengers -> iron man
      prisma.moviePrerequisite.findMany.mockResolvedValueOnce([
        { movieId: 'm-avengers', prerequisiteId: 'm-iron-man' },
        { movieId: 'm-endgame', prerequisiteId: 'm-avengers' },
      ]);

      await expect(
        service.update('m-iron-man', { prerequisiteIds: ['m-endgame'] }),
      ).rejects.toThrow(CircularDependencyException);
    });

    it('allows clearing prerequisites when prerequisiteIds is empty array []', async () => {
      const mockMovie = {
        id: 'm-avengers',
        title: 'The Avengers',
        releaseYear: 2012,
        runtimeMinutes: 143,
        watched: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        prerequisites: [],
      };

      // 1. Initial existence check
      prisma.movie.findUnique.mockResolvedValueOnce(mockMovie);
      // 2. Cycle detection check
      prisma.moviePrerequisite.findMany.mockResolvedValueOnce([]);
      // 3. findOne after transaction
      prisma.movie.findUnique.mockResolvedValueOnce(mockMovie);

      const result = await service.update('m-avengers', { prerequisiteIds: [] });
      expect(result.prerequisiteIds).toEqual([]);
      expect(prisma.moviePrerequisite.deleteMany).toHaveBeenCalledWith({
        where: { movieId: 'm-avengers' },
      });
    });
  });
});
