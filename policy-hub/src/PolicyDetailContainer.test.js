import { render, screen } from '@testing-library/react';

import PolicyDetailContainer from './PolicyDetailContainer';
import { fetchPolicyById } from './api/policyClient';

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

describe('PolicyDetailContainer', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('shows a loading state while the policy is being fetched', () => {
    fetchPolicyById.mockReturnValue(new Promise(() => {}));
    render(<PolicyDetailContainer policyId="pol-123" />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
  });

  test('renders the policy once the fetch succeeds', async () => {
    fetchPolicyById.mockResolvedValue(makePolicy());
    render(<PolicyDetailContainer policyId="pol-123" />);

    expect(
      await screen.findByRole('heading', { name: 'Comprehensive Auto Insurance' })
    ).toBeInTheDocument();
    expect(screen.getByText(/active/i)).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('shows an error message when the fetch rejects', async () => {
    fetchPolicyById.mockRejectedValue(new Error('network down'));
    render(<PolicyDetailContainer policyId="pol-123" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /couldn't load this policy/i
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  test('what breaks: a request that never resolves leaves the UI stuck loading forever', async () => {
    fetchPolicyById.mockReturnValue(new Promise(() => {}));
    render(<PolicyDetailContainer policyId="pol-123" />);

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
