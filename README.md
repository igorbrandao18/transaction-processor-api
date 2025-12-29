# Transaction Processor API

API para processamento de transações financeiras desenvolvida com NestJS, TypeScript e PostgreSQL.

## 🎯 Funcionalidades

- ✅ Receber transações financeiras via API (`POST /api/transactions`)
- ✅ Persistir transações em banco de dados relacional (PostgreSQL)
- ✅ Garantir idempotência com controle de concorrência
- ✅ Consultar transações com paginação e filtros (`GET /api/transactions`)
- ✅ Obter metadados para formulários (`GET /api/transactions/metadata`)
- ✅ Buscar transação por ID (`GET /api/transactions/:id`)

## 🏗️ Arquitetura

### Por que organizei o projeto dessa forma?

O projeto segue **Layered Architecture** (Arquitetura em Camadas) com separação clara de responsabilidades:

```
┌─────────────────────────────────────┐
│  Presentation Layer (Controllers)    │ ← Recebe requisições HTTP
├─────────────────────────────────────┤
│  Application Layer (Services)       │ ← Lógica de negócio
├─────────────────────────────────────┤
│  Domain Layer (Entities/Models)      │ ← Entidades e regras
├─────────────────────────────────────┤
│  Infrastructure Layer (Repositories) │ ← Acesso a dados
└─────────────────────────────────────┘
```

**Benefícios:**
- **Testabilidade**: Cada camada pode ser testada isoladamente
- **Manutenibilidade**: Mudanças em uma camada não afetam outras
- **Escalabilidade**: Fácil adicionar novos recursos sem quebrar código existente
- **Clareza**: Responsabilidades bem definidas facilitam onboarding

**Padrões implementados:**
- **Repository Pattern**: Isola acesso ao banco de dados
- **Service Layer Pattern**: Centraliza lógica de negócio e idempotência
- **DTO Pattern**: Valida entrada e controla exposição de dados
- **Dependency Injection**: Facilita testes e manutenção (NestJS)

## 🗄️ Cache

### Onde colocaria cache?

**✅ Colocaria cache em:**

1. **GET /api/transactions/:id** (transação individual)
   - **Motivo**: Transações individuais são consultadas frequentemente
   - **TTL**: 5-10 minutos (dados financeiros mudam pouco após criação)
   - **Estratégia**: Redis com chave `transaction:{id}`

2. **GET /api/transactions/metadata** (tipos, statuses, moedas)
   - **Motivo**: Dados estáticos raramente mudam
   - **TTL**: 1 hora ou invalidação manual
   - **Estratégia**: Redis com chave `metadata:transactions`

3. **GET /api/transactions** (listagem paginada)
   - **Motivo**: Reduz carga no banco em consultas frequentes
   - **TTL**: 1-2 minutos (dados podem mudar rapidamente)
   - **Estratégia**: Redis com chave `transactions:page:{page}:limit:{limit}:filters:{hash}`

### Quando NÃO colocaria cache?

**❌ NÃO colocaria cache em:**

1. **POST /api/transactions** (criação)
   - **Motivo**: Operação de escrita deve ser sempre real-time
   - **Risco**: Dados inconsistentes entre cache e banco

2. **Consultas com filtros complexos ou datas recentes**
   - **Motivo**: Dados muito dinâmicos invalidariam cache constantemente
   - **Risco**: Cache ineficiente, overhead maior que benefício

3. **Dados críticos de auditoria**
   - **Motivo**: Requer garantia de dados sempre atualizados
   - **Risco**: Compliance e auditoria podem ser comprometidos

## 📊 Observabilidade em Produção

### Estratégia de Observabilidade

**1. Logs Estruturados (JSON)**
- ✅ Implementado com Winston
- Formato JSON para fácil parsing
- Níveis: `error`, `warn`, `info`, `debug`
- Contexto incluído: `requestId`, `userId`, `transactionId`

**2. Métricas**
- ✅ Health Check (`GET /api/health`)
- ✅ Swagger/OpenAPI (`GET /api/docs`)
- ⏳ **Próximo passo**: Prometheus + Grafana
  - Métricas: taxa de requisições, latência, erros
  - Alertas: taxa de erro > 5%, latência > 1s

**3. Tracing**
- ⏳ **Próximo passo**: OpenTelemetry
  - Trace IDs para rastrear requisições
  - Correlação entre serviços (se houver microserviços)

**4. Monitoramento de Banco de Dados**
- ⏳ **Próximo passo**: pg_stat_statements
  - Queries lentas
  - Uso de índices
  - Conexões ativas

**5. Alertas**
- ⏳ **Próximo passo**: Integração com PagerDuty/Slack
  - Erros 5xx > 1% em 5 minutos
  - Latência p95 > 2s
  - Banco de dados indisponível

## 🔄 Fila/Mensageria

### Quando usaria fila?

**✅ Usaria fila em:**

1. **Processamento assíncrono de transações**
   - **Cenário**: Validações complexas, integrações externas (gateways de pagamento)
   - **Benefício**: API responde rápido, processamento em background
   - **Implementação**: ✅ BullMQ já configurado

