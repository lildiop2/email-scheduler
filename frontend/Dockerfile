FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/api/package.json backend/api/package.json
COPY backend/worker/package.json backend/worker/package.json
COPY frontend/package.json frontend/package.json
RUN npm ci

COPY frontend frontend

# Default production API base for reverse-proxy setups.
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}
RUN npm --workspace frontend run build

FROM nginx:1.27-alpine AS runner

COPY frontend/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
