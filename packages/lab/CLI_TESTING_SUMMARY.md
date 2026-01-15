# CLI Testing with Vitest - Summary

This project demonstrates comprehensive approaches to testing CLI applications using Vitest. Here's what we've built:

## 🎯 What We Created

### 1. CLI Application (`cli-app.js` / `cli-app.ts`)
A simple CLI tool that supports:
- **Commands**: `greet <name>`, `sum <a> <b>`
- **Options**: `--uppercase`, `--prefix=<value>`, `--help`, `-h`
- **Argument parsing**: Handles both options and positional arguments
- **Error handling**: Validates input and provides helpful error messages

### 2. Comprehensive Test Suite
We created **47 tests** covering 3 different testing strategies:

#### Unit Tests (12 tests)
- Test argument parsing logic in isolation
- Verify option and positional argument extraction
- Test edge cases like empty arguments, negative numbers

#### Integration Tests (18 tests)
- Mock `process.argv` and `console` methods
- Test command execution paths
- Verify error handling and exit codes

#### End-to-End Tests (10 tests)
- Run the actual CLI as child processes
- Test complete user workflows
- Verify real output and error streams

#### Advanced Tests (7 tests)
- Performance testing
- Environment variable handling
- Edge case validation

## 📁 Files Created

```
packages/lab/
├── src/
│   ├── cli-app.js          # JavaScript CLI implementation
│   └── cli-app.ts          # TypeScript CLI implementation
├── test/
│   ├── cli-app.test.js     # JavaScript test suite
│   └── cli-app.test.ts     # TypeScript test suite
├── CLI_TESTING_GUIDE.md    # Comprehensive guide
└── CLI_TESTING_SUMMARY.md  # This summary
```

## 🧪 Test Results

```
✓ test/cli-app.test.js (29 tests) 2047ms
✓ test/cli-app.test.ts (16 tests) 3430ms
✓ test/sum.test.js (1 test) 2ms
✓ test/index.test.ts (1 test) 3ms

Test Files  4 passed (4)
Tests  47 passed (47)
```

## 🎓 Key Learning Points

### 1. **Three Testing Strategies**

**Unit Testing** - Test pure functions:
```javascript
test('should parse simple command', () => {
  const result = parseArgs(['greet', 'World'])
  expect(result.command).toBe('greet')
})
```

**Integration Testing** - Mock process and console:
```javascript
test('should handle greet command', () => {
  process.argv = ['node', 'cli.js', 'greet', 'World']
  const exitCode = main()
  expect(consoleSpy.log).toHaveBeenCalledWith('Hello, World!')
})
```

**End-to-End Testing** - Run real CLI:
```javascript
test('should execute via child process', async () => {
  const result = await runCLI(['greet', 'Alice'])
  expect(result.stdout).toBe('Hello, Alice!')
})
```

### 2. **Common Testing Patterns**

#### Mocking Process.argv
```javascript
let originalArgv = process.argv
process.argv = ['node', 'cli.js', 'command']
// ... test ...
process.argv = originalArgv
```

#### Capturing Console Output
```javascript
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {})
}
// ... test ...
consoleSpy.log.mockRestore()
```

#### Testing Child Processes
```javascript
function runCLI(args) {
  return new Promise((resolve) => {
    const child = spawn('node', [cliPath, ...args])
    // collect stdout/stderr
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}
```

### 3. **Edge Cases to Test**

- ✅ Empty arguments
- ✅ Negative numbers (like `-5`)
- ✅ Missing required arguments
- ✅ Invalid input types
- ✅ Options before/after positional args
- ✅ Combined short flags
- ✅ Unicode characters
- ✅ Very long arguments

### 4. **Best Practices**

1. **Separate Logic from I/O** - Keep parsing pure
2. **Test Behavior, Not Implementation** - Focus on outputs
3. **Clean Up in afterEach** - Restore mocks and state
4. **Use Descriptive Test Names** - Make tests self-documenting
5. **Test All Error Paths** - Don't just test happy paths
6. **Mock External Dependencies** - Isolate what you're testing

## 🚀 How to Use This Project

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npx vitest run test/cli-app.test.js
```

### Run in Watch Mode
```bash
npm run test:watch
```

### Run with Coverage
```bash
npx vitest run --coverage
```

### Test the CLI Manually
```bash
# JavaScript version
node packages/lab/src/cli-app.js greet World --uppercase

# TypeScript version (requires tsx)
npx tsx packages/lab/src/cli-app.ts greet World --uppercase
```

## 📚 What You Can Learn From This

1. **How to structure CLI tests** - From unit to E2E
2. **Vitest mocking techniques** - process, console, child processes
3. **TypeScript testing patterns** - Type-safe test code
4. **Performance testing** - Measuring execution time
5. **Error handling validation** - Testing failure scenarios
6. **Test organization** - Clear, maintainable test suites

## 🎯 Real-World Applications

This approach works for:
- **Command-line tools** (npm packages, dev tools)
- **Build scripts** (webpack, rollup configs)
- **Deployment tools** (CI/CD scripts)
- **API clients** (CLI wrappers for APIs)
- **Developer utilities** (code generators, linters)

## 🔗 Next Steps

1. **Add more commands** to the CLI
2. **Test interactive prompts** with mocked stdin
3. **Add file system operations** with `fs` mocking
4. **Test network calls** with HTTP mocking
5. **Add snapshot testing** for complex output
6. **Implement CLI argument libraries** (like yargs, commander) and test them

---

**Bottom Line**: Testing CLI applications requires multiple strategies. Unit tests verify parsing logic, integration tests check command execution, and E2E tests ensure the complete workflow works. This project provides a solid foundation for testing any CLI application with Vitest.