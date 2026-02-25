# 1. Objetivo do Sistema

Construir um **Email Scheduler escalável** que permita:

- Criar emails com:
  - Assunto
  - Corpo HTML
  - Múltiplos destinatários (TO, CC, BCC)
  - Múltiplos anexos

- Agendar envio para uma data futura
- Processar envio de forma assíncrona
- Utilizar SMTP Hostinger
- Garantir idempotência e escalabilidade horizontal

---

# 2. Requisitos Técnicos Obrigatórios

## Backend

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Zod
- JWT Auth
- RabbitMQ
- MinIO (S3-compatible)
- Nodemailer (SMTP Hostinger)

## Frontend

- Vue 3 (Composition API)
- Zod (validação de formulário)
- TailwindCSS
- FontAwesome
- Axios
- Pinia

---

# 3. Arquitetura de Serviços

Separar em **dois serviços independentes**:

### 1️⃣ API Service (REST)

Responsável por:

- Auth
- CRUD de Emails
- Upload metadata
- Scheduler Publisher
- Publicar mensagens no RabbitMQ

### 2️⃣ Worker Service

Responsável por:

- Consumir fila
- Buscar email no banco
- Baixar anexos do MinIO
- Enviar via SMTP
- Atualizar status

---

# 4. Estrutura de Pastas Backend

```id="struct1"
backend/
 ├── api/
 │    ├── src/
 │    │    ├── modules/
 │    │    ├── infrastructure/
 │    │    ├── middlewares/
 │    │    ├── scheduler/
 │    │    └── server.ts
 │
 ├── worker/
 │    ├── src/
 │    │    ├── consumer.ts
 │    │    ├── email.processor.ts
 │    │    └── server.ts
```

Separar repositório se necessário, mas manter boundary claro.

---

# 5. Modelo de Dados (Prisma)

O agente deve implementar exatamente:

## User

- id (uuid)
- email (unique)
- password_hash
- created_at

## Email

- id (uuid)
- user_id (FK)
- subject
- body_html
- status ENUM
- scheduled_at
- sent_at (nullable)
- retry_count (default 0)
- error_message (nullable)
- created_at

## Recipient

- id
- email_id
- type ENUM (TO, CC, BCC)
- email

## Attachment

- id
- email_id
- filename
- mime_type
- size
- storage_key

---

# 6. Estados do Email

Definir enum:

```id="enum1"
DRAFT
SCHEDULED
PROCESSING
SENT
FAILED
```

Transições permitidas:

- DRAFT → SCHEDULED
- SCHEDULED → PROCESSING
- PROCESSING → SENT
- PROCESSING → FAILED

Nunca permitir reprocessamento se status = SENT.

---

# 7. Fluxo Completo

## Criação de Email

1. Validar payload com Zod.
2. Salvar Email como SCHEDULED.
3. Salvar Recipients.
4. Salvar Attachments metadata.
5. Não enviar email nesse momento.

---

## Upload de Anexos

Fluxo obrigatório:

1. API gera presigned URL MinIO.
2. Frontend faz upload direto.
3. Backend apenas armazena metadata.

Nunca fazer upload passando pelo backend.

---

## Scheduler Publisher

Implementar processo interno na API:

- Rodar a cada 30 segundos.
- Query:

```sql id="sql1"
SELECT id FROM emails
WHERE status = 'SCHEDULED'
AND scheduled_at <= now()
LIMIT 100
FOR UPDATE SKIP LOCKED;
```

Para cada email:

- Atualizar status → PROCESSING
- Publicar mensagem no RabbitMQ:

```json id="msg1"
{ "emailId": "uuid" }
```

---

# 8. RabbitMQ Design

## Exchange

- email.exchange (direct)

## Queue

- email.send.queue

## Routing key

- email.send

Configurar:

- durable: true
- manual ack
- prefetch: 10

---

# 9. Worker Lógica

Para cada mensagem:

1. Buscar email no banco.
2. Se status != PROCESSING → ACK e ignorar.
3. Baixar anexos do MinIO via stream.
4. Enviar via SMTP Hostinger.
5. Se sucesso:
   - status = SENT
   - sent_at = now()

6. Se erro:
   - increment retry_count
   - Se retry_count < 5 → requeue
   - Se >= 5 → status = FAILED

7. ACK apenas após update no banco.

---

# 10. SMTP Hostinger

Configurar transporter:

- host: smtp.hostinger.com
- port: 465
- secure: true
- auth via env vars

Nunca hardcode credenciais.

---

# 11. JWT Auth

Implementar:

- Access Token (15min)
- Refresh Token (persistido)

Middleware:

- Extrair Bearer token
- Validar assinatura
- Popular req.user

Claims mínimas:

```id="claims1"
sub
email
```

---

# 12. Validação com Zod

Criar schemas:

- RegisterSchema
- LoginSchema
- CreateEmailSchema
- UpdateEmailSchema

Validar no boundary (controller).

---

# 13. Requisitos de Escalabilidade

O agente deve garantir:

- API stateless
- Worker horizontalmente escalável
- Idempotência garantida
- Uso de FOR UPDATE SKIP LOCKED
- Nenhum envio síncrono

---

# 14. Segurança

Obrigatório:

- Rate limiting
- Limite de tamanho de anexo
- Sanitização HTML
- TLS
- Env vars para secrets

---

# 15. Observabilidade

Implementar:

- Logs estruturados (pino)
- Health check endpoints:
  - DB
  - RabbitMQ
  - MinIO

- Métrica básica de emails enviados

---

# 16. Frontend Estrutura

```id="struct2"
frontend/
 ├── src/
 │    ├── views/
 │    ├── components/
 │    ├── stores/
 │    ├── services/
 │    └── router/
```

---

## Telas Obrigatórias

- Login
- Dashboard
- Criar Email
- Listar:
  - SCHEDULED
  - SENT
  - FAILED

---

## Formulário Criar Email

Campos:

- Subject
- Body (rich text)
- Recipients
- Attachments
- Scheduled DateTime

Validação Zod obrigatória.

---

# 17. Regras de Idempotência

- Worker deve ignorar se status != PROCESSING
- Nunca reenviar se SENT
- Retry controlado por retry_count

---

# 18. Critérios de Aceitação

O sistema será considerado completo quando:

- Emails são agendados corretamente
- Emails são enviados no horário correto
- Falhas são reprocessadas até 5 vezes
- Anexos funcionam corretamente
- Sistema escala com múltiplos workers
- Nenhum envio ocorre na thread da API

---
