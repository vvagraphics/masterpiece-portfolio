// src/sandboxes/Holograms/index.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';
// FIX: Added 'type' before ControlDef
import SandboxControls, { type ControlDef } from '../../components/SandboxControls';

type HologramsProps = {
  isAudioEnabled?: boolean;
};

export default function Holograms({ isAudioEnabled }: HologramsProps) {
  const controlsSchema: ControlDef[] = [
    { id: 'hologramColor', type: 'select', label: 'Color Core', options: ['Cyan', 'Magenta', 'Neon Green'], defaultValue: 'Cyan' },
    { id: 'glitchIntensity', type: 'slider', label: 'Glitch Level', min: 0, max: 10, step: 1, defaultValue: 4 },
    { id: 'autoRotate', type: 'toggle', label: 'Auto Rotate', defaultValue: true },
    { id: 'hologramText', type: 'text', label: 'Display Text', defaultValue: 'SYSTEM ONLINE' }
  ];

  const [settings, setSettings] = useState<Record<string, any>>({
    hologramColor: 'Cyan',
    glitchIntensity: 4,
    autoRotate: true,
    hologramText: 'SYSTEM ONLINE'
  });

  const handleControlChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const activeColor = 
    settings.hologramColor === 'Cyan' ? '#06b6d4' : 
    settings.hologramColor === 'Magenta' ? '#d946ef' : '#22c55e';

  return (
    <div className="w-full h-full bg-black relative flex items-center justify-center overflow-hidden font-mono">
      
      <SandboxControls title="Hologram Projector" schema={controlsSchema} onChange={handleControlChange} />

      <div className="relative z-10 flex flex-col items-center justify-center perspective-[1000px]">
        
        {/* Holographic 3D Rings */}
        <div className="relative w-64 h-64 mb-12 transform-style-3d">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                rotateX: settings.autoRotate ? [0, 360] : 60, 
                rotateY: settings.autoRotate ? [0, 360] : 45 
              }}
              transition={{ duration: 10 + (i * 2), repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-2 rounded-full mix-blend-screen"
              style={{ 
                borderColor: activeColor,
                opacity: 0.3 + (i * 0.2),
                transform: `rotateX(60deg) rotateY(${i * 45}deg)`,
                boxShadow: `0 0 ${10 * settings.glitchIntensity}px ${activeColor} inset, 0 0 20px ${activeColor}`
              }}
            />
          ))}
          {/* Base Projector Light */}
          <div 
            className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-32 h-8 rounded-[100%] blur-xl opacity-80"
            style={{ backgroundColor: activeColor }}
          />
        </div>

        {/* Glitching Text Element */}
        <div className="relative">
          <h1 
            className="text-6xl font-black uppercase tracking-widest text-transparent mix-blend-screen"
            style={{ 
              WebkitTextStroke: `1px ${activeColor}`,
              textShadow: `0 0 ${settings.glitchIntensity * 2}px ${activeColor}`
            }}
          >
            {settings.hologramText}
          </h1>
          {/* RGB Split Glitch Layers */}
          {settings.glitchIntensity > 0 && (
            <>
              <motion.h1 
                animate={{ x: [-settings.glitchIntensity, settings.glitchIntensity, 0] }}
                transition={{ duration: 0.1, repeat: Infinity, repeatType: "mirror" }}
                className="absolute inset-0 text-6xl font-black uppercase tracking-widest text-red-500 opacity-50 mix-blend-screen pointer-events-none"
              >
                {settings.hologramText}
              </motion.h1>
              <motion.h1 
                animate={{ x: [settings.glitchIntensity, -settings.glitchIntensity, 0] }}
                transition={{ duration: 0.15, repeat: Infinity, repeatType: "mirror" }}
                className="absolute inset-0 text-6xl font-black uppercase tracking-widest text-blue-500 opacity-50 mix-blend-screen pointer-events-none"
              >
                {settings.hologramText}
              </motion.h1>
            </>
          )}
        </div>
      </div>

      {/* Background Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{ 
          backgroundImage: `
            linear-gradient(${activeColor} 1px, transparent 1px),
            linear-gradient(90deg, ${activeColor} 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          transform: 'perspective(500px) rotateX(60deg)',
          transformOrigin: 'bottom'
        }}
      />
    </div>
  );
}