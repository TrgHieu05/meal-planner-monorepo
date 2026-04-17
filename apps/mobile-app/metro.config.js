const { getDefaultConfig } = require('expo/metro-config');
const { withTamagui } = require('@tamagui/metro-plugin');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
  // Kích hoạt hỗ trợ cho CSS (nếu bạn dùng Tamagui trên Web)
  isCSSEnabled: true,
});

// Bọc cấu hình mặc định của Expo bằng Plugin của Tamagui
module.exports = withTamagui(config, {
  components: ['tamagui'],
  config: './tamagui.config.ts',
  outputCSS: './tamagui.css', // Chỉ dùng cho bản Web
});