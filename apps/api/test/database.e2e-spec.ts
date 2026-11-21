import { PrismaClient, Prisma } from '@prisma/client';

describe('Database Schema & Constraints Integration Tests', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('rejects duplicate movie titles (Unique constraint)', async () => {
    const title = `Test Movie Unique ${Date.now()}`;
    await prisma.movie.create({
      data: {
        title,
        releaseYear: 2024,
        runtimeMinutes: 120,
      },
    });

    await expect(
      prisma.movie.create({
        data: {
          title,
          releaseYear: 2025,
          runtimeMinutes: 130,
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it('rejects duplicate cinema names (Unique constraint)', async () => {
    const name = `Test Cinema Unique ${Date.now()}`;
    await prisma.cinema.create({
      data: { name },
    });

    await expect(
      prisma.cinema.create({
        data: { name },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it('rejects duplicate bundle sizes for the same cinema', async () => {
    const cinema = await prisma.cinema.create({
      data: { name: `Bundle Test Cinema ${Date.now()}` },
    });

    await prisma.cinemaBundle.create({
      data: { cinemaId: cinema.id, size: 5 },
    });

    await expect(
      prisma.cinemaBundle.create({
        data: { cinemaId: cinema.id, size: 5 },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it('rejects nonexistent foreign key references in MoviePrerequisite', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    await expect(
      prisma.moviePrerequisite.create({
        data: {
          movieId: fakeId,
          prerequisiteId: fakeId,
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects self-referencing movie prerequisite (Check constraint: movieId != prerequisiteId)', async () => {
    const movie = await prisma.movie.create({
      data: {
        title: `Self Ref Test ${Date.now()}`,
        releaseYear: 2024,
        runtimeMinutes: 100,
      },
    });

    await expect(
      prisma.moviePrerequisite.create({
        data: {
          movieId: movie.id,
          prerequisiteId: movie.id,
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects invalid runtimeMinutes outside 1-300 range (Check constraint)', async () => {
    // runtimeMinutes = 0
    await expect(
      prisma.movie.create({
        data: {
          title: `Zero Runtime ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 0,
        },
      }),
    ).rejects.toThrow();

    // runtimeMinutes = 350
    await expect(
      prisma.movie.create({
        data: {
          title: `Excessive Runtime ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 350,
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects invalid cinema bundle size outside 1-500 range (Check constraint)', async () => {
    const cinema = await prisma.cinema.create({
      data: { name: `Size Range Test Cinema ${Date.now()}` },
    });

    // size = 0
    await expect(
      prisma.cinemaBundle.create({
        data: { cinemaId: cinema.id, size: 0 },
      }),
    ).rejects.toThrow();

    // size = 600
    await expect(
      prisma.cinemaBundle.create({
        data: { cinemaId: cinema.id, size: 600 },
      }),
    ).rejects.toThrow();
  });
});

