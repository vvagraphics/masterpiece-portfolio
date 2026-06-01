// src/components/SandboxShell.tsx
import type { ReactNode } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export type LayoutMode = 'FULL' | 'SPLIT_VERT' | 'SPLIT_HORIZ';

interface SandboxShellProps {
  title: string;
  children: ReactNode; 
  controls?: ReactNode; 
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  activeTexture?: string; 
  splitBackgroundImage?: string; 
  backgroundOverlay?: ReactNode; // NEW: So Graffiti can pass CitySilhouette, but others stay blank
  isEnvAudioMuted: boolean;
  onToggleEnvAudio: () => void;
  onPublish?: () => void;
  saveStatus?: 'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR';
}

export default function SandboxShell({
  title,
  children,
  controls,
  layoutMode,
  onLayoutChange,
  activeTexture,
  splitBackgroundImage,
  backgroundOverlay,
  isEnvAudioMuted,
  onToggleEnvAudio,
  onPublish,
  saveStatus = 'IDLE'
}: SandboxShellProps) {

  const uiPositionClass = layoutMode === 'SPLIT_HORIZ' ? 'top-20' : 'bottom-8';
  const uiWidthClass = layoutMode === 'SPLIT_VERT' ? 'max-w-[45vw]' : 'max-w-[90vw]';

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden touch-none overscroll-none">
      
      {/* Background Splits */}
      <div className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
          layoutMode === 'FULL' ? 'w-full h-full' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
        }`}
      >
        {splitBackgroundImage && (
           <div 
             className="absolute inset-0 bg-cover bg-center" 
             style={{ backgroundImage: `url('${splitBackgroundImage}')`, backgroundSize: 'contain', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }} 
           />
        )}
        {/* FIXED: No more hardcoded CitySilhouette! */}
        {backgroundOverlay && backgroundOverlay}
      </div>

      {layoutMode !== 'FULL' && (
        <div className={`absolute bottom-0 right-0 bg-black transition-all duration-500 ease-in-out ${
            layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full border-l-4 border-zinc-900' : 'w-full h-1/2 border-t-4 border-zinc-900'
          }`}
        >
          {activeTexture && (
            <div className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none" style={{ backgroundImage: `url(${activeTexture})` }} />
          )}
        </div>
      )}

      {/* THE ACTUAL SANDBOX CANVAS */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-auto">
        {children}
      </div>

      {/* UNIFIED UI BAR */}
      <div className={`absolute z-20 left-4 md:left-8 transition-all duration-500 ease-in-out ${uiPositionClass} ${uiWidthClass} bg-black/80 p-4 border border-zinc-700 rounded text-white flex flex-col gap-4 shadow-xl backdrop-blur-sm overflow-y-auto max-h-[80vh]`}>
        
        <div className="flex flex-wrap gap-6 items-center">
          <h3 className="font-bold uppercase tracking-widest text-teal-500 hidden sm:block">{title}</h3>
          
          <div className="flex flex-1 items-center gap-2">
             {controls}
          </div>

          <div className="h-6 w-px bg-zinc-700 mx-2 hidden lg:block"></div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-zinc-400 uppercase tracking-widest text-xs font-bold">Ambience:</span>
            <button
              onClick={onToggleEnvAudio}
              className={`p-2 rounded border transition-colors flex items-center justify-center ${
                !isEnvAudioMuted ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 hover:border-zinc-400 text-zinc-400'
              }`}
            >
              {isEnvAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {onPublish && (
            <>
              <div className="h-6 w-px bg-zinc-700 mx-2 hidden lg:block"></div>
              <div className="flex items-center justify-end">
                <button 
                  onClick={onPublish} 
                  disabled={saveStatus === 'SAVING'}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 px-4 py-1 rounded font-bold transition-colors uppercase tracking-wider text-sm"
                >
                  {saveStatus === 'SAVING' ? 'PUBLISHING...' : 'Publish'}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="h-px w-full bg-zinc-700"></div>

        {/* Global Layout Controls */}
        <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
          <div className="flex gap-2">
            <span className="text-xs text-zinc-400 uppercase tracking-widest self-center mr-2">Playground:</span>
            {(['FULL', 'SPLIT_VERT', 'SPLIT_HORIZ'] as LayoutMode[]).map((mode) => (
              <button 
                key={mode}
                onClick={() => onLayoutChange(mode)}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === mode ? 'bg-teal-600 border-teal-500 text-white' : 'border-zinc-600 hover:border-zinc-400 text-zinc-400'}`}
              >
                {mode.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}