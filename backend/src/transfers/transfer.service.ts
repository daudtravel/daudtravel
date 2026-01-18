import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateTransferDto,
  UpdateTransferDto,
  GetTransfersQueryDto,
} from './dto/transfer.dto';

@Injectable()
export class TransferService {
  private readonly FALLBACK_LOCALES = ['en', 'ka'];

  constructor(private prisma: PrismaService) {}

  async createTransfer(createTransferDto: CreateTransferDto) {
    const {
      localizations = [],
      vehicleTypes,
      isPublic = false,
    } = createTransferDto;

    if (localizations.length > 0) {
      const locales = localizations.map((loc) => loc.locale);
      const uniqueLocales = new Set(locales);
      if (locales.length !== uniqueLocales.size) {
        throw new BadRequestException('Duplicate locales are not allowed');
      }
    }

    const vehicleTypeKeys = vehicleTypes.map((vt) => vt.type);
    const uniqueVehicleTypes = new Set(vehicleTypeKeys);
    if (vehicleTypeKeys.length !== uniqueVehicleTypes.size) {
      throw new BadRequestException('Duplicate vehicle types are not allowed');
    }

    const createdTransfer = await this.prisma.transfer.create({
      data: {
        isPublic,
        localizations:
          localizations.length > 0
            ? {
                create: localizations.map((loc) => ({
                  locale: loc.locale,
                  startLocation: loc.startLocation,
                  endLocation: loc.endLocation,
                })),
              }
            : undefined,
        vehicleTypes: {
          create: vehicleTypes.map((vt) => ({
            type: vt.type,
            price: vt.price,
            maxPersons: vt.maxPersons,
          })),
        },
      },
      include: {
        localizations: true,
        vehicleTypes: true,
      },
    });

    return this.formatTransfer(createdTransfer);
  }

  async getAllTransfers(query: GetTransfersQueryDto) {
    const {
      page = 1,
      limit = 10,
      locale,
      publicOnly = false,
      search,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
      vehicleType,
      minPrice,
      maxPrice,
    } = query;

    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (publicOnly) {
      whereClause.isPublic = true;
    }

    if (search) {
      whereClause.localizations = {
        some: {
          OR: [
            { startLocation: { contains: search, mode: 'insensitive' } },
            { endLocation: { contains: search, mode: 'insensitive' } },
          ],
        },
      };
    }

    if (vehicleType) {
      whereClause.vehicleTypes = {
        some: {
          type: vehicleType,
        },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) {
        priceFilter.gte = minPrice;
      }
      if (maxPrice !== undefined) {
        priceFilter.lte = maxPrice;
      }

      if (!whereClause.vehicleTypes) {
        whereClause.vehicleTypes = { some: {} };
      }
      whereClause.vehicleTypes.some.price = priceFilter;
    }

    const validSortFields = ['createdAt', 'updatedAt', 'isPublic'];
    const orderBy: any = {};
    if (validSortFields.includes(sortBy)) {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.updatedAt = 'desc';
    }

    const [transfers, totalRecords] = await Promise.all([
      this.prisma.transfer.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          localizations: true,
          vehicleTypes: {
            orderBy: { price: 'asc' },
          },
        },
        orderBy,
      }),
      this.prisma.transfer.count({ where: whereClause }),
    ]);

    const processedTransfers = transfers.map((transfer) =>
      this.applyLocaleWithFallback(transfer, locale),
    );

    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: processedTransfers.map((transfer) => this.formatTransfer(transfer)),
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        locale: locale || null,
        publicOnly,
        search: search || null,
        vehicleType: vehicleType || null,
        minPrice: minPrice || null,
        maxPrice: maxPrice || null,
        sortBy,
        sortOrder,
      },
    };
  }

  async getPublicTransfers(query: GetTransfersQueryDto) {
    return this.getAllTransfers({ ...query, publicOnly: true });
  }

  async getTransferById(id: string, locale?: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        localizations: true,
        vehicleTypes: {
          orderBy: { price: 'asc' },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    const processedTransfer = this.applyLocaleWithFallback(transfer, locale);

    return this.formatTransfer(processedTransfer);
  }

  async updateTransfer(id: string, updateTransferDto: UpdateTransferDto) {
    const { localizations, vehicleTypes, isPublic } = updateTransferDto;

    const existingTransfer = await this.prisma.transfer.findUnique({
      where: { id },
      include: {
        localizations: true,
        vehicleTypes: true,
      },
    });

    if (!existingTransfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (localizations && localizations.length > 0) {
      const locales = localizations.map((loc) => loc.locale);
      const uniqueLocales = new Set(locales);
      if (locales.length !== uniqueLocales.size) {
        throw new BadRequestException('Duplicate locales are not allowed');
      }
    }

    if (vehicleTypes) {
      const vehicleTypeKeys = vehicleTypes.map((vt) => vt.type);
      const uniqueVehicleTypes = new Set(vehicleTypeKeys);
      if (vehicleTypeKeys.length !== uniqueVehicleTypes.size) {
        throw new BadRequestException(
          'Duplicate vehicle types are not allowed',
        );
      }
    }

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (isPublic !== undefined) {
      updatePayload.isPublic = isPublic;
    }

    if (localizations) {
      updatePayload.localizations = {
        deleteMany: {},
        create: localizations.map((loc) => ({
          locale: loc.locale,
          startLocation: loc.startLocation,
          endLocation: loc.endLocation,
        })),
      };
    }

    if (vehicleTypes) {
      updatePayload.vehicleTypes = {
        deleteMany: {},
        create: vehicleTypes.map((vt) => ({
          type: vt.type,
          price: vt.price,
          maxPersons: vt.maxPersons,
        })),
      };
    }

    const updatedTransfer = await this.prisma.transfer.update({
      where: { id },
      data: updatePayload,
      include: {
        localizations: true,
        vehicleTypes: {
          orderBy: { price: 'asc' },
        },
      },
    });

    return this.formatTransfer(updatedTransfer);
  }

  async deleteTransfer(id: string) {
    const transfer = await this.prisma.transfer.findUnique({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    const paymentOrdersCount = await this.prisma.transferPaymentOrder.count({
      where: { transferId: id },
    });

    if (paymentOrdersCount > 0) {
      throw new BadRequestException(
        `Cannot delete transfer with ${paymentOrdersCount} existing payment order(s). Please delete or cancel the payment orders first.`,
      );
    }

    await this.prisma.transfer.delete({
      where: { id },
    });

    return { id, deleted: true };
  }

  private applyLocaleWithFallback(transfer: any, locale?: string) {
    if (!locale || transfer.localizations.length === 0) {
      return transfer;
    }

    let localization = transfer.localizations.find(
      (loc: any) => loc.locale === locale,
    );

    if (!localization) {
      for (const fallbackLocale of this.FALLBACK_LOCALES) {
        localization = transfer.localizations.find(
          (loc: any) => loc.locale === fallbackLocale,
        );
        if (localization) break;
      }
    }

    if (!localization) {
      localization = transfer.localizations[0];
    }

    return {
      ...transfer,
      localizations: [localization],
    };
  }

  private formatTransfer(transfer: any) {
    return {
      id: transfer.id,
      isPublic: transfer.isPublic,
      localizations: transfer.localizations || [],
      vehicleTypes: (transfer.vehicleTypes || []).map((vt: any) => ({
        id: vt.id,
        type: vt.type,
        price: Number(vt.price),
        maxPersons: vt.maxPersons,
      })),
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString(),
    };
  }
}
