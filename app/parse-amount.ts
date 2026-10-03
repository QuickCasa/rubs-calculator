/**
 * Reads a money amount such as "1,284.50" or "$412" as a whole number of
 * cents. Thousands separators, spaces and a dollar sign are allowed.
 *
 * @param {string} text What the person typed.
 * @returns {number | undefined} The amount in cents, or undefined when it isn't an amount.
 */
function parseAmount(text: string): number | undefined {
  const cleaned = text.replaceAll(/[\s$,]/gu, '')

  if (!/^\d+(?:\.\d{0,2})?$/u.test(cleaned)) {
    return undefined
  }

  const [dollars = '0', cents = ''] = cleaned.split('.', 2)

  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'))
}

export { parseAmount }
