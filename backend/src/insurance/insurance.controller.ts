import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { InsuranceService } from './insurance.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  CreateInsuranceSubmissionDto,
  UpdateInsuranceSettingsDto,
} from './dto/insurance.dto';
import { PaymentStatus } from '@prisma/client';

@ApiTags('Insurance')
@Controller('insurance')
export class InsuranceController {
  constructor(private readonly service: InsuranceService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get insurance settings (Public)' })
  async getSettings() {
    return this.service.getSettings();
  }

  @Post('submit')
  @ApiOperation({
    summary: 'Submit insurance request and initiate payment (Public)',
  })
  async createSubmission(@Body() dto: CreateInsuranceSubmissionDto) {
    return this.service.createSubmission(dto);
  }

  @Post('bog/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'BOG payment callback' })
  async handleCallback(
    @Req() req: any,
    @Headers('callback-signature') signature: string,
  ) {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    return this.service.handleBOGCallback(rawBody, signature);
  }

  @Get('status/:externalOrderId')
  @ApiOperation({ summary: 'Get submission status by order ID (Public)' })
  async getSubmissionStatus(@Param('externalOrderId') externalOrderId: string) {
    return this.service.getSubmissionStatus(externalOrderId);
  }

  @Get('view-passport/:submissionId/:personId')
  @ApiOperation({ summary: 'View passport photo with secure token (Public)' })
  async viewPassportPhoto(
    @Param('submissionId') submissionId: string,
    @Param('personId') personId: string,
    @Query('token') token: string,
    @Res() res: Response,
  ) {
    return this.service.viewSecurePassportPhoto(
      submissionId,
      personId,
      token,
      res,
    );
  }

  @Put('settings')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update insurance settings (Admin)' })
  async updateSettings(@Body() dto: UpdateInsuranceSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('submissions')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all insurance submissions (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllSubmissions(
    @Query('status') status?: PaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.service.getAllSubmissions(status, page, limit);
  }

  @Get('submissions/:submissionId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get submission details by ID (Admin)' })
  async getSubmissionById(@Param('submissionId') submissionId: string) {
    return this.service.getSubmissionById(submissionId);
  }

  @Delete('submissions/:submissionId')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete insurance submission (Admin)' })
  async deleteSubmission(@Param('submissionId') submissionId: string) {
    return this.service.deleteSubmission(submissionId);
  }
}
