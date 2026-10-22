/* eslint-disable testing-library/no-node-access, no-script-url */
import { render, screen } from '@testing-library/react';

import PolicyNotes from '../PolicyNotes';
import PolicyDetailContainer from '../PolicyDetailContainer';
import { fetchPolicyById } from '../api/policyClient';
import { sanitizeHtml } from './sanitizeHtml';

jest.mock('../api/policyClient');

const XSS_PAYLOADS = [
  ['img onerror', '<img src=x onerror="window.__xss()">'],
  ['script tag', '<script>window.__xss()</script>'],
  ['svg onload', '<svg onload="window.__xss()"><circle r="1"/></svg>'],
  ['iframe srcdoc', '<iframe srcdoc="<script>parent.__xss()</script>"></iframe>'],
  ['javascript: link', '<a href="javascript:window.__xss()">click me</a>'],
  ['data: link', '<a href="data:text/html,<script>alert(1)</script>">click me</a>'],
  ['event handler on allowed tag', '<p onclick="window.__xss()" onmouseover="window.__xss()">hi</p>'],
  ['details ontoggle', '<details open ontoggle="window.__xss()"><summary>x</summary></details>'],
  ['body onload', '<body onload="window.__xss()">'],
  ['malformed / unclosed', '<img src=x onerror=window.__xss() <p>'],
  ['style injection', '<p style="background:url(javascript:window.__xss())">x</p>'],
];

const DANGEROUS_TAGS = 'script, img, svg, iframe, object, embed, form, input, style, details, body, math';
const EVENTS = ['error', 'load', 'click', 'mouseover', 'focus', 'toggle'];

function assertInert(container) {
  expect(container.querySelector(DANGEROUS_TAGS)).toBeNull();

  container.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      expect(attr.name).not.toMatch(/^on/i);
      expect(attr.name).not.toBe('style');
      if (attr.name === 'href') {
        expect(attr.value).not.toMatch(/^\s*(javascript|data|vbscript):/i);
      }
    });
    EVENTS.forEach((type) => el.dispatchEvent(new Event(type)));
  });

  expect(window.__xss).not.toHaveBeenCalled();
}

beforeEach(() => {
  window.__xss = jest.fn();
});

afterEach(() => {
  delete window.__xss;
  jest.resetAllMocks();
});

describe('[security] stored XSS in policy notes', () => {
  test.each(XSS_PAYLOADS)('renders a "%s" payload inert', (_name, payload) => {
    const { container } = render(<PolicyNotes notes={payload} />);
    assertInert(container);
  });

  test('payload stored on a policy from the API renders inert in the detail view', async () => {
    fetchPolicyById.mockResolvedValue({
      id: 'pol-123',
      name: 'Comprehensive Auto Insurance',
      premium: 150075,
      currency: 'PHP',
      status: 'active',
      notes: '<p>Renewal is due soon.</p><img src=x onerror="window.__xss()">',
    });

    const { container } = render(<PolicyDetailContainer policyId="pol-123" />);

    expect(await screen.findByText('Renewal is due soon.')).toBeInTheDocument();
    assertInert(container);
  });

  test('keeps the formatting agents legitimately use', () => {
    render(
      <PolicyNotes
        notes={'<p>Hi! Your <strong>premium</strong> changed. <a href="https://example.com/renew">Renew here</a></p><ul><li>Item</li></ul>'}
      />
    );

    expect(screen.getByText('premium').tagName).toBe('STRONG');
    expect(screen.getByRole('link', { name: 'Renew here' })).toHaveAttribute(
      'href',
      'https://example.com/renew'
    );
    expect(screen.getByRole('listitem')).toHaveTextContent('Item');
  });

  test('shows plain text from a payload as text, not markup', () => {
    render(<PolicyNotes notes={'&lt;img src=x onerror=alert(1)&gt;'} />);
    expect(screen.getByTestId('agent-notes')).toHaveTextContent('<img src=x onerror=alert(1)>');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('PolicyNotes', () => {
  test.each([[undefined], [null], ['']])('shows an empty state when notes are %p', (notes) => {
    render(<PolicyNotes notes={notes} />);
    expect(screen.getByText('No notes yet.')).toBeInTheDocument();
  });

  test('shows the empty state when sanitization strips everything', () => {
    render(<PolicyNotes notes={'<script>window.__xss()</script>'} />);
    expect(screen.getByText('No notes yet.')).toBeInTheDocument();
  });
});

describe('sanitizeHtml', () => {
  test('returns an empty string for null/undefined', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
  });

  test('coerces non-string input', () => {
    expect(sanitizeHtml(42)).toBe('42');
  });

  test('strips the classic onerror payload', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('');
  });
});
