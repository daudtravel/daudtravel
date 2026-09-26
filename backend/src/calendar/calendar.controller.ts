import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PermissionModule } from '@prisma/client';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CurrentUser, RequirePermission } from '@/access/access.decorators';
import type { AuthUser } from '@/access/access.types';
import { CalendarService } from './calendar.service';
import {
  CalendarQueryDto,
  CreateCalendarNoteDto,
  UpdateCalendarNoteDto,
} from './dto/calendar.dto';

@ApiTags('Calendar')
@ApiBearerAuth('JWT-auth')
@Controller('calendar')
@UseGuards(AuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @RequirePermission(PermissionModule.CALENDAR, 'view')
  @ApiOperation({ summary: 'Notes and events between two days (max 62)' })
  range(@CurrentUser() user: AuthUser, @Query() query: CalendarQueryDto) {
    return this.calendarService.range(user, query);
  }

  @Post('notes')
  @RequirePermission(PermissionModule.CALENDAR, 'create')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCalendarNoteDto,
  ) {
    return {
      message: 'NOTE_CREATED',
      data: await this.calendarService.createNote(user, dto),
    };
  }

  @Put('notes/:id')
  @RequirePermission(PermissionModule.CALENDAR, 'edit')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarNoteDto,
  ) {
    return {
      message: 'NOTE_UPDATED',
      data: await this.calendarService.updateNote(user, id, dto),
    };
  }

  @Delete('notes/:id')
  @RequirePermission(PermissionModule.CALENDAR, 'delete')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.calendarService.removeNote(user, id);
    return { message: 'NOTE_DELETED' };
  }
}