2. **Envio de notificações**
   - **Cenário**: Email, SMS, webhooks para clientes
   - **Benefício**: Não bloqueia resposta da API
   - **Implementação**: Worker separado consumindo fila

3. **Reconciliação e relatórios**
   - **Cenário**: Geração de relatórios diários, reconciliação bancária
   - **Benefício**: Processamento em horários de baixo tráfego
   - **Implementação**: Jobs agendados (cron)

4. **Retry automático de falhas**
   - **Cenário**: Integração externa falhou temporariamente
   - **Benefício**: Retry automático com backoff exponencial
   - **Implementação**: ✅ BullMQ com `attempts` e `backoff`

**❌ NÃO usaria fila em:**

1. **Validações simples e rápidas**
   - **Motivo**: Overhead desnecessário
   - **Exemplo**: Validação de formato de dados

2. **Operações síncronas críticas**
   - **Motivo**: Cliente precisa de resposta imediata
   - **Exemplo**: Verificação de saldo antes de autorizar transação

## 🔍 Gargalos e Primeiro Problema em Produção

### Onde estaria o gargalo?

**1. Banco de Dados (PostgreSQL) - PRINCIPAL GARGALO**
- **Problema**: Escrita em disco, conexões limitadas, queries sem índice
- **Sintomas**: Latência alta em `POST /api/transactions`, timeouts
- **Impacto**: Alto volume de requisições simultâneas satura o banco

**2. Conexões de Banco**
- **Problema**: Pool de conexões esgotado
- **Sintomas**: Erros "too many connections", requisições travando
- **Impacto**: Sistema fica indisponível

**3. Queries sem Otimização**
- **Problema**: `SELECT *` sem índices adequados, N+1 queries
- **Sintomas**: Queries lentas (> 500ms), CPU do banco alta
- **Impacto**: Degradação gradual do desempenho

### Qual seria o primeiro problema real em produção?

**🔴 PRIMEIRO PROBLEMA: Pool de Conexões Esgotado**

**Cenário:**
1. Alto volume de requisições simultâneas (ex: 1000 req/s)
2. Pool de conexões configurado para 20 conexões
3. Requisições começam a esperar por conexão disponível
4. Timeout de requisições HTTP (30s) antes de obter conexão
5. Erros 503 Service Unavailable

**Por que acontece:**
- Cada requisição `POST /api/transactions` abre conexão
- Transações demoram para completar (INSERT + COMMIT)
- Conexões não são liberadas rápido o suficiente
- Pool esgota rapidamente

**Sintomas:**
- Logs mostram "Connection pool exhausted"
- Latência aumenta drasticamente
- Taxa de erro 503 aumenta
- Banco mostra muitas conexões idle

### Qual solução priorizaria primeiro e por quê?

**🎯 SOLUÇÃO PRIORITÁRIA #1: Otimizar Pool de Conexões**

**Ações imediatas:**
1. **Aumentar pool de conexões** (20 → 100)
2. **Configurar timeout de conexão** (evitar conexões travadas)
3. **Implementar retry com backoff** (requisições que falharam por falta de conexão)
4. **Monitorar métricas de pool** (conexões ativas, idle, waiting)

**Por que priorizar:**
- ✅ **Impacto imediato**: Resolve o problema mais crítico
- ✅ **Baixo risco**: Mudança de configuração, sem alterar código
- ✅ **Rápido de implementar**: Apenas ajuste de variáveis de ambiente
- ✅ **Base para outras otimizações**: Sistema estável permite outras melhorias

**Código:**
```typescript
// database.config.ts
export const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 100, // Aumentado de 20 para 100
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});
```

**🎯 SOLUÇÃO PRIORITÁRIA #2: Implementar Cache (Redis)**

**Ações:**
1. Cache para `GET /api/transactions/:id`
2. Cache para `GET /api/transactions/metadata`
3. Reduz carga no banco em 60-80% das requisições

**Por que segunda prioridade:**
- Requer infraestrutura adicional (Redis)
- Implementação mais complexa que ajuste de pool
- Benefício alto, mas não resolve problema imediato de conexões

**🎯 SOLUÇÃO PRIORITÁRIA #3: Usar Fila (BullMQ) para Escritas**

**Status atual:**
- ✅ **Infraestrutura pronta**: Redis configurado no docker-compose.yml
- ✅ **Dependências instaladas**: @nestjs/bull e bull no package.json
- ⏳ **Código não implementado**: Queue e Processor não estão sendo usados
- ⏳ **Controller síncrono**: POST /api/transactions processa diretamente

**Ações para implementar:**
1. `POST /api/transactions` adiciona job na fila (retorna 202 Accepted)
2. Worker processa em background (transaction.processor.ts)
3. API responde imediatamente sem esperar processamento

**Por que terceira prioridade:**
- Infraestrutura já está preparada (Redis rodando)
- Requer implementação do código (queue + processor)
- Benefício: reduz tempo de resposta, mas não resolve problema imediato de conexões

## 💡 Dívida Técnica Consciente

### O que deixaria como dívida técnica?

