import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  CurrentUser,
  LOOKUP_CONSUMERS,
  RequireAnyPermission,
  RequirePermission,
} from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { DriversService } from './drivers.service';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import {
  CreateDriverDto,
  DriverMonthlyQueryDto,
  ListDriverOptionsQueryDto,
  ListDriversQueryDto,
  RemoveCarPhotoDto,
  UpdateDriverDto,
} from './dto/drivers.dto';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  // --- back office (declared before ":id" so "admin" is not read as an id) ---

  @Get('admin')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  @ApiOperation({ summary: 'List drivers (filters + pagination)' })
  findAllAdmin(
    @CurrentUser() user: AuthUser,
    @Query() query: ListDriversQueryDto,
  ) {
    return this.driversService.findAllAdmin(user, query);
  }

  @Get('admin/options')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  // Also for whoever assigns a driver to a website transfer order
  @RequireAnyPermission(...LOOKUP_CONSUMERS, {
    module: PermissionModule.ONLINE_ORDERS,
    action: 'edit',
  })
  @ApiOperation({ summary: 'Active drivers for pickers' })
  options(
    @CurrentUser() user: AuthUser,
    @Query() query: ListDriverOptionsQueryDto,
  ) {
    return this.driversService.options(user, query.search);
  }

  @Get('admin/filter-options')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  @ApiOperation({ summary: 'Distinct languages for the filter bar' })
  filterOptions(@CurrentUser() user: AuthUser) {
    return this.driversService.filterOptions(user);
  }

  @Get('admin/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  async findOneAdmin(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.driversService.findOneAdmin(user, id) };
  }

  @Get('admin/:id/monthly')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  @ApiOperation({ summary: 'Transfer jobs per month' })
  async monthly(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Query() query: DriverMonthlyQueryDto,
  ) {
    return { data: await this.driversService.monthly(user, id, query.year) };
  }

  @Get('admin/:id/reviews')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'view')
  async adminReviews(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return { data: await this.driversService.adminReviews(user, id) };
  }

  // ------------------------------- public ----------------------------------

  @Get()
  @ApiOperation({ summary: 'Drivers shown on the website' })
  async findAll() {
    const result = await this.driversService.findAllPublic();
    return {
      message: 'Drivers retrieved successfully',
      count: result.count,
      data: result.drivers,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const driver = await this.driversService.findOnePublic(id);
    return { message: 'Driver retrieved successfully', data: driver };
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    const result = await this.driversService.getReviews(id);
    return { message: 'Reviews retrieved successfully', data: result };
  }

  @Post(':id/reviews')
  async createReview(
    @Param('id') id: string,
    @Body() dto: CreateDriverReviewDto,
  ) {
    const review = await this.driversService.createReview(id, dto);
    return { message: 'Review submitted successfully', data: review };
  }

  // ------------------------------- writes ----------------------------------

  @Post('add_driver')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'create')
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateDriverDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const driver = await this.driversService.create(user, body, file);
    return { message: 'DRIVER_CREATED', data: driver };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'edit')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: UpdateDriverDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const driver = await this.driversService.update(user, id, body, file);
    return { message: 'DRIVER_UPDATED', data: driver };
  }

  @Post(':id/car-photos')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'edit')
  @UseInterceptors(FilesInterceptor('photos', 10))
  async addCarPhotos(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const carPhotos = await this.driversService.addCarPhotos(user, id, files);
    return { message: 'CAR_PHOTOS_UPLOADED', data: carPhotos };
  }

  @Delete('reviews/:reviewId')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'edit')
  @HttpCode(HttpStatus.OK)
  async deleteReview(
    @CurrentUser() user: AuthUser,
    @Param('reviewId') reviewId: string,
  ) {
    await this.driversService.deleteReview(user, reviewId);
    return { message: 'REVIEW_DELETED' };
  }

  @Delete(':id/car-photos')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'edit')
  async removeCarPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RemoveCarPhotoDto,
  ) {
    const carPhotos = await this.driversService.removeCarPhoto(
      user,
      id,
      dto.url,
    );
    return { message: 'CAR_PHOTO_REMOVED', data: carPhotos };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @RequirePermission(PermissionModule.DRIVERS, 'delete')
  async delete(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.driversService.remove(user, id);
    return { message: 'DRIVER_DELETED' };
  }
}
