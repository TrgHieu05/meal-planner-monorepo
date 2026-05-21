# Giới thiệu dự án Meal Planner

## 1. Tổng quan dự án

Meal Planner là hệ thống hỗ trợ người dùng lập kế hoạch bữa ăn cá nhân hóa trên thiết bị di động. Dự án được xây dựng theo mô hình monorepo, gồm một ứng dụng mobile dành cho người dùng cuối, một backend API phục vụ dữ liệu nghiệp vụ, cùng các package dùng chung cho schema và kiểu dữ liệu.

Mục tiêu chính của hệ thống là giúp người dùng quản lý thực đơn hằng ngày một cách khoa học, tiết kiệm thời gian suy nghĩ hôm nay ăn gì, đồng thời từng bước hình thành thói quen ăn uống phù hợp với mục tiêu sức khỏe cá nhân.

## 2. Bài toán thực tiễn

Trong thực tế, nhiều người gặp khó khăn khi phải duy trì chế độ ăn ổn định vì:

- thiếu công cụ để lên thực đơn theo ngày và theo từng bữa
- khó lưu lại các mẫu thực đơn đã dùng hiệu quả trước đó
- chưa có nơi tập trung để quản lý sở thích ăn uống, dị ứng và mục tiêu cá nhân
- việc tìm món ăn phù hợp thường rời rạc, thiếu liên kết với kế hoạch bữa ăn thực tế

Meal Planner được thiết kế để giải quyết các vấn đề này bằng một quy trình liền mạch: đăng nhập, thiết lập hồ sơ cá nhân, tìm món ăn, thêm món vào thực đơn, và tái sử dụng các mẫu thực đơn nhiều ngày.

## 3. Giá trị mà dự án mang lại

### Đối với người dùng

- cá nhân hóa kế hoạch ăn uống theo hồ sơ, mục tiêu và sở thích
- đơn giản hóa việc tạo thực đơn cho từng ngày, từng bữa sáng, trưa, tối
- tiết kiệm thời gian nhờ có thể tái sử dụng các template thực đơn nhiều ngày
- hỗ trợ theo dõi thông tin dinh dưỡng ở mức nền tảng để phục vụ quyết định ăn uống tốt hơn

### Đối với nhóm phát triển

- kiến trúc monorepo giúp đồng bộ dữ liệu giữa mobile app, backend và database
- package shared làm nguồn dùng chung cho kiểu dữ liệu và contract API, giảm lệch giữa client và server
- kiến trúc hiện tại tạo nền tảng tốt để mở rộng sang gợi ý thông minh hoặc AI trong các giai đoạn sau

## 4. Các tính năng chính của ứng dụng

### 4.1 Xác thực và onboarding

- đăng nhập bằng Google Sign-In
- xác định người dùng mới và điều hướng qua luồng onboarding bắt buộc
- thu thập thông tin cơ bản để khởi tạo trải nghiệm cá nhân hóa

### 4.2 Quản lý hồ sơ cá nhân

- cập nhật thông tin người dùng
- quản lý mục tiêu dinh dưỡng và chỉ số cơ thể
- chọn chế độ ăn, mục tiêu, loại ẩm thực yêu thích
- quản lý dị ứng và nguyên liệu yêu thích

### 4.3 Tìm kiếm món ăn

- tìm kiếm món ăn theo tên hoặc nguyên liệu
- xem chi tiết món ăn với thông tin dinh dưỡng cơ bản
- lọc món theo độ khó, thời gian nấu và ngữ cảnh hồ sơ người dùng

### 4.4 Lập thực đơn theo ngày

- tạo thực đơn theo từng ngày
- thêm món vào từng bữa: sáng, trưa, tối
- cập nhật khẩu phần hoặc trạng thái đã ăn
- hỗ trợ ngày rỗng nhưng vẫn hiển thị đầy đủ khung thực đơn để người dùng thao tác thuận tiện

### 4.5 Quản lý mẫu thực đơn

- tạo template thực đơn nhiều ngày
- thêm món cho từng ngày và từng bữa trong template
- tái sử dụng cấu trúc thực đơn để tiết kiệm thời gian lên kế hoạch

## 5. Phạm vi sản phẩm hiện tại

Phiên bản hiện tại tập trung vào việc hoàn thiện lõi nghiệp vụ cho mobile app và backend API. Các chức năng như gợi ý thực đơn tự động bằng AI, xếp hạng nâng cao hoặc chia sẻ thực đơn vẫn được xem là hướng mở rộng cho các giai đoạn tiếp theo.

## 6. Kết luận ngắn

Meal Planner không chỉ là ứng dụng ghi lại món ăn, mà là một nền tảng hỗ trợ người dùng xây dựng kế hoạch dinh dưỡng có cấu trúc. Giá trị nổi bật của dự án nằm ở khả năng liên kết giữa dữ liệu cá nhân, tìm kiếm món ăn, quản lý thực đơn hằng ngày và tái sử dụng template trong cùng một hệ thống thống nhất.