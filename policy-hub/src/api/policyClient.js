export async function fetchPolicyById(id) {
  const response = await fetch(`/api/policies/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch policy ${id}`);
  }
  return response.json();
}
