/**
 * Splits CSV text into rows of cells. Handles quoted cells, including commas,
 * doubled quotes and line breaks inside quotes, and both Windows and Unix line
 * endings. Blank lines are skipped.
 *
 * @param {string} text The CSV text.
 * @returns {string[][]} The rows.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"'
        index += 1
      } else if (character === '"') {
        inQuotes = false
      } else {
        cell += character
      }

      continue
    }

    if (character === '"') {
      inQuotes = true
    } else if (character === ',') {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') {
        index += 1
      }

      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  row.push(cell)
  rows.push(row)

  return rows.filter(cells => cells.some(value => value.trim() !== ''))
}

export { parseCsv }
