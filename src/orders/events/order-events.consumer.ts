
import { Cron, CronExpression } from '@nestjs/schedule'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { MessagingService } from '@/messaging/messaging.service'
import { OrderService } from '@/orders/services/order.service'

@Injectable()
export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name)

  constructor(
    @Inject('MESSAGING_SERVICE') private readonly messagingService: MessagingService,
    private readonly orderService: OrderService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async pollOrderShippedEvents(): Promise<void> {
    try {
      const queueUrl = process.env.ORDER_SHIPPED_QUEUE_URL
      if (!queueUrl) {
        throw new Error('Queue URL for order.shipped not configured')
      }
      
      this.logger.debug(`Polling messages from queue: ${queueUrl}`)
      // Poll the queue for messages
      const messages = await this.messagingService.consume(queueUrl)
      this.logger.debug(`Number of messages received: ${messages.length}`)
      
      for (const message of messages) {
        const { body, receiptHandle } = message
        const { eventType, payload } = body

        this.logger.debug(`Raw message: ${JSON.stringify(message)}`)
        this.logger.debug(`Received event type: ${eventType}`)
        this.logger.debug(`Received payload: ${JSON.stringify(payload)}`)

        if (eventType === 'order.shipped') {
          this.logger.debug(`Received order.shipped event for order ID: ${payload.order.id}`)
          await this.orderService.handleOrderShipped(payload.order.id)
          await this.messagingService.deleteMessage(queueUrl, receiptHandle)
        } else {
          this.logger.warn(`Unhandled event type: ${eventType}`)
        }

      }
    } catch (error) {
      this.logger.error(`Error consuming order.shipped event: ${error}`)
    }
  }
}