# Service Comparison And Roles

## Mục tiêu

Tài liệu này giải thích vai trò của từng nhóm dịch vụ trong một hệ thống production, đồng thời so sánh các lựa chọn phù hợp với `meal-planner-monorepo`.

Mục tiêu không phải chọn dịch vụ mạnh nhất về lý thuyết, mà là chọn dịch vụ phù hợp nhất với:

- team đang ở giai đoạn đầu
- stack hiện tại gồm Expo, NestJS, Prisma và PostgreSQL
- nhu cầu giảm vận hành thủ công
- khả năng mở rộng dần sau này

## 1. Vai trò của từng nhóm dịch vụ

### CI/CD Orchestrator

Vai trò:

- chạy test và build tự động
- chuẩn hóa flow deploy
- tạo checkpoint kiểm soát trước khi release

Ví dụ dịch vụ:

- GitHub Actions
- GitLab CI
- CircleCI

### Container Registry

Vai trò:

- lưu Docker image của backend
- version hóa artifact deploy
- hỗ trợ rollback nhanh về image cũ

Ví dụ dịch vụ:

- GHCR
- Docker Hub
- Amazon ECR

### Backend Hosting

Vai trò:

- chạy API NestJS trên môi trường public
- quản lý scale, env vars, logs và health checks
- expose HTTPS endpoint cho mobile app

Ví dụ dịch vụ:

- Fly.io
- Render
- Railway
- AWS ECS Fargate

### Managed PostgreSQL

Vai trò:

- lưu dữ liệu ứng dụng
- backup, patching và vận hành database
- tách database cho staging và production

Ví dụ dịch vụ:

- Neon
- Supabase Postgres
- Render Postgres
- AWS RDS PostgreSQL

### DNS / SSL / Edge Protection

Vai trò:

- trỏ domain tới backend
- phát hành SSL/TLS
- thêm lớp CDN, WAF, rate limiting hoặc bot protection

Ví dụ dịch vụ:

- Cloudflare
- AWS Route 53 + CloudFront

### Mobile Build And Distribution

Vai trò:

- build ứng dụng Android/iOS
- phân phối build nội bộ cho QA
- submit bản production lên store
- hỗ trợ OTA update khi phù hợp

Ví dụ dịch vụ:

- Expo EAS
- Bitrise
- Codemagic

### Monitoring And Error Tracking

Vai trò:

- theo dõi crash và exception
- giúp debug lỗi production
- cảnh báo sớm trước khi người dùng báo lỗi hàng loạt

Ví dụ dịch vụ:

- Sentry
- Better Stack
- Datadog

## 2. So sánh dịch vụ cho backend hosting

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `Fly.io` | Chạy backend container | Deploy trực tiếp từ Dockerfile bằng `flyctl deploy`, cấu hình bằng `fly.toml`, health checks rõ ràng, linh hoạt về region và runtime | Cần hiểu thêm về `fly.toml`, Machines, regions và deploy flow | Rất phù hợp nếu đội chấp nhận cấu hình hạ tầng ở mức vừa phải |
| `Render` | Chạy backend container | Dễ dùng, hỗ trợ Docker, logs/health check tốt, ít vận hành | Ít linh hoạt hơn khi đội muốn kiểm soát deploy model và runtime placement | Phù hợp nếu ưu tiên dashboard đơn giản hơn CLI |
| `Railway` | Chạy backend và cả database | Thiết lập nhanh, trải nghiệm dev tốt | Pricing và networking cần theo dõi kỹ khi scale | Phù hợp nếu ưu tiên tốc độ thử nghiệm |
| `AWS ECS Fargate` | Chạy backend container production-ready | Mạnh, chuẩn enterprise, dễ mở rộng lâu dài | Độ phức tạp cao, setup lâu hơn | Phù hợp khi dự án cần scale và compliance cao |

### Kết luận cho backend hosting

Với quyết định hiện tại, nên chọn `Fly.io`. `Render` vẫn là phương án fallback nếu đội muốn quy trình dashboard-first và ít chạm CLI hơn. Khi lượng truy cập, yêu cầu private networking hoặc compliance tăng rõ rệt, có thể nâng lên `AWS ECS Fargate`.

## 3. So sánh dịch vụ cho managed PostgreSQL

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `Neon` | PostgreSQL managed cho app | Nhẹ, nhanh, DX tốt, dễ tạo database staging | Một số nhu cầu network/private infra sẽ hạn chế hơn RDS | Rất phù hợp cho giai đoạn đầu |
| `Supabase Postgres` | PostgreSQL managed kèm hệ sinh thái Supabase | Dashboard tốt, dễ dùng, có thêm tiện ích auth/storage nếu cần | Dễ kéo team sang dùng quá nhiều dịch vụ ngoài scope hiện tại | Phù hợp nếu có ý định mở rộng hệ sinh thái Supabase |
| `Render Postgres` | Database cùng nền tảng với app host | Triển khai đơn giản, cùng một dashboard | Khó tối ưu khi muốn tách vai trò rõ hơn | Phù hợp nếu ưu tiên đơn giản tuyệt đối |
| `AWS RDS PostgreSQL` | PostgreSQL chuẩn enterprise | Mạnh, ổn định, network và backup linh hoạt | Setup và chi phí vận hành cao hơn | Phù hợp khi production đã trưởng thành |

### Kết luận cho database

Giai đoạn đầu nên chọn `Neon`. Nếu sau này backend chuyển lên AWS và cần private VPC/networking đầy đủ, cân nhắc chuyển sang `RDS`.

