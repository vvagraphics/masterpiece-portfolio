// src/sandboxes/GraffitiCanvas/index.tsx
import { useEffect, useRef, useState } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';
import CitySilhouette from '../../components/CitySilhouette';
import { Howl } from 'howler';
import localforage from 'localforage';
import { Volume2, VolumeX } from 'lucide-react'; 

// ==========================================
// 1. TYPES & CONFIGURATION
// ==========================================

// WCAG: Descriptive names mapped to Hex arrays for screen reader clarity
const GRAFFITI_COLORS = [
  { hex: '#000000', name: 'Black' }, 
  { hex: '#FFFFFF', name: 'White' }, 
  { hex: '#FF0033', name: 'Crimson Red' }, 
  { hex: '#00E5FF', name: 'Cyan' }, 
  { hex: '#FF00FF', name: 'Magenta' }, 
  { hex: '#FFEA00', name: 'Yellow' }, 
  { hex: '#39FF14', name: 'Neon Green' }
];

const TEXTURES = [
  { id: 'black', url: '', label: 'Solid Black' },
  { id: 'brick', url: 'https://mr3anderson.pro/masterpiece-portfolio/graffiticanvas/brick.jpg', label: 'Brick Wall' },
  { id: 'concrete', url: 'https://mr3anderson.pro/masterpiece-portfolio/graffiticanvas/concrete.jpg', label: 'Concrete Wall' }
];

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

interface Props {
  isAudioEnabled?: boolean;
  onLayoutChange?: (layout: LayoutMode) => void;
}

