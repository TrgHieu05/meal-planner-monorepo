# Deployment Checklist

## Mục tiêu

Checklist này dùng cho việc dựng preview trên `staging` trước merge, sau đó tự động release lên `production` sau khi PR được approve và merge.

Tài liệu tập trung vào 3 phần:

- chuẩn bị hạ tầng và secrets
- hoàn thiện các điểm kỹ thuật còn local-first trong codebase
- kiểm tra sau deploy để giảm rủi ro go-live

## Cách đọc checklist này

Checklist dưới đây được sắp theo đúng flow triển khai thực tế:

1. chốt quyết định ban đầu
2. làm sạch codebase để có thể deploy
3. thiết lập GitHub governance và CI/CD
4. dựng `staging`
5. deploy và kiểm thử `staging`
6. dựng `production`
7. go-live `production`

Vẫn có thể tạo trước một phần hạ tầng production nếu team muốn, nhưng không nên bỏ qua bước `preview trên staging -> QA pass -> approve + merge` trước khi release cho người dùng thật.

## Staging cho repo này gồm những gì?

`Staging` trong tài liệu này là một environment deploy riêng, không phải branch `develop` hay `main`.

Với repo hiện tại, staging tối thiểu nên gồm:

- 1 backend staging app cố định
- 1 Neon preview branch `schema-only` được tạo tạm cho Pull Request đang review
- 1 bộ env vars và secrets staging riêng
- 1 domain staging riêng, ví dụ `api-staging.example.com`
- 1 mobile preview build trỏ đúng vào API staging
- 1 checklist smoke test sau deploy

Nếu thiếu một trong các thành phần trên, hệ thống đó thường mới chỉ là local mở rộng hoặc shared dev setup, chưa nên xem là staging hoàn chỉnh.

Với mô hình một staging app cố định, preview mới nhất sẽ ghi đè preview cũ nếu có nhiều Pull Request chạy preview song song.

## 1. Quyết định ban đầu và quyền truy cập

- [X] Chọn stack triển khai chính thức theo `service-comparison.md`. **Chốt: Fly.io, Neon, Github Actions, GHCR, Expo EAS, Cloudflare, Sentry, Cloudinary**
- [x] Chốt mô hình Neon: `1 project` với `production` branch làm gốc và các preview branch tạm cho từng Pull Request.
- [x] Chốt domain chính thức cho API production.
- [x] Chốt subdomain cho staging.
- [X] Tạo tài khoản hoặc project cho Fly.io, Neon, Cloudflare, Expo EAS và Sentry.
- [x] Xác nhận quyền truy cập GitHub repo và các nền tảng deploy cho các thành viên phụ trách.

## 2. Codebase readiness trước khi dựng môi trường thật

### Backend

- [x] Thêm health endpoint riêng ngoài route gốc.
- [x] Chuyển CORS từ wildcard sang allowlist theo domain thật.
- [x] Chuyển Swagger server URL sang biến môi trường.
- [x] Bảo đảm backend không phụ thuộc `.env` root trong production runtime.
- [ ] Thêm logging tối thiểu cho startup, DB connection và lỗi auth/media.
- [ ] Map health endpoint vào cấu hình health check của `fly.toml`.

### Database và Prisma

- [x] Rà lại migration hiện tại có đầy đủ cho production.
- [x] Tạo script hoặc step rõ ràng cho `prisma migrate deploy`.
- [x] Xác nhận seed data nào là bắt buộc cho staging và production. Catalog bootstrap bắt buộc gồm `diet_types`, `goals`, `cuisine_types`, `ingredients`, `meals` và `meal_ingredients`.

### Mobile app

- [x] Xác nhận `EXPO_PUBLIC_API_BASE_URL` không còn trỏ local.
- [x] Chuẩn bị profile, command và runbook để kiểm thử Google sign-in trên build preview.
- [x] Xác nhận mobile không phụ thuộc `.env` local khi chạy build CI.

### Security cơ bản

