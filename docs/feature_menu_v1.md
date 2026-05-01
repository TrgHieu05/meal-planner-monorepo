# Đặc tả tính năng: Menu (Tạo thực đơn theo ngày) v1

## 1) Thông tin tài liệu

- Tên tính năng: Menu (Daily Menu Planning)
- Mục tiêu: Cho phép người dùng tạo và quản lý thực đơn theo ngày thông qua `menu_items` theo từng bữa
- Phạm vi nền tảng: Mobile App (Expo React Native) + Backend API (NestJS)
- Trạng thái: Official_v1
- Ngày cập nhật: 2026-03-24

## 2) Bối cảnh hiện tại

- CSDL đã có bảng `menus`, `menu_items`, `meals` và enum `MealTime` gồm `BREAKFAST | LUNCH | DINNER`
- `menu_items` là bảng trung gian lưu món (`mealId`) và bữa ăn (`mealTime`) của một ngày cụ thể thông qua `menuId`
- Trên UI, mỗi ngày luôn hiển thị trạng thái thực đơn; có ngày không có món nào
- Theo nghiệp vụ cần chốt cho v1: một ngày chỉ được xem là “có menu thực” khi tồn tại ít nhất một `menu_item`
- Module API `menu` chưa được triển khai trong backend hiện tại

### Quyết định đã chốt

- Chọn mô hình “virtual day” làm chuẩn cho v1: ngày không có bản ghi `menus` vẫn hiển thị trên UI ở trạng thái rỗng

## 3) Mục tiêu nghiệp vụ

- Người dùng có thể thêm món vào thực đơn cho từng ngày và từng bữa
- Người dùng có thể xem nhanh thực đơn ngày theo nhóm `BREAKFAST/LUNCH/DINNER`
- Người dùng có thể cập nhật hoặc xóa món trong thực đơn mà không phá vỡ trải nghiệm “lịch ngày luôn hiện”
- Hệ thống quản lý được tổng dinh dưỡng theo ngày phục vụ các tính năng theo dõi sau này

### Quyết định đã chốt

- V1 chỉ hỗ trợ `manual add`; generate tự động được đưa vào phase sau khi tích hợp AI

## 4) Phạm vi v1

### Trong phạm vi

- Tạo/cập nhật thực đơn theo ngày dựa trên thao tác với `menu_items`
- Quản lý món theo từng bữa: `BREAKFAST`, `LUNCH`, `DINNER`
- Lấy dữ liệu thực đơn theo ngày và theo khoảng ngày
- Cho phép xóa item; nếu xóa item cuối cùng thì xử lý trạng thái menu rỗng theo quy tắc v1
- Chuẩn hóa response để mobile render trực tiếp theo cấu trúc ngày -> bữa -> danh sách món

### Ngoài phạm vi

- AI gợi ý thực đơn tự động
- Lập lịch lặp lại theo tuần/tháng
- Chia sẻ thực đơn giữa người dùng
- Tối ưu hóa meal prep nhiều ngày
- Soft delete hoặc audit log nâng cao cho `menu_items`

## 5) Đối tượng sử dụng

- Client nội bộ (mobile) gọi API protected bằng JWT Bearer token
- Người dùng đã đăng nhập và có quyền quản lý thực đơn cá nhân

## 6) User stories

- Là người dùng, tôi muốn thêm món vào buổi sáng/trưa/tối của một ngày cụ thể
- Là người dùng, tôi muốn xem toàn bộ món theo từng bữa trong ngày đã chọn
- Là người dùng, tôi muốn chỉnh `portionSize` hoặc đánh dấu món đã ăn
- Là người dùng, tôi muốn xóa món khỏi thực đơn và ngày đó trở về trạng thái trống nếu không còn món nào
- Là người dùng, tôi muốn xem nhanh một dải ngày để biết ngày nào đã có món

## 7) Yêu cầu chức năng

### FR-01: Xem thực đơn theo ngày

- API trả về đầy đủ cấu trúc theo ngày, gồm 3 nhóm bữa cố định: `BREAKFAST`, `LUNCH`, `DINNER`
- Nếu ngày chưa có `menu_item`, API vẫn trả dữ liệu ngày với danh sách rỗng cho từng bữa
- Nếu đã có `menu_item`, API trả thêm thông tin tổng dinh dưỡng ngày

### FR-02: Thêm món vào một bữa trong ngày

- Client gửi `date`, `mealId`, `mealTime`, `portionSize`
- Hệ thống tự tạo `menus` nếu ngày đó chưa có bản ghi
- Hệ thống tạo mới `menu_item` và cập nhật tổng dinh dưỡng

### FR-03: Cập nhật menu item

