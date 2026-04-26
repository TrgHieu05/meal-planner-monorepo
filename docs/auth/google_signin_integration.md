# Checklist Tích Hợp Google Sign-In Cho Android

Checklist này tách riêng phần việc cần làm để tích hợp Google Sign-In cho nền tảng Android trong monorepo hiện tại.

Tài liệu liên quan:
- [Auth v2](../Auth_v2.md)

Ghi chú phạm vi:
- Giai đoạn hiện tại chỉ ưu tiên Android.
- Web và iOS nằm ngoài phạm vi triển khai trong tài liệu này.
- Tài liệu này là nguồn sự thật cho implementation hiện tại.

## Mục tiêu

- Hoàn thiện luồng đăng nhập Google end-to-end cho mobile app Android và backend.
- Đồng bộ implementation thực tế với định hướng auth `v2`.
- Loại bỏ các điểm đứt dây hiện tại giữa UI, session client, backend và env.

## 1. Phạm vi và luồng đăng nhập

- [X] Chốt rõ phạm vi hiện tại chỉ hỗ trợ Android.
- [X] Chốt rõ mobile Android sẽ dùng luồng `Google ID token -> POST /auth/google/exchange -> app JWT`.
- [X] Đánh dấu `GET /auth/google` và `/auth/google/callback` là ngoài phạm vi Android-only ở giai đoạn này.
- [X] Nếu vẫn giữ browser OAuth flow trong code, ghi rõ đó là legacy hoặc đường mở rộng về sau, không phải luồng chính cho Android. (Quyết định: Loại bỏ browser OAuth flow để tránh nhầm lẫn và phụ thuộc không cần thiết)

## 2. Cấu hình Google Cloud và Expo cho Android

- [X] Tạo Android OAuth client trên Google Cloud.
- [X] Khai báo đúng package Android của app là `com.trghieu05.KitchenMind`.
- [X] Thu thập đúng SHA-1 hoặc SHA-256 của keystore dùng cho development build Android.
- [X] Điền `GOOGLE_ANDROID_CLIENT_ID` trong env backend. 
- [X] Điền `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` cho mobile app.
- [X] Xác nhận `EXPO_PUBLIC_API_BASE_URL` trỏ đúng backend gateway hoặc local backend.
- [X] Giữ `scheme` của Expo ổn định và nhất quán với redirect URI Android đang dùng.
- [X] Thử nghiệm Google OAuth bằng development build; không xem Expo Go là môi trường kiểm thử chuẩn cho OAuth redirect.
- [X] Quyết định cách xử lý `GoogleStrategy` hiện tại ở backend: nếu vẫn giữ strategy browser OAuth thì vẫn phải cấp `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` để backend khởi động; nếu không muốn phụ thuộc browser flow thì cần refactor để strategy này không còn là bắt buộc trong phase Android-only. (Quyết dịnh: refactor)

## 3. Triển khai phía mobile app Android

- [X] Tạo hook hoặc service Google Sign-In trong `apps/mobile-app/src/features/auth` để gom toàn bộ logic `expo-auth-session`.
- [X] Gọi `WebBrowser.maybeCompleteAuthSession()` đúng vị trí trong mobile app bootstrap hoặc auth flow.
- [X] Dùng `AuthSession.makeRedirectUri(...)` để tạo redirect URI ổn định theo custom scheme.
- [X] Lấy `idToken` từ Google response và validate trước khi gọi backend.
- [X] Gọi `signInWithGoogleIdToken(...)` từ [AuthProvider](../../apps/mobile-app/src/providers/AuthProvider.tsx) sau khi lấy được Google ID token.
- [X] Thay Google button placeholder trong [LoginScreen](../../apps/mobile-app/src/features/auth/screens/LoginScreen.tsx) bằng action đăng nhập thật.
- [X] Xử lý loading state, disabled state, cancel state và lỗi mạng trên nút Google login.
- [X] Định nghĩa thông điệp lỗi rõ ràng cho các case: user hủy login, Google token không hợp lệ, backend exchange thất bại.
- [X] Chốt luồng điều hướng sau đăng nhập thành công: vào tab chính ở đường dẫn gốc `/`.

## 4. Đồng bộ auth state trên mobile

- [X] Hợp nhất nguồn auth state; không để `useAuthStore` và `AuthProvider` cùng quản lý trạng thái đăng nhập song song.
- [X] Đổi route guard trong [apps/mobile-app/src/app/_layout.tsx](../../apps/mobile-app/src/app/_layout.tsx) sang session thật thay vì boolean giả lập trong store.
- [X] Đổi login và logout ở [LoginScreen](../../apps/mobile-app/src/features/auth/screens/LoginScreen.tsx) và [apps/mobile-app/src/app/(tabs)/index.tsx](../../apps/mobile-app/src/app/(tabs)/index.tsx) sang dùng `useSession()`.
- [X] Đảm bảo `signOut()` xóa đúng session client và phản ứng đúng với route protection.
- [X] Khi app cold start, session restore phải cập nhật đúng nguồn auth state duy nhất.

