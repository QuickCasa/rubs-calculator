import { explainCharge } from '../src/index.js'
import type { Allocation, UnitInput } from '../src/index.js'

/**
 * Quotes a CSV cell when it holds a comma, quote or line break.
 *
 * @param {string} value The cell.
 * @returns {string} The cell, safe to join with commas.
 */
function escapeCell(value: string): string {
  if (!/[",\n\r]/u.test(value)) {
    return value
  }

  return `"${value.replaceAll('"', '""')}"`
}

/**
 * Formats cents as a plain decimal such as 27.71, which every spreadsheet
 * reads as a number.
 *
 * @param {number} cents The amount.
 * @returns {string} The amount in dollars.
 */
function toDollars(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Builds a CSV of the charges, with the formula for each, then the owner's
 * amounts and the total, so the file adds up on its own.
 *
 * @param {Allocation} allocation The result to export.
 * @param {readonly UnitInput[]} units The units, for their inputs.
 * @param {string} currency The currency the formulas are written in.
 * @returns {string} The CSV text.
 */
function buildResultsCsv(
  allocation: Allocation,
  units: readonly UnitInput[],
  currency: string,
): string {
  const header = [
    'Unit',
    'Square feet',
    'Bedrooms',
    'Occupants',
    'Days occupied',
    `Charge (${currency})`,
    'How it was worked out',
  ]
  const rows = allocation.charges.map((charge, index) => {
    const unit = units[index]

    return [
      charge.id,
      String(unit?.squareFeet ?? ''),
      String(unit?.bedrooms ?? ''),
      String(unit?.occupants ?? ''),
      String(charge.occupiedDays),
      toDollars(charge.cents),
      explainCharge(charge, { currency, locale: 'en-CA' }).join('; '),
    ]
  })
  const blanks = ['', '', '', '']
  const footer = [
    [
      'Common area (owner)',
      ...blanks,
      toDollars(allocation.commonAreaCents),
      '',
    ],
    ['Empty units (owner)', ...blanks, toDollars(allocation.vacancyCents), ''],
    ['Bill total', ...blanks, toDollars(allocation.totalCents), ''],
  ]
  const lines = [header, ...rows, ...footer].map(cells =>
    cells.map(cell => escapeCell(cell)).join(','),
  )

  return `${lines.join('\r\n')}\r\n`
}

export { buildResultsCsv }
