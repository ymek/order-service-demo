import { Inject, Injectable, Logger } from '@nestjs/common'
import { Order, OrderItem, OrderStatus, Prisma } from '@prisma/client'
import { type MessagingService } from '@/messaging/messaging.service'

export interface OrderCreatedEventPayload {
  id: string
  customerId: string
  storeId: string
  status: OrderStatus
  total: number
  orderItems: OrderItem[]
  createdAt: Date
  updatedAt: Date
}

export type OrderWithItems = Prisma.OrderGetPayload<{
  include: { orderItems: true }
}>

@Injectable()
export class OrderEventsPublisher {
  private readonly logger = new Logger(OrderEventsPublisher.name)

  constructor(@Inject('MESSAGING_SERVICE') private readonly messagingService: MessagingService) {}

  async publishOrderCreatedEvent(order: OrderWithItems): Promise<void> {
    const eventName = 'order.created'
    const eventPayload: OrderCreatedEventPayload = {
      id: order.id,
      customerId: order.customerId,
      storeId: order.storeId,
      status: order.status,
      total: order.total.toNumber(),
      orderItems: order.orderItems,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }

    await this.messagingService.publish(eventName, eventPayload)
    this.logger.log(`Published Order Created event for order ${order.id}`)
  }
}
