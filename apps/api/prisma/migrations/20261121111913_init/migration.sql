-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "runtimeMinutes" INTEGER NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MoviePrerequisite" (
    "movieId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "MoviePrerequisite_pkey" PRIMARY KEY ("movieId","prerequisiteId")
);

-- CreateTable
CREATE TABLE "Cinema" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cinema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CinemaBundle" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "CinemaBundle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Movie_title_key" ON "Movie"("title");

-- CreateIndex
CREATE INDEX "Movie_title_idx" ON "Movie"("title");

-- CreateIndex
CREATE INDEX "MoviePrerequisite_movieId_idx" ON "MoviePrerequisite"("movieId");

-- CreateIndex
CREATE INDEX "MoviePrerequisite_prerequisiteId_idx" ON "MoviePrerequisite"("prerequisiteId");

-- CreateIndex
CREATE UNIQUE INDEX "Cinema_name_key" ON "Cinema"("name");

-- CreateIndex
CREATE INDEX "Cinema_name_idx" ON "Cinema"("name");

-- CreateIndex
CREATE INDEX "CinemaBundle_cinemaId_idx" ON "CinemaBundle"("cinemaId");

-- CreateIndex
CREATE UNIQUE INDEX "CinemaBundle_cinemaId_size_key" ON "CinemaBundle"("cinemaId", "size");

-- AddForeignKey
ALTER TABLE "MoviePrerequisite" ADD CONSTRAINT "MoviePrerequisite_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MoviePrerequisite" ADD CONSTRAINT "MoviePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CinemaBundle" ADD CONSTRAINT "CinemaBundle_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "Cinema"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Custom Check Constraints as specified in context/04_DATA_MODEL.md
ALTER TABLE "Movie" ADD CONSTRAINT "chk_movie_runtime_range" CHECK ("runtimeMinutes" >= 1 AND "runtimeMinutes" <= 300);
ALTER TABLE "MoviePrerequisite" ADD CONSTRAINT "chk_no_self_prerequisite" CHECK ("movieId" != "prerequisiteId");
ALTER TABLE "CinemaBundle" ADD CONSTRAINT "chk_bundle_size_range" CHECK ("size" >= 1 AND "size" <= 500);
