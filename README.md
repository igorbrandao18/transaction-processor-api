# Transaction Processor API

A reliable, scalable, and observable transaction processing service built with Node.js and NestJS for a B2B multi-tenant product with high traffic volume and external integrations.

## 🎯 Overview

This service handles financial transaction processing with the following core capabilities:

- **Receive transactions** via REST API
- **Persist transactions** in PostgreSQL database
- **Ensure idempotency** - prevent duplicate processing even under concurrent load
- **Query transactions** with filtering and pagination

## 🏗️ Architecture & Technical Decisions

### Why This Architecture?

The project follows a **Layered Architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────┐
│  Presentation Layer (Controllers)    │ ← HTTP requests/responses
├─────────────────────────────────────┤
│  Application Layer (Services)       │ ← Business logic & orchestration
├─────────────────────────────────────┤
│  Domain Layer (Entities)            │ ← Domain models & types
├─────────────────────────────────────┤
│  Infrastructure Layer (Repositories) │ ← Data access & persistence
└─────────────────────────────────────┘
```

**Benefits:**
- **Testability**: Each layer can be tested independently
- **Maintainability**: Clear boundaries make code easier to understand and modify
- **Scalability**: Easy to add caching, queues, or other infrastructure without touching business logic
- **Flexibility**: Can swap database implementations without affecting services

### Patterns Implemented

1. **Repository Pattern**: Abstracts data access, making it easy to mock for testing and swap implementations
2. **Service Layer Pattern**: Centralizes business logic and ensures idempotency
3. **DTO Pattern**: Validates input and controls data exposure
4. **Dependency Injection**: NestJS DI container manages dependencies

### Technology Stack

- **Runtime**: Node.js
- **Framework**: NestJS (TypeScript-first, modular architecture)
- **Database**: PostgreSQL (relational, ACID compliance)
- **Database Access**: Raw SQL with `pg` driver (performance-focused, no ORM overhead)
- **Queue**: BullMQ (Redis-backed) for async processing
- **Logging**: Winston with structured JSON logs
- **Validation**: class-validator for DTO validation
- **API Docs**: Swagger/OpenAPI

## 🔍 Idempotency Implementation

Idempotency is **critical** for financial transactions. The implementation uses multiple layers:

1. **Database Level**: `UNIQUE INDEX` on `transaction_id` column
2. **Application Level**: Check for existing transaction before insert
3. **Concurrency Handling**: `SELECT ... FOR UPDATE` with database transactions
4. **Race Condition Protection**: Try-catch with duplicate key error handling

```typescript
// Repository uses FOR UPDATE lock to prevent race conditions
await client.query('SELECT * FROM transactions WHERE transaction_id = $1 FOR UPDATE', [transactionId]);
```

## 📊 Bottlenecks & Production Concerns

### Where Would Be the Bottleneck?

**Primary Bottleneck: Database Write Operations**

1. **Database Connection Pool**: Under high concurrent load, the connection pool can become exhausted
2. **Write Contention**: Multiple transactions trying to insert simultaneously compete for locks
3. **Index Maintenance**: The `UNIQUE INDEX` on `transaction_id` needs to be checked on every insert
4. **Transaction Isolation**: `FOR UPDATE` locks can create contention when checking idempotency

**Secondary Bottlenecks:**
- **API Request Handling**: Without rate limiting, the API can be overwhelmed
- **Logging**: Synchronous logging can block the event loop under extreme load

### First Real Problem in Production

**Database Connection Pool Exhaustion**

Under high concurrent load (e.g., 1000+ requests/second), the PostgreSQL connection pool will be exhausted. This leads to:

- Requests timing out waiting for available connections
- Cascading failures as requests queue up
- Potential deadlocks when multiple transactions compete for the same `transaction_id`

**Symptoms:**
- Slow response times
- `ECONNREFUSED` or connection timeout errors
- Database connection pool errors in logs

### First Solution to Prioritize

**Implement Queue-Based Processing (BullMQ)**

**Why this first:**
1. **Decouples API from Database**: API responds immediately, processing happens async
2. **Natural Rate Limiting**: Queue workers process at controlled rate
3. **Better Resource Management**: Fewer concurrent database connections needed
4. **Retry Logic**: Built-in retry mechanism for transient failures
5. **Monitoring**: Queue metrics provide visibility into processing health

**Implementation:**
- API endpoint receives transaction → adds to queue → returns 202 Accepted
- Worker processes transactions from queue at controlled rate
- Idempotency still enforced at database level

**Alternative Quick Wins:**
- Increase database connection pool size
- Add Redis caching for read operations
- Implement rate limiting at API gateway level

## 💾 Cache Strategy

### Where to Use Cache

**✅ Use Cache For:**

1. **Read Operations** (`GET /transactions`)
   - Cache frequently accessed transactions by ID
   - Cache paginated results with TTL (e.g., 5 minutes)
   - Cache filter combinations (status, type, date ranges)
   - **Key Pattern**: `transaction:{id}` or `transactions:list:{page}:{limit}:{filters}`

2. **Idempotency Checks**
   - Cache recent transaction IDs to avoid database lookup
   - Short TTL (30 seconds) - just enough to handle rapid retries
   - **Key Pattern**: `transaction:exists:{transactionId}`

3. **Health Check Data**
   - Cache database connection status
   - Cache queue metrics
   - **TTL**: 10-30 seconds

### ❌ Don't Use Cache For:

1. **Write Operations** (`POST /transactions`)
   - Financial data must be immediately consistent
   - Cache invalidation complexity not worth the risk

2. **Real-time Transaction Status**
   - Users need latest status immediately
   - Cache could show stale data

3. **Critical Financial Data**
   - Regulatory compliance requires accurate, real-time data
   - Cache adds risk of showing incorrect balances

**Cache Implementation:**
- **Redis** for distributed caching
- **Cache-Aside Pattern**: Application checks cache, falls back to database
- **Write-Through** for idempotency checks (write to both cache and DB)

## 📈 Observability in Production

### Logging

- **Structured Logging**: Winston with JSON format
- **Log Levels**: Error, Warn, Info, Debug
- **Context**: Transaction IDs, user IDs, request IDs in all logs
- **Log Aggregation**: Send to centralized system (e.g., ELK, Datadog, CloudWatch)

### Metrics

- **Prometheus Metrics**: Request rate, latency, error rate
- **Custom Metrics**: Transactions processed, queue depth, database connection pool usage
- **Endpoint**: `/metrics` for Prometheus scraping

### Tracing

- **Request IDs**: Unique ID per request, propagated through all layers
- **Distributed Tracing**: Use OpenTelemetry for microservices (if applicable)
- **Database Query Tracing**: Log slow queries (>100ms)

### Health Checks

- **`/health` Endpoint**: Database connectivity, queue connectivity, disk space
- **`/health/ready`**: Application ready to accept traffic
- **`/health/live`**: Application is alive (for Kubernetes liveness probe)

### Alerting

- **Error Rate**: Alert if error rate > 1% for 5 minutes
- **Latency**: Alert if p95 latency > 500ms
- **Queue Depth**: Alert if queue depth > 1000 jobs
- **Database Connections**: Alert if connection pool > 80% utilized

## 🔄 When to Use Queue/Messaging

### Use Queue For:

1. **High Volume Processing**
   - When API receives more requests than can be processed synchronously
   - **Current Implementation**: BullMQ processes transactions asynchronously

2. **External API Calls**
   - When calling external payment gateways or webhooks
   - Prevents blocking the main API thread
   - Enables retry logic for failed external calls

3. **Batch Processing**
   - Processing multiple transactions in batches
   - Scheduled jobs (e.g., daily reconciliation)

4. **Decoupling Services**
   - When transaction processing needs to trigger other services
   - Event-driven architecture (e.g., send notification after transaction)

5. **Rate Limiting External APIs**
   - When external APIs have rate limits
   - Queue workers can respect rate limits

### Don't Use Queue For:

1. **Simple CRUD Operations**
   - If processing is fast (<10ms), queue adds unnecessary complexity

2. **Real-time Requirements**
   - When user needs immediate response (e.g., payment confirmation)

3. **Low Volume**
   - If traffic is <100 req/min, synchronous processing is simpler

**Current Implementation:**
- BullMQ with Redis backend
- Async processing with retry logic
- Job deduplication using `transactionId` as job ID

## 🧪 Testing Strategy

### Test Coverage

- **Unit Tests**: 100% statement coverage
- **Integration Tests**: API endpoints with real database
- **E2E Tests**: Full flow from API to database
- **Idempotency Tests**: Concurrent requests with same `transactionId`

### Running Tests

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# All tests
npm run test:all
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis (for BullMQ)
- Docker & Docker Compose (optional)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
npm run migrate

# Start development server
npm run start:dev
```

