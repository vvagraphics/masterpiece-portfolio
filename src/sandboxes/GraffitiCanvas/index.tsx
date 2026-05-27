// src/sandboxes/GraffitiCanvas/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';

export default function GraffitiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spraySound = useRef<HTMLAudioElement | null>(null);
  
  const historyRef = useRef<ImageData[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(15);
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');

  useEffect(() => {
    spraySound.current = new Audio('/audio/spray.mp3');
    spraySound.current.loop = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    saveState();

    const handleResize = () => {
      // POLISH: Save canvas contents before resize wipes them
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      // Resize
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Restore contexts and image
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current.push(data);
    
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
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

  // Helper function to get correct coordinates for both Mouse and Touch events
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      // Mouse event
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    if (spraySound.current) spraySound.current.play().catch(() => {});
    draw(e);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    if (spraySound.current) {
      spraySound.current.pause();
      spraySound.current.currentTime = 0;
    }
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath();
    
    saveState();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Prevent scrolling while drawing on mobile
    if ('touches' in e && e.cancelable) e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctx.lineWidth = brushSize;
    ctx.strokeStyle = color;
    ctx.shadowBlur = Math.floor(brushSize / 2);
    ctx.shadowColor = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
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

  return (
    // <div 
    //   ref={containerRef}
    //   className="relative w-full h-full bg-cover bg-center overflow-hidden overscroll-none touch-none"
    //   style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/first_web-background.jpg')" }}
    // >
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-cover bg-center overflow-hidden overscroll-none touch-none"
      style={{ backgroundImage: "url('/first_website.jpg')" }}
    > 
      <CitySilhouette />

      {!isCapturing && (
        <div className="absolute top-4 left-4 z-20 bg-black/80 p-4 border border-zinc-700 rounded text-white flex flex-wrap gap-6 items-center shadow-xl backdrop-blur-sm max-w-[90vw]">
          <h3 className="font-bold uppercase tracking-widest text-red-500 hidden sm:block">Graffiti Tools</h3>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="hidden sm:inline">Color:</span>
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
          </label>

          <label className="flex items-center gap-2">
            <span className="hidden sm:inline">Cap Size:</span>
            <input 
              type="range" 
              min="5" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-red-500"
            />
          </label>

          <div className="h-6 w-px bg-zinc-700 mx-2 hidden sm:block"></div>

          <button onClick={undo} disabled={historyRef.current.length <= 1} className="hover:text-red-400 disabled:opacity-50 transition-colors">
            Undo
          </button>
          <button onClick={clearWall} className="hover:text-red-400 transition-colors">
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
      )}

      {isCapturing && (
        <div className="absolute bottom-6 right-8 z-20 text-white/50 font-mono text-sm tracking-widest bg-black/50 px-2 py-1">
          MASTERPIECE PORTFOLIO // EFANDERSON
        </div>
      )}

      {/* POLISH: Added onTouch events for mobile support */}
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
        className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair touch-none"
      />
    </div>
  );
}