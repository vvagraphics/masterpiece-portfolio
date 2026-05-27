// src/sandboxes/GraffitiCanvas/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';
import { Howl } from 'howler';

const GRAFFITI_COLORS = [
  '#000000', '#FFFFFF', '#FF0033', '#00E5FF', '#FF00FF', '#FFEA00', '#39FF14'
];

// Textures for the split-screen drawing canvas
const TEXTURES = {
  brick: 'https://images.unsplash.com/photo-1517231425774-05cf3232c662?w=1200&q=80',
  concrete: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1200&q=80'
};

type LayoutMode = 'FULL' | 'SPLIT_VERT' | 'SPLIT_HORIZ';

export default function GraffitiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null); 
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const spraySound = useRef<Howl | null>(null);
  const shakeSound = useRef<Howl | null>(null);
  
  // State Refs
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);

  // UI State
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(GRAFFITI_COLORS[2]); // Default Red
  const [brushSize, setBrushSize] = useState(25);
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [activeTexture, setActiveTexture] = useState<string>(TEXTURES.brick);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    // 1. Audio Sprite Setup
    // Ensure you create an audio file with a start (0-300ms), loop (300-1200ms), and end (1500-1800ms)
    // If you don't have this file yet, the regular spray sound will just play as a fallback based on your sprite markers.
    spraySound.current = new Howl({
      src: ['/audio/spray.mp3'], // Ideally rename this to spray_sprite.mp3 once you compile it
      sprite: {
        start: [0, 300], 
        loop: [400, 1000, true], 
        end: [1500, 300]
      },
      volume: 0.6,
    });

    shakeSound.current = new Howl({
      src: ['/audio/shake.mp3'],
      volume: 0.8,
    });

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Initialize Canvas Size
    canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
    canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    
    saveState();

    // Resize handler for Canvas
    const resizeCanvas = (newWidth: number, newHeight: number) => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(tempCanvas, 0, 0);
    };

    // Use ResizeObserver because CSS layout transitions don't trigger window.onresize
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          resizeCanvas(entry.contentRect.width, entry.contentRect.height);
        }
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }

    const handleWindowResize = () => {
      if (canvasContainerRef.current) {
         resizeCanvas(canvasContainerRef.current.clientWidth, canvasContainerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleWindowResize);
    
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver.disconnect();
      spraySound.current?.unload();
      shakeSound.current?.unload();
    };
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) return;
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    if (historyRef.current.length > 20) historyRef.current.shift();
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || historyRef.current.length <= 1) return;

    historyRef.current.pop(); 
    const previousState = historyRef.current[historyRef.current.length - 1];
    ctx.putImageData(previousState, 0, 0);
  };

  const clearWall = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const handleColorSelect = (newColor: string) => {
    setColor(newColor);
    if (shakeSound.current) {
      shakeSound.current.play();
    }
  };

  const spray = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const density = brushSize * 3; 
    ctx.fillStyle = color;

    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = (Math.random() * Math.random()) * brushSize; 
      
      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;

      ctx.globalAlpha = 0.4; 
      ctx.fillRect(x + offsetX, y + offsetY, 1, 1);
    }
    ctx.globalAlpha = 1.0;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    isDrawingRef.current = true;
    const coords = getCoordinates(e);
    lastPosRef.current = coords;

    if (spraySound.current) {
      spraySound.current.play('start');
      spraySound.current.once('end', () => {
        if (isDrawingRef.current && spraySound.current) {
          spraySound.current.play('loop');
        }
      });
    }
    
    spray(coords.x, coords.y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    isDrawingRef.current = false;
    lastPosRef.current = null;
    
    if (spraySound.current) {
      spraySound.current.stop(); 
      spraySound.current.play('end');
    }
    
    saveState();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPosRef.current) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    const currentPos = getCoordinates(e);
    const lastPos = lastPosRef.current;

    const distance = Math.hypot(currentPos.x - lastPos.x, currentPos.y - lastPos.y);
    const angle = Math.atan2(currentPos.y - lastPos.y, currentPos.x - lastPos.x);

    const step = 2; 

    for (let i = 0; i < distance; i += step) {
      const x = lastPos.x + (Math.cos(angle) * i);
      const y = lastPos.y + (Math.sin(angle) * i);
      spray(x, y);
    }

    lastPosRef.current = currentPos;
  };

  const handleCloudSave = async () => {
    // Only capture the canvas container, not the whole window
    const targetRef = layoutMode === 'FULL' ? containerRef : canvasContainerRef;
    if (!targetRef.current || saveStatus === 'SAVING') return;
    
    setSaveStatus('SAVING');
    setIsCapturing(true); 
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); 
      const dataUrl = await htmlToImage.toPng(targetRef.current, { quality: 0.95, pixelRatio: 2 });
      
      const blob = await dataUrlToBlob(dataUrl);
      const fileName = `artwork_${Date.now()}.png`;

      const { error: uploadError } = await supabase
        .storage
        .from('gallery')
        .upload(`public/${fileName}`, blob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase
        .storage
        .from('gallery')
        .getPublicUrl(`public/${fileName}`);

      const { error: dbError } = await supabase
        .from('creations')
        .insert([
          { 
            image_url: publicUrl, 
            sandbox_type: 'GRAFFITI',
            created_at: new Date().toISOString()
          }
        ]);

      if (dbError) throw dbError;
      
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 4000);

    } catch (err) {
      console.error('Upload failed:', err);
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 4000);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`w-screen h-screen bg-black overflow-hidden flex transition-all duration-700 ease-in-out touch-none overscroll-none ${
        layoutMode === 'SPLIT_HORIZ' ? 'flex-col' : 'flex-row'
      }`}
    >
      {/* Container 1: The Original Background Scene */}
      <div 
        className={`relative transition-all duration-700 ease-in-out ${
          layoutMode === 'FULL' ? 'w-full h-full' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 
          'w-full h-1/2'
        }`}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/first_website.jpg')" }}
        />
        <CitySilhouette />
        
        {/* Draw over the whole scene if in FULL mode */}
        {layoutMode === 'FULL' && (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            onTouchMove={draw}
            className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
          />
        )}
      </div>

      {/* Container 2: The Split Canvas Area (Only rendered/visible when split) */}
      <div 
        ref={canvasContainerRef}
        className={`relative overflow-hidden transition-all duration-700 ease-in-out ${
          layoutMode === 'FULL' ? 'w-0 h-0 opacity-0' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full border-l border-zinc-800' : 
          'w-full h-1/2 border-t border-zinc-800'
        }`}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-300"
          style={{ backgroundImage: `url(${activeTexture})`, opacity: 0.6 }}
        />

        {layoutMode !== 'FULL' && (
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
            onTouchMove={draw}
            className="absolute inset-0 w-full h-full z-10 cursor-crosshair touch-none"
          />
        )}
      </div>

      {/* --- UI Controls --- */}
      {!isCapturing && (
        <div className="absolute top-4 left-4 z-20 bg-black/80 p-4 border border-zinc-700 rounded text-white flex flex-col gap-4 shadow-xl backdrop-blur-sm max-w-[90vw]">
          
          {/* Top Row: Original Tools */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <h3 className="font-bold uppercase tracking-widest text-red-500 hidden xl:block">Graffiti Tools</h3>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-zinc-400">Can:</span>
              <div className="flex gap-2">
                {GRAFFITI_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-zinc-400">Cap Size:</span>
              <input 
                type="range" 
                min="10" 
                max="60" 
                value={brushSize} 
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-24 accent-red-500"
              />
            </label>

            <div className="h-6 w-px bg-zinc-700 mx-2 hidden sm:block"></div>

            <div className="flex gap-4">
              <button onClick={undo} disabled={historyRef.current.length <= 1} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 disabled:opacity-50 transition-colors">
                Undo
              </button>
              <button onClick={clearWall} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 transition-colors">
                Clear
              </button>
            </div>
            
            <div className="relative">
              <button 
                onClick={handleCloudSave} 
                disabled={saveStatus === 'SAVING'}
                className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 px-4 py-1 rounded font-bold transition-colors uppercase tracking-wider"
              >
                {saveStatus === 'SAVING' ? 'UPLOADING...' : 'Save'}
              </button>

              {saveStatus === 'SUCCESS' && (
                <span className="absolute top-full left-0 mt-2 w-max text-green-400 font-mono text-xs tracking-widest animate-pulse">
                  SAVED TO ARCHIVES
                </span>
              )}
              {saveStatus === 'ERROR' && (
                <span className="absolute top-full left-0 mt-2 w-max text-red-400 font-mono text-xs tracking-widest">
                  UPLOAD FAILED
                </span>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-zinc-700"></div>

          {/* Bottom Row: Layout & Texture Controls */}
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            
            <div className="flex gap-2">
              <span className="text-xs text-zinc-400 uppercase tracking-widest self-center mr-2">Mode:</span>
              <button 
                onClick={() => { setLayoutMode('FULL'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'FULL' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                FULL
              </button>
              <button 
                onClick={() => { setLayoutMode('SPLIT_VERT'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'SPLIT_VERT' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                VERTICAL
              </button>
              <button 
                onClick={() => { setLayoutMode('SPLIT_HORIZ'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'SPLIT_HORIZ' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                HORIZONTAL
              </button>
            </div>

            {layoutMode !== 'FULL' && (
               <div className="flex gap-2 items-center">
                 <span className="text-xs text-zinc-400 uppercase tracking-widest mr-2">Surface:</span>
                 <button 
                   onClick={() => setActiveTexture(TEXTURES.brick)} 
                   className={`w-6 h-6 bg-red-900 border-2 rounded transition-colors ${activeTexture === TEXTURES.brick ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                   title="Brick Wall"
                 ></button>
                 <button 
                   onClick={() => setActiveTexture(TEXTURES.concrete)} 
                   className={`w-6 h-6 bg-zinc-600 border-2 rounded transition-colors ${activeTexture === TEXTURES.concrete ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                   title="Concrete Wall"
                 ></button>
               </div>
            )}
          </div>
          
        </div>
      )}

      {isCapturing && (
        <div className="absolute bottom-6 right-8 z-20 text-white/50 font-mono text-sm tracking-widest bg-black/50 px-2 py-1">
          MASTERPIECE PORTFOLIO // EFANDERSON
        </div>
      )}
    </div>
  );
}