import { ApiProperty } from '@nestjs/swagger';

export class CinemaResponseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'Stark IMAX Theatre' })
  name!: string;

  @ApiProperty({ example: [2, 5], type: [Number] })
  bundleSizes!: number[];

  @ApiProperty({ example: '2026-11-21T10:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-11-21T10:00:00.000Z' })
  updatedAt!: Date;
}