- [x] Không để secret xuất hiện trong logs hoặc file commit. `.env` thật và các artifact bí mật phổ biến (`service-account*.json`, `*.jks`, `*.keystore`, `*.p8`, `*.pem`, `.secrets/`) đã bị ignore; code hiện tại không log trực tiếp giá trị secret.
- [ ] Cân nhắc rate limiting cho các route auth và upload.

## 3. GitHub governance và CI/CD

### Governance

- [x] Bật branch protection cho `main`.
- [x] Yêu cầu Pull Request review trước merge.
- [x] Tạo GitHub Environments `staging` và `production`.
- [x] Dùng PR approval + branch protection làm gate chính trước merge cho production release.

### CI/CD secrets và variables

- [x] Điền `FLY_API_TOKEN` cho GitHub Actions.
- [x] Điền `NEON_API_KEY` cho GitHub Actions.
- [x] Điền `NEON_PROJECT_ID`.
- [x] Điền `NEON_PRODUCTION_BRANCH_ID`.
- [x] Điền `FLY_APP_NAME_STAGING`. **kitchen-mind-staging**
- [x] Điền `FLY_APP_NAME_PRODUCTION`. **kitchen-mind-production**
- [x] Điền `FLY_CONFIG_PATH_STAGING` nếu dùng file config riêng. **services/main-backend/fly.staging.toml**
- [x] Điền `FLY_CONFIG_PATH_PRODUCTION` nếu dùng file config riêng. **services/main-backend/fly.production.toml**
- [ ] Điền `FLY_REGION_STAGING` nếu dùng GitHub variable để cố định region. (sẽ setup trong `fly.toml` cho staging)
- [ ] Điền `FLY_REGION_PRODUCTION` nếu dùng GitHub variable để cố định region. (sẽ setup trong `fly.toml` cho production)
- [x] Điền `EXPO_TOKEN` cho GitHub Actions.

### Workflows

- [X] Tạo workflow CI cho Pull Request.
- [x] Tạo workflow preview cho Pull Request: tạo Neon preview branch `schema-only`, apply migration, chạy seed bootstrap; deploy staging backend; build mobile preview. (3 workflows riêng biệt)
- [x] Tạo workflow cleanup để xóa Neon preview branch khi Pull Request đóng hoặc merge.
- [x] Tạo workflow deploy production backend khi PR đã merge vào `main`.
- [x] Tạo workflow build APK mobile production khi PR đã merge vào `main`.

## 4. Dựng môi trường staging

### Backend hosting staging

- [ ] Tạo Fly staging app cố định theo `FLY_APP_NAME_STAGING`.
- [x] Chốt `primary_region` cho staging.
- [x] Chuẩn bị `fly.toml` hoặc biến thể config riêng cho staging.
- [x] Cấu hình `[http_service.checks]` trỏ tới health endpoint của backend.

### Database staging

- [x] Tạo hoặc xác nhận Neon project chính cho app.
- [x] Xác nhận `production` branch là branch gốc trên Neon.
- [x] Tạo preview branch `schema-only` trên Neon từ `production` branch khi Pull Request mở hoặc cập nhật.
- [ ] Lấy connection string của preview branch từ output hoặc API response của workflow preview.
- [ ] Chạy `pnpm prisma:migrate:deploy` trên preview branch.
- [ ] Chạy `pnpm prisma:seed:bootstrap` trên preview branch.
- [ ] Bật backup và kiểm tra retention policy.
- [ ] Kiểm tra giới hạn connection có phù hợp với runtime backend.

### DNS và SSL staging

- [ ] Trỏ `api-staging` về backend staging.
- [ ] Xác nhận SSL hoạt động bình thường.
- [ ] Cấu hình proxy hoặc DNS mode phù hợp trên Cloudflare.

### Secrets và env vars staging

- [ ] Cập nhật secret `DATABASE_URL` trên Fly staging app từ preview branch hiện tại, không dùng một giá trị staging cố định trong repo.
- [x] Điền `JWT_SECRET` riêng cho staging.
- [x] Điền `JWT_EXPIRES_IN` cho staging.
- [x] Điền `GOOGLE_WEB_CLIENT_ID` đúng cho staging.
- [x] Điền `CLOUDINARY_CLOUD_NAME`.
- [x] Điền `CLOUDINARY_API_KEY`.
- [x] Điền `CLOUDINARY_API_SECRET`.

