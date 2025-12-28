#!/bin/bash

set -e

echo "🧹 Cleaning up test database..."

# Drop test database if it exists
if docker ps --format '{{.Names}}' | grep -q 'transaction-db'; then
  docker exec transaction-db psql -U postgres -c "DROP DATABASE IF EXISTS transactions_db_test;" || true
  echo "✅ Test database destroyed"
else
  echo "⚠️ PostgreSQL container is not running. Nothing to clean up."
fi

