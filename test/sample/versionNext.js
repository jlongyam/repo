import versionNext from '../../src/versionNext.js'

console.group('versionNext()')
  if (versionNext() === '0.0.1') console.log('PASS')
  else console.log('FAIL')
console.groupEnd()

