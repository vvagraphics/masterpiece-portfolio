// src/components/WaterPreloader.tsx
import { useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

interface WaterPreloaderProps {
  onSplashComplete: (audioEnabled: boolean) => void;
}

export default function WaterPreloader({ onSplashComplete }: WaterPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // === STATE ===
  const [isSplashing, setIsSplashing] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);

  // === FLAIR STATE ===
  // Tracks the current color of the text for the DOM element
  const [textColor, setTextColor] = useState<string | null>(null);

  // === AUDIO REFS ===
  const hoverAudioRef = useRef<Howl | null>(null);
  const settleAudioRef = useRef<Howl | null>(null);
  const splashAudioRef = useRef<Howl | null>(null);
  
  // === STATE SYNC REFS ===
  const isAudioEnabledRef = useRef(isAudioEnabled);
  
  // Ref to pass the active text color down to the high-speed canvas loop
  const waterTintRef = useRef({ r: 255, g: 255, b: 255, isRainbow: true });
  
  // === PHYSICS & INTERACTION REFS ===
  const targetVolumeRef = useRef(0);
  const currentVolumeRef = useRef(0);
  const targetRateRef = useRef(0.9);
  const currentRateRef = useRef(0.9);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const isMovingRef = useRef(false);
  const isFirstMoveRef = useRef(true); 
  
  // === RAIN STORM REFS ===
  const triggerRainstormRef = useRef<(() => void) | null>(null);
  const stormIntensityRef = useRef(0);
  const blackoutRef = useRef(0);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  // === ASSET PRELOADER ===
  useEffect(() => {
    const assetsToLoad = [
      '/audio/water_start.mp3', 
      '/audio/water_stop.mp3',        
      '/audio/thundertorain.mp3',
      '/logoblkstroke.svg',
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

  // === AUDIO INITIALIZATION ===
  useEffect(() => {
    hoverAudioRef.current = new Howl({
      src: ['/audio/water_start.mp3'], 
      loop: true,
      volume: 0
    });

    settleAudioRef.current = new Howl({
      src: ['/audio/water_stop.mp3'], 
      volume: 0.3 
    });

    splashAudioRef.current = new Howl({
      src: ['/audio/thundertorain.mp3'],
      volume: 0.9
    });

    return () => {
      hoverAudioRef.current?.unload();
      settleAudioRef.current?.unload();
      splashAudioRef.current?.unload();
    };
  }, []);

  // === WATER PHYSICS & 60FPS RENDERING ENGINE ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const DAMPING = 0.90; 
    const scale = 4; 
    const physicsWidth = Math.floor(width / scale);
    const physicsHeight = Math.floor(height / scale);
    const size = physicsWidth * physicsHeight;

    let current = new Float32Array(size);
    let previous = new Float32Array(size);
    let baseImageData: ImageData;
    let outputImageData = ctx.createImageData(width, height);
    let animationFrameId: number | null = null;

    const processWater = () => {
      const now = performance.now();
      const hasAudio = isAudioEnabledRef.current;

      if (now - lastMoveTimeRef.current > 50) {
        targetVolumeRef.current = 0;
        targetRateRef.current = 0.85; 
        
        if (isMovingRef.current) {
          isMovingRef.current = false;
          if (hasAudio && settleAudioRef.current) {
            settleAudioRef.current.play();
          }
        }
      }

      if (hasAudio && hoverAudioRef.current) {
        if (!hoverAudioRef.current.playing() && targetVolumeRef.current > 0) {
          hoverAudioRef.current.play();
        }
        currentVolumeRef.current += (targetVolumeRef.current - currentVolumeRef.current) * 0.15;
        const newVolume = Math.min(1, Math.max(0, currentVolumeRef.current));
        hoverAudioRef.current.volume(newVolume);
        
        if (targetVolumeRef.current > 0) {
           currentRateRef.current += (targetRateRef.current - currentRateRef.current) * 0.1;
           hoverAudioRef.current.rate(currentRateRef.current);
        }
      } else if (hoverAudioRef.current?.playing()) {
         hoverAudioRef.current.pause();
         currentVolumeRef.current = 0;
      }

      if (stormIntensityRef.current > 0) {
        blackoutRef.current = Math.min(1, blackoutRef.current + 0.015);
        
        const drops = Math.floor(stormIntensityRef.current);
        for (let i = 0; i < drops; i++) {
          const rx = Math.floor(Math.random() * (physicsWidth - 2)) + 1;
          const ry = Math.floor(Math.random() * (physicsHeight - 2)) + 1;
          const idx = rx + ry * physicsWidth;
          previous[idx] = 150 + Math.random() * 400; 
        }
        stormIntensityRef.current = Math.min(50, stormIntensityRef.current + 0.4);
      }

      for (let y = 1; y < physicsHeight - 1; y++) {
        for (let x = 1; x < physicsWidth - 1; x++) {
          const i = x + y * physicsWidth;
          current[i] = (
            previous[i - 1] + previous[i + 1] + 
            previous[i - physicsWidth] + previous[i + physicsWidth]
          ) / 2 - current[i];
          
          current[i] *= DAMPING;

          if (Math.abs(current[i]) < 0.05) {
            current[i] = 0;
          }
        }
      }

      for (let i = 0; i < physicsWidth; i++) {
        current[i] = 0; 
        current[i + (physicsHeight - 1) * physicsWidth] = 0; 
      }
      for (let i = 0; i < physicsHeight; i++) {
        current[i * physicsWidth] = 0; 
        current[(physicsWidth - 1) + i * physicsWidth] = 0; 
      }

      const baseData = baseImageData.data;
      const outData = outputImageData.data;

      // Render Pixels
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = Math.floor(x / scale);
          const py = Math.floor(y / scale);
          const pi = px + py * physicsWidth;

          let dx = x;
          let dy = y;
          let shading = 0;

          if (px > 0 && px < physicsWidth - 1 && py > 0 && py < physicsHeight - 1) {
              const diffX = current[pi + 1] - current[pi - 1];
              const diffY = current[pi + physicsWidth] - current[pi - physicsWidth];
              
              dx += Math.floor(diffX * 1.5);
              dy += Math.floor(diffY * 1.5);
              shading = (diffX - diffY) * 0.25; 
          }

          dx = Math.max(5, Math.min(width - 6, dx));
          dy = Math.max(5, Math.min(height - 6, dy));

          const outIndex = (x + y * width) * 4;
          const inIndex = (dx + dy * width) * 4;

          let r = baseData[inIndex];         
          let g = baseData[inIndex + 1]; 
          let b = baseData[inIndex + 2]; 

          if (blackoutRef.current > 0) {
            const darkness = 1 - blackoutRef.current;
            r *= darkness;
            g *= darkness;
            b *= darkness;
          }
          
          // === THE FLAIR MAGIC: WATER TINT SYNC ===
          if (shading > 0) {
            if (waterTintRef.current.isRainbow) {
              // Default subtle greyish highlight
              r += shading;
              g += shading * 1.05; 
              b += shading * 1.15; 
            } else {
              // Hovered state: Inject the bold neon color into the highlights
              const tint = waterTintRef.current;
              // Divide by ~120 to boost the brightness of the reflection
              r += shading * (tint.r / 120); 
              g += shading * (tint.g / 120); 
              b += shading * (tint.b / 120); 
            }
          } else {
            // Shadows stay dark
            r += shading;
            g += shading;
            b += shading;
          }

          outData[outIndex] = Math.max(0, Math.min(255, r));         
          outData[outIndex + 1] = Math.max(0, Math.min(255, g)); 
          outData[outIndex + 2] = Math.max(0, Math.min(255, b)); 
          outData[outIndex + 3] = 255;                  
        }
      }

      ctx.putImageData(outputImageData, 0, 0);

      let temp = previous;
      previous = current;
      current = temp;

      animationFrameId = requestAnimationFrame(processWater); 
    };

    const startWater = () => {
      if (animationFrameId) return;
      baseImageData = ctx.getImageData(0, 0, width, height);
      processWater();
    };

    const loadLogoAndStart = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      const logo = new Image();
      logo.src = '/logoblkstroke.svg';
      
      logo.onload = () => {
        const logoWidth = Math.min(width * 0.6, 600); 
        const logoHeight = (logo.height / logo.width) * logoWidth;
        const x = (width - logoWidth) / 2;
        const y = (height - logoHeight) / 2;
        
        // We draw the logo higher up to leave room for the HTML text below it
        ctx.drawImage(logo, x, y - 60, logoWidth, logoHeight);
        startWater(); 
      };

      logo.onerror = () => {
        console.warn("Logo failed to load");
        startWater(); 
      };
    };

    loadLogoAndStart();

    const handleMouseMove = (e: MouseEvent) => {
      if (isFirstMoveRef.current) {
        isFirstMoveRef.current = false;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        lastMoveTimeRef.current = performance.now();
        return; 
      }

      lastMoveTimeRef.current = performance.now();
      
      const currentX = e.clientX;
      const currentY = e.clientY;
      const prevX = lastMousePosRef.current.x;
      const prevY = lastMousePosRef.current.y;
      
      const distanceX = currentX - prevX;
      const distanceY = currentY - prevY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      const steps = Math.max(1, Math.floor(distance / 4));
      const radius = 2; 
      
      for (let i = 0; i <= steps; i++) {
        const interpX = prevX + (distanceX * (i / steps));
        const interpY = prevY + (distanceY * (i / steps));
        
        const px = Math.floor(interpX / scale);
        const py = Math.floor(interpY / scale);
        
        for (let y = -radius; y <= radius; y++) {
          for (let x = -radius; x <= radius; x++) {
            if (x * x + y * y <= radius * radius) {
              const idx = (px + x) + (py + y) * physicsWidth;
              if (idx >= 0 && idx < size) {
                previous[idx] = 180; 
              }
            }
          }
        }
      }

      lastMousePosRef.current = { x: currentX, y: currentY };

      if (!isMovingRef.current) {
        isMovingRef.current = true;
      }

      const speed = Math.min(1, distance / 40); 
      targetVolumeRef.current = 0.8 + (speed * 0.5); 
      targetRateRef.current = 0.85 + (speed * 0.2); 
    };

    triggerRainstormRef.current = () => {
      stormIntensityRef.current = 1; 
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
    
    setIsAudioEnabled(true);
    if (Howler.ctx && Howler.ctx.state === 'suspended') {
      Howler.ctx.resume();
    }
    
    if (splashAudioRef.current) {
      splashAudioRef.current.play();
    }
    
    if (triggerRainstormRef.current) {
      triggerRainstormRef.current();
    }
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.transition = 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 1.5s';
      canvas.style.opacity = '0'; 
    }

    setTimeout(() => {
      onSplashComplete(true);
    }, 2500); 
  };

  // === INTERACTION HANDLERS FOR PORTFOLIO TEXT ===
  const handleTextHover = () => {
    // Array of vibrant neon colors
    const neons = [
      { r: 0, g: 255, b: 255, css: '#00ffff' },   // Cyan
      { r: 255, g: 0, b: 255, css: '#ff00ff' },   // Magenta
      { r: 57, g: 255, b: 20, css: '#39ff14' },   // Neon Green
      { r: 255, g: 49, b: 49, css: '#ff3131' },   // Neon Red
      { r: 255, g: 215, b: 0, css: '#ffd700' }    // Yellow/Gold
    ];
    
    const randomNeon = neons[Math.floor(Math.random() * neons.length)];
    
    // 1. Update DOM element to match
    setTextColor(randomNeon.css);
    // 2. Sync to the canvas rendering loop instantly
    waterTintRef.current = { r: randomNeon.r, g: randomNeon.g, b: randomNeon.b, isRainbow: false };
  };

  const handleTextLeave = () => {
    // Revert to rainbow DOM state
    setTextColor(null);
    // Revert canvas lighting to default
    waterTintRef.current.isRainbow = true;
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden ${isReady ? 'cursor-pointer' : 'cursor-wait'}`}>
      
      {/* --- ADD THIS TO YOUR CSS (App.css or index.css) ---
          @keyframes rainbow-text {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .animate-rainbow {
            background: linear-gradient(270deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3);
            background-size: 400% 400%;
            animation: rainbow-text 8s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
      */}

      {/* PORTFOLIO FLAIR TEXT */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-500 ${isSplashing ? 'opacity-0' : 'opacity-100'}`}
        // Offset below center to sit perfectly under the logo
        style={{ transform: 'translateY(80px)' }} 
      >
        <h1 
          onMouseEnter={handleTextHover}
          onMouseLeave={handleTextLeave}
          onClick={(e) => {
             e.stopPropagation(); // Stop bucket splash if they click the text directly
             triggerBucketSplash();
          }}
          className={`font-black tracking-[0.5em] text-4xl sm:text-6xl md:text-7xl select-none pointer-events-auto transition-transform duration-300 hover:scale-105 cursor-pointer ${!textColor ? 'animate-rainbow' : ''}`}
          style={textColor ? { color: textColor, textShadow: `0 0 30px ${textColor}` } : {}}
        >
          PORTFOLIO
        </h1>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation(); 
          if (!isAudioEnabled && Howler.ctx && Howler.ctx.state === 'suspended') {
            Howler.ctx.resume();
          }
          setIsAudioEnabled(!isAudioEnabled);
        }}
        className={`absolute top-8 right-8 z-50 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 hover:scale-110 ${isSplashing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{
          borderColor: isAudioEnabled ? '#ef4444' : '#52525b',
          color: isAudioEnabled ? '#ef4444' : '#52525b',
          backgroundColor: isAudioEnabled ? 'rgba(239, 68, 68, 0.1)' : 'transparent'
        }}
        title={isAudioEnabled ? "Mute Audio" : "Enable Audio"}
      >
        {isAudioEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>

      <div className={`absolute top-10 right-[85px] z-50 flex gap-2 transition-opacity duration-500 ${isSplashing ? 'opacity-0' : 'opacity-70'}`}>
  <span className="px-3 py-1 text-white-500 font-mono text-xs tracking-widest  rounded-full ">
    NO ANIMATION?
  </span>
  <span className="animate-[pulse_2s_infinite] px-3 py-1 text-red-500 font-mono text-xs tracking-widest bg-red-950/30 rounded-full border border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
    CLICK AUDIO →
  </span>
</div>

      <div className={`absolute inset-0 z-20 flex flex-col items-center justify-end pb-32 pointer-events-none mix-blend-difference transition-opacity duration-500 ${isSplashing ? 'opacity-0' : 'opacity-100'}`}>
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

      <canvas 
        ref={canvasRef} 
        onClick={triggerBucketSplash}
        className="absolute top-0 left-0 w-full h-full z-10 origin-center"
        style={{ willChange: 'opacity' }}
      />
    </div>
  );
}