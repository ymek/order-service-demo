# Design Rationale, Thought Process, Technical Decisions, and Assumptions

An outline of the thought process behind the architecture, and assumptions made during the development of the demo. The goal is both immediate, pragmatic solutions and laying the groundwork for a future production-grade, message-driven system.

---

## Overview

The _Order Management_ microservice manages order creation, updates (shipping and status), and cancellations for multiple global storefronts. The system uses a hybrid approach that combines:

- **Synchronous Processing:** Immediate validation, payment authorization, and order persistence ensure a responsive user experience.

- **Asynchronous Processing:** Uses SNS and SQS to fan out events (eg: `order.created`, `order.shipped`, `order.cancelled`) for downstream processing such as shipping, inventory adjustments, analytics, and final payment settlement.

This approach delivers fast user feedback while decoupling services to enable future scalability.

---

## Thought Process

### Balancing Immediate Feedback with Scalability
- **User Experience:**  
  Synchronous inventory reservation, payment authorization, and order persistence ensure that the customer receives the immediate feedback critical for a positive user experience.
  
- **Downstream Processing:**  
    Once an order is processed, events (eg: `order.created` and `order.shipped`) are published to an SNS topic. These events trigger downstream services (Shipping, Analytics, Notifications, etc) asynchronously, allowing each service to scale independently and reducing overall system latency.


### Hybrid Messaging Approach
- **Synchronous vs. Asynchronous Trade-offs:**  
  While a fully synchronous system might be simpler to implement, it wouldn’t scale well for millions of orders. Conversely, a fully asynchronous system can be more complex and might delay immediate confirmation to the user. A hybrid approach ensures that the critical steps are synchronous (eg: inventory reservation and payment authorization), while non-critical processes run asynchronously.
  
- **Future Scalability:**  
  The current design uses a single SNS topic with subscription filtering (eg: for `order.shipped` events). This design is simple to manage and can be extended to multiple downstream services, each subscribing only to relevant events, ensuring a robust fan-out architecture.


### Abstraction and Decoupling

The messaging layer is abstracted behind a common interface, ensuring that the core business logic remains decoupled from the specific details of the underlying SNS implementation. This abstraction streamlines development and facilitates an eventual transition to a fully message-based architecture.

---

## Technical Decisions

### Technology Stack
- **TypeScript**
- **NestJS**
- **Prisma**
- **PostgrSQL**
- **AWS Services via LocalStack**

### Order Processing Workflow

1. **Order Creation:**  
   - **Validation and Verification:**  
     Customer information and inventory are verified through external (mocked) services.
   - **Payment Authorization:**  
     Payment is authorized synchronously. In the event of a failure, the order is updated to `CANCELED` and inventory is released.
   - **Persistence and State Transition:**  
     The order is initially created in a `PENDING` state and then updated to `PROCESSING` upon successful payment.
   - **Event Publication:**  
     An `order.created` event is published via `MessagingService`, triggering downstream processes.

2. **Shipping Process:**  
   The Shipping Service is invoked (synchronously in the demo) to process shipments. Once the shipment is completed, an `order.shipped` event is published. Downstream consumers, pick up this event and update the order status.
   
```
Customer/Checkout Service
        │
        ▼
[Submit Order via REST API]
        │
        ▼
Order Controller → Order Service
        │
        ├── Synchronously:
        │       • Validate & transform payload (DTOs)
        │       • Verify Customer (basic check)
        |       • Reserve Stock (synchronous call)
        │       • Authorize Payment (synchronous call)
        │       • Persist Order with status “Processing”
        │
        └── Asynchronously:
                • Publish order.created event via SNS
                        │
                        ▼
         Downstream Microservices (asynchronously):
           - Payment Service (finalizes settlement)
           - Shipping Service (initiates shipping)
                        │
                        ▼
             Update Order Status (Processing → Shipped → Delivered)
                        │
                        ▼
              Notify User (via WebSockets or polling)
              
```


### Messaging and Consumer Design

- **Abstraction of Messaging:**  
  Messaging logic is abstacted behind a `MessagingService` interface to decouple business logic from the underlying messaging provider.

- **Single SNS Topic with Subscription Filtering:**  
  Uses one SNS toic per service rather than creating separate topics for each event type. Each downstream consumer subscribes with a filter policy (eg: only `order.shipped` events). This simplifies management, reduces configuration overhead, and scales well.
  
- **Message Attributes and Filtering:**  
  Each published event includes a message attribute (`eventType`) to enable SQS subscriptions to filter messages based on event type, ensuring that each consumer processes only its relevant messages.

