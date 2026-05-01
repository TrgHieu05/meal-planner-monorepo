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
- Mobile profile tab, các màn edit và onboarding chính hiện đã nối API thật thay cho dữ liệu hardcoded trước đây.
- Contract chính giữa backend, shared schema và mobile cho `gender`, `metric`, `ingredient catalog`, `onboarding status` đã được khóa và áp dụng trong code.
- Ingredient catalog/search và payload `409 Conflict` có cấu trúc hiện đã đi xuyên suốt từ backend tới mobile selector UI.
- Luồng first-time user sau Google Sign-In hiện đi qua onboarding bắt buộc, submit dữ liệu về backend và refresh session để lấy `isOnboardingCompleted` từ server.
- Mobile app hiện đã có unit tests bảo vệ adapter `profile`, conversion `gender/dateOfBirth`, payload save flows và conflict parsing/summarization.
- Phần còn lại tập trung vào manual QA, kiểm thử runtime trên thiết bị và đồng bộ thêm tài liệu/vận hành còn thiếu.

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
- [x] Đảm bảo mobile không phải đoán enum/code từ text label.

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
- [x] Chốt payload `dateOfBirth` theo format `YYYY-MM-DD` và ghi rõ trong mobile adapter.
- [x] Đảm bảo shared schema parse được dữ liệu thật mà backend trả ra.

#### Profile Preferences

- [x] Hoàn thiện contract cho `GET /api/v1/profile`, `GET /api/v1/profile/overview`, `PATCH /api/v1/profile`.
- [x] Bổ sung `POST /api/v1/profile` để onboarding tạo profile lần đầu theo onboarding-driven bootstrap.
- [x] Chốt cách backend xử lý field optional/null trong update payload.

#### Metric

- [x] Thống nhất response của `POST /api/v1/metrics` với response model dùng ở client.
- [x] Chốt xem client sẽ dùng response của `POST /metrics` ngay hay luôn re-fetch overview sau khi save. `[Cần bạn làm rõ]` **Refetch overview sau khi save metric để đảm bảo dữ liệu luôn đồng bộ và có latestMetric mới nhất trong profile overview**
- [x] Nếu re-fetch overview là chiến lược chính, document rõ để mobile đơn giản hóa state sync.

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

- [x] Thay dữ liệu hardcoded trên màn profile bằng dữ liệu thật từ backend.
- [x] Thêm loading state.
- [x] Thêm error state.
- [x] Thêm empty state nếu user chưa có profile hoàn chỉnh.
- [x] Đảm bảo sau khi edit xong, màn profile được refresh dữ liệu đúng.
- [x] Sửa link edit metrics để điều hướng đúng màn `edit-metric`.

#### Edit User Info

- [x] Prefill form bằng dữ liệu thật hiện tại của user.
- [x] Map label giới tính của UI về code backend đúng chuẩn.
- [x] Submit `dateOfBirth` dưới dạng `YYYY-MM-DD`.
- [x] Hiển thị lỗi validation `422` theo field nếu backend reject payload.
- [x] Xóa các giá trị placeholder/hardcoded trong form.

#### Edit Preferences

- [x] Load options thật từ `/api/v1/options/diet-types`.
- [x] Load options thật từ `/api/v1/options/goals`.
- [x] Load options thật từ `/api/v1/options/cuisine-types`.
- [x] Submit `dietTypeId`, `goalId`, `cuisineTypeId` thay vì text label.
- [x] Đồng bộ `activityLevel` UI với enum backend: `HIGH`, `AVERAGE`, `LOW`.
- [x] Chốt lại UI select cho `cuisineType` theo quyết định single hay multi-select.

#### Edit Metric

- [x] Prefill metric hiện tại từ `latestMetric` hoặc endpoint riêng.
- [x] Gửi `POST /api/v1/metrics` khi user lưu.
- [x] Sau khi lưu, cập nhật lại màn profile theo chiến lược đã chốt.
- [x] Hiển thị lỗi validation nếu `height` hoặc `weight` không hợp lệ.

#### Edit Allergy và Favorite Ingredient

- [x] Thay danh sách ingredient hardcoded bằng dữ liệu thật từ backend.
- [x] Lưu state theo `ingredientId` thay vì chỉ theo tên ingredient.
- [x] Đồng bộ danh sách selected/current từ API hiện tại.
- [x] Submit `ingredientIds` về backend khi lưu.
- [x] Hiển thị lỗi `409 Conflict` theo UX đã thống nhất.
- [x] Chốt modal conflict chỉ để confirm hay còn phải hiển thị danh sách item xung đột cụ thể. `[Cần bạn làm rõ]` **Hiển thị danh sách item xung đột cụ thể, tuy nhiên nếu số lượng xung đột nhiều hơn 2 thì hiển thị "+ x others" như trong UI**

