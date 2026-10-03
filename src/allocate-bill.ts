import { DEFAULT_VACANCY } from './constants.js'
import { getCommonAreaCents } from './get-common-area-cents.js'
import { getMethodWeights } from './get-method-weights.js'
import { roundToCents } from './round-to-cents.js'
import { RubsInputError } from './rubs-input-error.js'
import type { Allocation, BillInput, ChargeStep } from './types.js'
import { validateBill } from './validate-bill.js'

/**
 * Splits a utility bill across units.
 *
 * The common area deduction comes off the top. Each method then splits its
 * percentage of what's left by the units' weights. Every amount is worked out
 * exactly, then rounded to the cent so the charges, the common area and the
 * owner's share for empty units add up to the bill total exactly.
 *
 * @param {BillInput} input The bill and the units to split it across.
 * @returns {Allocation} Each unit's charge, with the numbers behind it.
 * @throws {RubsInputError} When the bill can't be split as given.
 */
function allocateBill(input: BillInput): Allocation {
  const problems = validateBill(input)

  if (problems.length > 0) {
    throw new RubsInputError(problems)
  }

  const vacancy = input.vacancy ?? DEFAULT_VACANCY
  const commonAreaExact = getCommonAreaCents(input)
  const splittableCents = input.totalCents - commonAreaExact
  const stepsByUnit: ChargeStep[][] = input.units.map(() => [])

  for (const method of input.methods) {
    const poolCents = (splittableCents * method.percent) / 100
    const weights = getMethodWeights(input, method, vacancy)
    const totalWeight = weights.reduce(
      (sum, weight) => sum + weight.tenantWeight + weight.vacantWeight,
      0,
    )

    for (const [index, weight] of weights.entries()) {
      stepsByUnit[index]?.push({
        factor: method.factor,
        percent: method.percent,
        poolCents,
        value: weight.value,
        weight: weight.weight,
        dayFraction: weight.dayFraction,
        totalWeight,
        cents: (poolCents * weight.tenantWeight) / totalWeight,
        vacancyCents: (poolCents * weight.vacantWeight) / totalWeight,
      })
    }
  }

  const charges = input.units.map((unit, index) => {
    const steps = stepsByUnit[index] ?? []

    return {
      id: unit.id.trim(),
      cents: 0,
      exactCents: steps.reduce((sum, step) => sum + step.cents, 0),
      occupiedDays: unit.occupiedDays ?? input.periodDays,
      periodDays: input.periodDays,
      steps,
      vacancyCents: steps.reduce((sum, step) => sum + step.vacancyCents, 0),
    }
  })

  const vacancyExact = charges.reduce(
    (sum, charge) => sum + charge.vacancyCents,
    0,
  )
  const [commonAreaCents = 0, vacancyCents = 0, ...unitCents] = roundToCents(
    [
      commonAreaExact,
      vacancyExact,
      ...charges.map(charge => charge.exactCents),
    ],
    input.totalCents,
  )

  for (const [index, charge] of charges.entries()) {
    charge.cents = unitCents[index] ?? 0
  }

  return {
    totalCents: input.totalCents,
    periodDays: input.periodDays,
    vacancy,
    commonAreaCents,
    vacancyCents,
    billedCents: unitCents.reduce((sum, cents) => sum + cents, 0),
    charges,
  }
}

export { allocateBill }
