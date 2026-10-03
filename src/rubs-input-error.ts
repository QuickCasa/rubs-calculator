/**
 * Thrown when a bill can't be split as given. `problems` lists every problem
 * found, each written so it can be shown to the person who entered the bill.
 */
class RubsInputError extends Error {
  readonly problems: readonly string[]

  constructor(problems: readonly string[]) {
    super(`The bill can't be split: ${problems.join(' ')}`)
    this.name = 'RubsInputError'
    this.problems = problems
  }
}

export { RubsInputError }
