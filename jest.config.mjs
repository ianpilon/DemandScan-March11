export default {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.mjs' }]
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.mjs'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts'
  ],
  moduleFileExtensions: ['js', 'jsx', 'json', 'node'],
  extensionsToTreatAsEsm: ['.jsx'],
  transformIgnorePatterns: [
    'node_modules/(?!(@babel/runtime)/)'
  ]
};
