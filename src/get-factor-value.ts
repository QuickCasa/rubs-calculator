import type { Factor, UnitInput } from './types.js'

/**
 * Reads the unit's count or area for a factor. Every unit counts as 1 for
 * `perUnit`.
 *
 * @param {UnitInput} unit The unit to read.
 * @param {Factor} factor The factor to read it for.
 * @returns {number | undefined} The value, or undefined when the unit doesn't have one.
 */
function getFactorValue(unit: UnitInput, factor: Factor): number | undefined {
  if (factor === 'perUnit') {
    return 1
  }

  return unit[factor]
}

export { getFactorValue }
