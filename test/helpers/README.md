# BullMQ Test Helpers

Este diretório contém helpers para testar operações assíncronas do BullMQ.

## Funções Disponíveis

### `waitForJobsToComplete(queue, timeout)`
Aguarda até que todos os jobs na fila sejam processados.

**Parâmetros:**
- `queue`: Instância da fila BullMQ
- `timeout`: Tempo máximo de espera em milissegundos (padrão: 10000)

**Retorna:** Promise que resolve quando todos os jobs são processados

### `waitForJobToComplete(queue, jobId, timeout)`
Aguarda até que um job específico seja completado.

**Parâmetros:**
- `queue`: Instância da fila BullMQ
- `jobId`: ID do job a aguardar
- `timeout`: Tempo máximo de espera em milissegundos (padrão: 10000)

**Retorna:** Promise que resolve com o estado do job ('completed' ou 'failed')

### `processAllWaitingJobs(queue, processor)`
Processa manualmente todos os jobs aguardando na fila. Útil para testes de integração/E2E onde queremos controlar quando os jobs são processados.

**Parâmetros:**
- `queue`: Instância da fila BullMQ
- `processor`: Função processadora que lida com os jobs

**Retorna:** Promise que resolve quando todos os jobs foram processados

### `clearQueue(queue)`
Limpa todos os jobs da fila. Útil para limpeza entre testes.

**Parâmetros:**
- `queue`: Instância da fila BullMQ

**Retorna:** Promise que resolve quando a fila está limpa

### `getJobCounts(queue)`
Retorna a contagem de jobs em diferentes estados.

**Parâmetros:**
- `queue`: Instância da fila BullMQ

**Retorna:** Objeto com contagens para cada estado de job:
```typescript
{
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
```

## Uso em Testes

### Exemplo Básico

```typescript
import { waitForJobsToComplete, processAllWaitingJobs, clearQueue } from '@test-helpers/bullmq-test.helper';

describe('My Test', () => {
  let queue: Queue;
  let processor: MyProcessor;

  beforeEach(async () => {
    await clearQueue(queue);
  });

  it('should process transaction asynchronously', async () => {
    // Adiciona job à fila
    await request(app.getHttpServer())
      .post('/transactions')
      .send(createDto)
      .expect(201);

    // Processa jobs manualmente (para controle em testes)
    await processAllWaitingJobs(queue, (job) => processor.handleTransaction(job));
    
    // Aguarda processamento assíncrono completo
    await waitForJobsToComplete(queue, 5000);

    // Verifica resultados
    const dbResult = await dbPool.query('SELECT * FROM transactions WHERE ...');
    expect(dbResult.rows.length).toBe(1);
  });
});
```

## Por que esses helpers são necessários?

O BullMQ processa jobs de forma assíncrona. Em testes, precisamos:

1. **Aguardar processamento**: Jobs não são processados instantaneamente
2. **Controlar timing**: Em testes de integração/E2E, queremos controlar quando jobs são processados
3. **Limpar estado**: Entre testes, precisamos limpar a fila para evitar interferência
4. **Verificar estados**: Precisamos verificar se jobs foram completados antes de fazer assertions

Esses helpers abstraem essa complexidade e tornam os testes mais confiáveis e fáceis de escrever.

