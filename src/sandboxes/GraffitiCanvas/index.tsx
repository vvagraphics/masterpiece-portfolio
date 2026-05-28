// src/sandboxes/GraffitiCanvas/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';
import { Howl } from 'howler';
import localforage from 'localforage';
import { Volume2, VolumeX } from 'lucide-react'; // Added for the new local audio control

const GRAFFITI_COLORS = [
  '#000000', '#FFFFFF', '#FF0033', '#00E5FF', '#FF00FF', '#FFEA00', '#39FF14'
];

const TEXTURES = {
  black: '', 
  brick: 'https://mr3anderson.pro/masterpiece-portfolio/graffiticanvas/brick.jpg',
  concrete: 'https://mr3anderson.pro/masterpiece-portfolio/graffiticanvas/concrete.jpg'
};

type LayoutMode = 'FULL' | 'SPLIT_VERT' | 'SPLIT_HORIZ';
type CapType = 'SKINNY' | 'STANDARD' | 'FAT';

interface CapProfile {
  size: number;
  density: number;
  scatter: number;
  opacity: number;
  name: string;
}

const CAP_PROFILES: Record<CapType, CapProfile> = {
  SKINNY: { size: 4, density: 3, scatter: 2, opacity: 0.8, name: 'Skinny Cap' },
  STANDARD: { size: 12, density: 5, scatter: 8, opacity: 0.5, name: 'Standard Cap' },
  FAT: { size: 35, density: 8, scatter: 20, opacity: 0.15, name: 'NY Fat Cap' }
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
};

// ADDED PROP to receive audio state from SandboxWrapper
interface Props {
  isAudioEnabled?: boolean;
  onLayoutChange?: (layout: LayoutMode) => void;
}

