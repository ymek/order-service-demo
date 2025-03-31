# Architectural Notes
Architectural notes and thought processes can be found in
[ARCHITECTURE.md](https://github.com/ymek/order-service-demo/blob/main/ARCHITECTURE.md)

# Local Development Setup

> **NOTE:** Assumes `docker` and `docker-compose` are installed and available

Leverages LocalStack to simulate AWS services for local development. To get your environment up and running:

#### 1. Copy the ENV template
```
$ cp .env.templte .env
```

#### 2. Start LocalStack and Dependencies

```
$ docker-compose up -d
```

#### 3. Configure SNS and SQS on LocalStack

##### a) Create the SNS topic
```
$ docker-compose exec localstack awslocal sns create-topic --name orders-topic
```
> **ACTION:** Copy the `TopicArn` to `ORDER_TOPIC_ARN` in your `.env` file

##### b) Create the shipped orders SQS queue
```
$ docker-compose exec localstack awslocal sqs create-queue --queue-name order-shipped-queue
```
> **ACTION:** Copy the `QueueUrl` to `ORDER_SHIPPED_QUEUE_URL` in your `.env` file

##### c) Subscribe the SQS Queue to the SNS Topic
```
$ docker-compose exec localstack awslocal sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:000000000000:orders-topic \
  --protocol sqs \
  --notification-endpoint arn:aws:sqs:us-east-1:000000000000:order-shipped-queue
```
> **ACTION:** Take note of this Subscription ARN; you'll need it to set the filter policy.
 
##### d) Set a Filter Policy on the Subscription
```
$ docker-compose exec localstack awslocal sns set-subscription-attributes \
  --subscription-arn arn:aws:sns:us-east-1:000000000000:orders-topic:cf0ffb3d-d02e-47ec-a8a9-e1186cc064ad \
  --attribute-name FilterPolicy \
  --attribute-value '{"eventType": ["order.shipped"]}'
```
> **Action:** Ensure the Subscription ARN in the command matches the output from the previous step. Update it if necessary.

#### 4. Install Dependencies
```
$ pnpm install
```

#### 5. Start the Application
```
$ pnpm start:dev
```

#### 6. Create an Order

Example Post to `http://localhost:3000/order`
```
{
	"customerId": "4aec38d7c32f4cd6b4cb7ff02b",
	"storeId": "4902549aaaea44f09a4362cc6b",
	"items": [
		{
			"productId": "ef93e638f50b42e28721ad655e",
			"quantity": 1,
			"price": 10
		}
	]
}
```
