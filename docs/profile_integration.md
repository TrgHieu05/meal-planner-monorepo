# Profile Integration

## Mục tiêu tài liệu

Tài liệu này tổng hợp các việc cần hoàn thành để tích hợp đầy đủ tính năng `profile` giữa:

- `apps/mobile-app`
- `services/main-backend`
- `packages/shared`
- `packages/database`

Tài liệu cũng ghi lại:

- các blocker đã xác nhận
- các checklist triển khai theo thứ tự ưu tiên
- các điểm cần bạn làm rõ trước khi code

## Phạm vi tính năng

Phạm vi `profile` trong tài liệu này bao gồm:

- xem profile hiện tại trên mobile app
- cập nhật thông tin người dùng cơ bản
- cập nhật preferences của profile
- cập nhật metric mới nhất
- cập nhật allergy
- cập nhật favorite ingredient
- xử lý user mới đăng nhập Google lần đầu
- nối onboarding với dữ liệu backend thật

## Hiện trạng tóm tắt

- Backend đã có các API chính cho `profile`, `user`, `metric`, `allergy`, `favorite-ingredient`, `options`.
- Mobile app đã có `AuthProvider` và session JWT đủ để gọi protected API.
- Mobile profile UI hiện vẫn chủ yếu dùng dữ liệu hardcoded, chưa dùng dữ liệu backend thật.
- Có lệch contract giữa backend, shared schema và mobile ở một số field quan trọng.
- Chưa có API danh sách/search ingredient để nối selector cho allergy và favorite ingredient.
- Chưa có luồng hoàn chỉnh cho first-time user sau Google Sign-In.

## Blocker ưu tiên cao

### 1. Thống nhất `gender` domain

- [ ] Thống nhất domain của `gender` giữa database, backend, shared schema và mobile UI.
- [ ] Chốt rõ hệ thống có cho phép giá trị `U` / `UNKNOWN` / `Prefer not to say` hay không. `[Cần bạn làm rõ]` **Không cho phép các giá trị ngoài `M | F`. Trước onboarding, `user.gender` phải nullable ở database/shared schema/backend; giá trị này sẽ được cập nhật qua luồng onboarding.**
- [ ] Nếu chỉ cho phép `M | F`, cập nhật luồng tạo user Google để không sinh giá trị ngoài schema.
- [ ] Nếu cho phép thêm giá trị mới, cập nhật đồng bộ Prisma schema, shared schema, backend validation và mobile mapping.
- [ ] Bổ sung test cho trường hợp user mới đăng nhập Google rồi gọi `GET /api/v1/users/me` và `GET /api/v1/profile/overview`.

### 2. Chốt chiến lược tạo `profile` cho user mới

- [ ] Quyết định `profile` được tạo tự động ngay sau login hay chỉ tạo khi user hoàn thành onboarding. `[Cần bạn làm rõ]` **Chỉ tạo sau khi onboarding. Nhưng lưu ý rằng trong luồng onboarding thì có phần cập nhật thông tin của user (gender, bỉthday)**
- [ ] Nếu chọn auto-bootstrap, định nghĩa default values hợp lệ cho `dietTypeId`, `goalId`, `cuisineTypeId`, `targetCalories`, `activityLevel`. `[Cần bạn làm rõ]` **Không áp dụng trong v1 vì profile không auto-bootstrap; profile chỉ được tạo sau onboarding.**
- [ ] Nếu chọn onboarding-driven bootstrap, bổ sung endpoint tạo profile ban đầu, ví dụ `POST /api/v1/profile`.
- [ ] Đảm bảo user mới không bị `404 Profile not found for the current user` khi đi qua luồng chuẩn của app.
- [ ] Bổ sung test cho first-time user theo chiến lược đã chọn.

### 3. Bổ sung nguồn dữ liệu ingredient cho mobile

