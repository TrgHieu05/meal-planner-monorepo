# Image Integration

## Mục tiêu tài liệu

Tài liệu này tổng hợp các việc cần hoàn thành để tích hợp ảnh cho hai nhóm tính năng `meal` và `template` với Cloudinary giữa:

- `apps/mobile-app`
- `services/main-backend`
- `packages/shared`
- `packages/database`

Tài liệu cũng ghi lại:

- hiện trạng đã xác nhận trong codebase
- kiến trúc Cloudinary đã chọn cho v1
- checklist triển khai theo từng lớp
- các quyết định nghiệp vụ đã được chốt cho phase này

## Phạm vi tính năng

Phạm vi tài liệu này bao gồm:

- upload ảnh gốc chất lượng cao lên Cloudinary
- lưu khóa ảnh của `meal` và `template` trong database
- dựng URL ảnh theo nhiều biến thể từ cùng một ảnh gốc
- hiển thị ảnh kích thước nhỏ ở các list/card
- hiển thị ảnh chất lượng cao hơn ở các màn detail
- cập nhật contract backend/mobile để render ảnh thật thay cho placeholder hiện tại
- bổ sung flow upload ảnh cho template trên mobile app

Ngoài phạm vi mặc định của tài liệu này:

- nhiều ảnh cho một `meal` hoặc một `template`
- crop editor nâng cao trên mobile
- đồng bộ/xóa asset mồ côi trên Cloudinary theo lịch nền
- watermark, moderation, AI tagging hoặc auto-caption
- thay đổi UX lớn ngoài phạm vi cần thiết để nối ảnh thật

## Hiện trạng tóm tắt

- [x] Prisma schema đã có sẵn cột `meal_image_key` trong bảng `meals`.
- [x] Prisma schema đã có sẵn cột `template_image_key` trong bảng `meal_templates`.
- [x] Backend `meal-search` hiện đã trả `meal_image_key` và `meal_image_urls` ở cả search result và meal detail.
- [x] Mobile meal data layer hiện đã map `meal_image_key` và `meal_image_urls` sang meal view model.
- [x] UI `MealCard` và `MealDetailScreen` hiện đã render ảnh thật với fallback cục bộ.
- [x] UI `TemplateCard` và `TemplateDetailScreen` hiện đã render ảnh thật với fallback cục bộ.
- [x] Template editor hiện đã có image picker, preview ảnh cục bộ, action thay/xóa ảnh và upload flow khi submit.
- [x] Shared schema cho `meal-template` hiện đã expose `templateImageKey` và `templateImageUrls`.
- [x] Backend `meal-template` hiện đã trả ảnh template ở list/detail response.
- [x] `apps/mobile-app/package.json` hiện đã có `expo-image-picker` cho flow chọn ảnh từ thiết bị.
- [x] `services/main-backend/package.json` hiện đã có Cloudinary SDK và media module chuyên trách.
- [x] Mobile app hiện đã có sẵn fallback asset cục bộ `default-meal.jpg` và `default-template.jpg` trong `apps/mobile-app/assets/images`.

## Kiến trúc đã chốt cho v1

- [x] Dùng Cloudinary làm dịch vụ lưu trữ và phân phối ảnh.
- [x] Chỉ upload một ảnh gốc chất lượng cao cho mỗi `meal` hoặc `template`.
- [x] Database chỉ lưu khóa ảnh, không lưu full URL.
- [x] Giá trị lưu trong `meal_image_key` và `template_image_key` sẽ là Cloudinary `public_id`.
- [x] Backend là nơi chuẩn hóa cách dựng URL ảnh cho từng use case.
- [x] Mobile không nên tự hardcode transformation string của Cloudinary ở nhiều màn hình.
- [x] List/card sẽ dùng ảnh biến thể nhẹ hơn.
- [x] Detail sẽ dùng ảnh chất lượng cao hơn từ cùng một ảnh gốc.
- [x] Màn detail dùng biến thể `detail` tối ưu, không dùng raw original trong flow mặc định.
- [x] `meal` card và `meal` detail cùng dùng tỷ lệ `1:1`.
- [x] `template` card và `template` detail cùng dùng tỷ lệ `16:9`.
- [x] Nếu ảnh tải lên sai tỷ lệ mục tiêu, Cloudinary sẽ crop vào trung tâm cho biến thể `card` và `detail`.
- [x] Biến thể `original` giữ nguyên tỷ lệ gốc của file được upload.
- [x] Khi thay ảnh, hệ thống overwrite cùng `public_id` để giữ key ổn định.
- [x] Khi thay ảnh hoặc xóa template, asset tương ứng trên Cloudinary phải được xóa.
- [x] Khi `meal` bị xóa hoặc seed bị đổi, không tự động xóa asset trên Cloudinary.
- [x] Ảnh `meal` trong phase này được quản lý qua seed riêng hoặc upload trực tiếp lên Cloudinary ngoài flow mobile app.
- [x] Fallback ảnh trên mobile dùng `default-meal.jpg` và `default-template.jpg`.

