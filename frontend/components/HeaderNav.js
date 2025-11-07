import Link from 'next/link';

export default function HeaderNav(){
  return (
    <header className="sticky top-0 z-20 bg-white/40 backdrop-blur-md">
      <nav className="container flex items-center justify-between py-3">
        <Link href="/"><span className="font-semibold text-rose-600">FaceQuest</span></Link>
        <div className="flex gap-4">
          <Link href="/people">People</Link>
          <Link href="/memories">Memories</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/call/demo" className="px-3 py-1 rounded-lg bg-rose-500 text-white">Start a Call</Link>
        </div>
      </nav>
    </header>
  );
}