- [ ] Thiết kế API ingredient catalog/search để mobile chọn allergy và favorite ingredient.
- [ ] Chốt endpoint sẽ là danh sách toàn bộ, search endpoint, hay cả hai. `[Cần bạn làm rõ]` **Cả hai, nhưng triển khai 1 endpoint duy nhất: Khi q rỗng: trả danh sách browse mặc định. Khi q có giá trị: trả kết quả search.**
- [ ] Chốt có cần pagination / debounced search / lọc theo tên hay không. `[Cần bạn làm rõ]` **Có pagniation với 30 nguyên liệu 1 lần gọi và search theo tên, debounce 500ms, không có bộ lọc**
- [ ] Định nghĩa response tối thiểu cho selector: `id`, `name`.
- [ ] Tài liệu hóa contract lỗi `409` khi ingredient bị conflict giữa allergy và favorite ingredient.

### 4. Chốt các field thực sự thuộc scope `profile`

- [ ] Xác nhận `cuisineType` là single-select hay multi-select. `[Cần bạn làm rõ]`**Hiện tại chỉ cho phép single-select để đơn giản hóa schema và UI**
- [ ] Nếu multi-select là requirement thật, cập nhật DB schema, API contract và mobile types cho phù hợp.
- [ ] Nếu single-select là requirement thật, cập nhật mobile types và UI để không còn mô hình `cuisineTypes: string[]`.
- [ ] Xác nhận `notificationsEnabled` có thuộc scope profile v1 hay chưa. `[Cần bạn làm rõ]` **Không thuộc scope v1, loại bỏ nếu tồn tại**
- [ ] Xác nhận `bodyFatPercent` có thuộc scope metric/profile v1 hay chưa. `[Cần bạn làm rõ]` **Không thuộc scope v1, loại bỏ nếu tồn tại**

## Checklist triển khai theo lớp

### A. `packages/shared`

- [x] Rà soát và thống nhất lại các schema trong `packages/shared/types/user.ts`.
- [x] Rà soát `packages/shared/types/profile.ts` để phản ánh đúng model profile cuối cùng.
- [x] Thống nhất response schema cho metric để `GET latest` và `POST create` không bị lệch shape.
- [x] Nếu thêm ingredient API, tạo schema response riêng trong `packages/shared/types/ingredient.ts` hoặc file liên quan.
- [ ] Đảm bảo mobile không phải đoán enum/code từ text label.

### B. `packages/database`

- [x] Cập nhật `packages/database/prisma/schema.prisma` theo quyết định cuối cùng về `gender`, `profile bootstrap`, và `cuisine type`.
- [x] Tạo migration Prisma cho mọi thay đổi schema cần thiết.
- [ ] Cập nhật seed data để có dữ liệu kiểm thử phù hợp cho profile flow.
- [ ] Thêm seed cho user mới nếu cần kiểm thử first-time onboarding/profile bootstrap.
- [ ] Nếu thêm ingredient catalog endpoint có search, xem lại index hoặc unique constraint cần thiết cho bảng `Ingredient`.

### C. Backend `services/main-backend`

#### Auth

- [x] Cập nhật `auth.service.ts` để luồng tạo user Google tương thích với schema cuối cùng.
- [x] Không tạo `profile` khi user được tạo lần đầu; chỉ khởi tạo sau khi hoàn thành onboarding.
- [x] Trả explicit field `isOnboardingCompleted` trong `POST /api/auth/google/exchange` và `GET /api/auth/profile` để mobile route guard dùng làm nguồn sự thật.

#### User

- [x] Giữ contract cập nhật user nhất quán cho `userName`, `gender`, `dateOfBirth`.
- [x] Cho phép `gender` nullable trước onboarding; khi field này có giá trị thì chỉ chấp nhận `M | F`.
- [ ] Chốt payload `dateOfBirth` theo format `YYYY-MM-DD` và ghi rõ trong mobile adapter.
- [x] Đảm bảo shared schema parse được dữ liệu thật mà backend trả ra.

#### Profile Preferences

- [x] Hoàn thiện contract cho `GET /api/v1/profile`, `GET /api/v1/profile/overview`, `PATCH /api/v1/profile`.
- [x] Bổ sung `POST /api/v1/profile` để onboarding tạo profile lần đầu theo onboarding-driven bootstrap.
- [x] Chốt cách backend xử lý field optional/null trong update payload.

