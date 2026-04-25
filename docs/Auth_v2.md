# Auth v2

## Mục tiêu tài liệu

Tài liệu này mô tả:

- Kiến trúc authentication và authorization hiện tại của dự án (`v1`).
- Kiến trúc dự kiến cho `v2` khi bổ sung `refresh token`, `token revocation` và `logout server-side`.
- Các thay đổi chính giữa `v1` và `v2` theo đúng cấu trúc monorepo hiện tại.

## Kiến trúc hiện tại (`v1`)

### Thành phần chính

- `apps/mobile-app`: giữ session ở client, điều khiển protected routes bằng Expo Router.
- `services/main-backend`: xác thực Google, phát hành JWT nội bộ và bảo vệ API bằng `JwtAuthGuard`.
- `packages/database`: lưu `User` và `UserProvider`, chưa có bảng session hoặc refresh token.

### Authentication flow

1. Mobile app khởi động, `AuthProvider` đọc `accessToken` từ `SecureStore` hoặc `localStorage`.
2. Nếu có token, mobile gọi `GET /auth/profile` để kiểm tra token còn hợp lệ hay không.
3. Nếu hợp lệ, app khôi phục `session` gồm `accessToken` và thông tin `user`.
4. Nếu chưa đăng nhập, người dùng đi vào nhóm màn hình `(auth)`.
5. Khi đăng nhập bằng Google, mobile lấy `Google ID token` qua `expo-auth-session`.
6. Mobile gửi `idToken` lên `POST /auth/google/exchange`.
7. Backend xác minh `Google ID token`, tìm hoặc tạo user nội bộ, rồi phát hành `accessToken` của hệ thống.
8. Mobile lưu `accessToken` vào storage và dùng token này để gọi các API protected về sau.

### Authorization flow

- Ở mobile, authorization hiện tại chỉ là `route protection` theo trạng thái `session`.
- Ở backend, các endpoint protected dùng `JwtAuthGuard` hoặc `@RequireAuth()`.
- `JwtStrategy` giải mã JWT, lấy `payload.sub`, truy vấn user trong database và gắn `req.user`.
- Nếu token hợp lệ và user tồn tại thì request được đi tiếp.

### Đặc điểm của `v1`

- Hệ thống đang dùng `stateless access token` làm token chính.
- Google chỉ được dùng để xác minh danh tính ban đầu.
- Sau login, app chỉ dùng JWT nội bộ do backend cấp.
- `signOut()` ở mobile hiện chỉ xóa token phía client.
- Chưa có `refresh token`, chưa có `server-side logout`, chưa có `revoke token`.
- Authorization mới dừng ở mức “đã đăng nhập hay chưa”, chưa có `RBAC` hoặc `permission-based authorization`.

### Hạn chế của `v1`

- Khi `accessToken` hết hạn, người dùng phải đăng nhập lại.
- Backend không quản lý session theo thiết bị.
- Không thể revoke session của một thiết bị cụ thể.
- Logout không vô hiệu hóa token ở phía server.
- Nếu cần force logout hoặc quản lý nhiều phiên đăng nhập, `v1` chưa hỗ trợ.

## Kiến trúc dự kiến (`v2`)

### Mục tiêu

- Giữ trải nghiệm đăng nhập bền hơn bằng `refresh token`.
- Hỗ trợ `logout server-side`.
- Hỗ trợ `revoke token` hoặc `revoke session` theo thiết bị.
- Tạo nền tảng để mở rộng sang quản lý nhiều phiên đăng nhập trong tương lai.

### Kiến trúc tổng quát

`v2` vẫn giữ luồng Google Sign-In hiện tại, nhưng sau khi backend xác thực thành công, hệ thống sẽ phát hành **2 token**:

- `accessToken`: thời hạn ngắn, dùng để gọi API protected.
- `refreshToken`: thời hạn dài, dùng để xin `accessToken` mới.

Khác với `v1`, backend sẽ lưu trạng thái session hoặc `refresh token hash` trong database để có thể revoke và logout ở phía server.

### Authentication flow trong `v2`

1. Mobile đăng nhập bằng Google như hiện tại.
2. Backend xác minh Google identity.
3. Backend tạo một `auth session` mới trong database.
4. Backend phát hành `accessToken` và `refreshToken`.
5. Mobile lưu cả hai token trong storage an toàn.
6. Khi `accessToken` hết hạn, mobile gọi `POST /auth/refresh` với `refreshToken`.
7. Backend kiểm tra session hiện tại còn hiệu lực, chưa bị revoke, chưa hết hạn.
8. Nếu hợp lệ, backend cấp `accessToken` mới và có thể `rotate refresh token`.
9. Khi logout, mobile gọi `POST /auth/logout`; backend revoke session hiện tại rồi mobile xóa token local.

### Authorization flow trong `v2`