### Docker Setup

```bash
cd docker
docker compose up -d
```

### API Documentation

Once running, access Swagger documentation at:
- **URL**: `http://localhost:3000/api/docs`

### Observability Stack (Grafana & Prometheus)

Para acessar Grafana e Prometheus em produção:

- **Grafana**: `https://challenge.brandaodeveloper.com.br/grafana`
  - Usuário padrão: `admin`
  - Senha padrão: `admin` (⚠️ altere após o primeiro acesso!)
  
- **Prometheus**: `https://challenge.brandaodeveloper.com.br/prometheus`

**Configuração no Servidor:**

1. Adicione as rotas do Nginx conforme descrito em `docker/nginx/README.md`
2. Inicie os serviços de observabilidade:
   ```bash
   cd docker
   docker compose --profile observability up -d
   ```

Para desenvolvimento local:
- **Grafana**: `http://localhost:3001` (usuário: `admin`, senha: `admin`)
- **Prometheus**: `http://localhost:9090`

## 📝 API Endpoints

### Create Transaction
```http
POST /transactions
Content-Type: application/json

{
  "transactionId": "txn_123456",
  "amount": 100.50,
  "currency": "USD",
  "type": "credit",
  "metadata": {}
}
```

### Get Transaction
```http
GET /transactions/:id
```

