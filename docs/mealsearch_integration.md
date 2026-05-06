# Meal Search Integration

## Mục tiêu tài liệu

Tài liệu này tổng hợp các việc cần hoàn thành trước khi tích hợp đầy đủ tính năng `meal search` + `meal detail` giữa:

- `apps/mobile-app`
- `services/main-backend`
- `packages/shared`
- `packages/database`

Tài liệu cũng ghi lại:

- các blocker đã xác nhận
- các điểm cần giải quyết trước khi code
- checklist tích hợp theo thứ tự thực hiện
- các điểm cần bạn làm rõ trước khi khóa contract cuối cùng

## Phạm vi tính năng

Phạm vi `meal search` trong tài liệu này bao gồm:

- màn hình `/meal-search`
- màn hình `/meal-search/[mealId]`
- API `GET /api/v1/meals`
- API `GET /api/v1/meals/:id`
- điều hướng từ menu/home vào search/detail
- luồng `Add to Menu` từ meal detail

Ngoài phạm vi của tài liệu này:

- AI recommendation / ranking nâng cao ngoài logic search hiện tại
- upload/serve ảnh meal ngoài field `meal_image_key` hiện có
- thay đổi UX lớn ngoài phạm vi cần thiết để nối API thật

## Hiện trạng tóm tắt

- Backend đã có module `meal-search`, controller, service, unit tests và e2e tests riêng cho search/detail.
- `MealSearchModule` đã được mount trong `services/main-backend/src/app.module.ts`.
- Shared schemas hiện đã hỗ trợ `q` optional, `difficulty`, `allergies`, `cookTimeMin`, `cookTimeMax`, `page`, `pageSize` và response search phân trang.
- `GET /api/v1/meals` hiện không còn trả item tối giản như trước. Mỗi item trong `list[]` đã có thêm `meal_image_key`, `total_calories`, `total_protein`, `total_fat`, `total_fiber`, ngoài các field cũ như `id`, `name`, `difficulty`, `cook_time_min`, `score`.
- Backend search hiện có 2 mode:
	- nếu không truyền `q`, trả danh sách mặc định theo phân trang/sắp xếp alphabet với `score = 0`, vẫn kèm image key và nutrition fields
	- nếu có `q`, trả kết quả search theo tên món/nguyên liệu kèm ranking score, đồng thời vẫn kèm image key và nutrition fields
- `GET /api/v1/meals/:id` hiện trả detail schema hợp lệ và đã được bảo vệ bởi unit test + e2e test.
- Vấn đề runtime export của `@meal/shared` cho `MealDetailResponseSchema` đã được sửa.
- Đã xác nhận `pnpm --filter main-backend test -- meal-search` đang pass.
- Đã xác nhận `pnpm --filter main-backend test:e2e -- meal-search.e2e-spec.ts` đang pass.
- Mobile app hiện chưa có data layer riêng cho feature `meal`; mới có screen/component/mock data.
- `MealSearchScreen` hiện vẫn render `mockMeals` thay vì gọi API thật.
- `MealDetailScreen` hiện vẫn lấy dữ liệu bằng `getMockMealById(...)`.
- Search input hiện mới là UI shell; chưa có state/query flow để gọi backend.
- Filter UI hiện đang lệch contract backend ở `difficulty`.
- OpenAPI đã có path `/api/v1/meals` và `/api/v1/meals/{id}`, nhưng query params của search vẫn chưa được mô tả rõ trong file generated hiện tại.

## Các điểm cần giải quyết trước khi tích hợp

### 1. Ổn định runtime export của `@meal/shared`

- [X] Đồng bộ `packages/shared/index.ts` với `packages/shared/dist/index.js` để root import export đúng `MealDetailResponseSchema`.
- [X] Build lại `@meal/shared` trước khi validate backend/mobile runtime behavior.
- [X] Chạy lại `pnpm --filter main-backend test -- meal-search` và xác nhận cả `service.spec` lẫn `controller.spec` đều pass.
- [X] Sau khi fix, xác nhận `GET /api/v1/meals/:id` không còn fail ở bước response schema validation.

### 2. Chốt contract của danh sách kết quả search

Hiện tại backend search response đang trả:

