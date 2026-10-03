import type { Factor } from '../src/index.js'
import type { FormState, UnitField, UnitRow } from './types.js'

const STORAGE_KEY = 'quickcasa-rubs-calculator'

const CURRENCIES = ['CAD', 'USD'] as const

/**
 * The units table columns, in order, with the label each one is shown with.
 */
const UNIT_COLUMNS: readonly { field: UnitField; label: string }[] = [
  { field: 'id', label: 'Unit' },
  { field: 'squareFeet', label: 'Sq ft' },
  { field: 'bedrooms', label: 'Bedrooms' },
  { field: 'occupants', label: 'Occupants' },
  { field: 'occupiedDays', label: 'Days occupied' },
]

const METHOD_LABELS: Readonly<Record<Factor, string>> = {
  occupants: 'Occupants',
  squareFeet: 'Square footage',
  bedrooms: 'Bedrooms',
  perUnit: 'Per unit',
}

const EMPTY_ROW: UnitRow = {
  id: '',
  squareFeet: '',
  bedrooms: '',
  occupants: '',
  occupiedDays: '',
}

const DEFAULT_STATE: FormState = {
  total: '',
  currency: 'CAD',
  periodDays: '30',
  commonAreaType: 'none',
  commonAreaValue: '',
  methods: {
    occupants: { enabled: true, percent: '100', weights: '' },
    squareFeet: { enabled: false, percent: '', weights: '' },
    bedrooms: { enabled: false, percent: '', weights: '' },
    perUnit: { enabled: false, percent: '', weights: '' },
  },
  vacancy: 'owner',
  units: [{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }],
}

/**
 * The example building. Its numbers are made up to show how the calculator
 * works, and the page labels them as an example.
 */
const EXAMPLE_STATE: FormState = {
  total: '1284.50',
  currency: 'CAD',
  periodDays: '30',
  commonAreaType: 'percent',
  commonAreaValue: '10',
  methods: {
    occupants: { enabled: true, percent: '50', weights: '' },
    squareFeet: { enabled: true, percent: '50', weights: '' },
    bedrooms: { enabled: false, percent: '', weights: '' },
    perUnit: { enabled: false, percent: '', weights: '' },
  },
  vacancy: 'owner',
  units: [
    {
      id: '101',
      squareFeet: '650',
      bedrooms: '1',
      occupants: '1',
      occupiedDays: '',
    },
    {
      id: '102',
      squareFeet: '900',
      bedrooms: '2',
      occupants: '3',
      occupiedDays: '',
    },
    {
      id: '103',
      squareFeet: '900',
      bedrooms: '2',
      occupants: '2',
      occupiedDays: '12',
    },
    {
      id: '201',
      squareFeet: '480',
      bedrooms: '0',
      occupants: '1',
      occupiedDays: '',
    },
    {
      id: '202',
      squareFeet: '1150',
      bedrooms: '3',
      occupants: '4',
      occupiedDays: '',
    },
    {
      id: '203',
      squareFeet: '900',
      bedrooms: '2',
      occupants: '0',
      occupiedDays: '0',
    },
  ],
}

export {
  CURRENCIES,
  DEFAULT_STATE,
  EMPTY_ROW,
  EXAMPLE_STATE,
  METHOD_LABELS,
  STORAGE_KEY,
  UNIT_COLUMNS,
}
