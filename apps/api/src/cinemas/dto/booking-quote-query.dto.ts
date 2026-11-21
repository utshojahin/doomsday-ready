import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class BookingQuoteQueryDto {
  @ApiProperty({
    description: 'Group size to seat exactly (integer from 1 to 10,000)',
    example: 11,
    minimum: 1,
    maximum: 10000,
  })
  @Type(() => Number)
  @IsInt({ message: 'groupSize must be an integer' })
  @Min(1, { message: 'groupSize must be at least 1' })
  @Max(10000, { message: 'groupSize cannot exceed 10,000' })
  groupSize!: number;
}
