# Testing Guide

## Test Example Usage

```json
{
  "scripts": {
    "test:unit": "npm run test -- tests/unit/",
    "test:integration": "npm run test -- tests/integration/",
    "test:e2e": "npm run test -- tests/e2e/",
    "test:watch": "npm run test -- --watch",
    "test:coverage": "npm run test -- --coverage",
    "test:ci": "npm run test -- --ci --coverage"
  }
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Test Structure

- Unit Tests: Test individual modules in isolation
- Integration Tests: Test interactions between modules
- E2E Tests: Test the CLI as a whole

## Writing Tests

### Unit Test Example

```js
import { describe, it, expect } from '@jest/globals';
import { Logger } from '../src/utils/logger.js';

describe('Logger', () => {
  it('should log info messages', () => {
    const logger = new Logger();
    const consoleSpy = jest.spyOn(console, 'log');
    
    logger.info('Test message');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Test message')
    );
  });
});
```

### Integration Test Example

```js
import { TestEnvironment } from '../tests/utils/test-helpers.js';

describe('Build Command', () => {
  let testEnv;
  
  beforeEach(async () => {
    testEnv = new TestEnvironment();
    await testEnv.create();
  });
  
  afterEach(async () => {
    await testEnv.destroy();
  });
  
  it('should build packages in dependency order', async () => {
    // Setup test environment
    await testEnv.createPackage('utils');
    await testEnv.createPackage('ui', { utils: '^1.0.0' });
    
    // Test the build command
    // ...
  });
});
```

### Mocking

```js
// Mock external dependencies
jest.mock('execa');
jest.mock('fs-extra');

// Mock specific functions
const mockReadJson = jest.fn();
jest.mock('fs-extra', () => ({
  readJson: mockReadJson
}));
```

## Code Coverage

We aim for:

- 80%+ statement coverage
- 80%+ branch coverage
- 80%+ function coverage
- 80%+ line coverage

View coverage report: __open coverage/index.html__

This comprehensive test setup provides:

1. **Unit Tests**: For individual modules (Logger, Config, Graph, Builder)
2. **Integration Tests**: For command interactions
3. **E2E Tests**: For CLI end-to-end functionality
4. **Mock Utilities**: For consistent mocking
5. **Test Helpers**: For creating test environments
6. **Coverage Reports**: To track test coverage
7. **CI Integration**: Ready for CI/CD pipelines

The tests use modern ES6 syntax with Jest's ESM support and provide good coverage for all critical functionality.
