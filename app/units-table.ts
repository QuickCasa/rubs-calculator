import { UNIT_COLUMNS } from './constants.js'
import type { UnitRow } from './types.js'

/**
 * Draws the units table header and one row of inputs per unit. Each input
 * carries its row and field in data attributes, so one listener on the form
 * can keep the state in step as people type.
 *
 * @param {HTMLTableRowElement} head The header row.
 * @param {HTMLTableSectionElement} body The table body.
 * @param {readonly UnitRow[]} rows The units.
 */
function renderUnitsTable(
  head: HTMLTableRowElement,
  body: HTMLTableSectionElement,
  rows: readonly UnitRow[],
): void {
  const headings = UNIT_COLUMNS.map(({ label }) => {
    const heading = document.createElement('th')
    heading.scope = 'col'
    heading.textContent = label
    return heading
  })
  const actionsHeading = document.createElement('th')
  actionsHeading.scope = 'col'
  actionsHeading.innerHTML = '<span class="visually-hidden">Remove</span>'
  head.replaceChildren(...headings, actionsHeading)

  const tableRows = rows.map((row, index) => {
    const tableRow = document.createElement('tr')
    const rowNumber = String(index + 1)

    for (const { field, label } of UNIT_COLUMNS) {
      const cell = document.createElement('td')
      const input = document.createElement('input')
      input.value = row[field]
      input.autocomplete = 'off'
      input.inputMode = field === 'id' ? 'text' : 'decimal'
      input.dataset.index = String(index)
      input.dataset.field = field
      input.setAttribute('aria-label', `Row ${rowNumber}, ${label}`)
      cell.append(input)
      tableRow.append(cell)
    }

    const actionsCell = document.createElement('td')
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.className = 'remove'
    remove.textContent = 'Remove'
    remove.dataset.remove = String(index)
    remove.setAttribute('aria-label', `Remove row ${rowNumber}`)
    actionsCell.append(remove)
    tableRow.append(actionsCell)

    return tableRow
  })

  body.replaceChildren(...tableRows)
}

export { renderUnitsTable }
