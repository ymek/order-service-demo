import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common'
import { OrderService } from '@/orders/services/order.service'
import { CreateOrderDto, CreateOrderSchema } from '@/orders/dtos/create-order.dto'
import { Order } from '@prisma/client'
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe'

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  async create(@Body(new ZodValidationPipe(CreateOrderSchema)) createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.orderService.createOrder(createOrderDto)
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.orderService.getOrderById(id);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return await this.orderService.cancelOrder(id);
  }
}
