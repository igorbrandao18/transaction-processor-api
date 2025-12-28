import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const transactionDuration = new Trend('transaction_duration');
const createdTransactions = new Counter('transactions_created');
const duplicateTransactions = new Counter('transactions_duplicate');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 users
    { duration: '1m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Stay at 100 users
    { duration: '1m', target: 50 }, // Ramp down to 50 users
    { duration: '30s', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    errors: ['rate<0.01'], // Custom error rate < 1%
    transaction_duration: ['p(95)<500', 'p(99)<1000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Generate unique transaction ID
function generateTransactionId() {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Generate random transaction data
function generateTransaction() {
  const types = ['credit', 'debit'];
  const amounts = [100, 200, 500, 1000, 2000, 5000];
  
  return {
    transactionId: generateTransactionId(),
    accountId: `account-${Math.floor(Math.random() * 1000)}`,
    amount: amounts[Math.floor(Math.random() * amounts.length)],
    type: types[Math.floor(Math.random() * types.length)],
  };
}

export default function () {
  const transaction = generateTransaction();
  
  // Test 1: Create transaction
  const createStartTime = Date.now();
  const createResponse = http.post(
    `${BASE_URL}/transactions`,
    JSON.stringify(transaction),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'CreateTransaction' },
    }
  );
  
  const createDuration = Date.now() - createStartTime;
  transactionDuration.add(createDuration);
  
  const createSuccess = check(createResponse, {
    'create status is 201': (r) => r.status === 201,
    'create has transactionId': (r) => {
      const body = JSON.parse(r.body);
      return body.transactionId === transaction.transactionId;
    },
    'create has correct amount': (r) => {
      const body = JSON.parse(r.body);
      return body.amount === transaction.amount;
    },
  });
  
  if (createSuccess) {
    createdTransactions.add(1);
  } else {
    errorRate.add(1);
  }
  
  sleep(0.5);
  
  // Test 2: Idempotency - Try to create same transaction again
  const duplicateStartTime = Date.now();
  const duplicateResponse = http.post(
    `${BASE_URL}/transactions`,
    JSON.stringify(transaction),
    {
      headers: {
        'Content-Type': 'application/json',
      },
      tags: { name: 'DuplicateTransaction' },
    }
  );
  
  const duplicateDuration = Date.now() - duplicateStartTime;
  transactionDuration.add(duplicateDuration);
  
  const duplicateSuccess = check(duplicateResponse, {
    'duplicate status is 409 or 201': (r) => r.status === 409 || r.status === 201,
    'duplicate returns same transaction': (r) => {
      const body = JSON.parse(r.body);
      return body.transactionId === transaction.transactionId;
    },
  });
  
  if (duplicateSuccess && duplicateResponse.status === 409) {
    duplicateTransactions.add(1);
  } else if (!duplicateSuccess) {
    errorRate.add(1);
  }
  
  sleep(0.5);
  
  // Test 3: Get transaction by ID
  const getStartTime = Date.now();
  const getResponse = http.get(
    `${BASE_URL}/transactions/${transaction.transactionId}`,
    {
      tags: { name: 'GetTransaction' },
    }
  );
  
  const getDuration = Date.now() - getStartTime;
  transactionDuration.add(getDuration);
  
  const getSuccess = check(getResponse, {
    'get status is 200': (r) => r.status === 200,
    'get returns correct transaction': (r) => {
      const body = JSON.parse(r.body);
      return body.transactionId === transaction.transactionId;
    },
  });
  
  if (!getSuccess) {
    errorRate.add(1);
  }
  
  sleep(0.5);
  
  // Test 4: List transactions
  const listStartTime = Date.now();
  const listResponse = http.get(`${BASE_URL}/transactions?limit=10`, {
    tags: { name: 'ListTransactions' },
  });
  
  const listDuration = Date.now() - listStartTime;
  transactionDuration.add(listDuration);
  
  const listSuccess = check(listResponse, {
    'list status is 200': (r) => r.status === 200,
    'list returns array': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body.data);
    },
    'list has pagination': (r) => {
      const body = JSON.parse(r.body);
      return body.pagination !== undefined;
    },
  });
  
  if (!listSuccess) {
    errorRate.add(1);
  }
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'tests/k6/results.json': JSON.stringify(data, null, 2),
  };
}

