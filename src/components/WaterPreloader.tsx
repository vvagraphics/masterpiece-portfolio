// src/components/WaterPreloader.tsx
import { useEffect, useRef, useState } from 'react';
import { Howl, Howler } from 'howler';

interface WaterPreloaderProps {
  onSplashComplete: (audioEnabled: boolean) => void;
}

interface GlitchState {
  c1: string; o1: { x: number; y: number };
  c2: string; o2: { x: number; y: number };
  c3: string; o3: { x: number; y: number };
}

export default function WaterPreloader({ onSplashComplete }: WaterPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // === STATE ===
  const [isSplashing, setIsSplashing] = useState<boolean>(false);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);

  // === AUDIO REFS ===
  const hoverAudioRef = useRef<Howl | null>(null);
  const settleAudioRef = useRef<Howl | null>(null);
  const splashAudioRef = useRef<Howl | null>(null);
  
  // === STATE SYNC REFS ===
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const isEngineReadyRef = useRef(false); 
  
  // THE NEW DUAL-TONE TINT REF
  const waterTintRef = useRef({ 
    r1: 255, g1: 255, b1: 255, 
    r2: 255, g2: 255, b2: 255, 
    isRainbow: true 
  });
  
  // THE FIX: Explicitly passing `null` to satisfy TypeScript strict mode
  const paintCanvasFloorRef = useRef<((glitch: GlitchState | null) => void) | null>(null);
  const rebootEngineRef = useRef<(() => void) | null>(null);
  
  // === PHYSICS & INTERACTION REFS ===
  const baseImageDataRef = useRef<ImageData | null>(null);
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  const targetVolumeRef = useRef(0);
  const currentVolumeRef = useRef(0);
  const targetRateRef = useRef(0.9);
  const currentRateRef = useRef(0.9);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const lastMoveTimeRef = useRef(0);
  const isMovingRef = useRef(false);
  const isFirstMoveRef = useRef(true); 
  
  const triggerRainstormRef = useRef<(() => void) | null>(null);
  const stormIntensityRef = useRef(0);
  const blackoutRef = useRef(0);

  useEffect(() => {
    isAudioEnabledRef.current = isAudioEnabled;
  }, [isAudioEnabled]);

  // === ASSET PRELOADER ===
  useEffect(() => {
    const assetsToLoad = ['/audio/water_start.mp3', '/audio/water_stop.mp3', '/audio/thundertorain.mp3', '/logoblkstroke.svg'];
    let loadedCount = 0;
    const updateProgress = () => {
      loadedCount++;
      setLoadProgress(Math.floor((loadedCount / assetsToLoad.length) * 100));
      if (loadedCount === assetsToLoad.length) setTimeout(() => setIsReady(true), 800); 
    };

    assetsToLoad.forEach(url => {
      if (url.endsWith('.mp3')) {
        const audio = new Audio();
        audio.addEventListener('canplaythrough', updateProgress, { once: true });
        audio.src = url;
      } else {
        const img = new Image();
        img.onload = updateProgress;
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

  // === WATER ENGINE ===
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const scale = 4;
    const physicsWidth = Math.floor(width / scale);
    const physicsHeight = Math.floor(height / scale);
    const size = physicsWidth * physicsHeight;
    let current = new Float32Array(size);
    let previous = new Float32Array(size);
    let outputImageData = ctx.createImageData(width, height);
    let animationFrameId: number | null = null;

    const drawPoolFloor = (glitchState: GlitchState | null) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (logoImgRef.current) {
        const logo = logoImgRef.current;
        const logoWidth = Math.min(width * 0.6, 600); 
        ctx.drawImage(logo, (width - logoWidth) / 2, (height - ((logo.height / logo.width) * logoWidth)) / 2 - 60, logoWidth, (logo.height / logo.width) * logoWidth);
      }

      ctx.save();
      let fontSize = '24px';
      if (width >= 640) fontSize = '30px';
      if (width >= 768) fontSize = '36px';
      
      ctx.font = `900 ${fontSize} monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.letterSpacing = '8px';

      const textX = (width / 2) + 120;
      const textY = (height / 2) + 90;

      const g = glitchState || {
        c1: 'rgba(255, 0, 0, 0.8)', o1: { x: -3, y: 0 },
        c2: 'rgba(0, 255, 0, 0.8)', o2: { x: 0, y: 2 },
        c3: 'rgba(0, 100, 255, 0.8)', o3: { x: 3, y: -1 }
      };

      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = g.c1; ctx.fillText('PORTFOLIO', textX + g.o1.x, textY + g.o1.y);
      ctx.fillStyle = g.c3; ctx.fillText('PORTFOLIO', textX + g.o3.x, textY + g.o3.y);
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g.c2; ctx.fillText('PORTFOLIO', textX + g.o2.x, textY + g.o2.y);
      
      ctx.restore();
      baseImageDataRef.current = ctx.getImageData(0, 0, width, height);
    };

    paintCanvasFloorRef.current = drawPoolFloor;

    const processWater = () => {
      try {
        if (!baseImageDataRef.current) {
          animationFrameId = requestAnimationFrame(processWater);
          return; 
        }
        isEngineReadyRef.current = true;
        
        const now = performance.now();
        const hasAudio = isAudioEnabledRef.current;

        if (now - lastMoveTimeRef.current > 50) {
          targetVolumeRef.current = 0;
          targetRateRef.current = 0.85; 
          
          if (isMovingRef.current) {
            isMovingRef.current = false;
            if (hasAudio && settleAudioRef.current) settleAudioRef.current.play();
          }
        }

        if (hasAudio && hoverAudioRef.current) {
          if (!hoverAudioRef.current.playing() && targetVolumeRef.current > 0) {
            hoverAudioRef.current.play();
          }
          currentVolumeRef.current += (targetVolumeRef.current - currentVolumeRef.current) * 0.15;
          hoverAudioRef.current.volume(Math.min(1, Math.max(0, currentVolumeRef.current)));
          
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
            previous[rx + ry * physicsWidth] = 150 + Math.random() * 400; 
          }
          stormIntensityRef.current = Math.min(50, stormIntensityRef.current + 0.4);
        }

        for (let y = 1; y < physicsHeight - 1; y++) {
          for (let x = 1; x < physicsWidth - 1; x++) {
            const i = x + y * physicsWidth;
            current[i] = (previous[i - 1] + previous[i + 1] + previous[i - physicsWidth] + previous[i + physicsWidth]) / 2 - current[i];
            current[i] *= 0.90;
            if (Math.abs(current[i]) < 0.05) current[i] = 0;
          }
        }

        for (let i = 0; i < physicsWidth; i++) {
          current[i] = 0; current[i + (physicsHeight - 1) * physicsWidth] = 0; 
        }
        for (let i = 0; i < physicsHeight; i++) {
          current[i * physicsWidth] = 0; current[(physicsWidth - 1) + i * physicsWidth] = 0; 
        }

        const baseData = baseImageDataRef.current.data;
        const outData = outputImageData.data;

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
              r *= darkness; g *= darkness; b *= darkness;
            }
            
            // === DUAL TONE WATER REFLECTION LOGIC ===
            if (waterTintRef.current.isRainbow) {
              // Default state
              if (shading > 0) {
                r += shading; g += shading * 1.05; b += shading * 1.15; 
              } else {
                r += shading; g += shading; b += shading;
              }
            } else {
              // Glitch State: Dual Color Illumination!
              const tint = waterTintRef.current;
              
              if (shading > 0) {
                // Highlight Side (Catches Color 1)
                r += shading * (tint.r1 / 120); 
                g += shading * (tint.g1 / 120); 
                b += shading * (tint.b1 / 120); 
              } else if (shading < 0) {
                // Shadow Side (Catches Color 2, creating an ambient bounce light)
                const oppShading = Math.abs(shading) * 0.8; // Flip to positive and soften slightly
                r += oppShading * (tint.r2 / 120); 
                g += oppShading * (tint.g2 / 120); 
                b += oppShading * (tint.b2 / 120); 
              }
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
      } catch (e) {
        console.warn("Water engine frame skipped", e);
        animationFrameId = requestAnimationFrame(processWater);
      }
    };

    rebootEngineRef.current = () => { 
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (paintCanvasFloorRef.current) paintCanvasFloorRef.current(null);
      processWater(); 
    };

    const loadLogoAndStart = () => {
      const logo = new Image();
      logo.src = '/logoblkstroke.svg';
      
      logo.onload = () => {
        logoImgRef.current = logo;
        drawPoolFloor(null); 
        if (!animationFrameId) processWater();
      };

      logo.onerror = () => {
        drawPoolFloor(null); 
        if (!animationFrameId) processWater();
      };
    };

    loadLogoAndStart();

    const handleMouseMove = (e: MouseEvent) => {
      if (!isEngineReadyRef.current) return; 

      if (isFirstMoveRef.current) {
        isFirstMoveRef.current = false;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        lastMoveTimeRef.current = performance.now();
        return; 
      }

      lastMoveTimeRef.current = performance.now();
      const distanceX = e.clientX - lastMousePosRef.current.x;
      const distanceY = e.clientY - lastMousePosRef.current.y;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);
      
      const steps = Math.max(1, Math.floor(distance / 4));
      
      for (let i = 0; i <= steps; i++) {
        const interpX = lastMousePosRef.current.x + (distanceX * (i / steps));
        const interpY = lastMousePosRef.current.y + (distanceY * (i / steps));
        
        const px = Math.floor(interpX / scale);
        const py = Math.floor(interpY / scale);
        
        for (let y = -2; y <= 2; y++) {
          for (let x = -2; x <= 2; x++) {
            if (x * x + y * y <= 4) {
              const idx = (px + x) + (py + y) * physicsWidth;
              if (idx >= 0 && idx < size) previous[idx] = 180; 
            }
          }
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      if (!isMovingRef.current) isMovingRef.current = true;

      const speed = Math.min(1, distance / 40); 
      targetVolumeRef.current = 0.8 + (speed * 0.5); 
      targetRateRef.current = 0.85 + (speed * 0.2); 
    };

    triggerRainstormRef.current = () => { stormIntensityRef.current = 1; };

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
    if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
    if (splashAudioRef.current) splashAudioRef.current.play();
    if (triggerRainstormRef.current) triggerRainstormRef.current();
    
    if (canvasRef.current) {
      canvasRef.current.style.transition = 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1) 1.5s';
      canvasRef.current.style.opacity = '0'; 
    }
    setTimeout(() => onSplashComplete(true), 2500); 
  };

  const handleTextHover = () => {
    const neons = [
      { css: 'rgba(0, 255, 255, 0.8)', r: 0, g: 255, b: 255 },     // Cyan
      { css: 'rgba(255, 0, 255, 0.8)', r: 255, g: 0, b: 255 },     // Magenta
      { css: 'rgba(57, 255, 20, 0.8)', r: 57, g: 255, b: 20 },     // Lime
      { css: 'rgba(255, 49, 49, 0.8)', r: 255, g: 49, b: 49 },     // Neon Red
      { css: 'rgba(255, 215, 0, 0.8)', r: 255, g: 215, b: 0 }      // Yellow
    ];
    
    const shuffled = [...neons].sort(() => 0.5 - Math.random());
    const subtleOffsets = [{ x: -1, y: -2 }, { x: 1, y: 2 }, { x: -2, y: 1 }, { x: 2, y: -1 }];

    // We now send TWO colors to the water physics engine!
    waterTintRef.current = { 
      r1: shuffled[0].r, g1: shuffled[0].g, b1: shuffled[0].b, // Color 1 (Highlight)
      r2: shuffled[1].r, g2: shuffled[1].g, b2: shuffled[1].b, // Color 2 (Shadows)
      isRainbow: false 
    };

    paintCanvasFloorRef.current?.({
      c1: shuffled[1].css, o1: subtleOffsets[0],
      c2: shuffled[0].css, o2: { x: 0, y: 0 }, 
      c3: shuffled[2].css, o3: subtleOffsets[1]
    });
  };

  return (
    <div className={`relative w-full h-screen bg-black overflow-hidden ${isReady ? 'cursor-pointer' : 'cursor-wait'}`}>

      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none z-30 transition-opacity duration-500 ${isSplashing ? 'opacity-0' : 'opacity-100'}`}
        style={{ transform: `translate(120px, 90px)` }} 
      >
        <h1 
          onMouseEnter={handleTextHover}
          onClick={(e) => {
             e.stopPropagation(); 
             triggerBucketSplash();
          }}
          className="font-black tracking-[8px] text-2xl sm:text-3xl md:text-4xl text-center select-none pointer-events-auto cursor-pointer opacity-0"
        >
          PORTFOLIO
        </h1>
      </div>

      <div className={`absolute top-8 right-8 z-50 flex flex-col items-center gap-2 transition-opacity duration-500 ${isSplashing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <button
          onClick={(e) => {
            e.stopPropagation(); 
            if (!isAudioEnabled && Howler.ctx && Howler.ctx.state === 'suspended') {
              Howler.ctx.resume();
            }
            setIsAudioEnabled(!isAudioEnabled);
            if (rebootEngineRef.current) rebootEngineRef.current(); 
          }}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 hover:scale-110"
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

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (rebootEngineRef.current) rebootEngineRef.current();
          }}
          className="text-[10px] text-zinc-600 font-mono tracking-widest hover:text-red-500 transition-colors uppercase cursor-pointer"
        >
          [ Reboot Waves ]
        </button>
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