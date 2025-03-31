import { Module } from '@nestjs/common'
import { ShippingService } from './shipping.service'
import { MessagingModule } from '@/messaging/messaging.module'

@Module({
  imports: [MessagingModule],
  providers: [ShippingService],
  exports: [ShippingService],
})
export class ShippingModule {}
