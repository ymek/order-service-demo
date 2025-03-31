import { Injectable, Logger } from '@nestjs/common'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { ulid } from 'ulid'
import { MessagingService } from '@/messaging/messaging.service'
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs'

@Injectable()
export class SnsService implements MessagingService {
  private readonly logger = new Logger(SnsService.name)
  private readonly snsClient: SNSClient
  private readonly sqsClient: SQSClient
  private readonly maxNumberOfMessages = 10
  private readonly waitTimeSeconds = 5

  constructor() {
    this.snsClient = new SNSClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.AWS_SNS_ENDPOINT ?? 'http://localhost:4566',
    })

    this.sqsClient = new SQSClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.AWS_SQS_ENDPOINT ?? 'http://localhost:4566',
    })
  }

  async publish(eventName: string, payload: any): Promise<void> {
    const event = {
      id: ulid(),
      eventType: eventName,
      timestamp: new Date().toISOString(),
      payload,
    }
  
    const topicArn = process.env.ORDER_TOPIC_ARN
    if (!topicArn) {
      throw new Error('ORDER_TOPIC_ARN is not defined in the environment variables.')
    }
  
    const params = {
      TopicArn: topicArn,
      Message: JSON.stringify(event),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: eventName,
        },
      },
    }
  
    try {
      const result = await this.snsClient.send(new PublishCommand(params))
      this.logger.debug(`Published event ${eventName}: ${JSON.stringify(result)}`)
    } catch (error) {
      this.logger.error(`Error publishing event ${eventName}: ${error}`)
      throw error
    }
  }

  async consume(queueUrl: string): Promise<Array<{ body: any, receiptHandle: string }>> {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: this.maxNumberOfMessages,
        WaitTimeSeconds: this.waitTimeSeconds,
        MessageAttributeNames: ["All"],
      })
  
      const response = await this.sqsClient.send(command)
      if (!response.Messages || response.Messages.length === 0) {
        return []
      }
  
      return response.Messages.map((msg) => {
        if (!msg.Body) return null
        if (!msg.ReceiptHandle) {
          this.logger.warn(`Message missing ReceiptHandle: ${JSON.stringify(msg)}`)
          return null
        }
        try {
          // Parse the SNS envelope
          const snsEnvelope = JSON.parse(msg.Body)
          let actualMessage = snsEnvelope
          if (snsEnvelope.Message) {
            actualMessage = JSON.parse(snsEnvelope.Message)
          }
          return { body: actualMessage, receiptHandle: msg.ReceiptHandle }
        } catch (error) {
          this.logger.warn(`Failed to parse message body: ${msg.Body}`)
          return null
        }
      }).filter((m): m is { body: any, receiptHandle: string } => m !== null)
      
    } catch (error) {
      this.logger.error(`Error consuming messages from queue ${queueUrl}: ${error}`)
      throw error
    }
  }
  
  async deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
      })
      await this.sqsClient.send(command)
      this.logger.debug(`Deleted message with receiptHandle: ${receiptHandle}`)
    } catch (error) {
      this.logger.error(`Error deleting message: ${error}`)
      throw error
    }
  }
}
