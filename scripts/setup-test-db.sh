#!/bin/bash

set -e

echo "🔧 Setting up test database..."

# Check if PostgreSQL container is running
if docker ps --format '{{.Names}}' | grep -q 'transaction-db'; then
  echo "✅ PostgreSQL container is running"
  
  # Create test database if it doesn't exist
  docker exec transaction-db psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'transactions_db_test'" | grep -q 1 || \
    docker exec transaction-db psql -U postgres -c "CREATE DATABASE transactions_db_test;" && \
    echo "✅ Test database created"
  
  # Run migrations
  echo "🔄 Running migrations..."
  NODE_ENV=test \
  DB_HOST=localhost \
  DB_PORT=5432 \
  DB_USER=postgres \
  DB_PASSWORD=postgres \
  DB_NAME=transactions_db_test \
  npm run migrate || echo "⚠️ Migrations may have already been applied"
  
  echo "✅ Test database setup complete"
else
  echo "⚠️ PostgreSQL container is not running. Starting it..."
  cd docker
  docker compose up -d db redis
  sleep 5
  
  # Wait for PostgreSQL to be ready
  timeout=30
  elapsed=0
  while [ $elapsed -lt $timeout ]; do
    if docker exec transaction-db pg_isready -U postgres > /dev/null 2>&1; then
      echo "✅ PostgreSQL is ready"
      break
    fi
    echo "Waiting for PostgreSQL... ($elapsed/$timeout seconds)"
    sleep 2
    elapsed=$((elapsed + 2))
  done
  
  # Create test database
  docker exec transaction-db psql -U postgres -c "CREATE DATABASE transactions_db_test;" || echo "Database may already exist"
  
  # Run migrations
  cd ..
  NODE_ENV=test \
  DB_HOST=localhost \
  DB_PORT=5432 \
  DB_USER=postgres \
  DB_PASSWORD=postgres \
  DB_NAME=transactions_db_test \
  npm run migrate || echo "⚠️ Migrations may have already been applied"
  
  echo "✅ Test database setup complete"
fi

