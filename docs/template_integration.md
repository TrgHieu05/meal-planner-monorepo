# Template Integration

## Mục tiêu tài liệu

Tài liệu này tổng hợp các việc cần hoàn thành để tích hợp đầy đủ tính năng `template` giữa:

- `apps/mobile-app`
- `services/main-backend`
- `packages/shared`
- `packages/database`

Tài liệu cũng ghi lại:

- hiện trạng đã xác nhận
- các blocker cần xử lý trước khi code sâu hơn
- checklist triển khai theo thứ tự thực hiện
- các quyết định đã được chốt cho scope và contract hiện tại

## Phạm vi tính năng

Phạm vi `template` trong tài liệu này bao gồm:

- danh sách template trên mobile app
- xem chi tiết template
- tạo template mới
- chỉnh sửa template hiện có
- xóa template
- quản lý day trong template
- quản lý meal item trong từng day của template
- apply template vào `menus` thực tế
- hiển thị nutrition summary và macro trên list/detail/editor
- nối feature template với auth/session thật của mobile app
- kiểm thử backend, mobile và manual QA cho flow template

Ngoài phạm vi mặc định của tài liệu này:

- AI generate template
- share template cho user khác
- quản lý ảnh template thật
- analytics/reporting nâng cao cho template ngoài các macro phục vụ UI hiện tại

## Hiện trạng tóm tắt

- [x] Backend đã có module `meal-template`, mount trong app backend và bảo vệ bằng `@RequireAuth()`.
- [x] Backend đã có đủ các API v1 cho `list`, `detail`, `create`, `update`, `delete`, `upsert day`, `add item`, `update item`, `delete item`, `delete day`.
- [x] Backend đã có endpoint apply template: `POST /api/v1/meal-templates/:id/apply`.
- [x] `packages/shared/types/meal-template.ts` đã có request/response schema cho contract template v1.
- [x] Shared/backend contract template đã mở rộng để trả nutrition data cho list/detail/item và contract apply flow.
- [x] Backend unit test cho `meal-template` đang pass.
- [x] Backend e2e test cho `meal-template` đang pass ở các route `POST /api/v1/meal-templates`, `GET /api/v1/meal-templates` và `POST /api/v1/meal-templates/:id/apply`.
- [x] Mobile app đã có routing và UI shell cho các màn `TemplateList`, `TemplateDetail`, `CreateTemplate`, `EditTemplate`.
- [x] Mobile app đã có `ApplyTemplateModal` với UX cơ bản gồm `selectedDate` và `replaceExistingMeals`.
- [x] Mobile app đã có data layer riêng cho feature template tại `src/features/template/api/template.api.ts`.
- [x] Mobile `TemplateListScreen` đã fetch list thật từ backend và không còn render `SAMPLE_TEMPLATES` hardcoded.
- [x] Mobile `TemplateDetailScreen` đã fetch detail theo `templateId` route param và không còn dùng fallback `sample-template`.
- [x] Mobile `CreateTemplateScreen` đã khởi tạo bằng `1` day rỗng local đúng rule mới.
- [x] Mobile `EditTemplateScreen` đã load dữ liệu backend thật trước khi mở editor và không còn khởi tạo từ seed local.
- [ ] `TemplateEditor` hiện vẫn còn `handleAddMeal` là no-op, nên flow chọn món cho template chưa hoàn tất.
- [x] `TemplateEditor` đã có submit flow thật cho create/edit theo strategy `template metadata + upsert day + delete day`.
- [ ] `TemplateActionsMenu` mới chỉ mở modal `Apply` và `Delete`; mobile chưa nối mutation thật cho delete/apply dù backend hiện đã có apply endpoint.
- [ ] Meal search/detail flow hiện chỉ mang context add-to-menu bằng `date` và `mealTime`; chưa có context `templateId` hoặc `dayNumber` để tái dùng trực tiếp cho template.
- [x] Mobile template UI hiện giữ `nutritionSummary` và `MacroStatDetailCard`; list/detail/editor đã dùng dữ liệu thật cho load/save hiện có.
- [x] Mobile app đã có test utility/api riêng cho feature template; screen-level integration test vẫn chưa có.

