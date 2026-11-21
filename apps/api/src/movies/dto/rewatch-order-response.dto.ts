import { ApiProperty } from '@nestjs/swagger';

export class RewatchTargetDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'Avengers: Doomsday' })
  title!: string;

  @ApiProperty({ example: 2026 })
  releaseYear!: number;

  @ApiProperty({ example: 180 })
  runtimeMinutes!: number;
}

export class RewatchMovieItemDto {
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

export class RewatchOrderResponseDto {
  @ApiProperty({ type: RewatchTargetDto })
  target!: RewatchTargetDto;

  @ApiProperty({ type: [RewatchMovieItemDto] })
  movies!: RewatchMovieItemDto[];

  @ApiProperty({ example: 4, description: 'Number of prerequisite movies marked as watched' })
  watchedCount!: number;

  @ApiProperty({ example: 7, description: 'Total number of transitive prerequisite movies' })
  totalCount!: number;

  @ApiProperty({ example: 477, description: 'Total runtime in minutes of unwatched prerequisite movies' })
  unwatchedRuntimeMinutes!: number;
}

