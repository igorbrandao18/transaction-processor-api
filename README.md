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

## Deployment - DigitalOcean App Platform

### Prerequisites

1. **DigitalOcean Account** - Sign up at [digitalocean.com](https://www.digitalocean.com)
2. **DigitalOcean API Token** - Generate at [cloud.digitalocean.com/account/api/tokens](https://cloud.digitalocean.com/account/api/tokens)
3. **GitHub Repository** - Code must be in a GitHub repository
4. **doctl CLI** (optional) - For manual deployments: [docs.digitalocean.com/products/doctl](https://docs.digitalocean.com/products/doctl/)

### Setup Instructions

#### 1. Configure GitHub Secrets

Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

- `DIGITALOCEAN_ACCESS_TOKEN` - Your DigitalOcean API token
- `DIGITALOCEAN_PROJECT_NAME` - Your DigitalOcean project name (e.g., `my-project`)
- `DIGITALOCEAN_APP_ID` - Your App Platform app ID (get after creating the app)
- `DIGITALOCEAN_APP_URL` - Your app URL (e.g., `transaction-api-xyz.ondigitalocean.app`)

#### 2. Create App on DigitalOcean App Platform

**Option A: Using DigitalOcean Dashboard**

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Select the repository and branch (`main`)
5. DigitalOcean will auto-detect the `.do/app.yaml` configuration
6. Review and create the app

**Option B: Using doctl CLI**

```bash
# Install doctl
brew install doctl  # macOS
# or download from: https://github.com/digitalocean/doctl/releases

# Authenticate
doctl auth init

# Create app from spec
doctl apps create --spec .do/app.yaml
```

#### 3. Configure Databases

The app will automatically create:
- **PostgreSQL Database** - Managed database cluster
- **Redis Database** - Managed Redis cluster for BullMQ

Database credentials are automatically injected as environment variables.

#### 4. CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **Tests** - Runs unit, integration, and E2E tests on every push/PR
2. **Builds** - Builds Docker image and pushes to DigitalOcean Container Registry
3. **Deploys** - Deploys to App Platform when pushing to `main` branch

**Workflow Steps:**
- ✅ Run tests (unit, integration, E2E)
- ✅ Run linter
- ✅ Build Docker image
- ✅ Push to DigitalOcean Container Registry
- ✅ Deploy to App Platform (only on `main` branch)

#### 5. Manual Deployment

If you need to deploy manually:

```bash
# Update app spec
doctl apps update <APP_ID> --spec .do/app.yaml

# Create new deployment
doctl apps create-deployment <APP_ID>
```

### Environment Variables

The app uses environment variables configured in `.do/app.yaml`. These are automatically set by DigitalOcean App Platform:

- Database connection strings (from managed database)
- Redis connection strings (from managed Redis)
- Application settings (NODE_ENV, PORT, LOG_LEVEL, etc.)

### Monitoring & Logs

**View Logs:**
```bash
# Using doctl
doctl apps logs <APP_ID> --type run

# Or in DigitalOcean Dashboard
# Apps > Your App > Runtime Logs
```

**Health Checks:**
- Health check endpoint: `/health`
- Configured in `.do/app.yaml` with 30s initial delay, 10s interval

**Alerts:**
- Deployment failures
- Domain failures
- Configured in `.do/app.yaml`

### Scaling

The app is configured with:
- **2 instances** (can be adjusted in `.do/app.yaml`)
- **Basic XXS** instance size (512MB RAM, 1 vCPU)
- **Auto-scaling** can be enabled in DigitalOcean dashboard

To scale manually:
```bash
doctl apps update <APP_ID> --spec .do/app.yaml
# Edit instance_count in app.yaml, then update
```

### Cost Estimation

**Monthly costs (approximate):**
- App Platform (2x Basic XXS): ~$12/month
- PostgreSQL Database (Basic): ~$15/month
- Redis Database (Basic): ~$15/month
- **Total: ~$42/month**

*Prices may vary by region and usage*

### Troubleshooting

**Deployment fails:**
1. Check GitHub Actions logs
2. Check DigitalOcean App Platform logs
3. Verify all secrets are set correctly
4. Ensure `.do/app.yaml` is valid

**Database connection errors:**
1. Verify database is created and running
2. Check environment variables are set correctly
3. Verify database credentials in App Platform dashboard

**Build fails:**
1. Check Dockerfile builds locally: `docker build -f docker/Dockerfile -t test .`
2. Verify all dependencies are in `package.json`
3. Check build logs in GitHub Actions

## Docker

### Build and Run with Docker

```bash
# Build image
docker build -f docker/Dockerfile -t transaction-processor-api .

# Run with docker-compose (includes PostgreSQL)
docker-compose -f docker/docker-compose.yml up -d

# Run only app (requires external database)
docker run -p 3000:3000 --env-file .env transaction-processor-api

# Stop services
docker-compose -f docker/docker-compose.yml down

# View logs
docker-compose -f docker/docker-compose.yml logs -f app
```

### Docker Compose Services

- **app** - Application server (port 3000)
- **postgres** - PostgreSQL database (port 5432)
- **pgadmin** - Database management UI (port 5050) - optional, use profile: `docker-compose -f docker/docker-compose.yml --profile tools up`

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
