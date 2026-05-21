# 📘 Hướng dẫn sử dụng Tamagui Tokens

Tài liệu này tóm tắt cách sử dụng hệ thống Design Tokens được cấu hình trong `tamagui.config.ts`. Việc tuân thủ các token này giúp giao diện nhất quán và hỗ trợ tốt chế độ Light/Dark mode.

---

## 1. Hệ thống Màu sắc (Colors & Themes)

Luôn ưu tiên sử dụng **Theme Colors** (Màu theo chủ đề) thay vì gọi trực tiếp mã màu Jade hay Red để đảm bảo giao diện tự động chuyển đổi khi đổi chế độ sáng/tối.

### Theme Colors (Khuyên dùng)
| Token | Mô tả & Cách dùng |
| :--- | :--- |
| `$background` | Màu nền chính của ứng dụng. |
| `$surface` | Màu nền của các thành phần con như Card, Input, Modal. |
| `$primary` | Màu thương hiệu chính (Jade 6). Dùng cho Action Button, Active state. |
| `$danger` | Màu đỏ cảnh báo. Dùng cho nút xóa, thông báo lỗi. |
| `$text` | Màu chữ chính, có độ tương phản cao với nền. |
| `$textSubtle` | Màu chữ phụ, dùng cho caption hoặc nội dung ít quan trọng. |
| `$textInverse` | Màu chữ tương phản (thường là trắng) dùng trên nền màu đậm. |

### Mapping hiện tại theo Theme
| Token | Light | Dark |
| :--- | :--- | :--- |
| `$background` | `$gray1` | `$gray15` |
| `$surface` | `$gray3` | `$gray14` |
| `$surfaceHover` | `$gray4` | `$gray13` |
| `$surfacePress` | `$gray5` | `$gray12` |
| `$primary` | `$jade6` | `$jade6` |
| `$softPrimary` | `$jade1` | `$jade2` |
| `$text` | `$gray15` | `$gray1` |
| `$textSubtle` | `$gray10` | `$gray7` |
| `$textPrimary` | `$jade6` | `$jade6` |
| `$danger` | `$red6` | `$red6` |
| `$softDanger` | `$red1` | `$red2` |

### Raw Color Tokens (Sử dụng khi cần chỉ định màu cố định)
* **Jade ($jade1 - $jade11):** Dải màu xanh lá.
* **Red ($red1 - $red11):** Dải màu đỏ báo động.
* **Gray ($gray1 - $gray15):** Dải màu trung tính từ trắng đến đen.

---

## 2. Không gian & Kích thước (Space & Size)

Hệ thống tuân thủ Grid cơ bản để tạo nhịp điệu cho layout.

| Token | Giá trị | Trường hợp sử dụng |
| :--- | :--- | :--- |
| `$xs` | 4px | Khoảng cách cực nhỏ (như giữa icon và text). |
| `$sm` | 8px | Khoảng cách nhỏ, padding cho button nhỏ. |
| `$md` | 16px | **Tiêu chuẩn.** Padding cho container, khoảng cách giữa các phần tử. |
| `$lg` | 24px | Khoảng cách lớn giữa các khối nội dung. |
| `$xl` | 32px | Khoảng cách rất lớn cho các section lớn. |

---

## 3. Bo góc (Radius)

| Token | Giá trị | Trường hợp sử dụng |
| :--- | :--- | :--- |
| `$xs` | 4px | Các thành phần nhỏ như Checkbox, Tag. |
| `$sm` | 8px | Bo góc nhẹ cho Button nhỏ. |
| `$md` | 12px | Bo góc tiêu chuẩn cho Card, Image, Input. |
| `$lg` | 16px | Bo góc lớn cho Modal hoặc Bottom Sheet. |
| `$pill` | 999px | Bo tròn hoàn toàn (thường dùng cho Avatar hoặc Button hình kén). |

Lưu ý rằng app hạn chế sử dụng border width

---

## 🔡 4. Phông chữ (Typography)

### Font Families
- **Heading (`$heading`):** Sử dụng phông *BricolageGrotesque*.
- **Body (`$body`):** Sử dụng phông *DMSans* (Mặc định).

### Kích thước Font (Font Sizes)

Sử dụng `fos` (fontSize) kết hợp với các token sau:

| Token | Kích thước | Trường hợp sử dụng cụ thể |
| :--- | :--- | :--- |
| `$h1` | 40px | Tiêu đề về mặt thị giác khi screen cần cỡ chữ lớn (hạn chế dùng trong các màn hình có quy trình nghiệp vụ hoặc có các UI dạng danh sách) |
| `$h2` | 32px | Tiêu đề các phần lớn trong ứng dụng. |
| `$h3` | 24px | Tiêu đề các thẻ (Card title) hoặc Section quan trọng. |
| `$h4` / `$xl` | 20px | Tiêu đề phụ, sub-headings, top navigation |
| `$lg` | 16px | Nội dung chính cần nhấn mạnh, văn bản trong Button lớn. |
| **`$md`** | **14px** | **Kích thước mặc định (True)** cho văn bản body, mô tả, label. |
| `$sm` | 12px | Văn bản phụ (Caption), nhãn dưới icon. |
| `$xs` | 10px | Badge số lượng, ghi chú siêu nhỏ (Disclaimer). |

Lưu ý rằng từ `$h1` đến `$h4` là các token kích thước font dành riêng cho font Heading, còn từ `$xl` đến `$xs` là các token kích thước font dành riêng cho font Body.

---

### Độ đậm Font (Font Weights)

Sử dụng `fow` (fontWeight). Lưu ý các ghi chú về việc ánh xạ weight trong file config:

#### Đối với Heading ($heading)
* **`$bold` (700):** Dùng cho tiêu đề chính để tạo sự phân cấp rõ rệt.
* **`$medium` (500):** Dùng cho tiêu đề phụ hoặc khi tiêu đề chính nằm trên nền màu.
* **`$regular` (400):** Dùng khi tiêu đề dài hoặc cần sự thanh thoát.
* *Hạn chế dùng:* `$light` (vì giống 400) và `$semiBold` (vì giống 500).

#### Đối với Body ($body)
* **`$semiBold` (600):** Dùng để nhấn mạnh từ khóa trong đoạn văn hoặc nhãn Button.
* **`$medium` (500):** Dùng cho các thẻ danh mục, tên người dùng.
* **`$regular` (400):** Dùng cho toàn bộ nội dung văn bản dài.
* **`$light` (300):** Dùng cho các nội dung bổ trợ cần cảm giác nhẹ nhàng.
* *Hạn chế dùng:* `$bold` (vì hệ thống đang ánh xạ nó về weight 600).

**Việc ánh xạ này là do tamagui gộp chung weight của cả 2 font heading và body vào chung 1 hệ thống weight, nên cần có sự phân biệt rõ ràng để tránh nhầm lẫn khi sử dụng.**