## Blocker ưu tiên cao

### 1. Khóa scope triển khai hiện tại

- [x] Scope hiện tại không còn giới hạn ở CRUD v1; feature cần hoàn thiện thêm luồng `Apply Template`.
- [x] Action `Apply Template` nằm trong scope hiện tại.
- [x] Giữ entry point `Apply to date...` trên mobile và tích hợp thật thay vì ẩn/tắt.
- [x] Thiết kế backend contract cho apply flow bám UX hiện tại của `ApplyTemplateModal`: `selectedDate` + `replaceExistingMeals`.
- [x] Chốt chiến lược ghi dữ liệu khi apply template vào `menus` thật, ưu tiên transaction để tránh trạng thái nửa chừng.
- [x] Bổ sung unit test, e2e test và OpenAPI cho apply flow sau khi contract được khóa.

### 2. Chốt xử lý phần nutrition trên UI template

- [x] Giữ `nutritionSummary` ở list và `MacroStatDetailCard` ở detail/editor.
- [x] Chốt hướng kỹ thuật: shared/backend phải mở rộng contract template để trả đủ dữ liệu nutrition; mobile tiếp tục dùng `calculateTemplateNutrition(...)` để tính tổng cục bộ khi edit.
- [x] Mở rộng `MealTemplateListResponse` để list card có nutrition summary thật thay vì chuỗi hardcoded.
- [x] Mở rộng `MealTemplateDetailResponse` để item/day có đủ nutrition fields cho editor/detail state.
- [x] Đồng bộ adapter mobile để map response mới sang `MenuMealItem` hoặc `TemplateDayState` có nutrition thật.
- [ ] Không dùng placeholder lâu dài và không dùng waterfall `fetch meal detail` cho từng item chỉ để dựng macro.

### 3. Chuẩn hóa model state của template trên mobile

- [x] Khi xóa một day ở giữa, app phải tự dồn lại `dayNumber`; không cho phép gap.
- [x] Màn create template bắt đầu với `1` day rỗng mặc định.
- [x] Refactor `TemplateDayState` để chứa `dayNumber` thật từ backend, không chỉ `id` local.
- [x] Tách `uiKey` khỏi `dayNumber` để add/delete/reorder day không làm mất mapping với backend.
- [x] Khi delete day trong editor, renumber lại toàn bộ `dayNumber` trước khi save.
- [ ] Bỏ các seed sample ra khỏi flow chính của create/edit/detail; sample chỉ nên tồn tại cho preview hoặc storybook nếu cần.

### 4. Chốt chiến lược lưu create/edit template

- [x] Stage local toàn bộ editor state và chỉ persist khi bấm `Save Template`.
- [x] Strategy lưu chính là `POST/PATCH template` rồi `PUT` từng day theo `dayNumber`, cộng thêm `DELETE day` khi cần.
- [x] Không dùng item-level endpoints làm primary path của editor; giữ chúng cho tương tác nhỏ hoặc future flows nếu cần.
- [x] Xác định rõ diff logic của edit flow: luôn `PUT` toàn bộ day hiện tại theo `dayNumber` đã renumber; day biến mất khỏi snapshot ban đầu sẽ `DELETE`; thay portion hoặc xóa item được gom vào payload upsert day.
- [x] Thêm chống double submit và feedback lỗi rõ ràng cho create/edit; success path điều hướng về detail screen.
- [x] Sau khi save thành công, đồng bộ lại list/detail state thay vì tiếp tục dùng local seed.

### 5. Chốt flow chọn món để thêm vào template

