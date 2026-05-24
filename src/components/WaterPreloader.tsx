// src/components/WaterPreloader.tsx
import { useEffect, useRef, useState } from 'react';

interface WaterPreloaderProps {
  onSplashComplete: (audioEnabled: boolean) => void;
}

export default function WaterPreloader({ onSplashComplete }: WaterPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- STATE ---
  const [isSplashing, setIsSplashing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // --- AUDIO REFS ---
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const splashAudioRef = useRef<HTMLAudioElement | null>(null);
  const targetVolumeRef = useRef(0);
  const currentVolumeRef = useRef(0);
  const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- ASSET PRELOADER ---
  useEffect(() => {
    const assetsToLoad = [
      '/audio/thud.mp3',
      '/audio/spray.mp3',
      '/audio/water-hover.mp3', 
      '/audio/water-splash.mp3',
      '/logostefand.svg',
      'https://mr3anderson.pro/masterpiece-portfolio/first_web-background.jpg'
    ];

    let loadedCount = 0;

    const updateProgress = () => {
      loadedCount++;
      const progress = Math.floor((loadedCount / assetsToLoad.length) * 100);
      setLoadProgress(progress);
      if (loadedCount === assetsToLoad.length) {
        setTimeout(() => setIsReady(true), 800); 
      }
    };

    assetsToLoad.forEach(url => {
      if (url.endsWith('.mp3')) {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', updateProgress, { once: true });
        audio.addEventListener('error', updateProgress, { once: true }); 
        audio.src = url;
        audio.load();
      } else {
        const img = new Image();
        img.onload = updateProgress;
        img.onerror = updateProgress;
        img.src = url;
      }
    });
  }, []);

  // --- AUDIO INITIALIZATION & CLEANUP ---
  useEffect(() => {
    hoverAudioRef.current = new Audio('/audio/water-hover.mp3');
    hoverAudioRef.current.loop = true;
    hoverAudioRef.current.volume = 0; 

    splashAudioRef.current = new Audio('/audio/water-splash.mp3');
    splashAudioRef.current.volume = 0.8;

    // FIX: When this component unmounts, destroy the audio objects so they don't leak into the Story!
    return () => {
      if (hoverAudioRef.current) {
        hoverAudioRef.current.pause();
        hoverAudioRef.current.src = ''; // completely clears it from memory
      }
      if (splashAudioRef.current) {
        splashAudioRef.current.pause();
        splashAudioRef.current.src = '';
      }
    };
  }, []);

  // --- VOLUME FADE LOOP (Only runs if audio is enabled) ---
  useEffect(() => {
    if (!isAudioEnabled) {
      if (hoverAudioRef.current) hoverAudioRef.current.pause();
      return;
    }

    // Play the audio (allowed because user clicked the unmute button)
    if (hoverAudioRef.current) {
      hoverAudioRef.current.play().catch(() => console.log("Audio play prevented"));
    }

    const fadeInterval = setInterval(() => {
      if (!hoverAudioRef.current) return;
      
      // Smoothly interpolate current volume toward target volume
      currentVolumeRef.current += (targetVolumeRef.current - currentVolumeRef.current) * 0.1;
      
      // Clamp volume between 0 and 1 just to be safe
      const newVolume = Math.min(1, Math.max(0, currentVolumeRef.current));
      hoverAudioRef.current.volume = newVolume;
      
    }, 50);

    return () => clearInterval(fadeInterval);
  }, [isAudioEnabled]);

  // --- WATER PHYSICS ENGINE ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const DAMPING = 0.96; 
    const scale = 4;
    const physicsWidth = Math.floor(width / scale);
    const physicsHeight = Math.floor(height / scale);
    const size = physicsWidth * physicsHeight;

    let current = new Float32Array(size);
    let previous = new Float32Array(size);
    let baseImageData: ImageData;
    let outputImageData = ctx.createImageData(width, height);
    let animationFrameId: number | null = null;

    // --- FIX: Safety start function to ensure the engine ALWAYS fires ---
    const startWater = () => {
      if (!animationFrameId) {
        baseImageData = ctx.getImageData(0, 0, width, height);
        processWater();
      }
    };

    const logo = new Image();
    
    // 1. Define onload FIRST
    logo.onload = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const logoWidth = Math.min(width * 0.6, 600); 
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const x = (width - logoWidth) / 2;
      const y = (height - logoHeight) / 2;
      
      ctx.drawImage(logo, x, y - 40, logoWidth, logoHeight);
      startWater(); // Start the engine!
    };

    // 2. Define onerror SECOND
    logo.onerror = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('STEFANDERSON', width / 2, height / 2 - 40);
      startWater(); // Start the engine!
    };

    // 3. Define src LAST (This prevents the cache race condition)
    logo.src = '/logostefand.svg'; 
    
    // 4. Ultimate Fallback: If image hangs for more than 1 second, start the water anyway
    setTimeout(() => {
      if (!animationFrameId) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        startWater();
      }
    }, 1000);

    const processWater = () => {
      for (let y = 1; y < physicsHeight - 1; y++) {
        for (let x = 1; x < physicsWidth - 1; x++) {
          const i = x + y * physicsWidth;
          current[i] = (
            previous[i - 1] + previous[i + 1] + 
            previous[i - physicsWidth] + previous[i + physicsWidth]
          ) / 2 - current[i];
          current[i] *= DAMPING;
        }
      }

      const baseData = baseImageData.data;
      const outData = outputImageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = Math.floor(x / scale);
          const py = Math.floor(y / scale);
          const pi = px + py * physicsWidth;

          let dx = x;
          let dy = y;

          if (px > 0 && px < physicsWidth - 1 && py > 0 && py < physicsHeight - 1) {
              const diffX = current[pi + 1] - current[pi - 1];
              const diffY = current[pi + physicsWidth] - current[pi - physicsWidth];
              dx += Math.floor(diffX * 1.5);
              dy += Math.floor(diffY * 1.5);
          }

          dx = Math.max(0, Math.min(width - 1, dx));
          dy = Math.max(0, Math.min(height - 1, dy));

          const outIndex = (x + y * width) * 4;
          const inIndex = (dx + dy * width) * 4;

          outData[outIndex] = baseData[inIndex];         
          outData[outIndex + 1] = baseData[inIndex + 1]; 
          outData[outIndex + 2] = baseData[inIndex + 2]; 
          outData[outIndex + 3] = 255;                   
        }
      }

      ctx.putImageData(outputImageData, 0, 0);

      let temp = previous;
      previous = current;
      current = temp;

      // Update the animationFrameId so our fallback knows it's running
      animationFrameId = requestAnimationFrame(processWater); 
    };

    const handleMouseMove = (e: MouseEvent) => {
      // 1. Water Ripple Physics
      const px = Math.floor(e.clientX / scale);
      const py = Math.floor(e.clientY / scale);
      const radius = 2;
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x*x + y*y <= radius*radius) {
            const idx = (px + x) + (py + y) * physicsWidth;
            if (idx >= 0 && idx < size) {
              previous[idx] = 255; 
            }
          }
        }
      }

      // 2. Audio Hover Logic
      targetVolumeRef.current = 0.5; 
      
      if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
      
      mouseTimeoutRef.current = setTimeout(() => {
        targetVolumeRef.current = 0; 
      }, 150);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const triggerBucketSplash = () => {
    if (!isReady || isSplashing) return; 
    setIsSplashing(true);
    
    // Play splash sound if user enabled audio
    if (isAudioEnabled && splashAudioRef.current) {
      splashAudioRef.current.play().catch(() => {});
    }

    // Force hover audio off during transition
    targetVolumeRef.current = 0; 
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.style.transition = 'transform 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 1.2s ease-in';
    canvas.style.transform = 'translateY(100vh) scale(1.1) rotate(5deg)';
    canvas.style.opacity = '0';

    setTimeout(() => {
      onSplashComplete(isAudioEnabled); // PASS THE STATE HERE!
    }, 1200);
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden ${isReady ? 'cursor-pointer' : 'cursor-wait'}`}>
      
      {/* AUDIO TOGGLE BUTTON */}
      <button
        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
        className="absolute top-8 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 hover:scale-110"
        style={{
          borderColor: isAudioEnabled ? '#ef4444' : '#52525b',
          color: isAudioEnabled ? '#ef4444' : '#52525b',
          backgroundColor: isAudioEnabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
        }}
        title={isAudioEnabled ? "Mute Audio" : "Enable Audio"}
      >
        {isAudioEnabled ? (
          // Speaker ON SVG
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          // Speaker OFF SVG
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>

      {/* HUD OVERLAY */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-32 pointer-events-none mix-blend-difference">
        {!isReady ? (
          <div className="text-zinc-500 font-mono text-sm tracking-[0.5em] animate-pulse">
            INITIALIZING CORE ASSETS [ {loadProgress}% ]
          </div>
        ) : (
          <div className="text-white font-black text-xl tracking-[0.4em] animate-pulse">
            [ CLICK ANYWHERE TO DIVE IN ]
          </div>
        )}
      </div>

      {/* PHYSICS CANVAS */}
      <canvas 
        ref={canvasRef} 
        onClick={triggerBucketSplash}
        className="absolute top-0 left-0 w-full h-full z-10 origin-bottom"
        style={{ willChange: 'transform, opacity' }}
      />
    </div>
  );
}