- Cho phép cập nhật `portionSize` và `eated`
- Không cho phép đổi `menuId` trực tiếp
- Có thể hỗ trợ đổi `mealTime` trong cùng ngày ở v1

### FR-04: Xóa menu item

- Xóa item theo `id`
- Sau khi xóa, nếu menu không còn item nào thì xem như ngày trống
- Cách xử lý bản ghi `menus` rỗng được chốt theo quy tắc dữ liệu mục 10

### FR-05: Xem thực đơn theo khoảng ngày

- API nhận `fromDate`, `toDate`
- Trả danh sách ngày trong khoảng và trạng thái từng ngày
- Bao gồm cả ngày không có món để UI render lịch đồng nhất

## 8) Yêu cầu phi chức năng

- Prefix API dùng global prefix `/api`
- Version hiện tại là `v1`
- Auth bắt buộc bằng JWT Bearer token
- Dùng zod schema để validate request/response
- Đảm bảo idempotent ở thao tác đọc; thao tác ghi cần tính nhất quán tổng dinh dưỡng
- Thời gian phản hồi mục tiêu:
  - GET theo ngày: p95 < 300ms
  - GET theo khoảng ngày (<= 31 ngày): p95 < 500ms

### Ghi chú triển khai v1.1

- Bổ sung cache read endpoint theo ngày ở API gateway/CDN, giới hạn cache tối đa 21 menu

## 9) API contract đề xuất v1

### 9.1 Danh sách endpoint

- Menu Day
  - `GET /api/v1/menus/day?date=YYYY-MM-DD`
  - `GET /api/v1/menus/range?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD`
  - `DELETE /api/v1/menus/day?date=YYYY-MM-DD`
- Menu Item
  - `POST /api/v1/menu-items`
  - `PATCH /api/v1/menu-items/:id`
  - `DELETE /api/v1/menu-items/:id`

### 9.1.1 Lý do chọn `menu-items` là resource độc lập

- Tức là không thiết kế API theo dạng phụ thuộc `menu/:id/menu-items/:id`
- Hỗ trợ luồng search -> chọn món -> thêm theo `date` + `mealTime` ngay cả khi ngày đó chưa có bản ghi `menus`
- Tránh phụ thuộc `menuId` từ client, backend tự resolve/tạo `menu` theo ngày
- Giữ API đơn giản, nhất quán với mô hình virtual day

### 9.2 Header định danh user

- Header bắt buộc: `Authorization: Bearer <token>`
- `userId` được resolve từ `sub` trong JWT

### 9.3 Request/response mẫu

- `GET /api/v1/menus/day?date=2026-03-24`
  - Response `200`:

```json
{
  "date": "2026-03-24",
  "hasMenu": true,
  "nutritionTotal": {
    "calories": 1450,
    "protein": 92,
    "fat": 45,
    "fiber": 26
  },
  "meals": {
    "BREAKFAST": [
      {
        "menuItemId": 101,
        "mealId": 12,
        "mealName": "Overnight Oats",
        "portionSize": 1,
        "eated": false
      }
    ],
    "LUNCH": [],
    "DINNER": []
  }
}
```

- `POST /api/v1/menu-items`
  - Request:

```json
{
  "date": "2026-03-24",
  "mealId": 12,
  "mealTime": "BREAKFAST",
  "portionSize": 1
}
```

  - Response `201`:

```json
{
  "id": 101,
  "menuId": 55,
  "mealId": 12,
  "mealTime": "BREAKFAST",
  "portionSize": 1,
  "eated": false
}
```

- `PATCH /api/v1/menu-items/101`
  - Request:

```json
{
  "portionSize": 1.5,
  "eated": true
}
```

- `DELETE /api/v1/menu-items/101`
  - Response `204`: không body

### 9.4 Status code dự kiến

- `200`: đọc dữ liệu thành công
- `201`: tạo menu item thành công
- `204`: xóa menu item thành công
- `401`: token không hợp lệ/thiếu token
- `404`: không tìm thấy `meal`, `menu_item` hoặc user
- `409`: conflict nghiệp vụ khi thêm món trùng trong cùng ngày + cùng bữa
- `422`: payload/query không hợp lệ
- `500`: lỗi hệ thống

### Quyết định đã chốt

- Có endpoint `DELETE /api/v1/menus/day?date=...` để xóa toàn bộ item trong ngày

## 10) Quy tắc dữ liệu & validation

- Bám theo schema Prisma hiện tại:
  - `Menu`: `id`, `userId`, `date`, `note?`, `totalCalories`, `totalProtein`, `totalFat`, `totalFiber`
  - `MenuItem`: `id`, `menuId`, `mealId`, `mealTime`, `eated`, `portionSize`
