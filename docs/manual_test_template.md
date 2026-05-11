# Manual Test Checklist For Template Feature

## Mục tiêu

Tài liệu này dùng cho manual QA của tính năng `template` trên mobile app, bao gồm:

- load danh sách template và mở chi tiết template
- flow tạo mới và chỉnh sửa template
- flow `Template Editor -> Meal Search -> Meal Detail -> quay lại editor`
- chỉnh sửa `portion size`, xóa item trong `MenuItemDetailModal`
- action `Apply Template` và `Delete Template`
- các tình huống lỗi chính: empty state, loading, network error, `401`, `403/404`, duplicate item conflict

Checklist được viết theo hướng dễ chạy tay trên thiết bị thật hoặc emulator, không phụ thuộc vào test automation.

## Phạm vi màn hình và luồng cần test

- `TemplateListScreen`
- `TemplateDetailScreen`
- `CreateTemplateScreen`
- `EditTemplateScreen`
- `TemplateEditor`
- `TemplateActionsMenu`
- `ApplyTemplateModal`
- `DeleteTemplateModal`
- flow thêm món từ `meal search` và `meal detail`

## Điều kiện chuẩn bị

### Thiết bị và môi trường

- [ ] Có ít nhất 1 thiết bị/emulator chạy được mobile app.
- [ ] Mobile app có thể gọi được backend thật.
- [ ] Backend đang dùng đúng schema/database hiện tại.
- [ ] Shared package đã được build lại sau các thay đổi contract gần nhất.

### Dữ liệu kiểm thử khuyến nghị

- [ ] User A: chưa có template nào.
- [ ] User B: có ít nhất 1 template đầy đủ từ 2-3 day, mỗi day có ít nhất 1 item.
- [ ] User C: có ít nhất 1 template rỗng hoặc chỉ có metadata để test empty-day state.
- [ ] Có sẵn vài `meal` hợp lệ để add vào template từ flow `meal search/detail`.
- [ ] Có ít nhất 1 tình huống duplicate để test `409 TEMPLATE_ITEM_CONFLICT` khi save template day.
- [ ] Có cách giả lập token thiếu/hết hạn để test `401`.

### Ghi log khi test

- [ ] Ghi lại thiết bị, build app, branch/commit đang test.
- [ ] Ghi lại user đang test và trạng thái dữ liệu đầu vào của template.
- [ ] Nếu gặp lỗi API, chụp lại message trên UI và response backend nếu có thể.

## Danh sách checklist manual test

## 1. Template list

### 1.1 Loading, empty, error

- [x] Mở màn `Templates` với user có dữ liệu và xác nhận có loading state rõ ràng trước khi list xuất hiện.
- [x] Mở màn `Templates` với user không có template và xác nhận empty state hiển thị đúng, không render sample card.
- [x] Tắt mạng rồi mở `Templates`, xác nhận có error state và nút `Retry` hoạt động sau khi bật mạng lại.

### 1.2 Card data và điều hướng

- [x] Xác nhận mỗi card hiển thị đúng `title`, `dayCount`, `nutritionSummary` từ backend.
- [x] Chạm vào card và xác nhận điều hướng đúng vào `TemplateDetailScreen` của template tương ứng.
- [x] Mở menu actions từ card và xác nhận có đủ `Edit`, `Apply to date...`, `Delete template`.

## 2. Template detail

### 2.1 Load và hiển thị chi tiết

- [x] Mở detail của template có nhiều day và xác nhận `title`, `description`, macro tổng hiển thị đúng.
- [x] Chuyển giữa các `DayTab` và xác nhận macro của day đang chọn thay đổi đúng theo dữ liệu backend.
- [x] Với template không có day, xác nhận empty state `No days in this template yet` hiển thị đúng.

### 2.2 Loading, not found, retry

- [x] Mở detail với mạng chậm và xác nhận có loading state rõ ràng.
- [ ] Mở detail với `templateId` không tồn tại hoặc bị xóa, xác nhận hiện `Template not found`.
- [ ] Tắt mạng khi mở detail, xác nhận error state và `Retry` load lại được sau khi bật mạng.

## 3. Create template

### 3.1 Khởi tạo editor

- [X] Mở `Create Template` và xác nhận editor bắt đầu với `1` day rỗng, không có sample data.
- [x] Xác nhận `Template Name` và `Description` đều rỗng ở lần mở đầu tiên.

### 3.2 Quản lý day cục bộ

- [x] Thêm day mới và xác nhận `dayNumber` tăng liên tục.
- [x] Copy/paste meals giữa các day và xác nhận item được copy đúng mà không làm hỏng day gốc.
- [x] Xóa day ở giữa, xác nhận các `dayNumber` được dồn lại liên tục, không có gap.

### 3.3 Save create flow

- [x] Nhập metadata hợp lệ và save, xác nhận tạo template thành công rồi điều hướng sang detail của template mới.
- [x] Mở lại template vừa tạo và xác nhận dữ liệu vẫn khớp, không phụ thuộc local state trước đó.
- [x] Bấm save nhiều lần thật nhanh và xác nhận không tạo trùng template do double submit.

## 4. Edit template

### 4.1 Mở editor từ dữ liệu thật

- [x] Mở `Edit Template` từ template đã có dữ liệu và xác nhận editor load đúng metadata/day/item từ backend.
- [x] Xác nhận editor không tự bơm sample/fallback meals khi backend trả dữ liệu thật.

