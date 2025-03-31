import { Module } from '@nestjs/common'
import { SnsService } from '@/infrastructure/aws/sns.service'

@Module({
  providers: [
    {
      provide: 'MESSAGING_SERVICE',
      useClass: SnsService,
    },
  ],
  exports: ['MESSAGING_SERVICE'],
})
export class MessagingModule {}
