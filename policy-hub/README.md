# PolicyHub

A small React app for browsing insurance policies. You get a list of
policies, click one, and see its details (premium, status, end date, agent
notes). Click back to return to the list.

Built with Create React App, React 19, Jest and React Testing Library.

## Running it

You need Node 24 (that's what CI uses).

```sh
cd policy-hub
npm ci
npm start
```

It opens on http://localhost:3000.

**Heads up:** there's no backend in this repo. The app calls `/api/policies`
and `/api/policies/:id`, and nothing is set up to answer those. So `npm start`
shows the loading state and then the error message. The tests mock the API,
so they don't need a server. To see real data you'd have to run something on
the same origin or add a `proxy` to package.json.

## Scripts

| Command                 | What it does                                          |
|-------------------------|-------------------------------------------------------|
| `npm start`             | Dev server with reload                                |
| `npm test`              | Jest in watch mode                                    |
| `npm run test:coverage` | One run with coverage, fails under the thresholds     |
| `npm run lint`          | ESLint on `src`, zero warnings allowed                |
| `npm run build`         | Production build into `build/`                        |

For a single non-watch run: `CI=true npm test -- --watchAll=false`.

## How it's put together

- `App` holds `selectedPolicyId` and switches between the list and the detail
  page. No router, no Context or Redux, since nothing else needs that state.
- `PolicyListContainer` and `PolicyDetailContainer` fetch the data and own the
  loading / error / success state. `PolicyList` and `PolicyCard` just render
  what they're given.
- `src/api/policyClient.js` is the only place that calls `fetch`.
- "Expired" isn't stored anywhere. It's worked out on render from `status` and
  `endDate`, so it can't drift out of sync.
- Agent notes are HTML, so they go through `PolicyNotes`, which sanitizes with
  DOMPurify (strict tag allowlist) before rendering. Everything else is plain
  JSX, which React escapes.

The longer reasoning is in the docs at the repo root:
`architecture-design.md`, `xss-audit.md`, `ci-gate-config.md` and
`flaky-test-strategy.md`.

## Tests and CI

Tests query by role and text, the way a user would, and mock `policyClient`
instead of hitting a network. There's also a security suite that pushes XSS
payloads through the real detail view.

Coverage thresholds live in the `jest` block of package.json (90% statements,
lines and functions, 75% branches). `npm run test:coverage` fails if it drops
below those.

GitHub Actions (`.github/workflows/ci.yml`) runs lint, then test, then build on
every PR and on pushes to main. Each one needs the one before it to pass.

## Known limitations

- No backend or mock server, see above.
- Going back to the list unmounts the detail page, so opening the same policy
  again refetches it.
- The selected policy is only in state, so a page refresh drops you back on the
  list. Putting it in the URL (`/policies/:id`) would fix that.
- The fetch-and-cancel logic is copy-pasted in both containers. I want to move
  it into a `useAsync` hook (sketched in `architecture-design.md`).
- `PolicyCard` shows "Expired" for an active policy past its end date, but the
  detail page prints the raw status, so the two can disagree. They should share
  one helper.
- `formatPremium` lives in `PolicyCard.js` and should be in its own file.
- No auth yet. The token storage and CSRF notes are only a plan.
- CI doesn't deploy anything.
