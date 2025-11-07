// frontend/components/memories/MemoriesGrid.js
import { useEffect, useState } from 'react';
import { listMemories, deleteMemory } from '../../utils/memories';

const FILTERS = [
  { key:'all', label:'All' },
  { key:'reactions', label:'🎉 Reactions' },
  { key:'drawings',  label:'🎨 Drawings' },
  { key:'wins',      label:'🏆 Wins' },
];

export default function MemoriesGrid() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  const reload = () => setItems(listMemories());
  useEffect(()=>{ reload(); },[]);

  const visible = items.filter(m => filter==='all' || (m.tags||[]).includes(filter));

  // Helper to get display image (handle both old 'single' and new 'bundle' formats)
  const getDisplayImage = (mem) => {
    if (mem.type === 'bundle') return mem.merged;
    if (mem.type === 'single') return mem.dataUrl;
    return mem.dataUrl || mem.merged; // fallback
  };

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-2 flex-wrap">
        {FILTERS.map(f=>(
          <button
            key={f.key}
            onClick={()=>setFilter(f.key)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              filter===f.key
                ? 'bg-rose-500 text-white shadow-md'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      
      {visible.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-lg font-medium">No memories yet</p>
          <p className="text-sm mt-2">Capture moments during your calls!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map(m=>(
            <div key={m.id} className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-shadow">
              <img 
                src={getDisplayImage(m)} 
                alt="memory" 
                loading="lazy" 
                className="w-full h-48 object-cover" 
              />
              {m.caption && (
                <div className="p-3 text-sm text-gray-700 border-t">
                  {m.caption}
                </div>
              )}
              <div className="p-3 flex justify-between items-center text-xs text-gray-500 bg-gray-50">
                <span>{new Date(m.ts).toLocaleDateString()}</span>
                <button 
                  className="text-rose-600 hover:text-rose-700 font-medium"
                  onClick={()=>{ deleteMemory(m.id); reload(); }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}