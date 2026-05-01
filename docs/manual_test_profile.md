# Manual Test Checklist For Profile Feature

## Mục tiêu

Tài liệu này dùng cho manual QA của toàn bộ tính năng `profile` trên mobile app, bao gồm:

- luồng onboarding bắt buộc cho user mới
- profile tab sau khi onboarding hoàn tất
- các màn chỉnh sửa `user info`, `preferences`, `metric`, `allergy`, `favorite ingredient`
- các tình huống lỗi chính: validation, token/session, network, ingredient conflict

Checklist được viết theo hướng dễ chạy tay trên thiết bị thật hoặc emulator, không phụ thuộc vào test automation.

## Phạm vi màn hình và luồng cần test

- `Login` -> Google sign-in -> route guard
- `Onboarding step-1`: gender + date of birth
- `Onboarding step-2`: diet type
- `Onboarding step-3`: cuisine type + goal + target calories
- `Onboarding step-4`: weight + height + submit hoàn tất onboarding
- `Profile` tab
- `Edit User Info`
- `Edit Preference`
- `Edit Metric`
- `Edit Allergy`
- `Edit Favorite Ingredient`

## Điều kiện chuẩn bị

### Thiết bị và môi trường

- [X] Có ít nhất 1 thiết bị/emulator chạy được mobile app.
- [X] Mobile app có thể gọi được backend thật.
- [X] Backend đang dùng đúng schema/database hiện tại.
- [X] Seed data cho `diet type`, `goal`, `cuisine type`, `ingredient` đã có sẵn.

### Tài khoản kiểm thử khuyến nghị

- [ ] Tài khoản A: user Google hoàn toàn mới, chưa có profile.
- [ ] Tài khoản B: user đã onboarding xong và có dữ liệu profile đầy đủ.
- [ ] Tài khoản C: user đã có profile nhưng chưa có allergy/favorite ingredient.
- [ ] Tài khoản D: user có sẵn allergy và favorite ingredient để test conflict.
- [ ] Tài khoản E: nếu có thể, user legacy để kiểm tra dữ liệu cũ hoặc dữ liệu bất thường.

### Ghi log khi test

- [ ] Ghi lại thiết bị, build app, branch/commit đang test.
- [ ] Ghi lại access path nếu lỗi chỉ xảy ra sau login, relaunch hoặc quay lại từ màn edit.
- [ ] Nếu gặp lỗi API, chụp lại message trên UI và response backend nếu có thể.

## Danh sách checklist manual test

## 1. Route Guard và điều hướng cơ bản

### 1.1 User chưa đăng nhập

- [X] Mở app khi chưa có session và xác nhận app đi vào màn hình auth thay vì `(tabs)`.
- [ ] Thử truy cập trực tiếp profile route khi chưa đăng nhập và xác nhận bị chặn đúng. **?**

### 1.2 User đã đăng nhập nhưng chưa onboarding hoàn tất

- [X] Đăng nhập bằng tài khoản A và xác nhận app chuyển vào `/onboarding/step-1`.
- [X] Xác nhận user không thể vào profile tab hoặc các tab protected khác trước khi onboarding complete.
- [X] Kill app rồi mở lại trong lúc onboarding chưa xong và xác nhận app vẫn quay lại onboarding, không vào app chính.

### 1.3 User đã onboarding hoàn tất

- [X] Đăng nhập bằng tài khoản B và xác nhận app vào app chính thay vì onboarding.
- [X] Kill app rồi mở lại và xác nhận session được restore đúng, app vẫn vào app chính.

## 2. Onboarding Step 1: Gender và Date of Birth

### 2.1 Hiển thị ban đầu

- [X] Xác nhận màn hình hiển thị đủ 2 trường `gender` và `birth date`.
- [X] Xác nhận nút `Next` bị disable khi chưa nhập đủ dữ liệu.

### 2.2 Gender

- [X] Mở danh sách gender và xác nhận chỉ có `Male` và `Female`.
- [X] Chọn `Male`, quay lại màn trước nếu có, rồi vào lại để xác nhận draft vẫn giữ giá trị đã chọn trong session hiện tại.
- [X] Lặp lại với `Female`.

### 2.3 Date of Birth

- [X] Mở date picker và chọn một ngày hợp lệ, xác nhận giá trị hiển thị đúng trên field.
- [X] Chọn lại một ngày khác và xác nhận field cập nhật đúng.
- [X] Đảm bảo không thể qua bước tiếp theo nếu chưa chọn ngày sinh.

