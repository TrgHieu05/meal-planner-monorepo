# Production Documentation

## Mục tiêu

Thư mục này gom toàn bộ tài liệu cần thiết để đưa `meal-planner-monorepo` từ môi trường local lên production một cách có kiểm soát.

Phạm vi tài liệu bao gồm:

- kiến trúc production mục tiêu cho mobile app, backend và database
- phân tách môi trường `local`, `staging`, `production`
- giải thích rõ mối quan hệ giữa branch như `develop`, `main` và environment như `local`, `staging`, `production`
- quản lý secrets và biến môi trường
- pipeline CI/CD cho backend và mobile app
- so sánh các dịch vụ có thể dùng trong từng vai trò hạ tầng
- checklist trước, trong và sau khi go-live

## Khuyến nghị stack mặc định

Đây là stack nên ưu tiên cho giai đoạn đầu vì phù hợp với cấu trúc repo hiện tại, ít chi phí vận hành và không buộc đội dự án phải quản trị hạ tầng quá sâu:

- `GitHub Actions`: chạy CI/CD
- `Fly.io`: chạy backend `services/main-backend` bằng `flyctl` và `fly.toml`
- `Neon Postgres`: managed PostgreSQL cho Prisma
- `Cloudflare`: DNS, SSL, CDN và lớp bảo vệ cơ bản
- `Expo EAS`: build, submit và update mobile app
- `Cloudinary`: media storage cho ảnh
- `Sentry`: theo dõi lỗi runtime cho backend và mobile app

`GHCR` có thể giữ như lựa chọn phụ nếu đội dự án muốn lưu Docker image riêng cho mục đích rollback hoặc audit, nhưng không còn là thành phần bắt buộc trong luồng deploy chuẩn với `Fly.io`.

Stack này phù hợp vì repo hiện tại đã có:

- backend NestJS đóng gói bằng Docker tại `infrastructure/docker/main-backend.Dockerfile`
- schema Prisma/PostgreSQL tại `packages/database/prisma/schema.prisma`
- mobile app Expo/EAS tại `apps/mobile-app/eas.json`
- biến môi trường cho Cloudinary, Google sign-in và API base URL trong `.env.example`

## Thứ tự đọc tài liệu

1. `architecture.md`: kiến trúc production đích và phân vai các thành phần.
2. `staging.md`: giải thích `staging` là gì, khác `local` và `production` ở đâu, và cách tạo cho repo này.
3. `environments-and-secrets.md`: định nghĩa môi trường, domain, secrets và cách quản lý.
4. `ci-cd-plan.md`: pipeline CI/CD cho PR, staging và production.
5. `service-comparison.md`: so sánh các dịch vụ và giải thích vai trò của từng nhóm dịch vụ.
6. `deployment-checklist.md`: checklist triển khai, smoke test và rollback.

## Kết quả mong muốn sau khi hoàn tất bộ tài liệu này

- Backend API có thể deploy lặp lại được từ GitHub Actions qua `flyctl deploy`.
- Database migration được áp dụng theo flow production an toàn.
- Mobile app có flow phát hành riêng với `EAS Build` và `EAS Submit`.
- Secrets được tách rõ giữa `staging` và `production`.
- Nhóm phát triển có checklist rõ ràng cho lần deploy đầu tiên và các lần release sau.