- [x] Reuse meal search/detail hiện tại và mở rộng context để phục vụ template.
- [x] Item add/edit/delete vẫn stage local; chỉ persist khi `Save Template`.
- [ ] Thiết kế lại `handleAddMeal` trong `TemplateEditor`.
- [ ] Mở rộng route/query context hoặc return flow để truyền đủ `templateId` hoặc draft context, `dayNumber`, `mealTime` và dữ liệu cần để quay về editor.
- [ ] Ở `MealDetailScreen`, thêm branch cho source=`template` để thay flow `Add to Menu` bằng flow chọn item cho template draft.
- [ ] Đảm bảo khi chọn meal từ flow template, editor nhận được cả item data và nutrition data cần cho macro local.

## Checklist triển khai theo lớp

### A. `packages/shared`

- [x] Đã có file schema `packages/shared/types/meal-template.ts` cho contract cơ bản của template v1.
- [x] Nếu mobile cần import ổn định từ root package, rà soát lại export của `@meal/shared` cho các type/schema template đang dùng.
- [x] Mở rộng schema template cho nutrition contract mới của list/detail/editor.
- [x] Thêm schema request hoặc response cho apply template.
- [x] Sau mọi thay đổi contract shared, build lại package trước khi verify runtime backend/mobile.

### B. `packages/database`

- [x] Schema database cho template/day/item đã tồn tại theo tài liệu `feature_template_v1.md`.
- [ ] Xác nhận lại migration hiện tại đã phản ánh đúng unique constraint cho `template_id + day_number` ở mọi môi trường.
- [x] Không cần migration riêng chỉ để giữ macro UI nếu tái sử dụng nutrition đã có từ meal.
- [x] Với apply flow, đánh giá xem chỉ cần transaction trên các bảng menu hiện có hay cần thêm bảng/log phục vụ audit.

### C. Backend `services/main-backend`

- [x] Giữ nguyên CRUD hiện có cho template/day/item làm nền tích hợp.
- [ ] Bổ sung e2e test cho các route còn thiếu:
- [ ] `GET /api/v1/meal-templates/:id`
- [ ] `PATCH /api/v1/meal-templates/:id`
- [ ] `DELETE /api/v1/meal-templates/:id`
- [ ] `PUT /api/v1/meal-templates/:id/days/:dayNumber`
- [ ] `POST /api/v1/meal-templates/:id/items`
- [ ] `PATCH /api/v1/meal-templates/:id/items/:itemId`
- [ ] `DELETE /api/v1/meal-templates/:id/items/:itemId`
- [ ] `DELETE /api/v1/meal-templates/:id/days/:dayNumber`
- [x] Thiết kế endpoint và service riêng cho apply flow.
- [x] Mở rộng response list/detail template để trả nutrition data đúng với UI hiện tại.
- [x] Regenerate OpenAPI nếu contract template thay đổi.

### D. Mobile app `apps/mobile-app`

#### Data layer

- [x] Tạo `src/features/template/api/template.api.ts`.
- [x] Dùng `createAuthenticatedApiClient(...)` và `session.accessToken` từ `AuthProvider`.
- [x] Parse request/response bằng schema từ `@meal/shared/types/meal-template`.
- [x] Tạo adapter riêng cho:
- [x] template list data
- [x] template detail data
- [x] editor state data
- [x] mutation payload create/edit/day/item/apply

#### List screen

- [x] Thay `SAMPLE_TEMPLATES` bằng fetch list thật.
- [x] Thêm loading state.
- [x] Thêm empty state thật khi backend trả list rỗng.
- [x] Thêm error state và retry.
- [ ] Sau khi delete/create thành công, refetch hoặc đồng bộ list state đúng.

#### Detail screen

- [x] Bỏ fallback `sample-template`.
- [x] Fetch detail theo `templateId` route param.
- [x] Thêm loading/error/not-found state.
- [ ] Đồng bộ `TemplateActionsMenu` với mutation delete thật.
- [ ] Nối `ApplyTemplateModal` với apply mutation thật và refresh UI sau khi apply thành công.

