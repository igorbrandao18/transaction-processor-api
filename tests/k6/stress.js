import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

// Stress test - find breaking point
export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 400 },
    { duration: '2m', target: 500 },
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function generateTransaction() {
  return {
    transactionId: `stress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accountId: `account-${Math.floor(Math.random() * 10000)}`,
    amount: Math.floor(Math.random() * 10000) + 100,
    type: Math.random() > 0.5 ? 'credit' : 'debit',
  };
}

export default function () {
  const transaction = generateTransaction();

  const response = http.post(
    `${BASE_URL}/transactions`,
    JSON.stringify(transaction),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const success = check(response, {
    'status is 201 or 409': (r) => r.status === 201 || r.status === 409,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(0.1);
}


