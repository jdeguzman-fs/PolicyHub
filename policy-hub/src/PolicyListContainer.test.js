import { render, screen } from '@testing-library/react';

import PolicyListContainer from './PolicyListContainer';
import { fetchPolicies } from './api/policyClient';

jest.mock('./api/policyClient');

function makePolicy(overrides = {}) {
  return {
    id: 'pol-123',
    name: 'Comprehensive Auto Insurance',
    premium: 150075,
    currency: 'PHP',
    status: 'active',
    endDate: new Date('2029-01-01').toISOString(),
    ...overrides,
  };
}

describe('PolicyListContainer', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows a loading state while policies are being fetched', () => {
    fetchPolicies.mockReturnValue(new Promise(() => {}));
    render(<PolicyListContainer onSelect={() => {}} />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  test('renders the policy list once the fetch succeeds', async () => {
    fetchPolicies.mockResolvedValue([
      makePolicy(),
      makePolicy({ id: 'pol-456', name: 'Homeowners Policy' }),
    ]);
    render(<PolicyListContainer onSelect={() => {}} />);

    expect(await screen.findByText('Comprehensive Auto Insurance')).toBeInTheDocument();
    expect(screen.getByText('Homeowners Policy')).toBeInTheDocument();
  });

  test('shows an error message when the fetch rejects', async () => {
    fetchPolicies.mockRejectedValue(new Error('network down'));
    render(<PolicyListContainer onSelect={() => {}} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn't load your policies/i
    );
  });
});
