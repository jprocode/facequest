// frontend/components/memories/CaptionModal.js
import { useEffect, useState } from 'react';

export default function CaptionModal({ open, onClose, onSave }) {
  const [txt, setTxt] = useState('');
  useEffect(()=>{ if (!open) setTxt(''); },[open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40">
      <div className="w-[420px] bg-white rounded-2xl shadow-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Add a caption</h2>
          <button className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200" onClick={onClose} type="button">✕</button>
        </div>
        <textarea
          className="w-full border rounded-lg p-2 h-28"
          placeholder="What did you feel?"
          value={txt}
          onChange={(e)=>setTxt(e.target.value)}
        />
        <div className="mt-3 flex justify-end gap-2">
          <button className="px-3 py-1 rounded bg-white border" onClick={onClose} type="button">Skip</button>
          <button className="px-3 py-1 rounded bg-rose-500 text-white" onClick={()=>onSave?.(txt)} type="button">Save</button>
        </div>
      </div>
    </div>
  );
}