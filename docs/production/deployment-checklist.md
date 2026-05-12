# Deployment Checklist

## Mục tiêu

Checklist này dùng cho việc đưa dự án lên `staging` trước, sau đó mới lên `production`.

Tài liệu tập trung vào 3 phần:

- chuẩn bị hạ tầng và secrets
- hoàn thiện các điểm kỹ thuật còn local-first trong codebase
- kiểm tra sau deploy để giảm rủi ro go-live

## 1. Checklist chuẩn bị trước khi tạo hạ tầng

- [ ] Chốt domain chính thức cho API production.
- [ ] Chốt subdomain cho staging.
- [ ] Chọn stack triển khai chính thức theo `service-comparison.md`.
- [ ] Tạo tài khoản hoặc project cho Fly.io, Neon, Cloudflare, Expo EAS và Sentry.
- [ ] Xác nhận quyền truy cập GitHub repo cho các thành viên phụ trách deploy.

## 2. Checklist hạ tầng và external services

### Backend hosting

- [ ] Tạo Fly app `main-backend-staging`.
- [ ] Tạo Fly app `main-backend-production`.
- [ ] Chốt `primary_region` cho staging và production.
- [ ] Chuẩn bị `fly.toml` hoặc biến thể config riêng cho staging và production.
- [ ] Cấu hình `[http_service.checks]` trỏ tới health endpoint của backend.
- [ ] Cấu hình `min_machines_running` phù hợp, đặc biệt cho production.

### Database

- [ ] Tạo PostgreSQL staging.
- [ ] Tạo PostgreSQL production.
- [ ] Lưu riêng `DATABASE_URL` cho từng môi trường.
- [ ] Bật backup và kiểm tra retention policy.
- [ ] Kiểm tra giới hạn connection có phù hợp với runtime backend.

### DNS và SSL

- [ ] Trỏ `api-staging` về backend staging.
- [ ] Trỏ `api` production về backend production.
- [ ] Xác nhận SSL hoạt động bình thường.
- [ ] Cấu hình proxy hoặc DNS mode phù hợp trên Cloudflare.

### Mobile release

- [ ] Tạo EAS project nếu chưa có.
- [ ] Tạo EAS environment `preview`.
- [ ] Tạo EAS environment `production`.
- [ ] Kiểm tra quyền Play Console hoặc App Store Connect.

## 3. Checklist secrets và env vars

- [ ] Điền `DATABASE_URL` cho staging.
- [ ] Điền `DATABASE_URL` cho production.
- [ ] Điền `JWT_SECRET` riêng cho staging.
- [ ] Điền `JWT_SECRET` riêng cho production.
- [ ] Điền `JWT_EXPIRES_IN`.
- [ ] Điền `GOOGLE_WEB_CLIENT_ID` đúng theo từng môi trường.
- [ ] Điền `CLOUDINARY_CLOUD_NAME`.
- [ ] Điền `CLOUDINARY_API_KEY`.
- [ ] Điền `CLOUDINARY_API_SECRET`.
- [ ] Điền `EXPO_PUBLIC_API_BASE_URL` cho preview.
- [ ] Điền `EXPO_PUBLIC_API_BASE_URL` cho production.
- [ ] Điền `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` cho preview.
- [ ] Điền `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` cho production.
- [ ] Điền `EXPO_TOKEN` cho GitHub Actions.
- [ ] Điền `FLY_API_TOKEN` cho GitHub Actions.

## 4. Checklist codebase cần hoàn thiện trước deploy thật

### Backend

- [ ] Thêm health endpoint riêng ngoài route gốc.
- [ ] Chuyển CORS từ wildcard sang allowlist theo domain thật.
- [ ] Chuyển Swagger server URL sang biến môi trường.
- [ ] Bảo đảm backend không phụ thuộc `.env` root trong production runtime.
- [ ] Thêm logging tối thiểu cho startup, DB connection và lỗi auth/media.
- [ ] Map health endpoint vào cấu hình health check của `fly.toml`.

### Database và Prisma

- [ ] Rà lại migration hiện tại có đầy đủ cho production.
- [ ] Tạo script hoặc step rõ ràng cho `prisma migrate deploy`.
- [ ] Xác nhận seed data nào là bắt buộc cho staging và production.

