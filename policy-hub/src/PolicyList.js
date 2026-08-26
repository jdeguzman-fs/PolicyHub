import React from 'react';
import PolicyCard from './PolicyCard';

export default function PolicyList({ policies, onSelect }) {
  if (!policies || policies.length === 0) {
    return <p className="policy-list-empty">No policies to show.</p>;
  }

  return (
    <ul className="policy-list">
      {policies.map((policy) => (
        <li key={policy.id}>
          <PolicyCard policy={policy} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}
