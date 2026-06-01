// src/sandboxes/Gacha/index.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// FIX: Added 'type' before ControlDef
import SandboxControls, { type ControlDef } from '../../components/SandboxControls';

type GachaProps = {
  isAudioEnabled?: boolean;
};

export default function Gacha(_props: GachaProps) {
  const controlsSchema: ControlDef[] = [
    { id: 'dropRate', type: 'slider', label: 'SSR Drop Rate %', min: 1, max: 100, step: 1, defaultValue: 15 },
    { id: 'capsuleType', type: 'select', label: 'Capsule Theme', options: ['Cyberpunk', 'Classic'], defaultValue: 'Cyberpunk' },
    { id: 'skipAnim', type: 'toggle', label: 'Skip Animation', defaultValue: false }
  ];

  const [settings, setSettings] = useState<Record<string, any>>({
    dropRate: 15,
    capsuleType: 'Cyberpunk',
    skipAnim: false
  });

  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<{ rank: 'SSR' | 'SR' | 'R', item: string } | null>(null);

  const handleControlChange = (id: string, value: any) => {
    setSettings(prev => ({ ...prev, [id]: value }));
  };

  const handlePull = () => {
    if (isRolling) return;
    setIsRolling(true);
    setResult(null);

    const time = settings.skipAnim ? 0 : 2000;

    setTimeout(() => {
      // Calculate roll based on slider!
      const roll = Math.random() * 100;
      if (roll <= settings.dropRate) {
        setResult({ rank: 'SSR', item: '⭐ LEGENDARY ARTIFACT ⭐' });
      } else if (roll <= 50) {
        setResult({ rank: 'SR', item: 'RARE MODULE' });
      } else {
        setResult({ rank: 'R', item: 'COMMON JUNK' });
      }
      setIsRolling(false);
    }, time);
  };

  const themeColors = settings.capsuleType === 'Cyberpunk' ? 'border-yellow-400 text-yellow-400' : 'border-blue-400 text-blue-400';

  return (
    <div className="w-full h-full bg-[#0a0a0a] relative flex items-center justify-center font-mono">
      
      <SandboxControls title="Gacha Simulator" schema={controlsSchema} onChange={handleControlChange} />

      <div className="z-10 flex flex-col items-center">
        
        <div className="h-64 flex items-end justify-center mb-12">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="capsule"
                animate={isRolling ? { 
                  y: [0, -20, 0, -40, 0],
                  rotate: [0, 15, -15, 20, -20, 0]
                } : { y: 0 }}
                transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                className={`w-32 h-32 rounded-full border-4 border-dashed flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)] ${themeColors}`}
              >
                <span className="text-4xl">{isRolling ? '❓' : '🔮'}</span>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-center p-8 rounded-xl border-2 bg-black/50 backdrop-blur-md ${
                  result.rank === 'SSR' ? 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.4)]' : 
                  result.rank === 'SR' ? 'border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.4)]' : 
                  'border-zinc-500'
                }`}
              >
                <h2 className={`text-5xl font-black mb-2 ${
                  result.rank === 'SSR' ? 'text-yellow-400' : 
                  result.rank === 'SR' ? 'text-purple-500' : 
                  'text-zinc-400'
                }`}>
                  {result.rank}
                </h2>
                <p className="text-white tracking-widest uppercase">{result.item}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={handlePull}
          disabled={isRolling}
          className={`px-12 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full transition-all duration-300 ${
            isRolling ? 'opacity-50 cursor-not-allowed scale-95' : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]'
          }`}
        >
          {isRolling ? 'Decrypting...' : `Pull 1x (Rate: ${settings.dropRate}%)`}
        </button>
      </div>
    </div>
  );
}