### Mobile preview build

- [ ] Tạo EAS project nếu chưa có.
- [ ] Tạo EAS environment `preview`.
- [ ] Điền `EXPO_PUBLIC_API_BASE_URL` cho preview.
- [ ] Điền `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` cho preview.
- [ ] Trigger EAS preview build khi Pull Request được mở hoặc cập nhật.

## 5. Checklist trước khi deploy staging lần đầu

- [ ] Backend build pass trên CI.
- [ ] Unit test backend pass.
- [ ] E2E backend pass với Postgres.
- [ ] Mobile test pass.
- [ ] Workflow preview cho Pull Request đã sẵn sàng.
- [ ] Fly app staging đã tạo xong.
- [ ] `fly.toml` staging đã hợp lệ.
- [ ] Database staging đã tạo xong.
- [ ] Secrets staging đã điền đủ.
- [ ] Smoke test script hoặc checklist đã sẵn sàng.

## 6. QA review trên preview/staging trước khi merge

- [ ] API có thể truy cập qua domain staging.
- [ ] Health endpoint trả về `200`.
- [ ] Swagger hoặc route public cơ bản không lỗi bootstrap.
- [ ] Backend kết nối được database.
- [ ] Đăng nhập Google trên mobile preview build hoạt động.
- [ ] Các flow chính hoạt động: auth, profile, menu, template, meal search.
- [ ] Upload media hoặc đường dẫn Cloudinary hoạt động nếu feature đó đã mở.
- [ ] Chỉ approve và merge Pull Request sau khi preview environment đã pass.

## 7. Dựng môi trường production

### Backend hosting production

- [ ] Tạo Fly production app theo `FLY_APP_NAME_PRODUCTION`.
- [ ] Chốt `primary_region` cho production.
- [ ] Chuẩn bị `fly.toml` hoặc biến thể config riêng cho production.
- [ ] Cấu hình `[http_service.checks]` trỏ tới health endpoint của backend.
- [ ] Cấu hình `min_machines_running` phù hợp cho production.

### Database production

- [ ] Tạo hoặc xác nhận Neon `production` branch.
- [ ] Lấy connection string của `production` branch.
- [ ] Bật backup và kiểm tra retention policy.
- [ ] Kiểm tra giới hạn connection có phù hợp với runtime backend.

### DNS và SSL production

- [ ] Trỏ `api` production về backend production.
- [ ] Xác nhận SSL hoạt động bình thường.
- [ ] Cấu hình proxy hoặc DNS mode phù hợp trên Cloudflare.

### Secrets và env vars production

- [ ] Điền `DATABASE_URL` cho production, trỏ vào Neon `production` branch.
- [ ] Điền `JWT_SECRET` riêng cho production.
- [ ] Điền `JWT_EXPIRES_IN` cho production.
- [ ] Điền `GOOGLE_WEB_CLIENT_ID` đúng cho production.
- [ ] Rà lại các giá trị `CLOUDINARY_*` dùng cho production.

### Mobile production APK

- [ ] Tạo EAS environment `production`.
- [ ] Điền `EXPO_PUBLIC_API_BASE_URL` cho production.
- [ ] Điền `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` cho production.
- [ ] Xác nhận profile `production` của EAS tiếp tục build ra `apk` để phân phối trực tiếp.

## 8. Gate trước khi merge Pull Request vào `main`

- [ ] Preview/staging đã được QA xác nhận trên đúng build của Pull Request.
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

- [ ] Có preview/staging hoạt động thực tế ngoài local và dùng được để QA trước merge.
- [ ] Có production backend deploy được bằng pipeline.
- [ ] Có mobile preview build và production build dùng đúng API domain.
- [ ] Secrets được tách rõ giữa staging và production.
- [ ] Có smoke test và rollback checklist rõ ràng.