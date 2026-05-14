# Environments And Secrets

## Mục tiêu

Tài liệu này mô tả cách tách môi trường và quản lý biến môi trường cho dự án trước khi đưa lên production.

Nguyên tắc chung:

- `local`, `staging`, `production` là ba môi trường độc lập
- không dùng chung database giữa các môi trường
- secrets không commit vào repo
- mobile public config và backend secret config phải tách rõ

## Ma trận môi trường

| Môi trường | Mục đích | Domain gợi ý | Database | Deploy trigger |
| --- | --- | --- | --- | --- |
| `local` | dev cá nhân | `localhost` | local Docker Postgres | chạy tay |
| `staging` | QA và kiểm thử tích hợp | `api-staging.example.com` | managed Postgres staging | merge vào `main` |
| `production` | người dùng thật | `api.example.com` | managed Postgres production | manual approval hoặc tag release |

## Branch và environment là hai khái niệm khác nhau

| Loại | Ví dụ | Vai trò |
| --- | --- | --- |
| Branch | `feature/*`, `develop`, `main` | quản lý source code, Pull Request và merge |
| Environment | `local`, `staging`, `production` | quản lý runtime, domain, secrets, database và traffic |

Điểm cần nhớ:

- `develop` nếu có chỉ là branch tích hợp code, không phải staging
- `main` chỉ là branch nguồn để deploy, không tự động đồng nghĩa với production
- `staging` là environment deploy riêng, thường nhận commit từ `main`
- `local` là môi trường chạy trên máy cá nhân, không phải branch

Flow gợi ý cho repo này:

1. dev làm việc trên branch tính năng và kiểm thử ở `local`
2. merge vào `main`
3. CI/CD deploy `main` lên `staging`
4. sau khi QA pass mới promote cùng commit đó lên `production`

## Phân loại biến môi trường

### 1. Backend secrets

Các biến này chỉ tồn tại ở môi trường deploy backend, không đưa vào Expo public config.

| Biến | Bắt buộc | Vai trò | Môi trường sử dụng |
| --- | --- | --- | --- |
| `DATABASE_URL` | Có | Kết nối Prisma tới PostgreSQL | staging, production |
| `PORT` | Có | Port runtime của backend | staging, production |
| `JWT_SECRET` | Có | Ký và verify JWT | staging, production |
| `JWT_EXPIRES_IN` | Có | TTL của access token | staging, production |
| `GOOGLE_WEB_CLIENT_ID` | Có | Verify Google ID token ở backend | staging, production |
| `CLOUDINARY_CLOUD_NAME` | Có | Cloudinary cloud name | staging, production |
| `CLOUDINARY_API_KEY` | Có | Cloudinary API key | staging, production |
| `CLOUDINARY_API_SECRET` | Có | Cloudinary API secret | staging, production |

### 2. Mobile public runtime config

Các biến này được đưa vào build của Expo mobile app. Dù mang tiền tố `EXPO_PUBLIC_`, vẫn cần quản lý theo từng môi trường vì giá trị sai sẽ làm app gọi nhầm API hoặc dùng sai Google client ID.

| Biến | Bắt buộc | Vai trò | Môi trường sử dụng |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Có | Base URL để mobile gọi backend | staging, production |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Có | Google Web client ID cho native sign-in flow hiện tại | staging, production |

## Nguồn tham chiếu hiện tại trong repo

Các biến môi trường trên đang xuất hiện trong:

- `.env.example`
- `apps/mobile-app/app.config.js`
- `services/main-backend/src/main.ts`
- `services/main-backend/src/auth/auth.module.ts`
- `services/main-backend/src/auth/auth.service.ts`
- `services/main-backend/src/database/prisma.service.ts`

## Cách quản lý secrets theo nền tảng

### GitHub

GitHub nên dùng để giữ secrets và variables phục vụ pipeline CI/CD:

Secrets:

- `FLY_API_TOKEN`
- `EXPO_TOKEN`
- `SENTRY_AUTH_TOKEN` nếu dùng release integration

Variables:

- `FLY_APP_NAME_STAGING`
- `FLY_APP_NAME_PRODUCTION`
- `FLY_REGION_STAGING` nếu muốn cố định `primary_region`
- `FLY_REGION_PRODUCTION` nếu muốn cố định `primary_region`

Ngoài ra nên bật `GitHub Environments`:

- environment `staging`
- environment `production` có manual approval

### Fly.io

Fly.io giữ secrets runtime cho backend:

- `DATABASE_URL`
- `PORT`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_WEB_CLIENT_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Các quy tắc nên áp dụng với Fly.io:

- giá trị nhạy cảm nên được set bằng `fly secrets set` hoặc qua dashboard Fly.io
- secret của Fly.io xuất hiện dưới dạng environment variables ở runtime, không dùng được ở build time
- giá trị không nhạy cảm như `app`, `primary_region`, `[http_service]`, `[http_service.checks]` và `[env]` nên nằm trong `fly.toml`
- nếu cần giá trị ở build time, chỉ đưa các giá trị không nhạy cảm vào `[build.args]`

### Expo EAS

EAS giữ public env cho mobile app:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

Có thể tách theo environment:

- `preview`
- `production`

## Quy tắc đặt giá trị theo môi trường

### Staging

- Dùng domain staging rõ ràng.
- Google OAuth dùng bộ client ID staging riêng nếu cấu hình Google project tách môi trường.
- JWT secret khác production.
- Cloudinary có thể dùng chung tài khoản trong giai đoạn đầu, nhưng nên tách folder/preset hoặc tách cloud nếu dữ liệu nhạy cảm.

### Production

- Chỉ dùng domain chính thức.
- Không tái sử dụng `JWT_SECRET` của staging.
- Database URL trỏ vào database production riêng.
- Google client ID và redirect configuration phải được xác nhận lại trước khi phát hành mobile build store.

## Quy tắc vận hành secrets

- Không đọc `.env` root trực tiếp trong production container.
- Không commit file `.env.production` chứa secret thật.
- Không truyền secret sang mobile app dưới dạng `EXPO_PUBLIC_*` nếu không thực sự cần public.
- Mỗi lần rotate `JWT_SECRET`, cần cân nhắc ảnh hưởng tới session hiện tại của người dùng.
- Mỗi thay đổi `EXPO_PUBLIC_API_BASE_URL` hoặc Google client ID cần build lại mobile nếu dùng native build.

## Danh sách secrets cần chuẩn bị trước lần deploy đầu tiên

- backend staging env
- backend production env
- mobile EAS env cho `preview`
- mobile EAS env cho `production`
- token deploy cho Fly.io
- token deploy cho Expo EAS
- DSN cho Sentry backend và mobile nếu bật monitoring

## Việc cần hoàn thiện trong codebase để quản lý secrets sạch hơn

- backend nên ưu tiên env injection từ platform thay vì phụ thuộc `.env` root của monorepo
- Swagger `server` nên lấy từ env để không ghi cứng `localhost`
- mobile build nên xác nhận mọi public env đều được quản lý bằng EAS environment thay vì trông chờ `.env` local
- nên chốt cách tách `fly.toml` giữa `staging` và `production` trước khi viết workflow deploy