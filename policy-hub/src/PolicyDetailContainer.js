import React, { useEffect, useState } from 'react';
import { fetchPolicyById } from './api/policyClient';
import { formatPremium } from './PolicyCard';

export default function PolicyDetailContainer({ policyId }) {
  const [status, setStatus] = useState('loading');
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchPolicyById(policyId)
      .then((data) => {
        if (cancelled) return;
        setPolicy(data);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [policyId]);

  if (status === 'loading') {
    return <p role="status">Loading...</p>;
  }

  if (status === 'error') {
    return <p role="alert">We couldn't load this policy. Please try again later.</p>;
  }

  return (
    <div className="policy-detail">
      <h2>{policy.name}</h2>
      <p>Status: {policy.status}</p>
      <p>Premium: {formatPremium(policy.premium, policy.currency)}</p>
    </div>
  );
}
