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
  let doomsdayId: string;
  let civilWarId: string;
  let ragnarokId: string;
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
    const doomsday = await prisma.movie.findFirst({ where: { title: 'Avengers: Doomsday' } });
    const civilWar = await prisma.movie.findFirst({ where: { title: 'Captain America: Civil War' } });
    const ragnarok = await prisma.movie.findFirst({ where: { title: 'Thor: Ragnarok' } });

    ironManId = ironMan?.id || '';
    endgameId = endgame?.id || '';
    doomsdayId = doomsday?.id || '';
    civilWarId = civilWar?.id || '';
    ragnarokId = ragnarok?.id || '';

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
          prerequisiteIds: ['a0000000-0000-4000-8000-000000000000'],
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
          prerequisiteIds: [ironManId],
        })
        .expect(409);

      expect(res.body).toHaveProperty('code', 'CIRCULAR_DEPENDENCY');
    });

    it('ASSESSMENT BENCHMARK: Making Avengers: Endgame a prerequisite of Iron Man returns 409 CIRCULAR_DEPENDENCY', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/movies/${ironManId}`)
        .send({
          prerequisiteIds: [endgameId],
        })
        .expect(409);

      expect(res.body).toHaveProperty('statusCode', 409);
      expect(res.body).toHaveProperty('code', 'CIRCULAR_DEPENDENCY');
      expect(res.body.message).toMatch(/cycle/i);

      // Verify atomicity
      const ironManDb = await prisma.movie.findUnique({
        where: { id: ironManId },
        include: { prerequisites: true },
      });
      expect(ironManDb?.prerequisites.map((p) => p.prerequisiteId)).not.toContain(endgameId);
    });
  });

  describe('GET /api/movies/:id/rewatch-order', () => {
    it('ASSESSMENT TEST CASE: Thor: Ragnarok returns empty list and 0 metrics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/movies/${ragnarokId}/rewatch-order`)
        .expect(200);

      expect(res.body.target.title).toBe('Thor: Ragnarok');
      expect(res.body.movies).toEqual([]);
      expect(res.body.totalCount).toBe(0);
      expect(res.body.watchedCount).toBe(0);
      expect(res.body.unwatchedRuntimeMinutes).toBe(0);
    });

    it('ASSESSMENT TEST CASE: Captain America: Civil War returns Iron Man & First Avenger before The Avengers', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/movies/${civilWarId}/rewatch-order`)
        .expect(200);

      expect(res.body.target.title).toBe('Captain America: Civil War');
      expect(res.body.totalCount).toBe(3);

      const titles = res.body.movies.map((m: { title: string }) => m.title);
      expect(titles).toContain('Iron Man');
      expect(titles).toContain('Captain America: The First Avenger');
      expect(titles).toContain('The Avengers');
      expect(titles).not.toContain('Captain America: Civil War'); // Target excluded

      const avengersIdx = titles.indexOf('The Avengers');
      const ironManIdx = titles.indexOf('Iron Man');
      const firstAvengerIdx = titles.indexOf('Captain America: The First Avenger');
      expect(ironManIdx).toBeLessThan(avengersIdx);
      expect(firstAvengerIdx).toBeLessThan(avengersIdx);
    });

    it('ASSESSMENT TEST CASE: Avengers: Doomsday includes all 7 other movies in valid topological order', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/movies/${doomsdayId}/rewatch-order`)
        .expect(200);

      expect(res.body.target.title).toBe('Avengers: Doomsday');
      expect(res.body.totalCount).toBe(7);
      expect(res.body.movies.map((m: { id: string }) => m.id)).not.toContain(doomsdayId);

      const indices = new Map<string, number>(
        res.body.movies.map((m: { id: string }, i: number) => [m.id, i]),
      );
      expect(indices.get(ironManId)!).toBeLessThan(indices.get(civilWarId)!);
      expect(indices.get(civilWarId)!).toBeLessThan(indices.get(endgameId)!);

      expect(typeof res.body.watchedCount).toBe('number');
      expect(typeof res.body.unwatchedRuntimeMinutes).toBe('number');
    });

    it('returns 404 Not Found for nonexistent target movie UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/movies/a0000000-0000-4000-8000-000000000000/rewatch-order')
        .expect(404);
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('returns 404 Not Found when deleting a non-existent movie', async () => {
      await request(app.getHttpServer())
        .delete('/api/movies/a0000000-0000-4000-8000-000000000000')
        .expect(404);
    });

    it('deletes an existing movie and returns 204 No Content', async () => {
      // Create a temporary movie to delete
      const tempMovie = await prisma.movie.create({
        data: {
          title: `Delete Candidate ${Date.now()}`,
          releaseYear: 2020,
          runtimeMinutes: 100,
          watched: false,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/movies/${tempMovie.id}`)
        .expect(204);

      // Verify it no longer exists in database
      const found = await prisma.movie.findUnique({ where: { id: tempMovie.id } });
      expect(found).toBeNull();
    });
  });
});
