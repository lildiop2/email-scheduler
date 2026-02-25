# Email Scheduler

## Requisitos
- Node.js 18+
- PostgreSQL, RabbitMQ e MinIO rodando

## Configuracao
1. Copie `.env.example` para `.env` na raiz e ajuste as variaveis.
2. Instale dependencias na raiz:

```bash
npm install
```

## Prisma (API)
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed cria um usuario `admin@example.com` com senha `admin1234`.

## Desenvolvimento
Em terminais separados:

```bash
npm run dev:api
npm run dev:worker
npm run dev:frontend
```

Frontend padrao em `http://localhost:5173` e API em `http://localhost:3000`.

## Build
```bash
npm --workspace backend/api run build
npm --workspace backend/worker run build
npm --workspace frontend run build
```