Quy ước vận hành cho v1:

- Không dùng file gốc raw trực tiếp trên màn detail trong flow mặc định.
- Màn detail dùng biến thể `detail` chất lượng cao nhưng vẫn tối ưu bởi Cloudinary.
- File gốc chỉ giữ để phục vụ reprocess, replace hoặc nhu cầu admin về sau.
- Card và detail luôn ưu tiên crop theo tỷ lệ đã chốt; original không bị ép tỷ lệ.

## Mô hình dữ liệu đề xuất

Giữ nguyên cột hiện có trong database và đổi rõ nghĩa của field:

- `meal_image_key` = Cloudinary `public_id` của ảnh meal
- `template_image_key` = Cloudinary `public_id` của ảnh template

Ví dụ giá trị lưu:

- `meals/42/cover`
- `templates/2d3d7f8c-....../cover`

Không khuyến nghị lưu:

- full delivery URL từ Cloudinary
- URL đã transform sẵn cho card/detail
- local device URI của Expo

## Quy ước folder và public ID đề xuất

### Meal

- folder gốc: `meals/`
- public ID khuyến nghị: `meals/<mealId>/cover`

### Template

- folder gốc: `templates/`
- public ID khuyến nghị: `templates/<templateId>/cover`

Lợi ích của cách này:

- dễ thay ảnh bằng cách overwrite cùng `public_id`
- dễ đọc khi debug trên Cloudinary dashboard
- giữ được chiến lược lưu key hiện tại gần với định hướng `templates/template1.png`, `meals/meal1.png`
- không phụ thuộc vào URL cụ thể của Cloudinary trong database

## Chiến lược resize/delivery với Cloudinary

Từ cùng một `public_id`, backend sẽ dựng ra ít nhất ba biến thể URL:

- `card`: dùng cho `MealCard`, `TemplateCard` và các list nhỏ
- `detail`: dùng cho `MealDetailScreen`, `TemplateDetailScreen`
- `original`: chỉ dùng khi thật sự cần file gốc hoặc admin flow

Biến thể khuyến nghị cho v1:

- `meal card`: `c_fill,g_center,w_240,h_240,f_auto,q_auto,dpr_auto`
- `meal detail`: `c_fill,g_center,w_1080,h_1080,f_auto,q_auto:good,dpr_auto`
- `template card`: `c_fill,g_center,w_640,h_360,f_auto,q_auto,dpr_auto`
- `template detail`: `c_fill,g_center,w_1600,h_900,f_auto,q_auto:good,dpr_auto`
- `original`: không áp crop tỷ lệ; chỉ dùng khi cần file gốc hoặc admin flow

Lưu ý:

- V1 không dùng named transformations; backend sẽ build transformation params ở một chỗ duy nhất.
- Card/detail dùng `g_center` để crop vào trung tâm khi ảnh nguồn sai tỷ lệ mục tiêu.
- Flow mặc định không gọi raw original ở màn detail.

## Contract backend khuyến nghị

Để mobile không phải tự dựng URL Cloudinary, nên trả về cả `*_image_key` lẫn `*_image_urls`.

Quy ước naming ở bước 2:

- `meal` tiếp tục giữ response field theo `snake_case` để bám contract hiện có.
- `meal-template` tiếp tục giữ response field theo `camelCase` để nhất quán với contract template hiện tại.

Ví dụ với `meal`:

```json
{
  "id": 42,
  "name": "Chicken Salad",
  "meal_image_key": "meals/42/cover",
  "meal_image_urls": {
    "card": "https://res.cloudinary.com/...",
    "detail": "https://res.cloudinary.com/...",
    "original": "https://res.cloudinary.com/..."
  }
}
```

Ví dụ với `template`:

```json
{
  "id": "uuid-template",
  "name": "Eat Clean 7 Days",
  "templateImageKey": "templates/uuid-template/cover",
  "templateImageUrls": {
    "card": "https://res.cloudinary.com/...",
    "detail": "https://res.cloudinary.com/...",
    "original": "https://res.cloudinary.com/..."
  }
}
```

## Upload flow khuyến nghị cho v1