### List Transactions
```http
GET /transactions?page=1&limit=20&status=pending&type=credit
```

### Health Check
```http
GET /health
```

## 🔧 Configuration

Key environment variables:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=transactions_db
DB_USER=postgres
DB_PASSWORD=postgres

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=3000
NODE_ENV=development
```

## 🏛️ Technical Debt (Conscious Decisions)

### 1. **No Database Migrations Tool**
- Currently using raw SQL migration files
- **Why**: Simplicity for this project size
- **Future**: Consider Prisma Migrate or TypeORM migrations for larger projects

### 2. **Raw SQL Instead of ORM**
- Using `pg` driver directly
- **Why**: Performance and control over queries
- **Trade-off**: More boilerplate, but better performance

### 3. **Synchronous Logging**
- Winston logs synchronously
- **Why**: Simplicity
- **Future**: Use async transports or log to queue for high volume

### 4. **No Multi-Tenancy Implementation**
- Single database for all tenants
- **Why**: Out of scope for MVP
- **Future**: Add tenant isolation (schema per tenant or tenant_id column)

### 5. **No Event Sourcing**
- Traditional CRUD approach
- **Why**: Complexity vs. benefit for current requirements
- **Future**: Consider for audit trail requirements

### 6. **Limited Error Recovery**
- Basic retry logic in queue
- **Why**: MVP scope
- **Future**: Dead letter queue, exponential backoff, circuit breakers

### 7. **No API Versioning**
- Single API version
- **Why**: Early stage, no breaking changes yet
- **Future**: Add `/v1/` prefix when needed

## 📚 Project Structure

```
src/
├── controllers/       # HTTP request handlers
├── services/          # Business logic
├── repositories/      # Data access layer
├── entities/          # Domain models
├── dto/              # Data transfer objects
├── queues/           # Queue management
├── processors/       # Queue job processors
├── middleware/       # Express middleware
├── filters/          # Exception filters
├── config/           # Configuration modules
└── utils/            # Utility functions

test/
├── unit/             # Unit tests
├── integration/       # Integration tests
└── e2e/              # End-to-end tests
```

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Write tests for new features
3. Ensure all tests pass before committing
4. Follow TypeScript and ESLint rules

## 📄 License

UNLICENSED

---

**Built with ❤️ for reliable financial transaction processing**
