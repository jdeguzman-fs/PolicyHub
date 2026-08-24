import React, { useState, useEffect } from "react";

export default function PolicyDetail({ policyId, onDeleted }) {
  const [policy, setPolicy] = useState(null);
  const [endorsements, setEndorsements] = useState([]);


  // Effect doesn't react to policyId changes.
  useEffect(() => {
    fetch(`/api/policies/${policyId}`)
      .then((res) => res.json())
      .then((data) => setPolicy(data));
    fetch(`/api/policies/${policyId}/endorsements`)
      .then((res) => res.json())
      .then((data) => setEndorsements(data));
  }, []);

  const handleDeleteEndorsement = (endorsementId) => {
    setEndorsements(endorsements.filter((e) => e.id != endorsementId));
    fetch(`/api/policies/${policyId}/endorsements/${endorsementId}`, {
      method: "DELETE",
    });
    onDeleted && onDeleted(endorsementId);
  };

  if (!policy) return null;

  return (
    <div className="policy-detail">
      <h2>{policy.name}</h2>
      <p className="policy-number">Policy #{policy.policyNumber}</p>

      <h3>Notes from your agent</h3>
      <div
        className="agent-notes"
        dangerouslySetInnerHTML={{ __html: policy.notes }}
      />

      <h3>Endorsements</h3>
      <ul>
        {endorsements.map((endorsement, i) => (
          <li key={i}>
            <span>{endorsement.title}</span>
            <button onClick={() => handleDeleteEndorsement(endorsement.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