- `list[]`, trong đó mỗi item hiện gồm:
	- `id`
	- `name`
	- `meal_image_key`
	- `difficulty`
	- `cook_time_min`
	- `total_calories`
	- `total_protein`
	- `total_fat`
	- `total_fiber`
	- `score`
- `page`
- `pageSize`
- `total`
- `hasMore`

Lưu ý:

- khi `q` rỗng, backend vẫn trả `list[]` phân trang với đầy đủ các field ở trên và `score = 0`
- khi `q` có giá trị, backend cũng trả cùng shape field như trên, nhưng `score` phản ánh ranking match
- backend vẫn chưa trả `total_carbs`

So với `MealCard` hiện tại:

- backend đã có `meal_image_key`
- backend đã có `total_calories`, `total_protein`, `total_fat`
- backend chưa có `total_carbs`
- mobile vẫn cần adapter để map snake_case sang props UI và format `cook_time_min` thành text hiển thị

Checklist cần xử lý:

- [X] Quyết định response cuối cùng của `GET /api/v1/meals` sẽ là result tối giản hay result giàu dữ liệu cho card UI. **Backend hiện đã được mở rộng theo hướng result giàu dữ liệu.**
- [X] Nếu giữ response tối giản, cập nhật `MealCard` và search UI để không phụ thuộc macro fields. **Không áp dụng cho v1; contract đã khóa theo hướng result giàu dữ liệu.**
- [X] Nếu card phải giữ macro/image, shared schema, backend mapping và unit tests hiện đã có phần lớn field cần thiết; phần còn thiếu là quyết định `total_carbs` hay đổi card sang `fiber`, cùng với cập nhật OpenAPI. **Đổi sang fiber cho giống backend. Tuy nhiên về màu sắc thì vẫn giữ giống với carbs**
- [X] Chốt cách format `cook_time_min` sang label UI (`20 mins`, `1 hour`, ...) ở đâu: backend hay mobile adapter. **Chốt: backend trả `cook_time_min` nguyên số, mobile adapter sẽ chịu trách nhiệm format sang label hiển thị theo minnute hoặc hour**
- [X] [Cần bạn làm rõ] Card kết quả search trong v1 có bắt buộc hiển thị `calories/protein/carbs/fat` không, hay chỉ cần `name + cook time + difficulty`? **Có, lưu ý rằng carb sẽ đổi sang fiber**
- [X] [Cần bạn làm rõ] Card kết quả search trong v1 có cần hiển thị ảnh món ăn không? **Không bắt buộc, nhưng backend đã có `meal_image_key` nên sẽ giữ placeholder tạm thời và triển khai phần ảnh sau cùng khi các tính năng cơ bản đã hoàn tất.**

### 3. Chốt contract của `meal detail`

Hiện tại backend detail schema đang có:

- `meal_image_key`
- `description`
- `difficulty`
- `cook_time_min`
- `total_calories`
- `total_protein`
- `total_fat`
- `total_fiber`
- `ingredients[].quantity`

Trong khi UI detail hiện đang hiển thị:

- `Calories`
- `Carbs`
- `Protein`
- `Fat`
- ingredient amount dạng chuỗi có đơn vị như `180 g`, `1 cup`, `2 tbsp`

Checklist cần xử lý:


- [X] Quyết định v1 của detail sẽ dùng `fiber` theo schema hiện tại, hay backend phải bổ sung `total_carbs`. **Chốt: dùng `total_fiber` giống backend, không bổ sung `total_carbs` ở backend cho v1.**
- [X] Quyết định ingredient trong UI cần `quantity` số thuần hay cần thêm `unit` / `displayText`. **quantity số thuần do hiện tại chưa áp dụng đơn vị**
- [X] Quyết định `meal_image_key` có phải được map sang URL/source thật trong v1 không. **Hiện tại chỉ cần giữ placeholder, việc tích hợp gọi API để lấy ảnh sẽ được triển khai khi các tính năng khác hoàn tất**
- [X] Nếu contract detail thay đổi, cập nhật `packages/shared`, backend service mapping, tests và OpenAPI đồng bộ.
- [X] [Cần bạn làm rõ] Ở detail v1, chỉ số thứ hai nên là `carbs` hay đổi UI sang `fiber` theo schema hiện tại? **Chốt: đổi UI sang `fiber` theo schema hiện tại.**
- [X] [Cần bạn làm rõ] Ingredient có cần hiển thị chuỗi hoàn chỉnh như `180 g`, `1 cup`, `2 tbsp` không? **không**
- [X] [Cần bạn làm rõ] Ảnh món ăn có nằm trong scope v1 không, hay tạm giữ placeholder? **tạm giữ placeholder và sẽ triển khai khi toàn bộ tính năng cơ bản của app hoàn tất**

