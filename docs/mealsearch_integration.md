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

- Backend đã có module `meal-search`, controller, service và unit tests cho search/detail.
- `MealSearchModule` đã được mount trong `services/main-backend/src/app.module.ts`.
- Shared schemas đã có `MealSearchQuerySchema`, `MealSearchResponseSchema`, `MealDetailResponseSchema`.
- Mobile app hiện chưa có data layer riêng cho feature `meal`; mới có screen/component/mock data.
- `MealSearchScreen` hiện vẫn render `mockMeals` thay vì gọi API thật.
- `MealDetailScreen` hiện vẫn lấy dữ liệu bằng `getMockMealById(...)`.
- Search input hiện mới là UI shell; chưa có state/query flow để gọi backend.
- Filter UI hiện đang lệch contract backend ở `difficulty`.
- OpenAPI đã có path `/api/v1/meals` và `/api/v1/meals/{id}`, nhưng query params của search chưa được mô tả rõ trong file generated.
- Backend chưa có e2e spec riêng cho `meal-search`.
- Đã xác minh một lỗi runtime thật: root import từ `@meal/shared` hiện có thể bị lệch giữa source và `dist`, làm `MealDetailResponseSchema` bị `undefined` khi chạy unit test controller detail.

## Các điểm cần giải quyết trước khi tích hợp

### 1. Ổn định runtime export của `@meal/shared`

- [X] Đồng bộ `packages/shared/index.ts` với `packages/shared/dist/index.js` để root import export đúng `MealDetailResponseSchema`.
- [X] Build lại `@meal/shared` trước khi validate backend/mobile runtime behavior.
- [X] Chạy lại `pnpm --filter main-backend test -- meal-search` và xác nhận cả `service.spec` lẫn `controller.spec` đều pass.
- [X] Sau khi fix, xác nhận `GET /api/v1/meals/:id` không còn fail ở bước response schema validation.

### 2. Chốt contract của danh sách kết quả search

Hiện tại backend search response đang trả tối thiểu:

- `id`
- `name`
- `difficulty`
- `cook_time_min`
- `score` 

Trong khi `MealCard` hiện đang cần thêm:

- `totalCalories`
- `totalProtein`
- `totalCarbs`
- `totalFat`
- `cookTime` dạng text UI

Checklist cần xử lý:

- [ ] Quyết định response cuối cùng của `GET /api/v1/meals` sẽ là result tối giản hay result giàu dữ liệu cho card UI.
- [ ] Nếu giữ response tối giản, cập nhật `MealCard` và search UI để không phụ thuộc macro fields.
- [ ] Nếu card phải giữ macro/image, mở rộng shared schema, backend mapping, unit test và OpenAPI cho phù hợp.
- [ ] Chốt cách format `cook_time_min` sang label UI (`20 mins`, `1 hour`, ...) ở đâu: backend hay mobile adapter.
- [ ] [Cần bạn làm rõ] Card kết quả search trong v1 có bắt buộc hiển thị `calories/protein/carbs/fat` không, hay chỉ cần `name + cook time + difficulty`?
- [ ] [Cần bạn làm rõ] Card kết quả search trong v1 có cần hiển thị ảnh món ăn không?

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


- [ ] Quyết định v1 của detail sẽ dùng `fiber` theo schema hiện tại, hay backend phải bổ sung `total_carbs`. **Dùng fiber giống như backend thay vì carbs ở front-end**
- [ ] Quyết định ingredient trong UI cần `quantity` số thuần hay cần thêm `unit` / `displayText`.
- [ ] Quyết định `meal_image_key` có phải được map sang URL/source thật trong v1 không.
- [ ] Nếu contract detail thay đổi, cập nhật `packages/shared`, backend service mapping, tests và OpenAPI đồng bộ.
- [ ] [Cần bạn làm rõ] Ở detail v1, chỉ số thứ hai nên là `carbs` hay đổi UI sang `fiber` theo schema hiện tại? **Dùng fiber giống như backend thay vì carbs ở front-end**
- [ ] [Cần bạn làm rõ] Ingredient có cần hiển thị chuỗi hoàn chỉnh như `180 g`, `1 cup`, `2 tbsp` không? 
- [ ] [Cần bạn làm rõ] Ảnh món ăn có nằm trong scope v1 không, hay tạm giữ placeholder?

### 4. Chốt hành vi search và filter phía mobile

Hiện tại có các lệch contract sau:

- backend yêu cầu `q` không được rỗng
- UI search screen chưa có search request flow
- UI filter đang cho chọn nhiều `difficulty`
- UI filter dùng label `Easy | Medium | Hard`
- backend query schema chỉ nhận một difficulty lowercase: `easy | medium | hard`
- backend có hỗ trợ query param `allergies`, nhưng mobile chưa chốt nguồn dữ liệu cho filter này

Checklist cần xử lý:

- [ ] Chốt search trigger: debounce khi gõ, submit bằng Enter, hay bấm nút search/filter mới gọi API. **Có debounce 300ms, auto submit nếu hết thời gian debounce** 
- [ ] Chốt behavior khi `q` rỗng: empty state, suggestion state, hay không cho gọi API.
- [ ] Đồng bộ `difficulty` về single-select hoặc mở rộng backend/shared nếu business thật sự cần multi-select.
- [ ] Đồng bộ casing giữa UI label và API value.
- [ ] Chốt `allergies` filter có lấy tự động từ profile hiện tại hay là lựa chọn thủ công riêng ở màn search.
- [ ] [Cần bạn làm rõ] Search nên trigger theo debounce khi nhập, hay chỉ khi người dùng submit?
- [ ] [Cần bạn làm rõ] Khi `q` rỗng, màn search nên hiển thị empty state, suggestion/default list, hay chờ người dùng nhập?
- [ ] [Cần bạn làm rõ] `difficulty` trong v1 là single-select hay multi-select?
- [ ] [Cần bạn làm rõ] Bộ lọc dị ứng có tự động lấy từ profile hiện tại của user không?