### 2.4 Điều hướng

- [X] Khi đã có đủ `gender` và `dateOfBirth`, nhấn `Next` và xác nhận điều hướng sang bước tiếp theo.

## 3. Onboarding Step 2: Diet Type

### 3.1 Load options

- [X] Xác nhận danh sách diet type được load từ backend, không phải dữ liệu hardcoded.
- [ ] Xác nhận có loading hoặc trạng thái phù hợp trong lúc chờ options. **load quá nhanh nên không biết**
- [ ] Nếu backend lỗi hoặc mất mạng, xác nhận có error message rõ ràng. **không biết vì có vẻ toàn bộ option đã load trước khi vào luồng onboarding**

### 3.2 Chọn diet type

- [X] Chọn một diet type bất kỳ và xác nhận trạng thái selected hiển thị đúng.
- [X] Chuyển qua bước tiếp theo rồi quay lại để xác nhận draft vẫn giữ giá trị đã chọn.

## 4. Onboarding Step 3: Cuisine Type, Goal, Target Calories

### 4.1 Load options

- [X] Xác nhận cuisine type và goal được load từ backend.
- [X] Xác nhận `cuisine type` đang là single-select, không cho chọn nhiều giá trị cùng lúc.

### 4.2 Required fields

- [X] Xác nhận không thể đi tiếp nếu chưa chọn `cuisine type`.
- [X] Xác nhận không thể đi tiếp nếu chưa chọn `goal`.

### 4.3 Target calories

- [X] Để trống `target calories` và đi tiếp, xác nhận vẫn hợp lệ nếu field này đang optional.
- [X] Nhập số nguyên hợp lệ, xác nhận đi tiếp được.
- [X] Nhập số thập phân hợp lệ nếu UI cho phép, xác nhận đi tiếp được.
- [X] Nhập `0`, số âm, hoặc text không hợp lệ và xác nhận submit bị chặn hoặc báo lỗi phù hợp.

## 5. Onboarding Step 4: Weight, Height, Complete

### 5.1 Validation trước submit

- [X] Xác nhận nút `Complete` bị disable khi chưa nhập đủ `weight` và `height`.
- [X] Nhập giá trị hợp lệ cho cả `weight` và `height`, xác nhận có thể submit.
- [X] Nhập `0`, số âm, text không hợp lệ và xác nhận hiển thị lỗi phù hợp.

### 5.2 Submit thành công

- [X] Dùng tài khoản A, hoàn tất toàn bộ onboarding với dữ liệu hợp lệ và nhấn `Complete`.
- [X] Xác nhận app submit thành công, refresh session thành công và điều hướng vào app chính.
- [X] Xác nhận user không còn bị route guard kéo lại onboarding sau khi submit xong.

### 5.3 Tính toàn vẹn dữ liệu sau onboarding

- [X] Vào profile tab ngay sau onboarding và xác nhận dữ liệu basic info hiển thị đúng với những gì đã nhập.
- [X] Xác nhận preferences hiển thị đúng diet type, goal, cuisine type, target calories.
- [X] Xác nhận metric hiển thị đúng weight, height và BMI nếu backend đã tính.

### 5.4 Lỗi khi submit onboarding

- [X] Tắt mạng trước khi nhấn `Complete`, xác nhận có lỗi rõ ràng và user vẫn ở màn cuối.
- [ ] Giả lập backend trả `422`, xác nhận message lỗi không làm crash app. **Không biết giả lập thế nào**
- [ ] Giả lập token/session lỗi, xác nhận app hiển thị thông báo phù hợp và không điều hướng sai. **Không biết giả lập thế nào**

## 6. Profile Tab: Hiển thị dữ liệu tổng quan

### 6.1 Load thành công

- [X] Mở profile tab bằng tài khoản B và xác nhận màn hình load thành công từ backend.
- [X] Xác nhận các section chính đều hiển thị: `User Information`, `Preferences & Rules`, `Metrics`, `Favorite Ingredients`, `Allergies`.
- [X] Xác nhận dữ liệu text đúng với backend hiện tại.

### 6.2 Loading, error, empty/incomplete state

- [X] Mở profile tab khi mạng chậm và xác nhận có loading state.
- [X] Tắt mạng rồi mở profile tab, xác nhận có error state và có thể `Retry`.
- [ ] Dùng user incomplete nếu chuẩn bị được, xác nhận hiển thị empty/incomplete state đúng. 

