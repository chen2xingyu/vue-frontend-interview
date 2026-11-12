# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
RUN npm install -g pnpm@12 && pnpm install --frozen-lockfile

COPY server/ ./server/

# ---------- Run stage ----------
FROM node:22-alpine AS runner
WORKDIR /app

# 非 root 用户运行 —— 最小权限原则
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder --chown=app:app /app/server ./server
COPY --from=builder --chown=app:app /app/node_modules ./node_modules

USER app
WORKDIR /app/server

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
