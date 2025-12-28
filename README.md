# Transaction Processor API

Financial transaction processing service built with NestJS, TypeScript, and PostgreSQL.

## Features

- ✅ Receive financial transactions via API
- ✅ Persist transactions in PostgreSQL
- ✅ **Idempotency** - Same transaction cannot be processed twice (handles concurrency)
- ✅ Query transactions with filters and pagination
- ✅ Structured logging with Winston
- ✅ Error handling middleware
- ✅ Input validation with class-validator
- ✅ **Rate Limiting** - 100 requests/minute per IP (@nestjs/throttler)
- ✅ **Health Check** - GET /health endpoint for monitoring
- ✅ **Swagger/OpenAPI** - Interactive API documentation at /api/docs
- ✅ **Enhanced Validations** - Currency codes (ISO 4217), amount precision
- ✅ **Docker Support** - Dockerfile and docker-compose.yml
- ✅ **Comprehensive Tests** - Unit, Integration, E2E, and Load tests (k6)

## Architecture

This project follows **Layered Architecture** pattern:

- **Presentation Layer** (Controllers) - Handles HTTP requests
- **Application Layer** (Services) - Business logic and orchestration
- **Domain Layer** (Entities) - Domain models and types
- **Infrastructure Layer** (Repositories) - Data access abstraction

### Patterns Used

1. **Repository Pattern** - Abstracts data access
2. **Service Layer Pattern** - Centralizes business logic
3. **DTO Pattern** - Separates input/output data
4. **Dependency Injection** - NestJS built-in DI

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your database credentials
```

## Database Setup

```bash
# Create database
createdb transactions_db

# Run migrations
npm run migrate
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## API Endpoints

### POST /transactions
Create a new transaction

