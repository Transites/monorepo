# Testes Deprecated (Arquivados)

Este diretório contém testes para funcionalidades **legacy/deprecated** que não estão mais em uso pelo frontend React.

## 📋 Conteúdo

### `/auth` - Autenticação de Admin
- **Status**: ❌ **TOTALMENTE DEPRECATED**
- **Motivo**: Interface de admin não foi implementada no frontend React
- **Testes arquivados**:
  - `auth.services.test.js` - testes do serviço de autenticação
  - `auth.controllers.test.js` - testes do controller de autenticação

### `/upload` - Sistema de Upload de Arquivos
- **Status**: ❌ **TOTALMENTE DEPRECATED**
- **Motivo**: Sistema de upload não é usado pelo frontend React (parte do workflow descontinuado)
- **Testes arquivados**:
  - `upload.test.ts` - testes do serviço de upload
  - `upload.controllers.test.ts` - testes do controller de upload

### `/tokens` - Sistema de Tokens de Submissão
- **Status**: ❌ **TOTALMENTE DEPRECATED**
- **Motivo**: Workflows baseados em tokens não são usados pelo frontend React
- **Testes arquivados**:
  - `tokens.test.js` - testes do serviço de tokens
  - `tokens.middleware.test.js` - testes do middleware de tokens

### `/submission` - Testes Legacy de Submission
- **Status**: ⚠️ **PARCIALMENTE DEPRECATED**
- **Motivo**: Muitos endpoints de submission usam tokens (deprecated), mas endpoints públicos (GET/list/search) ainda estão em uso
- **Testes arquivados**:
  - `00-submission.controllers.legacy.test.ts` - testes de controllers legacy
  - `01-submission.services.legacy.test.ts` - testes de services legacy
- **Testes ativos**: Veja `test/submission.test.js` para endpoints públicos

## 🔍 Como esses testes foram removidos da execução

No `package.json`, a configuração Jest foi atualizada:

```json
{
  "jest": {
    "testPathIgnorePatterns": [
      "integration",
      "database",
      "deprecated"
    ]
  }
}
```

## 📝 Histórico de Arquivamento

**Data**: 28 de maio de 2026  
**Motivo**: Limpeza de testes desnecessários de funcionalidades legacy  
**Mudança**: Opção C - extrair testes ativos de submission e arquivar toda funcionalidade descontinuada

## ⚠️ Nota Importante

Estes testes **não são executados** pela suite padrão de testes. Se você precisar testar alguma funcionalidade legacy:

```bash
# Para executar testes deprecated especificamente
npm test -- --testPathPattern=deprecated
```

## 🚀 Funcionalidades Ainda Ativas

Para testes de funcionalidades **atualmente em uso**, veja:
- `test/submission.test.js` - endpoints públicos de submission (LIST, GET, SEARCH)
- `test/controllers/submission.controllers.test.ts` - testes de controllers ativos
- `test/services/submission.test.ts` - testes de services ativos
- Testes de integração em `test/integration/`
