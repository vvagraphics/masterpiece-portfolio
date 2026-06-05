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
  backgroundOverlay?: ReactNode; 
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

  // DYNAMIC BOUNDARIES based on your 3 specific requirements
  const getLayoutClasses = (mode: LayoutMode) => {
    switch (mode) {
      case 'FULL':
        // Bottom 3rd of the screen, spans across
        return 'bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 max-h-[33vh] max-w-7xl mx-auto';
      case 'SPLIT_VERT':
        // Left side ONLY, up to 45% width, tall as needed
        return 'top-4 left-4 md:top-8 md:left-8 w-[95vw] md:w-[45vw] max-h-[90vh]';
      case 'SPLIT_HORIZ':
        // Top half ONLY, spans across
        return 'top-4 left-4 right-4 md:top-8 md:left-8 md:right-8 max-h-[45vh] max-w-7xl mx-auto';
      default:
        return '';
    }
  };

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

      {/* UNIFIED UI BAR - NOW WITH PINNED HEADER & SCROLLING BODY */}
      <div className={`absolute z-20 flex flex-col transition-all duration-500 ease-in-out bg-black/80 p-4 border border-zinc-700 rounded-xl text-white shadow-xl backdrop-blur-md ${getLayoutClasses(layoutMode)}`}>
        
        {/* PINNED HEADER SECTION */}
        <div className="flex flex-wrap gap-4 items-center justify-between shrink-0 mb-4 pb-4 border-b border-zinc-700/50">
          
          <div className="flex items-center gap-4">
            <h3 className="font-bold uppercase tracking-widest text-teal-500 hidden sm:block">{title}</h3>
            
            {/* Global Layout Controls */}
            <div className="flex gap-2 bg-zinc-900/50 p-1 rounded border border-zinc-800">
              {(['FULL', 'SPLIT_VERT', 'SPLIT_HORIZ'] as LayoutMode[]).map((mode) => (
                <button 
                  key={mode}
                  onClick={() => onLayoutChange(mode)}
                  className={`px-3 py-1 text-[10px] sm:text-xs font-bold rounded transition-colors ${layoutMode === mode ? 'bg-teal-600 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onToggleEnvAudio}
              className={`p-2 rounded border transition-colors flex items-center justify-center ${
                !isEnvAudioMuted ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 hover:border-zinc-400 text-zinc-400'
              }`}
            >
              {isEnvAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {onPublish && (
              <button 
                onClick={onPublish} 
                disabled={saveStatus === 'SAVING'}
                className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 px-4 py-1.5 rounded font-bold transition-colors uppercase tracking-wider text-xs sm:text-sm"
              >
                {saveStatus === 'SAVING' ? 'PUBLISHING...' : 'Publish'}
              </button>
            )}
          </div>
        </div>

        {/* SCROLLABLE CONTROLS SECTION */}
        {controls && (
          <div className="flex-1 overflow-y-auto min-h-0 pr-2 pb-2 scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent">
            {controls}
          </div>
        )}
        
      </div>
    </div>
  );
}