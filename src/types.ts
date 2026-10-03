/**
 * What a unit's share of the bill is measured by.
 *
 * - `occupants`: the people living in the unit. Only counted while the unit
 *   is occupied.
 * - `squareFeet`: the unit's floor area.
 * - `bedrooms`: the unit's bedroom count.
 * - `perUnit`: every unit counts the same.
 */
type Factor = 'occupants' | 'squareFeet' | 'bedrooms' | 'perUnit'

/**
 * One way of splitting the bill, and how much of the bill it splits.
 */
interface AllocationMethod {
  factor: Factor
  /**
   * The percentage of the bill, after the common area deduction, that this
   * method splits. The percentages of all methods must add up to 100.
   */
  percent: number
  /**
   * Optional weights by count, for `occupants` and `bedrooms` only. The weight
   * for a count is the entry at that index, so `[0, 1, 1.6, 2.2]` makes one
   * occupant count as 1, two as 1.6 and three as 2.2. Every count in use needs
   * an entry. Without a table, the weight is the count itself.
   */
  weights?: readonly number[]
}

/**
 * Part of the bill taken off the top for shared spaces such as hallways,
 * laundry rooms or irrigation, which the owner pays.
 */
type CommonAreaDeduction = { percent: number } | { cents: number }

/**
 * Who pays the share of a unit for the days it sits empty.
 *
 * - `owner`: the owner pays it, and tenants are billed only for their own
 *   unit's share.
 * - `occupied-units`: empty days are left out of the split, so the whole bill
 *   falls on the units that were occupied.
 *
 * Under the `occupants` factor, an empty unit has no occupants, so it has no
 * share for anyone to pay with either option.
 */
type VacancyPolicy = 'owner' | 'occupied-units'

interface UnitInput {
  /**
   * The unit number or name, unique within the bill.
   */
  id: string
  squareFeet?: number
  bedrooms?: number
  occupants?: number
  /**
   * Days in the billing period the unit was occupied, from 0 for a unit that
   * was empty the whole time to `periodDays`. Defaults to `periodDays`.
   */
  occupiedDays?: number
}

interface BillInput {
  /**
   * The bill total in cents, or the smallest unit of your currency.
   */
  totalCents: number
  /**
   * The number of days the bill covers.
   */
  periodDays: number
  commonArea?: CommonAreaDeduction
  methods: readonly AllocationMethod[]
  /**
   * Defaults to `owner`.
   */
  vacancy?: VacancyPolicy
  units: readonly UnitInput[]
}

/**
 * How one method produced its part of a unit's charge, with every number the
 * formula used. Amounts are exact, before any rounding to the cent.
 */
interface ChargeStep {
  factor: Factor
  percent: number
  /**
   * The amount of the bill this method splits, in exact cents.
   */
  poolCents: number
  /**
   * The unit's count or area for this factor, such as 850 square feet.
   */
  value: number
  /**
   * The weight that value maps to. Equal to `value` without a weights table.
   */
  weight: number
  /**
   * The share of the period the weight counts for. 1 for a unit occupied the
   * whole period.
   */
  dayFraction: number
  /**
   * The sum of every unit's weight for this method.
   */
  totalWeight: number
  /**
   * The tenant's part of the pool, in exact cents.
   */
  cents: number
  /**
   * The part of the pool the owner covers for empty days, in exact cents.
   */
  vacancyCents: number
}

interface UnitCharge {
  id: string
  /**
   * The amount to bill, rounded to the cent.
   */
  cents: number
  /**
   * The amount before rounding.
   */
  exactCents: number
  occupiedDays: number
  periodDays: number
  steps: ChargeStep[]
  /**
   * What the owner covers for this unit's empty days, in exact cents.
   */
  vacancyCents: number
}

interface ExplainOptions {
  /**
   * An ISO 4217 currency code, such as CAD or USD.
   */
  currency: string
  /**
   * A BCP 47 locale for number formatting, such as en-CA. Defaults to the runtime's.
   */
  locale?: string
}

/**
 * Formats amounts and counts for an explanation, in one currency and locale.
 */
interface Formatters {
  money: (cents: number) => string
  preciseMoney: (cents: number) => string
  count: (value: number) => string
}

interface Allocation {
  totalCents: number
  periodDays: number
  vacancy: VacancyPolicy
  /**
   * The common area deduction the owner pays, rounded to the cent.
   */
  commonAreaCents: number
  /**
   * What the owner pays for empty units, rounded to the cent.
   */
  vacancyCents: number
  /**
   * The sum of every unit's charge.
   */
  billedCents: number
  /**
   * In the same order as the units in the input.
   */
  charges: UnitCharge[]
}

/**
 * A unit's weight for one method, split into the days it was occupied, which
 * the tenant pays for, and the empty days the owner covers.
 */
interface UnitWeight {
  value: number
  weight: number
  dayFraction: number
  tenantWeight: number
  vacantWeight: number
}

export type {
  Allocation,
  AllocationMethod,
  BillInput,
  ChargeStep,
  CommonAreaDeduction,
  ExplainOptions,
  Factor,
  Formatters,
  UnitCharge,
  UnitInput,
  UnitWeight,
  VacancyPolicy,
}
