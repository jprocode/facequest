// frontend/pages/people.js
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

export default function People() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  // Mock connections for Week 2
  const connections = useMemo(() => ([
    { handle: 'mira', displayName: 'Mira', last: '5m ago' },
    { handle: 'alex', displayName: 'Alex', last: 'yesterday' },
    { handle: 'sam',  displayName: 'Sam',  last: '2d ago' },
  ]), []);

  const filtered = connections.filter(c =>
    c.displayName.toLowerCase().includes(query.toLowerCase()) ||
    c.handle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="card">
      <h1 className="text-xl font-semibold mb-3">People</h1>

      <div className="flex gap-2 mb-4">
        <input
          className="border rounded-lg px-3 py-2 w-72"
          placeholder="Search by username"
          value={query}
          onChange={(e)=>setQuery(e.target.value)}
        />
        <button className="px-3 py-2 rounded-lg bg-white border">Invite (stub)</button>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.handle} className="bg-white/70 rounded-xl p-3 shadow flex items-center justify-between">
            <div>
              <div className="font-medium">{p.displayName}</div>
              <div className="text-xs text-gray-500">@{p.handle} · last seen {p.last}</div>
            </div>
            <button
              className="px-3 py-1 rounded-lg bg-rose-500 text-white"
              onClick={() => router.push(`/call/${p.handle}`)}
              type="button"
            >
              Start Call
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-gray-500 mt-3">No matches. Try another name.</div>
      )}
    </div>
  );
}