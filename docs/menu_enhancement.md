# Menu Enhancement Checklist

## Mục tiêu

Tài liệu này tổng hợp các hạng mục cần cải thiện cho tính năng `menu` sau khi khảo sát nhanh phần mobile app, backend API và test hiện có.

Phạm vi checklist gồm 3 nhóm chính:

- tính năng và UX trên mobile app
- API contract và dữ liệu trả về từ backend
- hiệu suất, độ ổn định và khả năng mở rộng của luồng `menu`

Ngày cập nhật: `2026-05-06`

## Quy ước đánh dấu

- `**Đã làm rõ**`: mục đã có quyết định từ bạn, không cần hỏi thêm.
- `**Cần bạn làm rõ**`: mục cần chốt thêm từ bạn trước khi triển khai hoặc khóa spec.

## Snapshot hiện trạng

- [X] Đã có CRUD cơ bản cho `menu`: lấy menu theo ngày, thêm `menu_item`, cập nhật `menu_item`, xóa `menu_item`.
- [X] Backend `menu` đã có unit test và e2e test cơ bản đang pass.
- [X] Mobile đã có `MenuScreen`, flow add meal từ `meal search`, và modal chỉnh sửa item.
- [X] Đã chốt loại bỏ endpoint `GET` theo range khỏi scope hiện tại của `menu`.
- [ ] Chưa tối ưu payload để mobile render menu trực tiếp mà không cần gọi thêm API chi tiết món.
- [ ] Chưa xử lý triệt để các vấn đề stale response, silent validation và refetch chưa tối ưu.

## 1. Checklist tính năng và UX

### 1.1 Hoàn thiện scope tính năng

- [X] Chốt lại rõ trong docs và product scope rằng `menu` hiện chỉ hỗ trợ đọc theo ngày, không có endpoint theo range. **Đã làm rõ:** sẽ không có `GET` theo range.
- [ ] Rà lại `WeekDateStrip` và các entry point liên quan để không còn giả định rằng app biết trạng thái nhiều ngày cùng lúc.
- [X] Chốt scope update của `menu_item` trong v1: không cho phép đổi `mealTime`, chỉ update `portionSize` và `eated`. **Đã làm rõ.**

### 1.2 Củng cố luồng người dùng

- [ ] Đảm bảo flow `Menu -> Meal Search -> Meal Detail -> Add to Menu` quay lại đúng ngữ cảnh ngày và bữa đang thao tác.
- [ ] Sửa hành vi lưu `portionSize` không hợp lệ: cần hiển thị lỗi rõ ràng và giữ modal mở, không fallback im lặng về giá trị cũ.
- [X] Chốt giữ `nutritionTotal` trong payload và hiển thị trên `MenuScreen`. **Đã làm rõ.**
- [ ] Triển khai hiển thị `nutritionTotal` trên `MenuScreen` theo layout phù hợp.
- [ ] Tách rõ các trạng thái `empty`, `loading`, `error`, `refreshing` để tránh hiểu nhầm menu rỗng với lỗi tải dữ liệu.
- [X] Chốt giữ nguyên nút `Templates` như hiện tại vì hiện chỉ đóng vai trò điều hướng. **Đã làm rõ.**

### 1.3 Cải thiện trải nghiệm thao tác

- [X] Chốt không áp dụng optimistic update trong scope hiện tại để tránh kéo dài thời gian hoàn thiện app. **Đã làm rõ.**
- [ ] Giữ hướng update an toàn: chờ API thành công rồi mới cập nhật state hoặc refetch slice cần thiết.
- [ ] Giảm việc reset lại toàn bộ màn hình khi user chỉ thay đổi một item nhỏ.
- [ ] Bổ sung feedback thành công ngắn gọn cho các thao tác add, update, delete khi cần.

## 2. Checklist API và contract

### 2.1 Đồng bộ spec và implementation

- [X] Chốt contract `GET/DELETE /menus/day` theo implementation hiện tại dùng path param `/:date`. **Đã làm rõ.**
- [ ] Đồng bộ toàn bộ docs/OpenAPI/examples theo contract `/:date`.
- [ ] Gỡ mọi tham chiếu cũ tới `GET /api/v1/menus/range` khỏi docs, OpenAPI, shared types, test plan và backlog.
- [X] Chốt `PATCH /menu-items/:id` trong v1 chỉ cho phép update `portionSize` và `eated`, không cho phép đổi `mealTime`. **Đã làm rõ.**

### 2.2 Giảm ghép nối giữa mobile và meal detail

