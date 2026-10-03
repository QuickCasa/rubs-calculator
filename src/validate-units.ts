import { FACTOR_NAMES } from './constants.js'
import { getFactorValue } from './get-factor-value.js'
import type { AllocationMethod, BillInput, UnitInput } from './types.js'

/**
 * Checks a unit has a usable value for one method, including a weight for its
 * count when the method has a weights table.
 *
 * @param {UnitInput} unit The unit to check.
 * @param {string} label How the unit is named in messages.
 * @param {AllocationMethod} method The method the value is for.
 * @returns {string | undefined} The problem, or undefined when there is none.
 */
function validateUnitValue(
  unit: UnitInput,
  label: string,
  method: AllocationMethod,
): string | undefined {
  const value = getFactorValue(unit, method.factor)

  if (method.factor === 'squareFeet') {
    if (value === undefined || !Number.isFinite(value) || value <= 0) {
      return `${label} needs a floor area above 0.`
    }

    return undefined
  }

  const name = FACTOR_NAMES[method.factor]

  if (value === undefined || !Number.isSafeInteger(value) || value < 0) {
    return `${label} needs a whole number of ${name}, 0 or more.`
  }

  if (method.weights !== undefined) {
    if (value >= method.weights.length) {
      return `${label} has ${String(value)} ${name}, but the ${name} weights only go up to ${String(method.weights.length - 1)}.`
    }

    return undefined
  }

  if (method.factor === 'bedrooms' && value === 0) {
    return `${label} has 0 bedrooms, so it would pay nothing toward the bedrooms split. Add bedroom weights to give studios a share.`
  }

  return undefined
}

/**
 * Checks the units, and that each one has what every method needs.
 *
 * @param {BillInput} input The bill, with valid methods and period.
 * @returns {string[]} A message for each problem found, or none.
 */
function validateUnits(input: BillInput): string[] {
  if (input.units.length === 0) {
    return ['Add at least one unit.']
  }

  const problems: string[] = []
  const seen = new Set<string>()

  for (const [index, unit] of input.units.entries()) {
    const id = typeof unit.id === 'string' ? unit.id.trim() : ''

    if (id === '') {
      problems.push(
        `Unit ${String(index + 1)} in the list needs a name or number.`,
      )
      continue
    }

    const label = `Unit ${id}`

    if (seen.has(id)) {
      problems.push(`${label} is listed more than once.`)
    }

    seen.add(id)

    const { occupiedDays } = unit

    if (
      occupiedDays !== undefined &&
      (!Number.isSafeInteger(occupiedDays) ||
        occupiedDays < 0 ||
        occupiedDays > input.periodDays)
    ) {
      problems.push(
        `${label} needs occupied days as a whole number from 0 to ${String(input.periodDays)}.`,
      )
    }

    for (const method of input.methods) {
      const problem = validateUnitValue(unit, label, method)

      if (problem !== undefined) {
        problems.push(problem)
      }
    }
  }

  return problems
}

export { validateUnits }
