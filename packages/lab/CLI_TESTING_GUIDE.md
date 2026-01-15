# CLI Testing with Vitest - Complete Guide

This guide covers various approaches to testing CLI applications using Vitest, from simple unit tests to comprehensive end-to-end testing.

## Table of Contents
1. [Overview](#overview)
2. [Testing Strategies](#testing-strategies)
3. [Setup & Configuration](#setup--configuration)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [End-to-End Testing](#end-to-end-testing)
7. [Advanced Patterns](#advanced-patterns)
8. [Best Practices](#best-practices)

## Overview

Testing CLI applications requires different approaches compared to regular functions. You need to test:
- Argument parsing
- Command execution
- Output validation
- Error handling
- Exit codes
- User interactions

## Testing Strategies

### 1. Unit Testing (Isolated Logic)
Test individual functions like argument parsers in isolation.

### 2. Integration Testing (Process Simulation)
Test the main function by mocking `process.argv` and capturing console output.

### 3. End-to-End Testing (Real Execution)
Run the actual CLI as a child process and verify complete behavior.

## Setup & Configuration

### Basic Vitest Setup
```json
// package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0"
  }
}
```

### Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
```

## Unit Testing

### Testing Argument Parsers

```typescript
// src/cli-app.ts
export function parseArgs(args: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    command: null,
    options: {},
    positional: []
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      parsed.options[key] = value === undefined ? true : value
    } else if (arg.startsWith('-') && arg.length > 1) {
      const flags = arg.slice(1).split('')
      flags.forEach(flag => {
        parsed.options[flag] = true
      })
    } else {
      if (!parsed.command) {
        parsed.command = arg
      } else {
        parsed.positional.push(arg)
      }
    }
  }
  
  return parsed
}
```

```typescript
// test/cli-app.test.ts
import { expect, test, describe } from 'vitest'
import { parseArgs } from '../src/cli-app.js'

describe('parseArgs', () => {
  test('should parse simple command', () => {
    const args = ['greet', 'World']
    const result = parseArgs(args)
    
    expect(result.command).toBe('greet')
    expect(result.positional).toEqual(['World'])
  })

  test('should parse options with values', () => {
    const args = ['greet', 'World', '--prefix=Hi']
    const result = parseArgs(args)
    
    expect(result.options.prefix).toBe('Hi')
  })

  test('should parse short flags', () => {
    const args = ['greet', 'World', '-v', '-h']
    const result = parseArgs(args)
    
    expect(result.options.v).toBe(true)
    expect(result.options.h).toBe(true)
  })
})
```

## Integration Testing

### Mocking Process and Console

```typescript
// src/cli-app.ts
export function main(): number {
  const args = process.argv.slice(2)
  const parsed = parseArgs(args)
  
  if (parsed.options.help || parsed.options.h) {
    console.log(`Usage: cli-app [options] <command>`)
    return 0
  }
  
  // ... command logic
  console.log('Output')
  return 0
}
```

```typescript
// test/cli-app.test.ts
import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { main } from '../src/cli-app.js'

describe('main - Integration Tests', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    error: ReturnType<typeof vi.spyOn>
  }
  let originalArgv: string[]

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    }
    originalArgv = process.argv
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.error.mockRestore()
    process.argv = originalArgv
  })

  test('should show help with --help flag', () => {
    process.argv = ['node', 'cli-app.js', '--help']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'))
  })

  test('should handle command successfully', () => {
    process.argv = ['node', 'cli-app.js', 'greet', 'World']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Hello, World!')
  })

  test('should handle errors', () => {
    process.argv = ['node', 'cli-app.js', 'unknown']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: Unknown command: unknown')
  })
})
```

## End-to-End Testing

### Using Child Process

```typescript
// test/cli-app.test.ts
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const cliPath = join(__dirname, '../src/cli-app.js')

describe('CLI - End-to-End Tests', () => {
  function runCLI(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args])
      
      let stdout = ''
      let stderr = ''
      
      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })
      
      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })
      
      child.on('close', (code) => {
        resolve({ code: code ?? 0, stdout: stdout.trim(), stderr: stderr.trim() })
      })
      
      child.on('error', reject)
    })
  }

  test('should execute CLI successfully', async () => {
    const result = await runCLI(['greet', 'Alice'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('Hello, Alice!')
    expect(result.stderr).toBe('')
  })

  test('should handle errors in child process', async () => {
    const result = await runCLI(['unknown'])
    
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('Error: Unknown command')
  })
})
```

### Testing TypeScript CLI with tsx

```typescript
// For TypeScript files, use tsx
const cliPath = join(__dirname, '../src/cli-app.ts')

async function runTypeScriptCLI(args: string[]) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['tsx', cliPath, ...args])
    // ... same as above
  })
}
```

## Advanced Patterns

### 1. Testing with Environment Variables

```typescript
test('should respect environment variables', () => {
  const originalEnv = process.env
  process.env = { ...originalEnv, NODE_ENV: 'test' }
  
  process.argv = ['node', 'cli-app.js', 'greet', 'Test']
  const exitCode = main()
  
  expect(exitCode).toBe(0)
  
  process.env = originalEnv
})
```

### 2. Testing Exit Codes

```typescript
test('should exit with correct code', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`Process.exit(${code})`)
  })
  
  process.argv = ['node', 'cli-app.js', '--help']
  
  try {
    main()
  } catch (e) {
    // Expected
  }
  
  expect(mockExit).not.toHaveBeenCalled()
  mockExit.mockRestore()
})
```

### 3. Testing Interactive Prompts

```typescript
import readline from 'node:readline'

