# Meal Planner Monorepo

Ứng dụng lên kế hoạch bữa ăn cá nhân hóa, giúp người dùng quản lý thực đơn hàng ngày một cách khoa học và tiện lợi.

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** (Package Manager)
- **Docker** (Cho local Database & Services)
- **Android Studio** + JDK 17 (Cho Mobile Development)

---

## ⚡ Quy trình cài đặt

### Bước 1: Clone & Install Dependencies

```bash
git clone <repo-url>
cd meal-planner-monorepo
pnpm install
```

### Bước 2: Setup Environment Variables

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
```

**Mac/Linux:**

```bash
cp .env.example .env
```

> **Quan trọng:** Kiểm tra file `.env` để đảm bảo cấu hình `DATABASE_URL` và `PORT` phù hợp (mặc định đã được cấu hình sẵn cho môi trường local với Docker).

### Bước 3: Setup Infrastructure & Database

```bash
# 1. Khởi động PostgreSQL & Nginx qua Docker
pnpm infra:up

# 2. Tạo schema & Generate Prisma Client
pnpm prisma:generate

# 3. Đồng bộ Schema lên DB (Development Mode)
pnpm prisma:migrate
```

### Bước 4: Start Development

Bạn có thể chạy song song cả Backend và Mobile App hoặc chạy riêng lẻ từng service.

**Backend (NestJS):**

```bash
pnpm dev:backend
# API Server sẽ chạy tại: http://localhost:3000/api
```

**Mobile App (Expo):**

```bash
pnpm dev:mobile
# Quét mã QR bằng ứng dụng Expo Go hoặc nhấn 'a' để chạy trên Android Emulator
```

---

## 🛠️ Quy trình phát triển (Development Workflow)

### 1. Database & ORM (Prisma)

Hệ thống sử dụng **Prisma** làm ORM và Single Source of Truth cho Database Schema.

- **Schema Location**: `packages/database/prisma/schema.prisma`
- **Các lệnh thường dùng**:
  - Start Database Only: `pnpm db:up`
  - Stop Database: `pnpm db:stop`
  - Open Prisma Studio (GUI quản lý DB): `pnpm prisma:studio`
  - Generate Client (sau khi sửa schema): `pnpm prisma:generate`
  - Run Migrations: `pnpm prisma:migrate`

### 2. Backend API (NestJS)

Backend được xây dựng bằng NestJS, cung cấp RESTful API cho Mobile App.

- **Location**: `services/main-backend`
- **Port Mặc định**: 3000
- **Global Prefix**: `/api`
- **Testing**: `pnpm --filter main-backend test`

### 3. Mobile App (React Native / Expo)

Mobile App được xây dựng bằng React Native với Expo Framework.

- **Location**: `apps/mobile-app`
- **Chạy trên Android Emulator**:
  1. Mở Android Studio & Start Emulator.
  2. Chạy lệnh `pnpm dev:mobile`.
  3. Nhấn phím `a` trong terminal để mở ứng dụng trên Android.

---

## 📁 Project Structure

```
meal-planner-monorepo/
├── apps/
│   └── mobile-app/       # React Native (Expo) Mobile App source code
├── services/
│   └── main-backend/     # NestJS Backend API source code
├── packages/
│   ├── database/         # Prisma Schema, Migrations & Client Configuration
│   └── shared/           # Shared Libraries, Types & Utilities
├── infrastructure/       # Docker Compose & Nginx Configuration
└── .env.example          # Template Environment Variables
```

## 📝 Notes

- Dự án sử dụng **pnpm workspaces** để quản lý monorepo.
- Đảm bảo Docker đang chạy trước khi thực hiện các lệnh liên quan đến database.
