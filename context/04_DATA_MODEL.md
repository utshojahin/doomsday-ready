# 04 — Data Model

Use PostgreSQL and Prisma. Keep the relational model normalized.

## Entities

### Movie
- `id`: UUID primary key
- `title`: unique, non-null string
- `releaseYear`: integer
- `runtimeMinutes`: integer (1–300)
- `watched`: boolean, default false
- `createdAt`, `updatedAt`

### MoviePrerequisite
Join table representing directed prerequisite relationships:
- `movieId`: the movie that has prerequisites (dependent/target)
- `prerequisiteId`: movie that must be watched first
- Composite primary key `(movieId, prerequisiteId)`
- Foreign keys to Movie
- Unique pair enforced by composite key
- Check/validation prevents `movieId = prerequisiteId`
- Index both foreign-key columns as appropriate

Meaning: an edge is `movieId -> prerequisiteId` if traversing from a movie to its prerequisites. Document the chosen direction and keep it consistent in algorithms.

### Cinema
- `id`: UUID primary key
- `name`: unique, non-null string
- `createdAt`, `updatedAt`

### CinemaBundle
- `id`: UUID primary key (or composite key)
- `cinemaId`: foreign key
- `size`: integer 1–500
- Unique `(cinemaId, size)`
- Index `cinemaId`

## Relationship sketch

```text
Movie 1 ---- * MoviePrerequisite * ---- 1 Movie
Cinema 1 ---- * CinemaBundle
```

MoviePrerequisite is a self-referential many-to-many join table with explicit relation names in Prisma.

## Data integrity

- Enforce uniqueness in the database as well as checking in services.
- Enforce bundle-size uniqueness per cinema in the database.
- Validate numeric ranges at the API boundary and, where practical, with database constraints/migrations.
- Use cascade delete only if the behavior is intentional and documented. For the assessment, deleting movies/cinemas is not required, so avoid adding delete endpoints.
- Do not store computed rewatch plans or booking quotes; calculate them from current data.
- Use Prisma migrations committed to Git.
- Seed should be idempotent or clearly explain how to reset before reseeding.

## Seed data

Seed the eight challenge movies and prerequisite links. Use stable unique titles and plausible release-year/runtime sample values. Create at least two cinemas with different bundle-size sets to demonstrate possible and impossible booking cases. Mark a subset of movies watched to demonstrate progress.
