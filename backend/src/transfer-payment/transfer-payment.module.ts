import { Module } from '@nestjs/common';
import { MailModule } from '../mail/mail.module';
import { TransferPaymentsController } from './transfer-payments.controller';
import { TransferPaymentsCallbackAliasController } from './transfer-payments-callback-alias.controller';
import { TransferPaymentsService } from './transfer-payments.service';

@Module({
  imports: [MailModule],
  controllers: [
    TransferPaymentsController,
    TransferPaymentsCallbackAliasController,
  ],
  providers: [TransferPaymentsService],
  exports: [TransferPaymentsService],
})
export class TransferPaymentsModule {}
