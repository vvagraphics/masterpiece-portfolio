// src/sandboxes/Holograms/index.tsx
import { useState } from 'react';
import SandboxControls, { ControlDef } from '../../components/SandboxControls';

type HologramsProps = {
  isAudioEnabled?: boolean;
};

export default function Holograms({ isAudioEnabled }: HologramsProps) {
  // 1. Define the controls for this specific sandbox
  const controlsSchema: ControlDef[] = [
    { id: 'hologramColor', type: 'select', label: 'Color Core', options: ['Cyan', 'Magenta', 'Neon Green'], defaultValue: 'Cyan' },
    { id: 'glitchIntensity', type: 'slider', label: 'Glitch Level', min: 0, max: 10, step: 1, defaultValue: 2 },
    { id: 'autoRotate', type: 'toggle', label: 'Auto Rotate', defaultValue: true },
    { id: 'hologramText', type: 'text', label: 'Display Text', defaultValue: 'SYSTEM ONLINE' }
  ];

  // 2. State to hold the current values from the control panel
  const [settings, setSettings] = useState<Record<string, any>>({
    hologramColor: 'Cyan',
    glitchIntensity: 2,
    autoRotate: true,
    hologramText: 'SYSTEM ONLINE'
  });

  // 3. Handle updates from the SandboxControls
  const handleControlChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden">
      
      {/* The Control Panel */}
      <SandboxControls 
        title="Hologram Projector" 
        schema={controlsSchema} 
        onChange={handleControlChange} 
      />

      {/* Filler Visuals based on settings */}
      <div className="text-center z-10 flex flex-col items-center">
        <h1 className="text-6xl font-black uppercase tracking-widest mb-4" 
            style={{ 
              color: settings.hologramColor === 'Cyan' ? '#06b6d4' : settings.hologramColor === 'Magenta' ? '#d946ef' : '#22c55e',
              textShadow: `0 0 ${settings.glitchIntensity * 5}px currentColor`
            }}>
          {settings.hologramText}
        </h1>
        <p className="text-zinc-500 font-mono text-sm">
          Auto Rotate is {settings.autoRotate ? 'ON' : 'OFF'}
        </p>
        <p className="text-zinc-700 font-mono text-xs mt-8">
          (Replace this area with your Three.js or visual canvas)
        </p>
      </div>

      {/* Fake hologram grid background */}
      <div className="absolute inset-0 border border-cyan-900/30 m-8 rounded-[40px] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)' }} />
    </div>
  );
}