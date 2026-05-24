import { useState, useEffect } from 'react';
import Lenis from '@studio-freight/lenis';
import WaterPreloader from './components/WaterPreloader';
import StoryScroll from './components/StoryScroll';
import SandboxWrapper from './components/SandboxWrapper';
import CustomCursor from './components/CustomCursor';
import MagneticButton from './components/MagneticButton'

type AppState = 'PRELOADER' | 'STORY' | 'PLAYGROUND';

function App() {
  const [currentPhase, setCurrentPhase] = useState<AppState>('PRELOADER');

  useEffect(() => {
    // Reset scroll when switching views so you aren't trapped in the void
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPhase]);

  // Initialize Lenis for frictionless smooth scrolling
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      // direction and smooth flags removed as they are now default in modern Lenis
    });

    {currentPhase !== 'PLAYGROUND' && (
  <div className="fixed bottom-6 right-6 z-50">
    <MagneticButton 
      onClick={() => setCurrentPhase('PLAYGROUND')}
      className="px-6 py-3 text-sm font-bold tracking-widest uppercase border border-white/20 rounded-full bg-black/50 backdrop-blur-md hover:bg-white hover:text-black transition-colors duration-300"
    >
      Skip to Playground
    </MagneticButton>
  </div>
)}

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden">
      
      {/* Global Custom Cursor */}
      <CustomCursor />
      
      {currentPhase === 'PRELOADER' && (
        <WaterPreloader onSplashComplete={() => setCurrentPhase('STORY')} />
      )}

      {currentPhase === 'STORY' && (
        <StoryScroll onStoryComplete={() => setCurrentPhase('PLAYGROUND')} />
      )}

      {currentPhase === 'PLAYGROUND' && (
        <SandboxWrapper />
      )}

      {currentPhase !== 'PLAYGROUND' && (
        <button 
          onClick={() => setCurrentPhase('PLAYGROUND')}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 text-sm font-bold tracking-widest uppercase border border-white/20 hover:bg-white hover:text-black transition-colors duration-300"
        >
          Skip to Playground
        </button>
      )}
    </div>
  );
}

export default App;