Khuyến nghị dùng flow `signed upload trực tiếp từ mobile lên Cloudinary`, backend chỉ cấp chữ ký và persist `public_id`.

Luồng đề xuất:

1. Mobile chọn ảnh từ thiết bị.
2. Mobile gọi backend để lấy upload signature và `public_id` đích.
3. Mobile upload file gốc trực tiếp lên Cloudinary bằng `FormData`.
4. Cloudinary trả về `public_id`, `version`, `secure_url`.
5. Mobile gọi API backend để lưu `meal_image_key` hoặc `template_image_key`.
6. Các API read của backend trả về `*_image_key` và `*_image_urls` cho mobile render.

Lợi ích của flow này:

- backend không phải relay file binary lớn
- giảm tải băng thông cho server NestJS
- vẫn giữ được auth và naming policy qua bước ký upload
- phù hợp với Cloudinary hơn so với việc tự host file upload relay ở backend

## Nguồn cập nhật ảnh `meal` trong phase hiện tại

- Ảnh `meal` không đi qua flow create/edit trên mobile app ở phase này.
- `meal_image_key` sẽ được gán bằng seed riêng tách biệt với seed mặc định hiện tại hoặc upload trực tiếp lên Cloudinary theo quy trình vận hành riêng.
- Backend chỉ cần đọc `meal_image_key` đã có và trả các biến thể URL phù hợp cho mobile render.
- Nếu sau này mở admin flow cho `meal`, có thể tái sử dụng cùng media service và contract ảnh đã xây ở phase này.

## Checklist triển khai theo lớp

### A. Cloudinary

- [x] Tạo Product Environment trên Cloudinary cho dự án.
- [x] Lấy và lưu `cloud_name`, `api_key`, `api_secret` cho backend.
- [x] Chốt folder convention:
- [x] `meals/<mealId>/cover`
- [x] `templates/<templateId>/cover`
- [x] Chốt allowed formats cho v1: `jpg`, `jpeg`, `png`, `webp`. **Chốt: jpg, jpeg, png**
- [x] Chốt max file size cho upload từ mobile. **Chốt: Max 5MB**
- [x] Chốt có dùng overwrite cùng `public_id` khi thay ảnh.
- [x] Chốt aspect ratio và crop strategy:
- [x] `meal card` và `meal detail`: `1:1`
- [x] `template card` và `template detail`: `16:9`
- [x] card/detail crop vào trung tâm, `original` giữ nguyên tỷ lệ
- [x] Chốt có tạo named transformations cho `meal_card`, `meal_detail`, `template_card`, `template_detail` hay không. **Không, sẽ build URL bằng params trong code, nhưng chỉ ở một chỗ duy nhất trong backend**
- [x] Chốt policy xóa asset:
- [x] thay ảnh thì xóa asset cũ tương ứng
- [x] xóa template thì xóa asset template tương ứng
- [x] không tự động xóa asset meal khi seed đổi hoặc meal bị xóa
- [ ] Nếu muốn quản trị tốt hơn trên dashboard, thêm tag/context như `entityType`, `entityId`, `ownerId`.

### B. `packages/database`

- [x] Không bắt buộc thêm cột mới nếu tái sử dụng `meal_image_key` và `template_image_key`.
- [ ] Ghi rõ trong tài liệu kỹ thuật và code comment rằng hai field này lưu Cloudinary `public_id`, không phải URL.
- [ ] Rà soát seed hiện tại cho `meal` để xác định món nào có ảnh, món nào để `null`.
- [ ] Nếu cần hỗ trợ metadata về sau như `alt`, `width`, `height`, `dominantColor`, cân nhắc tách sang phase sau thay vì thêm ngay.

### C. `packages/shared`

- [x] Mở rộng contract `meal search` để trả thêm `meal_image_urls`.
- [x] Mở rộng contract `meal detail` để trả thêm `meal_image_urls`.
- [x] Mở rộng contract `meal-template` list response để trả `templateImageKey`.
- [x] Mở rộng contract `meal-template` detail response để trả `templateImageKey`.
- [x] Mở rộng contract `meal-template` list/detail để trả thêm `templateImageUrls`.
- [x] Nếu upload lưu qua endpoint riêng, thêm schema request/response cho flow ký upload ảnh.
- [x] Nếu dùng endpoint persist ảnh riêng, thêm schema cho `PATCH template image` và `PATCH meal image`.
- [x] Build lại `@meal/shared` sau khi đổi schema.

### D. Backend `services/main-backend`

#### D1. Dependency và config

