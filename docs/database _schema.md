# Tài liệu Database - KitchenMind

## 1. Tổng quan

Dự án sử dụng:

- ORM: Prisma
- Database provider: PostgreSQL
- Schema nguồn: `packages/database/prisma/schema.prisma`

Cơ sở dữ liệu hiện tại tập trung vào 6 nhóm nghiệp vụ chính:

- Quản lý người dùng và xác thực
- Hồ sơ cá nhân và mục tiêu dinh dưỡng
- Nguyên liệu, dị ứng và nguyên liệu yêu thích
- Món ăn và thành phần món ăn
- Thực đơn theo ngày
- Meal template theo nhiều ngày

---

## 2. Enum trong hệ thống

### 2.1 `ProviderEnum`
Dùng cho bảng `user_providers`

- `local`
- `google`
- `facebook`

### 2.2 `ActivityLevel`
Dùng cho bảng `profiles`

- `high`
- `average`
- `low`

### 2.3 `Difficulty`
Dùng cho bảng `meals`

- `1`
- `2`
- `3`
- `4`
- `5`

Ghi chú:
- Đây là difficulty dạng level số, không phải `easy | medium | hard`.
- Ở tầng service/backend hiện đang map:
  - `1, 2` -> `easy`
  - `3` -> `medium`
  - `4, 5` -> `hard`

### 2.4 `MealTime`
Dùng cho `menu_items` và `meal_template_day_items`

- `breakfast`
- `lunch`
- `dinner`

---

## 3. Danh sách bảng

## 3.1 `users`
Lưu thông tin cơ bản của người dùng.

### Cột dữ liệu
- `id`: UUID, primary key
- `email`: varchar(254), unique
- `user_name`: varchar(50)
- `gender`: varchar(1)
- `date_of_birth`: date, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- 1 user có nhiều `user_providers`
- 1 user có thể có 1 `profile`
- 1 user có nhiều `metrics`
- 1 user có nhiều `allergies`
- 1 user có nhiều `favorite_ingredients`
- 1 user có nhiều `menus`
- 1 user có nhiều `meal_templates`

### Ghi chú
- Đây là bảng trung tâm của hệ thống người dùng.
- Hầu hết dữ liệu cá nhân khác đều liên kết qua `user_id`.

---

## 3.2 `user_providers`
Lưu cách người dùng đăng nhập vào hệ thống.

### Cột dữ liệu
- `id`: UUID, primary key
- `user_id`: UUID, foreign key -> `users.id`
- `provider`: enum `ProviderEnum`
- `provider_id`: text
- `password_hash`: varchar(255), nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Ý nghĩa
- Hỗ trợ nhiều cơ chế đăng nhập cho cùng một user.
- Với `local`, `password_hash` có thể được dùng.
- Với Google/Facebook, `provider_id` là định danh từ nhà cung cấp.

---

## 3.3 `profiles`
Lưu hồ sơ dinh dưỡng và định hướng cá nhân của người dùng.

### Cột dữ liệu
- `id`: UUID, primary key
- `user_id`: UUID, unique, foreign key -> `users.id`
- `diet_type`: int, foreign key -> `diet_types.id`
- `goal`: int, foreign key -> `goals.id`
- `cuisine_type`: int, foreign key -> `cuisine_types.id`
- `target_calories`: float, nullable
- `activity_level`: enum `ActivityLevel`, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- 1 profile thuộc đúng 1 user
- Nhiều profile có thể cùng tham chiếu 1 `diet_type`
- Nhiều profile có thể cùng tham chiếu 1 `goal`
- Nhiều profile có thể cùng tham chiếu 1 `cuisine_type`

### Ghi chú
- `user_id` là unique nên mỗi user chỉ có tối đa 1 profile.

---

## 3.4 `metrics`
Lưu lịch sử chỉ số cơ thể theo thời gian.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `user_id`: UUID, foreign key -> `users.id`
- `height_cm`: float
- `weight_kg`: float
- `bmi`: float
- `recorded_at`: timestamp

