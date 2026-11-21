import { Test, TestingModule } from '@nestjs/testing';
import { CinemasService } from './cinemas.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('CinemasService', () => {
  let service: CinemasService;
  let prisma: {
    cinema: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      cinema: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CinemasService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CinemasService>(CinemasService);
  });

  describe('create', () => {
    it('creates cinema and returns sorted bundles', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);
      prisma.cinema.create.mockResolvedValue({
        id: 'cinema-1',
        name: 'IMAX Sydney',
        createdAt: new Date(),
        updatedAt: new Date(),
        bundles: [{ size: 2 }, { size: 5 }],
      });

      const result = await service.create({
        name: '  IMAX Sydney  ',
        bundleSizes: [5, 2],
      });

      expect(result.id).toBe('cinema-1');
      expect(result.name).toBe('IMAX Sydney');
      expect(result.bundleSizes).toEqual([2, 5]);
    });

    it('throws ConflictException on duplicate cinema name', async () => {
      prisma.cinema.findUnique.mockResolvedValue({ id: 'existing', name: 'IMAX Sydney' });

      await expect(
        service.create({
          name: 'IMAX Sydney',
          bundleSizes: [2, 5],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if bundle sizes contain duplicates', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'New Cinema',
          bundleSizes: [2, 5, 2],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if bundle sizes array is empty', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'New Cinema',
          bundleSizes: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if bundle sizes exceed 10', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'New Cinema',
          bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns all cinemas with ascending bundle sizes', async () => {
      prisma.cinema.findMany.mockResolvedValue([
        {
          id: 'c-1',
          name: 'Alpha Cinema',
          createdAt: new Date(),
          updatedAt: new Date(),
          bundles: [{ size: 10 }, { size: 5 }],
        },
      ]);

      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0].bundleSizes).toEqual([5, 10]);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if cinema does not exist', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(service.findOne('c-unknown')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getBookingQuote', () => {
    it('throws NotFoundException if cinema does not exist', async () => {
      prisma.cinema.findUnique.mockResolvedValue(null);

      await expect(service.getBookingQuote('c-unknown', 10)).rejects.toThrow(NotFoundException);
    });

    it('returns optimal bundle quote for valid cinema and groupSize', async () => {
      prisma.cinema.findUnique.mockResolvedValue({
        id: 'c-1',
        name: 'Midtown Cinema',
        bundles: [{ size: 2 }, { size: 5 }],
      });

      const quote = await service.getBookingQuote('c-1', 11);
      expect(quote.possible).toBe(true);
      expect(quote.totalBundles).toBe(4);
      expect(quote.bundles).toEqual([
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ]);
    });
  });
});

