# CI gate config for main

Couldn't set this up directly in Settings even though I have admin on
the repo. Ran this to check branch protection and got a plan error, not
a permissions one:

```
$ gh api repos/jdeguzman-fs/PolicyHub/branches/main/protection
{"message":"Upgrade to GitHub Pro or make this repository public to enable this feature.", "status":403}
```

Private repos on the free plan just don't get branch protection or
rulesets, admin or not. So writing down exactly what to click once we're
on a plan that supports it (or if someone wants to flip the repo public).

## Where the checks come from

`.github/workflows/ci.yml` (workflow name `CI`), runs on every PR and on pushes to main.
Three jobs, chained with `needs:` so they run lint -> test -> build in
that order and stop at the first failure. Each job has its own `name:` now,
and that's what GitHub shows as the check. Branch protection matches on
that name, so renaming a job id later won't break the rule:

- Lint
- Test
- Build

## What to turn on

Settings > Branches > Add rule, pattern `main`:

- Require a pull request before merging
- Require status checks to pass before merging
  - also check "require branches to be up to date"
  - add Lint, Test, Build as the required checks
- Include administrators in the restriction (don't let this get bypassed)

## Coverage side of it

The `test` job already fails on its own if coverage drops, via
`jest.coverageThreshold` in policy-hub/package.json:

| Metric     | Threshold |
|------------|-----------|
| Statements | 90%       |
| Branches   | 75%       |
| Functions  | 90%       |
| Lines      | 90%       |

We're above all of these right now. Run `npm run test:coverage` for the
current numbers. Not writing them here since they'd be out of date fast.

## End result once this is live

No PR gets merged into main unless Lint, Test, and Build are all green,
and a stale branch has to catch up before it's allowed to merge - so
someone can't sneak a change in against an old version of main that
never ran the current checks.
