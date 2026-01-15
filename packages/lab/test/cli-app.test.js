import { expect, test, describe, vi, beforeEach, afterEach } from 'vitest'
import { parseArgs, main } from '../src/cli-app.js'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const cliPath = join(__dirname, '../src/cli-app.js')

/**
 * Test Suite 1: Unit Tests for Argument Parsing
 * These tests focus on the parseArgs function in isolation
 */
describe('parseArgs - Unit Tests', () => {
  test('should parse simple command', () => {
    const args = ['greet', 'World']
    const result = parseArgs(args)
    
    expect(result.command).toBe('greet')
    expect(result.positional).toEqual(['World'])
    expect(result.options).toEqual({})
  })

  test('should parse options with double dashes', () => {
    const args = ['greet', 'World', '--uppercase']
    const result = parseArgs(args)
    
    expect(result.options.uppercase).toBe(true)
  })

  test('should parse options with values', () => {
    const args = ['greet', 'World', '--prefix=Message:']
    const result = parseArgs(args)
    
    expect(result.options.prefix).toBe('Message:')
  })

  test('should parse short flags', () => {
    const args = ['greet', 'World', '-h']
    const result = parseArgs(args)
    
    expect(result.options.h).toBe(true)
  })

  test('should parse multiple positional arguments', () => {
    const args = ['sum', '5', '3']
    const result = parseArgs(args)
    
    expect(result.command).toBe('sum')
    expect(result.positional).toEqual(['5', '3'])
  })

  test('should parse mixed options and positional args', () => {
    const args = ['greet', 'Alice', '--uppercase', '--prefix=Hi', '-v']
    const result = parseArgs(args)
    
    expect(result.command).toBe('greet')
    expect(result.positional).toEqual(['Alice'])
    expect(result.options).toEqual({
      uppercase: true,
      prefix: 'Hi',
      v: true
    })
  })
})

/**
 * Test Suite 2: Integration Tests with Process Simulation
 * These tests simulate the CLI execution environment
 */
describe('main - Integration Tests', () => {
  // Mock console methods to capture output
  let consoleSpy
  let originalArgv

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

  test('should show help with -h flag', () => {
    process.argv = ['node', 'cli-app.js', '-h']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith(expect.stringContaining('Usage:'))
  })

  test('should handle greet command successfully', () => {
    process.argv = ['node', 'cli-app.js', 'greet', 'World']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Hello, World!')
  })

  test('should handle greet with uppercase option', () => {
    process.argv = ['node', 'cli-app.js', 'greet', 'World', '--uppercase']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('HELLO, WORLD!')
  })

  test('should handle greet with prefix option', () => {
    process.argv = ['node', 'cli-app.js', 'greet', 'World', '--prefix=Message:']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Message: Hello, World!')
  })

  test('should handle sum command successfully', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '5', '3']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Sum: 8')
  })

  test('should handle sum with uppercase option', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '10', '20', '--uppercase']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('SUM: 30')
  })

  test('should return error when no command specified', () => {
    process.argv = ['node', 'cli-app.js']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: No command specified')
  })

  test('should return error for unknown command', () => {
    process.argv = ['node', 'cli-app.js', 'unknown']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: Unknown command: unknown')
  })

  test('should return error when greet has no name', () => {
    process.argv = ['node', 'cli-app.js', 'greet']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: greet command requires a name')
  })

  test('should return error when sum has wrong number of args', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '5']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: sum command requires exactly 2 numbers')
  })

  test('should return error when sum has non-numeric args', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '5', 'abc']
    
    const exitCode = main()
    
    expect(exitCode).toBe(1)
    expect(consoleSpy.error).toHaveBeenCalledWith('Error: sum command requires numeric arguments')
  })
})

/**
 * Test Suite 3: End-to-End Tests with Child Process
 * These tests run the actual CLI as a separate process
 */
describe('CLI - End-to-End Tests', () => {
  function runCLI(args) {
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
        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() })
      })
      
      child.on('error', reject)
    })
  }

  test('should execute greet command via child process', async () => {
    const result = await runCLI(['greet', 'Alice'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('Hello, Alice!')
    expect(result.stderr).toBe('')
  })

  test('should execute sum command via child process', async () => {
    const result = await runCLI(['sum', '15', '25'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('Sum: 40')
  })

  test('should handle combined options via child process', async () => {
    const result = await runCLI(['greet', 'Bob', '--uppercase', '--prefix=>>'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toBe('>> HELLO, BOB!')
  })

  test('should show help via child process', async () => {
    const result = await runCLI(['--help'])
    
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Usage:')
    expect(result.stdout).toContain('Commands:')
  })

  test('should handle error via child process', async () => {
    const result = await runCLI(['unknown'])
    
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('Error: Unknown command')
  })
})

/**
 * Test Suite 4: Testing with Environment Variables and Edge Cases
 */
describe('CLI - Edge Cases', () => {
  let consoleSpy
  let originalArgv

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

  test('should handle empty string positional args', () => {
    process.argv = ['node', 'cli-app.js', 'greet', '']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Hello, !')
  })

  test('should handle negative numbers in sum', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '-5', '3']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Sum: -2')
  })

  test('should handle decimal numbers in sum', () => {
    process.argv = ['node', 'cli-app.js', 'sum', '1.5', '2.5']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('Sum: 4')
  })

  test('should handle multiple short flags combined', () => {
    // Test with a valid short flag that doesn't trigger help
    process.argv = ['node', 'cli-app.js', 'greet', 'Test', '-v']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    // Note: -v is parsed but doesn't affect output in this simple CLI
    expect(consoleSpy.log).toHaveBeenCalledWith('Hello, Test!')
  })

  test('should handle options after positional args', () => {
    process.argv = ['node', 'cli-app.js', 'greet', 'World', '--uppercase']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('HELLO, WORLD!')
  })

  test('should handle options before positional args', () => {
    process.argv = ['node', 'cli-app.js', '--uppercase', 'greet', 'World']
    
    const exitCode = main()
    
    expect(exitCode).toBe(0)
    expect(consoleSpy.log).toHaveBeenCalledWith('HELLO, WORLD!')
  })
})