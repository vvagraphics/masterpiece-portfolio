// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { Howl, Howler } from 'howler';
import WaterPreloader from './components/WaterPreloader';
import StoryScroll from './components/StoryScroll';
import SandboxWrapper from './components/SandboxWrapper';
import CustomCursor from './components/CustomCursor';
import MagneticButton from './components/MagneticButton';

type AppState = 'PRELOADER' | 'STORY' | 'PLAYGROUND';

function App() {
  const [currentPhase, setCurrentPhase] = useState<AppState>('PRELOADER');
  
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const ambientAudioRef = useRef<Howl | null>(null);

  useEffect(() => {
    ambientAudioRef.current = new Howl({
      src: ['audio/Midnight_Moonlight_(Remastered)_v7.mp3'],
      loop: true,
      volume: 0,
      // html5: true,
      onplayerror: function() {
        ambientAudioRef.current?.once('unlock', function() {
          ambientAudioRef.current?.play();
          ambientAudioRef.current?.fade(0, 0.3, 2000);
        });
      }
    });

    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.unload();
      }
    }
  }, []);

  // story section

  useEffect(() => {
  if (!ambientAudioRef.current) return;

  if (currentPhase === 'STORY' && isAudioUnlocked) {
    // Force resume the context whenever we enter the Story phase
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume().then(() => {
        if (!ambientAudioRef.current?.playing()) {
          ambientAudioRef.current?.play();
          ambientAudioRef.current?.fade(0, 0.3, 2000);
        }
      });
    } else if (!ambientAudioRef.current.playing()) {
      ambientAudioRef.current.play();
      ambientAudioRef.current.fade(0, 0.3, 2000);
    }
  }
}, [currentPhase, isAudioUnlocked]);

// home section
  useEffect(() => {
    if (!ambientAudioRef.current) return;

    if (currentPhase !== 'PRELOADER' && isAudioUnlocked) {
      // POLISH: Ensure the Web Audio API context is awake before playing
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume().then(() => {
          if (!ambientAudioRef.current?.playing()) {
            const soundId = ambientAudioRef.current?.play();
            if (soundId) ambientAudioRef.current?.fade(0, 0.3, 2000, soundId); 
          }
        });
      } else {
        if (!ambientAudioRef.current.playing()) {
          const soundId = ambientAudioRef.current.play();
          ambientAudioRef.current.fade(0, 0.3, 2000, soundId); 
        }
      }
    } else if (!isAudioUnlocked) {
       ambientAudioRef.current.pause();
    }
  }, [currentPhase, isAudioUnlocked]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPhase]);

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
        <StoryScroll 
          onStoryComplete={() => setCurrentPhase('PLAYGROUND')} 
          isAudioEnabled={isAudioUnlocked}
          toggleAudio={() => setIsAudioUnlocked(!isAudioUnlocked)}
        />
      )}

      {currentPhase === 'PLAYGROUND' && (
        <SandboxWrapper />
      )}

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