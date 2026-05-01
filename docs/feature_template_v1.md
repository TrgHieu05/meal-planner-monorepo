# Đặc tả tính năng: Meal Template (Mẫu thực đơn) v1

## 1) Thông tin tài liệu

- Tên tính năng: Meal Template (Template Planning)
- Mục tiêu: Cho phép người dùng tạo, quản lý các mẫu thực đơn (meal templates) kéo dài nhiều ngày.
- Phạm vi nền tảng: Mobile App (Expo React Native) + Backend API (NestJS)
- Trạng thái: Implemented\_v1 (Backend)
- Ngày cập nhật: 2026-05-01

## 2) Bối cảnh hiện tại

- CSDL đã có bảng `meal_templates`, `meal_template_days`, `meal_template_day_items`.
- Các bảng này tương đồng với cấu trúc `menus` nhưng không gắn với một ngày lịch cụ thể (`date`) mà gắn với số thứ tự ngày (`day_number`).
- Người dùng có thể có nhiều template (ví dụ: "Thực đơn giảm cân 7 ngày", "Thực đơn Eat Clean 3 ngày").
- Đã có constraint `UNIQUE(template_id, day_number)` ở cấp DB để đảm bảo một template không có 2 ngày trùng số thứ tự.
- Backend đã triển khai module `meal-template` (NestJS) và expose API theo prefix `/api/v1/meal-templates`.
- Dự án dùng guard JWT dạng “opt-in”: chỉ các endpoint có decorator `@RequireAuth()` mới bắt buộc token.
- Dự án dùng Zod schemas ở `@meal/shared` để validate payload. Swagger/OpenAPI được generate ra file `services/main-backend/docs/openapi.json`.

## 3) Mục tiêu nghiệp vụ

- Người dùng có thể tạo một template mới (đặt tên, mô tả).
- Người dùng có thể thêm/sửa/xóa các ngày (`day_number`) trong một template.
- Người dùng có thể thêm món ăn vào các bữa (`BREAKFAST`, `LUNCH`, `DINNER`) của từng ngày trong template.
- Người dùng có thể xem lại chi tiết một template.
- (Tương lai/Phase 2) Người dùng có thể "áp dụng" (apply) một template vào lịch thực đơn thực tế (`menus`).

## 4) Phạm vi v1

### Trong phạm vi

- Quản lý Template (CRUD thông tin chung: tên, mô tả).
- Quản lý Template Day (thêm/sửa/xóa ngày theo số thứ tự `day_number` bằng cơ chế Bulk Upsert để tối ưu request).
- Quản lý Template Day Item (thêm món vào bữa của một ngày trong template, sửa `portion_size`, xóa món).
- Trả về cấu trúc chi tiết của một template (tương tự như cách trả về menu range).

### Ngoài phạm vi

- Áp dụng (Apply) template vào `menus` thực tế (đẩy sang Phase 2 để tập trung làm vững cấu trúc CRUD).
- Share template cho người dùng khác.
- AI tự động generate template.
- Tính toán tổng calories/macro cho template (ở v1 chưa bắt buộc tính tổng như menu, chỉ tập trung lưu trữ cấu trúc món).
- Quản lý ảnh template (field `template_image_key`) chưa được expose trong API v1 hiện tại.

## 5) Đối tượng sử dụng

- Client nội bộ (mobile) gọi API protected bằng JWT Bearer token.
- Người dùng đã đăng nhập và có quyền quản lý template cá nhân.

## 6) User stories

- Là người dùng, tôi muốn tạo một mẫu thực đơn trống (nhập tên, mô tả).
- Là người dùng, tôi muốn xem danh sách các mẫu thực đơn tôi đã tạo.
- Là người dùng, tôi muốn thêm ngày thứ 1, thứ 2, thứ 3... vào mẫu thực đơn.
- Là người dùng, tôi muốn thêm món ăn vào bữa sáng/trưa/tối của ngày thứ N trong mẫu.
- Là người dùng, tôi muốn thay đổi khẩu phần (portion size) hoặc xóa món ăn khỏi ngày trong mẫu.
- Là người dùng, tôi muốn xóa toàn bộ một mẫu thực đơn.

