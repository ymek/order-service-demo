import { Module } from '@nestjs/common'
import { OrderController } from '@/orders/controllers/order.controller'
import { OrderEventsConsumer } from '@/orders/events/order-events.consumer'
import { OrderEventsPublisher } from '@/orders/events/order-events.publisher'
import { OrderService } from '@/orders/services/order.service'
import { MessagingModule } from '@/messaging/messaging.module'
import { CustomerModule } from '@/customer/customer.module'
import { InventoryModule } from '@/inventory/inventory.module'
import { PaymentsModule } from '@/payments/payments.module'
import { ShippingModule } from '@/shipping/shipping.module'

@Module({
  imports: [CustomerModule, InventoryModule, PaymentsModule, MessagingModule, ShippingModule],
  controllers: [OrderController],
  providers: [OrderService, OrderEventsPublisher, OrderEventsConsumer],
})
export class OrdersModule {}
