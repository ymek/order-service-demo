import { Injectable, Logger } from '@nestjs/common'

export interface PaymentAuthorizationRequest {
  customerId: string
  storeId: string
  items: { 
    productId: string
    quantity: number
  }[]
}

export interface PaymentAuthorizationResult {
  success: boolean
  transactionId?: string
  error?: PaymentAuthorizationError
}

export interface PaymentAuthorizationError {
  message: string
  code: string
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name)

  async authorizePayment(payment: PaymentAuthorizationRequest): Promise<PaymentAuthorizationResult> {
    this.logger.log(`Authorizing payment for ${payment.customerId}`)
    return { success: true, transactionId: '1234567890' }
  }
}

export class PaymentsServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
  }
}
