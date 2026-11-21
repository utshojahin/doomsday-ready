# Prompt 02 — Database Schema and Seed Data

Read all six context files and the master index. Inspect the existing implementation.

## Goal
Create the relational database model and reliable local seed data only.

## Tasks
1. Add Prisma to the API and configure PostgreSQL using `DATABASE_URL`.
2. Implement Movie, MoviePrerequisite, Cinema and CinemaBundle models exactly as described in `context/04_DATA_MODEL.md`.
3. Use explicit named self-relations for MoviePrerequisite.
4. Add uniqueness and indexes. Add database check constraints through SQL migration where Prisma schema cannot express the required range/self-reference constraints.
5. Create and commit the initial migration.
6. Add seed data for all eight challenge movies and their prerequisite relationships.
7. Add at least two cinemas with different bundle-size sets.
8. Make seed repeatable/idempotent where practical; document reset behavior.
9. Add a small Prisma service and database connection lifecycle handling.

## Tests in this chunk
- Prisma schema validates.
- Migration applies to a clean database.
- Seed runs successfully twice without duplicate rows.
- Unique movie title and cinema name constraints work.
- Duplicate bundle size per cinema is rejected.
- Foreign keys reject nonexistent references.
- Range and self-reference constraints are verified where database constraints are added.

## Acceptance gate
A clean local database can be created, migrated and seeded using documented commands. No API business endpoints are required yet.

Report exact migration/seed/test commands and STOP.
