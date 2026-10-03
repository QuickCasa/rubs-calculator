import { describe, expect, it } from 'vitest'
import { roundToCents } from '../src/round-to-cents.js'

describe('roundToCents', () => {
  it('leaves whole amounts alone', () => {
    expect(roundToCents([100, 250, 650], 1000)).toEqual([100, 250, 650])
  })

  it('gives leftover cents to the largest remainders', () => {
    expect(roundToCents([1.2, 1.7, 2.1], 5)).toEqual([1, 2, 2])
  })

  it('breaks ties in favour of the amount listed first', () => {
    expect(roundToCents([0.5, 0.5, 0.5, 0.5], 2)).toEqual([1, 1, 0, 0])
  })

  it('treats floating point noise as a tie', () => {
    const third = 100 / 3

    expect(roundToCents([third, third + 1e-12, third - 1e-12], 100)).toEqual([
      34, 33, 33,
    ])
  })

  it('rounds an amount sitting a hair under a whole cent up to it', () => {
    expect(roundToCents([2.9999999999, 7.0000000001], 10)).toEqual([3, 7])
  })
})
