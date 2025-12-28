import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '1m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Test POST /transactions
  const transactionId = `load-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const payload = JSON.stringify({
    transactionId: transactionId,
    amount: 100.50,
    currency: 'BRL',
    type: 'credit',
    metadata: {
      source: 'load-test',
      timestamp: new Date().toISOString(),
    },
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const createResponse = http.post(`${BASE_URL}/transactions`, payload, params);
  const createSuccess = check(createResponse, {
    'POST /transactions status is 201': (r) => r.status === 201,
    'POST /transactions has transactionId': (r) => {
      const body = JSON.parse(r.body);
      return body.transactionId === transactionId;
    },
  });

  errorRate.add(!createSuccess);

  // Test GET /transactions (list)
  const listResponse = http.get(`${BASE_URL}/transactions?page=1&limit=20`);
  const listSuccess = check(listResponse, {
    'GET /transactions status is 200': (r) => r.status === 200,
    'GET /transactions has data': (r) => {
      const body = JSON.parse(r.body);
      return body.data && Array.isArray(body.data);
    },
  });

  errorRate.add(!listSuccess);

  sleep(1); // Wait 1 second between iterations
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'test/load/results.json': JSON.stringify(data),
  };
}

