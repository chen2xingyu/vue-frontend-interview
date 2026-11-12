# ---------- Build stage ----------
FROM node:22-alpine AS builder
WORKDIR /app

# 利用 Docker 缓存层：先只复制 lockfile + workspace 配置
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
RUN npm install -g pnpm@12 && pnpm install --frozen-lockfile

# 再复制源码（源码变动不会让 install 缓存失效）
COPY . .
RUN pnpm --filter web build

# ---------- Serve stage ----------
# P9 面试点：多阶段构建为什么选 nginx？
# —— 体积小（alpine + nginx ≈ 50MB）、安全、社区成熟、支持静态文件缓存
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
