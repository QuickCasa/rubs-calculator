import { describe, expect, it } from 'vitest'
import { allocateBill, explainCharge } from '../src/index.js'

describe('explainCharge', () => {
  it('writes each step as a formula and shows the rounding', () => {
    const allocation = allocateBill({
      totalCents: 10_000,
      periodDays: 30,
      methods: [{ factor: 'squareFeet', percent: 100 }],
      units: [
        { id: 'A', squareFeet: 850 },
        { id: 'B', squareFeet: 8550 },
      ],
    })
    const [charge] = allocation.charges

    expect(
      charge && explainCharge(charge, { currency: 'USD', locale: 'en-US' }),
    ).toEqual([
      'Square footage (100%): $100.00 x 850 / 9,400 sq ft = $9.04',
      'Total: $9.0426, billed as $9.04',
    ])
  })

  it('shows weights, part-period occupancy and what the owner covers', () => {
    const allocation = allocateBill({
      totalCents: 9000,
      periodDays: 30,
      methods: [
        { factor: 'squareFeet', percent: 50 },
        { factor: 'occupants', percent: 50, weights: [0, 1, 1.5] },
      ],
      units: [
        { id: 'A', squareFeet: 100, occupants: 2, occupiedDays: 10 },
        { id: 'B', squareFeet: 200, occupants: 1 },
      ],
    })
    const [charge] = allocation.charges

    expect(
      charge && explainCharge(charge, { currency: 'CAD', locale: 'en-CA' }),
    ).toEqual([
      'Square footage (50%): $45.00 x 100 x 10/30 days / 300 sq ft = $5.00',
      'Occupants (50%): $45.00 x 1.5 (the weight for 2 occupants) x 10/30 days / 1.5 = $15.00',
      'The owner covers $10.00 for the 20 empty days.',
      'Total: $20.00',
    ])
  })

  it('formats currencies without cents', () => {
    const allocation = allocateBill({
      totalCents: 3000,
      periodDays: 30,
      methods: [{ factor: 'perUnit', percent: 100 }],
      units: [{ id: 'A' }, { id: 'B' }],
    })
    const [charge] = allocation.charges

    expect(
      charge && explainCharge(charge, { currency: 'JPY', locale: 'en-US' }),
    ).toEqual([
      'Per unit (100%): ¥3,000 x 1 / 2 units = ¥1,500',
      'Total: ¥1,500',
    ])
  })
})
