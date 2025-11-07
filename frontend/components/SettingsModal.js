// frontend/components/SettingsModal.js
import { useEffect, useState } from 'react';
import { getJSON, setJSON } from '../utils/storage';

export default function SettingsModal({
    open,
    onClose,
    // NEW (optional): if provided, we render mic/cam toggles
    micOn,
    camOn,
    onToggleMic,
    onToggleCam,
}) {
    const [reactionSounds, setReactionSounds] = useState(true);
    const [musicEnabled, setMusicEnabled] = useState(true);
    const [theme, setTheme] = useState('romantic');

    useEffect(() => {
        const saved = getJSON('fq.settings') || {};
        if (typeof saved.reactionSounds === 'boolean') setReactionSounds(saved.reactionSounds);
        if (typeof saved.musicEnabled === 'boolean') setMusicEnabled(saved.musicEnabled);
        if (typeof saved.theme === 'string') setTheme(saved.theme);
    }, []);

    useEffect(() => {
        setJSON('fq.settings', { reactionSounds, musicEnabled, theme });
        window.dispatchEvent(new CustomEvent('fq:settings:update', {
            detail: { reactionSounds, musicEnabled, theme }
        }));
    }, [reactionSounds, musicEnabled, theme]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
            <div className="w-[420px] bg-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold">Settings</h2>
                    <button
                        className="px-2 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200"
                        onClick={onClose}
                        type="button"
                    >✕</button>
                </div>

                <div className="grid gap-4">
                    {typeof micOn === 'boolean' && typeof onToggleMic === 'function' && (
                        <label className="flex items-center justify-between">
                            <span>Microphone</span>
                            <input
                                type="checkbox"
                                checked={micOn}
                                onChange={(e) => onToggleMic(e.target.checked)}
                            />
                        </label>
                    )}

                    {typeof camOn === 'boolean' && typeof onToggleCam === 'function' && (
                        <label className="flex items-center justify-between">
                            <span>Camera</span>
                            <input
                                type="checkbox"
                                checked={camOn}
                                onChange={(e) => onToggleCam(e.target.checked)}
                            />
                        </label>
                    )}

                    <label className="flex items-center justify-between">
                        <span>Reaction sounds</span>
                        <input
                            type="checkbox"
                            checked={reactionSounds}
                            onChange={(e) => setReactionSounds(e.target.checked)}
                        />
                    </label>

                    <label className="flex items-center justify-between">
                        <span>Enable Music HUD</span>
                        <input
                            type="checkbox"
                            checked={musicEnabled}
                            onChange={(e) => setMusicEnabled(e.target.checked)}
                        />
                    </label>

                    <div>
                        <label className="block text-sm mb-1">Theme</label>
                        <select
                            className="border rounded-lg px-3 py-2 w-full"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                        >
                            <option value="romantic">Romantic Soft Tones</option>
                            <option value="neon">Playful Neon</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5 flex justify-between">
                    <button
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        type="button"
                        onClick={() => {
                            try {
                                window.dispatchEvent(new CustomEvent('fq:canvas:clear'));
                            } catch { }
                        }}
                    >
                        Clear canvas
                    </button>
                    <button
                        className="px-3 py-1 rounded bg-rose-500 text-white"
                        onClick={onClose}
                        type="button"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}