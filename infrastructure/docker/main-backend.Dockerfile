FROM node:20-alpine AS builder

# Cài đặt pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy các file cấu hình workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy các package phụ thuộc (shared, database)
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared

# Copy source code của backend
COPY services/main-backend ./services/main-backend

# Cài đặt dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma Client (nếu có dùng Prisma)
WORKDIR /app/packages/database
RUN pnpm prisma generate

# Build backend
WORKDIR /app/services/main-backend
RUN pnpm build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Copy từ builder sang (chỉ lấy những gì cần thiết để chạy)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/services/main-backend/dist ./services/main-backend/dist
COPY --from=builder /app/services/main-backend/node_modules ./services/main-backend/node_modules
COPY --from=builder /app/services/main-backend/package.json ./services/main-backend/package.json

# Thiết lập biến môi trường
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Lệnh chạy
CMD ["node", "services/main-backend/dist/main"]