#### Metric

- [x] Thống nhất response của `POST /api/v1/metrics` với response model dùng ở client.
- [ ] Chốt xem client sẽ dùng response của `POST /metrics` ngay hay luôn re-fetch overview sau khi save. `[Cần bạn làm rõ]` **Refetch overview sau khi save metric để đảm bảo dữ liệu luôn đồng bộ và có latestMetric mới nhất trong profile overview**
- [ ] Nếu re-fetch overview là chiến lược chính, document rõ để mobile đơn giản hóa state sync.

#### Allergy và Favorite Ingredient

- [x] Giữ contract `PATCH` theo `ingredientIds` nhất quán.
- [x] Bảo toàn behavior `409 Conflict` cho danh sách xung đột.
- [x] Nếu cần, trả thêm metadata để UI hiển thị conflict thân thiện hơn. `[Cần bạn làm rõ]` **Có, backend phải trả metadata có cấu trúc.**

#### Ingredient Catalog

- [x] Tạo controller/service cho ingredient catalog nếu đây là hướng được chọn.
- [x] Khóa contract endpoint: `GET /api/v1/ingredients?q=&page=1&pageSize=30`.
- [x] Khi `q` rỗng, endpoint trả danh sách browse mặc định; khi `q` có giá trị, endpoint trả kết quả search theo tên.
- [x] Khóa response shape: `items`, `page`, `pageSize`, `total`, `hasMore`; mỗi item tối thiểu gồm `id`, `name`.
- [x] Nếu dùng search, hỗ trợ query string nhất quán cho mobile.
- [x] Ghi rõ trong OpenAPI response và error contract.

### D. Mobile app `apps/mobile-app`

#### Data layer và session usage

- [x] Chuẩn hóa toàn bộ profile API calls để dùng `session.accessToken` từ `AuthProvider`.
- [x] Giảm hoặc loại bỏ dependency vào `EXPO_PUBLIC_PROFILE_ACCESS_TOKEN` trong luồng UI chính.
- [x] Dùng explicit field `isOnboardingCompleted` từ backend để route guard quyết định vào `onboarding` hay `(tabs)`, không tự suy luận từ nhiều request rời rạc ở client.
- [x] Tạo API functions riêng cho:
- [x] đọc profile overview
- [x] cập nhật user
- [x] cập nhật preferences
- [x] tạo metric
- [x] đọc/cập nhật allergy
- [x] đọc/cập nhật favorite ingredient
- [x] đọc ingredient catalog nếu backend bổ sung endpoint
- [x] Chốt có cần `axios` instance/interceptor chung cho `401` và lỗi mạng hay không. `[Cần bạn làm rõ]` **Có**

#### Profile screen

- [ ] Thay dữ liệu hardcoded trên màn profile bằng dữ liệu thật từ backend.
- [ ] Thêm loading state.
- [ ] Thêm error state.
- [ ] Thêm empty state nếu user chưa có profile hoàn chỉnh.
- [ ] Đảm bảo sau khi edit xong, màn profile được refresh dữ liệu đúng.
- [ ] Sửa link edit metrics để điều hướng đúng màn `edit-metric`.

#### Edit User Info

- [ ] Prefill form bằng dữ liệu thật hiện tại của user.
- [ ] Map label giới tính của UI về code backend đúng chuẩn.
- [ ] Submit `dateOfBirth` dưới dạng `YYYY-MM-DD`.
- [ ] Hiển thị lỗi validation `422` theo field nếu backend reject payload.
- [ ] Xóa các giá trị placeholder/hardcoded trong form.

#### Edit Preferences

- [ ] Load options thật từ `/api/v1/options/diet-types`.
- [ ] Load options thật từ `/api/v1/options/goals`.
- [ ] Load options thật từ `/api/v1/options/cuisine-types`.
- [ ] Submit `dietTypeId`, `goalId`, `cuisineTypeId` thay vì text label.
- [ ] Đồng bộ `activityLevel` UI với enum backend: `HIGH`, `AVERAGE`, `LOW`.
- [ ] Chốt lại UI select cho `cuisineType` theo quyết định single hay multi-select.