- `mealTime` chỉ nhận `BREAKFAST | LUNCH | DINNER`
- `portionSize` là số dương
- Công thức calories theo từng item:
  - `itemCalories = meal.totalCalories * menuItem.portionSize`
- Công thức tổng calories theo ngày:
  - `menu.totalCalories = Σ(itemCalories)` của toàn bộ `menu_items` trong ngày
- Công thức protein theo từng item:
  - `itemProtein = meal.totalProtein * menuItem.portionSize`
- Công thức tổng protein theo ngày:
  - `menu.totalProtein = Σ(itemProtein)` của toàn bộ `menu_items` trong ngày
- Công thức fat theo từng item:
  - `itemFat = meal.totalFat * menuItem.portionSize`
- Công thức tổng fat theo ngày:
  - `menu.totalFat = Σ(itemFat)` của toàn bộ `menu_items` trong ngày
- Công thức fiber theo từng item:
  - `itemFiber = meal.totalFiber * menuItem.portionSize`
- Công thức tổng fiber theo ngày:
  - `menu.totalFiber = Σ(itemFiber)` của toàn bộ `menu_items` trong ngày
- `eated` mặc định `false` khi tạo item mới
- `date` nhận chuẩn `YYYY-MM-DD`, xử lý theo timezone chuẩn hệ thống
- Quy tắc tồn tại menu v1:
  - “Menu có nghĩa nghiệp vụ” khi có ít nhất 1 `menu_item`
  - Ngày không có item (tức là không có bản ghi menu) vẫn trả dữ liệu ngày rỗng ở API đọc

### Quyết định đã chốt

- Khi xóa item cuối cùng trong ngày, backend xóa luôn bản ghi `menus` của ngày đó

## 11) Trải nghiệm người dùng (UX flow)

- Mở màn hình lập thực đơn tuần:
  - Gọi `GET /menus/range` để render tất cả ngày trong dải
- Chọn ngày:
  - Gọi `GET /menus/day` hoặc dùng dữ liệu range đã có
- Thêm món vào bữa:
  - Gọi `POST /menu-items`, cập nhật UI theo response
- Chỉnh phần ăn/đánh dấu đã ăn:
  - Gọi `PATCH /menu-items/:id`
- Xóa món:
  - Gọi `DELETE /menu-items/:id`, nếu ngày trống thì UI vẫn giữ ngày và hiển thị empty-state

## 12) State machine (theo ngày)

- `EMPTY_DAY`: ngày chưa có item nào
- `HAS_ITEMS`: ngày có >= 1 item
- `MUTATING`: đang thêm/sửa/xóa item
- `ERROR`: thao tác thất bại, giữ snapshot trước khi mutate

Chuyển trạng thái:
- `EMPTY_DAY` -> `MUTATING` -> `HAS_ITEMS` khi thêm item thành công
- `HAS_ITEMS` -> `MUTATING` -> `EMPTY_DAY` khi xóa item cuối cùng
- `MUTATING` -> `ERROR` khi API lỗi; cho phép retry

## 13) Quy tắc conflict dữ liệu

- Áp dụng unique nghiệp vụ `(menuId, mealTime, mealId)` ngay trong v1
- Nếu thêm trùng món trong cùng ngày + cùng bữa thì trả `409 MENU_CONFLICT`
- Người dùng cần cập nhật `portionSize` qua `PATCH /menu-items/:id` thay vì thêm bản ghi mới

## 14) Quy tắc Edit và Save thủ công theo nhóm

- Mỗi thao tác với item gọi API độc lập, không cần commit cả ngày
- UI cần optimistic update có rollback khi request thất bại
- Save theo hành động người dùng:
  - Add item -> gọi POST ngay
  - Edit item -> gọi PATCH ngay
  - Delete item -> gọi DELETE ngay

## 15) Đặc tả status code và error chi tiết

### 15.1 `GET /api/v1/menus/day`

- `200`: trả cấu trúc ngày, kể cả rỗng
- `401`: token không hợp lệ hoặc đã hết hạn
- `422`: `date` không đúng định dạng hoặc không hợp lệ theo lịch
- `500`: lỗi nội bộ khi mapping dữ liệu ngày

### 15.2 `GET /api/v1/menus/range`

- `200`: trả danh sách ngày trong khoảng
- `401`: token không hợp lệ hoặc đã hết hạn
- `422`: `fromDate`, `toDate` không hợp lệ hoặc khoảng ngày vượt giới hạn
- `500`: lỗi nội bộ khi tổng hợp dữ liệu range

### 15.3 `POST /api/v1/menu-items`

- `201`: tạo item thành công
- `401`: token không hợp lệ hoặc đã hết hạn
- `404`: `Meal not found.` hoặc `User not found.`
- `409`: conflict nghiệp vụ khi thêm món trùng trong cùng ngày + cùng bữa
- `422`: payload không hợp lệ
- `500`: lỗi nội bộ khi tạo item/cập nhật totals