## 7) Yêu cầu chức năng

### FR-01: Quản lý thông tin chung Template

- API tạo mới template: nhận `name`, `description`.
- API cập nhật template: `PATCH` nhận `name`, `description`.
- API danh sách template của user hiện tại.
- API xóa template (cascade xóa days và items).

### FR-02: Xem chi tiết Template

- API trả về thông tin template kèm theo danh sách các ngày (`day_number`), mỗi ngày chia ra 3 bữa cố định: `BREAKFAST`, `LUNCH`, `DINNER` và danh sách món ăn bên trong.

### FR-03: Thêm/Sửa món vào Template (Bulk Upsert & Single Item)

- Client gửi cấu trúc toàn bộ 1 ngày thông qua `PUT /api/v1/meal-templates/:id/days/:dayNumber`.
  - Giúp ghi đè/tạo mới nhanh chóng (giảm bớt N request riêng lẻ).
- Client vẫn có thể thêm/sửa 1 item độc lập qua `POST` hoặc `PATCH` `.../items/:itemId` nếu chỉ muốn tương tác nhỏ.
- Hệ thống tự tạo `meal_template_days` nếu ngày `dayNumber` đó chưa tồn tại trong template.
- Tạo mới `meal_template_day_items`.

### FR-04: Cập nhật và Xóa Template Item

- Cập nhật `portionSize` của một item. Sau khi cập nhật, API trả về `200 OK` kèm body của item mới.
- Xóa item. Nếu xóa item cuối cùng của một ngày, có thể tùy chọn giữ lại ngày trống hoặc xóa luôn ngày đó (chốt: **giữ lại ngày** để user vẫn thấy sườn `day_number` trừ khi họ chủ động xóa ngày).

### FR-05: Xóa Template Day

- API xóa nguyên một ngày (`dayNumber`) khỏi template, kéo theo xóa toàn bộ items của ngày đó.

## 8) Yêu cầu phi chức năng

- Prefix API dùng global prefix `/api`.
- Version hiện tại là `v1`.
- Auth bắt buộc bằng JWT Bearer token.
- Dùng zod schema để validate request/response ở `@meal/shared`.
- Swagger/OpenAPI cần phản ánh đúng request body và status code theo implement để test bằng Swagger thuận tiện.

## 9) API contract v1 (theo backend hiện tại)

### 9.1 Danh sách endpoint

- **Template Core**
  - `GET /api/v1/meal-templates` (Danh sách)
  - `POST /api/v1/meal-templates` (Tạo mới)
  - `GET /api/v1/meal-templates/:id` (Xem chi tiết full cấu trúc)
  - `PATCH /api/v1/meal-templates/:id` (Cập nhật tên/mô tả)
  - `DELETE /api/v1/meal-templates/:id` (Xóa)

- **Template Day & Items**
  - `PUT /api/v1/meal-templates/:id/days/:dayNumber` (Upsert toàn bộ các bữa của 1 ngày)
  - `POST /api/v1/meal-templates/:id/items` (Thêm 1 món vào một ngày của template)
  - `PATCH /api/v1/meal-templates/:id/items/:itemId` (Sửa portion size của 1 món)
  - `DELETE /api/v1/meal-templates/:id/items/:itemId` (Xóa món)
  - `DELETE /api/v1/meal-templates/:id/days/:dayNumber` (Xóa cả ngày)

### 9.2 Status codes (tham chiếu nhanh)