export default function GraffitiCanvas({ isAudioEnabled = false, onLayoutChange}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const spraySound = useRef<Howl | null>(null);
  const shakeSound = useRef<Howl | null>(null);
  const envSoundRef = useRef<Howl | null>(null);
  
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const brushStampRef = useRef<HTMLCanvasElement | null>(null);
  const poolingAnimationFrameRef = useRef<number | null>(null);

  const [sessionId, setSessionId] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(GRAFFITI_COLORS[2]);
  const [activeCap, setActiveCap] = useState<CapType>('STANDARD');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [activeTexture, setActiveTexture] = useState<string>(TEXTURES.black);
  
  // NEW: Local state specifically for the City Environment loop
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);

  // Loading States
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [wipSaveStatus, setWipSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [wipLoadStatus, setWipLoadStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'NOT_FOUND'>('IDLE');

  // --- 1. Session ID Generator ---
  useEffect(() => {
    const initSession = async () => {
      let storedId = await localforage.getItem<string>('portfolio_session_id');
      if (!storedId) {
        storedId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await localforage.setItem('portfolio_session_id', storedId);
      }
      setSessionId(storedId);
    };
    initSession();
  }, []);

  // --- 2. Local Draft Auto-Save ---
  const saveDraftToBrowser = async (currentLayout: LayoutMode, currentTexture: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const paintData = canvas.toDataURL('image/png');
      const existingDrafts: any = await localforage.getItem('portfolio_drafts') || {};
      const updatedDrafts = {
        ...existingDrafts,
        graffiti: {
          ...(existingDrafts.graffiti || {}),
          [currentLayout]: { paintData, texture: currentTexture, width: canvas.width, height: canvas.height, lastUpdated: Date.now() }
        }
      };
      await localforage.setItem('portfolio_drafts', updatedDrafts);
    } catch (err) {
      console.error('Local save failed:', err);
    }
  };

  // --- 3. Local Draft Auto-Load ---
  useEffect(() => {
    const loadDraft = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];

      try {
        const drafts: any = await localforage.getItem('portfolio_drafts');
        const myDraft = drafts?.graffiti?.[layoutMode];

        if (myDraft) {
          setActiveTexture(myDraft.texture);
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
            saveState(); 
          };
          img.src = myDraft.paintData;
        } else {
          saveState(); 
        }
      } catch (err) {
        console.error('Local load failed:', err);
      }
    };
    loadDraft();
  }, [layoutMode]);

  // --- Brush Generation ---
  useEffect(() => {
    const profile = CAP_PROFILES[activeCap];
    const stampSize = profile.size * 2 + profile.scatter * 2;
    const canvas = document.createElement('canvas');
    canvas.width = stampSize;
    canvas.height = stampSize;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const rgb = hexToRgb(color);
      const center = stampSize / 2;

      const grad = ctx.createRadialGradient(center, center, 0, center, center, profile.size);
      grad.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${profile.opacity})`);
      grad.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${profile.opacity * 0.5})`);
      grad.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, stampSize, stampSize);

      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.min(1, profile.opacity + 0.4)})`;
      const speckleCount = profile.size * profile.density;
      for (let i = 0; i < speckleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.pow(Math.random(), 1.5) * (profile.size + profile.scatter);
        ctx.fillRect(center + Math.cos(angle) * distance, center + Math.sin(angle) * distance, 1, 1);
      }
    }
    brushStampRef.current = canvas;
  }, [color, activeCap]);

  // --- Audio Setup & Resize Setup ---
  useEffect(() => {
    spraySound.current = new Howl({
      src: ['/audio/spray_sprite.mp3'], 
      sprite: { start: [100, 300], loop: [300, 900, true], end: [1200, 1500] },
      volume: 0.6,
    });
    
    shakeSound.current = new Howl({ src: ['/audio/shake.mp3'], volume: 0.8 });

    // Environment Loop Setup
    envSoundRef.current = new Howl({
      src: ['/audio/city_street_loop.mp3'], 
      loop: true,
      volume: 0, 
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const handleResize = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.drawImage(tempCanvas, 0, 0);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      spraySound.current?.unload();
      shakeSound.current?.unload();
      
      // CAREFUL UNMOUNT: Fade out cleanly and then completely unload from memory
      // We grab the current ref value into a closure so it doesn't get lost during unmount
      const envAudio = envSoundRef.current;
      if (envAudio) {
        const currentVol = typeof envAudio.volume() === 'number' ? envAudio.volume() as number : 0;
        envAudio.fade(currentVol, 0, 500);
        setTimeout(() => envAudio.unload(), 500);
      }
      
      if (poolingAnimationFrameRef.current) cancelAnimationFrame(poolingAnimationFrameRef.current);
    };
  }, []);

  // --- Handle Global & Local Mute Toggle for Environment Audio ---
  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = typeof envSoundRef.current.volume() === 'number' ? envSoundRef.current.volume() as number : 0;
    
    // It must be globally enabled AND not locally muted to play
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.4, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

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
    saveDraftToBrowser(layoutMode, activeTexture);
  };

  const clearWall = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    saveDraftToBrowser(layoutMode, activeTexture);
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
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const isInsideActiveArea = (x: number, y: number) => {
    if (layoutMode === 'FULL') return true;
    const canvas = canvasRef.current;
    if (!canvas) return false;
    if (layoutMode === 'SPLIT_VERT') return x >= canvas.width / 2; 
    if (layoutMode === 'SPLIT_HORIZ') return y >= canvas.height / 2; 
    return false;
  };

  const playShakeSound = () => {
    if (isAudioEnabled && shakeSound.current && !shakeSound.current.playing()) {
      shakeSound.current.play();
    }
  };

  const poolPaint = () => {
    if (isDrawingRef.current && lastPosRef.current && brushStampRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const { x, y } = lastPosRef.current;

      if (ctx && isInsideActiveArea(x, y)) {
        ctx.globalAlpha = 0.2; 
        ctx.drawImage(brushStampRef.current, x - brushStampRef.current.width / 2, y - brushStampRef.current.height / 2);
        ctx.globalAlpha = 1.0;
      }
      poolingAnimationFrameRef.current = requestAnimationFrame(poolPaint);
    }
  };

  const applyStamp = (x: number, y: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !brushStampRef.current) return;
    ctx.drawImage(brushStampRef.current, x - brushStampRef.current.width / 2, y - brushStampRef.current.height / 2);
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (isDrawingRef.current) return; 
    const coords = getCoordinates(e);
    if (!isInsideActiveArea(coords.x, coords.y)) return;

    setIsDrawing(true);
    isDrawingRef.current = true;
    lastPosRef.current = coords;

    if (spraySound.current && isAudioEnabled) {
      const startId = spraySound.current.play('start');
      spraySound.current.once('end', () => {
        if (isDrawingRef.current && spraySound.current) spraySound.current.play('loop');
      }, startId);
    }
    
    applyStamp(coords.x, coords.y);
    poolPaint(); 
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    isDrawingRef.current = false;
    lastPosRef.current = null;
    
    if (poolingAnimationFrameRef.current) cancelAnimationFrame(poolingAnimationFrameRef.current);
    if (spraySound.current) spraySound.current.stop();    
    
    saveState();
    saveDraftToBrowser(layoutMode, activeTexture); 
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPosRef.current) return;
    if ('touches' in e && e.cancelable) e.preventDefault();

    const currentPos = getCoordinates(e);
    const lastPos = lastPosRef.current;

    const distance = Math.hypot(currentPos.x - lastPos.x, currentPos.y - lastPos.y);
    const angle = Math.atan2(currentPos.y - lastPos.y, currentPos.x - lastPos.x);
    const step = Math.max(1, CAP_PROFILES[activeCap].size / 3); 

    for (let i = 0; i < distance; i += step) {
      const x = lastPos.x + (Math.cos(angle) * i);
      const y = lastPos.y + (Math.sin(angle) * i);
      if (isInsideActiveArea(x, y)) applyStamp(x, y);
    }
    lastPosRef.current = currentPos;
  };

  // --- CLOUD PUBLISH (Gallery) ---
  const handleCloudSave = async () => { 
    if (!containerRef.current || saveStatus === 'SAVING') return;
    setSaveStatus('SAVING');
    setIsCapturing(true); 
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); 
      const dataUrl = await htmlToImage.toPng(containerRef.current, { quality: 0.95, pixelRatio: 2 });
      const blob = await dataUrlToBlob(dataUrl);
      const fileName = `artwork_${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage.from('gallery').upload(`public/${fileName}`, blob);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(`public/${fileName}`);
      const { error: dbError } = await supabase.from('creations').insert([
          { image_url: publicUrl, sandbox_type: 'GRAFFITI', created_at: new Date().toISOString() }
      ]);
      if (dbError) throw dbError;
      
      setSaveStatus('SUCCESS');
      setTimeout(() => setSaveStatus('IDLE'), 4000);
    } catch (err) {
      console.error('Gallery Upload failed:', err);
      setSaveStatus('ERROR');
      setTimeout(() => setSaveStatus('IDLE'), 4000);
    } finally {
      setIsCapturing(false);
    }
  };

  // Helper: Checks if canvas has any non-transparent pixels
  const isCanvasEmpty = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] > 0) return false;
    }
    return true;
  };

  const handleSaveForLater = async () => {
    if (!sessionId || wipSaveStatus === 'SAVING') return;
    setWipSaveStatus('SAVING');
    
    try {
      const allDrafts: any = await localforage.getItem('portfolio_drafts');
      if (!allDrafts?.graffiti) throw new Error('No draft data found.');

      const layouts = Object.keys(allDrafts.graffiti);
      let savedCount = 0;

      for (const layout of layouts) {
        const draft = allDrafts.graffiti[layout];
        
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = draft.width;
        tempCanvas.height = draft.height;
        const tempCtx = tempCanvas.getContext('2d');
        const img = new Image();
        img.src = draft.paintData;
        await img.decode();
        tempCtx?.drawImage(img, 0, 0);

        if (isCanvasEmpty(tempCanvas)) {
          console.log(`Skipping empty draft for: ${layout}`);
          continue; 
        }

        const blob = await dataUrlToBlob(draft.paintData);
        const fileName = `${sessionId}_${layout}.png`;

        await supabase.storage.from('wip-drafts').upload(fileName, blob, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from('wip-drafts').getPublicUrl(fileName);

        await supabase.from('wip_sessions').upsert({
          session_id: sessionId,
          layout: layout,
          texture: draft.texture,
          image_url: `${publicUrl}?t=${Date.now()}`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'session_id, layout' });
        
        savedCount++;
      }

      alert(savedCount > 0 ? `Saved ${savedCount} sections successfully.` : "Nothing to save (all canvases empty).");
      setWipSaveStatus('SUCCESS');
      setTimeout(() => setWipSaveStatus('IDLE'), 4000);
    } catch (err: any) {
      console.error('Cloud Save Error:', err);
      setWipSaveStatus('ERROR');
      setTimeout(() => setWipSaveStatus('IDLE'), 4000);
    }
  };

  // --- CLOUD DRAFT LOAD (Supabase WIPs) ---
  const handleLoadFromCloud = async () => {
    if (!sessionId || wipLoadStatus === 'LOADING') return;
    setWipLoadStatus('LOADING');

    try {
      const { data, error } = await supabase
        .from('wip_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .eq('layout', layoutMode)
        .single();

      if (error || !data) {
        setWipLoadStatus('NOT_FOUND');
        setTimeout(() => setWipLoadStatus('IDLE'), 4000);
        return;
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setActiveTexture(data.texture);

      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        saveState();
        saveDraftToBrowser(layoutMode, data.texture); 
        setWipLoadStatus('SUCCESS');
        setTimeout(() => setWipLoadStatus('IDLE'), 4000);
      };
      img.src = data.image_url;

    } catch (err) {
      console.error('Cloud Draft Load failed:', err);
      setWipLoadStatus('ERROR');
      setTimeout(() => setWipLoadStatus('IDLE'), 4000);
    }
  };

  const uiPositionClass = layoutMode === 'SPLIT_HORIZ' ? 'top-20' : 'bottom-8';
  const uiWidthClass = layoutMode === 'SPLIT_VERT' ? 'max-w-[45vw]' : 'max-w-[90vw]';

  return (
    <div ref={containerRef} className="relative w-screen h-screen bg-black overflow-hidden touch-none overscroll-none">
      
      <div className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
          layoutMode === 'FULL' ? 'w-full h-full' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
        }`}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/first_website.jpg')",
    backgroundSize: 'contain',
    backgroundPosition: 'top center',
    backgroundRepeat: 'no-repeat'
  }}  />
        <CitySilhouette />
      </div>

      {layoutMode !== 'FULL' && (
        <div className={`absolute bottom-0 right-0 bg-black transition-all duration-500 ease-in-out ${
            layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full border-l-4 border-zinc-900' : 'w-full h-1/2 border-t-4 border-zinc-900'
          }`}
        >
          {activeTexture && (
            <div className="absolute inset-0 bg-cover bg-center opacity-40 pointer-events-none" style={{ backgroundImage: `url(${activeTexture})` }} />
          )}
        </div>
      )}

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
                    onClick={() => {
                      setColor(c);
                      playShakeSound(); 
                    }}
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
                    onChange={(e) => setColor(e.target.value)} 
                    onPointerDown={playShakeSound} 
                    className="absolute -inset-2 w-12 h-12 opacity-0 cursor-pointer"
                    title="Custom Color"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-zinc-400">Caps:</span>
              {(Object.keys(CAP_PROFILES) as CapType[]).map((cap) => (
                <button
                  key={cap}
                  onClick={() => setActiveCap(cap)}
                  className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${
                    activeCap === cap ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 hover:border-zinc-400'
                  }`}
                  title={CAP_PROFILES[cap].name}
                >
                  {cap}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-zinc-700 mx-2 hidden lg:block"></div>

            <div className="flex gap-4">
              <button onClick={undo} disabled={historyRef.current.length <= 1} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 disabled:opacity-50 transition-colors">Undo</button>
              <button onClick={clearWall} className="text-sm font-bold uppercase tracking-wider hover:text-red-400 transition-colors">Clear</button>
            </div>
            
            <div className="h-6 w-px bg-zinc-700 mx-2 hidden lg:block"></div>

            {/* NEW: Local Environment Audio Toggle */}
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline text-sm text-zinc-400 uppercase tracking-widest text-xs font-bold">Environment Sound:</span>
              <button
                onClick={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
                className={`p-2 rounded border transition-colors flex items-center justify-center ${
                  !isEnvAudioMuted ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 hover:border-zinc-400 text-zinc-400'
                }`}
                title="Toggle City Background Noise"
              >
                {isEnvAudioMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            <div className="h-6 w-px bg-zinc-700 mx-2 hidden lg:block"></div>

            {/* Cloud Save & Load Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center flex-1 justify-end">
              
              <div className="flex gap-2">
                <div className="relative">
                  <button 
                    onClick={handleSaveForLater} 
                    disabled={wipSaveStatus === 'SAVING' || wipLoadStatus === 'LOADING'}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:bg-zinc-900 px-3 py-1 rounded font-bold transition-colors uppercase tracking-wider text-xs"
                  >
                    {wipSaveStatus === 'SAVING' ? 'SAVING...' : 'Save WIP'}
                  </button>
                  {wipSaveStatus === 'SUCCESS' && <span className="absolute bottom-full left-0 mb-1 w-max text-green-400 font-mono text-xs tracking-widest">CLOUD SAVED</span>}
                  {wipSaveStatus === 'ERROR' && <span className="absolute bottom-full left-0 mb-1 w-max text-red-400 font-mono text-xs tracking-widest">SAVE FAILED</span>}
                </div>

                <div className="relative">
                  <button 
                    onClick={handleLoadFromCloud} 
                    disabled={wipLoadStatus === 'LOADING' || wipSaveStatus === 'SAVING'}
                    className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:bg-zinc-900 px-3 py-1 rounded font-bold transition-colors uppercase tracking-wider text-xs"
                  >
                    {wipLoadStatus === 'LOADING' ? 'LOADING...' : 'Load WIP'}
                  </button>
                  {wipLoadStatus === 'SUCCESS' && <span className="absolute bottom-full left-0 mb-1 w-max text-green-400 font-mono text-xs tracking-widest">RESTORED</span>}
                  {wipLoadStatus === 'NOT_FOUND' && <span className="absolute bottom-full left-0 mb-1 w-max text-zinc-400 font-mono text-xs tracking-widest">NO DRAFT FOUND</span>}
                  {wipLoadStatus === 'ERROR' && <span className="absolute bottom-full left-0 mb-1 w-max text-red-400 font-mono text-xs tracking-widest">LOAD FAILED</span>}
                </div>
              </div>

              <div className="relative ml-auto">
                <button 
                  onClick={handleCloudSave} 
                  disabled={saveStatus === 'SAVING'}
                  className="bg-red-600 hover:bg-red-500 disabled:bg-red-800 px-4 py-1 rounded font-bold transition-colors uppercase tracking-wider"
                >
                  {saveStatus === 'SAVING' ? 'PUBLISHING...' : 'Publish'}
                </button>
                {saveStatus === 'SUCCESS' && <span className="absolute top-full left-0 mt-2 w-max text-green-400 font-mono text-xs tracking-widest animate-pulse">ADDED TO GALLERY</span>}
                {saveStatus === 'ERROR' && <span className="absolute top-full left-0 mt-2 w-max text-red-400 font-mono text-xs tracking-widest">PUBLISH FAILED</span>}
              </div>
            </div>

          </div>

          <div className="h-px w-full bg-zinc-700"></div>

          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center">
            <div className="flex gap-2">
              <span className="text-xs text-zinc-400 uppercase tracking-widest self-center mr-2">Playground:</span>
              {(['FULL', 'SPLIT_VERT', 'SPLIT_HORIZ'] as LayoutMode[]).map((mode) => (
                <button 
                  key={mode}
                  onClick={() => {
                    if (mode === 'FULL') setActiveTexture(TEXTURES.black);
                    setLayoutMode(mode); 
                    if (onLayoutChange) onLayoutChange(mode); // <-- Add this to notify the parent!
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded border transition-colors ${layoutMode === mode ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400'}`}
                >
                  {mode.replace('_', ' ')}
                </button>
              ))}
            </div>

            {layoutMode !== 'FULL' && (
               <div className="flex gap-2 items-center">
                 <span className="text-xs text-zinc-400 uppercase tracking-widest mr-2">Surface:</span>
                 {Object.entries(TEXTURES).map(([name, url]) => (
                    <button 
                      key={name}
                      onClick={() => {
                        setActiveTexture(url);
                        saveDraftToBrowser(layoutMode, url); 
                      }} 
                      className={`w-6 h-6 border-2 rounded transition-colors ${
                        activeTexture === url ? 'border-white' : 'border-transparent hover:border-white/50'
                      } ${name === 'black' ? 'bg-black' : name === 'brick' ? 'bg-red-900' : 'bg-zinc-600'}`}
                      title={`${name} Wall`}
                    />
                 ))}
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
      
      {/* Mobile Orientation Lock Overlay */}
      <div className="rotate-warning hidden">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-red-500">Rotate Device</h2>
          <p className="text-sm text-zinc-400 mt-2">Please rotate to Landscape to paint.</p>
        </div>
      </div>
      
    </div>
  );
}