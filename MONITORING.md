# Monitoring Setup - Prometheus & Grafana

Este documento descreve a configuração completa de monitoramento com Prometheus e Grafana para a Transaction Processor API.

## 🎯 Status Atual

✅ **Tudo está implementado e ativo:**
- ✅ Prometheus configurado e coletando métricas
- ✅ Grafana configurado com dashboards pré-configurados
- ✅ Endpoint `/api/metrics` expondo métricas Prometheus
- ✅ Middleware coletando métricas HTTP automaticamente
- ✅ Métricas customizadas de transações, fila e banco de dados

## 📊 Métricas Disponíveis

### Métricas HTTP
- `http_request_duration_seconds` - Duração das requisições HTTP
- `http_requests_total` - Total de requisições HTTP
- `http_request_errors_total` - Total de erros HTTP (status >= 400)

### Métricas de Transações
- `transactions_created_total` - Total de transações criadas (por type, status, currency)
- `transactions_processed_total` - Total de transações processadas (por status)

### Métricas de Fila (BullMQ)
- `transactions_queue_size` - Tamanho atual da fila (por state: waiting, active, completed, failed)

### Métricas de Banco de Dados
- `database_connections` - Número atual de conexões (por state)
- `database_query_duration_seconds` - Duração de queries do banco

### Métricas de Redis
- `redis_connections` - Número atual de conexões Redis

## 🚀 Como Usar

### 1. Iniciar os Serviços

```bash
cd docker
docker-compose up -d
```

Isso iniciará:
- **API**: `http://localhost:3000`
- **Prometheus**: `http://localhost:9090`
- **Grafana**: `http://localhost:3001`
- **Redis**: `localhost:6379`
- **PostgreSQL**: `localhost:5432`

### 2. Acessar Grafana

1. Abra `http://localhost:3001`
2. Login: `admin` / `admin`
3. Dashboards já estarão disponíveis:
   - **Application Metrics** - Métricas da aplicação
   - **Container Metrics** - Métricas de containers
   - **Home Dashboard** - Dashboard principal

### 3. Verificar Métricas no Prometheus

1. Abra `http://localhost:9090`
2. Vá em "Status" > "Targets"
3. Verifique se `transaction-api` está UP
4. Use a aba "Graph" para consultar métricas:
   - `http_requests_total`
   - `transactions_created_total`
   - `transactions_queue_size`

### 4. Verificar Endpoint de Métricas

```bash
curl http://localhost:3000/api/metrics
```

Deve retornar métricas no formato Prometheus.

## 📈 Dashboards Disponíveis

### Application Metrics Dashboard
- Taxa de requisições por segundo
- Latência (p50, p95, p99)
- Taxa de erros
- Transações criadas/processadas
- Tamanho da fila

### Container Metrics Dashboard
- Uso de CPU
- Uso de memória
- Uso de rede
- Uso de disco

## 🔧 Configuração

### Prometheus (`docker/prometheus/prometheus.yml`)

```yaml
scrape_configs:
  - job_name: 'transaction-api'
    metrics_path: '/api/metrics'
    static_configs:
      - targets: ['app:3000']
```

### Grafana (`docker/grafana/provisioning/datasources/prometheus.yml`)

```yaml
datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
```

## 📝 Queries Úteis

### Taxa de Requisições por Segundo
```promql
rate(http_requests_total[5m])
```

### Latência P95
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

### Taxa de Erros
```promql
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]) * 100
```

### Transações Criadas por Tipo
```promql
sum(rate(transactions_created_total[5m])) by (type)
```

### Tamanho da Fila
```promql
transactions_queue_size
```

## 🐛 Troubleshooting

### Prometheus não está coletando métricas
1. Verifique se a API está rodando: `curl http://localhost:3000/api/health`
2. Verifique o endpoint de métricas: `curl http://localhost:3000/api/metrics`
3. Verifique targets no Prometheus: `http://localhost:9090/targets`

### Grafana não mostra dados
1. Verifique se Prometheus está rodando: `http://localhost:9090`
2. Verifique datasource no Grafana: Configuration > Data Sources
3. Teste a conexão com Prometheus

### Métricas não aparecem
1. Verifique se o middleware está registrado no `app.module.ts`
2. Verifique se o `MetricsController` está registrado
3. Verifique logs da aplicação para erros

## 📚 Recursos

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [prom-client Documentation](https://github.com/siimon/prom-client)

