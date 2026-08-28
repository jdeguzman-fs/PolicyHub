import { fetchPolicyById, fetchPolicies } from './policyClient';

describe('policyClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('fetchPolicyById', () => {
    test('resolves with the parsed policy JSON on a successful response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 'pol-123', name: 'Test Policy' }),
      });

      const result = await fetchPolicyById('pol-123');

      expect(global.fetch).toHaveBeenCalledWith('/api/policies/pol-123');
      expect(result).toEqual({ id: 'pol-123', name: 'Test Policy' });
    });

    test('throws when the response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });

      await expect(fetchPolicyById('pol-123')).rejects.toThrow(
        'Failed to fetch policy pol-123'
      );
    });
  });

  describe('fetchPolicies', () => {
    test('resolves with the parsed policy list JSON on a successful response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 'pol-123' }]),
      });

      const result = await fetchPolicies();

      expect(global.fetch).toHaveBeenCalledWith('/api/policies');
      expect(result).toEqual([{ id: 'pol-123' }]);
    });

    test('throws when the response is not ok', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });

      await expect(fetchPolicies()).rejects.toThrow('Failed to fetch policies');
    });
  });
});
