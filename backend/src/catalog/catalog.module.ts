import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';

// PrismaService, AccessService and CurrencyService come from global modules.
@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
