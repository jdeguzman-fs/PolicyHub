# Flaky Test Strategy

## The rule

A test that fails intermittently is treated as a real bug in the test (or
the code it covers) until proven otherwise. It never gets silently
skipped to make CI green.

## Why silent skips are banned

A silently skipped test (`it.skip`, `xit`, `test.todo` left unresolved,
commenting the test out) removes coverage without anyone deciding to
remove it. It doesn't show up as a CI failure, so:

- The coverage thresholds in `package.json` can pass while a real code
  path is untested — the gate lies about what it's actually guaranteeing.
- The person who hits the bug the skipped test would have caught has no
  way to connect the incident back to "oh, that test was flaky and got
  skipped six months ago."
- Skips accumulate silently. One skipped test is a shortcut; twenty is a
  test suite nobody trusts, because "skip it" became the default response
  to any red build.

If a test is disabled, that decision has to be visible in the same place
the test result would be: in CI output and in the PR, not buried in a
one-line code change nobody reviews closely.

## Retry vs. quarantine vs. fix-vs-skip

**1. Retry — for tests with a known, external source of nondeterminism**

Use a bounded retry (e.g. `jest.retryTimes(2)`) only when the flake is
understood and comes from something outside the code under test —
timing-sensitive async assertions, a shared test-database race, etc.
Retry is a mitigation, not a fix: it buys time, and the underlying cause
still gets a follow-up ticket. Never retry a test whose failure mode is
unknown — that's masking, not mitigating.

**2. Quarantine — for tests that are flaky for an unknown reason**

If a test fails intermittently and the cause isn't understood yet:

- Move it out of the blocking `test` job into a separate, non-blocking
  "quarantine" job/script (still runs in CI, still reported, just not a
  required status check).
- Open a tracking issue the same day it's quarantined, linking the test
  name and a failure log.
- Quarantine has an expiry: if it isn't diagnosed within an agreed window
  (e.g. 2 weeks), it escalates — either someone is assigned to fix it, or
  it gets deleted outright (not skipped — deleted, so the decision to
  drop that coverage is an explicit, reviewed commit).

**3. Fix vs. skip — the actual decision at the end of quarantine**

Once the cause is understood, there are exactly two acceptable outcomes:

- **Fix it.** Most flakiness traces back to a real issue: unawaited
  promises, shared mutable state between tests, relying on real timers,
  order-dependent assertions. Fixing the root cause is always preferred.
- **Delete it, deliberately.** If the test is genuinely no longer valid
  (covers removed behavior, duplicates another test, was testing an
  implementation detail that shouldn't have been asserted on), remove it
  in a commit that says why. That's a decision, reviewed like any other
  change — not a skip that quietly rots in the suite.

"Skip and move on" is not a third option. A skip with no expiry and no
owner is how quarantine becomes permanent and coverage erodes without
anyone signing off on it.

## Summary

| Situation                          | Action                                   |
|-------------------------------------|-------------------------------------------|
| Known external nondeterminism       | Bounded retry + follow-up ticket          |
| Unknown cause                       | Quarantine (non-blocking, tracked, timed) |
| Cause understood                    | Fix the root cause                        |
| Test no longer valid                | Delete explicitly, with reasoning in the commit |
| "It's annoying, just skip it"       | Not allowed                               |
