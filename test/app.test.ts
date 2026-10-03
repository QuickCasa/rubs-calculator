import { describe, expect, it } from 'vitest'
import { buildResultsCsv } from '../app/build-results-csv.js'
import { EXAMPLE_STATE } from '../app/constants.js'
import { parseAmount } from '../app/parse-amount.js'
import { parseCsv } from '../app/parse-csv.js'
import { parseUnitsCsv } from '../app/parse-units-csv.js'
import { readBill } from '../app/read-bill.js'
import { allocateBill } from '../src/index.js'

describe('parseAmount', () => {
  it('reads amounts the way people type them', () => {
    expect(parseAmount('412.18')).toBe(41_218)
    expect(parseAmount('$1,284.5')).toBe(128_450)
    expect(parseAmount(' 90 ')).toBe(9000)
    expect(parseAmount('0.07')).toBe(7)
  })

  it('rejects anything that is not an amount', () => {
    expect(parseAmount('')).toBeUndefined()
    expect(parseAmount('12.345')).toBeUndefined()
    expect(parseAmount('-5')).toBeUndefined()
    expect(parseAmount('ten')).toBeUndefined()
  })
})

describe('parseCsv', () => {
  it('handles quotes, commas and line endings', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n\r\n1,2,3\n')).toEqual([
      ['a', 'b, c', 'say "hi"'],
      ['1', '2', '3'],
    ])
  })
})

describe('parseUnitsCsv', () => {
  it('matches header names in any order and ignores extra columns', () => {
    expect(
      parseUnitsCsv(
        'Tenant,Occupants,Unit #,Sq Ft,Beds\nAlex,2,101,650,1\nSam,1,102,700,2',
      ),
    ).toEqual([
      {
        id: '101',
        squareFeet: '650',
        bedrooms: '1',
        occupants: '2',
        occupiedDays: '',
      },
      {
        id: '102',
        squareFeet: '700',
        bedrooms: '2',
        occupants: '1',
        occupiedDays: '',
      },
    ])
  })

  it('reads columns in the standard order when there is no header', () => {
    expect(parseUnitsCsv('101,650,1,2,15')).toEqual([
      {
        id: '101',
        squareFeet: '650',
        bedrooms: '1',
        occupants: '2',
        occupiedDays: '15',
      },
    ])
  })
})

describe('the example building', () => {
  it('splits without problems and adds up to the bill', () => {
    const { input, problems } = readBill(EXAMPLE_STATE)

    expect(problems).toEqual([])
    expect(input).toBeDefined()

    if (input === undefined) {
      return
    }

    const allocation = allocateBill(input)

    expect(
      allocation.billedCents +
        allocation.commonAreaCents +
        allocation.vacancyCents,
    ).toBe(128_450)
  })
})

describe('readBill', () => {
  it('waits quietly while the form is empty', () => {
    expect(readBill({ ...EXAMPLE_STATE, total: '', units: [] })).toEqual({
      input: undefined,
      problems: [],
    })
  })

  it('explains a total that is not an amount', () => {
    expect(readBill({ ...EXAMPLE_STATE, total: 'abc' }).problems).toEqual([
      'Enter the bill total as an amount, such as 412.18.',
    ])
  })
})

describe('buildResultsCsv', () => {
  it('lists each charge with its formula, then the owner amounts and total', () => {
    const units = [
      { id: '101', squareFeet: 600 },
      { id: 'B, rear', squareFeet: 400 },
    ]
    const allocation = allocateBill({
      totalCents: 10_000,
      periodDays: 30,
      commonArea: { percent: 10 },
      methods: [{ factor: 'squareFeet', percent: 100 }],
      units,
    })

    expect(buildResultsCsv(allocation, units, 'CAD').split('\r\n')).toEqual([
      'Unit,Square feet,Bedrooms,Occupants,Days occupied,Charge (CAD),How it was worked out',
      '101,600,,,30,54.00,"Square footage (100%): $90.00 x 600 / 1,000 sq ft = $54.00; Total: $54.00"',
      '"B, rear",400,,,30,36.00,"Square footage (100%): $90.00 x 400 / 1,000 sq ft = $36.00; Total: $36.00"',
      'Common area (owner),,,,,10.00,',
      'Empty units (owner),,,,,0.00,',
      'Bill total,,,,,100.00,',
      '',
    ])
  })
})
