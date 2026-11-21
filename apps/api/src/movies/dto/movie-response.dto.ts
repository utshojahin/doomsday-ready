import { ApiProperty } from '@nestjs/swagger';

export class PrerequisiteMovieDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'Iron Man' })
  title!: string;

  @ApiProperty({ example: 2008 })
  releaseYear!: number;

  @ApiProperty({ example: 126 })
  runtimeMinutes!: number;

  @ApiProperty({ example: true })
  watched!: boolean;
}

export class MovieResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'The Avengers' })
  title!: string;

  @ApiProperty({ example: 2012 })
  releaseYear!: number;

  @ApiProperty({ example: 143 })
  runtimeMinutes!: number;

  @ApiProperty({ example: false })
  watched!: boolean;

  @ApiProperty({ type: [String], example: [] })
  prerequisiteIds!: string[];

  @ApiProperty({ type: [PrerequisiteMovieDto] })
  prerequisites!: PrerequisiteMovieDto[];

  @ApiProperty({ example: '2026-11-21T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-11-21T10:00:00.000Z' })
  updatedAt!: Date;
}