#### Create screen

- [x] Thay seed sample bằng initial state bắt đầu từ `1` day rỗng đúng theo quyết định đã chốt.
- [x] Gọi `POST /v1/meal-templates` khi submit.
- [x] Nếu có day/item local, persist tiếp bằng day upsert sau khi template được tạo.
- [x] Sau khi create thành công, điều hướng về detail screen của template vừa tạo.

#### Edit screen

- [x] Load template detail thật trước khi mở editor.
- [x] Map dữ liệu backend vào state editor có `dayNumber` ổn định.
- [x] Persist thay đổi metadata bằng `PATCH /v1/meal-templates/:id`.
- [x] Persist thay đổi day bằng `PUT /v1/meal-templates/:id/days/:dayNumber`.
- [x] Persist day bị xóa bằng `DELETE /v1/meal-templates/:id/days/:dayNumber`.
- [x] Khi user xóa một day ở giữa, renumber lại toàn bộ day trước khi persist.
- [x] Đồng bộ UI sau save thành công, tránh tiếp tục hiển thị local state cũ.

#### Editor interactions

- [ ] Thay `handleAddMeal` no-op bằng flow chọn meal thật.
- [x] Thay `handleSubmit` no-op bằng save flow thật.
- [x] Giữ behavior copy/paste/delete day nhưng đảm bảo không làm sai `dayNumber` backend.
- [x] Đồng bộ `MenuItemDetailModal` với item template thật khi sửa portion hoặc xóa item.
- [ ] Dùng nutrition data thật từ adapter để tiếp tục render các macro card hiện tại.

#### Actions menu và modal

- [ ] Nối `DeleteTemplateModal` với delete API thật và refresh điều hướng sau khi xóa.
- [ ] Nối `ApplyTemplateModal` với apply API thật, giữ UX `selectedDate + replaceExistingMeals` hiện tại.

### E. Kiểm thử và QA

- [ ] Tạo template mới từ mobile với state khởi tạo đúng.
- [ ] Thêm day mới, copy/paste day và xóa day.
- [ ] Xóa day ở giữa và xác nhận `dayNumber` được dồn lại liên tục.
- [ ] Thêm meal vào từng mealTime trong template.
- [ ] Sửa portion size của item trong template.
- [ ] Xóa item khỏi template nhưng giữ day trống đúng theo rule hiện tại.
- [ ] Lưu template mới và mở lại để xác nhận dữ liệu không còn phụ thuộc local seed.
- [ ] Sửa template hiện có và xác nhận day/item được sync đúng.
- [ ] Xóa template từ list screen.
- [ ] Xóa template từ detail screen.
- [ ] Kiểm tra `401` khi token thiếu hoặc hết hạn.
- [ ] Kiểm tra `403/404` khi template không thuộc user hoặc không tồn tại.
- [ ] Kiểm tra `409 TEMPLATE_ITEM_CONFLICT` khi thêm trùng meal vào cùng mealTime của cùng day.
- [ ] Apply template với `replaceExistingMeals = true`.
- [ ] Apply template với `replaceExistingMeals = false`.
- [ ] Kiểm tra macro trên list/detail/editor được dựng từ dữ liệu thật thay vì sample.

## Các quyết định đã chốt

- [x] `Apply Template` nằm trong scope hoàn thiện hiện tại.
- [x] UI template tiếp tục giữ `nutritionSummary` và các macro card.
- [x] Hướng kỹ thuật cho macro là mở rộng shared/backend contract để trả nutrition data thật; mobile tiếp tục tính tổng cục bộ trong editor/detail.
- [x] Khi xóa day ở giữa, hệ thống phải dồn lại `dayNumber` liên tục; không cho phép gap.
- [x] Màn create template bắt đầu với `1` day rỗng mặc định.
- [x] Flow chọn meal cho template sẽ reuse meal search/detail hiện tại với context mở rộng cho template.
- [x] Toàn bộ add/edit/delete item trong editor sẽ stage local và chỉ persist khi bấm `Save Template`.

