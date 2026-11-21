import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting idempotent seed...');

  // 1. Seed Challenge Movies
  const movieData = [
    {
      title: 'Iron Man',
      releaseYear: 2008,
      runtimeMinutes: 126,
      watched: true,
      prerequisites: [],
    },
    {
      title: 'Captain America: The First Avenger',
      releaseYear: 2011,
      runtimeMinutes: 124,
      watched: true,
      prerequisites: [],
    },
    {
      title: 'The Avengers',
      releaseYear: 2012,
      runtimeMinutes: 143,
      watched: true,
      prerequisites: ['Iron Man', 'Captain America: The First Avenger'],
    },
    {
      title: 'Captain America: Civil War',
      releaseYear: 2016,
      runtimeMinutes: 147,
      watched: false,
      prerequisites: ['The Avengers'],
    },
    {
      title: 'Thor: Ragnarok',
      releaseYear: 2017,
      runtimeMinutes: 130,
      watched: true,
      prerequisites: [],
    },
    {
      title: 'Avengers: Infinity War',
      releaseYear: 2018,
      runtimeMinutes: 149,
      watched: false,
      prerequisites: ['Captain America: Civil War', 'Thor: Ragnarok'],
    },
    {
      title: 'Avengers: Endgame',
      releaseYear: 2019,
      runtimeMinutes: 181,
      watched: false,
      prerequisites: ['Avengers: Infinity War'],
    },
    {
      title: 'Avengers: Doomsday',
      releaseYear: 2026,
      runtimeMinutes: 180,
      watched: false,
      prerequisites: ['Avengers: Endgame'],
    },
  ];

  const createdMovieMap = new Map<string, string>();

  for (const m of movieData) {
    const movie = await prisma.movie.upsert({
      where: { title: m.title },
      update: {
        releaseYear: m.releaseYear,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
      },
      create: {
        title: m.title,
        releaseYear: m.releaseYear,
        runtimeMinutes: m.runtimeMinutes,
        watched: m.watched,
      },
    });
    createdMovieMap.set(m.title, movie.id);
  }

  // 2. Connect Prerequisite Relationships
  for (const m of movieData) {
    const movieId = createdMovieMap.get(m.title)!;
    for (const prereqTitle of m.prerequisites) {
      const prereqId = createdMovieMap.get(prereqTitle);
      if (prereqId) {
        await prisma.moviePrerequisite.upsert({
          where: {
            movieId_prerequisiteId: {
              movieId,
              prerequisiteId: prereqId,
            },
          },
          update: {},
          create: {
            movieId,
            prerequisiteId: prereqId,
          },
        });
      }
    }
  }

  // 3. Seed Challenge Cinemas
  const cinemaData = [
    {
      name: 'Stark IMAX Theatre',
      bundleSizes: [2, 5],
    },
    {
      name: 'Odin Odeon Screen',
      bundleSizes: [6, 9, 20],
    },
    {
      name: 'Sanctum Sanctorum Cinema',
      bundleSizes: [4, 6],
    },
  ];

  for (const c of cinemaData) {
    const cinema = await prisma.cinema.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name },
    });

    for (const size of c.bundleSizes) {
      await prisma.cinemaBundle.upsert({
        where: {
          cinemaId_size: {
            cinemaId: cinema.id,
            size,
          },
        },
        update: {},
        create: {
          cinemaId: cinema.id,
          size,
        },
      });
    }
  }

  console.log('✅ Idempotent seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

