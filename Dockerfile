# ─── Stage 1: Build frontend ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build backend ───────────────────────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build 2>/dev/null || true

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

WORKDIR /app

# Copy backend deps and built files
COPY --from=backend-builder /app/backend/node_modules ./node_modules
COPY --from=backend-builder /app/backend/src ./src
COPY backend/package*.json ./

# Copy built frontend into a public folder the server will serve
COPY --from=frontend-builder /app/frontend/dist ./public

# Install tsx for running TS directly in prod (lightweight)
RUN npm install -g tsx

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

# The backend serves both API and static frontend in Docker mode
CMD ["dumb-init", "tsx", "src/server.ts"]
