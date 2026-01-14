import { jest } from '@jest/globals';

// Global test setup
global.jest = jest;

// Mock console methods
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
});

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
const mockCwd = jest.spyOn(process, 'cwd');
const mockEnv = { ...process.env };

// Restore mocks after each test
afterEach(() => {
  mockExit.mockClear();
  process.env = { ...mockEnv };
});

// Clean up after all tests
afterAll(() => {
  mockExit.mockRestore();
  mockCwd.mockRestore();
});