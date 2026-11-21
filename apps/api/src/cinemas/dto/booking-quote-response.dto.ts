import { ApiProperty } from '@nestjs/swagger';

export class BundleAllocationDto {
  @ApiProperty({ example: 5, description: 'Seats in this bundle denomination' })
  size!: number;

  @ApiProperty({ example: 1, description: 'Count of this bundle denomination to purchase' })
  count!: number;
}

export class BookingQuoteResponseDto {
  @ApiProperty({ example: true, description: 'Whether an exact sum can be achieved' })
  possible!: boolean;

  @ApiProperty({ example: 11, description: 'Requested attendee group size' })
  groupSize!: number;

  @ApiProperty({
    example: 4,
    nullable: true,
    description: 'Minimum total bundle packages required (null if impossible)',
  })
  totalBundles!: number | null;

  @ApiProperty({ type: [BundleAllocationDto], description: 'List of bundle sizes and quantities' })
  bundles!: BundleAllocationDto[];
}

