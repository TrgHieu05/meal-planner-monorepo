# Manual Test Checklist For Menu Feature

## Mục tiêu

Tài liệu này dùng cho manual QA của tính năng `menu` trên mobile app, bao gồm:

- load menu theo ngày và chuyển ngày nhanh
- hiển thị `MacroStatProgressCard` và `MacroStatDetailCard`
- flow `Menu -> Meal Search -> Meal Detail -> Add to Menu`
- chỉnh sửa `portion size`, toggle `logged`, xóa item trong `MenuItemDetailModal`
- các tình huống lỗi chính: empty state, loading, network error, duplicate meal, stale response

Checklist được viết theo hướng dễ chạy tay trên thiết bị thật hoặc emulator, không phụ thuộc vào test automation.

## Phạm vi màn hình và luồng cần test

- `MenuScreen`
- `WeekDateStrip` + week picker
- `MacroStatProgressCard`
- `MacroStatDetailCard`
- `MenuMealTimeCard`
- `MenuItemDetailModal`
- flow add meal từ `meal search` và `meal detail`
- điều hướng nút `Templates`

## Điều kiện chuẩn bị

### Thiết bị và môi trường

- [ ] Có ít nhất 1 thiết bị/emulator chạy được mobile app.
- [ ] Mobile app có thể gọi được backend thật.
- [ ] Backend đang dùng đúng schema/database hiện tại.
- [ ] Seed data cho `meal`, `menu`, `profile` đã có sẵn.

### Dữ liệu kiểm thử khuyến nghị

- [ ] User A: có ngày không có `menu item`.
- [ ] User B: có ngày hiện tại với ít nhất 2 `menu item`, trong đó có ít nhất 1 món đã `logged` và 1 món chưa `logged`.
- [ ] User C: có ngày trong quá khứ với `menu item`.
- [ ] User D: có ngày trong tương lai với `menu item` hoặc ít nhất mở được màn hình menu ở ngày tương lai.
- [ ] Có sẵn ít nhất 1 meal có thể add mới vào menu để test create thành công.
- [ ] Có sẵn ít nhất 1 meal trùng điều kiện duplicate để test conflict khi add vào cùng ngày và cùng `mealTime`.

### Ghi log khi test

- [ ] Ghi lại thiết bị, build app, branch/commit đang test.
- [ ] Ghi lại ngày đang test và trạng thái dữ liệu đầu vào của ngày đó.
- [ ] Nếu gặp lỗi API, chụp lại message trên UI và response backend nếu có thể.

## Danh sách checklist manual test

## 1. Load menu theo ngày

### 1.1 Ngày không có menu item

- [ ] Mở một ngày không có `menu item` và xác nhận không xuất hiện lỗi `Unable to load menu right now`.
- [ ] Xác nhận `meal stat card` vẫn hiển thị bình thường với giá trị `0`.
- [ ] Xác nhận 3 section `Breakfast`, `Lunch`, `Dinner` vẫn render đầy đủ dù chưa có item.

### 1.2 Ngày có menu item

- [ ] Mở một ngày có `menu item` và xác nhận màn hình load thành công, không hiện lỗi đỏ.
- [ ] Xác nhận danh sách item hiển thị đúng `meal name`, `portion size` và dòng nutrition.
- [ ] Xác nhận `meal stat card` xuất hiện đúng ở đầu màn hình.

### 1.3 Loading, error và retry behavior

- [ ] Mở menu khi mạng chậm và xác nhận có loading state rõ ràng.
- [ ] Tắt mạng rồi mở menu ngày có item và xác nhận có error message rõ ràng.
- [ ] Bật lại mạng và mở lại màn hình hoặc refocus màn hình, xác nhận dữ liệu load lại được.

### 1.4 Chuyển ngày nhanh

- [ ] Chạm đổi ngày liên tục trong `WeekDateStrip` và xác nhận dữ liệu cuối cùng luôn khớp với ngày đang được chọn.
- [ ] Khi đang load ngày A rồi chuyển sang ngày B thật nhanh, xác nhận dữ liệu ngày A không ghi đè lên ngày B.
- [ ] Quay ra màn khác rồi quay lại menu trong lúc request đang chạy, xác nhận app không crash và không hiện trạng thái sai.

## 2. Meal stat card

### 2.1 Đúng loại card theo ngữ cảnh ngày

- [ ] Ở ngày hiện tại, xác nhận màn hình hiển thị `MacroStatProgressCard`.
- [ ] Ở ngày trong quá khứ, xác nhận màn hình hiển thị `MacroStatProgressCard`.
- [ ] Ở ngày trong tương lai, xác nhận màn hình hiển thị `MacroStatDetailCard`.

### 2.2 Giá trị hiển thị đúng

- [ ] Với ngày có nhiều món nhưng chỉ một phần đã `logged`, xác nhận `MacroStatProgressCard` chỉ tính nutrition của các món đã `logged`.
- [ ] Toggle `logged` từ `false` sang `true` cho một món và xác nhận `MacroStatProgressCard` tăng theo nutrition của món đó.
- [ ] Toggle `logged` từ `true` sang `false` và xác nhận `MacroStatProgressCard` giảm tương ứng.
- [ ] Xác nhận `MacroStatDetailCard` ở ngày tương lai vẫn hiển thị tổng nutrition của toàn bộ menu trong ngày.
- [ ] Nếu user không có `targetCalories`, xác nhận card hiển thị `No calorie target` thay vì progress sai.

## 3. Add meal flow

