// frontend/components/MemoryPreviewModal.js
import { useEffect, useMemo, useState } from 'react';

const TABS = ['merged', 'video', 'drawing', 'reactions'];

export default function MemoryPreviewModal({
  open,
  onClose,
  merged,
  video,
  drawing,
  reactions,
  onSave, // optional async callback({ merged, video, drawing, reactions, choice })
}) {
  const [tab, setTab] = useState('merged');

  useEffect(() => {
    if (open) setTab('merged');
  }, [open]);

  const has = useMemo(() => ({
    merged: !!merged,
    video: !!video,
    drawing: !!drawing,
    reactions: !!reactions,
  }), [merged, video, drawing, reactions]);

  if (!open) return null;

  const current = { merged, video, drawing, reactions }[tab];

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/50 px-4">
      <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="text-base font-semibold">Preview Memory</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="flex gap-2 mb-3">
            {TABS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => has[t] && setTab(t)}
                className={
                  "px-3 py-1 rounded-full text-sm border " +
                  (tab === t
                    ? "bg-rose-50 border-rose-300"
                    : "bg-white hover:bg-gray-50") +
                  (!has[t] ? " opacity-40 cursor-not-allowed" : "")
                }
                disabled={!has[t]}
                title={t[0].toUpperCase() + t.slice(1)}
              >
                {labelFor(t)}
              </button>
            ))}
          </div>

          <div className="bg-gray-50 rounded-xl p-3 grid place-items-center mb-4">
            {current ? (
              <img
                src={current}
                alt={`${tab} preview`}
                className="max-h-[60vh] w-auto rounded-lg shadow"
              />
            ) : (
              <p className="text-sm text-gray-500 py-10">No {labelFor(tab)} layer available</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t">
          <span className="text-xs text-gray-500">
            Viewing: <strong>{labelFor(tab)}</strong>
          </span>
          <div className="flex gap-2">
            <a
              href={current || merged}
              download={`facequest-${tab}.jpg`}
              className="px-3 py-1 rounded bg-white border hover:bg-gray-50 text-sm"
            >
              Download
            </a>
            {onSave && (
              <button
                type="button"
                className="px-3 py-1 rounded bg-rose-500 text-white text-sm"
                onClick={() => onSave({
                  merged, video, drawing, reactions, choice: tab
                })}
              >
                Save to Memories
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function labelFor(k) {
  switch (k) {
    case 'merged': return 'Merged';
    case 'video': return 'Video';
    case 'drawing': return 'Drawing';
    case 'reactions': return 'Reactions';
    default: return k;
  }
}