- [x] Cài Cloudinary SDK cho backend.
- [x] Thêm config env:
- [x] `CLOUDINARY_CLOUD_NAME`
- [x] `CLOUDINARY_API_KEY`
- [x] `CLOUDINARY_API_SECRET`
- [x] Tạo `MediaModule` hoặc `CloudinaryModule` riêng thay vì nhúng logic URL vào từng feature service.

#### D2. Service chung cho ảnh

- [x] Tạo service chung để:
- [x] build URL theo biến thể `card`, `detail`, `original`
- [x] sinh signed upload params cho mobile
- [x] chuẩn hóa folder/public_id theo entity type
- [x] validate entity type hợp lệ: `meal` hoặc `template`
- [x] Nếu dùng overwrite, xử lý invalidate cache đúng cách khi thay ảnh.

#### D3. Meal APIs

- [x] Cập nhật `meal-search.service.ts` để trả `meal_image_urls` từ `meal_image_key`.
- [x] Cập nhật các schema/response test liên quan tới `GET /api/v1/meals`.
- [x] Cập nhật `getMealById(...)` để trả `meal_image_urls`.
- [x] Thêm test cho case `meal_image_key = null` và case có ảnh thật.
- [x] Bổ sung e2e test cho `GET /api/v1/meals` và `GET /api/v1/meals/:id` với `meal_image_urls`.
- [x] Chốt nguồn cập nhật ảnh `meal`: seed riêng hoặc upload trực tiếp lên Cloudinary ngoài mobile app phase hiện tại.
- [ ] Chuẩn hóa seed/script/quy trình vận hành để gán `meal_image_key` cho meal.
- [ ] Phase hiện tại chưa cần mở endpoint/mobile UI riêng để chỉnh ảnh `meal`.

#### D4. Template APIs

- [x] Mở rộng `meal-template` list response để trả `templateImageKey` và `templateImageUrls`.
- [x] Mở rộng `meal-template` detail response để trả `templateImageKey` và `templateImageUrls`.
- [x] Bổ sung e2e test cho `GET /api/v1/meal-templates` và `GET /api/v1/meal-templates/:id` với `templateImageUrls`.
- [x] Mở rộng create/update template flow để có thể persist `template_image_key`.
- [x] Thêm endpoint chuyên biệt `PATCH /api/v1/meal-templates/:id/image` để cập nhật cover sau upload.
- [x] Thêm endpoint cấp signed upload params cho template cover.
- [x] Bổ sung unit test và e2e test cho image update flow.

#### D5. OpenAPI

- [ ] Regenerate `services/main-backend/docs/openapi.json` sau khi contract ảnh ổn định.

### E. Mobile app `apps/mobile-app`

#### E1. Dependency và utility

- [x] Cài `expo-image-picker` để chọn ảnh từ thư viện thiết bị.
- [ ] Nếu cần resize/crop sơ bộ trước khi upload, cân nhắc thêm `expo-image-manipulator`. **Khong dùng, sẽ để Cloudinary xử lý crop/resize theo biến thể đã chốt**
- [x] Tạo utility/API riêng cho upload ảnh Cloudinary, không nhúng vào `meal.api.ts` hoặc `template.api.ts` quá sâu.
- [ ] Tạo type chung cho image asset response từ backend.

#### E2. Meal UI

- [x] Cập nhật `MealCard` để render ảnh thật từ `meal_image_urls.card`.
- [x] Cập nhật `MealDetailScreen` để render ảnh thật từ `meal_image_urls.detail`.
- [x] Dùng fallback `default-meal.jpg` khi `meal_image_key` hoặc URL bị thiếu/lỗi.
- [ ] Nếu muốn đồng bộ hơn, cân nhắc hiển thị thumbnail meal ở các row như menu/template item sau khi contract meal item đủ dữ liệu ảnh.

#### E3. Template UI

- [x] Cập nhật `TemplateCard` để render `templateImageUrls.card` thay cho placeholder.
- [x] Cập nhật `TemplateDetailScreen` để render `templateImageUrls.detail`.
- [x] Bổ sung preview ảnh trong `TemplateEditor`.
- [x] Bổ sung action chọn/thay/xóa ảnh ở màn create/edit template.
- [x] Dùng fallback `default-template.jpg` khi `templateImageKey` hoặc URL bị thiếu/lỗi.
- [x] Khi create template mới, xử lý thứ tự: tạo template trước để lấy `templateId`, sau đó upload cover và persist `templateImageKey`.
- [x] Khi edit template, cho phép thay ảnh mà không ảnh hưởng các day/item hiện có.

