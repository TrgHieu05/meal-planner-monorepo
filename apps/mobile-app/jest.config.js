module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/assets/$1',
    '^@tamagui-config$': '<rootDir>/tamagui.config.ts',
    '^@components$': '<rootDir>/src/components/index.ts',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@meal/shared$': '<rootDir>/../../packages/shared/index.ts',
    '^@meal/shared/(.*)$': '<rootDir>/../../packages/shared/$1',
  },
  testPathIgnorePatterns: ['/node_modules/'],
};