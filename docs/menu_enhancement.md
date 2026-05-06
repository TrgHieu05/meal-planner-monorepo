# Menu Enhancement Checklist

## Mục tiêu

Tài liệu này tổng hợp các hạng mục cần cải thiện cho tính năng `menu` sau khi khảo sát nhanh phần mobile app, backend API và test hiện có.

Phạm vi checklist gồm 3 nhóm chính:

- tính năng và UX trên mobile app
- API contract và dữ liệu trả về từ backend
- hiệu suất, độ ổn định và khả năng mở rộng của luồng `menu`

Ngày cập nhật: `2026-05-06`

## Snapshot hiện trạng

- [X] Đã có CRUD cơ bản cho `menu`: lấy menu theo ngày, thêm `menu_item`, cập nhật `menu_item`, xóa `menu_item`.
- [X] Backend `menu` đã có unit test và e2e test cơ bản đang pass.
- [X] Mobile đã có `MenuScreen`, flow add meal từ `meal search`, và modal chỉnh sửa item.
- [ ] Chưa hoàn tất phần xem nhanh trạng thái menu theo dải ngày.
- [ ] Chưa tối ưu payload để mobile render menu trực tiếp mà không cần gọi thêm API chi tiết món.
- [ ] Chưa xử lý triệt để các vấn đề stale response, silent validation và refetch chưa tối ưu.

## 1. Checklist tính năng và UX

### 1.1 Hoàn thiện scope tính năng

- [ ] Hoàn thiện FR-05: xem trạng thái menu theo khoảng ngày để biết ngày nào đã có món.
- [ ] Thêm indicator trên `WeekDateStrip` hoặc UI tương đương để phân biệt ngày có menu và ngày rỗng.
- [ ] Nếu vẫn còn trong scope v1, bổ sung khả năng đổi `mealTime` của `menu_item` trong cùng ngày.

### 1.2 Củng cố luồng người dùng

- [ ] Đảm bảo flow `Menu -> Meal Search -> Meal Detail -> Add to Menu` quay lại đúng ngữ cảnh ngày và bữa đang thao tác.
- [ ] Sửa hành vi lưu `portionSize` không hợp lệ: cần hiển thị lỗi rõ ràng và giữ modal mở, không fallback im lặng về giá trị cũ.
- [ ] Hiển thị `nutritionTotal` trên `MenuScreen` hoặc loại khỏi payload/scope nếu chưa dùng trong UI.
- [ ] Tách rõ các trạng thái `empty`, `loading`, `error`, `refreshing` để tránh hiểu nhầm menu rỗng với lỗi tải dữ liệu.
- [ ] Rà soát nút `Templates`: nếu feature template chưa sẵn sàng thì nên ẩn, disable, hoặc gắn nhãn `coming soon`.

### 1.3 Cải thiện trải nghiệm thao tác

- [ ] Cân nhắc optimistic update cho thao tác toggle `eated`, sửa `portionSize`, và xóa item.
- [ ] Giảm việc reset lại toàn bộ màn hình khi user chỉ thay đổi một item nhỏ.
- [ ] Bổ sung feedback thành công ngắn gọn cho các thao tác add, update, delete khi cần.

## 2. Checklist API và contract

### 2.1 Đồng bộ spec và implementation

- [ ] Đồng bộ lại contract `GET/DELETE /menus/day`: tài liệu hiện mô tả query param `?date=YYYY-MM-DD`, implementation đang dùng path param `/:date`.
- [ ] Chốt contract chuẩn cho `GET /api/v1/menus/range` rồi cập nhật đồng bộ ở backend, mobile app, shared types, OpenAPI và docs.
- [ ] Chốt rõ phạm vi update `menu_item`: chỉ `portionSize` và `eated`, hay có thêm `mealTime`.

### 2.2 Giảm ghép nối giữa mobile và meal detail

- [ ] Mở rộng `GET /api/v1/menus/day/:date` để trả đủ dữ liệu render card/menu item mà mobile cần.
- [ ] Nếu chưa thể trả full payload từ endpoint theo ngày, thiết kế endpoint batch meal summary để tránh gọi detail từng item.
- [ ] Chốt bộ field `render-ready` cho menu item, ví dụ: `cookTime`, `difficulty`, macro per serving, thumbnail nếu có.

### 2.3 Tăng độ tin cậy của API

- [ ] Rà soát lại rule duplicate meal để constraint database, error message và docs cùng một ý nghĩa.
- [ ] Xem lại chiến lược idempotent cho luồng virtual day, đặc biệt quanh create/delete item cuối cùng trong ngày.
- [ ] Cân nhắc bổ sung metadata như `updatedAt` hoặc version để client xử lý refresh và cache rõ ràng hơn.
- [ ] Bổ sung OpenAPI example cho case ngày rỗng, ngày có nhiều món, conflict và validation error.

## 3. Checklist hiệu suất và độ ổn định

### 3.1 Mobile performance

- [ ] Loại bỏ mô hình N+1 request hiện tại khi load menu theo ngày.
- [ ] Thêm guard chống stale response khi user đổi ngày liên tục hoặc rời màn hình trong lúc request đang chạy.
- [ ] Tránh refetch toàn bộ menu sau mọi mutation nếu response hiện có đủ dữ liệu để patch local state.
- [ ] Nếu tạm thời vẫn giữ flow gọi chi tiết món, thêm cache theo `mealId` để giảm request lặp lại trong cùng session.

### 3.2 API performance

- [ ] Giữ payload `GET /menus/day` gọn và đúng nhu cầu render thực tế của mobile.
- [ ] Khi triển khai `menus/range`, tối ưu query cho dải ngày nhỏ, ví dụ `<= 31` ngày.
- [ ] Kiểm soát N+1 ở tầng database/service nếu endpoint range cần trả nhiều ngày và nhiều item.
- [ ] Cân nhắc cache read endpoint theo ngày nếu traffic thực tế đủ lớn.

### 3.3 Observability và debug

- [ ] Thêm log và metric cho các luồng `get menu day`, `create/update/delete menu item`, conflict rate và latency p95.
- [ ] Phân biệt rõ lỗi business, validation và network để debug từ mobile dễ hơn.
- [ ] Theo dõi tỷ lệ fail của flow add meal từ search vào menu.

## 4. Checklist test và rollout

- [ ] Bổ sung test cho `MenuScreen` với tình huống đổi ngày nhanh liên tục.
- [ ] Bổ sung test cho hành vi nhập `portionSize` không hợp lệ trong modal chỉnh sửa item.
- [ ] Bổ sung test cho flow add meal với context bị khóa theo `date` và `mealTime`.
- [ ] Bổ sung e2e test cho `GET /api/v1/menus/range` sau khi endpoint này được triển khai.
- [ ] Chuẩn bị manual QA checklist ngắn cho các case add, update, delete, toggle logged, quick date switching và lỗi mạng.

## 5. Đề xuất thứ tự ưu tiên

- [ ] P0: đồng bộ contract docs/API, sửa N+1 data loading, chống stale response, sửa validation `portionSize`.
- [ ] P1: triển khai `menus/range`, hiển thị indicator trạng thái ngày, siết lại flow add meal theo đúng context.
- [ ] P2: optimistic update, caching, observability và polish các entry point phụ như `Templates`.