#### Edit Metric

- [ ] Prefill metric hiện tại từ `latestMetric` hoặc endpoint riêng.
- [ ] Gửi `POST /api/v1/metrics` khi user lưu.
- [ ] Sau khi lưu, cập nhật lại màn profile theo chiến lược đã chốt.
- [ ] Hiển thị lỗi validation nếu `height` hoặc `weight` không hợp lệ.

#### Edit Allergy và Favorite Ingredient

- [ ] Thay danh sách ingredient hardcoded bằng dữ liệu thật từ backend.
- [ ] Lưu state theo `ingredientId` thay vì chỉ theo tên ingredient.
- [ ] Đồng bộ danh sách selected/current từ API hiện tại.
- [ ] Submit `ingredientIds` về backend khi lưu.
- [ ] Hiển thị lỗi `409 Conflict` theo UX đã thống nhất.
- [ ] Chốt modal conflict chỉ để confirm hay còn phải hiển thị danh sách item xung đột cụ thể. `[Cần bạn làm rõ]` **Hiển thị danh sách item xung đột cụ thể, tuy nhiên nếu số lượng xung đột nhiều hơn 2 thì hiển thị "+ x others" như trong UI**

#### Onboarding

- [x] Chốt user mới sau login sẽ vào onboarding bắt buộc hay vẫn vào app rồi hoàn thiện profile sau. `[Cần bạn làm rõ]` **Hiện tại sẽ bắt buộc hoàn thiện onboarding trước**
- [ ] Nối các màn onboarding với options thật từ backend.
- [ ] Nối submit cuối onboarding với backend create/update profile.
- [x] Quyết định trạng thái hoàn thành onboarding lấy từ local state hay derive từ server profile completeness. `[Cần bạn làm rõ]` **Derive từ server thông qua field explicit `isOnboardingCompleted`; rule hiện tại để backend tính field này là user đã có `gender`, `dateOfBirth` và `profile` row.**
- [x] Nếu profile chưa hoàn chỉnh, chốt có chặn các tab khác hay không. `[Cần bạn làm rõ]` **Có, chặn toàn bộ tabs cho đến khi server xác nhận onboarding complete**

## Checklist kiểm thử

### Backend tests

- [x] Thêm test cho first-time Google user.
- [x] Thêm test cho trường hợp user có token hợp lệ nhưng chưa có profile.
- [x] Thêm test cho create/bootstrap profile theo flow đã chọn.
- [x] Thêm test cho ingredient catalog endpoint nếu có.
- [x] Thêm test để bắt mismatch response shape của metrics.

### Mobile tests

- [ ] Thêm test cho mapping dữ liệu profile từ API sang UI view model.
- [ ] Thêm test cho conversion `gender` label <-> backend code.
- [ ] Thêm test cho conversion `dateOfBirth` sang `YYYY-MM-DD`.
- [ ] Thêm test cho flow save preference/metric/user info.
- [ ] Thêm test cho conflict handling của allergy/favorite ingredient.

### End-to-end / manual QA

- [ ] Đăng nhập bằng Google với user mới hoàn toàn.
- [ ] Xác minh app điều hướng đúng theo flow đã chốt.
- [ ] Xác minh xem profile screen có load dữ liệu thật không.
- [ ] Cập nhật từng nhóm dữ liệu và restart app để kiểm tra persistence.
- [ ] Thử các case lỗi: token hết hạn, payload sai, ingredient conflict, profile chưa tồn tại.

## Checklist tài liệu và vận hành

- [x] Cập nhật `services/main-backend/docs/openapi.json` sau khi đổi API contract.
- [ ] Nếu thêm endpoint hoặc đổi schema, cập nhật tài liệu API liên quan.
- [ ] Nếu thay đổi env vars hoặc flow mobile, cập nhật `.env.example`.
- [ ] Nếu onboarding/profile completeness thay đổi route flow, cập nhật tài liệu mobile architecture liên quan.

