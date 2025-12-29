# Stress Tests - Transaction Processor API

Este diretório contém testes de stress/carga usando k6 para validar a performance e resiliência da API sob diferentes cenários de carga.

## Pré-requisitos

Instale o k6:
```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6
```

## Testes Disponíveis

### 1. `transactions.stress.js` - Teste Completo de Stress
**Descrição:** Testa todos os endpoints da API sob carga crescente e constante.

**Cenários testados:**
- Health check
- Criação de transações (POST /api/transactions)
- Verificação de status da fila
- Listagem de transações com filtros
- Busca de transação por ID
- Obtenção de metadata
- Estatísticas da fila

**Perfil de carga:**
- Ramp-up gradual: 10 → 50 → 100 → 200 → 500 usuários
- Carga constante: 500 usuários por 3 minutos
- Ramp-down gradual: 500 → 200 → 100 → 50 → 0 usuários
- Duração total: ~20 minutos

**Métricas:**
- Tempo de resposta (p50, p95, p99)
- Taxa de erro < 1%
- Throughput
- Contadores por operação

**Executar:**
```bash
npm run test:load:stress
# ou
k6 run test/load/transactions.stress.js
```

**Com URL customizada:**
```bash
BASE_URL=https://api.example.com k6 run test/load/transactions.stress.js
```

### 2. `idempotency.stress.js` - Teste de Idempotência sob Carga
**Descrição:** Valida que a idempotência funciona corretamente mesmo sob alta carga concorrente.

**Cenários testados:**
- Criação de transações com mesmo transactionId
- Verificação de tratamento de duplicatas
- Validação de comportamento idempotente

**Perfil de carga:**
- Ramp-up: 50 → 100 → 200 usuários
- Carga constante: 200 usuários por 2 minutos
- Ramp-down: 200 → 100 → 50 → 0 usuários
- Duração total: ~5 minutos

**Métricas:**
- Taxa de sucesso de idempotência > 99%
- Tempo de resposta para criações concorrentes
- Taxa de duplicatas tratadas corretamente

**Executar:**
```bash
k6 run test/load/idempotency.stress.js
```

### 3. `spike.stress.js` - Teste de Pico de Carga
**Descrição:** Simula picos súbitos de tráfego para validar rate limiting e resiliência.

**Cenários testados:**
- Pico súbito de 10 → 1000 usuários
- Validação de rate limiting (429)
- Recuperação após pico

**Perfil de carga:**
- Spike rápido: 10 → 100 → 500 → 1000 usuários em 30s
- Carga máxima: 1000 usuários por 30s
- Recuperação rápida: 1000 → 100 → 10 → 0 usuários
- Duração total: ~1.5 minutos

**Métricas:**
- Taxa de rate limit hits
- Tempo de resposta durante spike
- Taxa de erro durante pico

**Executar:**
```bash
k6 run test/load/spike.stress.js
```

### 4. `transactions.load.js` - Teste Básico de Carga (Legado)
**Descrição:** Teste básico original para comparação.

**Executar:**
```bash
npm run test:load
# ou
k6 run test/load/transactions.load.js
```

## Scripts NPM

Adicione ao `package.json`:
```json
{
  "scripts": {
    "test:load": "k6 run test/load/transactions.load.js",
    "test:load:stress": "k6 run test/load/transactions.stress.js",
    "test:load:idempotency": "k6 run test/load/idempotency.stress.js",
    "test:load:spike": "k6 run test/load/spike.stress.js"
  }
}
```

## Variáveis de Ambiente

- `BASE_URL`: URL base da API (padrão: `http://localhost:3000`)

**Exemplo:**
```bash
BASE_URL=https://challenge.brandaodeveloper.com.br k6 run test/load/transactions.stress.js
```

## Resultados

Os resultados são salvos em:
- `test/load/stress-results.json` - Dados completos em JSON
- `test/load/stress-summary.txt` - Resumo em texto
- Console - Resumo colorido

## Interpretação dos Resultados

### Métricas Importantes

1. **http_req_duration**: Tempo de resposta das requisições
   - p50: mediana (50% das requisições)
   - p95: 95% das requisições abaixo deste valor
   - p99: 99% das requisições abaixo deste valor

2. **http_req_failed**: Taxa de falhas HTTP
   - Deve ser < 1% para produção

3. **errors**: Taxa de erros customizados
   - Deve ser < 1%

4. **Throughput**: Requisições por segundo
   - Indica capacidade do sistema

### Thresholds Configurados

- **p50 < 200ms**: Metade das requisições devem responder em < 200ms
- **p95 < 500ms**: 95% das requisições devem responder em < 500ms
- **p99 < 1000ms**: 99% das requisições devem responder em < 1000ms
- **Error rate < 1%**: Taxa de erro deve ser menor que 1%

## Recomendações

1. **Execute os testes em ambiente isolado** para não impactar produção
2. **Monitore recursos** (CPU, memória, conexões de banco) durante os testes
3. **Ajuste thresholds** conforme necessário para seu ambiente
4. **Execute testes regularmente** para detectar regressões de performance
5. **Compare resultados** entre versões para identificar melhorias/degradações

## Troubleshooting

### Erro: "connection refused"
- Verifique se a API está rodando
- Verifique se a URL está correta (incluindo porta)

### Erro: "rate limit exceeded"
- Esperado no teste de spike
- Indica que rate limiting está funcionando

### Performance degradada
- Verifique logs da aplicação
- Monitore conexões de banco de dados
- Verifique uso de CPU/memória
- Considere ajustar configurações de pool de conexões