### Ý nghĩa
- Cho phép lưu nhiều bản ghi theo thời gian cho một user.
- Dùng cho tính toán/tracking thay đổi thể trạng.

---

## 3.5 `ingredients`
Danh mục nguyên liệu.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `name`: varchar(150), unique
- `calories`: float
- `protein`: float
- `fat`: float
- `fiber`: float
- `has_gluten`: boolean
- `is_vegetarian`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- 1 ingredient có thể xuất hiện trong nhiều `allergies`
- 1 ingredient có thể xuất hiện trong nhiều `favorite_ingredients`
- 1 ingredient có thể nằm trong nhiều `meal_ingredients`

### Ghi chú
- Đây là bảng quan trọng cho search/filter meal, allergy, favorite ingredient.

---

## 3.6 `allergies`
Bảng liên kết user và ingredient dị ứng.

### Cột dữ liệu
- `user_id`: UUID, foreign key -> `users.id`
- `ingredient_id`: int, foreign key -> `ingredients.id`
- `created_at`: timestamp

### Khóa
- Composite primary key: (`user_id`, `ingredient_id`)

### Ý nghĩa
- Một user có thể dị ứng nhiều nguyên liệu.
- Một nguyên liệu có thể là dị ứng của nhiều user.

---

## 3.7 `favorite_ingredients`
Bảng liên kết user và nguyên liệu yêu thích.

### Cột dữ liệu
- `user_id`: UUID, foreign key -> `users.id`
- `ingredient_id`: int, foreign key -> `ingredients.id`
- `created_at`: timestamp

### Khóa
- Composite primary key: (`user_id`, `ingredient_id`)

### Ý nghĩa
- Lưu danh sách nguyên liệu user thích hoặc hay dùng.

---

## 3.8 `meals`
Danh mục món ăn.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `name`: varchar(255)
- `meal_image_key`: text, nullable
- `description`: text
- `cuisine_type_id`: int, foreign key -> `cuisine_types.id`
- `difficulty`: enum `Difficulty`
- `cook_time_mins`: int
- `total_calories`: float
- `total_protein`: float
- `total_fat`: float
- `total_fiber`: float
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- Nhiều meal thuộc 1 `cuisine_type`
- 1 meal có nhiều `meal_ingredients`
- 1 meal có thể được dùng trong nhiều `menu_items`
- 1 meal có thể được dùng trong nhiều `meal_template_day_items`

### Ghi chú
- Đây là bảng lõi cho tính năng search meal, menu, template.
- Dữ liệu seed mặc định: `cuisine_type_id` sẽ trỏ tới `Việt Nam` nếu không chỉ định khác trong seed.

---

## 3.9 `meal_ingredients`
Bảng liên kết món ăn và nguyên liệu.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `meal_id`: int, foreign key -> `meals.id`
- `ingredient_id`: int, foreign key -> `ingredients.id`
- `quantity`: float

### Ý nghĩa
- Một món ăn có nhiều nguyên liệu.
- Một nguyên liệu có thể dùng cho nhiều món.
- Đây là bảng many-to-many có thêm thuộc tính `quantity`.

### Ghi chú
- Tính năng liệt kê nguyên liệu theo món ăn lấy dữ liệu chủ yếu từ bảng này.

---

## 3.10 `menus`
Thực đơn theo ngày của user.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `user_id`: UUID, foreign key -> `users.id`
- `date`: date
- `note`: text, nullable
- `total_calories`: float
- `total_protein`: float
- `total_fat`: float
- `total_fiber`: float
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- Nhiều menu thuộc 1 user
- 1 menu có nhiều `menu_items`

### Ý nghĩa
- Lưu kế hoạch ăn uống theo ngày.

---

## 3.11 `menu_items`
Chi tiết từng món trong một menu.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `menu_id`: int, foreign key -> `menus.id`
- `meal_id`: int, foreign key -> `meals.id`
- `meal_time`: enum `MealTime`
- `eated`: boolean
- `portion_size`: float

