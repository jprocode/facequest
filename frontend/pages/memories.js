import MemoriesGrid from '../components/memories/MemoriesGrid';

export default function Memories(){
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-blue-50 -mt-6">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Your Memories</h1>
        <MemoriesGrid />
      </div>
    </div>
  );
}
