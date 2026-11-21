import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MoviesService } from './movies.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieResponseDto } from './dto/movie-response.dto';

@ApiTags('Movies')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new movie with optional prerequisites' })
  @ApiResponse({
    status: 201,
    description: 'Movie created successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input or nonexistent prerequisite' })
  @ApiResponse({ status: 409, description: 'Movie title conflict' })
  async create(@Body() createMovieDto: CreateMovieDto): Promise<MovieResponseDto> {
    return this.moviesService.create(createMovieDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all movies with their prerequisite details' })
  @ApiResponse({
    status: 200,
    description: 'List of all movies in release order',
    type: [MovieResponseDto],
  })
  async findAll(): Promise<MovieResponseDto[]> {
    return this.moviesService.findAll();
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update movie details, watched status, and/or prerequisite relationships',
  })
  @ApiParam({ name: 'id', description: 'Movie UUID' })
  @ApiResponse({
    status: 200,
    description: 'Movie updated successfully',
    type: MovieResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or nonexistent prerequisite' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  @ApiResponse({
    status: 409,
    description: 'Circular dependency detected or title conflict',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateMovieDto: UpdateMovieDto,
  ): Promise<MovieResponseDto> {
    return this.moviesService.update(id, updateMovieDto);
  }
}