- **Continuous Polling and Idempotency:**  
  Consumers poll their SQS queues at regular intervals using a scheduled cron job. After processing a message, the consumer deletes it from the queue to prevent duplicate processing. Business logic methods are designed to be idempotent, ensuring consistency even in the presence of duplicate events.

- **Unique Event Identifiers:**  
  Every event is assigned a unique ULID to facilitate traceability and support idempotency mechanisms. ULIDs are chosen for their lexicographical sorting (consistent with the desgin's IDs).
  
- **Message Deletion:**  
  After successfully processing each message, the consumer deletes it from the queue to avoid reprocessing and infinite loops.

---

## Assumptions

- **Demo Scope vs. Production Requirements:**  
  As the demo is intended to be implemented within a few hours, some external integrations (eg: Customer, Inventory, Payments) are mocked. However, the architecture is designed with production-scale usage in mind.
  
- **External Service Reliability:**  
  We assume that external services (or their mocks) respond in a timely and predictable manner. In a full production environment, additional error handling, retries, and circuit breakers would be implemented.
  
- **Message Duplication and Idempotency:**  
  The system anticipates duplicate events. Unique event identifiers and idempotent business logic ensure that duplicate processing does not result in inconsistent system state.
  
- **LocalStack Environment Fidelity:**  
  It is assumed that LocalStack provides a close approximation of SNS and SQS behavior, allowing the local development environment to reliably mimic production. Environment variables (such as ARNs and queue URLs) are expected to be updated based on actual outputs from LocalStack.

- **Future Scalability:**  
  The design is built to accommodate future enhancements, including the implementation of dead letter queues, advanced monitoring and observability, and a complete shift to an event-sourced architecture.

---

## Deployment to Production

### AWS Services and Deployment Architecture

- **Compute and API Exposure:**  
  The service would be deployed as containerized microservices using ECS or EKS. API Gateway would expose the REST endpoints for external clients. Alternatively, Lambda with API Gateway could be considered for a serverless approach.

- **Database:**  
  RDS (PostgreSQL or Aurora) would serve as the primary data store, ensuring high availability with multi-az deployments. In scenarios with extremely high read volume, DynamoDB could be introduced as a caching layer or for non-relational data.

- **Messaging:**  
  SNS and SQS power the event-driven architecture. SNS would fan out events to multiple SQS queues, each with appropriate filter policies.

- **Storage:**  
  S3 would be used for storing static assets, logs, and backups.

- **Observability and Monitoring:**  
  CloudWatch/OpenTelemetry integrations to monitor system performance, trace event flows, and identify bottlenecks or failures.
  

### Scalability, Availability, and Security

- **Scalability:**  
  Auto-scaling groups for ECS/EKS tasks or Lambda’s built-in scaling would be configured.

- **High Availability:**  
  Deployments would be multi-az to ensure resilience. AWS provides built-in fault tolerance and disaster recovery features.

- **Security:**  
  Security best practices include using IAM roles for service access, enforcing VPC isolation, encrypting data at rest and in transit (using TLS), and regularly auditing access logs. API Gateway would also handle authentication and rate limiting to secure the service endpoints.

- **Infrastructure as Code:**  
  Deployment could be automated using CDK or CloudFormation, ensuring consistent, reproducible environments. CI/CD pipelines (using GitHub Actions, etc.) would manage automated testing, integration, and deployment.
  
---

## Future Work

If given more time, the following would be prioritized:

- **Finishing the implementation:**  
  At present, not all interactions necessary for a complete order experience have been implemented.
  
- **Testing**  
  Have some _actual_ tests. There's zero coverage at present.
  
- **Auth(n/z):**  
  Literally zero authentication or authorization is assumed or implemented, which would be table stakes for any production system.
  
- **Message Envelope:**  
  The message envelope should be abstracted and enhanced from the rudimentary implementation here.

- **Enhanced Error Handling:**  
  Implement dead letter queues and more robust retry mechanisms.
  
- **Complete Message-Based Architecture:**  
  Expand the messaging framework to support full event sourcing and asynchronous processing across all services.
  
- **Observability and Monitoring:**  
  Integrate distributed tracing (such as OpenTelemetry) and advanced logging to monitor event flows and identify bottlenecks.
  
- **API Gateway and CI/CD Pipelines:**  
  Define a complete deployment strategy using automated CI/CD pipelines.
  
- **Refinement of Domain Models and Event Contracts:**  
  Further decouple the internal data model from the event payload to ensure security and maintainability.

---

## Conclusion

This design takes a balanced approach which addresses both immediate demo requirements and long-term scalability. Combining synchronous (RESTful) processing with evented workflows ensures a robust, scalable system capable of handling millions of orders globally.
