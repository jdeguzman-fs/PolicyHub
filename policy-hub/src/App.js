import { useState } from 'react';
import './App.css';
import PolicyListContainer from './PolicyListContainer';
import PolicyDetailContainer from './PolicyDetailContainer';

function App() {
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1>PolicyHub</h1>
      </header>
      <main>
        {selectedPolicyId ? (
          <div>
            <button type="button" onClick={() => setSelectedPolicyId(null)}>
              ← Back to policies
            </button>
            <PolicyDetailContainer policyId={selectedPolicyId} />
          </div>
        ) : (
          <PolicyListContainer onSelect={setSelectedPolicyId} />
        )}
      </main>
    </div>
  );
}

export default App;