**1. Migrations Manuais (Sem Ferramenta Dedicada)**
- **Status**: Migrations em SQL puro com runner simples
- **Motivo**: Funciona para MVP, não é crítico agora
- **Quando resolver**: Quando houver múltiplos desenvolvedores ou muitas migrations
- **Solução futura**: TypeORM Migrations ou Prisma Migrate

**2. Logs sem Correlação de Requisições (Request ID)**
- **Status**: Logs estruturados, mas sem trace ID único por requisição
- **Motivo**: Suficiente para debug inicial, não crítico para MVP
- **Quando resolver**: Quando sistema crescer e precisar rastrear requisições entre serviços
- **Solução futura**: OpenTelemetry ou middleware de request ID

**3. Validações de Negócio Simples**
- **Status**: Validações básicas (formato, tipos), sem regras complexas
- **Motivo**: MVP não requer validações avançadas (ex: limite de transação por cliente)
- **Quando resolver**: Quando requisitos de negócio ficarem mais complexos
- **Solução futura**: Rules Engine ou Domain Events

**4. Sem Rate Limiting por Cliente/Tenant**
- **Status**: Rate limiting global implementado (100 req/min por IP)
- **Motivo**: MVP não tem multi-tenancy completo, rate limit global suficiente
- **Quando resolver**: Quando houver múltiplos tenants com limites diferentes
- **Solução futura**: Rate limiting por tenant com Redis

**5. Testes de Carga Básicos**
- **Status**: Testes k6 implementados, mas cenários limitados
- **Motivo**: Suficiente para validar comportamento básico
- **Quando resolver**: Antes de scale para produção real
- **Solução futura**: Testes de carga mais abrangentes (cenários de pico, degradação)

**6. Sem Circuit Breaker para Integrações Externas**
- **Status**: Não há integrações externas ainda
- **Motivo**: Não aplicável no momento
- **Quando resolver**: Quando adicionar integrações (gateways de pagamento, APIs externas)
- **Solução futura**: Circuit Breaker pattern (ex: `@nestjs/circuit-breaker`)

## 🚀 Tecnologias

- **Runtime**: Node.js 18+
- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **ORM**: Raw SQL com `pg` (PostgreSQL driver)
- **Message Queue**: BullMQ (Redis)
- **Logging**: Winston (JSON structured logs)
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest (unit, integration, e2e), k6 (load)

## 📦 Estrutura do Projeto

```
src/
├── controllers/          # Presentation Layer
│   ├── transactions.controller.ts
│   └── health.controller.ts
├── services/            # Application Layer
│   └── transactions.service.ts
├── repositories/        # Infrastructure Layer
│   └── transactions.repository.ts
├── entities/            # Domain Layer
│   └── transaction.entity.ts
├── dto/                # Data Transfer Objects
│   ├── create-transaction.dto.ts
│   └── query-transactions.dto.ts
├── middleware/         # Custom middlewares
│   ├── error-handler.middleware.ts
│   └── logger.middleware.ts
├── config/            # Configuration
│   ├── database.config.ts
│   ├── logger.config.ts
│   └── swagger.config.ts
└── main.ts            # Entry point
```

## 🧪 Testes

### Cobertura de Testes

- ✅ **Unit Tests**: Services, Repositories, Utils
- ✅ **Integration Tests**: API endpoints com banco real
- ✅ **E2E Tests**: Fluxo completo de transações
- ✅ **Idempotency Tests**: Requisições concorrentes
- ✅ **Load Tests**: k6 para performance

### Executar Testes

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Load tests
npm run test:load
```

## 🐳 Docker

### Desenvolvimento Local

```bash
cd docker
docker compose up -d
```

Serviços disponíveis:
- **API**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **pgAdmin**: http://localhost:5050

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=transactions_db

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Logging
LOG_LEVEL=info
```

## 📚 Documentação da API

Acesse a documentação Swagger em: `http://localhost:3000/api/docs`

## 🔐 Idempotência

A API garante idempotência através de:

1. **UNIQUE INDEX** no campo `transaction_id` no banco
2. **Verificação antes de inserir** no Service
3. **Retorno 409 Conflict** se transação já existe
4. **Transações de banco** para atomicidade em requisições concorrentes

## 📈 Performance

### Otimizações Implementadas

- ✅ Índices no banco (`transaction_id`, `created_at`, `status`)
- ✅ Paginação em todas as listagens
- ✅ Pool de conexões configurado
- ✅ Queries parametrizadas (evita SQL injection e melhora cache do PostgreSQL)

### Próximas Otimizações

- ⏳ Cache com Redis
- ⏳ Connection pooling otimizado
- ⏳ Read replicas para consultas
- ⏳ Compressão de respostas HTTP

## 🚢 Deploy

O projeto está configurado para deploy via GitHub Actions:

- ✅ CI/CD pipeline (lint, testes, build)
- ✅ Deploy automático no push para `main`
- ✅ Docker Compose no servidor
- ✅ Nginx como reverse proxy
- ✅ SSL/TLS via Let's Encrypt

Veja `.github/workflows/deploy.yml` para detalhes.

## 📝 Licença

Este projeto foi desenvolvido como parte de um desafio técnico.

