import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, BookingType, PermissionModule } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AccessService } from '@/access/access.service';
import type { AuthUser } from '@/access/access.types';
import { formatDateOnly, parseDateOnly } from '@/common/utils/date-only.util';
import {
  CalendarQueryDto,
  CreateCalendarNoteDto,
  UpdateCalendarNoteDto,
} from './dto/calendar.dto';

const MODULE = PermissionModule.CALENDAR;
const MAX_DAYS = 62;

export type CalendarEventType =
  | 'BOOKING_START'
  | 'BOOKING_END'
  | 'SERVICE'
  | 'CHECK_IN'
  | 'CHECK_OUT'
  | 'TOUR_ORDER'
  | 'TRANSFER_ORDER';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  time: string | null;
  title: string;
  subtitle: string | null;
  /** Where clicking the chip leads. */
  bookingId?: string;
  bookingNumber?: number;
  orderId?: string;
}

const NOTE_SELECT = {
  id: true,
  date: true,
  time: true,
  title: true,
  content: true,
  color: true,
  isDone: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
  createdBy: { select: { id: true, firstName: true, lastName: true } },
};

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
  ) {}

  /** Notes and everything happening between two days. */
  async range(user: AuthUser, query: CalendarQueryDto) {
    const from = parseDateOnly(query.from, 'from');
    const to = parseDateOnly(query.to, 'to');
    if (to < from) throw new BadRequestException('INVALID_DATE_RANGE');
    const days = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    if (days > MAX_DAYS) throw new BadRequestException('RANGE_TOO_LONG');

    const nextDay = new Date(to.getTime() + 86400000);
    const [notes, events] = await Promise.all([
      this.notes(user, from, nextDay, query.createdById),
      this.events(user, from, nextDay),
    ]);

    return {
      data: {
        from: formatDateOnly(from),
        to: formatDateOnly(to),
        notes,
        events,
      },
    };
  }

  private async notes(
    user: AuthUser,
    from: Date,
    nextDay: Date,
    createdById?: string,
  ) {
    const scope = this.access.scopeWhere(user, MODULE, 'view');
    if (!scope) return [];

    const rows = await this.prisma.calendarNote.findMany({
      where: {
        ...scope,
        date: { gte: from, lt: nextDay },
        ...(createdById && { createdById }),
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }, { createdAt: 'asc' }],
      select: NOTE_SELECT,
      take: 2000,
    });

    return rows.map((row) => ({ ...row, date: formatDateOnly(row.date) }));
  }

  private async events(user: AuthUser, from: Date, nextDay: Date) {
    const events: CalendarEvent[] = [];

    // Bookings the user may see, by type and record scope
    const modules: Record<BookingType, PermissionModule> = {
      [BookingType.HOTEL]: PermissionModule.BOOKINGS_HOTEL,
      [BookingType.TOUR]: PermissionModule.BOOKINGS_TOUR,
      [BookingType.TRANSFER]: PermissionModule.BOOKINGS_TOUR,
      [BookingType.PACKAGE]: PermissionModule.BOOKINGS_PACKAGE,
    };
    const bookingScopes = Object.entries(modules)
      .map(([type, module]) => {
        const scope = this.access.scopeWhere(user, module, 'view');
        return scope ? { type: type as BookingType, ...scope } : null;
      })
      .filter((row): row is NonNullable<typeof row> => !!row);

    if (bookingScopes.length) {
      const bookings = await this.prisma.booking.findMany({
        where: {
          AND: [
            { OR: bookingScopes },
            { status: { not: BookingStatus.CANCELLED } },
            {
              OR: [
                { startDate: { gte: from, lt: nextDay } },
                { endDate: { gte: from, lt: nextDay } },
                {
                  items: {
                    some: {
                      OR: [
                        { serviceDate: { gte: from, lt: nextDay } },
                        { checkIn: { gte: from, lt: nextDay } },
                        { checkOut: { gte: from, lt: nextDay } },
                      ],
                    },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
          number: true,
          type: true,
          touristName: true,
          startDate: true,
          endDate: true,
          items: {
            select: {
              id: true,
              title: true,
              serviceDate: true,
              checkIn: true,
              checkOut: true,
              hotel: { select: { name: true } },
            },
          },
        },
        take: 2000,
      });

      const inRange = (date: Date | null) =>
        !!date && date >= from && date < nextDay;

      for (const booking of bookings) {
        const label = `${booking.touristName}`;
        if (inRange(booking.startDate)) {
          events.push({
            id: `booking-start-${booking.id}`,
            type: 'BOOKING_START',
            date: formatDateOnly(booking.startDate)!,
            time: null,
            title: label,
            subtitle: booking.type,
            bookingId: booking.id,
            bookingNumber: booking.number,
          });
        }
        if (inRange(booking.endDate)) {
          events.push({
            id: `booking-end-${booking.id}`,
            type: 'BOOKING_END',
            date: formatDateOnly(booking.endDate)!,
            time: null,
            title: label,
            subtitle: booking.type,
            bookingId: booking.id,
            bookingNumber: booking.number,
          });
        }
        for (const item of booking.items) {
          if (inRange(item.serviceDate)) {
            events.push({
              id: `item-service-${item.id}`,
              type: 'SERVICE',
              date: formatDateOnly(item.serviceDate)!,
              time: null,
              title: item.title,
              subtitle: label,
              bookingId: booking.id,
              bookingNumber: booking.number,
            });
          }
          if (inRange(item.checkIn)) {
            events.push({
              id: `item-checkin-${item.id}`,
              type: 'CHECK_IN',
              date: formatDateOnly(item.checkIn)!,
              time: null,
              title: item.hotel?.name ?? item.title,
              subtitle: label,
              bookingId: booking.id,
              bookingNumber: booking.number,
            });
          }
          if (inRange(item.checkOut)) {
            events.push({
              id: `item-checkout-${item.id}`,
              type: 'CHECK_OUT',
              date: formatDateOnly(item.checkOut)!,
              time: null,
              title: item.hotel?.name ?? item.title,
              subtitle: label,
              bookingId: booking.id,
              bookingNumber: booking.number,
            });
          }
        }
      }
    }

    // Website orders, for whoever handles them
    if (this.access.can(user, PermissionModule.ONLINE_ORDERS, 'view')) {
      const [tours, transfers] = await Promise.all([
        this.prisma.tourPaymentOrder.findMany({
          where: {
            status: 'PAID',
            selectedDate: { gte: from, lt: nextDay },
          },
          select: {
            id: true,
            tourName: true,
            selectedDate: true,
            customerFirstName: true,
            customerLastName: true,
            peopleCount: true,
          },
          take: 1000,
        }),
        this.prisma.transferPaymentOrder.findMany({
          where: {
            status: 'PAID',
            transferDate: { gte: from, lt: nextDay },
          },
          select: {
            id: true,
            transferDate: true,
            transferTime: true,
            transferStartLocation: true,
            transferEndLocation: true,
            customerFirstName: true,
            customerLastName: true,
          },
          take: 1000,
        }),
      ]);

      for (const order of tours) {
        events.push({
          id: `tour-order-${order.id}`,
          type: 'TOUR_ORDER',
          date: formatDateOnly(order.selectedDate)!,
          time: null,
          title: order.tourName,
          subtitle: `${order.customerFirstName} ${order.customerLastName} · ${order.peopleCount}`,
          orderId: order.id,
        });
      }
      for (const order of transfers) {
        events.push({
          id: `transfer-order-${order.id}`,
          type: 'TRANSFER_ORDER',
          date: formatDateOnly(order.transferDate)!,
          time: order.transferTime
            ? order.transferTime.toISOString().slice(11, 16)
            : null,
          title: `${order.transferStartLocation} → ${order.transferEndLocation}`,
          subtitle: `${order.customerFirstName} ${order.customerLastName}`,
          orderId: order.id,
        });
      }
    }

    return events.sort(
      (a, b) =>
        a.date.localeCompare(b.date) ||
        (a.time ?? '').localeCompare(b.time ?? ''),
    );
  }

  async createNote(user: AuthUser, dto: CreateCalendarNoteDto) {
    const row = await this.prisma.calendarNote.create({
      data: {
        date: parseDateOnly(dto.date, 'date'),
        time: dto.time ?? null,
        title: dto.title,
        content: dto.content ?? null,
        color: dto.color ?? 'green',
        isDone: dto.isDone ?? false,
        createdById: this.access.resolveOwnerId(
          user,
          MODULE,
          'create',
          dto.createdById,
        ),
      },
      select: NOTE_SELECT,
    });
    return { ...row, date: formatDateOnly(row.date) };
  }

  async updateNote(user: AuthUser, id: string, dto: UpdateCalendarNoteDto) {
    const existing = await this.prisma.calendarNote.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(user, MODULE, 'edit', existing.createdById);

    const row = await this.prisma.calendarNote.update({
      where: { id },
      data: {
        ...(dto.date !== undefined && {
          date: parseDateOnly(dto.date, 'date'),
        }),
        ...(dto.time !== undefined && { time: dto.time }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isDone !== undefined && { isDone: dto.isDone }),
        ...(dto.createdById !== undefined &&
          this.access.canAll(user, MODULE, 'edit') && {
            createdById: dto.createdById,
          }),
      },
      select: NOTE_SELECT,
    });
    return { ...row, date: formatDateOnly(row.date) };
  }

  async removeNote(user: AuthUser, id: string) {
    const existing = await this.prisma.calendarNote.findUnique({
      where: { id },
      select: { id: true, createdById: true },
    });
    if (!existing) throw new NotFoundException('NOT_FOUND');
    this.access.assertRecordAccess(
      user,
      MODULE,
      'delete',
      existing.createdById,
    );
    await this.prisma.calendarNote.delete({ where: { id } });
  }
}