### 4. Chốt hành vi search và filter phía mobile

Hiện tại có các lệch contract sau:

- backend hiện cho phép thiếu `q`; khi không có `q` sẽ trả list phân trang mặc định
- UI search screen chưa có search request flow
- UI filter đang cho chọn nhiều `difficulty`
- UI filter dùng label `Easy | Medium | Hard`
- backend query schema chỉ nhận một difficulty lowercase: `easy | medium | hard`
- backend hiện hỗ trợ thêm `cookTimeMin`, `cookTimeMax`, `page`, `pageSize`
- backend có hỗ trợ query param `allergies`, nhưng mobile chưa chốt nguồn dữ liệu cho filter này

Checklist cần xử lý:

- [X] Chốt search trigger: debounce khi gõ, submit bằng Enter, hay bấm nút search/filter mới gọi API. **Chốt: debounce 300ms, tự động submit khi hết thời gian debounce.**
- [X] Chốt behavior khi `q` rỗng: **Vẫn query bình thường với `q` rỗng, backend trả về danh sách mặc định có phân trang.**
- [ ] Đồng bộ `difficulty` về single-select hoặc mở rộng backend/shared nếu business thật sự cần multi-select.
- [ ] Đồng bộ casing giữa UI label và API value.
- [X] Chốt `allergies` filter có lấy tự động từ profile hiện tại hay là lựa chọn thủ công riêng ở màn search. **Chốt: luôn tự động lấy từ profile hiện tại của user.**
- [X] [Cần bạn làm rõ] Search nên trigger theo debounce khi nhập, hay chỉ khi người dùng submit? **Chốt: debounce 300ms, auto submit.**
- [X] [Cần bạn làm rõ] Khi `q` rỗng, màn search nên hiển thị empty state, suggestion/default list, hay chờ người dùng nhập? **Chốt: vẫn query bình thường với `q` rỗng và hiển thị danh sách mặc định có phân trang.**
- [X] [Cần bạn làm rõ] `difficulty` trong v1 là single-select hay multi-select? **Chốt: single-select theo backend.**
- [X] [Cần bạn làm rõ] Bộ lọc dị ứng có tự động lấy từ profile hiện tại của user không? **Chốt: có, luôn tự động lấy từ profile hiện tại, tuy nhiên sẽ triển khai sau cùng khi tính năng này hoàn tất**

### 5. Đồng bộ `mealId` giữa search, detail, menu và add-to-menu flow

Hiện tại shared/backend contract đang dùng `mealId` kiểu số nguyên dương, nhưng mock data ở mobile vẫn dùng string ids như `meal-1`, `menu-meal-avocado-toast`.

Checklist cần xử lý:

- [ ] Chuyển toàn bộ flow search/detail thật sang `mealId` numeric theo contract backend/shared.
- [ ] Rà soát route params của `/meal-search/[mealId]` để không còn phụ thuộc mock string ids.
- [ ] Rà soát luồng `MenuItemDetailModal -> /meal-search/:mealId` để không gửi id mock không tồn tại ở backend.
- [X] Chốt chiến lược cho các menu item mock hiện tại: thay hoàn toàn bằng meal thật, hay duy trì tạm 2 nguồn dữ liệu song song. **Thay hoàn toàn bằng meal thật**
- [ ] Đảm bảo `Add to Menu` từ detail dùng đúng `mealId` numeric khi gọi menu API thật.
- [X] [Cần bạn làm rõ] Trong giai đoạn tích hợp, menu hiện tại có phải chuyển hoàn toàn sang `mealId` số của backend không, hay vẫn giữ mock items song song? **Chuyển hoàn toàn thành mealID số theo backend, xóa hoàn toàn các mock item**

### 6. Bổ sung test và tài liệu API cho `meal-search`

Checklist cần xử lý:

