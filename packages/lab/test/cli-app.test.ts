import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { parseArgs, main, type ParsedArgs } from '../src/cli-app.js'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const cliPath = join(__dirname, '../src/cli-app.ts')

/**
 * TypeScript CLI Testing Examples
 * Demonstrates various approaches to testing CLI applications with Vitest
 */

describe('parseArgs - TypeScript Unit Tests', () => {
  test('should parse command and positional arguments', () => {
    const args = ['greet', 'TypeScript']
    const result: ParsedArgs = parseArgs(args)
    
    expect(result.command).toBe('greet')
    expect(result.positional).toEqual(['TypeScript'])
    expect(result.options).toEqual({})
  })

  test('should parse boolean options', () => {
    const args = ['greet', 'World', '--uppercase', '-v']
    const result = parseArgs(args)
    
    expect(result.options.uppercase).toBe(true)
    expect(result.options.v).toBe(true)
  })

  test('should parse options with values', () => {
    const args = ['greet', 'World', '--prefix=>>>', '--suffix=<<<']
    const result = parseArgs(args)
    
    expect(result.options.prefix).toBe('>>>')
    expect(result.options.suffix).toBe('<<<')
  })

  test('should handle mixed argument order', () => {
    const args = ['--uppercase', 'greet', 'World', '--prefix=Hi', '-v']
    const result = parseArgs(args)
    
    expect(result.command).toBe('greet')
    expect(result.positional).toEqual(['World'])
    expect(result.options).toEqual({
      uppercase: true,
      prefix: 'Hi',
      v: true
    })
  })

  test('should handle empty arguments', () => {
    const result = parseArgs([])
    
    expect(result.command).toBeNull()
    expect(result.positional).toEqual([])
    expect(result.options).toEqual({})
  })
})

describe('main - TypeScript Integration Tests', () => {
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

  test('should handle greet command with TypeScript types', () => {
    process.argv = ['node', 'cli-app.ts', 'greet', 'TypeScript']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Hello, TypeScript!')
  })

  test('should handle sum command with numeric validation', () => {
    process.argv = ['node', 'cli-app.ts', 'sum', '10', '20']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Sum: 30')
  })

  test('should apply multiple transformations', () => {
    process.argv = ['node', 'cli-app.ts', 'greet', 'World', '--uppercase', '--prefix=>>>']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('>>> HELLO, WORLD!')
  })

  test('should handle error cases', () => {
    process.argv = ['node', 'cli-app.ts', 'unknown']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: Unknown command: unknown')
  })
})

describe('CLI - TypeScript End-to-End Tests', () => {
  async function runCLI(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      // Note: For TypeScript files, you might need tsx or ts-node
      // This example assumes the TypeScript is compiled or using tsx
      const child = spawn('npx', ['tsx', cliPath, ...args])
      
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

  test('should execute TypeScript CLI successfully', async () => {
    const result = await runCLI(['greet', 'Developer'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('Hello, Developer!')
  })

  test('should handle complex options', async () => {
    const result = await runCLI(['sum', '5.5', '4.5', '--uppercase'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('SUM: 10')
  })
})

/**
 * Advanced Testing Patterns
 */
describe('Advanced CLI Testing Patterns', () => {
  test('Testing with mocked process.exit', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process.exit(${code})`)
    })
    
    // Test that help exits cleanly
    process.argv = ['node', 'cli-app.ts', '--help']
    
    try {
      main()
    } catch (e) {
      // Expected to throw
    }
    
    expect(mockExit).not.toHaveBeenCalled()
    mockExit.mockRestore()
  })

  test('Testing argument parsing edge cases', () => {
    const testCases: Array<{
      input: string[]
      expected: Partial<ParsedArgs>
    }> = [
      {
        input: ['greet', ''],
        expected: { command: 'greet', positional: [''] }
      },
      {
        input: ['sum', '-5', '3'],
        expected: { command: 'sum', positional: ['-5', '3'] }
      },
      {
        input: ['greet', 'Name', '--prefix=', '--uppercase'],
        expected: { 
          command: 'greet', 
          positional: ['Name'],
          options: { prefix: '', uppercase: true }
        }
      }
    ]

    testCases.forEach(({ input, expected }) => {
      const result = parseArgs(input)
      
      if (expected.command !== undefined) {
        expect(result.command).toBe(expected.command)
      }
      if (expected.positional !== undefined) {
        expect(result.positional).toEqual(expected.positional)
      }
      if (expected.options !== undefined) {
        expect(result.options).toMatchObject(expected.options)
      }
    })
  })

  test('Testing with environment variables', () => {
    // Mock environment variables
    const originalEnv = process.env
    process.env = { ...originalEnv, NODE_ENV: 'test' }
    
    process.argv = ['node', 'cli-app.ts', 'greet', 'Test']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    
    process.env = originalEnv
  })
})

/**
 * Performance and Stress Tests
 */
describe('CLI - Performance Tests', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  test('should handle many arguments efficiently', () => {
    const largeArgs = ['greet', 'User', '--uppercase', '--prefix=>>', '-v', '-q']
    
    const start = performance.now()
    const result = parseArgs(largeArgs)
    const end = performance.now()
    
    expect(result.command).toBe('greet')
    expect(end - start).toBeLessThan(10) // Should be very fast
  })

  test('should handle repeated operations', () => {
    const iterations = 100
    
    const start = performance.now()
    for (let i = 0; i < iterations; i++) {
      process.argv = ['node', 'cli-app.ts', 'sum', String(i), String(i + 1)]
      main()
    }
    const end = performance.now()
    
    expect(end - start).toBeLessThan(1000) // Should complete in under 1 second
  })
})