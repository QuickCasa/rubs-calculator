import type { BillInput } from './types.js'

/**
 * Works out the exact common area deduction, before rounding.
 *
 * @param {BillInput} input The bill, already validated.
 * @returns {number} The deduction in exact cents, 0 when there is none.
 */
function getCommonAreaCents(input: BillInput): number {
  const { commonArea, totalCents } = input

  if (commonArea === undefined) {
    return 0
  }

  if ('percent' in commonArea) {
    return (totalCents * commonArea.percent) / 100
  }

  return commonArea.cents
}

export { getCommonAreaCents }
