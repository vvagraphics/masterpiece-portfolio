// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import WaterPreloader from './components/WaterPreloader';
import StoryScroll from './components/StoryScroll';
import SandboxWrapper from './components/SandboxWrapper';
import CustomCursor from './components/CustomCursor';
import MagneticButton from './components/MagneticButton'

type AppState = 'PRELOADER' | 'STORY' | 'PLAYGROUND';

function App() {
  const [currentPhase, setCurrentPhase] = useState<AppState>('PRELOADER');
  
  // --- GLOBAL AUDIO STATE ---
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize the global ambient track
    ambientAudioRef.current = new Audio('/audio/ambient.mp3');
    ambientAudioRef.current.loop = true;
    ambientAudioRef.current.volume = 0; // Start at 0 for a smooth fade-in
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    // Handle Ambient Audio Fade-In when leaving Preloader
    if (currentPhase !== 'PRELOADER' && isAudioUnlocked && ambientAudioRef.current) {
      ambientAudioRef.current.play().catch(() => console.log("Ambient play blocked"));
      
      // Smooth fade in over 2 seconds
      let vol = 0;
      const fadeInterval = setInterval(() => {
        vol += 0.05;
        if (vol >= 0.3) { // Max volume 30% so it doesn't overpower the UI sounds
          if (ambientAudioRef.current) ambientAudioRef.current.volume = 0.3;
          clearInterval(fadeInterval);
        } else {
          if (ambientAudioRef.current) ambientAudioRef.current.volume = vol;
        }
      }, 200);
    }
  }, [currentPhase, isAudioUnlocked]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2, 
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // --- HANDLERS ---
  const handleSplashComplete = (audioEnabled: boolean) => {
    setIsAudioUnlocked(audioEnabled);
    setCurrentPhase('STORY');
  };

  return (
    <div className="w-full min-h-screen bg-black text-white overflow-x-hidden">
      
      <CustomCursor />
      
      {currentPhase === 'PRELOADER' && (
        <WaterPreloader onSplashComplete={handleSplashComplete} />
      )}

      {currentPhase === 'STORY' && (
        <StoryScroll onStoryComplete={() => setCurrentPhase('PLAYGROUND')} />
      )}

      {currentPhase === 'PLAYGROUND' && (
        <SandboxWrapper />
      )}

      {/* Global Skip Button - Only visible in Story mode */}
      {currentPhase === 'STORY' && (
        <div className="fixed bottom-6 right-6 z-50">
          <MagneticButton 
            onClick={() => setCurrentPhase('PLAYGROUND')}
            className="px-6 py-3 text-sm font-bold tracking-widest uppercase border border-white/20 rounded-full bg-black/50 backdrop-blur-md hover:bg-white hover:text-black transition-colors duration-300"
          >
            Skip to Playground
          </MagneticButton>
        </div>
      )}
    </div>
  );
}

export default App;