export interface MessagingService {
  publish(eventName: string, payload: any): Promise<void>
  consume(queueUrl: string): Promise<any[]>
  deleteMessage(queueUrl: string, receiptHandle: string): Promise<void>
}
