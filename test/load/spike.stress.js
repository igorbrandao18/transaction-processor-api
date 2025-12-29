import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

const errorRate = new Rate('errors');
const rateLimitHit = new Rate('rate_limit_hit');
const spikeResponseTime = new Trend('spike_response_time');

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '10s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

function generateTransaction() {
  return JSON.stringify({
    transactionId: `spike-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${__VU}-${__ITER}`,
    amount: Math.round((Math.random() * 10000 + 1) * 100) / 100,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Spike test transaction',
    metadata: {
      source: 'spike-test',
      vu: __VU,
      iteration: __ITER,
    },
  });
}

export default function () {
  const payload = generateTransaction();
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const start = Date.now();
  const response = http.post(
    `${BASE_URL}${API_PREFIX}/transactions`,
    payload,
    params,
  );
  const duration = Date.now() - start;
  spikeResponseTime.add(duration);

  const success = check(response, {
    'spike test status is 202 or 429': (r) => r.status === 202 || r.status === 429,
    'spike test response time acceptable': () => duration < 2000,
  });

  if (response.status === 429) {
    rateLimitHit.add(1);
  }

  errorRate.add(!success);

  sleep(0.1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'test/load/spike-results.json': JSON.stringify(data, null, 2),
  };
}

