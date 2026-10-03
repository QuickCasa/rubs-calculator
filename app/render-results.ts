import { explainCharge } from '../src/index.js'
import type { Allocation } from '../src/index.js'

/**
 * Builds one summary figure, such as the bill total.
 *
 * @param {string} label What the figure is.
 * @param {string} value The formatted amount.
 * @returns {HTMLDivElement} The figure, ready to add to the summary list.
 */
function createFigure(label: string, value: string): HTMLDivElement {
  const figure = document.createElement('div')
  const term = document.createElement('dt')
  const detail = document.createElement('dd')
  term.textContent = label
  detail.textContent = value
  figure.append(term, detail)
  return figure
}

/**
 * Shows the summary figures and a row per unit with its charge, its share of
 * the bill and the formula behind it.
 *
 * @param {HTMLElement} summary The summary list.
 * @param {HTMLTableSectionElement} body The charges table body.
 * @param {Allocation} allocation The result to show.
 * @param {string} currency The currency to format amounts in.
 */
function renderResults(
  summary: HTMLElement,
  body: HTMLTableSectionElement,
  allocation: Allocation,
  currency: string,
): void {
  const money = new Intl.NumberFormat('en-CA', { style: 'currency', currency })
  const percent = new Intl.NumberFormat('en-CA', {
    style: 'percent',
    maximumFractionDigits: 2,
  })
  const dollars = (cents: number): string => money.format(cents / 100)
  const figures = [createFigure('Bill total', dollars(allocation.totalCents))]

  if (allocation.commonAreaCents > 0) {
    figures.push(
      createFigure(
        'Common area, paid by the owner',
        dollars(allocation.commonAreaCents),
      ),
    )
  }

  if (allocation.vacancyCents > 0) {
    figures.push(
      createFigure(
        'Empty days, paid by the owner',
        dollars(allocation.vacancyCents),
      ),
    )
  }

  figures.push(createFigure('Billed to units', dollars(allocation.billedCents)))
  summary.replaceChildren(...figures)

  const rows = allocation.charges.map(charge => {
    const row = document.createElement('tr')
    const unit = document.createElement('th')
    const amount = document.createElement('td')
    const share = document.createElement('td')
    const math = document.createElement('td')
    const details = document.createElement('details')
    const label = document.createElement('summary')
    const lines = document.createElement('ul')

    unit.scope = 'row'
    unit.textContent = charge.id
    amount.className = 'number'
    amount.textContent = dollars(charge.cents)
    share.className = 'number'
    share.textContent = percent.format(
      allocation.totalCents === 0 ? 0 : charge.cents / allocation.totalCents,
    )
    label.textContent = 'Show the math'
    const explanation = explainCharge(charge, { currency, locale: 'en-CA' })

    for (const line of explanation) {
      const item = document.createElement('li')
      item.textContent = line
      lines.append(item)
    }

    details.append(label, lines)
    math.append(details)
    row.append(unit, amount, share, math)
    return row
  })

  body.replaceChildren(...rows)
}

export { renderResults }