Hiện tại không còn mục nghiệp vụ mở trong tài liệu này. Phần còn lại là công việc thiết kế contract chi tiết và triển khai.

## Thứ tự thực hiện khuyến nghị

1. [x] Mở rộng shared/backend contract cho hai phần còn thiếu: nutrition data của template và apply template flow.
2. [x] Refactor model state của template trên mobile để có `dayNumber` thật, `uiKey` ổn định và quy tắc renumber liên tục.
3. [x] Tạo data layer `template.api.ts` và adapter map response backend sang list/detail/editor state.
4. [x] Nối list screen và detail screen với API thật, đồng thời thay `nutritionSummary` sample bằng dữ liệu thật.
5. [x] Hoàn thiện create/edit submit flow theo strategy `template metadata + upsert day + delete day`.
6. [ ] Hoàn thiện reuse meal search/detail cho flow chọn món của template và cập nhật editor local state.
7. [ ] Nối delete template thật và hoàn thiện apply template mutation theo UX hiện tại.
8. [ ] Dọn lại toàn bộ front-end để loại bỏ các phần liên quan đến mock và seed, đảm bảo mọi dữ liệu template đều đến từ backend.
9. [ ] Bổ sung backend e2e còn thiếu, mobile tests cho template adapter/editor và manual QA checklist.

## Ghi chú triển khai

- `meal-template` backend hiện đã đủ để hoàn thành CRUD v1 nếu mobile đi theo hướng save bằng metadata + day upsert; phần apply và nutrition contract là phần mở rộng cần làm thêm.
- Bước 1 đã hoàn tất ở backend/shared: contract shared đã có nutrition + apply schema, backend đã trả nutrition trong list/detail/item update, có `POST /api/v1/meal-templates/:id/apply`, unit/e2e pass và OpenAPI đã được regenerate.
- Bước 2 đã hoàn tất ở mobile state model: `TemplateDayState` dùng `dayNumber + uiKey`, editor renumber liên tục khi xóa day, create flow bắt đầu từ `1` day rỗng và đã có Jest coverage cho helper state.
- Bước 3 đã hoàn tất ở data layer: mobile đã có `template.api.ts` với authenticated fetch/mutation, schema parsing từ shared, adapter cho list/detail/editor state và builder cho payload create/edit/day/item/apply, kèm Jest coverage.
- Bước 4 đã hoàn tất ở list/detail screens: `TemplateListScreen` và `TemplateDetailScreen` đã fetch dữ liệu thật theo session/templateId, có loading/error/empty/not-found state phù hợp và `nutritionSummary`/macro ở list-detail không còn phụ thuộc sample data.
- Bước 5 đã hoàn tất ở create/edit submit flow: `TemplateEditor` đã nhận callback submit thật với pending/error state, `CreateTemplateScreen` gọi `POST template` rồi upsert day và rollback nếu create bị lỗi giữa chừng, còn `EditTemplateScreen` load dữ liệu thật, `PATCH` metadata, `PUT` toàn bộ day hiện tại và `DELETE` các day biến mất khỏi snapshot ban đầu trước khi quay về detail.
- Scope hiện tại đã được khóa theo hướng rộng hơn tài liệu `feature_template_v1.md`: giữ macro UI và hoàn thiện `Apply Template`.
- Để tận dụng lại `calculateTemplateNutrition(...)`, contract template mới nên ưu tiên trả nutrition data ngay trong response thay vì buộc mobile fetch chi tiết từng meal sau đó mới tính tổng.
- Sau mọi thay đổi ở `packages/shared`, cần build lại shared package trước khi kiểm tra runtime backend/mobile vì backend hiện dùng runtime export từ package workspace.