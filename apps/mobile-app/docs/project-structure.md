# Tài liệu cấu trúc thư mục - Mobile App (Expo)

## 1. Mục tiêu
Tài liệu này định nghĩa cấu trúc thư mục chuẩn cho `apps/mobile-app` để:
- Dễ mở rộng khi số lượng màn hình và tính năng tăng.
- Tách bạch rõ UI, nghiệp vụ, hạ tầng.
- Giảm phụ thuộc chéo giữa các module.
- Giúp team thống nhất cách đặt file, cách import, cách tổ chức code.

## 2. Cấu trúc thư mục chuẩn

```text
apps/mobile-app/
├─ App.tsx
├─ index.ts
├─ app.json
├─ tamagui.config.ts
├─ assets/
│  ├─ fonts/
│  ├─ images/
│  └─ icons/
├─ docs/
│  └─ project-structure.md
└─ src/
   ├─ app/
   │  ├─ providers/
   │  │  └─ AppProviders.tsx
   │  ├─ navigation/
   │  │  └─ RootNavigator.tsx
   │  ├─ hooks/
   │  ├─ constants/
   │  └─ config/
   ├─ components/
   │  ├─ ui/
   │  └─ common/
   ├─ features/
   │  ├─ auth/
   │  │  ├─ api/
   │  │  ├─ hooks/
   │  │  ├─ components/
   │  │  ├─ screens/
   │  │  └─ types.ts
   │  ├─ meal/
   │  │  ├─ api/
   │  │  ├─ hooks/
   │  │  ├─ components/
   │  │  ├─ screens/
   │  │  └─ types.ts
   │  └─ profile/
   │     ├─ api/
   │     ├─ hooks/
   │     ├─ components/
   │     ├─ screens/
   │     └─ types.ts
   ├─ services/
   │  ├─ api/
   │  │  ├─ client.ts
   │  │  └─ endpoints.ts
   │  ├─ storage/
   │  └─ analytics/
   ├─ store/
   │  ├─ index.ts
   │  └─ slices/
   ├─ utils/
   ├─ types/
   ├─ i18n/
   └─ tests/
      ├─ unit/
      └─ integration/
```

## 3. Vai trò của từng thư mục

### 3.1 Cấp root của mobile-app
- `App.tsx`: Điểm vào UI chính. Chỉ nên chứa bootstrap ở mức cao (load font, provider, mount navigator).
- `index.ts`: Entry cho Expo runtime (`registerRootComponent`).
- `app.json`: Cấu hình Expo app (name, icon, splash, android/ios/web config).
- `tamagui.config.ts`: Design tokens, theme, font config cho Tamagui.

### 3.2 assets
- `assets/fonts`: Chứa file font tĩnh (`.ttf`, `.otf`).
- `assets/images`: Ảnh minh họa, banner, empty state, onboarding.
- `assets/icons`: Icon static (nếu không dùng icon library cho một số icon đặc thù thương hiệu).

### 3.3 docs
- `docs`: Chứa tài liệu kỹ thuật nội bộ của mobile app.

### 3.4 src/app
- `src/app/providers`: Tổng hợp các provider toàn cục (TamaguiProvider, QueryClientProvider, AuthProvider...).
- `src/app/navigation`: Điều phối luồng điều hướng chính (auth flow, main flow, tab/stack).
- `src/app/hooks`: Hook dùng toàn app (không gắn riêng một feature).
- `src/app/constants`: Hằng số dùng toàn app (route names, keys, regex dùng chung).
- `src/app/config`: Runtime config theo môi trường (base URL, feature flags).

### 3.5 src/components
- `src/components/ui`: Thành phần UI tái sử dụng theo design system (Button, Input, Card, Modal...).
- `src/components/common`: Thành phần dùng chung mức layout/khối chức năng nhỏ (ScreenContainer, SectionHeader...).

### 3.6 src/features
Mỗi thư mục trong `features` là một domain nghiệp vụ độc lập.

Ví dụ `src/features/auth`:
- `api`: Hàm gọi API riêng của auth.
- `hooks`: Hook nghiệp vụ auth.
- `components`: UI chỉ phục vụ auth.
- `screens`: Màn hình auth.
- `types.ts`: Kiểu dữ liệu cục bộ của auth.

Áp dụng tương tự cho `meal`, `profile`, và các feature mới trong tương lai.

### 3.7 src/services
- `src/services/api/client.ts`: HTTP client chung (axios/fetch wrapper), interceptor, timeout.
- `src/services/api/endpoints.ts`: Khai báo endpoint constants hoặc builder.
- `src/services/storage`: Trừu tượng hóa AsyncStorage/SecureStore.
- `src/services/analytics`: Gửi sự kiện tracking/logging.

### 3.8 src/store
- `src/store/index.ts`: Khởi tạo và export store chính.
- `src/store/slices`: Chia state theo lát cắt domain.

### 3.9 src/utils, src/types, src/i18n, src/tests
- `src/utils`: Hàm tiện ích thuần, không phụ thuộc UI.
- `src/types`: Kiểu dùng chung liên feature.
- `src/i18n`: Tài nguyên và setup đa ngôn ngữ.
- `src/tests/unit`: Test đơn vị.
- `src/tests/integration`: Test tích hợp theo luồng.

## 4. Quy định tổ chức mã nguồn

### 4.1 Quy định đặt file
- File chỉ dùng trong một feature phải nằm trong feature đó.
- Chỉ đẩy lên `components`, `services`, `utils`, `types` khi có từ hai feature trở lên cùng dùng.
- Không đặt business logic trong `src/components/ui`.

### 4.2 Quy định phụ thuộc (dependency direction)
Luồng phụ thuộc khuyến nghị:

```text
app -> features -> services -> utils/types
components/ui -> utils/types
```

Nguyên tắc:
- `services` không import từ `features`.
- `components/ui` không import từ `features`.
- Feature A không import trực tiếp implementation của Feature B.

### 4.3 Quy định import
- Ưu tiên alias path (ví dụ `@/features/...`) thay vì chuỗi relative dài.
- Mỗi feature nên có `index.ts` để export public API của feature.

### 4.4 Quy định tên
- Thư mục: `kebab-case`.
- File component/screen: `PascalCase.tsx`.
- File hook: `useXxx.ts`.
- File util/service/types: `camelCase.ts` hoặc tên ngữ nghĩa rõ ràng.

### 4.5 Quy định về màn hình và API
- `screens` chỉ điều phối UI + gọi hook, hạn chế gọi API trực tiếp.
- Mọi gọi API phải đi qua `features/*/api` hoặc `src/services/api`.

### 4.6 Quy định test
- Unit test cho util/hook/component nhỏ.
- Integration test cho luồng màn hình + state + API mock.

## 5. Quy trình thêm feature mới

Ví dụ thêm feature `metrics`:
1. Tạo `src/features/metrics`.
2. Tạo các nhánh con: `api`, `hooks`, `components`, `screens`, `types.ts`.
3. Đăng ký route trong `src/app/navigation`.
4. Nếu có state dùng chung, thêm slice vào `src/store/slices`.
5. Nếu có endpoint mới, bổ sung ở `src/features/metrics/api`.
6. Bổ sung test tối thiểu cho logic chính.

## 6. Ghi chú triển khai cho trạng thái hiện tại
- Hiện tại có thể chưa tạo đủ toàn bộ thư mục con trong `src`.
- Tài liệu này là chuẩn mục tiêu để tạo dần theo từng feature.
- Ưu tiên tạo đúng cấu trúc ngay từ feature đầu tiên để tránh refactor lớn về sau.
