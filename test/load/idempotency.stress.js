import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

const errorRate = new Rate('errors');
const duplicateRate = new Rate('duplicates');
const idempotencySuccess = new Rate('idempotency_success');
const concurrentCreateDuration = new Trend('concurrent_create_duration');

const sharedTransactionId = `idempotency-test-${Date.now()}`;

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    idempotency_success: ['rate>0.99'],
  },
};

function generateTransaction(transactionId) {
  return JSON.stringify({
    transactionId: transactionId,
    amount: Math.round((Math.random() * 10000 + 1) * 100) / 100,
    currency: 'BRL',
    type: 'credit',
    status: 'pending',
    description: 'Idempotency stress test',
    metadata: {
      source: 'idempotency-stress-test',
      vu: __VU,
      iteration: __ITER,
    },
  });
}

export default function () {
  const transactionId = `${sharedTransactionId}-${__VU}-${__ITER}`;
  const payload = generateTransaction(transactionId);
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const createStart = Date.now();
  const createResponse = http.post(
    `${BASE_URL}${API_PREFIX}/transactions`,
    payload,
    params,
  );
  const createDuration = Date.now() - createStart;
  concurrentCreateDuration.add(createDuration);

  const createSuccess = check(createResponse, {
    'create transaction status is 202': (r) => r.status === 202,
    'create transaction has jobId': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId && body.transactionId === transactionId;
      } catch {
        return false;
      }
    },
  });

  if (createSuccess) {
    sleep(0.5);

    const duplicatePayload = generateTransaction(transactionId);
    const duplicateResponse = http.post(
      `${BASE_URL}${API_PREFIX}/transactions`,
      duplicatePayload,
      params,
    );

    const duplicateCheck = check(duplicateResponse, {
      'duplicate transaction handled correctly': (r) => {
        return r.status === 202 || r.status === 409;
      },
      'duplicate has same transactionId': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.transactionId === transactionId;
        } catch {
          return false;
        }
      },
    });

    duplicateRate.add(duplicateCheck);
    idempotencySuccess.add(duplicateCheck);
  }

  errorRate.add(!createSuccess);

  sleep(Math.random() * 1 + 0.5);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'test/load/idempotency-results.json': JSON.stringify(data, null, 2),
  };
}