### Quan hệ
- Nhiều menu item thuộc 1 menu
- Nhiều menu item tham chiếu 1 meal

### Ghi chú
- `eated` có thể đang được hiểu là món đã ăn hay chưa.
- Tên cột nên cân nhắc đổi thành `is_eaten` để rõ nghĩa hơn trong tương lai.

---

## 3.12 `diet_types`
Danh mục chế độ ăn.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `name`: varchar(100)
- `description`: text, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- 1 diet type có nhiều profile

---

## 3.13 `goals`
Danh mục mục tiêu dinh dưỡng/sức khỏe.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `name`: varchar(100)
- `description`: text, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- 1 goal có nhiều profile

---

## 3.14 `cuisine_types`
Danh mục loại ẩm thực.

### Cột dữ liệu
- `id`: int, auto increment, primary key
- `name`: varchar(100)
- `description`: text, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Giá trị seed mặc định
- `General`
- `Việt Nam`
- `Châu Âu`
- `Nhật Bản`

### Quan hệ
- 1 cuisine type có nhiều profile
- 1 cuisine type có nhiều meals

---

## 3.15 `meal_templates`
Template meal plan nhiều ngày của user.

### Cột dữ liệu
- `id`: UUID, primary key
- `user_id`: UUID, foreign key -> `users.id`
- `template_image_key`: text, nullable
- `name`: varchar(100)
- `description`: text, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- Nhiều template thuộc 1 user
- 1 template có nhiều `meal_template_days`

---

## 3.16 `meal_template_days`
Chi tiết từng ngày trong một template.

### Cột dữ liệu
- `id`: UUID, primary key
- `template_id`: UUID, foreign key -> `meal_templates.id`
- `day_number`: int
- `note`: text, nullable
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- Nhiều day thuộc 1 template
- 1 day có nhiều `meal_template_day_items`

---

## 3.17 `meal_template_day_items`
Món ăn cụ thể trong từng ngày của template.

### Cột dữ liệu
- `id`: UUID, primary key
- `day_id`: UUID, foreign key -> `meal_template_days.id`
- `meal_id`: int, foreign key -> `meals.id`
- `meal_time`: enum `MealTime`
- `portion_size`: float
- `created_at`: timestamp
- `updated_at`: timestamp

### Quan hệ
- Nhiều item thuộc 1 template day
- Nhiều item tham chiếu 1 meal

---

## 4. Sơ đồ quan hệ nghiệp vụ

## 4.1 Nhóm người dùng
- `users` 1 - n `user_providers`
- `users` 1 - 1 `profiles`
- `users` 1 - n `metrics`
- `users` 1 - n `menus`
- `users` 1 - n `meal_templates`

## 4.2 Nhóm nguyên liệu
- `ingredients` 1 - n `allergies`
- `ingredients` 1 - n `favorite_ingredients`
- `ingredients` 1 - n `meal_ingredients`

## 4.3 Nhóm món ăn
- `meals` n - 1 `cuisine_types`
- `meals` 1 - n `meal_ingredients`
- `meals` 1 - n `menu_items`
- `meals` 1 - n `meal_template_day_items`

## 4.4 Bảng liên kết many-to-many
- `users` n - n `ingredients` qua `allergies`
- `users` n - n `ingredients` qua `favorite_ingredients`
- `meals` n - n `ingredients` qua `meal_ingredients`

---

## 5. Những ràng buộc quan trọng

### 5.1 Unique
- `users.email` là unique
- `profiles.user_id` là unique
- `ingredients.name` là unique

### 5.2 Composite Primary Key
- `allergies`: (`user_id`, `ingredient_id`)
- `favorite_ingredients`: (`user_id`, `ingredient_id`)

