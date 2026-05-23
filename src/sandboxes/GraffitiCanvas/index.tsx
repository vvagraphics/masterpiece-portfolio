import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';

export default function GraffitiCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spraySound = useRef<HTMLAudioElement | null>(null);
  
  // History stack for Undo functionality
  const historyRef = useRef<ImageData[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(15);
  const [isCapturing, setIsCapturing] = useState(false);

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

    // Save initial blank state to history
    saveState();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
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

  const startDrawing = (e: React.MouseEvent) => {
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

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (!containerRef.current) return;
    setIsCapturing(true); // Hides UI
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for React render
      const dataUrl = await htmlToImage.toPng(containerRef.current, { quality: 0.95 });
      
      const blob = await dataUrlToBlob(dataUrl);
      const fileName = `artwork_${Date.now()}.png`;

      // Upload to Storage
      const { error: uploadError } = await supabase
        .storage
        .from('gallery')
        .upload(`public/${fileName}`, blob);

      if (uploadError) throw uploadError;

      // Get URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('gallery')
        .getPublicUrl(`public/${fileName}`);

      // Save to Database
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
      alert("Masterpiece saved to the global gallery!");

    } catch (err) {
      console.error('Upload failed:', err);
      alert("Failed to save. Check console for errors.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/first_web-background.jpg')" }}
    >
      <CitySilhouette />

      {/* UI Controls - Hidden during snapshot capture */}
      {!isCapturing && (
        <div className="absolute top-4 left-4 z-20 bg-black/80 p-4 border border-zinc-700 rounded text-white flex flex-wrap gap-6 items-center shadow-xl">
          <h3 className="font-bold uppercase tracking-widest text-red-500">Graffiti Tools</h3>
          
          <label className="flex items-center gap-2 cursor-pointer">
            Color:
            <input 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
            />
          </label>

          <label className="flex items-center gap-2">
            Cap Size:
            <input 
              type="range" 
              min="5" 
              max="50" 
              value={brushSize} 
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-red-500"
            />
          </label>

          <div className="h-6 w-px bg-zinc-700 mx-2"></div>

          <button onClick={undo} disabled={historyRef.current.length <= 1} className="hover:text-red-400 disabled:opacity-50 transition-colors">
            Undo
          </button>
          <button onClick={clearWall} className="hover:text-red-400 transition-colors">
            Clear
          </button>
          <button onClick={handleCloudSave} className="bg-red-600 hover:bg-red-500 px-4 py-1 rounded font-bold transition-colors">
            Save to Gallery
          </button>
        </div>
      )}

      {/* Watermark - Only visible during snapshot */}
      {isCapturing && (
        <div className="absolute bottom-6 right-8 z-20 text-white/50 font-mono text-sm tracking-widest bg-black/50 px-2 py-1">
          MASTERPIECE PORTFOLIO // EFANDERSON
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onMouseMove={draw}
        className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair"
      />
    </div>
  );
}