- [X] Chốt bộ field tối thiểu cần có để render menu item trên danh sách: tên món ăn, `portionSize`, và các chỉ số dinh dưỡng. `cookTime` và `difficulty` không bắt buộc ở payload danh sách vì chỉ dùng trong modal detail. **Đã làm rõ.**
- [X] Chốt hướng loại bỏ N+1 ở màn hình menu: mở rộng `GET /api/v1/menus/day/:date` để trả trực tiếp dữ liệu render danh sách, không dùng endpoint batch meal summary trong scope hiện tại. **Đã làm rõ.**

### 2.2.1 Cách triển khai loại bỏ N+1

- [X] Backend: mở rộng payload `GET /api/v1/menus/day/:date` để mỗi `menu_item` trả thêm `nutritionPerServing` từ bảng `meal`, gồm `calories`, `protein`, `fiber`, `fat`.
- [X] Backend: giữ `mealName`, `mealId`, `menuItemId`, `portionSize`, `eated` như hiện tại; không bắt buộc thêm `cookTime` và `difficulty` vào payload danh sách.
- [X] Shared types: cập nhật schema response của `menu day` để phản ánh các field render trực tiếp trên card/menu item.
- [ ] Mobile app: refactor `fetchMenuScreenData` để map trực tiếp từ `fetchMenuDay`, xóa `loadMenuMealDetails` và bỏ `Promise.all(fetchMealDetail(...))` trong luồng load màn hình menu.
- [ ] Mobile app: điều chỉnh `MenuMealItem` và mapper để nhận `nutritionPerServing` trực tiếp từ payload `menu day`.
- [ ] Mobile app: nếu modal vẫn cần `cookTime` và `difficulty`, chỉ fetch thêm meal detail khi user mở `MenuItemDetailModal` cho item đang chọn, thay vì load cho toàn bộ item từ đầu.
- [ ] Test: bổ sung test backend cho shape mới của `GET /menus/day/:date` và test mobile để đảm bảo load menu theo ngày không còn gọi detail API cho từng món.

### 2.3 Tăng độ tin cậy của API

- [ ] Rà soát lại rule duplicate meal để constraint database, error message và docs cùng một ý nghĩa.
- [ ] Xem lại chiến lược idempotent cho luồng virtual day, đặc biệt quanh create/delete item cuối cùng trong ngày.
- [ ] Cân nhắc bổ sung metadata như `updatedAt` hoặc version để client xử lý refresh và cache rõ ràng hơn.
- [ ] Bổ sung OpenAPI example cho case ngày rỗng, ngày có nhiều món, conflict và validation error.

## 3. Checklist hiệu suất và độ ổn định

### 3.1 Mobile performance

- [X] Chốt triển khai loại bỏ mô hình N+1 request hiện tại khi load menu theo ngày. **Đã làm rõ.**
- [ ] Thêm guard chống stale response khi user đổi ngày liên tục hoặc rời màn hình trong lúc request đang chạy.
- [ ] Tránh refetch toàn bộ menu sau mọi mutation nếu response hiện có đủ dữ liệu để patch local state.
- [ ] Nếu tạm thời vẫn giữ flow gọi chi tiết món, thêm cache theo `mealId` để giảm request lặp lại trong cùng session.

### 3.2 API performance

- [ ] Giữ payload `GET /menus/day` gọn và đúng nhu cầu render thực tế của mobile.
- [ ] Kiểm soát N+1 ở tầng database/service cho endpoint đọc theo ngày và các request phụ trợ liên quan.
- [ ] Cân nhắc cache read endpoint theo ngày nếu traffic thực tế đủ lớn.

### 3.3 Observability và debug

- [ ] Thêm log và metric cho các luồng `get menu day`, `create/update/delete menu item`, conflict rate và latency p95.
- [ ] Phân biệt rõ lỗi business, validation và network để debug từ mobile dễ hơn.
- [ ] Theo dõi tỷ lệ fail của flow add meal từ search vào menu.

## 4. Checklist test và rollout

- [ ] Bổ sung test cho `MenuScreen` với tình huống đổi ngày nhanh liên tục.
- [ ] Bổ sung test cho hành vi nhập `portionSize` không hợp lệ trong modal chỉnh sửa item.
- [ ] Bổ sung test cho flow add meal với context bị khóa theo `date` và `mealTime`.
- [ ] Gỡ hoặc cập nhật các test plan cũ còn giả định có endpoint `GET /api/v1/menus/range`.
- [ ] Chuẩn bị manual QA checklist ngắn cho các case add, update, delete, toggle logged, quick date switching và lỗi mạng.

## 5. Đề xuất thứ tự ưu tiên

### P0. Làm xong nền tảng để màn hình menu load đúng và đủ dữ liệu