- Authorization ở tầng API vẫn tiếp tục dựa trên `accessToken`.
- `JwtStrategy` vẫn xác minh JWT để cho phép truy cập các endpoint protected.
- Nếu cần mức an toàn cao hơn, backend có thể kiểm tra thêm trạng thái session khi xử lý request.
- `v2` chưa bắt buộc phải thêm `RBAC`, nhưng kiến trúc mới tạo nền để sau này gắn role hoặc permission vào session/token.

## Các thay đổi chính so với `v1`

### 1. Database

Sẽ cần thêm một model mới, ví dụ `AuthSession` hoặc `RefreshToken`, trong Prisma schema.

Model này thường bao gồm:

- `id`
- `userId`
- `refreshTokenHash`
- `expiresAt`
- `revokedAt`
- `replacedBySessionId` hoặc trường tương đương để hỗ trợ token rotation
- `createdAt`
- metadata như `deviceName`, `userAgent`, `ipAddress`

Mục đích là để backend có thể quản lý session theo thiết bị và revoke từng phiên đăng nhập.

### 2. Backend API

Ngoài các endpoint hiện có, `v2` sẽ cần thêm:

- `POST /auth/refresh`: dùng `refreshToken` để cấp token mới.
- `POST /auth/logout`: revoke phiên hiện tại.
- Có thể thêm `POST /auth/logout-all`: revoke toàn bộ session của user.

`POST /auth/google/exchange` cũng sẽ thay đổi response: thay vì chỉ trả `accessToken`, endpoint này sẽ trả cả bộ token mới.

### 3. Backend service logic

Phần `AuthService` sẽ không còn chỉ có logic “phát một JWT rồi trả về client”. Thay vào đó sẽ cần thêm:

- logic tạo session trong database
- logic tạo `accessToken` ngắn hạn
- logic tạo `refreshToken` dài hạn
- logic `refresh token rotation`
- logic `revoke current session`
- logic `revoke all sessions`
- logic phát hiện `refresh token reuse` nếu muốn siết an toàn hơn

### 4. Mobile app

Mobile sẽ cần thay đổi session model từ một token sang hai token.

Các thay đổi chính:

- lưu thêm `refreshToken`
- khi app khởi động, nếu `accessToken` không còn dùng được thì thử gọi `/auth/refresh`
- khi logout, gọi backend trước rồi mới xóa token local
- có thể thêm cơ chế tự refresh khi API trả `401`

### 5. Environment variables

`v1` hiện có `JWT_SECRET` và `JWT_EXPIRES_IN`.

`v2` nên tách rõ:

- `ACCESS_TOKEN_SECRET`
- `ACCESS_TOKEN_EXPIRES_IN`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN`

Việc tách riêng giúp quản lý vòng đời và mức độ tin cậy của từng loại token rõ hơn.

## Tác động lên cấu trúc code

### Backend

Các file chắc chắn sẽ thay đổi:

- `packages/database/prisma/schema.prisma`
- `services/main-backend/src/auth/auth.controller.ts`
- `services/main-backend/src/auth/auth.service.ts`
- `services/main-backend/src/auth/auth.module.ts`
- `services/main-backend/src/auth/jwt.strategy.ts`
- `.env.example`

Các file có khả năng được tạo thêm:

- DTO/schema cho `refresh` và `logout`
- service hoặc helper cho token generation / token hashing
- migration Prisma cho bảng session mới
- test mới cho refresh, logout, revoke

### Mobile

Các file chắc chắn sẽ thay đổi:

- `apps/mobile-app/src/providers/AuthProvider.tsx`
- `apps/mobile-app/src/features/auth/api/auth.api.ts`
- `apps/mobile-app/src/features/auth/types.ts`
- `apps/mobile-app/src/services/storage/session-storage.ts`

Các file có khả năng được tạo thêm:

- helper quản lý token expiry
- interceptor hoặc wrapper để tự động refresh token khi request thất bại vì `401`

## So sánh ngắn gọn giữa `v1` và `v2`

| Chủ đề | `v1` | `v2` |
| --- | --- | --- |
| Token dùng sau login | Chỉ có `accessToken` | `accessToken` + `refreshToken` |
| Session lưu ở server | Không | Có |
| Refresh khi token hết hạn | Không | Có |
| Logout server-side | Không | Có |
| Revoke theo thiết bị | Không | Có |
| Khả năng quản lý nhiều phiên | Hạn chế | Tốt hơn |
| Độ phức tạp triển khai | Thấp | Cao hơn nhưng thực tế hơn |

## Kết luận

`v1` phù hợp để hoàn thành luồng đăng nhập cơ bản và bảo vệ API bằng JWT. Tuy nhiên, `v1` chưa đủ mạnh cho các nhu cầu thực tế như duy trì phiên dài hạn, logout đúng nghĩa ở server, hoặc quản lý session theo thiết bị.

`v2` bổ sung `refresh token`, `token revocation` và `logout server-side`, giúp kiến trúc auth tiến gần hơn tới production-ready. Đổi lại, hệ thống sẽ cần thêm session persistence trong database, thêm API mới, và mở rộng đáng kể logic ở cả backend lẫn mobile app.