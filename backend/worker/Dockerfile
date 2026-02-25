FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/package.json
COPY backend/worker/package.json backend/worker/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend backend

# Prisma client is shared via @prisma/client and must be generated before build.
RUN npm --workspace backend/api run prisma:generate
RUN npm --workspace backend/worker run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/worker/package.json ./backend/worker/package.json
COPY --from=builder /app/backend/worker/dist ./backend/worker/dist

CMD ["node", "backend/worker/dist/server.js"]
