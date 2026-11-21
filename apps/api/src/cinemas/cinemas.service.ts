import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { BookingQuoteResponseDto } from './dto/booking-quote-response.dto';
import { computeMinimumBundles } from './algorithms/minimum-bundles';
import { Cinema, CinemaBundle } from '@prisma/client';

type CinemaWithBundles = Cinema & {
  bundles: CinemaBundle[];
};

@Injectable()
export class CinemasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCinemaDto): Promise<CinemaResponseDto> {
    const trimmedName = dto.name.trim();

    // 1. Validate uniqueness
    const existing = await this.prisma.cinema.findUnique({
      where: { name: trimmedName },
    });
    if (existing) {
      throw new ConflictException(`Cinema with name '${trimmedName}' already exists.`);
    }

    // 2. Validate distinct bundle sizes
    const uniqueSizes = Array.from(new Set(dto.bundleSizes));
    if (uniqueSizes.length !== dto.bundleSizes.length) {
      throw new BadRequestException('Bundle sizes must be distinct.');
    }
    if (uniqueSizes.length < 1 || uniqueSizes.length > 10) {
      throw new BadRequestException('Cinema must have between 1 and 10 bundle sizes.');
    }

    // Sort ascending for predictable database storage
    uniqueSizes.sort((a, b) => a - b);

    // 3. Persist cinema and bundle rows atomically
    const created = await this.prisma.$transaction(async (tx) => {
      const cinema = await tx.cinema.create({
        data: {
          name: trimmedName,
          bundles: {
            create: uniqueSizes.map((size) => ({ size })),
          },
        },
        include: {
          bundles: true,
        },
      });
      return cinema;
    });

    return this.mapToDto(created);
  }

  async findAll(): Promise<CinemaResponseDto[]> {
    const cinemas = await this.prisma.cinema.findMany({
      orderBy: { name: 'asc' },
      include: {
        bundles: true,
      },
    });

    return cinemas.map((c) => this.mapToDto(c));
  }

  async findOne(id: string): Promise<CinemaResponseDto> {
    const cinema = await this.prisma.cinema.findUnique({
      where: { id },
      include: {
        bundles: true,
      },
    });

    if (!cinema) {
      throw new NotFoundException(`Cinema with ID '${id}' not found.`);
    }

    return this.mapToDto(cinema);
  }

  async getBookingQuote(
    cinemaId: string,
    groupSize: number,
  ): Promise<BookingQuoteResponseDto> {
    const cinema = await this.prisma.cinema.findUnique({
      where: { id: cinemaId },
      include: {
        bundles: true,
      },
    });

    if (!cinema) {
      throw new NotFoundException(`Cinema with ID '${cinemaId}' not found.`);
    }

    const bundleSizes = cinema.bundles.map((b) => b.size);
    return computeMinimumBundles(bundleSizes, groupSize);
  }

  private mapToDto(cinema: CinemaWithBundles): CinemaResponseDto {
    const sortedSizes = cinema.bundles
      .map((b) => b.size)
      .sort((a, b) => a - b);

    return {
      id: cinema.id,
      name: cinema.name,
      bundleSizes: sortedSizes,
      createdAt: cinema.createdAt,
      updatedAt: cinema.updatedAt,
    };
  }
}

