# CI/CD Plan

## Mục tiêu

CI/CD của dự án cần giải quyết hai bài toán tách biệt:

- kiểm thử và deploy backend API
- build, submit và update mobile app

Do repo là monorepo, pipeline vẫn nên dùng chung một nền tảng điều phối là `GitHub Actions`, nhưng chia lane rõ ràng để tránh release nhầm.

## Nguyên tắc chung

- mọi thay đổi đều đi qua Pull Request
- chỉ deploy staging từ branch `main`
- production cần approval thủ công
- database migration chạy trong pipeline deploy, không chạy tay trên máy cá nhân
- mobile app và backend có thể release lệch nhịp, miễn tương thích API contract

## Branch to environment mapping

Trong repo này, không nên đồng nhất branch với environment.

- `local` là runtime trên máy từng developer
- `develop` nếu team dùng chỉ là branch tích hợp code
- `main` là source branch của release candidate
- `staging` là environment nhận bản deploy tự động từ `main`
- `production` là environment nhận cùng commit đó sau approval hoặc release tag

Vì vậy, `main` không phải production; `main` chỉ là nguồn code để pipeline tạo ra staging trước, rồi mới promote sang production.

## Fly.io deployment model

Luồng deploy backend mặc định nên bám theo cách Fly.io vận hành:

- `fly.toml` giữ app config, HTTP service, health checks và non-sensitive env
- `flyctl deploy --remote-only` dùng Dockerfile hiện có để build và deploy lên Fly.io
- runtime secrets nằm trên Fly.io, không đặt trong repo
- có thể dùng `[deploy].release_command` để chạy `prisma migrate deploy` trước khi app nhận traffic

## Workflow đề xuất

### 1. `ci-pr.yml`

Chạy cho Pull Request.

Mục tiêu:

- cài dependencies với cache pnpm
- build `@meal/shared`
- build backend
- chạy test backend
- chạy test mobile app
- chạy backend e2e với Postgres service container

Các bước chính:

1. `actions/checkout`
2. `actions/setup-node`
3. `pnpm install --frozen-lockfile`
4. `pnpm build:shared`
5. `pnpm --filter main-backend run build`
6. `pnpm --filter main-backend run test`
7. `pnpm --filter main-backend run test:e2e`
8. `pnpm --filter mobile-app run test`

### 2. `deploy-staging-backend.yml`

Chạy khi merge vào `main`.

Mục tiêu:

- validate backend trước deploy
- deploy backend staging lên Fly.io
- chạy smoke test sau deploy

Các bước chính:

1. checkout source
2. setup Node và pnpm
3. `pnpm install --frozen-lockfile`
4. chạy build kiểm tra như `pnpm build:backend`
5. setup `flyctl` bằng GitHub Action của Fly.io
6. chạy `flyctl deploy --remote-only` với `--app $FLY_APP_NAME_STAGING` hoặc `--config <fly-staging.toml>`
7. để migration staging chạy qua `release_command` hoặc một step riêng nếu đội muốn tách logs
8. gọi health check và một số API smoke test

### 3. `deploy-production-backend.yml`

Chạy bằng `workflow_dispatch` hoặc tag release.

Mục tiêu:

- deploy backend production có approval
- áp dụng migration production an toàn
- ghi nhận release version

Các bước chính:

1. dùng `GitHub Environment: production`
2. checkout source và setup `flyctl`
3. chạy `flyctl deploy --remote-only` với `--app $FLY_APP_NAME_PRODUCTION` hoặc `--config <fly-production.toml>`
4. để migration production chạy qua `release_command` hoặc step riêng trước khi app nhận traffic
5. chạy smoke test production
6. thông báo kết quả deploy

### 4. `mobile-preview.yml`

Chạy khi merge `main` hoặc manual dispatch.

Mục tiêu:

- tạo preview/internal build cho QA
- trỏ mobile vào `staging API`

Các bước chính:

1. setup Node và pnpm
2. cài Expo/EAS CLI
3. dùng `EXPO_TOKEN` để authenticate với EAS
4. chạy `eas build --platform android --profile preview`

### 5. `mobile-production-release.yml`

Chạy bằng manual dispatch hoặc tag release.

Mục tiêu:

- build mobile production
- submit store build khi sẵn sàng

Các bước chính:

1. chọn platform `android` hoặc sau này `ios`
2. dùng `EXPO_TOKEN` để authenticate với EAS
3. chạy `eas build --profile production`
4. tùy chọn chạy `eas submit --profile production`

## Deployment artifact và config

### Backend deploy artifact

- luồng mặc định không bắt buộc dùng registry riêng
- `flyctl deploy --remote-only` có thể build trực tiếp từ source và Dockerfile hiện có
- app config nên nằm trong `fly.toml`
- nếu đội muốn lưu Docker image độc lập để audit hoặc rollback dễ hơn, có thể bổ sung `GHCR` như thành phần tùy chọn

### Mobile artifact

- artifact build do `EAS` quản lý
- QA nhận build từ `preview`
- production phát hành qua Play Console hoặc App Store Connect

## Database migration strategy

### Không dùng cho production

- `prisma migrate dev`

### Dùng cho staging và production

- `prisma migrate deploy`

Khuyến nghị cho Fly.io:

- ưu tiên chạy migration qua `[deploy].release_command` trong `fly.toml`
- nếu muốn tách rời deploy và migrate để kiểm soát chặt hơn, có thể giữ migration thành một job riêng trong GitHub Actions

Flow khuyến nghị:

1. migration được tạo và review ở local/dev
2. migration file được commit vào repo
3. pipeline staging chạy `deploy`
4. sau khi staging pass, pipeline production mới chạy `deploy`

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

### Variables dùng cho backend lane

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