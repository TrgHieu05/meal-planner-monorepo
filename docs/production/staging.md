# Staging Environment

## Mục tiêu

Tài liệu này giải thích rõ `staging` là gì trong dự án, khác gì với `local`, `develop` và `production`, đồng thời mô tả cách dựng một môi trường staging tối thiểu cho `meal-planner-monorepo`.

## Staging là gì?

`Staging` là một môi trường deploy riêng, gần giống `production` nhất có thể, nhưng không phục vụ người dùng thật.

Mục đích của staging là trả lời câu hỏi:

- nếu deploy commit hiện tại lên production ngay bây giờ thì có chạy ổn không?

Staging không dùng để phát triển tính năng hằng ngày như local/dev, và cũng không được phép khác production quá nhiều về:

- database schema
- biến môi trường
- auth flow
- media flow
- domain HTTPS
- mobile runtime config

## Staging không phải branch

Một trong các nhầm lẫn phổ biến là xem `develop` tương đương `local` và `main` tương đương `production`.

Trong thực tế, đây là hai lớp khái niệm khác nhau:

| Loại | Ví dụ | Vai trò |
| --- | --- | --- |
| Branch | `feature/*`, `develop`, `main` | quản lý source code, review và merge |
| Environment | `local`, `staging`, `production` | chứa runtime, domain, secrets, database và traffic |

Điều đó có nghĩa là:

- có thể có `staging` mà không cần branch tên `staging`
- có thể deploy `staging` từ `main`
- `main` chưa phải là `production` cho đến khi CI/CD deploy commit đó lên production thành công
- `local` là runtime trên máy dev, không phải một branch

## Staging khác gì với local, develop và production?

| Khái niệm | Vai trò chính | Ai dùng | Dữ liệu | Mức gần production |
| --- | --- | --- | --- | --- |
| `local` | dev cá nhân, debug và thử nhanh | developer | local data hoặc test data | thấp |
| `develop` | branch tích hợp code nếu team có dùng | developer | không phải runtime riêng | không áp dụng |
| `staging` | QA, smoke test, kiểm thử release candidate | dev, QA, PM | test data hoặc sanitized data | cao |
| `production` | phục vụ người dùng thật | end users | dữ liệu thật | chính là chuẩn đích |

Hiểu ngắn gọn:

- `local` là nơi đang code và debug
- `develop` là nơi gom code nếu team dùng branch tích hợp
- `staging` là nơi chạy thử như production
- `production` là nơi người dùng thật đang chạy

## Mapping branch và environment gợi ý cho repo này

Repo hiện tại không bắt buộc phải có đầy đủ mọi branch trung gian mới dựng được staging.

Flow gợi ý đơn giản:

1. Dev làm việc trên `feature/*` và test ở `local`.
2. Mở Pull Request vào `main`.
3. GitHub Action tạo một Neon preview branch mới từ database gốc `production`.
4. CI/CD chạy migration, test và manual review trên preview branch đó.
5. Nếu Pull Request được duyệt thì merge vào `main`.
6. Workflow cleanup tự động xóa preview branch khi Pull Request đóng hoặc merge.
7. Sau approval, commit đã merge mới được deploy lên `production`.

Nếu team dùng thêm branch `develop`, nên hiểu nó là branch tích hợp code, không phải thay thế cho staging.

## Staging tối thiểu cho repo này cần những gì?

Với `meal-planner-monorepo`, một môi trường staging tối thiểu nên có:

- 1 backend staging riêng, ví dụ `main-backend-staging`
- 1 Neon preview branch được tạo tạm cho Pull Request đang được review
- 1 bộ secrets staging riêng
- 1 domain staging riêng, ví dụ `api-staging.example.com`
- 1 mobile preview build từ `Expo EAS` trỏ đúng vào API staging
- 1 checklist smoke test sau deploy

Nếu thiếu một trong các thành phần trên, thì hệ thống đó thường mới chỉ là shared dev environment hoặc local extension, chưa nên gọi là staging đúng nghĩa.

## Mô hình Neon khuyến nghị cho review database

Với stack đã chốt của repo này, database review nên được dựng trên Neon theo mô hình:

- `1 Neon project` cho toàn bộ app
- `production` branch là branch chuẩn cho production
- mỗi Pull Request vào `main` tạo một preview branch mới từ `production`
- workflow review dùng `DATABASE_URL` của preview branch cho migrate, test và manual review
- production chỉ dùng `DATABASE_URL` trỏ vào `production` branch

Không nên tách review và production bằng cách tạo hai database logic trong cùng một Neon branch, vì branch mới là ranh giới môi trường tự nhiên của Neon. Chỉ nên tách thành hai Neon project nếu cần cô lập vận hành hoặc compliance cao hơn.

## Cách tạo staging cho dự án này

### 1. Tạo backend runtime riêng

- tạo một app staging riêng trên nền tảng deploy backend
- cấu hình health check riêng
- bảo đảm app staging nhận đúng env vars staging

### 2. Tạo Neon preview branch cho Pull Request

- tạo preview branch trên Neon từ `production`
- lấy connection string của preview branch đưa vào `DATABASE_URL` cho workflow review
- chạy `prisma migrate deploy`
- nếu cần, seed dữ liệu phục vụ QA

### 3. Tạo secrets staging riêng

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GOOGLE_WEB_CLIENT_ID`
- `CLOUDINARY_*`

### 4. Tạo domain staging riêng

- ví dụ `api-staging.example.com`
- bật HTTPS đầy đủ
- dùng domain thật thay vì trỏ tạm về localhost hoặc IP nội bộ

### 5. Nối mobile preview build vào staging

- dùng `EAS profile preview`
- đặt `EXPO_PUBLIC_API_BASE_URL` trỏ về staging domain
- dùng đúng Google client ID cho staging nếu auth được tách môi trường

### 6. Thêm smoke test sau deploy

- health endpoint trả `200`
- backend kết nối được database
- login hoạt động
- các flow chính như profile, menu, template hoạt động bình thường

## Những gì staging phải giống production

- schema database
- auth flow
- upload/media flow
- domain HTTPS thật
- runtime config của mobile app
- hành vi migration và startup của backend

## Những gì staging có thể nhỏ hơn production

- instance size
- số lượng máy chạy nền
- dữ liệu chỉ phục vụ QA
- giới hạn truy cập bằng allowlist hoặc basic access policy

## Kết luận

Trong repo này, cách hiểu đúng là:

- `local` là môi trường trên máy cá nhân
- `staging` là môi trường deploy riêng để kiểm thử release candidate
- `production` là môi trường thật cho người dùng
- `develop` và `main` là branch, không phải environment
- preview branch của Neon là database branch tạm cho Pull Request, không phải environment cố định

Vì vậy, không nên xem `develop = local` hoặc `main = production`. Cách đúng là xem branch là nguồn code, còn environment là nơi code được deploy để chạy.