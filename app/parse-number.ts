/**
 * Reads a number from a form field. A blank field is undefined, and anything
 * that isn't a number comes back as NaN so the calculator can say which field
 * is wrong.
 *
 * @param {string} text What the person typed.
 * @returns {number | undefined} The number, NaN, or undefined for a blank field.
 */
function parseNumber(text: string): number | undefined {
  const cleaned = text.replaceAll(/[\s,]/gu, '')

  if (cleaned === '') {
    return undefined
  }

  return Number(cleaned)
}

export { parseNumber }
