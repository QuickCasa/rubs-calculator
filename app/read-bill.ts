import type {
  AllocationMethod,
  CommonAreaDeduction,
  UnitInput,
} from '../src/index.js'
import { FACTORS } from '../src/constants.js'
import { METHOD_LABELS } from './constants.js'
import { parseAmount } from './parse-amount.js'
import { parseNumber } from './parse-number.js'
import type { FormState, ReadResult, UnitRow } from './types.js'

/**
 * Checks whether a units table row has nothing typed in it.
 *
 * @param {UnitRow} row The row.
 * @returns {boolean} True when every field is blank.
 */
function isBlankRow(row: UnitRow): boolean {
  return Object.values(row).every(value => value.trim() === '')
}

/**
 * Reads the methods that are switched on.
 *
 * @param {FormState} state The form.
 * @param {string[]} problems Where to add any problems found.
 * @returns {AllocationMethod[]} The methods.
 */
function readMethods(state: FormState, problems: string[]): AllocationMethod[] {
  const methods: AllocationMethod[] = []

  for (const factor of FACTORS) {
    const method = state.methods[factor]

    if (!method.enabled) {
      continue
    }

    const label = METHOD_LABELS[factor]
    const percent = parseNumber(method.percent) ?? NaN
    const weightsText = method.weights.trim()

    if (weightsText === '') {
      methods.push({ factor, percent })
      continue
    }

    const weights = weightsText.split(/[\s,]+/u).map(Number)

    if (weights.some(weight => Number.isNaN(weight))) {
      problems.push(
        `${label} weights should be numbers separated by commas, such as 0, 1, 1.6, 2.2.`,
      )
    }

    methods.push({ factor, percent, weights })
  }

  return methods
}

/**
 * Reads the common area deduction.
 *
 * @param {FormState} state The form.
 * @param {string[]} problems Where to add any problems found.
 * @returns {CommonAreaDeduction | undefined} The deduction, or undefined for none.
 */
function readCommonArea(
  state: FormState,
  problems: string[],
): CommonAreaDeduction | undefined {
  if (state.commonAreaType === 'none') {
    return undefined
  }

  if (state.commonAreaType === 'percent') {
    return { percent: parseNumber(state.commonAreaValue) ?? NaN }
  }

  const cents = parseAmount(state.commonAreaValue)

  if (cents === undefined) {
    problems.push('The common area amount should be an amount such as 125.00.')
    return undefined
  }

  return { cents }
}

/**
 * Turns the form into a bill for the calculator, collecting problems the
 * calculator can't word well itself, such as text in an amount field.
 *
 * @param {FormState} state The form.
 * @returns {ReadResult} The bill, or undefined when the form isn't filled in yet, and any problems.
 */
function readBill(state: FormState): ReadResult {
  const rows = state.units.filter(row => !isBlankRow(row))

  if (state.total.trim() === '' && rows.length === 0) {
    return { input: undefined, problems: [] }
  }

  const problems: string[] = []
  const totalCents = parseAmount(state.total)

  if (totalCents === undefined) {
    problems.push('Enter the bill total as an amount, such as 412.18.')
  }

  const methods = readMethods(state, problems)
  const commonArea = readCommonArea(state, problems)

  if (problems.length > 0 || totalCents === undefined) {
    return { input: undefined, problems }
  }

  const units: UnitInput[] = rows.map(row => ({
    id: row.id,
    squareFeet: parseNumber(row.squareFeet),
    bedrooms: parseNumber(row.bedrooms),
    occupants: parseNumber(row.occupants),
    occupiedDays: parseNumber(row.occupiedDays),
  }))

  return {
    input: {
      totalCents,
      periodDays: parseNumber(state.periodDays) ?? NaN,
      commonArea,
      methods,
      vacancy: state.vacancy,
      units,
    },
    problems,
  }
}

export { readBill }
