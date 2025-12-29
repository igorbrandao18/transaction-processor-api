# Configuração do Nginx para Grafana e Prometheus

Este diretório contém a configuração do Nginx necessária para expor Grafana e Prometheus através do mesmo domínio da aplicação principal.

## URLs de Acesso

- **Grafana**: `https://challenge.brandaodeveloper.com.br/grafana`
- **Prometheus**: `https://challenge.brandaodeveloper.com.br/prometheus`

## Configuração no Servidor

### 1. Adicionar as rotas no Nginx

Adicione o conteúdo do arquivo `nginx.conf` ao seu arquivo de configuração do Nginx no servidor (geralmente em `/etc/nginx/sites-available/challenge.brandaodeveloper.com.br` ou similar).

**Importante**: As rotas devem ser adicionadas **antes** da rota padrão `location /` que aponta para a aplicação principal, para que o Nginx processe primeiro as rotas específicas.

Exemplo de configuração completa:

```nginx
server {
    listen 443 ssl http2;
    server_name challenge.brandaodeveloper.com.br;

    # ... configurações SSL ...

    # Grafana - DEVE VIR ANTES DA ROTA PRINCIPAL
    location /grafana/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /grafana;
        proxy_set_header X-Grafana-Referer $scheme://$host/grafana/;
        proxy_read_timeout 86400;
        proxy_buffering off;
    }

    # Prometheus - DEVE VIR ANTES DA ROTA PRINCIPAL
    location /prometheus/ {
        proxy_pass http://localhost:9090/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Prefix /prometheus;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Aplicação principal - DEVE VIR DEPOIS DAS ROTAS ESPECÍFICAS
    location / {
        proxy_pass http://localhost:3000;
        # ... suas configurações existentes ...
    }
}
```

### 2. Testar e recarregar o Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 3. Garantir que os containers estão rodando

```bash
# Verificar se Grafana e Prometheus estão rodando
docker ps | grep -E 'grafana|prometheus'

# Se não estiverem rodando, iniciar com o profile observability
cd /tmp/transaction-processor-api/docker
docker compose --profile observability up -d
```

## Credenciais Padrão

- **Grafana**: 
  - Usuário: `admin`
  - Senha: `admin`
  - ⚠️ **IMPORTANTE**: Altere a senha após o primeiro acesso!

- **Prometheus**: 
  - Acesso público (sem autenticação por padrão)
  - ⚠️ **IMPORTANTE**: Considere adicionar autenticação básica no Nginx para produção

## Segurança

Para produção, recomenda-se:

1. **Autenticação básica no Nginx** para Prometheus:
```nginx
location /prometheus/ {
    auth_basic "Prometheus Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    # ... resto da configuração ...
}
```

2. **Alterar senha padrão do Grafana** imediatamente após o primeiro acesso

3. **Restringir acesso por IP** se necessário:
```nginx
location /grafana/ {
    allow 192.168.1.0/24;  # Seu IP/range
    deny all;
    # ... resto da configuração ...
}
```

