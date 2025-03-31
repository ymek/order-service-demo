import { z } from 'zod'

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1),
  price: z.number().min(0.01),
})

export type OrderItemDto = z.infer<typeof OrderItemSchema>
