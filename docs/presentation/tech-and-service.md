# Công nghệ và dịch vụ sử dụng

## 1. Tổng quan lựa chọn công nghệ

Dự án Meal Planner sử dụng mô hình monorepo để quản lý đồng thời mobile app, backend API, database package và shared package. Cách tổ chức này giúp toàn bộ hệ thống phát triển đồng bộ, đặc biệt hữu ích khi client và server cần chia sẻ cùng một contract dữ liệu.

## 2. Framework và công nghệ chính

| Nhóm | Công nghệ | Vai trò trong dự án |
| --- | --- | --- |
| Monorepo | pnpm Workspaces | Quản lý nhiều package trong cùng một repository |
| Mobile | Expo | Nền tảng phát triển và build ứng dụng React Native |
| Mobile | React Native | Xây dựng ứng dụng di động đa nền tảng |
| Mobile | Expo Router | Tổ chức điều hướng màn hình theo file-based routing |
| Mobile UI | Tamagui | Xây dựng giao diện và component theo hướng tái sử dụng |
| Mobile State | Zustand | Quản lý state cục bộ gọn nhẹ cho ứng dụng |
| Form & Validation | React Hook Form + Zod | Xử lý form và validate dữ liệu đầu vào |
| Networking | Axios | Gọi API giữa mobile app và backend |
| Backend | NestJS | Xây dựng REST API theo kiến trúc module hóa |
| Backend | Passport + JWT | Xử lý xác thực và bảo vệ endpoint |
| Database | PostgreSQL | Lưu trữ dữ liệu nghiệp vụ chính |
| ORM | Prisma | Truy cập dữ liệu, migration và đồng bộ schema |
| Shared Contract | TypeScript + Zod | Chia sẻ types và schema giữa client/server |
| API Docs | Swagger / OpenAPI | Sinh tài liệu API phục vụ test và tích hợp |
| Testing | Jest + Supertest | Kiểm thử unit test và e2e cho backend/mobile |
| Local Infrastructure | Docker Compose | Chạy môi trường local cho database và dịch vụ phụ trợ |

## 3. Các dịch vụ bên ngoài

| Dịch vụ | Mục đích sử dụng |
| --- | --- |
| Google Sign-In | Đăng nhập người dùng bằng tài khoản Google |
| Cloudinary | Quản lý tài nguyên media, đặc biệt là ảnh món ăn |
| Sentry | Theo dõi lỗi và hỗ trợ giám sát ứng dụng |
| Fly.io | Nền tảng triển khai backend API trong môi trường production mục tiêu |
| Neon | Dịch vụ PostgreSQL managed cho môi trường production/staging mục tiêu |
| Expo EAS | Build, preview và phát hành ứng dụng mobile |
| GitHub Actions | Tự động hóa kiểm thử, build và quy trình CI/CD |
| Cloudflare | Hỗ trợ DNS, SSL và lớp bảo vệ biên cho public API trong kiến trúc production mục tiêu |

## 4. Vai trò của từng nhóm công nghệ

### 4.1 Tầng mobile

Expo và React Native giúp nhóm phát triển xây dựng ứng dụng nhanh trên nền tảng di động, đồng thời vẫn giữ được khả năng mở rộng khi cần build thực tế trên Android. Expo Router giúp tổ chức route rõ ràng, còn Tamagui hỗ trợ tạo giao diện thống nhất và tái sử dụng component hiệu quả.

### 4.2 Tầng backend

NestJS phù hợp với dự án có nhiều domain như auth, profile, menu, meal search và meal template vì framework này hỗ trợ phân tách module rõ ràng. Kết hợp với Passport, JWT và Google auth library, backend có thể xử lý cả xác thực truyền thống lẫn đăng nhập Google trong cùng một kiến trúc thống nhất.

### 4.3 Tầng dữ liệu

PostgreSQL được chọn vì tính ổn định và phù hợp với dữ liệu quan hệ như user, profile, menu, meal template và meal items. Prisma giúp quản lý schema tập trung, sinh client truy vấn dữ liệu và giảm chi phí viết truy vấn thủ công.

### 4.4 Đồng bộ contract giữa các lớp

TypeScript và Zod được dùng trong package shared để định nghĩa kiểu dữ liệu và schema validate dùng chung. Đây là điểm quan trọng của dự án vì nó giúp mobile app, backend và tài liệu API cùng bám vào một chuẩn dữ liệu thống nhất.

### 4.5 Vận hành và triển khai

Docker Compose hỗ trợ môi trường local cho nhóm phát triển. Ở hướng production, Fly.io, Neon và Expo EAS cho phép tách luồng phát hành backend, database và mobile app. GitHub Actions đóng vai trò tự động hóa pipeline kiểm thử và deploy.

## 5. Lý do lựa chọn stack này

- phù hợp với đội ngũ phát triển sử dụng TypeScript xuyên suốt cả client và server
- giảm chi phí chuyển đổi ngữ cảnh giữa các lớp hệ thống
- dễ mở rộng module nghiệp vụ khi dự án tăng số lượng tính năng
- hỗ trợ tốt cho kiểm thử, tài liệu hóa API và phát hành dần theo từng phase
- cân bằng giữa tốc độ phát triển ban đầu và khả năng vận hành thực tế

## 6. Kết luận ngắn

Stack công nghệ của Meal Planner được lựa chọn theo tiêu chí đồng bộ, dễ mở rộng và phù hợp với bài toán ứng dụng mobile có backend riêng. Việc kết hợp Expo, NestJS, Prisma, PostgreSQL và các dịch vụ cloud hỗ trợ dự án phát triển theo hướng hiện đại, có tính thực tiễn và sẵn sàng mở rộng trong tương lai.