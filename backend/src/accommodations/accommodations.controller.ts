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
import { AccommodationsService } from './accommodations.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import {
  CreateAccommodationDto,
  GetAccommodationsQueryDto,
  UpdateAccommodationDto,
} from './dto/accommodations.dto';

@ApiTags('Accommodations')
@Controller('accommodations')
export class AccommodationsController {
  constructor(
    private readonly accommodationsService: AccommodationsService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new accommodation' })
  @ApiResponse({ status: 201, description: 'Accommodation created successfully' })
  async create(@Body() dto: CreateAccommodationDto) {
    const accommodation = await this.accommodationsService.create(dto);
    return {
      message: 'Accommodation created successfully',
      data: accommodation,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all public accommodations' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['HOTEL', 'APARTMENT'] })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Accommodations retrieved successfully' })
  async findAllPublic(@Query() query: GetAccommodationsQueryDto) {
    const result = await this.accommodationsService.findAll(query, true);
    return {
      message:
        result.data.length > 0
          ? 'Accommodations retrieved successfully'
          : 'No accommodations found',
      ...result,
    };
  }

  @Get('all')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all accommodations (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['HOTEL', 'APARTMENT'] })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiQuery({ name: 'city', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({ status: 200, description: 'Accommodations retrieved successfully' })
  async findAll(@Query() query: GetAccommodationsQueryDto) {
    const result = await this.accommodationsService.findAll(query, false);
    return {
      message:
        result.data.length > 0
          ? 'Accommodations retrieved successfully'
          : 'No accommodations found',
      ...result,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get accommodation by ID' })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Accommodation retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Accommodation not found' })
  async findOne(@Param('id') id: string, @Query('locale') locale?: string) {
    const accommodation = await this.accommodationsService.findOne(id, locale);
    return {
      message: 'Accommodation retrieved successfully',
      data: accommodation,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update accommodation' })
  @ApiResponse({ status: 200, description: 'Accommodation updated successfully' })
  @ApiResponse({ status: 404, description: 'Accommodation not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateAccommodationDto) {
    const accommodation = await this.accommodationsService.update(id, dto);
    return {
      message: 'Accommodation updated successfully',
      data: accommodation,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete accommodation' })
  @ApiResponse({ status: 204, description: 'Accommodation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Accommodation not found' })
  async remove(@Param('id') id: string) {
    await this.accommodationsService.remove(id);
  }
}
