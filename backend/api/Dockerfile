FROM node:20-alpine AS builder

WORKDIR /app

# Install workspace dependencies using lockfile for reproducible builds.
COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/package.json
COPY backend/worker/package.json backend/worker/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY backend backend

RUN npm --workspace backend/api run prisma:generate
RUN npm --workspace backend/api run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/backend/api/package.json ./backend/api/package.json
COPY --from=builder /app/backend/api/dist ./backend/api/dist
COPY --from=builder /app/backend/api/prisma ./backend/api/prisma

EXPOSE 3000

CMD ["node", "backend/api/dist/server.js"]
