module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  modulePathIgnorePatterns: ['/dist/'],
  setupFilesAfterEnv: ['./jest.setup.ts'],
};
