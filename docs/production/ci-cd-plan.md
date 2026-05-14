# CI/CD Plan

## Mục tiêu

CI/CD của dự án cần giải quyết hai bài toán tách biệt:

- kiểm thử và deploy backend API
- build, submit và update mobile app

Do repo là monorepo, pipeline vẫn nên dùng chung một nền tảng điều phối là `GitHub Actions`, nhưng chia lane rõ ràng để tránh release nhầm.

## Nguyên tắc chung

- mọi thay đổi đều đi qua Pull Request
- Pull Request vào `main` tạo một Neon preview branch tạm từ branch gốc của database
- kiểm thử tự động và manual review nên chạy trên preview branch trước khi merge
- commit đã merge vào `main` cần có workflow deploy backend lên `staging`
- production cần approval thủ công sau khi code đã được merge
- database migration chạy trong pipeline deploy, không chạy tay trên máy cá nhân
- mobile app và backend có thể release lệch nhịp, miễn tương thích API contract

## Branch to environment mapping

Trong repo này, không nên đồng nhất branch với environment.

- `local` là runtime trên máy từng developer
- `develop` nếu team dùng chỉ là branch tích hợp code
- `main` là nhánh đích của Pull Request và là nguồn code sau khi merge
- `preview/pr-*` là Neon branch tạm cho review database theo từng Pull Request
- `staging` là environment runtime nhận bản deploy sau khi code đã được merge vào `main`
- `production` là environment nhận bản deploy sau khi Pull Request được duyệt, merge và pass approval

Vì vậy, `main` không phải production; `main` chỉ là nhánh nguồn sau merge. Neon preview branch cũng không phải source branch của code, mà là database branch tạm phục vụ review trước merge. `staging` lại là environment runtime riêng để chạy bản đã merge.

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
- mỗi Pull Request vào `main` tạo một Neon preview branch mới từ `production`
- workflow review dùng `DATABASE_URL` của preview branch để chạy migration, test và manual checks
- khi Pull Request bị đóng hoặc được merge, preview branch sẽ bị xóa tự động

Không nên tách môi trường bằng hai database logic trong cùng một branch, vì khi đó CI/CD vẫn phải tự quản lý ranh giới môi trường ở tầng thấp hơn thay vì dùng trực tiếp isolation model của Neon.

## Workflow đề xuất

### 1. `ci-pr.yml`

Chạy cho Pull Request.

Mục tiêu:

- tạo Neon preview branch mới từ `production`
- cài dependencies với cache pnpm
- chạy migration hoặc bootstrap cần thiết trên preview branch
- build `@meal/shared`
- build backend
- chạy test backend
- chạy test mobile app
- chạy backend e2e hoặc integration checks với `DATABASE_URL` của preview branch
- mở cửa cho manual review trước khi merge

Các bước chính:

1. `actions/checkout`
2. tạo Neon preview branch bằng `neondatabase/create-branch-action`
3. `actions/setup-node`
4. `pnpm install --frozen-lockfile`
5. inject `DATABASE_URL` từ preview branch vào job cần kiểm thử database
6. `pnpm build:shared`
7. `pnpm --filter main-backend run build`
8. `pnpm --filter main-backend run test`
9. `pnpm --filter main-backend run test:e2e`
10. `pnpm --filter mobile-app run test`
11. nếu cần, comment schema diff hoặc preview information vào Pull Request

### 2. `cleanup-pr-preview-db.yml`

Chạy khi Pull Request bị `closed`, bao gồm cả trường hợp merge.

Mục tiêu:

- xóa Neon preview branch tương ứng với Pull Request
- bảo đảm môi trường review không bị giữ lại ngoài ý muốn

Các bước chính:

1. lấy thông tin Pull Request number và branch name
2. gọi `neondatabase/delete-branch-action`
3. xác nhận preview branch đã bị xóa thành công

### 3. `deploy-staging-backend.yml`

Chạy khi code đã được merge vào `main`.

Mục tiêu:

- deploy backend staging lên Fly.io
- áp dụng migration staging an toàn
- chạy smoke test trên runtime staging thật

Các bước chính:

1. dùng `GitHub Environment: staging`
2. checkout source và setup `flyctl`
3. chạy `flyctl deploy --remote-only` với `--app $FLY_APP_NAME_STAGING` hoặc `--config <fly-staging.toml>`
4. để migration staging chạy qua `release_command` hoặc step riêng trước khi app nhận traffic
5. gọi health check và smoke test qua `api-staging`

### 4. `deploy-production-backend.yml`

Chạy sau khi Pull Request đã được duyệt, merge vào `main` và có approval cần thiết.

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

### 5. `mobile-preview.yml`

Chạy khi merge `main` hoặc manual dispatch.

Mục tiêu:

- tạo preview/internal build cho QA
- trỏ mobile vào `staging API`

Các bước chính:

1. setup Node và pnpm
2. cài Expo/EAS CLI
3. dùng `EXPO_TOKEN` để authenticate với EAS
4. chạy `eas build --platform android --profile preview`

### 6. `mobile-production-release.yml`

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
3. Pull Request vào `main` tạo Neon preview branch từ `production`
4. workflow PR chạy migration, test và manual review trên preview branch đó
5. khi Pull Request được duyệt và merge, workflow cleanup xóa preview branch
6. commit đã merge được deploy lên `staging` để smoke test trên runtime thật
7. sau approval, pipeline production mới chạy `deploy` với `DATABASE_URL` trỏ vào Neon `production` branch

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