### 4.2 Save edit flow

- [x] Đổi `Template Name` hoặc `Description`, save và xác nhận detail cập nhật đúng.
- [x] Xóa một day ở giữa rồi save, xác nhận reload lại detail không còn gap `dayNumber`.
- [x] Thêm day mới, save và xác nhận day mới xuất hiện đúng khi mở lại.

## 5. Add meal flow trong editor

### 5.1 Điều hướng sang meal search/detail

- [x] Từ `BREAKFAST`, nhấn add meal và xác nhận header/context của `MealSearchScreen` thể hiện đúng `Day` và `MealTime` của template.
- [x] Từ `MealSearchScreen` vào `MealDetailScreen`, xác nhận context template vẫn được giữ.

### 5.2 Quay lại editor với item local

- [x] Chọn một meal từ flow template và xác nhận editor nhận item đúng `day`, đúng `mealTime`, đúng nutrition.
- [x] Sau khi item quay về editor, xác nhận macro của day và macro tổng được cập nhật ngay từ local state.
- [x] Quay lại add thêm meal ở meal time khác và xác nhận item không rơi vào sai group.

## 6. Chỉnh sửa item trong editor/detail

### 6.1 Portion size và delete item

- [x] Mở `MenuItemDetailModal` trong editor, đổi `portion size` hợp lệ và xác nhận local macro cập nhật đúng.
- [x] Nhập `portion size` không hợp lệ và xác nhận modal giữ mở, hiển thị lỗi phù hợp.
- [x] Xóa item khỏi day và xác nhận item biến mất khỏi đúng `mealTime group`, day vẫn tồn tại nếu còn rỗng.

### 6.2 Persist item thay đổi

- [x] Sau khi sửa `portion size`, save template rồi mở lại detail/editor, xác nhận thay đổi đã được persist.
- [x] Sau khi xóa item trong editor, save template rồi mở lại detail/editor, xác nhận item không quay lại.

## 7. Apply template

### 7.1 Modal apply

- [x] Mở `Apply to date...` từ detail và từ list card, xác nhận modal reset về ngày hiện tại và `replaceExistingMeals = true`.
- [x] Đổi ngày apply và toggle `replaceExistingMeals`, xác nhận giá trị được giữ đúng trước khi submit.

### 7.2 Apply thành công

- [x] Apply với `replaceExistingMeals = true` và xác nhận có success feedback rõ ràng.
- [x] Apply với `replaceExistingMeals = false` và xác nhận có success feedback rõ ràng.
- [x] Sau khi apply xong, mở `Menu` tại ngày tương ứng và spot-check dữ liệu menu đã được tạo/cập nhật đúng.

### 7.3 Apply lỗi

- [x] Tắt mạng rồi apply template, xác nhận modal vẫn mở và hiển thị lỗi thay vì đóng mất.
- [x] Với template rỗng hoặc invalid business state, xác nhận UI hiển thị lỗi backend phù hợp nếu API từ chối apply.

## 8. Delete template

### 8.1 Delete từ detail

- [x] Xóa template từ `TemplateDetailScreen`, xác nhận điều hướng quay về list và template biến mất khỏi danh sách.

### 8.2 Delete từ list

- [x] Xóa template ngay từ `TemplateListScreen`, xác nhận card biến mất khỏi list mà không cần reload tay.
- [x] Tắt mạng rồi delete template, xác nhận modal vẫn mở và hiển thị lỗi thay vì đóng mất.

## 9. Error và permission cases

- [ ] Thử mở list/detail/create/edit khi token thiếu hoặc hết hạn và xác nhận UI hiển thị lỗi `Missing access token` hoặc lỗi auth phù hợp.
- [ ] Thử mở detail/edit/apply/delete với template không thuộc user hoặc không tồn tại và xác nhận UI xử lý `403/404` hợp lý.
- [ ] Cố tình tạo duplicate item trong cùng day + meal time rồi save, xác nhận UI phản ánh lỗi `409 TEMPLATE_ITEM_CONFLICT` rõ ràng.

## 10. Gợi ý spot-check API khi cần debug

- [ ] Gọi `GET /api/v1/meal-templates` và xác nhận `nutritionTotal` có mặt ở từng item list.
- [ ] Gọi `GET /api/v1/meal-templates/:id` và xác nhận response có `dayNumber`, `nutritionTotal`, `nutritionPerServing` cho item.
- [ ] Gọi `PUT /api/v1/meal-templates/:id/days/:dayNumber` với payload hợp lệ và xác nhận backend trả `201`.
- [ ] Gọi `POST /api/v1/meal-templates/:id/apply` với hai mode `replaceExistingMeals=true/false` và xác nhận response summary hợp lệ.
- [ ] Gọi `DELETE /api/v1/meal-templates/:id` và xác nhận request thành công rồi list không còn template đó.

## Definition of done cho manual QA đợt này

- [x] Không còn màn template nào phụ thuộc sample/seed runtime.
- [x] Flow create, edit, add meal, apply, delete chạy end-to-end với backend thật.
- [x] Các lỗi chính (`401`, `403/404`, network error, duplicate item conflict) đều có feedback rõ ràng trên UI.
- [x] Macro ở list/detail/editor phản ánh dữ liệu thật từ backend hoặc local staged state, không còn sample data.