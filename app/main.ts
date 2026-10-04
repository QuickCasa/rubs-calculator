import '@fontsource-variable/space-grotesk/wght.css'
import './styles.css'
import { allocateBill, RubsInputError } from '../src/index.js'
import type { Factor } from '../src/index.js'
import { FACTORS } from '../src/constants.js'
import { buildResultsCsv } from './build-results-csv.js'
import { DEFAULT_STATE, EMPTY_ROW, EXAMPLE_STATE } from './constants.js'
import { parseNumber } from './parse-number.js'
import { parseUnitsCsv } from './parse-units-csv.js'
import { readBill } from './read-bill.js'
import { renderResults } from './render-results.js'
import { loadState, saveState } from './storage.js'
import type {
  CommonAreaType,
  FormState,
  LatestResult,
  MethodInputs,
  UnitField,
} from './types.js'
import { renderUnitsTable } from './units-table.js'

/**
 * Finds an element the page can't work without.
 *
 * @param {string} id The element's id.
 * @param {new () => T} type The element class it must be.
 * @returns {T} The element.
 */
function getElement<T extends HTMLElement>(id: string, type: new () => T): T {
  const element = document.querySelector(`#${id}`)

  if (!(element instanceof type)) {
    throw new TypeError(`The page is missing #${id}.`)
  }

  return element
}

const form = getElement('calculator', HTMLFormElement)
const total = getElement('total', HTMLInputElement)
const currency = getElement('currency', HTMLSelectElement)
const periodDays = getElement('period-days', HTMLInputElement)
const commonAreaType = getElement('common-area-type', HTMLSelectElement)
const commonAreaValue = getElement('common-area-value', HTMLInputElement)
const commonAreaField = getElement('common-area-value-field', HTMLLabelElement)
const commonAreaLabel = getElement('common-area-value-label', HTMLSpanElement)
const percentTotal = getElement('percent-total', HTMLParagraphElement)
const unitsHead = getElement('units-head', HTMLTableRowElement)
const unitsBody = getElement('units-body', HTMLTableSectionElement)
const unitsStatus = getElement('units-status', HTMLParagraphElement)
const importFile = getElement('import-file', HTMLInputElement)
const importText = getElement('import-text', HTMLTextAreaElement)
const resultsStatus = getElement('results-status', HTMLParagraphElement)
const problemsList = getElement('problems', HTMLUListElement)
const results = getElement('results', HTMLDivElement)
const summary = getElement('summary', HTMLElement)
const chargesBody = getElement('charges-body', HTMLTableSectionElement)

let state: FormState = loadState()
let latest: LatestResult | undefined

/**
 * Finds the checkbox, percentage and weights inputs for a method.
 *
 * @param {Factor} factor The method's factor.
 * @returns {MethodInputs} The inputs.
 */
function methodInputs(factor: Factor): MethodInputs {
  const weights = document.querySelector(`#weights-${factor}`)

  return {
    enabled: getElement(`method-${factor}`, HTMLInputElement),
    percent: getElement(`percent-${factor}`, HTMLInputElement),
    weights: weights instanceof HTMLInputElement ? weights : undefined,
  }
}

/**
 * Shows or hides the common area amount field to match the chosen type.
 */
function syncCommonArea(): void {
  commonAreaField.hidden = state.commonAreaType === 'none'
  commonAreaLabel.textContent =
    state.commonAreaType === 'amount'
      ? 'Common area amount'
      : 'Common area percentage'
}

/**
 * Shows what the method shares add up to, flagged when it isn't 100.
 */
function syncPercentTotal(): void {
  const enabled = FACTORS.filter(factor => state.methods[factor].enabled)
  const sum = enabled.reduce(
    (running, factor) =>
      running + (parseNumber(state.methods[factor].percent) ?? 0),
    0,
  )
  const shown = Number(sum.toFixed(2))
  const isOff = enabled.length > 0 && Math.abs(sum - 100) > 1e-9

  percentTotal.classList.toggle('is-off', isOff)
  percentTotal.textContent = isOff
    ? `The shares add up to ${String(shown)}%. They need to add up to 100%.`
    : ''
}

/**
 * Copies the state into every field, after loading a save or an example.
 */
function syncFieldsFromState(): void {
  total.value = state.total
  currency.value = state.currency
  periodDays.value = state.periodDays
  commonAreaType.value = state.commonAreaType
  commonAreaValue.value = state.commonAreaValue

  for (const factor of FACTORS) {
    const inputs = methodInputs(factor)
    inputs.enabled.checked = state.methods[factor].enabled
    inputs.percent.value = state.methods[factor].percent
    inputs.percent.disabled = !state.methods[factor].enabled

    if (inputs.weights) {
      inputs.weights.value = state.methods[factor].weights
    }
  }

  for (const radio of form.querySelectorAll<HTMLInputElement>(
    'input[name="vacancy"]',
  )) {
    radio.checked = radio.value === state.vacancy
  }

  renderUnitsTable(unitsHead, unitsBody, state.units)
  syncCommonArea()
}

/**
 * Shows problems in place of the results.
 *
 * @param {readonly string[]} problems What to fix.
 */
function showProblems(problems: readonly string[]): void {
  latest = undefined
  results.hidden = true
  resultsStatus.textContent = 'Fix these to see the charges:'
  problemsList.replaceChildren(
    ...problems.map(problem => {
      const item = document.createElement('li')
      item.textContent = problem
      return item
    }),
  )
}

