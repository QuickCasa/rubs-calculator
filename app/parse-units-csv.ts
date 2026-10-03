import { UNIT_COLUMNS } from './constants.js'
import { parseCsv } from './parse-csv.js'
import type { UnitField, UnitRow } from './types.js'

/**
 * Header names each column is recognised by, compared in lower case with
 * everything but letters removed, so "Square Feet", "square_feet" and "sqft"
 * all match.
 */
const HEADER_NAMES: Readonly<Record<UnitField, readonly string[]>> = {
  id: ['unit', 'unitnumber', 'unitname', 'unitid', 'id', 'apartment', 'suite'],
  squareFeet: ['squarefeet', 'squarefootage', 'sqft', 'sf', 'area', 'size'],
  bedrooms: ['bedrooms', 'beds', 'bedroom', 'br'],
  occupants: ['occupants', 'residents', 'people', 'tenants', 'persons'],
  occupiedDays: ['daysoccupied', 'occupieddays', 'days'],
}

/**
 * Works out which column holds which field from a header row.
 *
 * @param {readonly string[]} header The first row.
 * @returns {Map<UnitField, number> | undefined} Column positions, or undefined when the row isn't a header.
 */
function readHeader(
  header: readonly string[],
): Map<UnitField, number> | undefined {
  const positions = new Map<UnitField, number>()

  for (const [position, name] of header.entries()) {
    const key = name.toLowerCase().replaceAll(/[^a-z]/gu, '')
    const match = UNIT_COLUMNS.find(({ field }) =>
      HEADER_NAMES[field].includes(key),
    )

    if (match !== undefined && !positions.has(match.field)) {
      positions.set(match.field, position)
    }
  }

  return positions.has('id') ? positions : undefined
}

/**
 * Reads units from CSV text, such as a rent roll export. With a header row,
 * columns can be in any order and extra columns are ignored. Without one, the
 * columns are read as unit, square feet, bedrooms, occupants and days occupied.
 *
 * @param {string} text The CSV text.
 * @returns {UnitRow[]} The units, as table rows.
 */
function parseUnitsCsv(text: string): UnitRow[] {
  const rows = parseCsv(text)
  const [first = []] = rows
  const header = readHeader(first)
  const positions =
    header ??
    new Map(UNIT_COLUMNS.map(({ field }, position) => [field, position]))
  const body = header === undefined ? rows : rows.slice(1)

  return body.map(cells => {
    const read = (field: UnitField): string => {
      const position = positions.get(field)
      return position === undefined ? '' : (cells[position] ?? '').trim()
    }

    return {
      id: read('id'),
      squareFeet: read('squareFeet'),
      bedrooms: read('bedrooms'),
      occupants: read('occupants'),
      occupiedDays: read('occupiedDays'),
    }
  })
}

export { parseUnitsCsv }