// ==========================================
// 2. MAIN COMPONENT & STATE
// ==========================================
export default function GraffitiCanvas({ isAudioEnabled = false, onLayoutChange}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const spraySound = useRef<Howl | null>(null);
  const shakeSound = useRef<Howl | null>(null);
  const envSoundRef = useRef<Howl | null>(null);
  
  // Drawing Engine Refs
  const lastPosRef = useRef<{ x: number, y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const historyRef = useRef<ImageData[]>([]);
  const brushStampRef = useRef<HTMLCanvasElement | null>(null);
  const poolingAnimationFrameRef = useRef<number | null>(null);

  // Active User State
  const [sessionId, setSessionId] = useState<string>('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(GRAFFITI_COLORS[2].hex);
  const [activeCap, setActiveCap] = useState<CapType>('STANDARD');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [activeTexture, setActiveTexture] = useState<string>(TEXTURES[0].url);
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);

  // Cloud/Network State
  const [isCapturing, setIsCapturing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [wipSaveStatus, setWipSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [wipLoadStatus, setWipLoadStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR' | 'NOT_FOUND'>('IDLE');

  // ==========================================
  // 3. INITIALIZATION & BROWSER STORAGE
  // ==========================================
  
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

  const saveDraftToBrowser = async (currentLayout: LayoutMode, currentTexture: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const paintData = canvas.toDataURL('image/png');
      const existingDrafts = (await localforage.getItem<Record<string, any>>('portfolio_drafts')) || {};
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

  useEffect(() => {
    const loadDraft = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];

      try {
        const drafts = await localforage.getItem<Record<string, any>>('portfolio_drafts');
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

  // ==========================================
  // 4. BRUSH ENGINE & AUDIO MOUNTING
  // ==========================================
  
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

  useEffect(() => {
    spraySound.current = new Howl({
      src: ['/audio/spray_sprite.mp3'], 
      sprite: { start: [100, 300], loop: [300, 900, true], end: [1200, 1500] },
      volume: 0.6,
    });
    
    shakeSound.current = new Howl({ src: ['/audio/shake.mp3'], volume: 0.8 });

    envSoundRef.current = new Howl({
      src: ['/audio/city_street_loop.mp3'], 
      loop: true,
      volume: 0, 
    });

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // PERFORMANCE: Debounce heavy canvas resizing to prevent stutter during layout shifts
    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        if (tempCtx) tempCtx.drawImage(canvas, 0, 0);

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(tempCanvas, 0, 0);
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      spraySound.current?.unload();
      shakeSound.current?.unload();
      
      const envAudio = envSoundRef.current;
      if (envAudio) {
        const currentVol = typeof envAudio.volume() === 'number' ? envAudio.volume() as number : 0;
        envAudio.fade(currentVol, 0, 500);
        setTimeout(() => envAudio.unload(), 500);
      }
      if (poolingAnimationFrameRef.current) cancelAnimationFrame(poolingAnimationFrameRef.current);
    };
  }, []);

  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = typeof envSoundRef.current.volume() === 'number' ? envSoundRef.current.volume() as number : 0;
    
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.4, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

  // ==========================================
  // 5. CORE DRAWING LOGIC
  // ==========================================
  
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

  // ==========================================
  // 6. CLOUD OPERATIONS (SAVE / LOAD)
  // ==========================================
  
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
      const allDrafts = await localforage.getItem<Record<string, any>>('portfolio_drafts');
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

      setWipSaveStatus('SUCCESS');
      setTimeout(() => setWipSaveStatus('IDLE'), 4000);
    } catch (err: any) {
      console.error('Cloud Save Error:', err);
      setWipSaveStatus('ERROR');
      setTimeout(() => setWipSaveStatus('IDLE'), 4000);
    }
  };

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

  // ==========================================
  // 7. UI RENDER
  // ==========================================
  
  // Smart Positioning
  let uiPositionClass = 'bottom-2 sm:bottom-8';
  let uiPlacementClass = 'left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-8';
  let uiWidthClass = 'w-[96vw] sm:w-auto sm:max-w-[90vw]';

  if (layoutMode === 'SPLIT_HORIZ') {
    uiPositionClass = 'top-2 sm:top-8'; 
    uiPlacementClass = 'left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-8';
  } else if (layoutMode === 'SPLIT_VERT') {
    uiPositionClass = 'bottom-2 sm:bottom-8';
    uiPlacementClass = 'left-2 sm:left-8';
    uiWidthClass = 'w-[48vw] sm:w-auto sm:max-w-[45vw]';
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen bg-black overflow-hidden touch-none overscroll-none">
      
      {/* Background Layers */}
      <div className={`absolute top-0 left-0 transition-all duration-500 ease-in-out ${
          layoutMode === 'FULL' ? 'w-full h-full' : 
          layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
        }`}
      >
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/first_website.jpg')",
          backgroundSize: 'contain', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat'
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

      {/* Main Drawing Canvas (WCAG Tagged as Interactive Image) */}
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive graffiti canvas"
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

      {/* WCAG: Toolbar Role with strictly forced 4-row architecture for mobile layout */}
      {!isCapturing && (
        <div 
          role="toolbar" 
          aria-label="Graffiti Tools"
          style={{ willChange: 'transform, opacity' }}
          className={`absolute z-20 transition-all duration-500 ease-in-out ${uiPositionClass} ${uiPlacementClass} ${uiWidthClass} bg-black/80 h-60 p-2 sm:p-2 sm:py-3 border border-zinc-700 rounded-xl sm:rounded text-white flex flex-col gap-1.5 sm:gap-5 shadow-xl backdrop-blur-sm`}
        >
          
          {/* ROW 1: Colors & Caps */}
          <div className="flex items-center justify-between sm:justify-start w-full gap-2 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <span id="can-color-label" className="hidden sm:inline text-sm text-zinc-400">Can:</span>
              <div className="flex gap-1 sm:gap-2 items-center" aria-labelledby="can-color-label">
                {GRAFFITI_COLORS.map((c) => (
                  <button key={c.hex} onClick={() => { setColor(c.hex); playShakeSound(); }} aria-label={`Select color ${c.name}`} aria-pressed={color === c.hex} className={`w-5 h-5 sm:w-8 sm:h-8 rounded-full border-2 transition-transform focus:outline-none ${ color === c.hex ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent' }`} style={{ backgroundColor: c.hex }} title={c.name} />
                ))}
                <div className="relative w-5 h-5 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-transparent hover:border-white transition-colors cursor-pointer shadow-inner ml-1">
                  <div className="absolute inset-0 bg-gradient-to-tr from-red-500 via-green-500 to-blue-500 pointer-events-none"></div>
                  <input type="color" value={color} onChange={(e) => setColor(e.target.value)} onPointerDown={playShakeSound} className="absolute -inset-2 w-10 h-10 sm:w-12 sm:h-12 opacity-0 cursor-pointer" title="Custom Color" aria-label="Custom Color Picker" />
                </div>
              </div>
            </div></div>
            <div className="flex items-center justify-between sm:justify-start w-full gap-2 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2">
              <span id="cap-size-label" className="hidden sm:inline text-sm text-zinc-400">Caps:</span>
              <div aria-labelledby="cap-size-label" className="flex gap-1 sm:gap-2">
                {(Object.keys(CAP_PROFILES) as CapType[]).map((cap) => (
                  <button key={cap} onClick={() => setActiveCap(cap)} aria-pressed={activeCap === cap} className={`px-1.5 py-1 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-bold rounded border transition-colors focus:outline-none ${ activeCap === cap ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 hover:border-zinc-400' }`} title={CAP_PROFILES[cap].name}>{cap}</button>
                ))}
              </div>
            </div></div>
          

          <div className="h-px w-full bg-zinc-700/50 my-0.5 sm:hidden" aria-hidden="true"></div>

          {/* ROW 2: Playground & Surface Layouts */}
          <div className="flex items-center justify-between sm:justify-start w-full gap-2 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1">
              <span id="layout-mode-label" className="text-[9px] sm:text-xs text-zinc-400 uppercase tracking-widest mr-1">Layout:</span>
              <div aria-labelledby="layout-mode-label" className="flex gap-1 sm:gap-1">
                {(['FULL', 'SPLIT_VERT', 'SPLIT_HORIZ'] as LayoutMode[]).map((mode) => (
                  <button key={mode} onClick={() => { if (mode === 'FULL') setActiveTexture(TEXTURES[0].url); setLayoutMode(mode); if (onLayoutChange) onLayoutChange(mode); }} aria-pressed={layoutMode === mode} className={`px-1.5 py-1 sm:px-3 sm:py-1 text-[9px] sm:text-xs font-bold rounded border transition-colors focus:outline-none ${ layoutMode === mode ? 'bg-red-600 border-red-500' : 'border-zinc-600 hover:border-zinc-400' }`}>{mode.replace('_', ' ')}</button>
                ))}
              </div>
            </div>
            {layoutMode !== 'FULL' && (
              <div className="flex items-center gap-1 sm:gap-1">
                <span id="surface-texture-label" className="text-[9px] sm:text-xs text-zinc-400 uppercase tracking-widest mr-1">Surface:</span>
                <div aria-labelledby="surface-texture-label" className="flex gap-1 sm:gap-1">
                  {TEXTURES.map((tex) => (
                    <button key={tex.id} onClick={() => { setActiveTexture(tex.url); saveDraftToBrowser(layoutMode, tex.url); }} aria-pressed={activeTexture === tex.url} className={`w-4 h-4 sm:w-6 sm:h-6 border-2 rounded transition-colors focus:outline-none ${ activeTexture === tex.url ? 'border-white' : 'border-transparent hover:border-white/50' } ${tex.id === 'black' ? 'bg-black' : tex.id === 'brick' ? 'bg-red-900' : 'bg-zinc-600'}`} title={`${tex.label} Wall`} />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-px w-full bg-zinc-700/50 my-0.5 sm:hidden" aria-hidden="true"></div>

          {/* ROW 3 & 4 (Mobile): Actions & Cloud Saves */}
          {/* Using flex-wrap allows this to be two separate rows (Lines 3 and 4) on mobile and merged into 1 row on Desktop */}
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between sm:justify-start w-full gap-y-1.5 sm:gap-3">
            
            {/* ROW 3: Basic Canvas Actions */}
            <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <button onClick={undo} disabled={historyRef.current.length <= 1} aria-label="Undo stroke" className="text-[9px] sm:text-sm font-bold uppercase tracking-wider hover:text-red-400 disabled:opacity-50 focus:outline-none">Undo</button>
                <button onClick={clearWall} aria-label="Clear canvas" className="text-[9px] sm:text-sm font-bold uppercase tracking-wider hover:text-red-400 focus:outline-none">Clear</button>
                <div className="flex items-center gap-1 sm:gap-2 ml-1">
                  <button onClick={() => setIsEnvAudioMuted(!isEnvAudioMuted)} aria-pressed={!isEnvAudioMuted} className={`p-1 sm:p-2 rounded border transition-colors flex items-center justify-center focus:outline-none ${ !isEnvAudioMuted ? 'bg-zinc-200 text-black border-white' : 'border-zinc-600 text-zinc-400' }`} title={isEnvAudioMuted ? "Unmute Environment" : "Mute Environment"}>
                    {isEnvAudioMuted ? <VolumeX size={12} aria-hidden="true" className="sm:w-4 sm:h-4" /> : <Volume2 size={12} aria-hidden="true" className="sm:w-4 sm:h-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Divider specifically to force ROW 4 down on mobile */}
            <div className="h-px w-full bg-zinc-700/50 block sm:hidden my-0.5" aria-hidden="true"></div>
            
            {/* ROW 4: Cloud Engine Actions */}
            <div className="flex justify-between sm:justify-start gap-1.5 sm:gap-4 items-center w-full sm:w-auto">
              {/* Added flex-1 to auto-fill the narrow box evenly on mobile without stretching randomly */}
              <button onClick={handleSaveForLater} disabled={wipSaveStatus === 'SAVING' || wipLoadStatus === 'LOADING'} aria-label="Save work in progress" className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:bg-zinc-900 px-1.5 py-1 sm:px-3 sm:py-1 rounded font-bold uppercase tracking-widest text-[9px] sm:text-xs focus:outline-none text-center transition-colors">
                {wipSaveStatus === 'SAVING' ? 'SAVING...' : wipSaveStatus === 'SUCCESS' ? 'SAVED ✓' : wipSaveStatus === 'ERROR' ? 'FAIL ✕' : 'SAVE'}
              </button>
              <button onClick={handleLoadFromCloud} disabled={wipLoadStatus === 'LOADING' || wipSaveStatus === 'SAVING'} aria-label="Load work in progress" className="flex-1 sm:flex-none bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 disabled:bg-zinc-900 px-1.5 py-1 sm:px-3 sm:py-1 rounded font-bold uppercase tracking-widest text-[9px] sm:text-xs focus:outline-none text-center transition-colors">
                {wipLoadStatus === 'LOADING' ? 'LOADING...' : wipLoadStatus === 'SUCCESS' ? 'RESTORED ✓' : wipLoadStatus === 'NOT_FOUND' ? 'NO DRAFT' : wipLoadStatus === 'ERROR' ? 'FAIL ✕' : 'LOAD'}
              </button>
              <button onClick={handleCloudSave} disabled={saveStatus === 'SAVING'} aria-label="Publish to public gallery" className="flex-1 sm:flex-none bg-red-600 hover:bg-red-500 disabled:bg-red-800 px-2 py-1 sm:px-4 sm:py-1 rounded font-bold uppercase tracking-widest text-[9px] sm:text-xs focus:outline-none text-center transition-colors">
                {saveStatus === 'SAVING' ? 'PUB...' : saveStatus === 'SUCCESS' ? 'PUB ✓' : saveStatus === 'ERROR' ? 'FAIL ✕' : 'PUBLISH'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Capture Watermark overlay */}
      {isCapturing && (
        <div aria-hidden="true" className="absolute bottom-6 right-8 z-20 text-white/50 font-mono text-[10px] sm:text-sm tracking-widest bg-black/50 px-2 py-1">
          MASTERPIECE PORTFOLIO // EFANDERSON
        </div>
      )}
      
      {/* Mobile Orientation Lock Overlay */}
      <div className="rotate-warning hidden" aria-live="polite">
        <div className="text-center p-6">
          <h2 className="text-xl font-bold uppercase tracking-widest text-red-500">Rotate Device</h2>
          <p className="text-sm text-zinc-400 mt-2">Please rotate to Landscape to paint.</p>
        </div>
      </div>
      
    </div>
  );
}