import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_PREFIX = '/api';

const errorRate = new Rate('errors');
const transactionCreated = new Counter('transactions_created');
const transactionListed = new Counter('transactions_listed');
const transactionFound = new Counter('transactions_found');
const queueStatusChecked = new Counter('queue_status_checked');
const metadataRetrieved = new Counter('metadata_retrieved');
const healthChecked = new Counter('health_checked');

const createTransactionDuration = new Trend('create_transaction_duration');
const listTransactionsDuration = new Trend('list_transactions_duration');
const getTransactionDuration = new Trend('get_transaction_duration');
const queueStatusDuration = new Trend('queue_status_duration');
const metadataDuration = new Trend('metadata_duration');
const healthDuration = new Trend('health_duration');

const currencies = ['BRL', 'USD', 'EUR', 'GBP', 'JPY'];
const types = ['credit', 'debit'];
const statuses = ['pending', 'completed', 'failed'];

function generateTransactionId() {
  return `stress-${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${__VU}-${__ITER}`;
}

function generateTransaction() {
  return {
    transactionId: generateTransactionId(),
    amount: Math.round((Math.random() * 10000 + 1) * 100) / 100,
    currency: currencies[Math.floor(Math.random() * currencies.length)],
    type: types[Math.floor(Math.random() * types.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    description: `Stress test transaction ${Date.now()}`,
    metadata: {
      source: 'stress-test',
      vu: __VU,
      iteration: __ITER,
      timestamp: new Date().toISOString(),
    },
  };
}

export const options = {
  stages: [
    { duration: '1m', target: 10 },
    { duration: '2m', target: 50 },
    { duration: '3m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 500 },
    { duration: '3m', target: 500 },
    { duration: '2m', target: 200 },
    { duration: '1m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    create_transaction_duration: ['p(95)<300'],
    list_transactions_duration: ['p(95)<400'],
    get_transaction_duration: ['p(95)<200'],
    queue_status_duration: ['p(95)<300'],
    metadata_duration: ['p(95)<200'],
    health_duration: ['p(95)<100'],
  },
};

export default function () {
  group('Complete Transaction Flow Stress Test', () => {
    group('1. Health Check', () => {
      const healthStart = Date.now();
      const healthResponse = http.get(`${BASE_URL}${API_PREFIX}/health`);
      const healthSuccess = check(healthResponse, {
        'health check status is 200': (r) => r.status === 200,
        'health check has status UP': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.status === 'UP';
          } catch {
            return false;
          }
        },
        'health check has database UP': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.checks?.database === 'UP';
          } catch {
            return false;
          }
        },
      });
      healthDuration.add(Date.now() - healthStart);
      healthChecked.add(healthSuccess);
      errorRate.add(!healthSuccess);
    });

    group('2. Create Transaction (Queue)', () => {
      const transaction = generateTransaction();
      const payload = JSON.stringify(transaction);
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
      createTransactionDuration.add(createDuration);

      const createSuccess = check(createResponse, {
        'create transaction status is 202': (r) => r.status === 202,
        'create transaction has jobId': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.jobId && body.transactionId === transaction.transactionId;
          } catch {
            return false;
          }
        },
        'create transaction response time < 500ms': () => createDuration < 500,
      });

      transactionCreated.add(createSuccess);
      errorRate.add(!createSuccess);

      if (createSuccess) {
        const responseBody = JSON.parse(createResponse.body);
        const jobId = responseBody.jobId;

        group('3. Check Queue Status', () => {
          sleep(0.5);

          const queueStart = Date.now();
          const queueResponse = http.get(
            `${BASE_URL}${API_PREFIX}/transactions/queue/${transaction.transactionId}/status`,
          );
          const queueDuration = Date.now() - queueStart;
          queueStatusDuration.add(queueDuration);

          const queueSuccess = check(queueResponse, {
            'queue status status is 200 or 404': (r) =>
              r.status === 200 || r.status === 404,
            'queue status response time < 300ms': () => queueDuration < 300,
          });

          queueStatusChecked.add(queueSuccess);
          errorRate.add(!queueSuccess);
        });
      }
    });

    group('4. List Transactions', () => {
      const page = Math.floor(Math.random() * 10) + 1;
      const limit = [10, 20, 50][Math.floor(Math.random() * 3)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const type = types[Math.floor(Math.random() * types.length)];

      const listStart = Date.now();
      const listResponse = http.get(
        `${BASE_URL}${API_PREFIX}/transactions?page=${page}&limit=${limit}&status=${status}&type=${type}`,
      );
      const listDuration = Date.now() - listStart;
      listTransactionsDuration.add(listDuration);

      const listSuccess = check(listResponse, {
        'list transactions status is 200': (r) => r.status === 200,
        'list transactions has data array': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.data) && body.pagination;
          } catch {
            return false;
          }
        },
        'list transactions has pagination': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.pagination &&
              typeof body.pagination.page === 'number' &&
              typeof body.pagination.limit === 'number'
            );
          } catch {
            return false;
          }
        },
        'list transactions response time < 400ms': () => listDuration < 400,
      });

      transactionListed.add(listSuccess);
      errorRate.add(!listSuccess);

      if (listSuccess) {
        try {
          const body = JSON.parse(listResponse.body);
          if (body.data && body.data.length > 0) {
            const randomTransaction = body.data[Math.floor(Math.random() * body.data.length)];

            group('5. Get Transaction by ID', () => {
              const getStart = Date.now();
              const getResponse = http.get(
                `${BASE_URL}${API_PREFIX}/transactions/${randomTransaction.id}`,
              );
              const getDuration = Date.now() - getStart;
              getTransactionDuration.add(getDuration);

              const getSuccess = check(getResponse, {
                'get transaction status is 200': (r) => r.status === 200,
                'get transaction has correct id': (r) => {
                  try {
                    const body = JSON.parse(r.body);
                    return body.id === randomTransaction.id;
                  } catch {
                    return false;
                  }
                },
                'get transaction response time < 200ms': () => getDuration < 200,
              });

              transactionFound.add(getSuccess);
              errorRate.add(!getSuccess);
            });
          }
        } catch (e) {
          errorRate.add(1);
        }
      }
    });

    group('6. Get Metadata', () => {
      const metadataStart = Date.now();
      const metadataResponse = http.get(
        `${BASE_URL}${API_PREFIX}/transactions/metadata`,
      );
      const metadataDurationMs = Date.now() - metadataStart;
      metadataDuration.add(metadataDurationMs);

      const metadataSuccess = check(metadataResponse, {
        'metadata status is 200': (r) => r.status === 200,
        'metadata has types': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.types) && body.types.length > 0;
          } catch {
            return false;
          }
        },
        'metadata has statuses': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.statuses) && body.statuses.length > 0;
          } catch {
            return false;
          }
        },
        'metadata has currencies': (r) => {
          try {
            const body = JSON.parse(r.body);
            return Array.isArray(body.currencies) && body.currencies.length > 0;
          } catch {
            return false;
          }
        },
        'metadata response time < 200ms': () => metadataDurationMs < 200,
      });

      metadataRetrieved.add(metadataSuccess);
      errorRate.add(!metadataSuccess);
    });

    group('7. Queue Statistics', () => {
      const statsResponse = http.get(
        `${BASE_URL}${API_PREFIX}/transactions/queue/stats`,
      );

      check(statsResponse, {
        'queue stats status is 200': (r) => r.status === 200,
        'queue stats has statistics': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              typeof body.waiting === 'number' &&
              typeof body.active === 'number' &&
              typeof body.completed === 'number' &&
              typeof body.failed === 'number'
            );
          } catch {
            return false;
          }
        },
      });
    });
  });

  sleep(Math.random() * 2 + 1);
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'test/load/stress-results.json': JSON.stringify(data, null, 2),
    'test/load/stress-summary.txt': textSummary(data, { indent: ' ' }),
  };
}