### 3.1 Mở đúng ngữ cảnh add meal

- [ ] Từ section `Breakfast`, nhấn add meal và xác nhận flow sang `meal search` giữ đúng `date` và `mealTime`.
- [ ] Lặp lại cho `Lunch` và `Dinner`.
- [ ] Từ `meal search` vào `meal detail`, xác nhận context khóa theo ngày và bữa vẫn được giữ.

### 3.2 Add thành công

- [ ] Add một meal hợp lệ vào menu và xác nhận quay lại đúng màn hình `Menu` với đúng ngày đang thao tác.
- [ ] Xác nhận item mới xuất hiện ở đúng `mealTime group`.
- [ ] Nếu item mới được add ở ngày hiện tại hoặc quá khứ nhưng chưa `logged`, xác nhận `MacroStatProgressCard` chưa tăng ngay do món chưa được log.
- [ ] Nếu item mới được add ở ngày tương lai, xác nhận `MacroStatDetailCard` cập nhật đúng tổng nutrition của cả menu.

### 3.3 Add lỗi và duplicate

- [ ] Thử add cùng một meal vào cùng ngày và cùng `mealTime`, xác nhận app hiển thị lỗi duplicate rõ ràng.
- [ ] Tắt mạng khi add meal và xác nhận app không điều hướng sai hoặc cập nhật UI nửa chừng.

## 4. Menu item detail modal

### 4.1 Mở modal và load dữ liệu

- [ ] Chạm vào một `menu item` và xác nhận `MenuItemDetailModal` mở đúng item được chọn.
- [ ] Nếu modal cần thêm `cookTime` hoặc `difficulty`, xác nhận modal vẫn load được thông tin bổ sung mà không ảnh hưởng toàn màn hình.

### 4.2 Cập nhật portion size

- [ ] Nhập `portion size` hợp lệ và lưu, xác nhận item cập nhật đúng trên danh sách.
- [ ] Với ngày tương lai, xác nhận `MacroStatDetailCard` cập nhật đúng total sau khi đổi `portion size`.
- [ ] Với ngày hiện tại hoặc quá khứ, nếu món đang `logged`, xác nhận `MacroStatProgressCard` cập nhật theo `portion size` mới.
- [ ] Với ngày hiện tại hoặc quá khứ, nếu món chưa `logged`, xác nhận `MacroStatProgressCard` không bị tăng sai chỉ vì đổi `portion size`.
- [ ] Nhập `0`, số âm hoặc text không hợp lệ và xác nhận modal giữ mở, hiển thị lỗi rõ ràng.

### 4.3 Toggle logged

- [ ] Toggle `logged` cho một item chưa log và xác nhận trạng thái item đổi đúng.
- [ ] Xác nhận `MacroStatProgressCard` cập nhật ngay sau khi toggle thành công.
- [ ] Nếu API toggle lỗi, xác nhận trạng thái item không bị đổi giả trên UI.

### 4.4 Delete item

- [ ] Xóa một item và xác nhận item biến mất khỏi đúng `mealTime group`.
- [ ] Với item đang `logged`, xác nhận `MacroStatProgressCard` giảm đúng sau khi xóa thành công.
- [ ] Xóa item cuối cùng của một ngày và xác nhận màn hình trở về trạng thái ngày rỗng, không crash, không hiện lỗi load sai.

## 5. Điều hướng và trạng thái phụ trợ

### 5.1 Nút Templates

- [ ] Nhấn nút `Templates` và xác nhận điều hướng hoạt động đúng.
- [ ] Quay lại `Menu` từ flow `Templates` và xác nhận không mất ngày đang chọn.

### 5.2 Past vs current vs future behavior

- [ ] Ở ngày quá khứ, xác nhận không còn cho add meal nếu UI đã khóa theo rule hiện tại.
- [ ] Ở ngày hiện tại, xác nhận vẫn add meal được bình thường.
- [ ] Ở ngày tương lai, xác nhận vẫn xem được nutrition total của menu bằng `MacroStatDetailCard`.

## 6. Gợi ý spot-check API khi cần debug

- [ ] Gọi `GET /api/v1/menus/day/:date` cho ngày rỗng và xác nhận `hasMenu = false`, `nutritionTotal` bằng `0`, các mảng `BREAKFAST/LUNCH/DINNER` rỗng.
- [ ] Gọi `GET /api/v1/menus/day/:date` cho ngày có item và xác nhận từng item có `menuItemId`, `mealId`, `mealName`, `portionSize`, `eated`, `nutritionPerServing`.
- [ ] Gọi `PATCH /api/v1/menu-items/:id` với `portionSize` hợp lệ và xác nhận response thành công.
- [ ] Gọi `PATCH /api/v1/menu-items/:id` với payload không hợp lệ và xác nhận backend trả validation error phù hợp.
- [ ] Gọi `DELETE /api/v1/menu-items/:id` cho item cuối cùng trong ngày và xác nhận ngày sau đó vẫn đọc được như empty day.

## Definition of done cho manual QA đợt này

- [ ] Không còn tái hiện lỗi `Unable to load menu right now` với ngày có dữ liệu hợp lệ.
- [ ] `MacroStatProgressCard` chỉ phản ánh nutrition của các món đã `logged`.
- [ ] `MacroStatDetailCard` ở ngày tương lai vẫn phản ánh tổng nutrition của cả menu ngày đó.
- [ ] Flow add, update, toggle logged, delete không làm mất ngữ cảnh ngày hoặc gây trạng thái UI sai.