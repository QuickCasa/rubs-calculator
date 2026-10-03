# RUBS Calculator

[![CI](https://github.com/QuickCasa/rubs-calculator/actions/workflows/ci.yml/badge.svg)](https://github.com/QuickCasa/rubs-calculator/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A free, open source RUBS (ratio utility billing) calculator. It splits a
building's utility bill across its units by occupants, square footage,
bedrooms or a mix, and shows the formula behind every charge.

Use the **[calculator page](https://quickcasa.github.io/rubs-calculator/)** in
your browser, or install the TypeScript library, which has no dependencies.
The page runs entirely in your browser and sends nothing anywhere.

## What it handles

- Splitting by occupants, square footage, bedrooms or a flat amount per unit,
  or any mix of them by percentage.
- A common area deduction, as a percentage or a fixed amount, which the owner
  pays.
- Units occupied for part of the billing period. By default the owner pays for
  the days a unit was empty, or you can split them across the occupied units.
- Weights by count, so a second occupant can count for less than the first, or
  a studio can count the same as a one bedroom.
- Rounding to the cent that always adds up. The charges, the common area and
  the owner's share for empty units total the bill exactly, and no amount is
  more than a cent from its exact value.
- A plain-language formula for every charge, to check by hand or show a tenant.

## Before you bill tenants

Rules for billing tenants for utilities differ by province, state and city,
and your leases have to allow it. Check what applies to your buildings before
you send a bill. This library does the math, and it isn't legal advice.

## Install

```bash
npm install @quickcasa/rubs-calculator
```

It's an ES module with TypeScript types, for Node.js 22 or later and any
current browser bundler.

## Usage

Amounts are whole numbers of cents, so no money is lost to floating point.

```ts
import { allocateBill, explainCharge } from '@quickcasa/rubs-calculator'

const allocation = allocateBill({
  totalCents: 41_218,
  periodDays: 30,
  commonArea: { percent: 10 },
  methods: [
    { factor: 'occupants', percent: 50 },
    { factor: 'squareFeet', percent: 50 },
  ],
  units: [
    { id: '101', squareFeet: 650, occupants: 2 },
    { id: '102', squareFeet: 900, occupants: 3, occupiedDays: 20 },
    { id: '103', squareFeet: 480, occupants: 1 },
  ],
})

allocation.charges.map(charge => [charge.id, charge.cents])
// [['101', 13358], ['102', 12902], ['103', 8095]]

allocation.commonAreaCents
// 4122
allocation.vacancyCents
// 2741, for the 10 days unit 102 was empty
```

`explainCharge` writes out how a charge was worked out:

```ts
explainCharge(allocation.charges[1], { currency: 'CAD', locale: 'en-CA' })
```

```text
Occupants (50%): $185.48 x 3 x 20/30 days / 5 occupants = $74.19
Square footage (50%): $185.48 x 900 x 20/30 days / 2,030 sq ft = $54.82
The owner covers $27.41 for the 10 empty days.
Total: $129.0144, billed as $129.02
```

## API

### `allocateBill(input)`

Splits a bill and returns an `Allocation`. Throws a `RubsInputError` when the
bill can't be split as given.

| Field        | Type                          | Description                                                               |
| ------------ | ----------------------------- | ------------------------------------------------------------------------- |
| `totalCents` | `number`                      | The bill total in cents, or the smallest unit of your currency.           |
| `periodDays` | `number`                      | The number of days the bill covers.                                       |
| `commonArea` | `{ percent } \| { cents }`    | Optional. Taken off the top and paid by the owner.                        |
| `methods`    | `AllocationMethod[]`          | One or more ways to split the bill. Their percentages must add up to 100. |
| `vacancy`    | `'owner' \| 'occupied-units'` | Optional. Who pays for empty days. Defaults to `'owner'`.                 |
| `units`      | `UnitInput[]`                 | The units to split the bill across.                                       |

Each `AllocationMethod` has:

- `factor`: `'occupants'`, `'squareFeet'`, `'bedrooms'` or `'perUnit'`.
- `percent`: the share of the bill, after the common area, that this method
  splits.
- `weights`: optional, for `occupants` and `bedrooms` only. The weight for each
  count, starting from 0. `[0, 1, 1.6, 2.2]` makes one occupant count as 1, two
  as 1.6 and three as 2.2. Every count in use needs an entry.

Each `UnitInput` has an `id`, plus `squareFeet`, `bedrooms` and `occupants` for
whichever methods you use. `occupiedDays` defaults to the whole period. Set it
to 0 for a unit that was empty.

A unit with 0 bedrooms is rejected under the bedrooms method unless you pass
`weights`, because it would otherwise pay nothing toward that part of the bill.

The returned `Allocation` has:

- `charges`: one `UnitCharge` per unit, in input order, with `cents` (the
  amount to bill), `exactCents` (before rounding) and `steps` (every number
  each method used).
- `commonAreaCents` and `vacancyCents`: what the owner pays.
- `billedCents`: the sum of the charges.

### `explainCharge(charge, options)`

Returns the explanation for one `UnitCharge` as an array of lines. `options`
takes a `currency` code such as `'CAD'` or `'USD'`, and an optional `locale`
for number formatting.

### `RubsInputError`

Has a `problems` array with every problem found in the input, each written to
be shown to the person who entered the bill, such as
`"Unit 102 needs a floor area above 0."`

## How the split works

1. The common area deduction comes off the top.
2. Each method splits its percentage of what's left. A unit's part is the
   method's amount times the unit's weight, times the share of the period it
   was occupied, divided by the total weight of every unit.
3. With the `owner` vacancy option, the total weight also counts every unit's
   empty days, and the owner pays that part. With `occupied-units`, empty days
   don't count, so the occupied units split the whole amount. Occupants are
   the exception: an empty unit has no occupants, so its empty days weigh
   nothing either way.
4. Every amount is rounded down to the cent, and the cents left over go one at
   a time to the amounts that lost the most in rounding. The common area and
   the owner's share for empty days come first in line, then the units in
   input order, so on a tie the owner pays the extra cent before any tenant
   does.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence

[MIT](LICENSE). Built and maintained by [QuickCasa](https://quickcasa.ai) in
Kitchener, Ontario.
