import { useEffect, useState } from 'react';

// Generates a random grid of windows for a building
const generateWindows = (count: number) => 
  Array.from({ length: count }, () => Math.random() > 0.7);

export default function CitySilhouette() {
  const [buildingA, setBuildingA] = useState(generateWindows(12)); // 4x3 grid
  const [buildingB, setBuildingB] = useState(generateWindows(20)); // 5x4 grid

  useEffect(() => {
    // Randomly toggle windows every 3 seconds to simulate life
    const interval = setInterval(() => {
      setBuildingA(prev => prev.map(w => (Math.random() > 0.9 ? !w : w)));
      setBuildingB(prev => prev.map(w => (Math.random() > 0.85 ? !w : w)));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-0 left-0 w-full h-1/2 z-0 flex items-end justify-between px-10 pointer-events-none opacity-40">
      
      {/* Building A */}
      <div className="w-48 h-64 bg-zinc-950 border-t border-r border-zinc-800 p-4 grid grid-cols-3 gap-4 content-start relative shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {buildingA.map((isOn, i) => (
          <div 
            key={`a-${i}`} 
            className={`w-full h-6 transition-colors duration-1000 ${isOn ? 'bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-transparent'}`}
          />
        ))}
      </div>

      {/* Building B */}
      <div className="w-64 h-96 bg-zinc-950 border-t border-l border-zinc-800 p-4 grid grid-cols-4 gap-4 content-start shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        {buildingB.map((isOn, i) => (
          <div 
            key={`b-${i}`} 
            className={`w-full h-8 transition-colors duration-700 ${isOn ? 'bg-yellow-400/90 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'bg-zinc-900/50'}`}
          />
        ))}
      </div>
      
    </div>
  );
}