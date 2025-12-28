# Husky Git Hooks

Este projeto usa Husky para executar verificações automáticas antes de commits e pushes.

## Hooks Configurados

### pre-commit
Executa antes de cada commit:
- ✅ Testes unitários (`npm run test:unit`)

**Objetivo:** Garantir que código básico não quebre antes de commitar.

### pre-push
Executa antes de cada push:
- ✅ Lint com auto-fix (`npm run lint`)
- ✅ Todos os testes (`npm run test:all`)

**Objetivo:** Garantir qualidade completa antes de enviar código ao repositório remoto.

## Como Funciona

1. **Pre-commit:** Rápido, roda apenas testes unitários para não atrasar commits
2. **Pre-push:** Completo, roda lint e todos os testes antes de enviar ao remoto

## Pular Hooks (NÃO RECOMENDADO)

Se precisar pular os hooks temporariamente:

```bash
# Pular pre-commit
git commit --no-verify

# Pular pre-push
git push --no-verify
```

**⚠️ Use apenas em emergências!**

