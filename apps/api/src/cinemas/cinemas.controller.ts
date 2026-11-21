import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CinemasService } from './cinemas.service';
import { CreateCinemaDto } from './dto/create-cinema.dto';
import { CinemaResponseDto } from './dto/cinema-response.dto';
import { BookingQuoteQueryDto } from './dto/booking-quote-query.dto';
import { BookingQuoteResponseDto } from './dto/booking-quote-response.dto';

@ApiTags('Cinemas')
@Controller('cinemas')
export class CinemasController {
  constructor(private readonly cinemasService: CinemasService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cinema venue with distinct bundle sizes' })
  @ApiResponse({
    status: 201,
    description: 'Cinema created successfully',
    type: CinemaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid bundle sizes or format' })
  @ApiResponse({ status: 409, description: 'Cinema name conflict' })
  async create(@Body() createCinemaDto: CreateCinemaDto): Promise<CinemaResponseDto> {
    return this.cinemasService.create(createCinemaDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all cinemas with their available bundle sizes' })
  @ApiResponse({
    status: 200,
    description: 'List of all cinemas',
    type: [CinemaResponseDto],
  })
  async findAll(): Promise<CinemaResponseDto[]> {
    return this.cinemasService.findAll();
  }

  @Get(':id/booking')
  @ApiOperation({
    summary: 'Calculate minimum bundle ticket quote for an exact group size using dynamic programming',
  })
  @ApiParam({ name: 'id', description: 'Cinema UUID' })
  @ApiResponse({
    status: 200,
    description: 'Optimal ticket bundle combination quote or impossible state',
    type: BookingQuoteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid group size query parameter' })
  @ApiResponse({ status: 404, description: 'Cinema not found' })
  async getBookingQuote(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: BookingQuoteQueryDto,
  ): Promise<BookingQuoteResponseDto> {
    return this.cinemasService.getBookingQuote(id, query.groupSize);
  }
}