### 15.4 `PATCH /api/v1/menu-items/:id`

- `200`: cập nhật item thành công
- `401`: token không hợp lệ hoặc đã hết hạn
- `404`: `Menu item not found.`
- `409`: conflict nghiệp vụ khi cập nhật thành món trùng trong cùng ngày + cùng bữa
- `422`: payload không hợp lệ
- `500`: lỗi nội bộ khi cập nhật item/totals

### 15.5 `DELETE /api/v1/menu-items/:id`

- `204`: xóa item thành công
- `401`: token không hợp lệ hoặc đã hết hạn
- `404`: `Menu item not found.`
- `500`: lỗi nội bộ khi xóa item/totals

### 15.6 `DELETE /api/v1/menus/day`

- `204`: xóa toàn bộ item của ngày thành công
- `401`: token không hợp lệ hoặc đã hết hạn
- `422`: `date` không đúng định dạng hoặc không hợp lệ theo lịch
- `500`: lỗi nội bộ khi xóa item theo ngày/cập nhật totals

### 15.7 Chuẩn hóa format lỗi đề xuất

```json
{
  "code": "MENU_VALIDATION_ERROR",
  "message": "Request payload is invalid.",
  "details": {
    "fieldErrors": {
      "portionSize": ["Must be a positive number"]
    }
  }
}
```

Danh sách `code` đề xuất:
- `MENU_UNAUTHORIZED`
- `MENU_NOT_FOUND`
- `MENU_VALIDATION_ERROR`
- `MENU_CONFLICT`
- `MENU_INTERNAL_ERROR`

## 16) Acceptance criteria

- Có thể thêm món vào một ngày và một bữa cụ thể bằng `POST /menu-items`
- Có thể cập nhật `portionSize` và `eated` bằng `PATCH /menu-items/:id`
- Có thể xóa item bằng `DELETE /menu-items/:id`
- Có thể xóa toàn bộ item theo ngày bằng `DELETE /menus/day?date=...`
- Có thể đọc dữ liệu theo ngày/range và luôn nhận đủ cấu trúc 3 bữa
- Khi ngày không có item, API vẫn trả ngày ở trạng thái rỗng

## 17) Dependencies kỹ thuật

- Prisma schema đã có `menus`, `menu_items`, `meals`, enum `MealTime`
- Cần bổ sung shared zod schemas cho Menu/MenuItem ở `@meal/shared/types`
- Cần module backend mới: `menu` và/hoặc `menu-item`
- Cần JWT guard và user resolver từ `sub` token

## 18) Definition of Done

- Backend
  - Có endpoint đọc ngày/range và CRUD item theo contract v1
  - Validate request/response bằng zod schema
  - Tính và đồng bộ `totalCalories/totalProtein/totalFat/totalFiber` chính xác
  - Xử lý đúng trạng thái ngày trống theo quy tắc v1
- Mobile
  - Render lịch ngày với empty-state đúng
  - Cập nhật UI đúng khi add/edit/delete item
- Chất lượng
  - Có unit test và integration test cho luồng chính + lỗi trọng yếu

## 19) Test plan

- Unit test backend
  - Validate schema create/update menu item
  - Tính lại tổng dinh dưỡng khi add/edit/delete item
  - Mapping response day/range đúng cấu trúc
- Integration test backend
  - `GET /menus/day` trả `200` với ngày rỗng
  - `POST /menu-items` payload hợp lệ trả `201`
  - `PATCH /menu-items/:id` payload sai trả `422`
  - `DELETE /menu-items/:id` id không tồn tại trả `404`
  - `DELETE /menus/day` với date hợp lệ trả `204`
  - `GET /menus/range` thiếu token trả `401`
- Contract test
  - Khóa shape response cho endpoint day/range
  - Khóa enum `mealTime` chỉ gồm `BREAKFAST/LUNCH/DINNER`

## 20) Quyết định đã chốt v1

- Chọn mô hình menu theo ngày với `menu_items` làm thực thể thao tác chính
- Một ngày được xem là có menu khi có ít nhất một `menu_item`
- API đọc vẫn phải trả đủ cấu trúc ngày kể cả khi không có món
- Giữ enum bữa ăn theo schema hiện tại: `BREAKFAST | LUNCH | DINNER`
- Áp dụng unique nghiệp vụ `(menuId, mealTime, mealId)` để tránh thêm trùng món cùng bữa
- Có endpoint xóa toàn bộ item theo ngày: `DELETE /api/v1/menus/day?date=...`
- Khi xóa item cuối cùng, backend xóa luôn bản ghi `menus` của ngày đó
