import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMovieDto {
  @ApiPropertyOptional({ description: 'Updated title of the movie', example: 'Captain America: Civil War' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title?: string;

  @ApiPropertyOptional({ description: 'Updated release year (1888-2100)', example: 2016 })
  @IsOptional()
  @IsInt({ message: 'releaseYear must be an integer' })
  @Min(1888, { message: 'releaseYear must not be earlier than 1888' })
  @Max(2100, { message: 'releaseYear must not be later than 2100' })
  releaseYear?: number;

  @ApiPropertyOptional({ description: 'Updated runtime in minutes (1-300)', example: 147 })
  @IsOptional()
  @IsInt({ message: 'runtimeMinutes must be an integer' })
  @Min(1, { message: 'runtimeMinutes must be at least 1' })
  @Max(300, { message: 'runtimeMinutes must not exceed 300' })
  runtimeMinutes?: number;

  @ApiPropertyOptional({ description: 'Mark as watched or unwatched' })
  @IsOptional()
  @IsBoolean()
  watched?: boolean;

  @ApiPropertyOptional({
    description: 'Updated array of prerequisite movie IDs. Pass [] to clear all prerequisites; omit to leave unchanged.',
    type: [String],
    example: ['3fa85f64-5717-4562-b3fc-2c963f66afa6'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[];
}

