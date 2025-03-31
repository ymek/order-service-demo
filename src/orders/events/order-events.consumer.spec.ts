import { Test, TestingModule } from '@nestjs/testing'
import { OrderEventsConsumer } from './order-events.consumer'

describe('OrderEventsService', () => {
  let service: OrderEventsConsumer

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderEventsConsumer],
    }).compile()

    service = module.get<OrderEventsConsumer>(OrderEventsConsumer)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
