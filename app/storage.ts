import { FACTORS, VACANCY_POLICIES } from '../src/constants.js'
import {
  DEFAULT_STATE,
  EMPTY_ROW,
  STORAGE_KEY,
  UNIT_COLUMNS,
} from './constants.js'
import type { CommonAreaType, FormState, UnitRow } from './types.js'

const COMMON_AREA_TYPES: ReadonlySet<CommonAreaType> = new Set([
  'none',
  'percent',
  'amount',
])

/**
 * Reads a string from saved data, falling back when it's missing or the
 * wrong type.
 *
 * @param {string | undefined} value The saved value.
 * @param {string} fallback The value to use instead.
 * @returns {string} The value.
 */
function readText(value: string | undefined, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Restores the form from what was saved last time. Anything missing or
 * malformed falls back to the default, so an old or edited save can't break
 * the page.
 *
 * @returns {FormState} The saved form, or the default form.
 */
function loadState(): FormState {
  let saved: Partial<FormState> | undefined

  try {
    const text = localStorage.getItem(STORAGE_KEY)
    saved = text === null ? undefined : (JSON.parse(text) as Partial<FormState>)
  } catch {
    saved = undefined
  }

  if (saved === undefined || typeof saved !== 'object') {
    return structuredClone(DEFAULT_STATE)
  }

  const state = structuredClone(DEFAULT_STATE)
  state.total = readText(saved.total, state.total)
  state.currency = readText(saved.currency, state.currency)
  state.periodDays = readText(saved.periodDays, state.periodDays)
  state.commonAreaValue = readText(saved.commonAreaValue, state.commonAreaValue)

  if (saved.commonAreaType && COMMON_AREA_TYPES.has(saved.commonAreaType)) {
    state.commonAreaType = saved.commonAreaType
  }

  if (saved.vacancy && VACANCY_POLICIES.includes(saved.vacancy)) {
    state.vacancy = saved.vacancy
  }

  for (const factor of FACTORS) {
    const method = saved.methods?.[factor]

    if (method !== undefined) {
      state.methods[factor] = {
        enabled: method.enabled === true,
        percent: readText(method.percent, ''),
        weights: readText(method.weights, ''),
      }
    }
  }

  if (Array.isArray(saved.units) && saved.units.length > 0) {
    state.units = saved.units.map(row => {
      const restored: UnitRow = { ...EMPTY_ROW }

      for (const { field } of UNIT_COLUMNS) {
        restored[field] = readText(row[field], '')
      }

      return restored
    })
  }

  return state
}

/**
 * Saves the form so it's still there after a reload. Saving can fail in a
 * private window or with storage blocked, and the page works without it.
 *
 * @param {FormState} state The form.
 */
function saveState(state: FormState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage is a convenience here, so a failed save is ignored.
  }
}

export { loadState, saveState }