- [X] Backend: mở rộng `GET /api/v1/menus/day/:date` để mỗi `menu_item` trả trực tiếp `nutritionPerServing` gồm `calories`, `protein`, `fiber`, `fat`.
- [X] Backend: giữ payload danh sách gọn, chỉ gồm các field đã chốt cho list view: `menuItemId`, `mealId`, `mealName`, `portionSize`, `eated`, `nutritionPerServing`.
- [X] Shared types: cập nhật schema response của `menu day` theo payload mới.
- [ ] Mobile app: refactor `fetchMenuScreenData` để map trực tiếp từ `fetchMenuDay`, xóa `loadMenuMealDetails`, và bỏ `Promise.all(fetchMealDetail(...))` khỏi luồng load danh sách.
- [ ] Mobile app: cập nhật `MenuMealItem` và mapper để nhận `nutritionPerServing` trực tiếp từ payload `menu day`.
- [ ] Mobile app: Thêm MacroStatDetailCarb ở các màn hình sau ngày hiện tại và MacroStatProgressCard ở các màn hình trước và trong ngày hiện tại
- [ ] Mobile app: Nối dữ liệu thật vào 2 card trên
- [ ] Docs/OpenAPI: đồng bộ contract `GET/DELETE /menus/day` theo dạng path param `/:date` và gỡ toàn bộ tham chiếu cũ tới `GET /api/v1/menus/range`.
- [ ] Test: bổ sung test backend cho shape mới của `GET /menus/day/:date`.
- [ ] Test: bổ sung test mobile để đảm bảo load menu theo ngày không còn gọi detail API cho từng món.
- [ ] Definition of done: màn hình menu render được list item và `nutritionTotal` mà không cần gọi detail API cho toàn bộ item trong ngày.

### P1. Ổn định hành vi người dùng và giảm bug runtime

- [ ] Mobile app: thêm guard chống stale response khi user đổi ngày liên tục hoặc rời màn hình trong lúc request đang chạy.
- [ ] Mobile app: sửa validation `portionSize` để input không hợp lệ không bị fallback im lặng; modal phải giữ mở và hiện lỗi rõ ràng.
- [ ] Mobile app: nếu modal vẫn cần `cookTime` và `difficulty`, chỉ fetch meal detail khi user mở `MenuItemDetailModal` cho item đang chọn.
- [ ] Mobile app: siết lại flow `Menu -> Meal Search -> Meal Detail -> Add to Menu` để luôn quay về đúng ngữ cảnh ngày và bữa đang thao tác.
- [ ] Mobile app: giữ hướng mutate an toàn, chỉ cập nhật state hoặc refetch slice cần thiết sau khi API thành công.
- [ ] Mobile app: giảm việc reset lại toàn bộ màn hình khi user chỉ thay đổi một item nhỏ.
- [ ] Test: bổ sung test cho tình huống đổi ngày nhanh liên tục.
- [ ] Test: bổ sung test cho validation `portionSize` trong modal chỉnh sửa item.
- [ ] Test: bổ sung test cho flow add meal với context bị khóa theo `date` và `mealTime`.
- [ ] Definition of done: các thao tác add, update, delete, toggle logged và đổi ngày không còn gây lỗi trạng thái sai hoặc mất ngữ cảnh.

### P2. Tối ưu thêm và hoàn thiện vận hành

- [ ] Mobile app: giảm refetch không cần thiết sau mutation khi response hiện có đủ dữ liệu để patch state cục bộ một cách an toàn.
- [ ] API/backend: rà soát rule duplicate meal để constraint database, error message và docs cùng một ý nghĩa.
- [ ] API/backend: xem lại chiến lược idempotent quanh create/delete item cuối cùng trong ngày.
- [ ] API/backend: cân nhắc bổ sung metadata như `updatedAt` hoặc version nếu thực sự cần cho refresh/cache.
- [ ] API/backend: bổ sung OpenAPI example cho case ngày rỗng, ngày có nhiều món, conflict và validation error.
- [ ] Performance: chỉ cân nhắc cache read endpoint theo ngày sau khi P0 và P1 đã ổn định.
- [ ] Observability: thêm log và metric cho `get menu day`, `create/update/delete menu item`, conflict rate và latency p95.
- [ ] Debuggability: phân biệt rõ lỗi business, validation và network để debug từ mobile dễ hơn.
- [ ] QA: chuẩn bị manual QA checklist ngắn cho các case add, update, delete, toggle logged, quick date switching và lỗi mạng.
- [ ] Polish: giữ nguyên nút `Templates` như hiện tại, chỉ xem lại nếu sau này xuất hiện yêu cầu UX mới.
- [ ] Definition of done: feature `menu` có tài liệu, metrics, test bổ sung và hành vi đủ ổn định để mở rộng tiếp mà không phải sửa lại nền tảng vừa làm ở P0-P1.
