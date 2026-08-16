const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  // e2e specs run via the Playwright runner, not Jest
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '/.kilo/'],
}

module.exports = createJestConfig(config)