## 5. Backend API và service

- [X] Giữ `POST /auth/google/exchange` là public endpoint cho mobile Android.
- [X] Xác minh Google ID token với audience Android hợp lệ.
- [X] Fail fast nếu thiếu `GOOGLE_ANDROID_CLIENT_ID` hoặc backend không có audience hợp lệ cho Android exchange.
- [X] Chốt rõ chính sách link tài khoản: user đã tồn tại cùng email thì link thêm Google provider.
- [X] Trả response auth nhất quán cho mobile: `user + accessToken`, và sau này là `refreshToken` nếu nâng cấp `v2`.
- [X] Bổ sung logging tối thiểu cho exchange failures để debug production.
- [ ] Nếu browser OAuth flow chưa bị loại bỏ, tài liệu hóa rõ mục đích của [google.strategy.ts](../../services/main-backend/src/auth/google.strategy.ts) và ghi rõ nó không phải phần bắt buộc của Android-only flow.

## 6. Database và toàn vẹn dữ liệu

- [ ] Thêm unique constraint cho `UserProvider` trên cặp `provider + providerId`.
- [ ] Kiểm tra logic create-or-link user khi đăng nhập Google lần đầu.
- [ ] Kiểm tra logic link Google vào user đã tồn tại cùng email.
- [ ] Đảm bảo repeated sign-in là idempotent, không tạo duplicate provider records.
- [ ] Tạo migration Prisma tương ứng và cập nhật seed, test data nếu cần.

## 7. Phần mở rộng cho Auth v2

- [ ] Sau khi Android sign-in ổn định, thêm model `AuthSession` hoặc `RefreshToken` trong Prisma.
- [ ] Tách `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET` thay cho một `JWT_SECRET` duy nhất.
- [ ] Phát hành cả `accessToken` và `refreshToken` sau khi Google exchange thành công.
- [ ] Thêm `POST /auth/refresh`.
- [ ] Thêm `POST /auth/logout`.
- [ ] Xem xét `POST /auth/logout-all` nếu cần quản lý nhiều thiết bị.
- [ ] Thêm refresh token rotation và revoke session theo thiết bị.

## 8. Storage và vòng đời session trên mobile

- [ ] Mở rộng `AuthSession` type để lưu thêm `refreshToken` khi chuyển sang `v2`.
- [ ] Cập nhật secure storage để lưu cả access token và refresh token theo quy ước rõ ràng.
- [ ] Khi app khởi động, thử `refresh` nếu access token hết hạn nhưng refresh token còn hiệu lực.
- [ ] Khi logout, gọi backend revoke session trước khi xóa local token.
- [ ] Xem xét thêm interceptor hoặc wrapper để tự động retry sau khi refresh thành công.

## 9. Infrastructure và deployment

- [X] Truyền đầy đủ env vars cần thiết cho Android flow vào container backend.
- [X] Nếu `GoogleStrategy` browser OAuth vẫn còn được khởi tạo, truyền thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` hoặc refactor backend để bỏ phụ thuộc này.
- [ ] Đồng bộ env local, Docker và CI để tránh case local chạy được nhưng container fail verify token.
- [ ] Ghi rõ cách cập nhật credentials cho development, preview và production Android.
- [ ] Xác minh `nginx` hoặc API gateway forward đúng route auth cần thiết.

## 10. Testing và nghiệm thu

- [X] Unit test cho exchange flow thành công.
- [X] Unit test cho case Google token không hợp lệ.
- [X] Unit test cho case email chưa verify.
- [X] Unit test cho case link provider vào user có sẵn.
- [X] E2E test cho `POST /auth/google/exchange` với token verification được mock hoặc stub.
- [ ] Manual QA trên Android development build.
- [ ] Manual QA cho cold start restore session.
- [ ] Manual QA cho sign out và login lại.
- [ ] Manual QA cho user cancel Google popup.
- [ ] Manual QA cho network timeout và backend `401` hoặc `422`.

## 11. Tài liệu hóa và handoff

- [ ] Cập nhật [Auth v2](../Auth_v2.md) sau khi implementation thay đổi.
- [ ] Viết runbook ngắn cho setup Google Cloud credentials của Android.
- [ ] Viết hướng dẫn local testing cho Android.
- [ ] Ghi rõ danh sách env vars bắt buộc cho Android-only flow.
- [ ] Nếu vẫn giữ browser OAuth flow trong code, ghi rõ đó là phần ngoài phạm vi Android-only để tránh nhầm luồng.

## Ưu tiên xử lý trước

- [ ] Thay Google button placeholder bằng login flow thật.
- [ ] Hợp nhất `useAuthStore` và `AuthProvider` thành một auth state duy nhất.
- [ ] Chốt rõ sẽ giữ hay loại bỏ phụ thuộc `GoogleStrategy` của browser OAuth trong phase Android-only.
- [ ] Truyền đúng `GOOGLE_ANDROID_CLIENT_ID` và `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` vào các môi trường chạy.
- [ ] Thêm unique constraint cho `UserProvider(provider, providerId)`.