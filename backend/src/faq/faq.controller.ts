// src/faq/faq.controller.ts
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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { FaqService } from './faq.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('FAQ')
@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  @Post('create_faq')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new FAQ (Admin only)' })
  @ApiResponse({ status: 201, description: 'FAQ created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createFaqDto: CreateFaqDto) {
    const faq = await this.faqService.create(createFaqDto);

    return {
      message: 'FAQ created successfully',
      data: faq,
    };
  }

  @Get('faq')
  @ApiOperation({ summary: 'Get all FAQs' })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiResponse({ status: 200, description: 'FAQs retrieved successfully' })
  async findAll(@Query('locale') locale?: string) {
    const faqs = await this.faqService.findAll(locale);

    return {
      message: 'FAQs retrieved successfully',
      data: faqs,
    };
  }

  @Get('faq/:id')
  @ApiOperation({ summary: 'Get FAQ by ID' })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiResponse({ status: 200, description: 'FAQ retrieved successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  async findOne(@Param('id') id: string, @Query('locale') locale?: string) {
    const faq = await this.faqService.findOne(id, locale);

    return {
      message: 'FAQ retrieved successfully',
      data: faq,
    };
  }

  @Put('update_faq/:id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update FAQ (Admin only)' })
  @ApiResponse({ status: 200, description: 'FAQ updated successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async update(@Param('id') id: string, @Body() updateFaqDto: UpdateFaqDto) {
    const faq = await this.faqService.update(id, updateFaqDto);

    return {
      message: 'FAQ updated successfully',
      data: faq,
    };
  }

  @Delete('delete_faq/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete FAQ (Admin only)' })
  @ApiResponse({ status: 200, description: 'FAQ deleted successfully' })
  @ApiResponse({ status: 404, description: 'FAQ not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    const result = await this.faqService.remove(id);

    return {
      message: 'FAQ deleted successfully',
      data: result,
    };
  }
}