**Chốt:** Toàn bộ profile tab và các màn chỉnh sửa liên quan hiện đã nối API thật, dùng session thật, và quay lại profile bằng cơ chế refresh theo focus để đồng bộ dữ liệu sau mỗi lần lưu.

#### Onboarding

- [x] Chốt user mới sau login sẽ vào onboarding bắt buộc hay vẫn vào app rồi hoàn thiện profile sau. `[Cần bạn làm rõ]` **Hiện tại sẽ bắt buộc hoàn thiện onboarding trước**
- [x] Nối các màn onboarding với options thật từ backend.
- [x] Nối submit cuối onboarding với backend create/update profile.
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

- [x] Thêm test cho mapping dữ liệu profile từ API sang UI view model.
- [x] Thêm test cho conversion `gender` label <-> backend code.
- [x] Thêm test cho conversion `dateOfBirth` sang `YYYY-MM-DD`.
- [x] Thêm test cho flow save preference/metric/user info.
- [x] Thêm test cho conflict handling của allergy/favorite ingredient.

### End-to-end / manual QA

- [ ] Đăng nhập bằng Google với user mới hoàn toàn.
- [ ] Xác minh app điều hướng đúng theo flow đã chốt.
- [ ] Xác minh xem profile screen có load dữ liệu thật không.
- [ ] Cập nhật từng nhóm dữ liệu và restart app để kiểm tra persistence.
- [ ] Thử các case lỗi: token hết hạn, payload sai, ingredient conflict, profile chưa tồn tại.

## Checklist tài liệu và vận hành

- [x] Cập nhật `services/main-backend/docs/openapi.json` sau khi đổi API contract.
- [x] Nếu thêm endpoint hoặc đổi schema, cập nhật tài liệu API liên quan.
- [ ] Nếu thay đổi env vars hoặc flow mobile, cập nhật `.env.example`.
- [x] Nếu onboarding/profile completeness thay đổi route flow, cập nhật tài liệu mobile architecture liên quan.

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

Hiện tại phần này không còn câu hỏi nghiệp vụ mở. Các quyết định chính đã được chuyển thành implementation trong schema, backend contract, mobile data layer, profile UI và onboarding flow. Phần còn lại là kiểm thử, manual QA và đồng bộ tài liệu/vận hành.

## Thứ tự thực hiện khuyến nghị

1. Chốt các điểm làm rõ ở phần trên.
2. Sửa shared schema và database schema trước.
3. Hoàn thiện backend contract cho first-time user, profile bootstrap và ingredient catalog.
4. Sau khi backend contract ổn định, nối mobile data layer.
5. Thay dữ liệu hardcoded trên profile UI và edit screens bằng dữ liệu thật.
6. Nối onboarding với backend.
7. Bổ sung test và cập nhật tài liệu API.

## Chi tiết bước 5

### Mục tiêu

Bước 5 là lớp tích hợp UI phía mobile sau khi data layer ở bước 4 đã ổn định. Mục tiêu của bước này là loại bỏ toàn bộ dữ liệu hardcoded khỏi profile tab và các màn chỉnh sửa liên quan, thay bằng dữ liệu thật từ backend, đồng thời chốt chiến lược refresh dữ liệu sau khi user lưu thay đổi.

### Điều kiện đầu vào

- `session.accessToken` đã được lấy tập trung từ `AuthProvider`.
- Mobile đã có API functions riêng cho `profile`, `user`, `metric`, `allergy`, `favorite ingredient`, `ingredient catalog`, và `options`.
- Backend đã khóa contract cho `GET /api/v1/profile/overview`, `PATCH /api/v1/users`, `PATCH|POST /api/v1/profile`, `POST /api/v1/metrics`, `PATCH /api/v1/allergies`, `PATCH /api/v1/favorite-ingredients`, `GET /api/v1/ingredients`.

### Phạm vi triển khai

#### 5.1 Profile screen

- Thay toàn bộ dữ liệu hiển thị hardcoded bằng dữ liệu map từ `fetchProfileScreenData`.
- Bổ sung đầy đủ `loading state`, `error state`, `empty state` cho trường hợp profile chưa hoàn chỉnh.
- Sửa các link edit để điều hướng đúng route thực tế, đặc biệt là `edit-metric`.
- Chốt cơ chế refresh: khi user quay lại profile sau một màn edit, profile screen phải tự reload dữ liệu thay vì giữ snapshot cũ.

#### 5.2 Edit User Info

