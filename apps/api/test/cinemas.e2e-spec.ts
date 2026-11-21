import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

jest.setTimeout(30000);

describe('Cinemas API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let starkCinemaId: string;
  let odinCinemaId: string;
  let sanctumCinemaId: string;
  let dpCinemaId: string;

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

    // Retrieve seeded cinemas
    const stark = await prisma.cinema.findFirst({
      where: { name: 'Stark IMAX Theatre' },
      include: { bundles: true },
    });
    const odin = await prisma.cinema.findFirst({
      where: { name: 'Odin Odeon Screen' },
      include: { bundles: true },
    });
    const sanctum = await prisma.cinema.findFirst({
      where: { name: 'Sanctum Sanctorum Cinema' },
      include: { bundles: true },
    });

    starkCinemaId = stark?.id || '';
    odinCinemaId = odin?.id || '';
    sanctumCinemaId = sanctum?.id || '';

    // Create a cinema with [1, 3, 4] bundles for assessment case 1
    const dpCinema = await prisma.cinema.upsert({
      where: { name: 'Assessment DP Cinema [1, 3, 4]' },
      update: {},
      create: {
        name: 'Assessment DP Cinema [1, 3, 4]',
        bundles: {
          create: [{ size: 1 }, { size: 3 }, { size: 4 }],
        },
      },
      include: { bundles: true },
    });
    dpCinemaId = dpCinema.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/cinemas', () => {
    it('creates a cinema successfully and returns 201 with sorted bundle sizes', async () => {
      const uniqueName = `Regal Premiere ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `  ${uniqueName}  `,
          bundleSizes: [10, 2, 5],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(uniqueName);
      expect(res.body.bundleSizes).toEqual([2, 5, 10]);
    });

    it('rejects duplicate cinema name with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: 'Stark IMAX Theatre',
          bundleSizes: [2, 5],
        })
        .expect(409);
    });

    it('rejects empty or whitespace name with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: '   ',
          bundleSizes: [2, 5],
        })
        .expect(400);
    });

    it('rejects empty bundle sizes array with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Cinema Empty Bundles ${Date.now()}`,
          bundleSizes: [],
        })
        .expect(400);
    });

    it('rejects more than 10 bundle sizes with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Cinema 11 Bundles ${Date.now()}`,
          bundleSizes: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        })
        .expect(400);
    });

    it('rejects bundle size 0 with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Cinema Zero Bundle ${Date.now()}`,
          bundleSizes: [0, 5],
        })
        .expect(400);
    });

    it('rejects bundle size > 500 with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Cinema Huge Bundle ${Date.now()}`,
          bundleSizes: [5, 501],
        })
        .expect(400);
    });

    it('rejects duplicate bundle sizes with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/cinemas')
        .send({
          name: `Cinema Duplicate Bundles ${Date.now()}`,
          bundleSizes: [2, 5, 2],
        })
        .expect(400);
    });
  });

  describe('GET /api/cinemas', () => {
    it('returns all cinemas with ascending bundle sizes', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/cinemas')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);

      const stark = res.body.find((c: { name: string }) => c.name === 'Stark IMAX Theatre');
      expect(stark).toBeDefined();
      expect(stark.bundleSizes).toEqual([2, 5]);
    });
  });

  describe('GET /api/cinemas/:id/booking?groupSize=N', () => {
    it('ASSESSMENT TEST CASE: [1, 3, 4], 6 -> 2 bundles of 3 (proves DP over greedy)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${dpCinemaId}/booking?groupSize=6`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.groupSize).toBe(6);
      expect(res.body.totalBundles).toBe(2);
      expect(res.body.bundles).toEqual([{ size: 3, count: 2 }]);
    });

    it('ASSESSMENT TEST CASE: [2, 5], 11 -> 4 bundles (1x5 and 3x2)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${starkCinemaId}/booking?groupSize=11`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.groupSize).toBe(11);
      expect(res.body.totalBundles).toBe(4);
      expect(res.body.bundles).toEqual([
        { size: 5, count: 1 },
        { size: 2, count: 3 },
      ]);
    });

    it('ASSESSMENT TEST CASE: [6, 9, 20], 44 -> 4 bundles (1x20, 2x9, 1x6)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${odinCinemaId}/booking?groupSize=44`)
        .expect(200);

      expect(res.body.possible).toBe(true);
      expect(res.body.groupSize).toBe(44);
      expect(res.body.totalBundles).toBe(4);
      expect(res.body.bundles).toEqual([
        { size: 20, count: 1 },
        { size: 9, count: 2 },
        { size: 6, count: 1 },
      ]);
    });

    it('ASSESSMENT TEST CASE: [4, 6], 7 -> impossible', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking?groupSize=7`)
        .expect(200);

      expect(res.body.possible).toBe(false);
      expect(res.body.groupSize).toBe(7);
      expect(res.body.totalBundles).toBeNull();
      expect(res.body.bundles).toEqual([]);
    });

    it('rejects missing groupSize with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking`)
        .expect(400);
    });

    it('rejects groupSize 0 with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking?groupSize=0`)
        .expect(400);
    });

    it('rejects negative groupSize with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking?groupSize=-5`)
        .expect(400);
    });

    it('rejects groupSize > 10,000 with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking?groupSize=10001`)
        .expect(400);
    });

    it('rejects non-numeric groupSize with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get(`/api/cinemas/${sanctumCinemaId}/booking?groupSize=abc`)
        .expect(400);
    });

    it('returns 404 for nonexistent cinema UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/cinemas/a0000000-0000-4000-8000-000000000000/booking?groupSize=10')
        .expect(404);
    });
  });
});
