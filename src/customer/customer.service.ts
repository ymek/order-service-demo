import { Injectable, Logger } from '@nestjs/common'

export interface Customer {
  id: string
  name: string
  email: string
}

export interface CustomerInfoResponse {
  success: boolean
  customer?: Customer
  error?: CustomerServiceError
}

export interface CustomerInfoRequest {
  customerId: string
}

export interface CustomerInfoError {
  message: string
  code: string
}

@Injectable()
export class CustomerService {
  private readonly logger = new Logger(CustomerService.name)

  // Mocked service
  async getCustomerInfo(request: CustomerInfoRequest): Promise<CustomerInfoResponse> {
    this.logger.log(`Getting customer info for ${request.customerId}`)
    return { success: true, customer: { id: request.customerId, name: 'John Doe', email: 'john.doe@example.com' } }
  }
}

export class CustomerServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
  }
}