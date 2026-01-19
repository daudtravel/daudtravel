import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ToursService } from './tours.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  CreateTourDto,
  GetToursQueryDto,
  UpdateTourDto,
} from './dto/tours.dto';

@ApiTags('Tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new tour' })
  @ApiResponse({ status: 201, description: 'Tour created successfully' })
  async create(@Body() dto: CreateTourDto) {
    const tour = await this.toursService.create(dto);
    return {
      message: 'Tour created successfully',
      data: tour,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all public tours' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['GROUP', 'INDIVIDUAL'],
    description: 'Tour type',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Locale for filtering',
  })
  @ApiQuery({
    name: 'startLocation',
    required: false,
    type: String,
    description: 'Filter by start location',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, description, or location',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({ status: 200, description: 'Tours retrieved successfully' })
  async findAllPublic(@Query() query: GetToursQueryDto) {
    const result = await this.toursService.findAll(query, true);
    return {
      message:
        result.data.length > 0
          ? 'Tours retrieved successfully'
          : 'No tours found',
      ...result,
    };
  }

  @Get('all')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all tours (admin)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['GROUP', 'INDIVIDUAL'],
    description: 'Tour type',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Locale for filtering',
  })
  @ApiQuery({
    name: 'startLocation',
    required: false,
    type: String,
    description: 'Filter by start location',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in name, description, or location',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({ status: 200, description: 'Tours retrieved successfully' })
  async findAll(@Query() query: GetToursQueryDto) {
    const result = await this.toursService.findAll(query, false);
    return {
      message:
        result.data.length > 0
          ? 'Tours retrieved successfully'
          : 'No tours found',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tour by ID' })
  @ApiQuery({
    name: 'locale',
    required: false,
    type: String,
    description: 'Get specific locale only',
  })
  @ApiResponse({ status: 200, description: 'Tour retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async findOne(@Param('id') id: string, @Query('locale') locale?: string) {
    const tour = await this.toursService.findOne(id, locale);
    return {
      message: 'Tour retrieved successfully',
      data: tour,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update tour' })
  @ApiResponse({ status: 200, description: 'Tour updated successfully' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateTourDto) {
    const tour = await this.toursService.update(id, dto);
    return {
      message: 'Tour updated successfully',
      data: tour,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete tour' })
  @ApiResponse({ status: 204, description: 'Tour deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tour not found' })
  async remove(@Param('id') id: string) {
    await this.toursService.remove(id);
  }
}
