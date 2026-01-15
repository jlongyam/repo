import { test, assert } from 'vitest'
import { lab } from '../src'

test('simple', () => {
  assert.equal(lab, 'lab')
})
