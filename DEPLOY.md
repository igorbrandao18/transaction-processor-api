# Guia de Deploy - DigitalOcean App Platform

Este guia explica como fazer deploy da Transaction Processor API na DigitalOcean usando GitHub Actions.

## 📋 Pré-requisitos

1. **Conta DigitalOcean** - [Criar conta](https://m.do.co/c/your-referral-link)
2. **Token de API DigitalOcean** - [Gerar token](https://cloud.digitalocean.com/account/api/tokens)
3. **Repositório GitHub** - Código deve estar em um repositório GitHub
4. **doctl CLI** (opcional) - Para deploy manual

## 🚀 Setup Rápido

### Passo 1: Configurar Secrets no GitHub

1. Vá para seu repositório no GitHub
2. `Settings` > `Secrets and variables` > `Actions`
3. Adicione os seguintes secrets:

| Secret | Descrição | Como obter |
|--------|-----------|------------|
| `DIGITALOCEAN_ACCESS_TOKEN` | Token de API da DigitalOcean | [Gerar aqui](https://cloud.digitalocean.com/account/api/tokens) |
| `DIGITALOCEAN_PROJECT_NAME` | Nome do seu projeto na DO | Nome do projeto na DigitalOcean |
| `DIGITALOCEAN_APP_ID` | ID do App Platform | Após criar o app (veja passo 2) |
| `DIGITALOCEAN_APP_URL` | URL do seu app | URL gerada pelo App Platform |

### Passo 2: Criar App na DigitalOcean

#### Opção A: Via Dashboard (Recomendado)

1. Acesse [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Clique em **"Create App"**
3. Conecte sua conta GitHub
4. Selecione o repositório e branch (`main`)
5. DigitalOcean detectará automaticamente o arquivo `.do/app.yaml`
6. Revise a configuração:
   - **Region**: Escolha a região mais próxima (ex: `nyc`, `sfo`, `ams`)
   - **Database**: PostgreSQL será criado automaticamente
   - **Redis**: Configure manualmente após criar o app (veja abaixo)
7. Clique em **"Create Resources"**

#### Opção B: Via CLI (doctl)

```bash
# Instalar doctl
brew install doctl  # macOS
# ou baixar de: https://github.com/digitalocean/doctl/releases

# Autenticar
doctl auth init

# Criar app a partir do spec
doctl apps create --spec .do/app.yaml
```

### Passo 3: Configurar Redis

O Redis precisa ser configurado manualmente:

1. No dashboard do DigitalOcean, vá para **Databases**
2. Clique em **"Create Database Cluster"**
3. Selecione:
   - **Engine**: Redis
   - **Version**: 7
   - **Plan**: Basic ($15/mês) ou escolha conforme necessidade
   - **Region**: Mesma região do app
4. Após criar, vá para **Settings** do Redis e copie:
   - Hostname
   - Port
   - Password (se configurado)
5. No App Platform, vá para **Settings** > **App-Level Environment Variables**
6. Adicione/atualize:
   - `REDIS_HOST` = hostname do Redis
   - `REDIS_PORT` = porta do Redis (geralmente 25061)
   - `REDIS_PASSWORD` = senha do Redis (se configurada)

### Passo 4: Configurar GitHub Repo no app.yaml

Antes de fazer deploy, atualize o arquivo `.do/app.yaml`:

```yaml
github:
  repo: seu-usuario/seu-repositorio  # Substitua aqui
  branch: main
```

Ou remova a seção `github` e use apenas `dockerfile_path` para build via Docker.

### Passo 5: Primeiro Deploy

A pipeline do GitHub Actions executará automaticamente quando você fizer push para `main`:

```bash
git add .
git commit -m "Configure deploy to DigitalOcean"
git push origin main
```

Ou faça deploy manual:

```bash
# Usando doctl
doctl apps update <APP_ID> --spec .do/app.yaml
doctl apps create-deployment <APP_ID>
```

## 🔄 Pipeline CI/CD

A pipeline (`.github/workflows/deploy.yml`) executa automaticamente:

### Em Push/PR:
1. ✅ **Testes** - Unit, Integration, E2E
2. ✅ **Linter** - Verificação de código

### Em Push para `main`:
3. ✅ **Build** - Constrói imagem Docker
4. ✅ **Push** - Envia para DigitalOcean Container Registry
5. ✅ **Deploy** - Faz deploy no App Platform

## 📊 Monitoramento

### Ver Logs

```bash
# Via CLI
doctl apps logs <APP_ID> --type run

# Via Dashboard
# Apps > Seu App > Runtime Logs
```

### Health Check

O app expõe endpoint `/health` que é verificado automaticamente:
- Intervalo: 10 segundos
- Timeout: 5 segundos
- Retries: 3 falhas antes de marcar como unhealthy

### Alertas

Alertas configurados:
- ✅ Falha de deployment
- ✅ Falha de domínio

## 💰 Estimativa de Custos

**Custos mensais aproximados:**

| Recurso | Plano | Custo |
|---------|-------|-------|
| App Platform | 2x Basic XXS | ~$12/mês |
| PostgreSQL | Basic | ~$15/mês |
| Redis | Basic | ~$15/mês |
| **Total** | | **~$42/mês** |

*Preços podem variar por região e uso*

## 🔧 Troubleshooting

### Deploy falha

1. Verifique logs do GitHub Actions
2. Verifique logs do App Platform
3. Confirme que todos os secrets estão configurados
4. Valide o arquivo `.do/app.yaml`:
   ```bash
   doctl apps spec validate .do/app.yaml
   ```

### Erro de conexão com banco

1. Verifique se o database está criado e rodando
2. Confirme variáveis de ambiente no App Platform
3. Verifique credenciais do database no dashboard

### Build falha

1. Teste Dockerfile localmente:
   ```bash
   docker build -f docker/Dockerfile -t test .
   ```
2. Verifique se todas as dependências estão em `package.json`
3. Verifique logs de build no GitHub Actions

### Redis não conecta

1. Verifique se o Redis está na mesma região do app
2. Confirme variáveis `REDIS_HOST`, `REDIS_PORT`
3. Verifique firewall/VPC do Redis permite conexão do App Platform

## 📝 Variáveis de Ambiente

O app usa variáveis configuradas em `.do/app.yaml`:

**Automáticas (do database):**
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

**Configuradas manualmente:**
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `NODE_ENV`, `PORT`, `LOG_LEVEL`
- `BULLMQ_*` (configurações da fila)

## 🔐 Segurança

- ✅ Secrets são injetados automaticamente pelo App Platform
- ✅ Database credentials não aparecem em logs
- ✅ HTTPS habilitado automaticamente
- ✅ Health checks configurados
- ✅ Rate limiting ativo (100 req/min por IP)

## 📚 Recursos

- [DigitalOcean App Platform Docs](https://docs.digitalocean.com/products/app-platform/)
- [doctl CLI Reference](https://docs.digitalocean.com/reference/doctl/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## ✅ Checklist de Deploy

- [ ] Secrets configurados no GitHub
- [ ] App criado no DigitalOcean App Platform
- [ ] Database PostgreSQL criado e conectado
- [ ] Redis criado e variáveis configuradas
- [ ] `.do/app.yaml` atualizado com repo correto
- [ ] Primeiro deploy executado
- [ ] Health check funcionando (`/health`)
- [ ] Logs sendo coletados corretamente
- [ ] Alertas configurados

