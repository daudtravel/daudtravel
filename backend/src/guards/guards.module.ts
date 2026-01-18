import { AuthGuard } from '@/common/guards/auth.guard';
import { Module } from '@nestjs/common';

@Module({
  providers: [AuthGuard],
  exports: [AuthGuard],
})
export class GuardsModule {}
