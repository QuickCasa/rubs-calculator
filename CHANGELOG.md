# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## 1.0.0 - 2026-10-03

First open source release.

### Library

- `allocateBill` splits a bill by occupants, square footage, bedrooms, a flat
  amount per unit, or a mix of them by percentage.
- Common area deductions as a percentage or a fixed amount.
- Part-period occupancy, with the owner paying for empty days by default or
  the occupied units splitting them.
- Weights by count for occupants and bedrooms.
- Largest remainder rounding, so every split adds up to the bill exactly.
- `explainCharge` writes out the formula behind each charge.
- `RubsInputError` lists every problem with an input in plain language.

### Calculator page

- Splits a bill in the browser with the same library, and shows each unit's
  charge, share of the bill and formula.
- Imports units from CSV and exports the charges to CSV.
- Saves the form in the browser between visits.
