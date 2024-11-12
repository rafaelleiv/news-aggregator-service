Here's the `README.md` in English with detailed descriptions of the project's features, including strategies to prevent duplicates, cron job management, and overall project structure:

---

# Legislative News API

## Description

This project is a NestJS-based API for managing legislative news, integrating with external APIs to import articles, handling cron jobs for scheduled tasks, real-time notifications via WebSockets, and modular design to maintain a scalable and organized solution.

## Features

- **Swagger API Documentation**: Automatically generated, detailed documentation of API endpoints, accessible at `/docs`.
- **Cron Job Management**: Automated scheduling for news imports from external APIs, with dynamic control to start, pause, and remove jobs.
- **Deduplication Strategy**: Stores the last published date, and each cron job query uses this date to fetch new articles, avoiding duplicates.
- **Real-Time Notifications with WebSockets**: Notifies clients in real-time when new articles are published in topics they are subscribed to.
- **Repository Pattern**: Manages database operations through a repository pattern, allowing isolated unit testing and clear separation of data access logic.
- **Modular Architecture**: Each external API is handled in its own module, making the project scalable and maintainable.
- **Centralized Configuration**: Environment variables to set intervals, external API details, and more.
- **Unit and Integration Testing**: Test structure for each module, enabling isolated verification of each solution component.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Using WebSockets](#using-websockets)
- [Running Tests](#running-tests)
- [Project Structure](#project-structure)
- [Deduplication Strategy](#deduplication-strategy)
- [Best Practices and Considerations](#best-practices-and-considerations)

## Prerequisites

- Node.js v14 or later
- Docker (optional, recommended for development)
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
   # Database
   DATABASE_URL=mysql://<username>:<password>@localhost:3306/<database_name>

   # External API configuration
   NEWS_API_URL=<external_api_url>
   NEWS_API_KEY=<api_key>

   # Cron job intervals
   NEWS_API_CRON_INTERVAL=10m
   NEWS_API_LIMIT=100  # Maximum articles per query

   # WebSocket configuration
   WEBSOCKETS_PORT=3002

   # Swagger
   SWAGGER_TITLE=Legislative News API
   SWAGGER_DESCRIPTION=API for managing legislative news
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

3. **With Docker** (recommended for development and production):

   ```bash
   docker-compose up --build
   ```

## API Documentation

Swagger-generated API documentation is available at:

```
http://localhost:3001/docs
```

Swagger documents all available endpoints and their parameters.

## Using WebSockets

To receive real-time notifications for new articles:
1. Connect to the WebSockets port specified in the environment variables.
2. Subscribe to news topics (`news_topic`) to receive notifications in real-time when new articles are published in the database.

## Running Tests

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
npm run test:e2e
```

Tests are configured to run against a testing environment in the database.

## Project Structure

```plaintext
src
├── app.module.ts            # Main module
├── common
│   ├── interfaces            # Common interfaces
│   └── news-repository       # Repository for news operations
├── websockets                # WebSockets for real-time notifications
├── newsapi                   # Module to integrate with the news API (https://newsapi.org)
│   ├── cron                  # Cron job management service
│   ├── news-api.controller.ts
│   ├── news-api.service.ts
│   └── cron.service.ts       # Cron service for the news API
├── main.ts                   # Application and Swagger setup
└── prisma
    ├── migrations            # Prisma migrations
    └── schema.prisma         # Prisma schema definition
```

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

## Best Practices and Considerations

1. **Repository Pattern**: The repository pattern manages data access logic separately, facilitating testing.
2. **Modularization**: Each external API has its own module, which keeps the project organized and scalable.
3. **Testing**: The project is designed to allow isolated unit and integration testing of each functionality, simplifying maintenance and code expansion.
4. **Swagger Documentation**: The API is automatically documented with Swagger, making it easy for developers to use and integrate.
5. **Environment Variables**: Be sure to use environment variables in production to avoid exposing sensitive configurations.

## TODO
- [ ] Add tests for the WebSocket service
- [ ] Implement a retry mechanism for failed WebSocket connections
- [ ] Add more detailed error handling for the cron job service
- [ ] Finish implementing web sockets for real-time notifications
- [ ] Ad CICD pipeline for automated testing and deployment
- [ ] Add husky and lint-staged for pre-commit checks
