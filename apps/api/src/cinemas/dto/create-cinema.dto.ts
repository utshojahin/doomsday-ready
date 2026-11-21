import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCinemaDto {
  @ApiProperty({ description: 'Unique name of the cinema', example: 'Stark IMAX Theatre' })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  name!: string;

  @ApiProperty({
    description: 'Distinct bundle sizes sold by the cinema (1 to 10 integers, each 1 to 500 seats)',
    example: [2, 5],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'bundleSizes must contain at least 1 bundle size' })
  @ArrayMaxSize(10, { message: 'bundleSizes cannot contain more than 10 bundle sizes' })
  @IsInt({ each: true, message: 'Every bundle size must be an integer' })
  @Min(1, { each: true, message: 'Bundle size must be at least 1' })
  @Max(500, { each: true, message: 'Bundle size must not exceed 500' })
  bundleSizes!: number[];
}

