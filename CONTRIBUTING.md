# Contributing

Thanks for wanting to help. The most useful contributions are reports of a bill
the calculator splits wrong, and splitting methods that real buildings use and
it doesn't support yet.

## Reporting a wrong split

Open an issue with:

- The bill total, the billing period and the methods you used.
- The units, or the smallest set of units that shows the problem.
- What you expected each unit to pay, and how you worked it out.

## Getting set up

You need Node.js 22 or later.

```bash
npm install
npm run check
npm run dev
```

`npm run check` runs everything CI runs: the formatting check, the typecheck,
the tests, the library build, ESLint and the calculator page build. `npm run
dev` serves the calculator page with live reload.

The library is in `src/`, and the calculator page is in `app/`. The page
imports the library from source, so a change to the library shows up on the
page straight away.

## Rules for changes

- Amounts stay in whole cents, and every split must add up to the bill total
  exactly. The tests in `test/allocate-bill.test.ts` include a randomized check
  of this. Keep it passing.
- Every new input needs a validation message written for the person entering
  the bill, not for a developer.
- The library has no dependencies, and the calculator page sends nothing over
  the network. Changes that add either need a strong reason in the pull
  request.
- Code follows [@quickcasa/eslint-config](https://github.com/QuickCasa/eslint-config),
  and Prettier formats everything. Run `npm run format` before committing.

## Releasing

Maintainers only.

1. Update the version in `package.json` and add an entry to `CHANGELOG.md`.
2. Commit, then tag the commit, for example `git tag v1.1.0`.
3. Push the commit and the tag. The release workflow runs the full check,
   creates the GitHub release with the packed tarball attached and stages the
   version on npm. npm trusts the workflow directly, so there is no npm token.
   The Pages workflow redeploys the calculator page.
4. Approve the staged version with 2FA. Find its id with `npm stage list`, then
   run `npm stage approve <stage-id>`. Until then, the version isn't
   installable.
