import React from 'react';

export function formatPremium(centavos, currency = 'PHP') {
  if (centavos == null || Number.isNaN(centavos)) return '—';
  const amount = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const STATUS_STYLES = {
  active: { background: '#e6f4ea', color: '#1e7e34', label: 'Active' },
  pending: { background: '#fff4e5', color: '#b45309', label: 'Pending' },
  lapsed: { background: '#fdecea', color: '#b3261e', label: 'Lapsed' },
};

const FALLBACK_STYLE = { background: '#f1f1f1', color: '#6b7280', label: 'Unknown' };

export default function PolicyCard({ policy, onSelect }) {
  const isExpired = policy.status === 'active' && new Date(policy.endDate) < new Date();
  const status = isExpired ? 'expired' : policy.status;
  const badge = isExpired
    ? { background: '#f1f1f1', color: '#6b7280', label: 'Expired' }
    : STATUS_STYLES[status] || FALLBACK_STYLE;

  return (
    <div
      className="policy-card"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(policy.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(policy.id);
      }}
    >
      <h3>{policy.name}</h3>
      <span className="badge" style={{ background: badge.background, color: badge.color }}>
        {badge.label}
      </span>
      <p className="premium">{formatPremium(policy.premium, policy.currency)}</p>
      {isExpired && <p className="expired-note">This policy has expired. Contact your agent to renew.</p>}
    </div>
  );
}