#### E4. Upload flow trên mobile

- [x] Tạo API call lấy signed upload params từ backend.
- [x] Upload file local lên Cloudinary bằng `FormData`.
- [ ] Hiển thị trạng thái `uploading`, `success`, `error`.
- [ ] Nếu upload thành công nhưng persist backend thất bại, hiển thị lỗi rõ ràng và cho phép retry.
- [ ] Nếu user rời màn create/edit giữa chừng, quyết định rõ có cho phép bỏ ảnh vừa upload nhưng chưa persist hay không.

### F. Kiểm thử và QA

- [ ] Upload ảnh template mới từ mobile.
- [ ] Thay ảnh template hiện có.
- [ ] Mở `TemplateCard` và xác nhận dùng ảnh nhẹ hơn.
- [ ] Mở `TemplateDetailScreen` và xác nhận dùng ảnh chất lượng cao hơn.
- [ ] Mở `MealCard` và xác nhận dùng ảnh nhẹ hơn.
- [ ] Mở `MealDetailScreen` và xác nhận dùng ảnh chất lượng cao hơn.
- [ ] Kiểm tra fallback `default-meal.jpg` khi `meal_image_key` là `null` hoặc URL lỗi.
- [ ] Kiểm tra fallback `default-template.jpg` khi `template_image_key` là `null` hoặc URL lỗi.
- [ ] Kiểm tra fallback khi Cloudinary URL bị lỗi hoặc asset bị xóa.
- [ ] Kiểm tra thay ảnh liên tiếp và xác nhận CDN không giữ bản cũ sai ngoài ý muốn.
- [ ] Kiểm tra ảnh quá lớn, sai định dạng hoặc upload thất bại mạng.
- [ ] Kiểm tra lại search/list performance sau khi render ảnh thật.

## Các quyết định đã chốt

### 1. Nguồn quản trị ảnh cho `meal`

- Ảnh `meal` được gán qua seed riêng tách biệt với file seed mặc định hiện tại hoặc upload trực tiếp lên Cloudinary.
- Phase hiện tại không mở flow create/edit `meal` trên mobile app.

### 2. Màn detail có dùng file gốc raw thật hay dùng bản `detail` tối ưu

- Card dùng biến thể `card`.
- Detail dùng biến thể `detail` tối ưu.
- File gốc raw chỉ giữ cho admin/reprocess.

### 3. Quy tắc crop/aspect ratio

- `meal card` và `meal detail` dùng tỷ lệ `1:1`.
- `template card` và `template detail` dùng tỷ lệ `16:9`.
- Nếu user tải ảnh sai tỷ lệ, hệ thống tự động crop vào trung tâm.
- Ảnh `original` giữ nguyên tỷ lệ gốc được tải lên.

### 4. Quy tắc thay ảnh

- Thay ảnh bằng overwrite cùng `public_id`.

### 5. Xóa asset trên Cloudinary

- Khi user thay ảnh, xóa asset cũ tương ứng trên Cloudinary.
- Khi xóa template, xóa asset template tương ứng.
- Khi `meal` bị xóa hoặc seed bị đổi, không tự động xóa asset để tránh mất dữ liệu ngoài ý muốn.

### 6. Ảnh mặc định

- Dùng fallback cục bộ `default-meal.jpg` và `default-template.jpg` trong `apps/mobile-app/assets/images`.

## Thứ tự thực hiện khuyến nghị
1. Tạo Cloudinary environment, naming convention và transformation strategy theo các quyết định đã chốt.
2. Mở rộng shared contract cho `meal` và `template`.
3. Tạo service backend chung để build URL và ký upload.
4. Nối backend read APIs để trả `*_image_urls`.
5. Nối mobile render ảnh thật cho `meal` và `template`.
6. Hoàn thiện upload flow template trên mobile.
7. Chuẩn hóa seed/script hoặc quy trình vận hành riêng cho ảnh `meal`.
8. Bổ sung test, manual QA và OpenAPI.

## Kết luận

Với hướng Cloudinary hiện tại, phần quan trọng nhất là giữ cho database chỉ lưu `public_id`, còn toàn bộ logic biến thể ảnh nằm ở backend. Cách này giúp `meal` và `template` cùng dùng một chiến lược resize/delivery thống nhất, đồng thời giữ cho mobile đơn giản hơn khi render card và detail.

Hiện tại không còn blocker nghiệp vụ mở trong tài liệu này. Phần còn lại chủ yếu là hoàn thiện manual QA, regenerate OpenAPI và chuẩn hóa quy trình nạp ảnh cho `meal`.
