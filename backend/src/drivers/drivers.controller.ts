import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DriversService } from './drivers.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CreateDriverDto } from './dto/create-driver.dto';
import { CreateDriverReviewDto } from './dto/create-driver-review.dto';

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
