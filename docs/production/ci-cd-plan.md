# CI/CD Plan

## Mục tiêu

CI/CD của dự án cần giải quyết hai bài toán tách biệt:

- kiểm thử và deploy backend API
- build, submit và update mobile app

Do repo là monorepo, pipeline vẫn nên dùng chung một nền tảng điều phối là `GitHub Actions`, nhưng chia lane rõ ràng để tránh release nhầm.

## Nguyên tắc chung

- mọi thay đổi đều đi qua Pull Request
- Pull Request mở hoặc cập nhật sẽ tạo một Neon preview branch `schema-only` từ `production`
- workflow preview sẽ apply migration của PR, chạy `pnpm prisma:seed:bootstrap`, cập nhật `DATABASE_URL` trên Fly staging app cố định và build mobile preview
- QA review chính diễn ra trên preview environment trước khi merge
- PR approval và branch protection là gate chính trước khi release production
- khi PR được merge vào `main`, production backend và mobile production sẽ được release tự động
- khi PR đóng hoặc merge, Neon preview branch tương ứng sẽ bị xóa tự động
- database migration chạy trong pipeline deploy, không chạy tay trên máy cá nhân
- mobile app và backend có thể release lệch nhịp, miễn tương thích API contract

## Branch to environment mapping

Trong repo này, không nên đồng nhất branch với environment.

- `local` là runtime trên máy từng developer
- `develop` nếu team dùng chỉ là branch tích hợp code
- `main` là nhánh đích của Pull Request và là trigger cho production release sau merge
- `preview/pr-*` là Neon branch tạm theo từng Pull Request
- `staging` là Fly staging app cố định và preview domain cố định, được redeploy cho PR hiện tại
- `production` là environment nhận bản deploy tự động ngay sau khi PR đã được approve và merge

Vì vậy, `main` không phải production trong lúc PR còn mở; nó chỉ trở thành tín hiệu release sau khi PR đã được approve và merge. Neon preview branch không phải source branch của code, mà là database branch tạm để QA review trước merge. Do dùng một Fly staging app cố định, preview mới nhất sẽ ghi đè preview cũ nếu nhiều PR được deploy song song.

## Fly.io deployment model

Luồng deploy backend mặc định nên bám theo cách Fly.io vận hành:

- `fly.toml` giữ app config, HTTP service, health checks và non-sensitive env
- `flyctl deploy --remote-only` dùng Dockerfile hiện có để build và deploy lên Fly.io
- runtime secrets nằm trên Fly.io, không đặt trong repo
- có thể dùng `[deploy].release_command` để chạy `prisma migrate deploy` trước khi app nhận traffic

## Neon environment model

Đối với database, pipeline nên bám theo mô hình:

- `1 Neon project` cho app
- `production` branch là branch gốc và là source of truth cho dữ liệu production
- mỗi Pull Request tạo một Neon preview branch mới từ `production` với chế độ `schema-only`
- workflow preview apply migration của PR lên preview branch rồi chạy `pnpm prisma:seed:bootstrap`
- Fly staging app cập nhật secret `DATABASE_URL` để trỏ vào preview branch của PR hiện tại
- khi Pull Request bị đóng hoặc được merge, preview branch sẽ bị xóa tự động

Không nên tách môi trường bằng hai database logic trong cùng một branch, vì khi đó CI/CD vẫn phải tự quản lý ranh giới môi trường ở tầng thấp hơn thay vì dùng trực tiếp isolation model của Neon.

## Workflow đề xuất

### 1. `ci-pr.yml`

Chạy cho Pull Request.

Mục tiêu:

- cài dependencies với cache pnpm
- build `@meal/shared`
- build backend
- chạy test backend
- chạy test mobile app
- cho fast feedback trước khi workflow preview đầy đủ hoàn tất

Các bước chính:

1. `actions/checkout`
2. `actions/setup-node`
3. `pnpm install --frozen-lockfile`
4. `pnpm build:shared`
5. `pnpm --filter main-backend run build`
6. `pnpm --filter main-backend run test`
7. `pnpm --filter mobile-app run test`

### 2. `pr-preview.yml`

Chạy khi Pull Request được `opened`, `reopened` hoặc `synchronize`.

Mục tiêu:

- tạo Neon preview branch `schema-only` từ `production`
- apply migration của PR và chạy `pnpm prisma:seed:bootstrap`
- cập nhật `DATABASE_URL` trên Fly staging app cố định để trỏ vào preview branch
- redeploy backend staging và build mobile preview
- cung cấp preview environment để QA review trước merge

Các bước chính:

1. checkout source và setup Node, pnpm, `flyctl`, EAS CLI
2. gọi Neon API để tạo preview branch `schema-only` từ `production`
3. lấy `DATABASE_URL` của preview branch và export cho các step tiếp theo
4. chạy `pnpm prisma:migrate:deploy`
5. chạy `pnpm prisma:seed:bootstrap`
6. chạy test/integration checks cần thiết với preview branch
7. chạy `fly secrets set DATABASE_URL=...` trên app staging cố định
8. chạy `flyctl deploy --remote-only --app $FLY_APP_NAME_STAGING --config <fly-staging.toml>`
9. chạy `eas build --platform android --profile preview --non-interactive --json`
10. comment preview metadata vào Pull Request để QA dùng đúng build và đúng backend preview

### 3. `cleanup-pr-preview-db.yml`

Chạy khi Pull Request bị `closed`, bao gồm cả trường hợp merge.

Mục tiêu:

- xóa Neon preview branch tương ứng với Pull Request
- bảo đảm môi trường review không bị giữ lại ngoài ý muốn

Các bước chính:

