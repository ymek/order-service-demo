import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common'
import { OrderStatus } from '@prisma/client'
import prisma from '@/infrastructure/database/client'
import { CustomerService } from '@/customer/customer.service'
import { InventoryService } from '@/inventory/inventory.service'
import { CreateOrderDto } from '@/orders/dtos/create-order.dto'
import { OrderEventsPublisher, OrderWithItems } from '@/orders/events/order-events.publisher'
import { PaymentsService } from '@/payments/payments.service'
import { ShippingService } from '@/shipping/shipping.service'

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name)

  constructor(
    private readonly customerService: CustomerService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly orderEventsPublisher: OrderEventsPublisher,
    private readonly shippingService: ShippingService,
  ) {}

  //
  // Verify customer and inventory data (mocked services)
  // Create order
  // Validate payment authorization (mocked service)
  // Publish order created event
  // Return order details
  async createOrder(createOrderDto: CreateOrderDto) {
    const customerResponse = await this.customerService.getCustomerInfo({ customerId: createOrderDto.customerId })
    if (customerResponse.success !== true) {
      throw new BadRequestException(customerResponse.error?.message)
    }

    const reserveProductsResponse = await this.inventoryService.reserveInventory(createOrderDto.items)
    if (reserveProductsResponse.success !== true) {
      throw new BadRequestException(reserveProductsResponse.error?.message)
    }

    let order = await prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        storeId: createOrderDto.storeId,
        status: OrderStatus.PENDING,
        total: createOrderDto.items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        orderItems: {
          create: createOrderDto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
    })

    const authorizePaymentResponse = await this.paymentsService.authorizePayment({
      customerId: createOrderDto.customerId,
      storeId: createOrderDto.storeId,
      items: createOrderDto.items,
    })

    if (authorizePaymentResponse.success !== true) {
      await this.inventoryService.releaseInventory(createOrderDto.items)
      await prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.CANCELED, statusReason: authorizePaymentResponse.error?.message },
      })

      throw new BadRequestException(authorizePaymentResponse.error?.message)
    }

    order = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PROCESSING },
      include: {
        orderItems: true,
      },
    })

    // Publish event for downstream services: shipping, completing payments, etc.
    await this.orderEventsPublisher.publishOrderCreatedEvent(order as OrderWithItems)

    ///////////////////////
    // Demo: Shipping
    ///////////////////////

    await this.shippingService.shipOrder(order)

    ///////////////////////
    ///////////////////////

    this.logger.log(`Order ${order.id} processed successfully. Cha-ching!`)

    return order
  }

  async handleOrderShipped(orderId: string) {
    let order = await this.getOrderById(orderId)
    if (order === null) {
      throw new BadRequestException('Order not found')
    }

    if (order.status !== OrderStatus.PROCESSING) {
      throw new BadRequestException('Order is not in processing status')
    }

    order = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.SHIPPED },
      include: {
        orderItems: true,
        shipments: true,
      },
    })

    return order
  }

  async getOrderById(id: string) {
    const order = await prisma.order.findUnique({
      where: {
        id,
      },
      include: {
        orderItems: true,
        shipments: true,
      },
    })

    return order
  }

  // Only cancel order if it's in the 'pending' status
  async cancelOrder(id: string) {
    let order = await this.getOrderById(id)
    if (order === null || order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in pending status')
    }

    const releaseInventoryResponse = await this.inventoryService.releaseInventory(order.orderItems)
    if (releaseInventoryResponse.success !== true) {
      throw new BadRequestException(releaseInventoryResponse.error?.message)
    }

    order = await prisma.order.update({
      where: {
        id,
      },
      data: {
        status: OrderStatus.CANCELED,
        statusReason: 'Order canceled by customer',
      },
      include: {
        orderItems: true,
        shipments: true,
      },
    })

    return order
  }
}
