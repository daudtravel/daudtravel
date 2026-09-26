import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request } from 'express';
import { TransferPaymentsService } from './transfer-payments.service';

/**
 * BOG is given `${BASE_URL}/api/transfer/payments/bog/callback` (singular,
 * see getTransfersCallbackUrl) and main.ts registers the raw-body parser for
 * that exact path, but the main controller lives under `transfers`. This alias
 * receives those callbacks and runs the very same handler.
 */
@ApiExcludeController()
@Controller('transfer')
export class TransferPaymentsCallbackAliasController {
  constructor(
    private readonly transferPaymentsService: TransferPaymentsService,
  ) {}

  @Post('payments/bog/callback')
  @HttpCode(HttpStatus.OK)
  async handleCallback(
    @Req() req: RawBodyRequest<Request>,
    @Headers('callback-signature') signature: string,
  ) {
    let rawBody: string;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else if (typeof req.body === 'string') {
      rawBody = req.body;
    } else {
      rawBody = JSON.stringify(req.body);
    }

    return this.transferPaymentsService.handleBOGCallback(rawBody, signature);
  }
}
