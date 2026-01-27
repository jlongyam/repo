// ts-check
import { parseArgs } from '../src/cli-app.js'

const args = process.argv.slice(2)
const parsed = parseArgs(args)
// design
// repo> create workspace
console.log(parsed)