1. lấy thông tin Pull Request number và branch name
2. gọi `neondatabase/delete-branch-action`
3. xác nhận preview branch đã bị xóa thành công

### 4. `deploy-production-backend.yml`

Chạy khi Pull Request đã được approve và merge vào `main`.

Mục tiêu:

- deploy backend production tự động
- áp dụng migration production an toàn
- ghi nhận release version

Các bước chính:

1. dùng `GitHub Environment: production`
2. checkout source và setup `flyctl`
3. chạy `flyctl deploy --remote-only` với `--app $FLY_APP_NAME_PRODUCTION` hoặc `--config <fly-production.toml>`
4. để migration production chạy qua `release_command` hoặc step riêng trước khi app nhận traffic
5. chạy smoke test production
6. thông báo kết quả deploy

### 5. `mobile-preview.yml`

Chạy cùng nhịp với workflow preview của Pull Request hoặc được gọi từ workflow đó.

Mục tiêu:

- tạo preview/internal build cho QA trước khi merge
- trỏ mobile vào `api-staging` đang được repoint tới preview branch hiện tại

Các bước chính:

1. setup Node và pnpm
2. cài Expo/EAS CLI
3. dùng `EXPO_TOKEN` để authenticate với EAS
4. chạy `eas build --platform android --profile preview --non-interactive --json`

### 6. `mobile-production.yml`

Chạy khi Pull Request đã được approve và merge vào `main`.

Mục tiêu:

- build mobile production
- release mobile production ngay sau merge

Các bước chính:

1. chọn platform `android` hoặc sau này `ios`
2. dùng `EXPO_TOKEN` để authenticate với EAS
3. chạy `eas build --platform android --profile production --non-interactive --json`
4. chạy `eas submit --profile production --non-interactive`

## Deployment artifact và config

### Backend deploy artifact

- luồng mặc định không bắt buộc dùng registry riêng
- `flyctl deploy --remote-only` có thể build trực tiếp từ source và Dockerfile hiện có
- app config nên nằm trong `fly.toml`
- nếu đội muốn lưu Docker image độc lập để audit hoặc rollback dễ hơn, có thể bổ sung `GHCR` như thành phần tùy chọn

### Mobile artifact

- artifact build do `EAS` quản lý
- QA nhận build `preview` gắn với Pull Request hiện tại
- production phát hành tự động qua profile `production` sau khi PR đã merge

## Database migration strategy

### Không dùng cho production

- `prisma migrate dev`

### Dùng cho preview branch và production

- `prisma migrate deploy`

Khuyến nghị cho Fly.io:

- ưu tiên chạy migration qua `[deploy].release_command` trong `fly.toml`
- nếu muốn tách rời deploy và migrate để kiểm soát chặt hơn, có thể giữ migration thành một job riêng trong GitHub Actions

Flow khuyến nghị:

1. migration được tạo và review ở local/dev
2. migration file được commit vào repo
3. Pull Request mở hoặc cập nhật sẽ tạo Neon preview branch `schema-only` từ `production`
4. workflow preview chạy `pnpm prisma:migrate:deploy` và `pnpm prisma:seed:bootstrap` trên preview branch đó
5. workflow preview cập nhật `DATABASE_URL` trên Fly staging app cố định, redeploy backend staging và build mobile preview
6. QA review trên preview environment trước khi merge
7. khi Pull Request được approve và merge, workflow cleanup xóa preview branch
8. merge vào `main` tự động deploy backend production với `DATABASE_URL` trỏ vào Neon `production` branch
9. merge vào `main` cũng tự động build và release mobile production

## Smoke test sau deploy

Sau khi deploy backend, pipeline nên kiểm tra tối thiểu:

- backend trả về 200 ở health endpoint
- có thể kết nối database
- route public cơ bản phản hồi đúng
- route auth Google không lỗi cấu hình ngay từ bootstrap

## Rollback strategy

### Backend

- redeploy lại commit hoặc tag ổn định gần nhất bằng `flyctl deploy`
- nếu đội dùng thêm `GHCR`, có thể rollback bằng image cũ như một cơ chế bổ sung
- nếu migration production không tương thích ngược, cần có kế hoạch rollback dữ liệu riêng

### Mobile

- nếu lỗi chỉ ở JavaScript và phù hợp với runtime hiện tại, dùng `EAS Update` để vá nhanh
- nếu lỗi nằm ở native dependency hoặc build config, phải tạo store build mới

## GitHub secrets, variables và environments cần có

### Secrets dùng cho backend lane

- `FLY_API_TOKEN`
- `NEON_API_KEY`

### Variables dùng cho backend lane

- `NEON_PROJECT_ID`
- `NEON_PRODUCTION_BRANCH_ID` hoặc giá trị tương đương để xác định parent branch cho schema-only preview branch
- `FLY_APP_NAME_STAGING`
- `FLY_APP_NAME_PRODUCTION`
- `FLY_CONFIG_PATH_STAGING` nếu dùng file config riêng
- `FLY_CONFIG_PATH_PRODUCTION` nếu dùng file config riêng
- `FLY_REGION_STAGING` nếu muốn cố định region
- `FLY_REGION_PRODUCTION` nếu muốn cố định region

### Secrets dùng cho mobile lane

- `EXPO_TOKEN`

### Giá trị nên đặt trong EAS environment thay vì GitHub

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Các cải tiến nên làm sau khi pipeline cơ bản chạy ổn

- thêm lint job cho backend và mobile
- thêm dependency vulnerability scan
- thêm preview URL comment vào Pull Request nếu sau này bật preview apps hoặc review apps
- thêm changelog hoặc release notes tự động
- tích hợp Sentry release tracking cho backend và mobile