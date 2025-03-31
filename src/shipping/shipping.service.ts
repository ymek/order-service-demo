import { Inject, Injectable, Logger } from '@nestjs/common'
import { MessagingService } from '@/messaging/messaging.service'
import { Order } from '@prisma/client'

@Injectable()
export class ShippingService {
  private readonly logger = new Logger(ShippingService.name)

  constructor(
    @Inject('MESSAGING_SERVICE') private readonly messagingService: MessagingService,
  ) {}

  async shipOrder(order: Order) {
    this.logger.log(`Shipping order ${order.id}`)
    await this.messagingService.publish('order.shipped', {
      order
    })
  }
}
