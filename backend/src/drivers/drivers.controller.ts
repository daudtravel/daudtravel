import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { DriversService } from './drivers.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';
import { UpdateDriverDto, RemoveCarPhotoDto } from './dto/update-driver.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post('add_driver')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() body: CreateDriverDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const driver = await this.driversService.create(body, file);
    return { message: 'Driver created successfully', data: driver };
  }

  @Get()
  async findAll() {
    const result = await this.driversService.findAll();
    return { message: 'Drivers retrieved successfully', count: result.count, data: result.drivers };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const driver = await this.driversService.findOne(id);
    return { message: 'Driver retrieved successfully', data: driver };
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDriverDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const driver = await this.driversService.update(id, body, file);
    return { message: 'Driver updated successfully', data: driver };
  }

  @Post(':id/car-photos')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('photos', 10))
  async addCarPhotos(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const carPhotos = await this.driversService.addCarPhotos(id, files);
    return { message: 'Car photos uploaded successfully', data: carPhotos };
  }

  @Delete(':id/car-photos')
  @UseGuards(AuthGuard)
  async removeCarPhoto(
    @Param('id') id: string,
    @Body() dto: RemoveCarPhotoDto,
  ) {
    const carPhotos = await this.driversService.removeCarPhoto(id, dto.url);
    return { message: 'Car photo removed successfully', data: carPhotos };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async delete(@Param('id') id: string) {
    await this.driversService.delete(id);
    return { message: 'Driver deleted successfully' };
  }

  @Post(':id/reviews')
  async createReview(@Param('id') id: string, @Body() dto: CreateDriverReviewDto) {
    const review = await this.driversService.createReview(id, dto);
    return { message: 'Review submitted successfully', data: review };
  }

  @Get(':id/reviews')
  async getReviews(@Param('id') id: string) {
    const result = await this.driversService.getReviews(id);
    return { message: 'Reviews retrieved successfully', data: result };
  }

  @Delete('reviews/:reviewId')
  @UseGuards(AuthGuard)
  async deleteReview(@Param('reviewId') reviewId: string) {
    await this.driversService.deleteReview(reviewId);
    return { message: 'Review deleted successfully' };
  }
}
