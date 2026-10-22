# PolicyHub architecture - Day 9

Writing down how the frontend is structured right now and why, plus what I'd
change next. Security audit for auth (token storage + Cross-Site Request Forgery (CSRF)) is at the bottom.
Nothing here is being refactored in this PR, it's just the doc.

## Component tree

```
App  (holds selectedPolicyId)
├── PolicyListContainer   -> fetches /api/policies
│   └── PolicyList
│       └── PolicyCard
└── PolicyDetailContainer -> fetches /api/policies/:id
    └── PolicyNotes       -> sanitized agent notes (Day 8)
```

`App` shows either the list or the detail page, not both. Clicking a card sets
`selectedPolicyId`, the back button clears it. No router yet.

All API calls go through `api/policyClient.js`, and all HTML sanitizing goes
through `security/sanitizeHtml.js`.

## Containers vs presentational

The containers (`PolicyListContainer`, `PolicyDetailContainer`) do the
fetching and handle loading / error / success. `PolicyList`, `PolicyCard` and
`PolicyNotes` just take props and render.

The main reason I kept it like this is testing. The presentational tests are
just "render with these props and check the output", no mocks. The container
tests only mock `policyClient`, not `fetch` itself, since containers never
call `fetch` directly.

It's not perfectly clean yet though:

- `PolicyDetailContainer` renders the detail markup itself (name, status,
  premium). The list side hands off to `PolicyList`, the detail side should
  do the same with a `PolicyDetail` component.
- `formatPremium` is exported from `PolicyCard.js` and the detail container
  imports it from there. Should be in its own file like `src/format.js`.
- Found a small bug while going through this - `PolicyCard` shows "Expired"
  for an active policy past its `endDate`, but the detail page prints
  `policy.status` as is, so the same policy says "Status: active" there.
  Both should use one helper for the status.

## Custom hooks

Both containers have the same block copy-pasted: `status` state, a
`useEffect` that calls the API, and a `cancelled` flag so an old response
doesn't overwrite a newer one when you switch policies fast. I'd move that
into a hook:

```js
// src/hooks/useAsync.js
export function useAsync(load) {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading', data: null });
    load()
      .then((data) => !cancelled && setState({ status: 'success', data }))
      .catch(() => !cancelled && setState({ status: 'error', data: null }));
    return () => { cancelled = true; };
  }, [load]);

  return state;
}

export const usePolicies = () => useAsync(fetchPolicies);

export function usePolicy(id) {
  const load = useCallback(() => fetchPolicyById(id), [id]);
  return useAsync(load);
}
```

`load` is the only dependency now, so the effect reruns when the request
changes and can't use an old closure. The catch is that `load` has to be
stable (module-level function or `useCallback`), which is why `usePolicy`
wraps the call in `useCallback`. No `eslint-disable` needed.

Then the detail container is basically just:

```js
const { status, data: policy } = usePolicy(policyId);
if (status === 'loading') return <p role="status">Loading...</p>;
if (status === 'error') return <p role="alert">We couldn't load this policy...</p>;
return <PolicyDetail policy={policy} />;
```

The existing container tests mock `policyClient` and check what's on screen,
so they shouldn't need changes after this. `useAsync` would get its own test
for the cancel case.

Not adding React Query / SWR for now. Two read-only endpoints doesn't need it.
Probably worth it once we have writes or need caching.

## Where state lives

- `selectedPolicyId` is in `App` because both the list (sets it) and the
  detail page (reads it) need it, and `App` is the closest parent of both.
- The fetched data + status stays inside each container since nothing else
  uses it.
- "Expired" isn't stored anywhere, it's calculated from `status` + `endDate`
  on render so it can't get out of sync.

No Context or Redux - there's nothing shared enough to need it yet.

Downside right now: going back to the list unmounts the detail page, so
opening the same policy again refetches it. Fine for now. The bigger thing
is a refresh loses where you were since `selectedPolicyId` is only in state.
Moving it to the URL (`/policies/:id`) with React Router would fix that.

## Security audit - token storage and CSRF

### Current state

There's no login yet. `policyClient` calls `fetch('/api/policies')` with no
auth header and nothing is stored in the browser. So this is more about
deciding now before auth gets built.

The data is customer insurance policies, premiums, and agent notes, and later
probably contact details and beneficiaries. Getting a session stolen here is
a big deal.

### Where to store the token

| Option            | XSS can steal it? | Needs CSRF protection? |
|-------------------|-------------------|------------------------|
| localStorage      | Yes               | No                     |
| httpOnly cookie   | No                | Yes                    |
| BFF               | No (browser never gets the token) | Yes, for the BFF's cookie |

localStorage is the easiest but any XSS can read the token and send it out,
and it keeps working until it expires. Keeping it only in memory is a bit
better but it's gone on refresh, so you end up needing a refresh token in a
cookie anyway.

httpOnly cookies can't be read by JS at all. One thing I didn't realize
before the reading - httpOnly stops the token from being *stolen*, but an XSS
can still *use* the session while the page is open, since any `fetch` it
makes sends the cookie along. So the Day 8 sanitizer still matters, cookies
just make an XSS less bad.

A BFF is a small server on our domain that holds the actual tokens and
proxies calls to the API. The browser only gets a session cookie. Most secure
but it's another thing to run.

My recommendation: `HttpOnly; Secure; SameSite=Lax` session cookie, through a
BFF if we can. Don't put tokens in localStorage.

### CSRF

Going with cookies means we need CSRF protection, because the browser sends
the cookie on requests that come from other sites too. From the OWASP cheat
sheet, what applies to us:

- `SameSite=Lax` on the cookie. Blocks most cross-site requests, but still
  allows top-level GET navigation.
- Which is why GET should never change anything. Writes have to be
  POST/PUT/PATCH/DELETE. We only have reads right now so this is for later.
- CSRF token on every write (synchronizer token or signed double-submit
  cookie), server rejects it if missing/wrong.
- Require a custom header like `X-CSRF: 1` on writes. A form on another site
  can't set headers, and a cross-site fetch with one triggers a CORS preflight
  that we won't allow. Easy to add since everything goes through
  `policyClient`.
- Check `Origin` / `Sec-Fetch-Site` on the server as an extra layer.
- Protect the login form too (login CSRF).

If there's an XSS, all of this goes out the window since the script is
running on our own site and can read the token and set the header. So XSS
prevention still comes first.
