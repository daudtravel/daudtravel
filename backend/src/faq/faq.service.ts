// src/faq/faq.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFaqDto: CreateFaqDto) {
    const faq = await this.prisma.fAQ.create({
      data: {
        category: createFaqDto.category,
        localizations: {
          create: createFaqDto.localizations,
        },
      },
      include: {
        localizations: true,
      },
    });

    return faq;
  }

  async findAll(locale?: string) {
    const faqs = await this.prisma.fAQ.findMany({
      include: {
        localizations: locale
          ? {
              where: { locale },
            }
          : true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return faqs;
  }

  async findOne(id: string, locale?: string) {
    const faq = await this.prisma.fAQ.findUnique({
      where: { id },
      include: {
        localizations: locale
          ? {
              where: { locale },
            }
          : true,
      },
    });

    if (!faq) {
      throw new NotFoundException(`FAQ with ID ${id} not found`);
    }

    return faq;
  }

  async update(id: string, updateFaqDto: UpdateFaqDto) {
    // Check if FAQ exists
    await this.findOne(id);

    // If localizations are provided, handle them separately
    const { localizations, ...faqData } = updateFaqDto;

    const updateData: any = {
      ...faqData,
    };

    // If localizations are provided, update them
    if (localizations && localizations.length > 0) {
      // Delete existing localizations and create new ones
      await this.prisma.fAQLocalization.deleteMany({
        where: { faqId: id },
      });

      updateData.localizations = {
        create: localizations,
      };
    }

    const updatedFaq = await this.prisma.fAQ.update({
      where: { id },
      data: updateData,
      include: {
        localizations: true,
      },
    });

    return updatedFaq;
  }

  async remove(id: string) {
    // Check if FAQ exists
    await this.findOne(id);

    // Delete localizations first (if not using cascade)
    await this.prisma.fAQLocalization.deleteMany({
      where: { faqId: id },
    });

    // Delete FAQ
    await this.prisma.fAQ.delete({
      where: { id },
    });

    return {
      id,
      message: 'FAQ deleted successfully',
    };
  }
}
