import Link from 'next/link';

export default function Home(){
  return (
    <div className="grid gap-6">
      <section className="card">
        <h1 className="text-2xl font-semibold">Who are we calling today?</h1>
        <p className="text-sm text-gray-600">Quick pick from your top connections or start a room.</p>
        <div className="mt-4 flex gap-3">
          <Link className="px-3 py-2 rounded-xl bg-rose-500 text-white" href="/call/demo">Start a Call</Link>
          <Link className="px-3 py-2 rounded-xl bg-white" href="/people">Find People</Link>
        </div>
      </section>
      <section className="card">
        <h2 className="font-semibold">Memories</h2>
        <div className="mt-2 text-gray-500">No memories yet. Save a postcard from your next call!</div>
      </section>
    </div>
  );
}