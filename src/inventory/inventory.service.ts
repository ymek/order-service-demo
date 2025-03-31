import { Injectable, Logger } from '@nestjs/common';

export interface InventoryItem {
  productId: string
  quantity: number
}

export interface InventoryReservationResult {
  success: boolean
  error?: InventoryError
}

export interface InventoryReleaseResult {
  success: boolean
  error?: InventoryError
}

export interface InventoryError {
  message: string
  code: string
}


@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name)

  async reserveInventory(items: InventoryItem[]): Promise<InventoryReservationResult> {
    this.logger.log(`Reserving inventory for ${items.length} items`)
    return { success: true }
  }

  async releaseInventory(items: InventoryItem[]): Promise<InventoryReleaseResult> {
    this.logger.log(`Releasing inventory for ${items.length} items`)
    return { success: true }
  }
}

export class InventoryServiceError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
  }
}
