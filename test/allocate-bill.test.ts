import { describe, expect, it } from 'vitest'
import { allocateBill, RubsInputError } from '../src/index.js'
import type { BillInput, UnitInput } from '../src/index.js'

/**
 * Builds a bill split entirely by square footage, the simplest useful case.
 *
 * @param {number} totalCents The bill total.
 * @param {UnitInput[]} units The units.
 * @returns {BillInput} The bill.
 */
function bySquareFeet(totalCents: number, units: UnitInput[]): BillInput {
  return {
    totalCents,
    periodDays: 30,
    methods: [{ factor: 'squareFeet', percent: 100 }],
    units,
  }
}

/**
 * Collects the problems a bill is rejected with.
 *
 * @param {BillInput} input The bill.
 * @returns {readonly string[]} The problems, or an empty list if it was accepted.
 */
function problemsFor(input: BillInput): readonly string[] {
  try {
    allocateBill(input)
  } catch (error) {
    if (error instanceof RubsInputError) {
      return error.problems
    }

    throw error
  }

  return []
}

describe('allocateBill', () => {
  it('splits by square footage', () => {
    const allocation = allocateBill(
      bySquareFeet(10_000, [
        { id: '101', squareFeet: 500 },
        { id: '102', squareFeet: 300 },
        { id: '103', squareFeet: 200 },
      ]),
    )

    expect(allocation.charges.map(charge => charge.cents)).toEqual([
      5000, 3000, 2000,
    ])
    expect(allocation.billedCents).toBe(10_000)
  })

  it('gives a leftover cent to the largest remainder, then the earliest unit', () => {
    const allocation = allocateBill({
      totalCents: 10_000,
      periodDays: 30,
      methods: [{ factor: 'perUnit', percent: 100 }],
      units: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([
      3334, 3333, 3333,
    ])
  })

  it('splits a one cent bill without inventing money', () => {
    const allocation = allocateBill({
      totalCents: 1,
      periodDays: 30,
      methods: [{ factor: 'perUnit', percent: 100 }],
      units: [{ id: 'A' }, { id: 'B' }, { id: 'C' }],
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([1, 0, 0])
  })

  it('charges nothing on a $0 bill', () => {
    const allocation = allocateBill(
      bySquareFeet(0, [
        { id: 'A', squareFeet: 700 },
        { id: 'B', squareFeet: 900 },
      ]),
    )

    expect(allocation.charges.map(charge => charge.cents)).toEqual([0, 0])
  })

  it('takes a common area percentage off the top', () => {
    const allocation = allocateBill({
      ...bySquareFeet(10_000, [
        { id: 'A', squareFeet: 600 },
        { id: 'B', squareFeet: 400 },
      ]),
      commonArea: { percent: 10 },
    })

    expect(allocation.commonAreaCents).toBe(1000)
    expect(allocation.charges.map(charge => charge.cents)).toEqual([5400, 3600])
  })

  it('takes a fixed common area amount off the top', () => {
    const allocation = allocateBill({
      ...bySquareFeet(10_000, [
        { id: 'A', squareFeet: 600 },
        { id: 'B', squareFeet: 400 },
      ]),
      commonArea: { cents: 2500 },
    })

    expect(allocation.commonAreaCents).toBe(2500)
    expect(allocation.charges.map(charge => charge.cents)).toEqual([4500, 3000])
  })

  it('mixes methods by their percentages', () => {
    const allocation = allocateBill({
      totalCents: 10_000,
      periodDays: 30,
      methods: [
        { factor: 'squareFeet', percent: 50 },
        { factor: 'occupants', percent: 50 },
      ],
      units: [
        { id: 'A', squareFeet: 600, occupants: 1 },
        { id: 'B', squareFeet: 400, occupants: 3 },
      ],
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([4250, 5750])
    expect(allocation.charges[0]?.steps.map(step => step.cents)).toEqual([
      3000, 1250,
    ])
  })

  it('uses a weights table for occupant counts', () => {
    const allocation = allocateBill({
      totalCents: 24_000,
      periodDays: 30,
      methods: [
        { factor: 'occupants', percent: 100, weights: [0, 1, 1.6, 2.2] },
      ],
      units: [
        { id: 'A', occupants: 1 },
        { id: 'B', occupants: 2 },
        { id: 'C', occupants: 3 },
        { id: 'D', occupants: 0, occupiedDays: 0 },
      ],
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([
      5000, 8000, 11_000, 0,
    ])
  })

  it('has the owner cover empty days by default', () => {
    const allocation = allocateBill(
      bySquareFeet(9000, [
        { id: 'A', squareFeet: 100 },
        { id: 'B', squareFeet: 100, occupiedDays: 15 },
        { id: 'C', squareFeet: 100 },
      ]),
    )

    expect(allocation.vacancy).toBe('owner')
    expect(allocation.charges.map(charge => charge.cents)).toEqual([
      3000, 1500, 3000,
    ])
    expect(allocation.vacancyCents).toBe(1500)
    expect(allocation.billedCents).toBe(7500)
  })

  it('can spread empty days across the occupied units instead', () => {
    const allocation = allocateBill({
      ...bySquareFeet(9000, [
        { id: 'A', squareFeet: 100 },
        { id: 'B', squareFeet: 100, occupiedDays: 15 },
        { id: 'C', squareFeet: 100 },
      ]),
      vacancy: 'occupied-units',
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([
      3600, 1800, 3600,
    ])
    expect(allocation.vacancyCents).toBe(0)
  })

  it('gives an empty unit no occupant share for the owner to cover', () => {
    const allocation = allocateBill({
      totalCents: 5000,
      periodDays: 30,
      methods: [{ factor: 'occupants', percent: 100 }],
      units: [
        { id: 'A', occupants: 2 },
        { id: 'B', occupants: 2, occupiedDays: 0 },
      ],
    })

    expect(allocation.charges.map(charge => charge.cents)).toEqual([5000, 0])
    expect(allocation.vacancyCents).toBe(0)
  })

  it('has the owner pay for a building that was empty all period', () => {
    const allocation = allocateBill(
      bySquareFeet(4321, [
        { id: 'A', squareFeet: 100, occupiedDays: 0 },
        { id: 'B', squareFeet: 300, occupiedDays: 0 },
      ]),
    )

    expect(allocation.vacancyCents).toBe(4321)
    expect(allocation.billedCents).toBe(0)
  })

  it('keeps a tiny unit next to a huge one within a cent of exact', () => {
    const allocation = allocateBill(
      bySquareFeet(123_457, [
        { id: 'Warehouse', squareFeet: 250_000 },
        { id: 'Closet', squareFeet: 12 },
      ]),
    )
    const [huge, tiny] = allocation.charges

    expect((huge?.cents ?? 0) + (tiny?.cents ?? 0)).toBe(123_457)
    expect(Math.abs((tiny?.cents ?? 0) - (tiny?.exactCents ?? 0))).toBeLessThan(
      1,
    )
  })

  it('returns charges in input order with trimmed ids', () => {
    const allocation = allocateBill(
      bySquareFeet(100, [
        { id: ' 2B ', squareFeet: 1 },
        { id: '1A', squareFeet: 1 },
      ]),
    )

    expect(allocation.charges.map(charge => charge.id)).toEqual(['2B', '1A'])
  })

  it('always adds up to the bill, with every amount within a cent of exact', () => {
    let seed = 42

    /**
     * A small seeded generator, so a failure can be reproduced.
     *
     * @param {number} maximum The exclusive upper bound.
     * @returns {number} A whole number from 0 to maximum - 1.
     */
    const random = (maximum: number): number => {
      seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648
      return seed % maximum
    }

    for (let run = 0; run < 500; run += 1) {
      const periodDays = 28 + random(4)
      const units = Array.from({ length: 1 + random(40) }, (_, index) => ({
        id: `U${String(index)}`,
        squareFeet: 300 + random(2000),
        bedrooms: 1 + random(4),
        occupants: random(6),
        occupiedDays: random(3) === 0 ? random(periodDays + 1) : periodDays,
      }))

      if (
        units.every(unit => unit.occupants === 0 || unit.occupiedDays === 0)
      ) {
        units[0] = {
          ...units[0],
          id: 'U0',
          occupants: 1,
          occupiedDays: periodDays,
          squareFeet: 500,
          bedrooms: 1,
        }
      }

      const input: BillInput = {
        totalCents: random(5_000_000),
        periodDays,
        commonArea: random(2) === 0 ? { percent: random(30) } : undefined,
        vacancy: random(2) === 0 ? 'owner' : 'occupied-units',
        methods: [
          { factor: 'squareFeet', percent: 33.33 },
          { factor: 'occupants', percent: 33.33 },
          { factor: 'bedrooms', percent: 33.34 },
        ],
        units,
      }
      const allocation = allocateBill(input)
      const total =
        allocation.billedCents +
        allocation.commonAreaCents +
        allocation.vacancyCents

      expect(total).toBe(input.totalCents)

      for (const charge of allocation.charges) {
        expect(Number.isSafeInteger(charge.cents)).toBe(true)
        expect(Math.abs(charge.cents - charge.exactCents)).toBeLessThan(1)
      }
    }
  })
})

describe('allocateBill rejects', () => {
  const units: UnitInput[] = [
    { id: 'A', squareFeet: 500, bedrooms: 1, occupants: 1 },
    { id: 'B', squareFeet: 700, bedrooms: 2, occupants: 2 },
  ]

  it('percentages that do not add up to 100', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, units),
        methods: [
          { factor: 'squareFeet', percent: 50 },
          { factor: 'occupants', percent: 40 },
        ],
      }),
    ).toEqual(['The split percentages add up to 90, not 100.'])
  })

  it('the same method twice', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, units),
        methods: [
          { factor: 'squareFeet', percent: 50 },
          { factor: 'squareFeet', percent: 50 },
        ],
      }),
    ).toEqual(['Split by square footage appears twice. Combine them into one.'])
  })

  it('a unit listed twice', () => {
    expect(
      problemsFor(
        bySquareFeet(100, [
          { id: 'A', squareFeet: 1 },
          { id: 'A ', squareFeet: 1 },
        ]),
      ),
    ).toEqual(['Unit A is listed more than once.'])
  })

  it('a studio under the bedrooms split without weights', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, [
          { id: 'S1', bedrooms: 0 },
          { id: 'B', bedrooms: 2 },
        ]),
        methods: [{ factor: 'bedrooms', percent: 100 }],
      }),
    ).toEqual([
      'Unit S1 has 0 bedrooms, so it would pay nothing toward the bedrooms split. Add bedroom weights to give studios a share.',
    ])
  })

  it('a count past the end of the weights table', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, units),
        methods: [{ factor: 'occupants', percent: 100, weights: [0, 1] }],
      }),
    ).toEqual([
      'Unit B has 2 occupants, but the occupants weights only go up to 1.',
    ])
  })

  it('weights on a factor that is not a count', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, units),
        methods: [{ factor: 'squareFeet', percent: 100, weights: [1, 2] }],
      }),
    ).toEqual([
      'Weights by count only apply to occupants and bedrooms, not square footage.',
    ])
  })

  it('an occupants split when nobody lived there', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, [
          { id: 'A', occupants: 0 },
          { id: 'B', occupants: 3, occupiedDays: 0 },
        ]),
        methods: [{ factor: 'occupants', percent: 100 }],
      }),
    ).toEqual([
      "Every unit has a weight of 0 for the occupants split during this period, so that part of the bill can't be split.",
    ])
  })

  it('a building that was empty all period with no owner to cover it', () => {
    expect(
      problemsFor({
        ...bySquareFeet(100, [{ id: 'A', squareFeet: 1, occupiedDays: 0 }]),
        vacancy: 'occupied-units',
      }),
    ).toEqual([
      "Every unit was empty for the whole period, so there's no one to split the bill between.",
    ])
  })

  it('bad totals, periods and occupied days', () => {
    expect(
      problemsFor({
        ...bySquareFeet(-5, [{ id: 'A', squareFeet: 1, occupiedDays: 31 }]),
        commonArea: { percent: 120 },
      }),
    ).toEqual([
      'The bill total must be a whole number of cents, 0 or more.',
      'The common area percentage must be from 0 to 100.',
      'Unit A needs occupied days as a whole number from 0 to 30.',
    ])
  })

  it('a unit missing the value a method needs', () => {
    expect(
      problemsFor(bySquareFeet(100, [{ id: 'A' }, { id: '', squareFeet: 4 }])),
    ).toEqual([
      'Unit A needs a floor area above 0.',
      'Unit 2 in the list needs a name or number.',
    ])
  })
})
