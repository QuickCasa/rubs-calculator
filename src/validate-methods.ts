import {
  COUNT_FACTORS,
  FACTOR_NAMES,
  FACTORS,
  PERCENT_TOLERANCE,
} from './constants.js'
import type { AllocationMethod, Factor } from './types.js'

/**
 * Checks the methods the bill is split by.
 *
 * @param {readonly AllocationMethod[]} methods The methods to check.
 * @returns {string[]} A message for each problem found, or none.
 */
function validateMethods(methods: readonly AllocationMethod[]): string[] {
  if (methods.length === 0) {
    return ['Choose at least one way to split the bill.']
  }

  const problems: string[] = []
  const seen = new Set<Factor>()
  let percentTotal = 0

  for (const method of methods) {
    if (!FACTORS.includes(method.factor)) {
      problems.push(`"${String(method.factor)}" isn't a way to split a bill.`)
      continue
    }

    const name = FACTOR_NAMES[method.factor]

    if (seen.has(method.factor)) {
      problems.push(`Split by ${name} appears twice. Combine them into one.`)
    }

    seen.add(method.factor)

    if (!Number.isFinite(method.percent) || method.percent <= 0) {
      problems.push(`Split by ${name} needs a percentage above 0.`)
    } else {
      percentTotal += method.percent
    }

    if (method.weights !== undefined) {
      if (!COUNT_FACTORS.includes(method.factor)) {
        problems.push(
          `Weights by count only apply to occupants and bedrooms, not ${name}.`,
        )
      } else if (
        method.weights.length === 0 ||
        method.weights.some(weight => !Number.isFinite(weight) || weight < 0)
      ) {
        problems.push(`The ${name} weights must be numbers of 0 or more.`)
      }
    }
  }

  if (
    problems.length === 0 &&
    Math.abs(percentTotal - 100) > PERCENT_TOLERANCE
  ) {
    const shownTotal = Number(percentTotal.toFixed(4))

    problems.push(
      `The split percentages add up to ${String(shownTotal)}, not 100.`,
    )
  }

  return problems
}

export { validateMethods }
