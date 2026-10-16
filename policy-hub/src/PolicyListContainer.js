import React, { useEffect, useState } from 'react';
import { fetchPolicies } from './api/policyClient';
import PolicyList from './PolicyList';

export default function PolicyListContainer({ onSelect }) {
  const [status, setStatus] = useState('loading');
  const [policies, setPolicies] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    fetchPolicies()
      .then((data) => {
        if (cancelled) return;
        setPolicies(data);
        setStatus('success');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <p role="status">Loading policies...</p>;
  }

  if (status === 'error') {
    return <p role="alert">We couldn't load your policies. Please try again later.</p>;
  }

  return <PolicyList policies={policies} onSelect={onSelect} />;
}
