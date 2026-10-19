import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from './App';
import { fetchPolicies, fetchPolicyById } from './api/policyClient';

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

describe('App: list -> select -> detail', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('selecting a policy from the list shows its detail view', async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    fetchPolicies.mockResolvedValue([makePolicy()]);
    fetchPolicyById.mockResolvedValue(makePolicy());

    render(<App />);

    const card = await screen.findByText('Comprehensive Auto Insurance');

    await act(async () => {
      await user.click(card);
    });

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Comprehensive Auto Insurance' })
    ).toBeInTheDocument();
    expect(fetchPolicyById).toHaveBeenCalledWith('pol-123');
  });

  test('the back button returns from the detail view to the policy list', async () => {
    const user = userEvent.setup ? userEvent.setup() : userEvent;
    fetchPolicies.mockResolvedValue([makePolicy()]);
    fetchPolicyById.mockResolvedValue(makePolicy());

    render(<App />);

    const card = await screen.findByText('Comprehensive Auto Insurance');
    await act(async () => {
      await user.click(card);
    });
    await screen.findByRole('heading', { level: 2, name: 'Comprehensive Auto Insurance' });

    await act(async () => {
      await user.click(screen.getByRole('button', { name: /back to policies/i }));
    });

    expect(await screen.findByText('Comprehensive Auto Insurance')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Comprehensive Auto Insurance' })
    ).not.toBeInTheDocument();
  });
});
