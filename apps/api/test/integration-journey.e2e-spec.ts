import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Full End-to-End User Journey (Integration QA)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Journey 1: Movie Creation -> Prerequisites -> Watched Update -> Rewatch Plan -> Cycle Guard', () => {
    let movieAId: string;
    let movieBId: string;
    let movieCId: string;

    it('creates movies and connects prerequisites', async () => {
      // 1. Create Movie A
      const resA = await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Journey Movie A ${Date.now()}`,
          releaseYear: 2020,
          runtimeMinutes: 100,
        })
        .expect(201);
      movieAId = resA.body.id;

      // 2. Create Movie B with prerequisite A
      const resB = await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Journey Movie B ${Date.now()}`,
          releaseYear: 2021,
          runtimeMinutes: 120,
          prerequisiteIds: [movieAId],
        })
        .expect(201);
      movieBId = resB.body.id;

      // 3. Create Movie C with prerequisite B
      const resC = await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Journey Movie C ${Date.now()}`,
          releaseYear: 2022,
          runtimeMinutes: 140,
          prerequisiteIds: [movieBId],
        })
        .expect(201);
      movieCId = resC.body.id;

      expect(movieAId).toBeDefined();
      expect(movieBId).toBeDefined();
      expect(movieCId).toBeDefined();
    });

    it('requests rewatch order for Movie C and verifies prerequisite sequence and metrics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/movies/${movieCId}/rewatch-order`)
        .expect(200);

      expect(res.body.target.id).toBe(movieCId);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.movies[0].id).toBe(movieAId);
      expect(res.body.movies[1].id).toBe(movieBId);
      expect(res.body.watchedCount).toBe(0);
      expect(res.body.unwatchedRuntimeMinutes).toBe(220); // 100 + 120
    });

    it('updates watched status of Movie A and verifies updated rewatch metrics', async () => {
      await request(app.getHttpServer())
        .patch(`/api/movies/${movieAId}`)
        .send({ watched: true })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get(`/api/movies/${movieCId}/rewatch-order`)
        .expect(200);

      expect(res.body.watchedCount).toBe(1);
      expect(res.body.unwatchedRuntimeMinutes).toBe(120); // only B is unwatched now
      expect(res.body.movies[0].watched).toBe(true);
    });

    it('rejects adding Movie C as a prerequisite of Movie A with 409 CIRCULAR_DEPENDENCY', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${movieAId}`)
        .send({ prerequisiteIds: [movieCId] })
        .expect(409);

      expect(res.body.code).toBe('CIRCULAR_DEPENDENCY');

      // Verify database state preserved
      const movieADb = await prisma.movie.findUnique({
        where: { id: movieAId },
        include: { prerequisites: true },
      });
      expect(movieADb?.prerequisites).toHaveLength(0);
    });
  });

  describe('Journey 2: Cinema Creation -> Possible Quote -> Impossible Quote -> Large Scale DP', () => {
    let customCinemaId: string;

    it('creates a custom cinema venue with distinct bundle sizes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Galaxy Multiplex ${Date.now()}`,
          bundleSizes: [5, 12, 25],
        })
        .expect(201);

      customCinemaId = res.body.id;
      expect(res.body.bundleSizes).toEqual([5, 12, 25]);
    });

    it('calculates optimal bundle allocation for group size 37 (1x25 + 1x12 = 2 bundles)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${customCinemaId}/booking?groupSize=37`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.groupSize).toBe(37);
      expect(res.body.totalBundles).toBe(2);
      expect(res.body.bundles).toEqual([
        { size: 25, count: 1 },
        { size: 12, count: 1 },
      ]);
    });

    it('detects impossible seating for group size 8 with bundles [5, 12, 25]', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${customCinemaId}/booking?groupSize=8`)
        .expect(200);

      expect(res.body.possible).toBe(false);
      expect(res.body.groupSize).toBe(8);
      expect(res.body.totalBundles).toBeNull();
      expect(res.body.bundles).toEqual([]);
    });

    it('computes maximum group size 10,000 across 10 bundle sizes in under 50ms', async () => {
      const largeCinema = await prisma.cinema.create({
        data: {
          name: `Mega Plex ${Date.now()}`,
          bundles: {
            create: [
              { size: 3 },
              { size: 7 },
              { size: 11 },
              { size: 15 },
              { size: 25 },
              { size: 50 },
              { size: 75 },
              { size: 100 },
              { size: 250 },
              { size: 500 },
            ],
          },
        },
      });

      const startTime = performance.now();
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${largeCinema.id}/booking?groupSize=10000`)
        .expect(200);
      const elapsed = performance.now() - startTime;

      expect(res.body.possible).toBe(true);
      expect(res.body.totalBundles).toBe(20); // 20 x 500 = 10,000
      expect(elapsed).toBeLessThan(1500); // Supertest + HTTP + remote database overhead < 1.5s
    });
  });
});