### 6.3 Refresh khi quay lại

- [X] Từ profile tab vào từng màn edit, sửa dữ liệu, lưu và quay lại.
- [X] Xác nhận profile tab tự refresh dữ liệu khi screen được focus trở lại.

## 7. Edit User Info

### 7.1 Prefill

- [X] Mở `Edit User Info` từ profile tab và xác nhận field được prefill đúng từ backend.
- [X] Xác nhận gender hiển thị đúng label UI tương ứng với code backend.
- [X] Xác nhận date of birth được hiển thị đúng ngày.

### 7.2 Cập nhật thành công

- [X] Đổi `userName`, lưu và xác nhận quay lại profile thấy giá trị mới.
- [X] Đổi `gender`, lưu và xác nhận profile hiển thị đúng.
- [X] Đổi `dateOfBirth`, lưu và xác nhận profile hiển thị đúng.
- [X] Đổi đồng thời nhiều field và xác nhận tất cả cùng được lưu.

### 7.3 Validation và lỗi

- [X] Để trống `userName` nếu UI cho phép và xác nhận backend/UI xử lý đúng.
- [X] Gửi date không hợp lệ nếu có thể tái hiện bằng UI hoặc request lỗi, xác nhận hiển thị lỗi phù hợp.
- [ ] Nếu backend trả `422`, xác nhận field error map đúng vào form.

## 8. Edit Preference

### 8.1 Load dữ liệu ban đầu

- [X] Mở `Edit Preference` và xác nhận options `diet type`, `goal`, `cuisine type` được load thật từ backend.
- [X] Xác nhận form được prefill đúng với profile hiện tại.

### 8.2 Save thành công

- [X] Đổi `diet type`, lưu và xác nhận profile tab hiển thị đúng.
- [X] Đổi `goal`, lưu và xác nhận profile tab hiển thị đúng.
- [X] Đổi `cuisine type`, lưu và xác nhận profile tab hiển thị đúng.
- [X] Cập nhật `target calories`, lưu và xác nhận hiển thị đúng dưới dạng `kcal/day`.
- [X] Nếu UI có `activityLevel`, đổi giá trị và xác nhận mapping hiển thị đúng.

### 8.3 Validation và lỗi

- [X] Nhập `target calories` không hợp lệ và xác nhận bị chặn hoặc báo lỗi.
- [X] Tắt mạng khi lưu và xác nhận hiển thị lỗi phù hợp
- [ ] Giả lập backend trả option id không tồn tại và xác nhận UI không crash. **Khoong biết cách giả lập**

## 9. Edit Metric

### 9.1 Prefill

- [X] Mở `Edit Metric` và xác nhận form prefill từ latest metric hiện tại.

### 9.2 Save thành công

- [X] Cập nhật `weight`, lưu và xác nhận profile tab hiển thị giá trị mới.
- [X] Cập nhật `height`, lưu và xác nhận profile tab hiển thị giá trị mới.
- [X] Cập nhật cả hai field, lưu và xác nhận BMI hiển thị đúng theo backend trả về.

### 9.3 Validation và lỗi

- [X] Nhập `0` cho weight hoặc height và xác nhận không lưu được.
- [X] Nhập số âm và xác nhận không lưu được.
- [X] Nhập ký tự không phải số nếu UI cho phép và xác nhận lỗi phù hợp.
- [X] Tắt mạng khi lưu và xác nhận hiển thị lỗi phù hợp.

## 10. Edit Allergy

### 10.1 Load và search

- [X] Mở `Edit Allergy` và xác nhận selected list hiện tại được load từ backend.
- [X] Xác nhận ingredient catalog ban đầu được load khi search rỗng.
- [X] Tìm kiếm theo tên ingredient và xác nhận kết quả được cập nhật sau debounce.

### 10.2 Thêm/xóa bình thường

- [X] Chọn thêm một ingredient không conflict và lưu thành công.
- [X] Bỏ chọn một ingredient đã có và lưu thành công.
- [X] Quay lại profile tab và xác nhận tag allergy hiển thị đúng dữ liệu mới.

### 10.3 Conflict với favorite ingredient