### Mobile app

- [ ] Xác nhận `EXPO_PUBLIC_API_BASE_URL` không còn trỏ local.
- [ ] Xác nhận Google sign-in hoạt động với build preview.
- [ ] Xác nhận mobile không phụ thuộc `.env` local khi chạy build CI.

### Security cơ bản

- [ ] Bật branch protection cho `main`.
- [ ] Yêu cầu Pull Request review trước merge.
- [ ] Không để secret xuất hiện trong logs hoặc file commit.
- [ ] Cân nhắc rate limiting cho các route auth và upload.

## 5. Checklist CI/CD

- [ ] Tạo workflow CI cho Pull Request.
- [ ] Tạo workflow deploy staging backend.
- [ ] Tạo workflow deploy production backend.
- [ ] Tạo workflow preview build cho mobile.
- [ ] Tạo workflow production release cho mobile.
- [ ] Tạo GitHub Environments `staging` và `production`.
- [ ] Bật required reviewers cho environment `production`.

## 6. Checklist trước khi deploy staging lần đầu

- [ ] Backend build pass trên CI.
- [ ] Unit test backend pass.
- [ ] E2E backend pass với Postgres.
- [ ] Mobile test pass.
- [ ] Fly app staging đã tạo xong.
- [ ] `fly.toml` staging đã hợp lệ.
- [ ] Database staging đã tạo xong.
- [ ] Secrets staging đã điền đủ.
- [ ] Smoke test script hoặc checklist đã sẵn sàng.

## 7. Smoke test sau khi deploy staging

- [ ] API có thể truy cập qua domain staging.
- [ ] Health endpoint trả về `200`.
- [ ] Swagger hoặc route public cơ bản không lỗi bootstrap.
- [ ] Backend kết nối được database.
- [ ] Đăng nhập Google trên mobile preview build hoạt động.
- [ ] Các flow chính hoạt động: auth, profile, menu, template, meal search.
- [ ] Upload media hoặc đường dẫn Cloudinary hoạt động nếu feature đó đã mở.

## 8. Checklist trước khi go-live production

- [ ] Staging đã chạy ổn định đủ lâu để QA xác nhận.
- [ ] Production secrets đã được điền đủ.
- [ ] Database production đã bật backup.
- [ ] Production domain và SSL đã sẵn sàng.
- [ ] Fly app production đã có cấu hình region, health check và machine baseline phù hợp.
- [ ] Mobile production build đã trỏ đúng production API.
- [ ] Kế hoạch rollback đã được thống nhất.
- [ ] Người chịu trách nhiệm go-live đã được phân công.

## 9. Smoke test ngay sau deploy production

- [ ] API production trả lời bình thường.
- [ ] Không có lỗi bootstrap hoặc migration trên logs.
- [ ] Đăng nhập Google hoạt động.
- [ ] User mới có thể tạo profile.
- [ ] User hiện có có thể tải menu/template bình thường.
- [ ] Upload media không lỗi credential.
- [ ] Sentry nhận được event test hoặc error sample.

## 10. Kế hoạch rollback tối thiểu

### Backend rollback

- [ ] Xác định commit hoặc tag ổn định gần nhất.
- [ ] Có khả năng redeploy build ổn định nhanh qua `flyctl deploy`.
- [ ] Nếu đội dùng `GHCR` như thành phần tùy chọn, xác nhận image cũ vẫn còn khả dụng.
- [ ] Xác nhận migration mới không phá rollback ở mức dữ liệu.

### Mobile rollback

- [ ] Nếu lỗi nằm ở JavaScript runtime phù hợp, chuẩn bị `EAS Update` để vá nóng.
- [ ] Nếu lỗi nằm ở native layer, chuẩn bị phát hành build mới.

## 11. Definition of done cho production readiness

- [ ] Có staging hoạt động thực tế ngoài local.
- [ ] Có production backend deploy được bằng pipeline.
- [ ] Có mobile preview build và production build dùng đúng API domain.
- [ ] Secrets được tách rõ giữa staging và production.
- [ ] Có smoke test và rollback checklist rõ ràng.