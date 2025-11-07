export default function Settings(){
  return (
    <div className="card grid gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>
      <div>
        <label className="block text-sm">Theme</label>
        <select className="border rounded-lg px-3 py-2"><option>Romantic Soft Tones</option><option>Playful Neon</option></select>
      </div>
      <div>
        <label className="block text-sm">Gestures</label>
        <label className="flex items-center gap-2"><input type="checkbox" defaultChecked/> Enable gestures by default</label>
      </div>
    </div>
  );
}