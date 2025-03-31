import { z } from 'zod'
import { OrderItemSchema } from './order-item.dto'
import { OrderStatus } from '@prisma/client'

export const CreateOrderSchema = z.object({
  customerId: z.string().ulid(),
  storeId: z.string().ulid(),
  items: z.array(OrderItemSchema).min(1),
})

export type CreateOrderDto = z.infer<typeof CreateOrderSchema>