- Prefill `userName`, `gender`, `dateOfBirth` từ dữ liệu thật hiện tại.
- Map nhãn giới tính của UI về đúng code backend `M | F`; không để text label trở thành contract ngầm.
- Submit qua `PATCH /api/v1/users` với `dateOfBirth` dạng `YYYY-MM-DD` ở adapter layer.
- Render lỗi `422` theo field để user biết payload nào bị reject.

#### 5.3 Edit Preferences

- Load option thật từ `diet-types`, `goals`, `cuisine-types`.
- Prefill selection hiện tại từ dữ liệu profile thực.
- Submit bằng `dietTypeId`, `goalId`, `cuisineTypeId` và `activityLevel` enum thật.
- Nếu user chưa có `profile` row, màn này phải xử lý được trường hợp create ban đầu thay vì giả định luôn là update.

#### 5.4 Edit Metric

- Prefill dữ liệu metric hiện tại từ `latestMetric`.
- Gửi `POST /api/v1/metrics` khi user lưu.
- Không tự dựng state sync phức tạp từ response create metric; thay vào đó dựa vào re-fetch profile overview khi quay lại profile screen.
- Hiển thị rõ lỗi validation khi `height` hoặc `weight` không hợp lệ.

#### 5.5 Edit Allergy và Favorite Ingredient

- Refactor ingredient selector để state nội bộ dùng `ingredientId`, không chỉ dùng tên.
- Load selected/current list từ API thật và load browse/search list từ ingredient catalog.
- Debounce search 500ms theo quyết định đã chốt.
- Submit `ingredientIds` về backend.
- Dựng UX cho `409 Conflict` bằng metadata có cấu trúc từ backend; modal phải hiển thị item conflict cụ thể, và nếu số lượng conflict lớn hơn 2 thì rút gọn thành `+ x others` theo UI đã chốt.

### Tiêu chí hoàn thành bước 5

- Profile tab không còn phụ thuộc vào dữ liệu hardcoded.
- Tất cả edit screens chính lấy dữ liệu thật, lưu dữ liệu thật và phản ánh thay đổi khi quay lại profile.
- Luồng allergy/favorite ingredient xử lý được cả browse, search, save và conflict.
- Mobile typecheck vẫn xanh sau khi thay toàn bộ wiring UI.

### Chốt hiện trạng

Phạm vi của bước 5 hiện đã được hấp thụ vào hai lát cắt triển khai `4.4` và `4.5`. Vì vậy các checklist con tương ứng ở phần `D. Mobile app` hiện đã ở trạng thái hoàn thành; phần chưa làm còn lại sau bước 5 là kiểm thử mobile, manual QA và cập nhật tài liệu/vận hành.

## Chi tiết bước 6

### Mục tiêu

Bước 6 là lớp nối onboarding với backend sau khi data layer và các contract chính đã ổn định. Mục tiêu của bước này là biến onboarding từ flow UI cục bộ thành flow thật có điều kiện truy cập, dùng option data từ server, submit dữ liệu onboarding về backend, rồi đồng bộ lại session để server xác nhận trạng thái `isOnboardingCompleted`.

### Điều kiện đầu vào

- Backend đã trả explicit field `isOnboardingCompleted` trong auth responses.
- Backend đã có `POST /api/v1/profile`, `PATCH /api/v1/users`, `POST /api/v1/metrics` và các endpoint options thật.
- Mobile đã có route guard dùng `AuthProvider` và có data layer cho `profile`, `metric`, `options`.

### Phạm vi triển khai

#### 6.1 Route guard và quyền truy cập

- Nếu user chưa đăng nhập, điều hướng về auth screens.
- Nếu user đã đăng nhập nhưng `isOnboardingCompleted = false`, chặn toàn bộ `(tabs)` và ép vào `/onboarding/step-1`.
- Nếu user đã hoàn tất onboarding, chặn route onboarding và cho vào app chính.

#### 6.2 Shared onboarding state

- Dùng một provider bọc toàn bộ 5 bước onboarding để giữ draft state xuyên suốt, không để mỗi màn tự giữ state riêng rồi mất khi chuyển bước.
- Draft phải bao gồm `gender`, `dateOfBirth`, `dietTypeId`, `goalId`, `cuisineTypeId`, `targetCalories`, `heightCm`, `weightKg`.

#### 6.3 Load option thật cho các bước chọn lựa

- Load `diet types`, `goals`, `cuisine types` từ backend qua provider chung.
- Render retry path nếu việc load options thất bại.
- Không hardcode dropdown options trong từng màn onboarding.

#### 6.4 Submit cuối onboarding

- Ở bước cuối, gom draft thành payload thật theo thứ tự nghiệp vụ:
- cập nhật `user` với `gender` và `dateOfBirth`
- tạo mới hoặc cập nhật `profile` preferences tùy user đã có `profile` row hay chưa
- tạo metric mới qua `POST /api/v1/metrics`
- Nếu payload thiếu field bắt buộc hoặc số liệu không hợp lệ, chặn submit và hiển thị lỗi rõ ràng.

