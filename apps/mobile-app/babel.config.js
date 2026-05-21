module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        '@tamagui/babel-plugin',
        {
          config: 'tamagui.config.ts', // Chỉ đúng đường dẫn file config của bạn
          components: ['tamagui'],
          logTimings: true,
        },
      ],
      // Reanimated plugin phải luôn nằm cuối danh sách
      'react-native-reanimated/plugin',
    ],
  };
};