### 5. Đồng bộ `mealId` giữa search, detail, menu và add-to-menu flow

Hiện tại shared/backend contract đang dùng `mealId` kiểu số nguyên dương, nhưng mock data ở mobile vẫn dùng string ids như `meal-1`, `menu-meal-avocado-toast`.

Checklist cần xử lý:

- [ ] Chuyển toàn bộ flow search/detail thật sang `mealId` numeric theo contract backend/shared.
- [ ] Rà soát route params của `/meal-search/[mealId]` để không còn phụ thuộc mock string ids.
- [ ] Rà soát luồng `MenuItemDetailModal -> /meal-search/:mealId` để không gửi id mock không tồn tại ở backend.
- [ ] Chốt chiến lược cho các menu item mock hiện tại: thay hoàn toàn bằng meal thật, hay duy trì tạm 2 nguồn dữ liệu song song.
- [ ] Đảm bảo `Add to Menu` từ detail dùng đúng `mealId` numeric khi gọi menu API thật.
- [ ] [Cần bạn làm rõ] Trong giai đoạn tích hợp, menu hiện tại có phải chuyển hoàn toàn sang `mealId` số của backend không, hay vẫn giữ mock items song song?

### 6. Bổ sung test và tài liệu API cho `meal-search`

Checklist cần xử lý:

- [ ] Thêm e2e test cho `GET /api/v1/meals`.
- [ ] Thêm e2e test cho `GET /api/v1/meals/:id`.
- [ ] Bổ sung test cho case `401`, invalid query, invalid id, not found.
- [ ] Ghi rõ query params của search trong Swagger/OpenAPI (`q`, `difficulty`, `cookingTime`, `allergies`).
- [ ] Regenerate `services/main-backend/docs/openapi.json` sau khi khóa contract cuối.

## Checklist tích hợp theo lớp

### A. `packages/shared`

- [ ] Đồng bộ root export và `dist` export cho các schema `meal`.
- [ ] Khóa `MealSearchQuerySchema` theo contract filter cuối cùng.
- [ ] Khóa `MealSearchResponseSchema` theo dữ liệu card UI cuối cùng.
- [ ] Khóa `MealDetailResponseSchema` theo dữ liệu detail UI cuối cùng.
- [ ] Nếu v1 cần `carbs`, `ingredient unit/displayText` hoặc image metadata bổ sung, cập nhật schema tại đây trước.
- [ ] Build lại package trước khi validate backend/mobile.

### B. `packages/database`

- [ ] Xác nhận schema hiện tại có đủ cho contract cuối cùng của detail/search.
- [ ] Nếu detail cần thêm `total_carbs`, `ingredient unit` hoặc metadata ảnh khác, cập nhật Prisma schema.
- [ ] Tạo migration Prisma cho mọi thay đổi schema cần thiết.
- [ ] Cập nhật seed data để có tập meal đủ dùng cho search theo tên/nguyên liệu/filter.
- [ ] Nếu không đổi DB schema, document rõ cách mobile sẽ map từ dữ liệu hiện tại sang UI.

### C. Backend `services/main-backend`

- [ ] Fix lỗi runtime import/export của `@meal/shared` trước.
- [ ] Cập nhật controller annotations / OpenAPI cho query params của search.
- [ ] Điều chỉnh `meal-search.service.ts` theo contract list cuối cùng.
- [ ] Điều chỉnh `getMealById(...)` response mapping theo contract detail cuối cùng.
- [ ] Thêm e2e specs cho `meal-search`.
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

- [ ] Card kết quả search trong v1 có bắt buộc hiển thị `calories/protein/carbs/fat` không?
- [ ] Card kết quả search trong v1 có cần hiển thị ảnh món ăn không?
- [ ] Ở detail v1, chỉ số thứ hai nên là `carbs` hay `fiber`?
- [ ] Ingredient trong detail có cần chuỗi hoàn chỉnh kèm đơn vị như `180 g`, `1 cup`, `2 tbsp` không?
- [ ] Ảnh món ăn có nằm trong scope v1 không, hay placeholder là đủ?
- [ ] Search nên trigger theo debounce khi nhập, hay chỉ khi người dùng submit?
- [ ] Khi `q` rỗng, màn search nên hiển thị empty state, default suggestion hay không hiển thị gì?
- [ ] `difficulty` filter của v1 là single-select hay multi-select?
- [ ] Bộ lọc `allergies` có tự động lấy từ profile hiện tại của user không?
- [ ] Menu hiện tại có phải chuyển hoàn toàn sang `mealId` số của backend không, hay vẫn giữ mock items song song trong giai đoạn đầu?

## Thứ tự thực hiện khuyến nghị

1. Fix lỗi `@meal/shared` runtime export và đưa backend unit tests của `meal-search` về trạng thái xanh.
2. Chốt các điểm cần bạn làm rõ ở phần trên để khóa contract cuối cùng cho list/detail/filter/id strategy.
3. Cập nhật `packages/shared` và `packages/database` nếu contract cuối cần thêm field mới.
4. Hoàn thiện backend `meal-search`, thêm e2e tests và regenerate OpenAPI.
5. Tạo mobile data layer cho feature `meal` theo pattern đang dùng ở `profile`.
6. Thay toàn bộ mock data của search/detail bằng API thật, rồi thêm loading/error/empty states.
7. Kiểm thử end-to-end các luồng search -> detail -> add to menu.