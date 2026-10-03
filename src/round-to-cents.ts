import { ROUNDING_EPSILON } from './constants.js'

/**
 * Rounds exact amounts to whole cents so they add up to the total exactly,
 * using the largest remainder method: every amount is rounded down, then the
 * cents left over go one each to the amounts that lost the most. No amount
 * ends up more than a cent from its exact value.
 *
 * Ties go to the amount listed first. Remainders closer together than the
 * rounding epsilon count as tied, so floating point noise can't decide who
 * gets a cent.
 *
 * @param {readonly number[]} exactCents The exact amounts, which must add up to the total.
 * @param {number} totalCents The whole number of cents they must add up to.
 * @returns {number[]} The rounded amounts, in the same order.
 */
function roundToCents(
  exactCents: readonly number[],
  totalCents: number,
): number[] {
  const rounded = exactCents.map(exact =>
    Math.max(0, Math.floor(exact + ROUNDING_EPSILON)),
  )
  const order = exactCents
    .map((exact, index) => ({
      index,
      remainder: Math.round((exact - (rounded[index] ?? 0)) / ROUNDING_EPSILON),
    }))
    .toSorted((a, b) => b.remainder - a.remainder || a.index - b.index)
    .map(({ index }) => index)

  let leftover = totalCents - rounded.reduce((sum, cents) => sum + cents, 0)

  for (let position = 0; leftover > 0 && order.length > 0; position += 1) {
    const index = order[position % order.length] ?? 0
    rounded[index] = (rounded[index] ?? 0) + 1
    leftover -= 1
  }

  for (
    let position = order.length - 1;
    leftover < 0 && position >= 0;
    position -= 1
  ) {
    const index = order[position] ?? 0
    const cents = rounded[index] ?? 0

    if (cents === 0) {
      continue
    }

    rounded[index] = cents - 1
    leftover += 1
  }

  return rounded
}

export { roundToCents }
