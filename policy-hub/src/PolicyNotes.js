import React from 'react';
import { sanitizeHtml } from './security/sanitizeHtml';

export default function PolicyNotes({ notes }) {
  const clean = sanitizeHtml(notes);

  return (
    <section className="policy-notes" aria-labelledby="policy-notes-heading">
      <h3 id="policy-notes-heading">Notes from your agent</h3>
      {clean ? (
        <div
          className="agent-notes"
          data-testid="agent-notes"
          dangerouslySetInnerHTML={{ __html: clean }}
        />
      ) : (
        <p className="agent-notes-empty">No notes yet.</p>
      )}
    </section>
  );
}