- [X] Chọn một ingredient hiện đang thuộc favorite ingredient để tạo conflict.
- [X] Xác nhận backend trả `409` và app mở conflict modal.
- [X] Xác nhận modal hiển thị danh sách item conflict đúng.
- [X] Nếu số item conflict > 2, xác nhận UI rút gọn theo dạng `+ x others`.
- [X] Xác nhận flow confirm conflict sẽ remove item phía danh sách đối nghịch rồi save thành công.
- [X] Xác nhận sau khi confirm, dữ liệu allergy và favorite ingredient đều đúng khi quay lại profile.

### 10.4 Lỗi thường

- [X] Tắt mạng khi search ingredient và xác nhận hiển thị lỗi phù hợp.
- [X] Tắt mạng khi save và xác nhận dữ liệu không bị cập nhật nửa chừng trên UI.

## 11. Edit Favorite Ingredient

### 11.1 Load và search

- [X] Mở `Edit Favorite Ingredient` và xác nhận selected list hiện tại được load từ backend.
- [X] Xác nhận ingredient catalog load đúng khi search rỗng.
- [X] Search theo tên ingredient và xác nhận kết quả đúng.

### 11.2 Thêm/xóa bình thường

- [X] Thêm một ingredient không conflict và lưu thành công.
- [X] Bỏ một ingredient hiện có và lưu thành công.
- [X] Quay lại profile tab và xác nhận tag favorite ingredient hiển thị đúng.

### 11.3 Conflict với allergy

- [X] Chọn một ingredient hiện đang thuộc allergy để tạo conflict.
- [X] Xác nhận app hiển thị conflict modal đúng.
- [X] Xác nhận confirm conflict sẽ xóa item ở allergy rồi save favorite ingredient thành công.
- [X] Quay lại profile tab và xác nhận hai danh sách đã đồng bộ đúng.

### 11.4 Lỗi thường

- [X] Tắt mạng khi search và khi save để xác nhận error handling đúng.

## 12. Regression giữa các màn edit và profile overview

- [X] Chạy chuỗi sửa `User Info` -> quay lại profile -> sửa `Preference` -> quay lại profile -> sửa `Metric` -> quay lại profile; xác nhận mỗi lần quay lại dữ liệu đều mới nhất.
- [X] Sau khi sửa allergy/favorite ingredient, xác nhận tag list ở profile overview luôn khớp với dữ liệu vừa lưu.
- [X] Restart app sau mỗi loại chỉnh sửa chính và xác nhận dữ liệu vẫn persist đúng.

## 13. Session, token và sign-out/sign-in lại

- [ ] Khi session còn hợp lệ, mở lại app và xác nhận profile vẫn load được.
- [ ] Khi token hết hạn hoặc bị xóa, xác nhận profile-related screen không crash và user bị đưa về flow phù hợp.
- [ ] Sign out rồi sign in lại bằng cùng tài khoản, xác nhận dữ liệu profile vẫn giữ nguyên.

## 14. Network và khả năng chịu lỗi

- [ ] Test mạng chập chờn khi load profile overview.
- [ ] Test mạng chập chờn khi load onboarding options.
- [ ] Test mạng chập chờn khi save từng màn edit.
- [ ] Xác nhận app luôn giữ được trạng thái an toàn: không crash, không điều hướng sai, không mất dữ liệu đã lưu thành công trước đó.

## 15. Trường hợp dữ liệu legacy hoặc bất thường
**Không có legacy nên không cần test**

- [ ] Nếu có account legacy, mở onboarding/profile và xác nhận app xử lý được hoặc hiển thị lỗi có thể chẩn đoán.
- [ ] Nếu backend trả dữ liệu profile thiếu một phần, xác nhận app hiển thị empty/error state thay vì crash.
- [ ] Nếu `gender` hoặc dữ liệu user không hợp domain hiện tại, ghi nhận rõ behavior và đính kèm payload để backend/mobile xử lý tiếp.

## Tiêu chí pass chung

- [X] Không có màn nào trong phạm vi profile bị crash.
- [X] Route guard hoạt động đúng cho cả 3 trạng thái: chưa đăng nhập, đã đăng nhập nhưng chưa onboarding xong, đã onboarding xong.
- [X] Tất cả dữ liệu lưu từ các màn edit đều phản ánh đúng trên profile tab sau khi quay lại.
- [X] Onboarding hoàn tất tạo được dữ liệu user/profile/metric hợp lệ trên backend.
- [X] Conflict giữa allergy và favorite ingredient được xử lý đúng và nhất quán.
- [X] Các lỗi mạng/validation được hiển thị rõ ràng, không làm app vào trạng thái sai.