import http from 'k6/http';
import { check } from 'k6';

// Smoke test - quick validation
export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Health check
  const healthResponse = http.get(`${BASE_URL}/health`);
  check(healthResponse, {
    'health check status is 200': (r) => r.status === 200,
    'health check returns UP': (r) => {
      const body = JSON.parse(r.body);
      return body.status === 'UP';
    },
  });

  // Create a simple transaction
  const transaction = {
    transactionId: `smoke-${Date.now()}`,
    accountId: 'account-1',
    amount: 100,
    type: 'credit',
  };

  const createResponse = http.post(
    `${BASE_URL}/transactions`,
    JSON.stringify(transaction),
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  check(createResponse, {
    'create transaction status is 201': (r) => r.status === 201,
  });
}


