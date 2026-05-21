# Tài liệu cấu trúc thư mục - Mobile App (Expo)

## 1. Mục tiêu
Tài liệu này mô tả cấu trúc thư mục hiện tại của `apps/mobile-app` và quy ước tổ chức mã nguồn đang áp dụng sau khi chuyển sang Expo Router.

## 2. Cấu trúc thực tế hiện tại (04/2026)

```text
apps/mobile-app/
├─ app.json
├─ package.json
├─ babel.config.js                  (Config tối ưu biên dịch để tối ưu hóa tamagui)
├─ metro.config.js                  (Cấu hình bộ đóng gói mã nguồn, hiện đang scaffold)
├─ tamagui.config.ts
├─ tsconfig.json                    (Cấu hình TypeScript, chứa thêm Path Aliases)
├─ assets/                          (Chứa tài nguyên tĩnh như font, image...)
│  ├─ fonts/
│  └─ images/
├─ docs/                            (Chứa tài liệu liên quan đến dự án, có thể mở rộng thêm khi cần)
│  ├─ KitchenMind-UI.pen            (File thiết kế chính của UI, có thể mở bằng Pencil Extension)
│  └─ project-structure.md
└─ src/
   ├─ app/                          (Chứa route files và route groups theo chuẩn Expo Router)
   │  ├─ _layout.tsx                (Route layout gốc, wrapper bọc lấy tất cả các màn hình khác)
   │  ├─ index.tsx                  (Route gốc "/")
   │  ├─ (auth)/
   │  └─ (tabs)/
   ├─ components/                   (Chứa component chung như Button, Input, Card, Tag...)
   ├─ features/                     (Từng feature domain có cấu trúc thư mục như ví dụ bên)
   │  └─ meals/                     (Tên feature: meal, profile...)
   │     ├─ api/                    (Chứa adapter gọi API dùng axios)
   │     ├─ components/             (Chứa component chỉ dùng trong feature này)
   │     ├─ hooks/                  (Chứa custom hooks chỉ dùng trong feature này)
   │     ├─ screens/                (các màn hình, modal, dialog... của feature này)
   │     ├─ constants.ts            (nếu có hằng số riêng của feature)
   │     └─ types.ts                (Định nghĩa type riêng của feature, nếu cần)
   ├─ providers/                    (Chứa provider cấp app, hiện tại là AppProviders.tsx)
   ├─ services/                     (Chứa service layer, ví dụ như API service, utility functions...)
   ├─ store/                        (Chứa các "kho" dữ liệu mà nhiều feature cùng cần.)
   ├─ theme/                        (Chứa theme, design tokens, fonts... nếu không đặt trong tamagui.config.ts)
   └─ utils/                        (Chứa các functions dùng chung, ví dụ formatDate, calculateCalories...)
```

## 3. Kiến trúc điều hướng và entrypoint

- Runtime entrypoint dùng Expo Router qua `main: "expo-router/entry"` trong `package.json`.
- File-based routing đặt tại `src/app`.
- Root layout nằm ở `src/app/_layout.tsx`, dùng để mount provider dùng chung (`AppProviders`) và khai báo `Stack` chung.
- Route gốc `/` nằm ở `src/app/index.tsx`.
- `src/app/(tabs)` hiện chứa app shell chính, trong đó có profile tab dùng dữ liệu backend thật.
- `src/app/onboarding` chứa flow onboarding nhiều bước cho first-time user.
- `src/app/profile` chứa các route chỉnh sửa profile như `edit-user-info`, `edit-preference`, `edit-metric`, `edit-allergy`, `edit-favorite-ingredient`.
- Root route guard trong `src/app/_layout.tsx` đang phân luồng giữa auth screens, onboarding flow và app chính dựa trên `session` + `isOnboardingCompleted`.

Lưu ý: Không còn dùng mô hình entry cũ kiểu `registerRootComponent` với `App.tsx` và `index.ts` ở root.

## 4. Vai trò các thư mục chính

### 4.1 Root level
- `app.json`: Cấu hình Expo app (name, icon, splash, android/ios/web).
- `package.json`: Scripts, dependencies và entrypoint của app.
- `babel.config.js`, `metro.config.js`, `tsconfig.json`: Cấu hình build/runtime.
- `tamagui.config.ts`: Design tokens, fonts và theme của Tamagui.

### 4.2 src/app
- Chứa route files và route groups theo chuẩn Expo Router.
- Route file chỉ nên làm nhiệm vụ điều hướng/mount screen, không chứa business logic nặng.

### 4.3 src/features
- Chứa business logic và UI theo domain.
- Hiện đang có ít nhất `auth` và `profile` với cấu trúc feature khá đầy đủ gồm `api`, `screens`, `types`, `utils`, và onboarding-specific state/provider cho `profile`.

### 4.4 src/providers
- Chứa provider cấp app, hiện tại gồm `AppProviders.tsx` và `AuthProvider.tsx`.
- `AppProviders` chịu trách nhiệm mount Tamagui theme và auth session provider cho toàn bộ app.
- `AuthProvider` là nguồn session hiện tại, đồng thời cấp `isAuthenticated`, `isOnboardingCompleted`, `refreshSession()` cho route guard và onboarding flow.

### 4.5 src/components, src/services, src/store, src/theme, src/utils
- Là các khu vực nền tảng đã có implementation thực tế.
- `src/services/api` hiện chứa API client/wrapper dùng cho mobile app.
- `src/components` đã có các input/button/select/tag dùng xuyên suốt auth, onboarding và profile.
- `src/utils` và feature-level `utils` hiện được dùng cho adapter/conversion logic và testable helpers.

## 5. Quy tắc tổ chức mã nguồn

### 5.1 Dependency direction

```text
src/app (routes/layouts) -> src/features -> src/services -> src/utils
src/components -> src/utils
```

Nguyên tắc:
- `src/services` không import từ `src/features`.
- Route files trong `src/app` không chứa business logic nặng.
- Tái sử dụng qua `src/components` hoặc `src/utils` khi có từ 2 feature trở lên dùng chung.

### 5.2 Quy tắc import và đặt tên
- Ưu tiên alias `@/` thay cho relative path dài.
- Component/screen dùng `PascalCase.tsx`.
- Hook dùng `useXxx.ts`.
- Utility/service dùng tên ngữ nghĩa rõ ràng.

## 6. Quy trình thêm feature mới

Ví dụ thêm feature `metrics`:
1. Tạo `src/features/metrics`.
2. Tạo các nhánh con cần thiết: `api`, `hooks`, `components`, `screens`, `types.ts` (nếu cần).
3. Đăng ký route trong `src/app` (ví dụ `src/app/(tabs)/metrics.tsx` hoặc `src/app/metrics/index.tsx`).
4. Nếu cần state dùng chung, thêm vào `src/store`.
5. Nếu cần gọi API, đặt adapter ở `src/services` hoặc `src/features/metrics/api`.

## 7. Ghi chú cập nhật tài liệu

- Tài liệu này ưu tiên phản ánh **cấu trúc đang tồn tại**.
- Khi thêm/xóa thư mục ở `src` hoặc đổi route groups trong `src/app`, cần cập nhật lại mục 2 ngay trong cùng PR.
