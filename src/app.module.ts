import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { OrdersModule } from './orders/orders.module'
import { CustomerModule } from './customer/customer.module'
import { InventoryModule } from './inventory/inventory.module'
import { PaymentsModule } from './payments/payments.module'
import { MessagingModule } from './messaging/messaging.module'
import { ShippingModule } from './shipping/shipping.module'
import { ScheduleModule } from '@nestjs/schedule'

@Module({
  imports: [
    OrdersModule,
    CustomerModule,
    InventoryModule,
    PaymentsModule,
    MessagingModule,
    ShippingModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