- `GET /api/v1/meal-templates`: `200`, `401`, `500`
- `POST /api/v1/meal-templates`: `201`, `400`, `401`, `500`
- `GET /api/v1/meal-templates/:id`: `200`, `400`, `401`, `403`, `404`, `500`
- `PATCH /api/v1/meal-templates/:id`: `200`, `400`, `401`, `403`, `404`, `500`
- `DELETE /api/v1/meal-templates/:id`: `204`, `400`, `401`, `403`, `404`, `500`
- `PUT /api/v1/meal-templates/:id/days/:dayNumber`: `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`
- `POST /api/v1/meal-templates/:id/items`: `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`
- `PATCH /api/v1/meal-templates/:id/items/:itemId`: `200`, `400`, `401`, `403`, `404`, `422`, `500`
- `DELETE /api/v1/meal-templates/:id/items/:itemId`: `204`, `400`, `401`, `403`, `404`, `500`
- `DELETE /api/v1/meal-templates/:id/days/:dayNumber`: `204`, `400`, `401`, `403`, `404`, `422`, `500`

### 9.2 Request/response mẫu

- `GET /api/v1/meal-templates/:id`
  - Response `200`:

```json
{
  "id": "uuid-1234",
  "name": "Thực đơn giảm cân 3 ngày",
  "description": "Ăn ít tinh bột",
  "days": [
    {
      "dayNumber": 1,
      "meals": {
        "BREAKFAST": [
          {
            "itemId": "uuid-item-1",
            "mealId": 12,
            "mealName": "Oatmeal",
            "portionSize": 1
          }
        ],
        "LUNCH": [],
        "DINNER": []
      }
    }
  ]
}
```

- `POST /api/v1/meal-templates/:id/items`
  - Request:

```json
{
  "dayNumber": 1,
  "mealId": 12,
  "mealTime": "BREAKFAST",
  "portionSize": 1
}
```

## 10) Quy tắc dữ liệu & validation

- `templateId` phải thuộc về `userId` đang request.
- `dayNumber` là số nguyên dương (>0).
- `mealTime` chỉ nhận `BREAKFAST | LUNCH | DINNER`.
- Áp dụng constraint DB `UNIQUE(template_id, day_number)` để đảm bảo tính nhất quán của ngày.
- Unique nghiệp vụ: Không cho phép thêm trùng `mealId` vào cùng `mealTime` của cùng `dayNumber` trong 1 template. Trả `409 Conflict`.

## 11) Quy tắc conflict dữ liệu

- Nếu user cố thêm món đã tồn tại trong cùng bữa của cùng ngày, báo lỗi `TEMPLATE_ITEM_CONFLICT`. Client cần dùng PATCH để đổi `portionSize`.

## 12) Definition of Done

- Backend
  - Đầy đủ API CRUD cho Template và Template Items.
  - Zod schemas được định nghĩa tại `@meal/shared`.
  - Swagger/OpenAPI mô tả đúng request body và status code để test trên Swagger.
  - Pass e2e test liên quan (đặc biệt module meal-template và các API phụ thuộc auth).
- CSDL
  - Đã có constraint `UNIQUE(template_id, day_number)` (Đã thực hiện).

## 13) Error format

- 200 OK: Lấy dữ liệu template thành công (list hoặc detail), cập nhật (PATCH) item thành công và trả body mới.
- 201 Created: 
  - Tạo template thành công
  - Thêm item vào template thành công
  - Ghi đè/upsert (PUT) 1 ngày thành công

- 204 No Content: 
  - Xóa template thành công
  - Xóa template day thành công
  - Xóa template item thành công
  - Cập nhật (PATCH) metadata template thành công (có thể trả body hoặc không tùy quyết định)

- 400 Bad Request: Request sai format cơ bản (thiếu field, sai kiểu dữ liệu thô)

- 401 Unauthorized: Thiếu token hoặc token không hợp lệ

- 403 Forbidden: Không có quyền truy cập template (template không thuộc user)

- 404 Not Found: Không tìm thấy resource:
  - template
  - template item
  - template day
  - meal (mealId không tồn tại)

- 409 Conflict: Conflict nghiệp vụ:
  - Thêm trùng mealId trong cùng mealTime + dayNumber của một template

- 422 Unprocessable Entity: Payload hợp lệ về format nhưng sai về business rule:
  - dayNumber <= 0
  - mealTime không thuộc enum
  - portionSize không hợp lệ

- 500 Internal Server Error: Lỗi hệ thống không xác định
