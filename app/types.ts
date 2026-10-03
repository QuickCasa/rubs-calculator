import type {
  Allocation,
  BillInput,
  Factor,
  UnitInput,
  VacancyPolicy,
} from '../src/index.js'

/**
 * A row in the units table, kept as the text the person typed so it can be
 * saved and restored exactly.
 */
interface UnitRow {
  id: string
  squareFeet: string
  bedrooms: string
  occupants: string
  occupiedDays: string
}

type UnitField = keyof UnitRow

interface MethodState {
  enabled: boolean
  percent: string
  weights: string
}

type CommonAreaType = 'none' | 'percent' | 'amount'

interface FormState {
  total: string
  currency: string
  periodDays: string
  commonAreaType: CommonAreaType
  commonAreaValue: string
  methods: Record<Factor, MethodState>
  vacancy: VacancyPolicy
  units: UnitRow[]
}

/**
 * The form read as a bill. `input` is undefined when the form is empty or has
 * problems the calculator can't check itself.
 */
interface ReadResult {
  input: BillInput | undefined
  problems: string[]
}

/**
 * The last successful result, kept for the CSV download.
 */
interface LatestResult {
  allocation: Allocation
  units: UnitInput[]
}

/**
 * The inputs for one method in the "How to split it" section.
 */
interface MethodInputs {
  enabled: HTMLInputElement
  percent: HTMLInputElement
  weights: HTMLInputElement | undefined
}

export type {
  CommonAreaType,
  FormState,
  LatestResult,
  MethodInputs,
  MethodState,
  ReadResult,
  UnitField,
  UnitRow,
}
