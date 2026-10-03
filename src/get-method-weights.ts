import { getFactorValue } from './get-factor-value.js'
import type {
  AllocationMethod,
  BillInput,
  UnitWeight,
  VacancyPolicy,
} from './types.js'

/**
 * Works out every unit's weight for one method.
 *
 * A weight counts in proportion to the days the unit was occupied. With the
 * `owner` vacancy policy, the empty days still count, so the unit keeps its
 * full share and the owner covers the empty part. Occupants are the exception:
 * an empty unit has none, so its empty days weigh nothing either way.
 *
 * @param {BillInput} input The bill, already validated.
 * @param {AllocationMethod} method The method to weigh the units for.
 * @param {VacancyPolicy} vacancy Who pays for empty days.
 * @returns {UnitWeight[]} One weight per unit, in input order.
 */
function getMethodWeights(
  input: BillInput,
  method: AllocationMethod,
  vacancy: VacancyPolicy,
): UnitWeight[] {
  const ownerCoversEmptyDays =
    vacancy === 'owner' && method.factor !== 'occupants'

  return input.units.map(unit => {
    const value = getFactorValue(unit, method.factor) ?? 0
    const weight =
      method.weights === undefined ? value : (method.weights[value] ?? 0)
    const dayFraction =
      (unit.occupiedDays ?? input.periodDays) / input.periodDays

    return {
      value,
      weight,
      dayFraction,
      tenantWeight: weight * dayFraction,
      vacantWeight: ownerCoversEmptyDays ? weight * (1 - dayFraction) : 0,
    }
  })
}

export { getMethodWeights }
