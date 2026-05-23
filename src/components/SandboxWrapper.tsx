import { useState } from 'react';
import GraffitiCanvas from '../sandboxes/GraffitiCanvas';
import GlassWalls from '../sandboxes/GlassWalls'; // <-- Imported!
import InspirationGallery from './InspirationGallery'; // <-- Imported!

type SandboxState = 'HUB' | 'GRAFFITI' | 'GLASS_WALLS';

export default function SandboxWrapper() {
  const [activeSandbox, setActiveSandbox] = useState<SandboxState>('HUB');

  if (activeSandbox === 'GRAFFITI') {
    return (
      <div className="w-full h-screen flex flex-col relative">
        <button 
          onClick={() => setActiveSandbox('HUB')} 
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-black text-white border border-red-500 hover:bg-red-500 transition-colors font-mono uppercase text-sm"
        >
          Return to Hub
        </button>
        <div className="flex-1 w-full h-full">
           <GraffitiCanvas />
        </div>
      </div>
    );
  }

  if (activeSandbox === 'GLASS_WALLS') {
    return (
      <div className="w-full h-screen bg-zinc-900 text-white flex flex-col relative">
        <button 
          onClick={() => setActiveSandbox('HUB')} 
          className="absolute top-4 right-4 z-50 px-4 py-2 bg-black text-white border border-blue-500 hover:bg-blue-500 transition-colors font-mono uppercase text-sm"
        >
          Return to Hub
        </button>
        <div className="flex-1 w-full h-full">
           {/* Component is now actually mounted here! */}
           <GlassWalls /> 
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-black text-white p-12">
      <h1 className="text-5xl font-serif mb-2">The Interactive Museum</h1>
      <p className="text-gray-400 mb-12">Leave your mark on web history.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        
        {/* Card 1 */}
        <div 
          onClick={() => setActiveSandbox('GRAFFITI')}
          className="border border-zinc-800 p-8 cursor-pointer hover:border-red-500 hover:bg-zinc-900 transition-all group"
        >
          <h2 className="text-3xl font-bold mb-4 group-hover:text-red-500">Digital Graffiti</h2>
          <p className="text-gray-400">Spray the wall. Adjust thickness, pick your colors, and sign your masterpiece.</p>
        </div>

        {/* Card 2 */}
        <div 
          onClick={() => setActiveSandbox('GLASS_WALLS')}
          className="border border-zinc-800 p-8 cursor-pointer hover:border-blue-500 hover:bg-zinc-900 transition-all group"
        >
          <h2 className="text-3xl font-bold mb-4 group-hover:text-blue-500">Sliding Glass Walls</h2>
          <p className="text-gray-400">Customize your name with typography and sliding glass partitions.</p>
        </div>

      </div>

      {/* The Gallery is now mounted at the bottom of the Hub! */}
      <InspirationGallery />
    </div>
  );
}