### 5.3 Cascade delete
Nhiều quan hệ đang dùng `onDelete: Cascade`, ví dụ:
- user bị xóa -> dữ liệu con như provider, profile, metric, allergy, favorite, menu, template sẽ bị xóa theo
- meal bị xóa -> meal ingredients bị xóa theo
- ingredient bị xóa -> allergy/favorite/meal ingredients bị xóa theo

### 5.4 Restrict
Một số quan hệ option/reference dùng mặc định restrict hoặc explicit restrict:
- profile -> diet type
- profile -> goal
- profile -> cuisine type
- meal -> cuisine type

Điều này giúp tránh xóa dữ liệu danh mục khi vẫn còn record phụ thuộc.

---

## 6. Mapping model Prisma sang tên bảng thực tế

| Prisma Model | Bảng DB |
|---|---|
| User | users |
| UserProvider | user_providers |
| Profile | profiles |
| Metric | metrics |
| Ingredient | ingredients |
| Allergy | allergies |
| FavoriteIngredient | favorite_ingredients |
| Meal | meals |
| MealIngredient | meal_ingredients |
| Menu | menus |
| MenuItem | menu_items |
| DietType | diet_types |
| Goal | goals |
| CuisineType | cuisine_types |
| MealTemplate | meal_templates |
| MealTemplateDay | meal_template_days |
| MealTemplateDayItem | meal_template_day_items |

---

## 7. Những phần đang phục vụ trực tiếp cho backend hiện tại

## 7.1 Meal Search
Các bảng liên quan:
- `meals`
- `meal_ingredients`
- `ingredients`
- `cuisine_types`

API search hiện tại dùng:
- tên món trong `meals.name`
- nguyên liệu thông qua `meal_ingredients` + `ingredients`
- cook time qua `meals.cook_time_mins`
- difficulty qua `meals.difficulty`

## 7.2 Allergy / Favorite Ingredient
Các bảng liên quan:
- `allergies`
- `favorite_ingredients`
- `ingredients`
- `users`

## 7.3 Menu
Các bảng liên quan:
- `menus`
- `menu_items`
- `meals`
- `users`

## 7.4 Profile
Các bảng liên quan:
- `profiles`
- `diet_types`
- `goals`
- `cuisine_types`
- `users`

---

## 8. Rủi ro và đề xuất cải thiện

## 8.1 Difficulty đang lưu theo enum số
- Hiện tại `Difficulty = 1..5`
- Ưu điểm: linh hoạt
- Nhược điểm: tầng business phải map thêm sang `easy/medium/hard`

Đề xuất:
- hoặc giữ nguyên và chuẩn hóa mapping ở service layer
- hoặc chuyển sang enum business-level nếu yêu cầu sản phẩm ổn định

## 8.2 Tên cột `eated`
- Tên này không tự nhiên trong tiếng Anh
- Đề xuất đổi thành:
  - `is_eaten`
  - hoặc `consumed`

## 8.3 Thiếu unique constraint theo nghiệp vụ ở vài bảng liên kết
Ví dụ:
- `meal_ingredients` chưa có unique composite `(meal_id, ingredient_id)`
- Điều này có thể cho phép cùng một nguyên liệu bị thêm nhiều lần vào cùng một món

Đề xuất:
- thêm unique composite nếu nghiệp vụ yêu cầu 1 nguyên liệu chỉ xuất hiện 1 lần trong 1 món

## 8.4 Thiếu tài liệu chuẩn về quantity
- `quantity` đang là `Float` nhưng chưa nói rõ đơn vị
- Có thể là gram, ml, unit, serving...

Đề xuất:
- thêm cột đơn vị hoặc định nghĩa chuẩn tại business layer

---

## 9. Kết luận

Schema hiện tại của KitchenMind đã bao phủ tốt các domain chính:

- User/Auth
- Profile/Nutrition
- Ingredients/Allergy/Favorite
- Meals/Search
- Menu planning
- Meal template

Đây là một schema khá phù hợp cho một hệ thống meal planner có yếu tố cá nhân hóa và gợi ý món ăn.
