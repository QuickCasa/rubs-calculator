import { DEFAULT_VACANCY, FACTOR_NAMES, VACANCY_POLICIES } from './constants.js'
import { getMethodWeights } from './get-method-weights.js'
import type { BillInput } from './types.js'
import { validateMethods } from './validate-methods.js'
import { validateUnits } from './validate-units.js'

/**
 * Checks the bill-level numbers: the total, the period, the common area
 * deduction and the vacancy policy.
 *
 * @param {BillInput} input The bill to check.
 * @returns {string[]} A message for each problem found, or none.
 */
function validateTotals(input: BillInput): string[] {
  const problems: string[] = []
  const { commonArea, periodDays, totalCents, vacancy } = input

  if (!Number.isSafeInteger(totalCents) || totalCents < 0) {
    problems.push('The bill total must be a whole number of cents, 0 or more.')
  }

  if (!Number.isSafeInteger(periodDays) || periodDays < 1) {
    problems.push(
      'The billing period must be a whole number of days, at least 1.',
    )
  }

  if (commonArea !== undefined) {
    if ('percent' in commonArea) {
      const { percent } = commonArea

      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        problems.push('The common area percentage must be from 0 to 100.')
      }
    } else if (
      !Number.isSafeInteger(commonArea.cents) ||
      commonArea.cents < 0 ||
      commonArea.cents > totalCents
    ) {
      problems.push(
        'The common area amount must be a whole number of cents, no more than the bill total.',
      )
    }
  }

  if (vacancy !== undefined && !VACANCY_POLICIES.includes(vacancy)) {
    problems.push(`"${String(vacancy)}" isn't a vacancy option.`)
  }

  return problems
}

/**
 * Checks that every method has some weight to split by. A method fails this
 * when, for example, no unit had any occupants during the period.
 *
 * @param {BillInput} input The bill, otherwise valid.
 * @returns {string[]} A message for each problem found, or none.
 */
function validateWeights(input: BillInput): string[] {
  const vacancy = input.vacancy ?? DEFAULT_VACANCY
  const everyUnitEmpty = input.units.every(unit => unit.occupiedDays === 0)

  if (vacancy === 'occupied-units' && everyUnitEmpty) {
    return [
      "Every unit was empty for the whole period, so there's no one to split the bill between.",
    ]
  }

  const problems: string[] = []

  for (const method of input.methods) {
    const weights = getMethodWeights(input, method, vacancy)
    const totalWeight = weights.reduce(
      (sum, weight) => sum + weight.tenantWeight + weight.vacantWeight,
      0,
    )

    if (totalWeight <= 0) {
      problems.push(
        `Every unit has a weight of 0 for the ${FACTOR_NAMES[method.factor]} split during this period, so that part of the bill can't be split.`,
      )
    }
  }

  return problems
}

/**
 * Checks a bill can be split, and lists everything that stops it.
 *
 * @param {BillInput} input The bill to check.
 * @returns {string[]} A message for each problem found, or none when the bill is valid.
 */
function validateBill(input: BillInput): string[] {
  const totalProblems = validateTotals(input)
  const methodProblems = validateMethods(input.methods)
  const periodIsValid =
    Number.isSafeInteger(input.periodDays) && input.periodDays >= 1

  // Units are checked against the period and the methods, so their messages
  // would only add noise until both of those are right.
  if (methodProblems.length > 0 || !periodIsValid) {
    return [...totalProblems, ...methodProblems]
  }

  const unitProblems = validateUnits(input)
  const problems = [...totalProblems, ...unitProblems]

  if (problems.length > 0) {
    return problems
  }

  return validateWeights(input)
}

export { validateBill }