## 4. So sánh dịch vụ CI/CD và artifact

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `GitHub Actions` | CI/CD orchestration | Gần repo, tích hợp PR tốt, đủ dùng cho monorepo | YAML có thể dài khi pipeline tăng | Rất phù hợp |
| `GitLab CI` | CI/CD orchestration | Mạnh và linh hoạt | Không khớp repo nếu source ở GitHub | Không ưu tiên |
| `CircleCI` | CI/CD orchestration | Trải nghiệm CI tốt | Thêm một nền tảng nữa để quản lý | Không cần thiết lúc này |
| `GHCR` | Container registry | Gắn chặt với GitHub, permissions rõ ràng | Chủ yếu mạnh khi đã ở hệ GitHub | Rất phù hợp |
| `Docker Hub` | Container registry | Phổ biến | Rate limit và quản lý private image kém thuận hơn GHCR | Không ưu tiên |
| `Amazon ECR` | Container registry | Tốt nếu backend chạy trên AWS | Dư khi chưa dùng AWS làm hạ tầng chính | Chỉ phù hợp khi chuyển sang AWS |

### Kết luận cho CI/CD và registry

`GitHub Actions` vẫn là lựa chọn hợp lý nhất cho repo này. Với `Fly.io`, `GHCR` trở thành lựa chọn tùy chọn thay vì thành phần bắt buộc trong luồng deploy chuẩn.

## 5. So sánh dịch vụ mobile build và release

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `Expo EAS` | Build, submit, OTA update cho Expo app | Khớp hoàn toàn với Expo project hiện tại | Phụ thuộc hệ Expo | Rất phù hợp |
| `Bitrise` | Mobile CI/CD tổng quát | Linh hoạt, phổ biến với mobile team | Cần ghép thêm tooling cho Expo flow | Chưa cần |
| `Codemagic` | Mobile CI/CD tổng quát | Hỗ trợ mobile release tốt | Dư phức tạp khi dự án đã dùng EAS | Chưa cần |

### Kết luận cho mobile

Giữ `Expo EAS` làm lane phát hành chính là lựa chọn đúng với repo hiện tại.

## 6. So sánh dịch vụ DNS, SSL và edge

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `Cloudflare` | DNS, SSL, proxy, bảo vệ edge | Thiết lập nhanh, SSL tốt, WAF/rate limit cơ bản | Một số cấu hình cao cấp cần hiểu rõ proxy behavior | Rất phù hợp |
| `Route 53 + CloudFront` | DNS + CDN kiểu AWS | Mạnh nếu mọi thứ ở AWS | Phức tạp hơn cho team nhỏ | Chỉ phù hợp khi hạ tầng chuyển hẳn sang AWS |

### Kết luận cho edge layer

`Cloudflare` là lựa chọn nên dùng trước.

## 7. So sánh dịch vụ monitoring và error tracking

| Dịch vụ | Vai trò chính | Điểm mạnh | Điểm yếu | Mức phù hợp với repo này |
| --- | --- | --- | --- | --- |
| `Sentry` | Error tracking cho backend và mobile | Mạnh về stack trace, release tracking, mobile crash | Chưa phải full observability suite | Rất phù hợp |
| `Better Stack` | Logs, uptime và incident | Tốt cho logs và alerting | Error triage không sâu bằng Sentry | Phù hợp để bổ sung, không nên thay thế hoàn toàn |
| `Datadog` | Observability toàn diện | Rất mạnh và đầy đủ | Chi phí và độ phức tạp cao | Chưa cần ở giai đoạn đầu |

### Kết luận cho monitoring

Giai đoạn đầu nên dùng `Sentry`. Nếu sau này cần log aggregation và uptime monitoring rõ hơn, có thể bổ sung `Better Stack`.

## 8. Stack khuyến nghị cuối cùng cho dự án này

| Vai trò | Dịch vụ khuyến nghị | Lý do |
| --- | --- | --- |
| CI/CD | `GitHub Actions` | Gắn trực tiếp với repo và PR flow |
| Container registry | `GHCR` (tùy chọn) | Chỉ cần nếu đội muốn lưu Docker image độc lập ngoài Fly.io |
| Backend hosting | `Fly.io` | Phù hợp Dockerfile hiện tại, deploy bằng `flyctl` và `fly.toml` |
| Database | `Neon Postgres` | Phù hợp Prisma/Postgres và ít vận hành |
| DNS/SSL | `Cloudflare` | Nhanh, gọn, đủ dùng cho giai đoạn đầu |
| Mobile release | `Expo EAS` | Đã có sẵn trong repo |
| Media storage | `Cloudinary` | Đã được code tích hợp |
| Error tracking | `Sentry` | Phù hợp backend + mobile app |

## 9. Khi nào nên nâng cấp stack

Chỉ nên cân nhắc rời stack mặc định khi gặp một trong các dấu hiệu sau:

- cần private networking, VPC peering hoặc compliance rõ ràng
- cần autoscaling tinh vi và nhiều worker/background services
- chi phí nền tảng PaaS tăng không còn hợp lý
- cần multi-region hoặc kiểm soát hạ tầng sâu hơn

Khi đó, hướng nâng cấp hợp lý nhất là:

- `Fly.io` -> `AWS ECS Fargate`
- `Neon` -> `AWS RDS PostgreSQL`
- `Cloudflare` giữ nguyên hoặc kết hợp với AWS edge stack