- [X] Thêm e2e test cho `GET /api/v1/meals`.
- [X] Thêm e2e test cho `GET /api/v1/meals/:id`.
- [X] Bổ sung thêm test cho case `invalid query`; hiện đã có coverage cho `401`, `invalid id`, `not found`.
- [X] Ghi rõ query params của search ở Swagger annotations (`q`, `difficulty`, `allergies`, `cookTimeMin`, `cookTimeMax`, `page`, `pageSize`).
- [ ] Regenerate `services/main-backend/docs/openapi.json` sau khi khóa contract cuối.

## Checklist tích hợp theo lớp

### A. `packages/shared`

- [X] Đồng bộ root export và `dist` export cho các schema `meal`.
- [X] Khóa `MealSearchQuerySchema` theo contract filter cuối cùng.
- [X] Khóa `MealSearchResponseSchema` theo dữ liệu card UI cuối cùng.
- [X] Khóa `MealDetailResponseSchema` theo dữ liệu detail UI cuối cùng.
- [X] Nếu v1 cần `carbs`, `ingredient unit/displayText` hoặc image metadata bổ sung, cập nhật schema tại đây trước. **Không áp dụng cho v1 hiện tại.**
- [X] Build lại package trước khi validate backend/mobile.

### B. `packages/database`

- [X] Xác nhận schema hiện tại có đủ cho contract cuối cùng của detail/search.
- [X] Nếu detail cần thêm `total_carbs`, `ingredient unit` hoặc metadata ảnh khác, cập nhật Prisma schema. **Không áp dụng cho v1 hiện tại.**
- [X] Tạo migration Prisma cho mọi thay đổi schema cần thiết. **Không cần cho bước này vì không có thay đổi schema.**
- [ ] Cập nhật seed data để có tập meal đủ dùng cho search theo tên/nguyên liệu/filter.
- [ ] Nếu không đổi DB schema, document rõ cách mobile sẽ map từ dữ liệu hiện tại sang UI.

### C. Backend `services/main-backend`

- [X] Fix lỗi runtime import/export của `@meal/shared` trước.
- [X] Cập nhật controller annotations / OpenAPI cho query params của search. **Đã thêm Swagger query metadata ở controller; regenerate file `openapi.json` vẫn là bước riêng.**
- [X] Điều chỉnh `meal-search.service.ts` theo contract list cuối cùng. **List response hiện bám contract v1: `meal_image_key`, `total_calories`, `total_protein`, `total_fat`, `total_fiber`, `score`.**
- [X] Điều chỉnh `getMealById(...)` response mapping theo contract detail cuối cùng.
- [X] Thêm e2e specs cho `meal-search`.
- [ ] Regenerate OpenAPI sau khi contract ổn định.

### D. Mobile app `apps/mobile-app`

- [ ] Tạo data layer riêng cho feature `meal`, ví dụ `src/features/meal/api/meal.api.ts`.
- [ ] Dùng `session.accessToken` từ `AuthProvider` để gọi protected API.
- [ ] Tạo adapter/view-model để map response backend sang props UI.
- [ ] Thay `mockMeals` trên `MealSearchScreen` bằng dữ liệu thật.
- [ ] Thay `getMockMealById(...)` trên `MealDetailScreen` bằng fetch detail thật.
- [ ] Thêm loading state cho search screen.
- [ ] Thêm error state và retry state cho search screen.
- [ ] Thêm empty state khi không có kết quả search.
- [ ] Thêm loading/error/not-found state cho detail screen.
- [ ] Giữ lại luồng route params `mealTime` + `date` cho `Add to Menu` khi có locked context.
- [ ] Đảm bảo `Add to Menu` dùng `mealId` numeric thật.

### E. Kiểm thử và QA

- [ ] Search theo tên món ăn.
- [ ] Search theo nguyên liệu.
- [ ] Search với `difficulty`.
- [ ] Search với `cookingTime`.
- [ ] Search với `allergies` nếu feature này nằm trong scope v1.
- [ ] Mở detail từ search result.
- [ ] Mở detail từ menu item.
- [ ] Kiểm tra `404` khi `mealId` không tồn tại.
- [ ] Kiểm tra `401` khi token hết hạn hoặc thiếu token.
- [ ] Kiểm tra `Add to Menu` từ detail khi có `mealTime` + `date` trong route.

## Các điểm cần bạn làm rõ trước khi triển khai

