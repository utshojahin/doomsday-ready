import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Movies API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ironManId: string;
  let endgameId: string;
  let testMovieId: string;

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

    // Retrieve seeded movies
    const ironMan = await prisma.movie.findFirst({ where: { title: 'Iron Man' } });
    const endgame = await prisma.movie.findFirst({ where: { title: 'Avengers: Endgame' } });
    ironManId = ironMan?.id || '';
    endgameId = endgame?.id || '';

    // Create a dedicated movie for PATCH tests
    const created = await prisma.movie.create({
      data: {
        title: `Patch Subject ${Date.now()}`,
        releaseYear: 2015,
        runtimeMinutes: 130,
        watched: false,
      },
    });
    testMovieId = created.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/movies', () => {
    it('creates a movie successfully and returns 201 with default watched=false', async () => {
      const uniqueTitle = `Guardians of the Galaxy ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `  ${uniqueTitle}  `,
          releaseYear: 2014,
          runtimeMinutes: 121,
          prerequisiteIds: [ironManId],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe(uniqueTitle);
      expect(res.body.releaseYear).toBe(2014);
      expect(res.body.runtimeMinutes).toBe(121);
      expect(res.body.watched).toBe(false);
      expect(res.body.prerequisiteIds).toContain(ironManId);
      expect(res.body.prerequisites).toHaveLength(1);
      expect(res.body.prerequisites[0].title).toBe('Iron Man');
    });

    it('rejects duplicate movie title with 409 Conflict', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: 'Iron Man',
          releaseYear: 2008,
          runtimeMinutes: 126,
        })
        .expect(409);
    });

    it('rejects blank or empty title with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: '   ',
          releaseYear: 2024,
          runtimeMinutes: 120,
        })
        .expect(400);
    });

    it('rejects runtime 0 and runtime 301 with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Test Movie Runtime 0 ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 0,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Test Movie Runtime 301 ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 301,
        })
        .expect(400);
    });

    it('rejects fractional release year and fractional runtime with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Test Fractional Year ${Date.now()}`,
          releaseYear: 2024.5,
          runtimeMinutes: 120,
        })
        .expect(400);

      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Test Fractional Runtime ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 120.7,
        })
        .expect(400);
    });

    it('rejects nonexistent prerequisite ID with 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title: `Movie with Bad Prereq ${Date.now()}`,
          releaseYear: 2024,
          runtimeMinutes: 120,
          prerequisiteIds: ['00000000-0000-0000-0000-000000000000'],
        })
        .expect(400);
    });

    it('deduplicates prerequisite IDs so no duplicate join rows are created', async () => {
      const title = `Deduplication Movie ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .post('/api/movies')
        .send({
          title,
          releaseYear: 2025,
          runtimeMinutes: 110,
          prerequisiteIds: [ironManId, ironManId],
        })
        .expect(201);

      expect(res.body.prerequisiteIds).toEqual([ironManId]);
      expect(res.body.prerequisites).toHaveLength(1);
    });
  });

  describe('GET /api/movies', () => {
    it('returns a list of movies with HTTP 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/movies')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(8);

      const ironMan = res.body.find((m: { title: string }) => m.title === 'Iron Man');
      expect(ironMan).toBeDefined();
      expect(ironMan).toHaveProperty('prerequisites');
      expect(ironMan).toHaveProperty('prerequisiteIds');
    });
  });

  describe('PATCH /api/movies/:id', () => {
    it('updates scalar fields: title, releaseYear, runtimeMinutes, watched', async () => {
      const updatedTitle = `Updated Subject ${Date.now()}`;
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${testMovieId}`)
        .send({
          title: updatedTitle,
          releaseYear: 2017,
          runtimeMinutes: 135,
          watched: true,
        })
        .expect(200);

      expect(res.body.title).toBe(updatedTitle);
      expect(res.body.releaseYear).toBe(2017);
      expect(res.body.runtimeMinutes).toBe(135);
      expect(res.body.watched).toBe(true);
    });

    it('updates prerequisites to a valid prerequisite', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${testMovieId}`)
        .send({
          prerequisiteIds: [ironManId],
        })
        .expect(200);

      expect(res.body.prerequisiteIds).toContain(ironManId);
      expect(res.body.prerequisites).toHaveLength(1);
    });

    it('leaves prerequisites unchanged when prerequisiteIds is omitted', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${testMovieId}`)
        .send({
          watched: false,
        })
        .expect(200);

      expect(res.body.watched).toBe(false);
      // Prerequisite still retained
      expect(res.body.prerequisiteIds).toContain(ironManId);
    });

    it('clears all prerequisites when prerequisiteIds is an empty array []', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${testMovieId}`)
        .send({
          prerequisiteIds: [],
        })
        .expect(200);

      expect(res.body.prerequisiteIds).toEqual([]);
      expect(res.body.prerequisites).toEqual([]);
    });

    it('returns 404 Not Found for nonexistent movie UUID', async () => {
      await request(app.getHttpServer())
        .patch('/api/movies/a0000000-0000-4000-8000-000000000000')
        .send({ watched: true })
        .expect(404);
    });

    it('rejects direct self-dependency with 409 CIRCULAR_DEPENDENCY', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${ironManId}`)
        .send({
          prerequisiteIds: [ironManId], // direct self-dependency
        })
        .expect(409);

      expect(res.body).toHaveProperty('code', 'CIRCULAR_DEPENDENCY');
    });

    it('ASSESSMENT BENCHMARK: Making Avengers: Endgame a prerequisite of Iron Man returns 409 CIRCULAR_DEPENDENCY', async () => {
      // Iron Man -> (The Avengers) -> (Civil War) -> (Infinity War) -> (Endgame)
      // Making Endgame a prerequisite of Iron Man introduces an indirect cycle!
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${ironManId}`)
        .send({
          prerequisiteIds: [endgameId],
        })
        .expect(409);

      expect(res.body).toHaveProperty('statusCode', 409);
      expect(res.body).toHaveProperty('code', 'CIRCULAR_DEPENDENCY');
      expect(res.body.message).toMatch(/cycle/i);

      // Verify ATOMICITY: Iron Man prerequisites remain intact and unchanged in database
      const ironManDb = await prisma.movie.findUnique({
        where: { id: ironManId },
        include: { prerequisites: true },
      });
      expect(ironManDb?.prerequisites.map((p) => p.prerequisiteId)).not.toContain(endgameId);
    });
  });
});
