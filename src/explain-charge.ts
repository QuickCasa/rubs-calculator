import { FACTOR_NAMES, FACTOR_UNITS, ROUNDING_EPSILON } from './constants.js'
import type {
  ChargeStep,
  ExplainOptions,
  Formatters,
  UnitCharge,
} from './types.js'

/**
 * Builds the formatters for amounts in the bill's currency. Amounts are in the
 * currency's smallest unit, so the divisor comes from how many decimal places
 * the currency uses: 100 for dollars, 1 for yen.
 *
 * @param {ExplainOptions} options The currency and locale.
 * @returns {Formatters} The formatters.
 */
function createFormatters(options: ExplainOptions): Formatters {
  const moneyFormat = new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
  })
  const decimalPlaces = moneyFormat.resolvedOptions().maximumFractionDigits ?? 2
  const divisor = 10 ** decimalPlaces
  const preciseFormat = new Intl.NumberFormat(options.locale, {
    style: 'currency',
    currency: options.currency,
    maximumFractionDigits: decimalPlaces + 2,
  })
  const countFormat = new Intl.NumberFormat(options.locale, {
    maximumFractionDigits: 2,
  })

  return {
    money: cents => moneyFormat.format(cents / divisor),
    preciseMoney: cents => preciseFormat.format(cents / divisor),
    count: value => countFormat.format(value),
  }
}

/**
 * Writes one method's part of the charge as a formula.
 *
 * @param {ChargeStep} step The method's numbers.
 * @param {UnitCharge} charge The charge the step belongs to.
 * @param {Formatters} formatters The number formatters.
 * @returns {string} A line such as "Square footage (50%): $185.48 x 850 / 9,400 sq ft = $16.77".
 */
function explainStep(
  step: ChargeStep,
  charge: UnitCharge,
  formatters: Formatters,
): string {
  const { count, money } = formatters
  const name = FACTOR_NAMES[step.factor]
  const heading = `${name.charAt(0).toUpperCase()}${name.slice(1)} (${count(step.percent)}%)`
  const usesTable = step.weight !== step.value
  let weightText = usesTable
    ? `${count(step.weight)} (the weight for ${count(step.value)} ${name})`
    : count(step.weight)

  if (step.dayFraction < 1) {
    weightText += ` x ${String(charge.occupiedDays)}/${String(charge.periodDays)} days`
  }

  const totalText = usesTable
    ? count(step.totalWeight)
    : `${count(step.totalWeight)} ${FACTOR_UNITS[step.factor]}`

  return `${heading}: ${money(step.poolCents)} x ${weightText} / ${totalText} = ${money(step.cents)}`
}

/**
 * Explains how a unit's charge was worked out, one line per step, so it can
 * be shown to the tenant or checked by hand.
 *
 * @param {UnitCharge} charge A charge from allocateBill.
 * @param {ExplainOptions} options The currency and locale to format amounts in.
 * @returns {string[]} The explanation, one line per step.
 */
function explainCharge(charge: UnitCharge, options: ExplainOptions): string[] {
  const formatters = createFormatters(options)
  const lines = charge.steps.map(step => explainStep(step, charge, formatters))
  const emptyDays = charge.periodDays - charge.occupiedDays

  if (charge.vacancyCents > ROUNDING_EPSILON) {
    const dayWord = emptyDays === 1 ? 'day' : 'days'
    lines.push(
      `The owner covers ${formatters.money(charge.vacancyCents)} for the ${String(emptyDays)} empty ${dayWord}.`,
    )
  }

  if (Math.abs(charge.exactCents - charge.cents) > ROUNDING_EPSILON) {
    lines.push(
      `Total: ${formatters.preciseMoney(charge.exactCents)}, billed as ${formatters.money(charge.cents)}`,
    )
  } else {
    lines.push(`Total: ${formatters.money(charge.cents)}`)
  }

  return lines
}

export { explainCharge }
