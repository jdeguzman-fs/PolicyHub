export async function fetchPolicyById(id) {
  const response = await fetch(`/api/policies/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy ${id}`);
  }
  return response.json();
}

export async function fetchPolicies() {
  const response = await fetch('/api/policies');
  if (!response.ok) {
    throw new Error('Failed to fetch policies');
  }
  return response.json();
}
