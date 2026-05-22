import { useEffect, useRef, useState } from 'react';

export default function GraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(15);
  
  // Audio reference for the spray sound
  const spraySound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize spray sound
    spraySound.current = new Audio('/audio/spray.mp3');
    spraySound.current.loop = true;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to match the background image size conceptually
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Fix context settings for spray look
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent) => {
    setIsDrawing(true);
    if (spraySound.current) spraySound.current.play().catch(() => {}); // Play sound
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (spraySound.current) {
      spraySound.current.pause();
      spraySound.current.currentTime = 0; // Reset sound
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.beginPath(); // Reset path so next line doesn't connect
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
    
    // Add a slight shadow to make it look like thick spray paint
    ctx.shadowBlur = Math.floor(brushSize / 2);
    ctx.shadowColor = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  return (
    <div 
      className="relative w-full h-full bg-cover bg-center"
      style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/first_web-background.jpg')" }}
    >
      {/* UI Controls - Absolute positioned on top */}
      <div className="absolute top-4 left-4 z-20 bg-black/80 p-4 border border-zinc-700 rounded text-white flex gap-4 items-center">
        <h3 className="font-bold uppercase tracking-widest text-red-500 mr-4">Graffiti Tools</h3>
        
        <label className="flex items-center gap-2">
          Color:
          <input 
            type="color" 
            value={color} 
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
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
            className="w-24"
          />
        </label>
      </div>

      {/* The drawing canvas */}
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