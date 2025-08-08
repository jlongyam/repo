import { getNextVersion } from 'version-next'
import pkg from '../package.json' with { type: 'json' }

/**
 * Generate next version,
 * if called by 'cli' it will use version from 'package.json'
 * 
 * @param {string} [str_Version='0.0.0'] n.n.n-stage-n
 * @param {string} [str_type='patch'] patch | minor | major
 * @param {string} [str_stage=''] alpha | beta | rc | ''
 * @returns {void|string} next version 
 */
function versionNext(str_Version = '0.0.0', str_type = 'patch', str_stage = '') {
  return getNextVersion(str_Version, {
    type: str_type,
    stage: str_stage
  })
}

let v_type = ''
let v_stage = ''

try {
  if (typeof process.argv[2] === 'string') {
    v_type = process.argv[2]
    if (typeof process.argv[3] === 'string') {
      v_stage = process.argv[3]
    }
    console.log(versionNext(pkg.version, v_type, v_stage))
  }
} catch (e) {
  console.error(e.message)
}


// console.log(getNextVersion('0.1.3'))
export default versionNext