/**
 * Saves the form and works out the charges again.
 */
function update(): void {
  saveState(state)
  syncPercentTotal()

  const { input, problems } = readBill(state)

  if (input === undefined && problems.length === 0) {
    latest = undefined
    results.hidden = true
    problemsList.replaceChildren()
    resultsStatus.textContent =
      "Enter the bill total and your units to see each unit's charge."
    return
  }

  if (input === undefined) {
    showProblems(problems)
    return
  }

  try {
    const allocation = allocateBill(input)
    latest = { allocation, units: [...input.units] }
  } catch (error) {
    if (error instanceof RubsInputError) {
      showProblems(error.problems)
      return
    }

    throw error
  }

  problemsList.replaceChildren()
  resultsStatus.textContent = ''
  results.hidden = false
  renderResults(summary, chargesBody, latest.allocation, state.currency)
}

/**
 * Replaces the units with imported rows.
 *
 * @param {string} text CSV text.
 */
function importUnits(text: string): void {
  const rows = parseUnitsCsv(text)

  if (rows.length === 0) {
    unitsStatus.textContent = 'No units found to import.'
    return
  }

  state.units = rows
  renderUnitsTable(unitsHead, unitsBody, state.units)
  unitsStatus.textContent = `Imported ${String(rows.length)} ${rows.length === 1 ? 'unit' : 'units'}.`
  update()
}

form.addEventListener('submit', submitEvent => {
  submitEvent.preventDefault()
})

form.addEventListener('input', inputEvent => {
  const { target } = inputEvent

  if (target instanceof HTMLInputElement && target.dataset.field) {
    const row = state.units[Number(target.dataset.index)]

    if (row) {
      row[target.dataset.field as UnitField] = target.value
    }
  } else if (target === total) {
    state.total = total.value
  } else if (target === periodDays) {
    state.periodDays = periodDays.value
  } else if (target === commonAreaValue) {
    state.commonAreaValue = commonAreaValue.value
  } else if (target instanceof HTMLInputElement && target.name === 'vacancy') {
    state.vacancy = target.value === 'owner' ? 'owner' : 'occupied-units'
  } else {
    for (const factor of FACTORS) {
      const inputs = methodInputs(factor)

      if (target === inputs.enabled) {
        state.methods[factor].enabled = inputs.enabled.checked
        inputs.percent.disabled = !inputs.enabled.checked
      } else if (target === inputs.percent) {
        state.methods[factor].percent = inputs.percent.value
      } else if (target === inputs.weights) {
        state.methods[factor].weights = inputs.weights.value
      }
    }
  }

  update()
})

form.addEventListener('change', changeEvent => {
  if (changeEvent.target === currency) {
    state.currency = currency.value
  } else if (changeEvent.target === commonAreaType) {
    state.commonAreaType = commonAreaType.value as CommonAreaType
    syncCommonArea()
  } else {
    return
  }

  update()
})

unitsBody.addEventListener('click', clickEvent => {
  const { target } = clickEvent

  if (!(target instanceof HTMLButtonElement) || !target.dataset.remove) {
    return
  }

  const index = Number(target.dataset.remove)
  state.units = state.units.filter((_, rowIndex) => rowIndex !== index)

  if (state.units.length === 0) {
    state.units = [{ ...EMPTY_ROW }]
  }

  renderUnitsTable(unitsHead, unitsBody, state.units)
  unitsStatus.textContent = `Removed row ${String(index + 1)}.`
  update()
})

getElement('add-unit', HTMLButtonElement).addEventListener('click', () => {
  state.units = [...state.units, { ...EMPTY_ROW }]
  renderUnitsTable(unitsHead, unitsBody, state.units)
  const inputs = unitsBody.querySelectorAll<HTMLInputElement>(
    'input[data-field="id"]',
  )
  inputs.item(inputs.length - 1).focus()
})

getElement('load-example', HTMLButtonElement).addEventListener('click', () => {
  state = structuredClone(EXAMPLE_STATE)
  syncFieldsFromState()
  unitsStatus.textContent =
    'Loaded an example building. Its numbers are made up, so replace them with your own.'
  update()
})

getElement('clear-units', HTMLButtonElement).addEventListener('click', () => {
  state.units = structuredClone(DEFAULT_STATE.units)
  renderUnitsTable(unitsHead, unitsBody, state.units)
  unitsStatus.textContent = 'Cleared all units.'
  update()
})

getElement('import-button', HTMLButtonElement).addEventListener('click', () => {
  importUnits(importText.value)
})

importFile.addEventListener('change', () => {
  const [file] = importFile.files ?? []

  if (file) {
    void file.text().then(text => {
      importUnits(text)
      importFile.value = ''
    })
  }
})

getElement('download-csv', HTMLButtonElement).addEventListener('click', () => {
  if (!latest) {
    return
  }

  const csv = buildResultsCsv(latest.allocation, latest.units, state.currency)
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  link.download = 'rubs-charges.csv'
  link.click()
  URL.revokeObjectURL(link.href)
})

getElement('print', HTMLButtonElement).addEventListener('click', () => {
  print()
})

addEventListener('beforeprint', () => {
  for (const details of chargesBody.querySelectorAll('details')) {
    details.open = true
  }
})

syncFieldsFromState()
update()
