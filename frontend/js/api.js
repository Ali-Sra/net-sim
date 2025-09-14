const BASE = 'http://127.0.0.1:5000/api';

export async function saveTopology(topo) {
  const res = await fetch(`${BASE}/topology/save`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(topo),
  });
  if (!res.ok) throw new Error('Save failed');
  return await res.json();
}

export async function loadLatestTopology() {
  const res = await fetch(`${BASE}/topology/latest`);
  if (!res.ok) throw new Error('Load failed');
  return await res.json();
}