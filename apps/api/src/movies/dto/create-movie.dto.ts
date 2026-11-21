import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateMovieDto {
  @ApiProperty({ description: 'Unique title of the movie', example: 'Black Panther' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  title!: string;

  @ApiProperty({ description: 'Release year of the movie (1888-2100)', example: 2018 })
  @IsInt({ message: 'releaseYear must be an integer' })
  @Min(1888, { message: 'releaseYear must not be earlier than 1888' })
  @Max(2100, { message: 'releaseYear must not be later than 2100' })
  releaseYear!: number;

  @ApiProperty({ description: 'Runtime in minutes (1-300)', example: 134 })
  @IsInt({ message: 'runtimeMinutes must be an integer' })
  @Min(1, { message: 'runtimeMinutes must be at least 1' })
  @Max(300, { message: 'runtimeMinutes must not exceed 300' })
  runtimeMinutes!: number;

  @ApiPropertyOptional({ description: 'Whether the movie has been watched', default: false })
  @IsOptional()
  @IsBoolean()
  watched?: boolean = false;

  @ApiPropertyOptional({
    description: 'Array of prerequisite movie IDs that must be watched first',
    type: [String],
    example: [],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisiteIds?: string[] = [];
}

