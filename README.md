# Legislative News API

## Description

This project is a robust, scalable API for managing legislative news using NestJS. It integrates with external news APIs to aggregate and import articles, utilizes cron jobs for automated data fetching, and provides real-time notifications to clients via WebSockets. The modular architecture in NestJS allows for horizontal scalability, while Prisma supports efficient data handling, optimized for high traffic and search performance.

## Features

- **Swagger API Documentation**: Automatically generated API documentation for all endpoints, accessible at `/docs`.
- **Cron Job Management**: Configurable cron jobs to periodically fetch news from external APIs. The cron jobs can be started, paused, and managed as needed.
- **Deduplication Strategy**: Prevents duplicate articles by tracking the last published date for each source and fetching only new articles since that date.
- **Real-Time Notifications with WebSockets**: Clients can subscribe to their preferred news channels to receive real-time updates when relevant news articles are published.
- **Modular Architecture**: Each external API integration is encapsulated in its own module, facilitating scalability and maintainability as new sources or features are added.
- **Database Configuration and Repository Pattern**: Database operations are managed through a repository pattern, allowing isolated unit testing and a clear separation of data access logic.
- **Centralized Configuration**: Environment variables provide easy configuration for API keys, cron job intervals, WebSocket settings, and other parameters.
- **Unit and Integration Testing**: Extensive testing structure for each module, ensuring that each component works independently and integrates smoothly with others.
- **Scalability and Performance Optimizations**: Uses Prisma to optimize database access and search functionality, with potential for Prisma Accelerate for high-traffic applications.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Using WebSockets](#using-websockets)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [News Aggregation Strategy](#news-aggregation-strategy)
- [Dynamic Cron Job Interval Management](#dynamic-cron-job-interval-management)
- [Postman Collection](#postman-collection)
- [Scalability Considerations](#scalability-considerations)
- [Best Practices and Considerations](#best-practices-and-considerations)
- [Future Improvements](#future-improvements)

## Prerequisites

- Node.js v14 or later
- Docker (optional, recommended for development and production)
- PostgreSQL or MySQL as the database

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd legislative-news-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

## Configuration

1. Create a `.env` file in the project root directory:

   ```plaintext
   # Application Port
   NEST_API_PORT=3001

   # Database Configuration
   DATABASE_URL="mysql://<username>:<password>@localhost:3306/legislative_news"

   # External API
   NEWS_API_URL="https://newsapi.org/v2/top-headlines"
   NEWS_API_KEY=<api_key>

   # Cron Job Intervals
   NEWS_API_CRON_INTERVAL=10m
   NEWS_API_LIMIT=100  # Maximum articles per fetch

   # WebSocket Configuration
   WEBSOCKETS_PORT=3002

   # Swagger
   SWAGGER_TITLE="Legislative News API"
   SWAGGER_DESCRIPTION="API for managing legislative news"
   ```

2. Configure `prisma/schema.prisma` with the database schema and run migrations:

   ```bash
   npx prisma migrate dev --name init
   ```

## Running the Application

1. **Development**:

   ```bash
   npm run start:dev
   ```

2. **Production**:

   ```bash
   npm run build
   npm run start:prod
   ```

3. **With Docker**:

   ```bash
   docker-compose up --build
   ```

## API Documentation

Access Swagger-generated API documentation at:

```
http://localhost:3001/docs
```

Swagger provides detailed documentation of each API endpoint and parameters.

## Using WebSockets

1. Connect to the WebSocket server at the specified port.
2. Subscribe to preferred news channels (e.g., by topic) to receive notifications when new articles are published.

## Running Tests

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

The tests are run against a dedicated testing environment.

## Project Structure

```plaintext
src
├── app.module.ts            # Main module
├── common
│   ├── interfaces            # Common interfaces
│   └── news-repository       # Repository for news operations
├── websockets                # WebSockets for real-time notifications
├── newsapi                   # Module for external news API integration
│   ├── cron                  # Cron job management service
│   ├── news-api.controller.ts
│   ├── news-api.service.ts
│   └── cron.service.ts       # Cron service for the news API
├── main.ts                   # Application and Swagger setup
└── prisma
    ├── migrations            # Prisma migrations
    └── schema.prisma         # Prisma schema definition
```

## News Aggregation Strategy

- **Deduplication**: A `lastPublishedDate` field in the database prevents duplicates by fetching only new articles published after the last stored date. Each article is also validated using a unique slug.
- **Data Storage**: Articles are stored in a relational database (PostgreSQL or MySQL), with Prisma handling efficient queries and data indexing.
- **Modularized Sources**: Each external API is encapsulated in a dedicated module, ensuring clean code separation and simplified future expansion.

## Dynamic Cron Job Interval Management

This application uses a dynamic interval management approach for cron jobs,
allowing them to adjust automatically based on configurations stored in the database.
Instead of requiring redeployment for each interval change, the cron job can detect updates and adapt in real time.

### Benefits

- **Reduced Downtime**: Adjustments to cron intervals can be made without restarting or redeploying the application, ensuring continuous availability.
- **Real-Time Adaptability**: The system can respond to changing requirements or workloads, making it more responsive to varying demands.
- **Centralized Control**: With interval settings stored in the database, it’s easy to manage and update configurations from a single location, enhancing maintainability and scalability.
- **Improved Monitoring**: Storing cron configurations in the database also enables tracking and auditing of interval changes over time, which helps with performance optimization.

## Postman Collection

A Postman collection, `Legislative News Aggregator.postman_collection.json`,
is available in the `postman_collection` folder.
Import it into Postman for easy API testing and management of cron job operations.

With this collection, you can:

- **Start/Stop Cron Jobs**: Manage cron jobs for fetching news articles.
- **Update Cron Parameters**: Adjust cron intervals and limits dynamically.

This approach offers flexibility and operational efficiency, ideal for production environments where uptime and adaptability are essential.

## Scalability Considerations

- **Database Indexing**: Indexed columns (such as publication date and topic) ensure fast searches, even with large datasets.
- **Horizontal Scalability**: The modular architecture in NestJS allows the API to scale horizontally. Each new API integration can be added as a separate module, which does not interfere with existing modules.
- **Prisma Accelerate**: For high-traffic environments, Prisma Accelerate can further optimize queries and reduce latency, ensuring the API can handle thousands of requests.

## Best Practices and Considerations

1. **Repository Pattern**: Ensures database operations are handled in a separate layer, making unit testing straightforward and enforcing separation of concerns.
2. **Modularization**: Each external API integration has a dedicated module, providing organization and supporting scalability.
3. **Swagger Documentation**: Automatically generated documentation with Swagger improves usability and integration.
4. **Environment Variables**: Sensitive configurations are managed through environment variables, adding security and flexibility in different environments.

## Future Improvements

- **CI/CD Pipeline**: Implement a CI/CD pipeline for automated testing and deployment.
- **Pre-Commit Checks with Husky**: Integrate Husky and lint-staged to enforce code standards before each commit.
- **Retry Mechanism for WebSockets**: Improve resilience by adding a retry mechanism for failed WebSocket connections.
- **Advanced Error Handling**: Add more detailed error handling for cron job failures to prevent data loss.
- **Optimized Search**: Enhance search efficiency with full-text search or additional indexes for high-volume datasets.

## Advanced News Aggregation with AI

As I expand this project to incorporate multiple news sources, I plan to leverage AI (like OpenAI's models) to enhance content quality, avoid redundancy, and personalize user experiences. Each external source will be treated as a separate module, implementing common interfaces for cron jobs, data fetching, and database interactions. This structure ensures consistency and scalability.

### AI-Powered Deduplication and Quality Control

To prevent users from seeing duplicate or redundant news articles, I’ll implement an AI-driven approach for deduplication and content analysis:

1. **Slug-Based Deduplication**: I’ll generate a unique slug from each article title and use it to identify duplicates before storing new articles in the database.
2. **AI Similarity Check**: For more nuanced duplication detection, the AI will compare new articles to existing ones in the same topic or within an adjustable date range. If a similar article already exists, AI can decide to skip, replace, or improve the content based on quality.
3. **Pending and Ready-to-Publish States**: Articles that pass these checks are marked "ready to publish." If uncertain, they are marked as "pending" for further analysis by the AI, which will either approve or discard them.

### Personalized User Subscriptions

To enhance user engagement, I’ll offer a customizable subscription feature:

- **Topic and Keyword Subscriptions**: Users can subscribe to specific topics (like "Sports") and even set up keyword filters for subtopics (e.g., their favorite soccer team). This data will be stored and managed through a user preferences service.
- **Real-Time Updates**: Using WebSockets, I’ll notify users in real time when new articles matching their preferences are ready, ensuring they stay up-to-date on relevant news.
- **AI-Powered Relevance Filtering**: AI can further refine notifications, suppressing duplicates and prioritizing unique content within the user’s interests.

### High-Level Solution Architecture

To achieve scalability, I envision a microservices architecture:

- **Modular Source Integration**: Each news source operates as a microservice, implementing common interfaces for cron jobs, data fetching, and storage.
- **AI Processing Pipeline**: A dedicated AI service will handle deduplication, quality assessment, and readiness checks, publishing results to a notification system.
- **Event-Driven Communication**: I’ll use a message broker like RabbitMQ or Kafka to manage inter-service communication, allowing for efficient and scalable event handling.
- **User Preferences and Notifications**: User preferences will guide real-time updates through WebSockets, ensuring each user gets timely and relevant notifications.

This setup will allow me to manage large volumes of unique, high-quality news while providing a highly personalized user experience.

### Prisma Accelerate for High-Volume Data

As the application grows, managing large amounts of data efficiently becomes essential. **Prisma Accelerate** is an optimization tool for Prisma that can enhance performance in production, especially in high-traffic environments.

#### Benefits of Using Prisma Accelerate

1. **Faster Queries**: Prisma Accelerate batches multiple queries and caches data intelligently, reducing the load on the database and speeding up data retrieval—ideal for handling large datasets.

2. **Lower Latency**: By optimizing data fetching, it reduces response times, which is critical for real-time updates and user notifications, making the app feel faster and more responsive.

3. **Scalability**: Prisma Accelerate allows the app to handle a high volume of concurrent users and requests efficiently, supporting growth without sacrificing performance.

4. **Cost Savings**: Reducing a database load can also lower infrastructure costs by minimizing the resources required for high performance.

#### When to Use Prisma Accelerate

Prisma Accelerate is ideal for production setups where performance and responsiveness are crucial, especially in data-heavy applications like this news aggregator. It helps ensure the app stays fast and scalable, even as data and user numbers increase.

## Deduplication Strategy

To avoid duplicating articles imported from the external API:

1. **Control Table**: A control table in the database stores the last published date (`lastPublishedDate`).

2. **Filtered Query**: The cron job fetching articles from the external API queries from this `lastPublishedDate` to the current date, and limits the results according to `NEWS_API_LIMIT`.

3. **Import Logic**:
    - After each execution, `lastPublishedDate` in the database is updated.
    - When the cron job runs again, the API will only return articles published after this date, reducing the chance of importing duplicates.

4. **Dynamic Configuration**: The start date and maximum article limit are defined in the `.env` file, simplifying customization and preventing duplicate imports.
5. **Error Handling**: In case of errors, the cron job will retry the import, ensuring no data loss or duplication.
6. **Slug validation**: Each article is validated against its slug to prevent importing the same article multiple times.
7. **Manual Control**: The cron job can be paused, resumed, or removed manually, providing full control over the import process.