// Mock readline for interactive CLI
test('should handle interactive input', async () => {
  const mockInterface = {
    question: vi.fn().mockImplementation((query, callback) => {
      callback('user input')
    }),
    close: vi.fn()
  }
  
  vi.spyOn(readline, 'createInterface').mockReturnValue(mockInterface as any)
  
  // Test interactive command
  process.argv = ['node', 'cli-app.js', 'interactive']
  
  const exitCode = await main()
  
  expect(mockInterface.question).toHaveBeenCalled()
  expect(exitCode).toBe(0)
})
```

### 4. Testing with Large Input

```typescript
test('should handle large argument lists', () => {
  const largeArgs = Array.from({ length: 1000 }, (_, i) => `arg${i}`)
  
  const start = performance.now()
  const result = parseArgs(largeArgs)
  const end = performance.now()
  
  expect(result.positional.length).toBe(1000)
  expect(end - start).toBeLessThan(100) // Performance test
})
```

### 5. Testing Command Subcommands

```typescript
describe('Subcommand Testing', () => {
  test('should handle nested commands', () => {
    process.argv = ['node', 'cli.js', 'config', 'set', 'key', 'value']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Configuration updated')
  })
})
```

## Best Practices

### 1. **Separate Logic from I/O**
```typescript
// ✅ Good: Pure function for logic
export function parseArgs(args: string[]): ParsedArgs {
  // Pure parsing logic
}

// ✅ Good: Separate I/O
export function main(): number {
  const args = process.argv.slice(2)
  const parsed = parseArgs(args)
  // Handle I/O
}
```

### 2. **Use Descriptive Test Names**
```typescript
// ✅ Good
test('should return error when sum command receives non-numeric arguments')

// ❌ Bad
test('test sum error')
```

### 3. **Test Edge Cases**
- Empty arguments
- Invalid input types
- Missing required arguments
- Special characters
- Very long arguments
- Unicode characters

### 4. **Mock External Dependencies**
```typescript
// Mock file system operations
vi.mock('node:fs/promises')

// Mock network calls
vi.mock('node:https')
```

### 5. **Use Test Fixtures**
```typescript
const testCases = [
  { args: ['greet', 'A'], expected: 'Hello, A!' },
  { args: ['greet', 'B'], expected: 'Hello, B!' },
]

testCases.forEach(({ args, expected }) => {
  test(`should handle ${args.join(' ')}`, () => {
    process.argv = ['node', 'cli.js', ...args]
    main()
    expect(consoleSpy.log).toHaveBeenCalledWith(expected)
  })
})
```

### 6. **Clean Up in AfterEach**
```typescript
afterEach(() => {
  vi.restoreAllMocks()
  process.argv = originalArgv
  // Reset any global state
})
```

### 7. **Test Coverage Goals**
- Aim for 100% coverage of argument parsing
- Test all command paths
- Test all error conditions
- Test all option combinations

## Common Pitfalls

### 1. **Not Restoring Process.argv**
```typescript
// ❌ Bad: Process state leaks between tests
test('test 1', () => { process.argv = ['node', 'cli.js', 'cmd1'] })
test('test 2', () => { // process.argv still has cmd1 })

// ✅ Good: Restore in afterEach
afterEach(() => { process.argv = originalArgv })
```

### 2. **Not Mocking Console**
```typescript
// ❌ Bad: Clutters test output
test('test', () => {
  process.argv = ['node', 'cli.js', '--help']
  main() // Prints to console
})

// ✅ Good: Capture output
const spy = vi.spyOn(console, 'log').mockImplementation()
```

### 3. **Testing Implementation Instead of Behavior**
```typescript
// ❌ Bad: Tests implementation details
test('calls parseArgs', () => {
  const parseSpy = vi.spyOn(utils, 'parseArgs')
  main()
  expect(parseSpy).toHaveBeenCalled()
})

// ✅ Good: Tests behavior
test('outputs correct result', () => {
  process.argv = ['node', 'cli.js', 'greet', 'World']
  main()
  expect(consoleSpy.log).toHaveBeenCalledWith('Hello, World!')
})
```

## Example Test Files

### JavaScript Example
```javascript
// test/cli.test.js
import { expect, test, describe, vi } from 'vitest'
import { parseArgs, main } from '../src/cli.js'

describe('CLI Tests', () => {
  // Your tests here
})
```

### TypeScript Example
```typescript
// test/cli.test.ts
import { expect, test, describe, vi } from 'vitest'
import { parseArgs, main, type ParsedArgs } from '../src/cli.js'

describe('CLI Tests', () => {
  // Your tests here
})
```

## Running Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npx vitest run test/cli-app.test.ts

# Run with coverage
npx vitest run --coverage

# Run UI
npm run test:ui
```

## Debugging Tests

### 1. **Add Console Logs**
```typescript
test('debug test', () => {
  const result = parseArgs(['greet', 'World'])
  console.log('Result:', result) // Debug output
  expect(result.command).toBe('greet')
})
```

### 2. **Use --inspect**
```bash
node --inspect-brk node_modules/.bin/vitest run test/cli.test.ts
```

### 3. **Use Test.only**
```typescript
test.only('this test only', () => {
  // Focus on this test
})
```

## Summary

Testing CLI applications with Vitest involves multiple strategies:

1. **Unit Tests**: Test argument parsing logic in isolation
2. **Integration Tests**: Mock process.argv and console to test main function
3. **End-to-End Tests**: Run actual CLI as child process for complete verification

Choose the right strategy based on your needs:
- Use unit tests for complex parsing logic
- Use integration tests for command execution paths
- Use E2E tests for critical user workflows

This approach ensures your CLI works correctly from argument parsing to final output.