- [X] Card kết quả search trong v1 có bắt buộc hiển thị `calories/protein/carbs/fat` không? **Chốt: có. Trong v1 sẽ hiển thị `calories/protein/fiber/fat`; UI vẫn giữ treatment màu cũ của `carbs` cho `fiber`.**
- [X] Card kết quả search trong v1 có cần hiển thị ảnh món ăn không? **Chốt: không bắt buộc trong v1; tạm giữ placeholder, phần ảnh thật sẽ triển khai sau khi các tính năng cơ bản hoàn tất.**
- [X] Ở detail v1, chỉ số thứ hai nên là `carbs` hay `fiber`? **Chốt: `fiber`.**
- [X] Ingredient trong detail có cần chuỗi hoàn chỉnh kèm đơn vị như `180 g`, `1 cup`, `2 tbsp` không? **Chốt: không; v1 chỉ dùng `quantity` số thuần.**
- [X] Ảnh món ăn có nằm trong scope v1 không, hay placeholder là đủ? **Chốt: placeholder là đủ cho v1; tích hợp ảnh thật sẽ làm sau.**
- [X] Search nên trigger theo debounce khi nhập, hay chỉ khi người dùng submit? **Chốt: debounce 300ms, auto submit.**
- [X] Khi `q` rỗng, màn search nên hiển thị empty state, default suggestion hay không hiển thị gì? **Chốt: vẫn gọi API bình thường và hiển thị danh sách mặc định có phân trang.**
- [X] `difficulty` filter của v1 là single-select hay multi-select? **Chốt: single-select.**
- [X] Bộ lọc `allergies` có tự động lấy từ profile hiện tại của user không? **Chốt: có, luôn tự động lấy từ profile hiện tại.**
- [X] Menu hiện tại có phải chuyển hoàn toàn sang `mealId` số của backend không, hay vẫn giữ mock items song song trong giai đoạn đầu? **Chốt: chuyển hoàn toàn sang `mealId` số theo backend và xóa các mock item hiện tại.**

## Thứ tự thực hiện khuyến nghị

1. Khóa contract v1 ở mức tài liệu và shared types theo các quyết định đã chốt: search card dùng `calories/protein/fiber/fat`, detail dùng `fiber`, ingredient chỉ dùng `quantity` số thuần, ảnh tạm dùng placeholder, `difficulty` single-select, `allergies` lấy từ profile, menu chuyển hẳn sang `mealId` số. Nếu không phát sinh scope mới thì không cần mở rộng DB schema cho v1.
2. Hoàn thiện nốt backend `meal-search` theo contract đã khóa: bổ sung coverage cho `invalid query`, rà lại response mapping/search query validation nếu còn điểm lệch nhỏ, rồi cập nhật Swagger annotations cho đầy đủ query params (`q`, `difficulty`, `allergies`, `cookTimeMin`, `cookTimeMax`, `page`, `pageSize`).
3. Regenerate [services/main-backend/docs/openapi.json](services/main-backend/docs/openapi.json) sau khi annotations/backend contract đã ổn định, để mobile có thể bám vào spec mới nhất.
4. Tạo data layer riêng cho mobile feature `meal` theo pattern đang dùng ở `profile`: API client, typed models, adapter/view-model map từ snake_case sang props UI, format `cook_time_min` sang label hiển thị ở mobile.
5. Tích hợp màn search với API thật: thay `mockMeals`, thêm debounce 300ms, default list khi `q` rỗng, filter `difficulty` single-select, wiring `allergies` từ profile, loading/error/empty states, và cập nhật `MealCard` sang `fiber` thay cho `carbs` nhưng giữ treatment màu hiện tại.
6. Tích hợp màn detail với API thật: thay `getMockMealById(...)`, cập nhật UI sang `fiber`, hiển thị ingredient bằng `quantity` số thuần, giữ placeholder cho ảnh, và bổ sung loading/error/not-found states.
7. Chuyển toàn bộ flow liên quan sang `mealId` numeric thật: route `/meal-search/[mealId]`, điều hướng từ menu/search, `MenuItemDetailModal`, `Add to Menu`, đồng thời loại bỏ các mock item/string id cũ khỏi flow chính.
8. Thực hiện QA tích hợp theo luồng thực tế: search theo tên/nguyên liệu/filter, detail từ search và menu, `401`, `404`, và `Add to Menu` khi có `mealTime` + `date` trong route context.