**Request:**
```json
{
  "transactionId": "unique-transaction-id-123",
  "amount": 100.50,
  "currency": "BRL",
  "type": "credit",
  "metadata": {
    "source": "payment-gateway",
    "reference": "order-123"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "uuid",
  "transactionId": "unique-transaction-id-123",
  "amount": 100.50,
  "currency": "BRL",
  "type": "credit",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Response (409 Conflict - Duplicate):**
```json
{
  "error": "Transaction already exists",
  "transactionId": "unique-transaction-id-123",
  "existingTransaction": { ... }
}
```

### GET /transactions
List transactions with pagination

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string, optional: "pending" | "completed" | "failed")
- `type` (string, optional: "credit" | "debit")
- `startDate` (ISO string, optional)
- `endDate` (ISO string, optional)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /transactions/:id
Get transaction by ID

**Response:**
```json
{
  "id": "uuid",
  "transactionId": "unique-transaction-id-123",
  "amount": 100.50,
  "currency": "BRL",
  "type": "credit",
  "status": "pending",
  "metadata": {...},
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Idempotency Strategy

The system ensures idempotency through:

1. **Unique Index** on `transaction_id` column in database
2. **Database Transactions** (BEGIN/COMMIT) for atomicity
3. **SELECT FOR UPDATE** to handle concurrent requests
4. **Conflict Detection** - Returns 409 if transaction already exists

### Flow:
```
1. Receive request with transactionId
2. Start database transaction (BEGIN)
3. Check if transactionId exists (SELECT FOR UPDATE)
4a. If NOT exists → Insert new transaction
4b. If EXISTS → Return existing transaction
5. Commit transaction (COMMIT)
```

## Project Structure

```
src/
├── controllers/          # Presentation Layer
│   └── transactions.controller.ts
├── services/             # Application Layer
│   └── transactions.service.ts
├── repositories/         # Infrastructure Layer
│   └── transactions.repository.ts
├── entities/            # Domain Layer
│   └── transaction.entity.ts
├── dto/                 # Data Transfer Objects
│   ├── create-transaction.dto.ts
│   └── query-transactions.dto.ts
├── middleware/          # Custom middlewares
│   ├── error-handler.middleware.ts
│   └── logger.middleware.ts
├── config/             # Configuration
│   ├── database.config.ts
│   └── logger.config.ts
└── main.ts            # Entry point
```

## Environment Variables

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=transactions_db
LOG_LEVEL=info
```

## Testing

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test

# Test coverage
npm run test:cov

# Load tests (requires k6)
npm run test:load
# Or: k6 run test/load/transactions.load.js
```

### Test Structure

- **Unit Tests** (`test/unit/`) - Test individual components in isolation
- **Integration Tests** (`test/integration/`) - Test API endpoints with real database
- **E2E Tests** (`test/e2e/`) - Test complete user flows
- **Load Tests** (`test/load/`) - Performance testing with k6

### Running Tests

Before running tests, make sure you have:
1. Test database created: `createdb transactions_db_test`
2. `.env.test` file configured (copy from `.env.test.example`)
3. Migrations run on test database

## Docker

### Build and Run with Docker

```bash
# Build image
docker build -t transaction-processor-api .

# Run with docker-compose (includes PostgreSQL)
docker-compose up -d

# Run only app (requires external database)
docker run -p 3000:3000 --env-file .env transaction-processor-api

# Stop services
docker-compose down

# View logs
docker-compose logs -f app
```

### Docker Compose Services

- **app** - Application server (port 3000)
- **postgres** - PostgreSQL database (port 5432)
- **pgadmin** - Database management UI (port 5050) - optional, use profile: `docker-compose --profile tools up`

### Environment Variables

Docker Compose uses environment variables from `.env` file. Make sure to create it from `.env.example`.

## Production Considerations

### Bottlenecks Identified:

1. **Database Connection Pool** - Limited by pool size (currently 20)
2. **Single Database Instance** - No read replicas
3. **Synchronous Processing** - No queue for high volume

### First Real Problem in Production:

**Database Connection Exhaustion** - Under high concurrent load, the connection pool will be exhausted, causing requests to wait or timeout.

### Priority Solution:

1. **Implement Connection Pooling Optimization**
   - Increase pool size based on load
   - Implement connection retry logic
   - Add connection health checks

2. ~~**Add Rate Limiting**~~ ✅ **IMPLEMENTED**
   - ✅ Rate limiting with @nestjs/throttler (100 req/min per IP)
   - ✅ Prevents abuse and protects database from overload

3. **Consider Message Queue** (BullMQ/RabbitMQ)
   - For async processing
   - Better handling of spikes
   - Decouple API from processing

## Architecture Decisions

### Why this organization?

- **Separation of Concerns** - Each layer has a single responsibility
- **Testability** - Easy to mock repositories for unit tests
- **Maintainability** - Changes in one layer don't affect others
- **Scalability** - Can optimize each layer independently

### Where would you put cache?

- **GET /transactions** - Cache paginated results (Redis)
- **GET /transactions/:id** - Cache individual transactions
- **NOT cache** - POST /transactions (must be real-time)

### How to ensure observability?

- **Structured Logs** - JSON format with Winston
- **Request/Response Logging** - Middleware logs all requests
- **Error Tracking** - Centralized error logging
- **Metrics** - Add Prometheus metrics (future)
- **Distributed Tracing** - Add OpenTelemetry (future)

### When to use queue/messaging?

- **High Volume Spikes** - When traffic exceeds database capacity
- **Async Processing** - When transactions need background processing
- **Reliability** - When you need guaranteed delivery
- **Decoupling** - When you want to scale API and processing separately

### Technical Debt:

1. **No Database Migrations Tool** - Using simple SQL files
2. **No Connection Retry Logic** - Should retry on connection failures
3. **No Rate Limiting** - Should implement to prevent abuse
4. **No Caching** - Should add Redis for frequently accessed data
5. **No Health Checks** - Should add /health endpoint
6. **No API Documentation** - Should add Swagger/OpenAPI

## License

UNLICENSED
