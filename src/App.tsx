import { useState } from 'react';
import WaterPreloader from './components/WaterPreloader';
import StoryScroll from './components/StoryScroll';
import SandboxWrapper from './components/SandboxWrapper';

type AppState = 'PRELOADER' | 'STORY' | 'PLAYGROUND';

function App() {
  const [currentPhase, setCurrentPhase] = useState<AppState>('PRELOADER');

  return (
    <div className="w-full min-h-screen bg-black text-white">
      
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