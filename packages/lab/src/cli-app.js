#!/usr/bin/env node

/**
 * Simple CLI application that processes command line arguments
 * Usage: node cli-app.js [options] <command>
 */

import process from 'node:process'

function parseArgs(args) {
  const parsed = {
    command: null,
    options: {},
    positional: []
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    // Handle options
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=')
      parsed.options[key] = value === undefined ? true : value
    } else if (arg.startsWith('-') && arg.length > 1 && !arg.slice(1).match(/^-?\d/)) {
      // Handle short flags (but not negative numbers)
      const flags = arg.slice(1).split('')
      flags.forEach(flag => {
        parsed.options[flag] = true
      })
    } else {
      // Handle positional arguments
      if (!parsed.command) {
        parsed.command = arg
      } else {
        parsed.positional.push(arg)
      }
    }
  }

  return parsed
}

function main() {
  const args = process.argv.slice(2)
  const parsed = parseArgs(args)

  if (parsed.options.help || parsed.options.h) {
    console.log(`
Usage: cli-app.js [options] <command>

Commands:
  greet <name>    Greet a person
  sum <a> <b>     Sum two numbers

Options:
  --help, -h      Show this help
  --uppercase     Convert output to uppercase
  --prefix=<str>  Add prefix to output
    `)
    return 0
  }

  if (!parsed.command) {
    console.error('Error: No command specified')
    return 1
  }

  let output = ''

  switch (parsed.command) {
    case 'greet':
      if (parsed.positional.length === 0) {
        console.error('Error: greet command requires a name')
        return 1
      }
      output = `Hello, ${parsed.positional[0]}!`
      break

    case 'sum':
      if (parsed.positional.length !== 2) {
        console.error('Error: sum command requires exactly 2 numbers')
        return 1
      }
      const a = parseFloat(parsed.positional[0])
      const b = parseFloat(parsed.positional[1])
      if (isNaN(a) || isNaN(b)) {
        console.error('Error: sum command requires numeric arguments')
        return 1
      }
      output = `Sum: ${a + b}`
      break

    default:
      console.error(`Error: Unknown command: ${parsed.command}`)
      return 1
  }

  // Apply transformations
  if (parsed.options.uppercase) {
    output = output.toUpperCase()
  }

  if (parsed.options.prefix) {
    output = `${parsed.options.prefix} ${output}`
  }

  console.log(output)
  return 0
}

// Export for testing
export { parseArgs, main }

// Only run main if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main())
}