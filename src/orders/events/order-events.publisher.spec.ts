import { Test, TestingModule } from '@nestjs/testing'
import { OrderEventsPublisher } from './order-events.publisher'

describe('OrderEventsPublisher', () => {
  let service: OrderEventsPublisher

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderEventsPublisher],
    }).compile()

    service = module.get<OrderEventsPublisher>(OrderEventsPublisher)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
