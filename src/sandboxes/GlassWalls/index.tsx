import { useState, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { supabase, dataUrlToBlob } from '../../lib/supabase';

export default function GlassWalls() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState('EFANDERSON');
  const [letterSpacing, setLetterSpacing] = useState(10);
  const [fontSize, setFontSize] = useState(120);
  const [isCapturing, setIsCapturing] = useState(false);

  const handleCloudSave = async () => {
    if (!containerRef.current) return;
    setIsCapturing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Wait for UI hide
      const dataUrl = await htmlToImage.toPng(containerRef.current, { quality: 0.95 });
      
      const blob = await dataUrlToBlob(dataUrl);
      const fileName = `artwork_${Date.now()}.png`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase
        .storage
        .from('gallery')
        .upload(`public/${fileName}`, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('gallery')
        .getPublicUrl(`public/${fileName}`);

      // Save to SQL Database
      const { error: dbError } = await supabase
        .from('creations')
        .insert([
          { 
            image_url: publicUrl, 
            sandbox_type: 'GLASS_WALLS',
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
    <div ref={containerRef} className="relative w-full h-full bg-zinc-950 overflow-hidden flex items-center justify-center">
      
      {/* Background Graphic to show off the blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>

      {/* The Typography Layer */}
      <div className="z-10 absolute w-full text-center px-8">
        <h1 
          className="font-serif font-black text-white whitespace-nowrap"
          style={{ 
            letterSpacing: `${letterSpacing}px`, 
            fontSize: `${fontSize}px`,
            textShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          {text}
        </h1>
      </div>

      {/* The Sliding Glass Panes */}
      <div className="absolute inset-0 z-20 flex">
        <div className="w-1/3 h-full bg-white/5 backdrop-blur-md border-r border-white/10 transform -translate-x-1/2 hover:translate-x-0 transition-transform duration-700 ease-out cursor-pointer"></div>
        <div className="w-1/3 h-full bg-white/5 backdrop-blur-xl border-x border-white/10 translate-y-10 hover:translate-y-0 transition-transform duration-700 ease-out cursor-pointer"></div>
        <div className="w-1/3 h-full bg-white/5 backdrop-blur-sm border-l border-white/10 transform translate-x-1/2 hover:translate-x-0 transition-transform duration-700 ease-out cursor-pointer"></div>
      </div>

      {/* UI Controls */}
      {!isCapturing && (
        <div className="absolute bottom-8 z-30 bg-black/80 p-6 border border-zinc-700 rounded-xl flex gap-8 items-center text-white backdrop-blur-md shadow-2xl">
          <label className="flex flex-col gap-2 font-mono text-xs text-gray-400">
            SIGNATURE TEXT
            <input 
              type="text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              className="bg-zinc-900 border border-zinc-700 px-3 py-2 text-white text-base rounded focus:border-blue-500 outline-none"
            />
          </label>
          
          <label className="flex flex-col gap-2 font-mono text-xs text-gray-400">
            FONT SIZE
            <input 
              type="range" min="40" max="200" value={fontSize} 
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
          </label>

          <label className="flex flex-col gap-2 font-mono text-xs text-gray-400">
            KERNING
            <input 
              type="range" min="-10" max="50" value={letterSpacing} 
              onChange={(e) => setLetterSpacing(Number(e.target.value))}
              className="w-24 accent-blue-500"
            />
          </label>
          <button onClick={handleCloudSave} className="ml-4 px-6 py-3 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">
            Save to Gallery
          </button>
        </div>
      )}

      {/* Watermark - Only visible during snapshot */}
      {isCapturing && (
        <div className="absolute top-6 left-6 z-30 text-white/50 font-mono text-sm tracking-widest bg-black/50 px-2 py-1">
          MASTERPIECE PORTFOLIO // EFANDERSON // GLASS WALLS
        </div>
      )}
    </div>
  );
}