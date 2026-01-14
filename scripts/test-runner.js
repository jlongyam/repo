#!/usr/bin/env node

import { spawn } from 'child_process';

const testTypes = {
  unit: 'tests/unit/',
  integration: 'tests/integration/',
  e2e: 'tests/e2e/',
  all: ''
};

async function runTests(type = 'all', options = []) {
  const testPath = testTypes[type];
  const args = ['--experimental-vm-modules', 'node_modules/.bin/jest'];
  
  if (testPath) {
    args.push(testPath);
  }
  
  args.push(...options);
  
  const jestProcess = spawn('node', args, {
    stdio: 'inherit',
    shell: true
  });

  jestProcess.on('close', (code) => {
    process.exit(code);
  });
}

const type = process.argv[2] || 'all';
const options = process.argv.slice(3);
// eslint-disable-next-line no-console
runTests(type, options).catch(console.error);