## Các điểm cần bạn làm rõ trước khi triển khai

- [ ] `gender` cuối cùng là `M/F` hay cần thêm `Unknown/Other/Prefer not to say`? `[Cần bạn làm rõ]` **Chốt: chỉ cho phép `M | F`; trước onboarding thì `user.gender` phải nullable.**
- [ ] `profile` có được tạo tự động khi user login lần đầu không? `[Cần bạn làm rõ]` **Chốt: không auto-create; chỉ tạo sau khi hoàn thành onboarding.**
- [ ] Nếu auto-create profile, default values hợp lệ cho các foreign key là gì? `[Cần bạn làm rõ]` **Chốt: không áp dụng trong v1 vì không dùng auto-bootstrap profile.**
- [ ] `cuisineType` là single-select hay multi-select? `[Cần bạn làm rõ]` **Chốt: single-select.**
- [ ] `notificationsEnabled` có nằm trong scope feature profile hiện tại không? `[Cần bạn làm rõ]` **Chốt: không thuộc scope v1.**
- [ ] `bodyFatPercent` có nằm trong scope metric/profile hiện tại không? `[Cần bạn làm rõ]` **Chốt: không thuộc scope v1.**
- [ ] Ingredient selector cần full list, search-only, hay list + search? `[Cần bạn làm rõ]` **Chốt: dùng 1 endpoint duy nhất hỗ trợ cả browse mặc định và search theo tên.**
- [ ] Contract của ingredient endpoint sẽ được khóa như thế nào? `[Cần bạn làm rõ]` **Chốt: `GET /api/v1/ingredients?q=&page=1&pageSize=30` trả response dạng `{ items, page, pageSize, total, hasMore }`, mỗi item tối thiểu gồm `{ id, name }`.**
- [ ] Backend có trả tín hiệu explicit cho onboarding status hay để mobile tự suy luận? `[Cần bạn làm rõ]` **Chốt: backend trả explicit field `isOnboardingCompleted`; mobile route guard dùng field này làm nguồn sự thật.**
- [ ] Sau login lần đầu, user nên vào onboarding bắt buộc hay vào thẳng app? `[Cần bạn làm rõ]` **Chốt: bắt buộc hoàn thiện onboarding trước.**
- [ ] Khi profile chưa hoàn chỉnh, app có chặn các feature khác hay không? `[Cần bạn làm rõ]` **Chốt: chặn toàn bộ tabs cho đến khi server xác nhận onboarding complete.**
- [ ] Mobile có cần interceptor tự refresh/retry khi gặp `401` trong phạm vi task này không? `[Cần bạn làm rõ]` **Chốt: có.**

Hiện tại phần này không còn câu hỏi nghiệp vụ mở. Phần còn lại là chuyển các quyết định trên thành giải pháp kỹ thuật cụ thể trong schema, backend contract, mobile data layer và route guard.

## Thứ tự thực hiện khuyến nghị

1. Chốt các điểm làm rõ ở phần trên.
2. Sửa shared schema và database schema trước.
3. Hoàn thiện backend contract cho first-time user, profile bootstrap và ingredient catalog.
4. Sau khi backend contract ổn định, nối mobile data layer.
5. Thay dữ liệu hardcoded trên profile UI và edit screens bằng dữ liệu thật.
6. Nối onboarding với backend.
7. Bổ sung test và cập nhật tài liệu API.

## Definition of Done

- [ ] User mới đăng nhập Google có thể đi qua flow chuẩn mà không vỡ contract.
- [ ] Profile screen trên mobile hiển thị dữ liệu thật từ backend.
- [ ] User có thể cập nhật basic info, preferences, metric, allergy và favorite ingredient từ mobile.
- [ ] Dữ liệu sau khi cập nhật vẫn đúng sau khi restart app.
- [ ] Các lỗi validation/conflict được hiển thị rõ ràng cho người dùng.
- [ ] Backend và mobile đều có test đủ để bảo vệ contract chính.
- [ ] Tài liệu và OpenAPI được cập nhật theo implementation cuối cùng.