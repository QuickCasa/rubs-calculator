import type { Factor, VacancyPolicy } from './types.js'

const FACTORS: readonly Factor[] = [
  'occupants',
  'squareFeet',
  'bedrooms',
  'perUnit',
]

/**
 * Factors that are whole-number counts, and so can take a weights table that
 * maps each count to a weight.
 */
const COUNT_FACTORS: readonly Factor[] = ['occupants', 'bedrooms']

/**
 * How each factor reads in a sentence, for messages and explanations.
 */
const FACTOR_NAMES: Readonly<Record<Factor, string>> = {
  occupants: 'occupants',
  squareFeet: 'square footage',
  bedrooms: 'bedrooms',
  perUnit: 'per unit',
}

/**
 * The unit a factor's total is counted in, such as "9,400 sq ft".
 */
const FACTOR_UNITS: Readonly<Record<Factor, string>> = {
  occupants: 'occupants',
  squareFeet: 'sq ft',
  bedrooms: 'bedrooms',
  perUnit: 'units',
}

const DEFAULT_VACANCY: VacancyPolicy = 'owner'

const VACANCY_POLICIES: readonly VacancyPolicy[] = ['owner', 'occupied-units']

/**
 * Method percentages are often typed as thirds, such as 33.33 + 33.33 +
 * 33.34, so the sum is compared with a little room for floating point.
 */
const PERCENT_TOLERANCE = 1e-9

/**
 * Exact shares are floating point. A share that should be exactly 3 cents can
 * come out as 2.9999999999, so a sliver is added before rounding down.
 */
const ROUNDING_EPSILON = 1e-6

export {
  COUNT_FACTORS,
  DEFAULT_VACANCY,
  FACTOR_NAMES,
  FACTOR_UNITS,
  FACTORS,
  PERCENT_TOLERANCE,
  ROUNDING_EPSILON,
  VACANCY_POLICIES,
}
