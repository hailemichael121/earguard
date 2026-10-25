const rnPreset = require('@react-native/jest-preset/jest-preset');

module.exports = {
  ...rnPreset,
  setupFiles: [],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/native/**',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(\\.pnpm/.+)?((jest-)?react-native|@react-native(-community)?))',
  ],
  moduleNameMapper: {
    ...rnPreset.moduleNameMapper,
    '\\.(png|jpg|jpeg|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
