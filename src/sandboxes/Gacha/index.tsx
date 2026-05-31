// src/sandboxes/Gacha/index.tsx
import { useState } from 'react';
import SandboxControls, { ControlDef } from '../../components/SandboxControls';

type GachaProps = {
  isAudioEnabled?: boolean;
};

export default function Gacha({ isAudioEnabled }: GachaProps) {
  const controlsSchema: ControlDef[] = [
    { id: 'dropRate', type: 'slider', label: 'SSR Drop Rate %', min: 0.1, max: 10, step: 0.1, defaultValue: 1.5 },
    { id: 'capsuleType', type: 'select', label: 'Capsule Theme', options: ['Classic', 'Cyberpunk', 'Fantasy'], defaultValue: 'Cyberpunk' },
    { id: 'skipAnim', type: 'toggle', label: 'Skip Animation', defaultValue: false }
  ];

  const [settings, setSettings] = useState<Record<string, any>>({
    dropRate: 1.5,
    capsuleType: 'Cyberpunk',
    skipAnim: false
  });

  const handleControlChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative flex items-center justify-center">
      
      <SandboxControls 
        title="Gacha Machine Config" 
        schema={controlsSchema} 
        onChange={handleControlChange} 
      />

      <div className="text-center z-10">
        <div className="w-64 h-64 border-4 border-dashed border-zinc-700 rounded-full flex items-center justify-center mb-8 mx-auto">
           <span className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{settings.capsuleType} Machine</span>
        </div>
        <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform">
          Pull 1x (Rate: {settings.dropRate}%)
        </button>
      </div>
    </div>
  );
}