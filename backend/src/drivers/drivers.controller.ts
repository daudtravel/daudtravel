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

    return {
      message: 'Driver created successfully',
      data: driver,
    };
  }

  @Get()
  async findAll() {
    const result = await this.driversService.findAll();

    return {
      message: 'Drivers retrieved successfully',
      count: result.count,
      data: result.drivers,
    };
  }

  // ✅ ADD THIS
  @Delete(':id')
  @UseGuards(AuthGuard) // Add if you want to protect this endpoint
  async delete(@Param('id') id: string) {
    await this.driversService.delete(id);

    return {
      message: 'Driver deleted successfully',
    };
  }
}
