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
import { RequirePermission } from '@/access/access.decorators';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import {
  CreateInsuranceSubmissionDto,
  UpdateInsuranceSettingsDto,
} from './dto/insurance.dto';
import { PaymentStatus, PermissionModule } from '@prisma/client';

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
    @Req() req: { body: Buffer | string | object },
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
  @ApiOperation({
    summary:
      'View passport photo with optional auth (Public with basic auth or JWT)',
  })
  async viewPassportPhoto(
    @Param('submissionId') submissionId: string,
    @Param('personId') personId: string,
    @Headers('authorization') authHeader: string,
    @Req() req: { user?: unknown },
    @Res() res: Response,
  ) {
    // Check if user is authenticated via JWT (req.user will be set by middleware if valid token)
    const isAuthenticated = !!req.user;

    return this.service.viewSecurePassportPhoto(
      submissionId,
      personId,
      isAuthenticated,
      authHeader,
      res,
    );
  }

  @Put('settings')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.WEBSITE, 'edit')
  @ApiOperation({ summary: 'Update insurance settings (Admin)' })
  async updateSettings(@Body() dto: UpdateInsuranceSettingsDto) {
    return this.service.updateSettings(dto);
  }

  @Get('submissions')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'view')
  @ApiOperation({ summary: 'Get all insurance submissions (Admin)' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'dateFrom', required: false, example: '2026-01-01' })
  @ApiQuery({ name: 'dateTo', required: false, example: '2026-12-31' })
  async getAllSubmissions(
    @Query('status') status?: PaymentStatus,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.service.getAllSubmissions(status, page, limit, {
      search,
      dateFrom,
      dateTo,
    });
  }

  @Get('submissions/:submissionId')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'view')
  @ApiOperation({ summary: 'Get submission details by ID (Admin)' })
  async getSubmissionById(@Param('submissionId') submissionId: string) {
    return this.service.getSubmissionById(submissionId);
  }

  @Delete('submissions/:submissionId')
  @UseGuards(AuthGuard)
  @RequirePermission(PermissionModule.ONLINE_ORDERS, 'delete')
  @ApiOperation({ summary: 'Delete insurance submission (Admin)' })
  async deleteSubmission(@Param('submissionId') submissionId: string) {
    return this.service.deleteSubmission(submissionId);
  }
}
