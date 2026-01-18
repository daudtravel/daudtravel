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
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import {
  CreateTransferDto,
  UpdateTransferDto,
  GetTransfersQueryDto,
  GetTransferByIdQueryDto,
} from './dto/transfer.dto';
import { TransferService } from './transfer.service';

@ApiTags('Transfers')
@Controller('transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransferService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new transfer (Admin)' })
  @ApiBody({ type: CreateTransferDto })
  @ApiResponse({ status: 201, description: 'Transfer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createTransfer(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTransferDto: CreateTransferDto,
  ) {
    const createdTransfer =
      await this.transfersService.createTransfer(createTransferDto);
    return {
      success: true,
      message: 'Transfer created successfully',
      data: createdTransfer,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all transfers with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Transfers retrieved successfully' })
  async getAllTransfers(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetTransfersQueryDto,
  ) {
    const transfers = await this.transfersService.getAllTransfers(query);
    return {
      success: true,
      message: 'Transfers retrieved successfully',
      ...transfers,
    };
  }

  @Get('public')
  @ApiOperation({ summary: 'Get all public transfers' })
  @ApiQuery({ name: 'locale', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Public transfers retrieved' })
  async getPublicTransfers(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetTransfersQueryDto,
  ) {
    const transfers = await this.transfersService.getPublicTransfers(query);
    return {
      success: true,
      message: 'Public transfers retrieved successfully',
      ...transfers,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiResponse({ status: 200, description: 'Transfer retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransferById(
    @Param('id') id: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: GetTransferByIdQueryDto,
  ) {
    const transfer = await this.transfersService.getTransferById(
      id,
      query.locale,
    );
    return {
      success: true,
      message: 'Transfer retrieved successfully',
      data: transfer,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update transfer (Admin)' })
  @ApiBody({ type: UpdateTransferDto })
  @ApiResponse({ status: 200, description: 'Transfer updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async updateTransfer(
    @Param('id') id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateTransferDto: UpdateTransferDto,
  ) {
    const updated = await this.transfersService.updateTransfer(
      id,
      updateTransferDto,
    );
    return {
      success: true,
      message: 'Transfer updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete transfer (Admin)' })
  @ApiResponse({ status: 200, description: 'Transfer deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete transfer with existing payment orders',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async deleteTransfer(@Param('id') id: string) {
    const result = await this.transfersService.deleteTransfer(id);
    return {
      success: true,
      message: 'Transfer deleted successfully',
      data: result,
    };
  }
}