#### 6.5 Đồng bộ session sau submit

- Sau khi submit thành công, gọi `refreshSession()` để lấy lại auth profile mới nhất từ server.
- Chỉ cho rời onboarding khi auth payload mới xác nhận `isOnboardingCompleted = true`.
- Điều hướng về app chính dựa trên session đã refresh, không dựa vào local assumption.

### Tiêu chí hoàn thành bước 6

- User mới sau Google Sign-In bị ép vào onboarding cho đến khi server xác nhận hoàn tất.
- Các bước onboarding dùng option data thật từ backend.
- Submit cuối onboarding tạo/cập nhật đủ dữ liệu cần thiết để backend tính `isOnboardingCompleted`.
- Session sau onboarding được đồng bộ lại từ server trước khi vào app chính.
- Mobile typecheck vẫn xanh sau khi nối toàn bộ onboarding flow.

### Chốt hiện trạng

Phạm vi của bước 6 hiện đã được hấp thụ vào lát cắt triển khai `4.3`. Checklist phần `Onboarding` trong `D. Mobile app` hiện đã ở trạng thái hoàn thành về mặt code. Phần còn lại sau bước 6 là xác minh runtime/manual QA cho first-time user flow và bổ sung test bảo vệ flow này.

## Chi tiết bước 7

### Mục tiêu

Bước 7 là lớp bảo vệ và làm sạch cuối cho integration đã hoàn thành ở bước 5 và 6. Mục tiêu là thêm test đủ sát với adapter hiện tại của mobile và đồng bộ tài liệu kỹ thuật để trạng thái repo không còn lệch giữa code, OpenAPI và tài liệu mô tả flow.

### Điều kiện đầu vào

- Bước 5 và bước 6 đã ở trạng thái code hoàn chỉnh và typecheck xanh.
- Các adapter public trong mobile (`profile.api.ts`, `profile-form.ts`) đã đủ ổn định để viết unit test.
- `openapi.json` backend đã phản ánh contract auth/profile/ingredient mới nhất.

### Phạm vi triển khai

#### 7.1 Mobile adapter tests

- Thêm unit test cho mapping `fetchProfileScreenData` từ payload backend sang `ProfileScreenData`.
- Thêm unit test cho conversion `gender` code -> UI label và `dateOfBirth` -> `YYYY-MM-DD`.
- Thêm unit test cho save adapters `updateCurrentUser`, `updateProfilePreferences`, `createProfilePreferences`, `createMetricEntry`.

#### 7.2 Conflict handling tests

- Thêm test cho parse structured `409 Conflict` từ `getIngredientConflictResponse`.
- Thêm test cho rule tóm tắt danh sách conflict thành `+ x others` khi số item lớn hơn 2.

#### 7.3 Tài liệu API và mobile architecture

- Cập nhật tài liệu auth hiện tại để phản ánh `isOnboardingCompleted`, route guard và flow sau Google Sign-In.
- Cập nhật tài liệu cấu trúc mobile để phản ánh các route/profile/onboarding/provider hiện có, không còn mô tả chúng là scaffold trống.
- Giữ `profile_integration.md` đồng bộ với trạng thái thật của code và checklist test/docs.

### Tiêu chí hoàn thành bước 7

- Mobile có unit tests chạy được cho mapping, conversion, save adapters và conflict handling chính.
- Tài liệu auth/mobile architecture không còn mô tả sai trạng thái implementation hiện tại.
- `profile_integration.md` phản ánh đúng những gì đã hoàn thành ở bước 5, 6 và 7.

### Chốt hiện trạng

Bước 7 hiện đã được thực thi ở mức unit test và tài liệu kỹ thuật. Phần chưa hoàn tất sau bước 7 là manual QA/runtime QA trên app thật và các kiểm thử người dùng đầu-cuối trên thiết bị hoặc giả lập.

## Definition of Done

- [ ] User mới đăng nhập Google có thể đi qua flow chuẩn mà không vỡ contract.
- [ ] Profile screen trên mobile hiển thị dữ liệu thật từ backend.
- [ ] User có thể cập nhật basic info, preferences, metric, allergy và favorite ingredient từ mobile.
- [ ] Dữ liệu sau khi cập nhật vẫn đúng sau khi restart app.
- [ ] Các lỗi validation/conflict được hiển thị rõ ràng cho người dùng.
- [ ] Backend và mobile đều có test đủ để bảo vệ contract chính.
- [ ] Tài liệu và OpenAPI được cập nhật theo implementation cuối cùng.