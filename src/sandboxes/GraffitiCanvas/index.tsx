// src/sandboxes/GraffitiCanvas/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';
import { Howl } from 'howler';

const GRAFFITI_COLORS = [
  '#000000', '#FFFFFF', '#FF0033', '#00E5FF', '#FF00FF', '#FFEA00', '#39FF14'
];

const TEXTURES = {
  black: '', // Empty string explicitly falls back to the bg-black container
  brick: 'https://images.unsplash.com/photo-1517231425774-05cf3232c662?w=1200&q=80',
  concrete: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=1200&q=80'
};

type LayoutMode = 'FULL' | 'SPLIT_VERT' | 'SPLIT_HORIZ';

export default function GraffitiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs (Kept exactly as you had them for your sprite testing)
  const spraySound = useRef<Howl | null>(null);
  const shakeSound = useRef<Howl | null>(null);
  
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(GRAFFITI_COLORS[2]);
  const [brushSize, setBrushSize] = useState(25);
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [activeTexture, setActiveTexture] = useState<string>(TEXTURES.black); // Default to Black
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    spraySound.current = new Howl({
      src: ['/audio/spray_sprite.mp3'], 
      sprite: {
        start: [100, 300],             
        loop: [300, 900, true],     
        end: [1200, 1500]             
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

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    saveState();

    const handleResize = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
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
    let clientX, clientY;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // NEW SHIELD LOGIC: Prevents drawing on the background image when split
  const isInsideActiveArea = (x: number, y: number) => {
    if (layoutMode === 'FULL') return true;
    
    const canvas = canvasRef.current;
    if (!canvas) return false;

    if (layoutMode === 'SPLIT_VERT') {
      return x >= canvas.width / 2; // Right half only
    }
    
    if (layoutMode === 'SPLIT_HORIZ') {
      return y >= canvas.height / 2; // Bottom half only
    }

    return false;
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
    if (isDrawingRef.current) return; 

    const coords = getCoordinates(e);

    // Block the spray immediately if clicking outside the active zone
    if (!isInsideActiveArea(coords.x, coords.y)) return;

    setIsDrawing(true);
    isDrawingRef.current = true;
    lastPosRef.current = coords;

    if (spraySound.current) {
      const startId = spraySound.current.play('start');
      spraySound.current.once('end', () => {
        if (isDrawingRef.current && spraySound.current) {
          spraySound.current.play('loop');
        }
      }, startId);
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

    const step = Math.max(5, brushSize / 2); 

    for (let i = 0; i < distance; i += step) {
      const x = lastPos.x + (Math.cos(angle) * i);
      const y = lastPos.y + (Math.sin(angle) * i);
      
      // Restrict interpolation dots to the active zone
      if (isInsideActiveArea(x, y)) {
        spray(x, y);
      }
    }

    lastPosRef.current = currentPos;
  };

  const handleCloudSave = async () => {
    if (!containerRef.current || saveStatus === 'SAVING') return;
    
    setSaveStatus('SAVING');
    setIsCapturing(true); 
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); 
      const dataUrl = await htmlToImage.toPng(containerRef.current, { quality: 0.95, pixelRatio: 2 });
      
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

  // Dynamic UI Positioning Classes to keep out of the way of the canvas & museum button
  const uiPositionClass = layoutMode === 'SPLIT_HORIZ' ? 'top-20' : 'bottom-8';
  const uiWidthClass = layoutMode === 'SPLIT_VERT' ? 'max-w-[45vw]' : 'max-w-[90vw]';

  return (
    <div 
      ref={containerRef}
      className="relative w-screen h-screen bg-black overflow-hidden touch-none overscroll-none"
    >
      {/* 1. Background Image Container */}
      <div 
        className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
          layoutMode === 'FULL' ? 'w-full h-full' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 
          'w-full h-1/2'
        }`}
      >
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/first_website.jpg')" }}
        />
        <CitySilhouette />
      </div>

      {/* 2. Visual Canvas Background Container (Only renders when split) */}
      {layoutMode !== 'FULL' && (
        <div 
          className={`absolute bottom-0 right-0 bg-black transition-all duration-500 ease-in-out ${
            layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full border-l-4 border-zinc-900' : 
            'w-full h-1/2 border-t-4 border-zinc-900'
          }`}
        >
          {/* Explicitly checks if activeTexture exists before applying url() */}
          {activeTexture && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none" 
              style={{ backgroundImage: `url(${activeTexture})` }} 
            />
          )}
        </div>
      )}

      {/* 3. The Unified Full-Screen Drawing Layer */}
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

      {/* 4. Smart UI Controls */}
      {!isCapturing && (
        <div className={`absolute z-20 left-4 md:left-8 transition-all duration-500 ease-in-out ${uiPositionClass} ${uiWidthClass} bg-black/80 p-4 border border-zinc-700 rounded text-white flex flex-col gap-4 shadow-xl backdrop-blur-sm overflow-y-auto max-h-[80vh]`}>
          
          <div className="flex flex-wrap gap-6 items-center">
            <h3 className="font-bold uppercase tracking-widest text-red-500 hidden sm:block">Graffiti Tools</h3>
            
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-zinc-400">Can:</span>
              <div className="flex gap-2 items-center">
                {GRAFFITI_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleColorSelect(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                
                <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-white transition-colors ml-2 cursor-pointer shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 pointer-events-none"></div>
                  <input 
                    type="color" 
                    value={color} 
                    onChange={(e) => handleColorSelect(e.target.value)}
                    className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer"
                    title="Custom Color"
                  />
                </div>
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

            <button onClick={undo} disabled={historyRef.current.length <= 1} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 disabled:opacity-50 transition-colors">
              Undo
            </button>
            <button onClick={clearWall} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 transition-colors">
              Clear
            </button>
            
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

          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
            <div className="flex gap-2">
              <span className="text-xs text-zinc-400 uppercase tracking-widest self-center mr-2">Playground:</span>
              <button 
                onClick={() => { setLayoutMode('FULL'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'FULL' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                FULL SCREEN
              </button>
              <button 
                onClick={() => { setLayoutMode('SPLIT_VERT'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'SPLIT_VERT' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                VERTICAL SPLIT
              </button>
              <button 
                onClick={() => { setLayoutMode('SPLIT_HORIZ'); clearWall(); }}
                className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === 'SPLIT_HORIZ' ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
              >
                HORIZONTAL SPLIT
              </button>
            </div>

            {layoutMode !== 'FULL' && (
               <div className="flex gap-2 items-center">
                 <span className="text-xs text-zinc-400 uppercase tracking-widest mr-2">Surface:</span>
                 <button 
                   onClick={() => setActiveTexture(TEXTURES.black)} 
                   className={`w-6 h-6 bg-black border-2 rounded transition-colors ${activeTexture === TEXTURES.black ? 'border-white' : 'border-transparent hover:border-white/50'}`}
                   title="Black Wall"
                 ></button>
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