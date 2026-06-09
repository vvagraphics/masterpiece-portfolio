// src/components/SandboxWrapper.tsx
import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import gsap from 'gsap';
import { Howl } from 'howler';
import { ChevronLeft, ChevronRight, X, ExternalLink, Volume2, VolumeX } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion'; 

import Holograms from '../sandboxes/Holograms'; 
import Gacha from '../sandboxes/Gacha';
import GraffitiCanvas from '../sandboxes/GraffitiCanvas';
import GlassWalls from '../sandboxes/GlassWalls';
import InspirationGallery from './InspirationGallery'; 
import TornadoTransition from './TornadoTransition'; 
import InkWell from '../sandboxes/InkWell';

type ActiveView = 'MUSEUM' | 'GRAFFITI' | 'GLASS_WALLS' | 'HOLOGRAM' | 'GACHA' | 'INK_WELL' | 'GALLERY';
const SANDBOX_ORDER: ActiveView[] = ['GRAFFITI', 'GLASS_WALLS', 'HOLOGRAM', 'GACHA', 'INK_WELL', 'GALLERY'];

// Moved to top level so it can be used for both Physics Bodies AND Keyboard Accessibility Menu
const PROJECTS = [
  { color: '#ef4444', label: 'VVA Graffiti', type: 'GRAFFITI' as ActiveView, shape: 'capsule', w: 70, h: 120, texture: '/spray_can.svg' },
  { color: '#14b8a6', label: 'Glass Structure', type: 'GLASS_WALLS' as ActiveView, shape: 'rectangle', w: 70, h: 133, texture: '/glass_pane.svg' }, 
  { color: '#3b82f6', label: 'Holograms', type: 'HOLOGRAM' as ActiveView, shape: 'rectangle', w: 100, h: 133, texture: '/hologram.svg' }, 
  { color: '#4f46e5', label: 'Ink Fluid', type: 'INK_WELL' as ActiveView, shape: 'circle', w: 110, h: 110, texture: '/inkwell.svg' },
  { color: '#a855f7', label: 'Gacha System', type: 'GACHA' as ActiveView, shape: 'square', w: 100, h: 100, texture: '/gacha.svg' },
  { color: '#f59e0b', label: 'Community Archives', type: 'GALLERY' as ActiveView, shape: 'square', w: 150, h: 150, texture: '/archives.svg' }
];

type SandboxWrapperProps = {
  isAudioEnabled?: boolean;
  toggleAudio?: () => void;
  ambientAudioRef?: React.MutableRefObject<Howl | null>;
};

export default function SandboxWrapper({ 
  isAudioEnabled = false, 
  toggleAudio, 
  ambientAudioRef 
}: SandboxWrapperProps) {
  
  // ==========================================
  // 1. REFS & STATE
  // ==========================================
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  const thudSoundRef = useRef<Howl | null>(null);
  const spraySoundRef = useRef<Howl | null>(null);
  const glassSoundRef = useRef<Howl | null>(null);
  const hologramSoundRef = useRef<Howl | null>(null);
  const gachaSoundRef = useRef<Howl | null>(null);
  
  const isAudioEnabledRef = useRef(isAudioEnabled);
  const [isSfxEnabled, setIsSfxEnabled] = useState(true);
  const isSfxEnabledRef = useRef(isSfxEnabled);

  useEffect(() => { isAudioEnabledRef.current = isAudioEnabled; }, [isAudioEnabled]);
  useEffect(() => { isSfxEnabledRef.current = isSfxEnabled; }, [isSfxEnabled]);
  
  const [activeView, setActiveView] = useState<ActiveView>('MUSEUM');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextView, setNextView] = useState<ActiveView | null>(null);
  const [graffitiLayout, setGraffitiLayout] = useState<'FULL' | 'SPLIT_VERT' | 'SPLIT_HORIZ'>('FULL');

  const [hoveredProject, setHoveredProject] = useState<{
    label: string; color: string; x: number; y: number;
  } | null>(null);

  // ==========================================
  // 2. AUDIO MANAGEMENT
  // ==========================================
  useEffect(() => {
    if (!ambientAudioRef?.current) return;
    const currentVol = typeof ambientAudioRef.current.volume() === 'number' ? ambientAudioRef.current.volume() as number : 0.3;

    if (activeView !== 'MUSEUM' || isTransitioning) {
      if (currentVol > 0) ambientAudioRef.current.fade(currentVol, 0, 1500);
    } else if (activeView === 'MUSEUM' && !isTransitioning) {
      if (isAudioEnabled && currentVol < 0.3) ambientAudioRef.current.fade(currentVol, 0.3, 1500);
    }
  }, [activeView, isTransitioning, isAudioEnabled, ambientAudioRef]);

  useEffect(() => {
    thudSoundRef.current = new Howl({ src: ['/audio/thud.mp3'], preload: true });
    spraySoundRef.current = new Howl({ src: ['/audio/spray_sprite.mp3'], preload: true });
    glassSoundRef.current = new Howl({ src: ['/audio/glass_clink.mp3'], preload: true }); 
    hologramSoundRef.current = new Howl({ src: ['/audio/hologram_chime.mp3'], preload: true });
    gachaSoundRef.current = new Howl({ src: ['/audio/gacha_roll.mp3'], preload: true });

    return () => { 
      thudSoundRef.current?.unload(); 
      spraySoundRef.current?.unload();
      glassSoundRef.current?.unload();
      hologramSoundRef.current?.unload();
      gachaSoundRef.current?.unload();
    }
  }, []);

  // ==========================================
  // 3. NAVIGATION LOGIC
  // ==========================================
  const handleNavigation = (targetView: ActiveView) => {
    setNextView(targetView);
    setIsTransitioning(true);
    setHoveredProject(null); 

    if (isSfxEnabledRef.current) {
      if (targetView === 'GRAFFITI') spraySoundRef.current?.play();
      else if (targetView === 'GLASS_WALLS') glassSoundRef.current?.play();
      else if (targetView === 'HOLOGRAM') hologramSoundRef.current?.play();
      else if (targetView === 'GACHA') gachaSoundRef.current?.play();
    }
  };

  const handleNext = () => { if (!isTransitioning && SANDBOX_ORDER.indexOf(activeView) < SANDBOX_ORDER.length - 1) handleNavigation(SANDBOX_ORDER[SANDBOX_ORDER.indexOf(activeView) + 1]); };
  const handlePrev = () => { if (!isTransitioning && SANDBOX_ORDER.indexOf(activeView) > 0) handleNavigation(SANDBOX_ORDER[SANDBOX_ORDER.indexOf(activeView) - 1]); };
  const handleReturnToMuseum = () => { if (!isTransitioning) handleNavigation('MUSEUM'); };

  const handleTransitionComplete = () => {
    if (nextView) {
      setActiveView(nextView);
      setNextView(null);
      setIsTransitioning(false);
    }
  };

  // ==========================================
  // 4. MATTER.JS PHYSICS ENGINE
  // ==========================================
  useEffect(() => {
    if (!sceneRef.current) return;

    const { Engine, Render, Runner, MouseConstraint, Mouse, World, Bodies, Events, Query } = Matter;

    const engine = Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 0.3;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: { 
        width, 
        height, 
        wireframes: false, 
        background: '#050505', 
        pixelRatio: 1 
      }
    });

    const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
    const ground = Bodies.rectangle(width / 2, height + 100, width * 2, 200, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -4000, width * 2, 200, wallOptions);
    const leftWall = Bodies.rectangle(-100, height / 2, 200, height * 3, wallOptions);
    const rightWall = Bodies.rectangle(width + 100, height / 2, 200, height * 3, wallOptions);

    World.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    const projectBodies = PROJECTS.map((proj, i) => {
      const yPos = -200 - (i * 250);
      const xPos = (width / 2) + (Math.random() * 200 - 100); 
      
      const commonOptions = {
        restitution: 0.6,
        frictionAir: 0.03, 
        render: { 
          fillStyle: proj.color, 
          strokeStyle: '#ffffff', 
          lineWidth: 2,
          sprite: { texture: proj.texture, xScale: 1, yScale: 1 }
        },
        plugin: { isProject: true, viewType: proj.type, label: proj.label, originalColor: proj.color } 
      };

      if (proj.shape === 'capsule') {
        return Bodies.rectangle(xPos, yPos, proj.w!, proj.h!, { ...commonOptions, chamfer: { radius: proj.w! / 2 } });
      } else {
        return Bodies.rectangle(xPos, yPos, proj.w!, proj.h!, { ...commonOptions, chamfer: { radius: 20 } });
      }
    });

    World.add(engine.world, projectBodies);

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: { stiffness: 0.2, render: { visible: false } }
    });
    World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    Events.on(engine, 'afterUpdate', () => {
      projectBodies.forEach(body => {
        if (body.position.y > height + 500 || body.position.x < -500 || body.position.x > width + 500) {
           Matter.Body.setPosition(body, { x: width / 2, y: -200 });
           Matter.Body.setVelocity(body, { x: 0, y: 0 }); 
        }
      });
    });

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const impactVelocity = pair.bodyA.speed + pair.bodyB.speed;
        if (impactVelocity > 1.5 && thudSoundRef.current && isSfxEnabledRef.current) {
          const volume = Math.min(1, impactVelocity / 20);
          const rate = 0.8 + Math.random() * 0.4; 
          const soundId = thudSoundRef.current.play();
          thudSoundRef.current.volume(volume, soundId);
          thudSoundRef.current.rate(rate, soundId);
        }
      });
    });

    let currentHoverTarget: Matter.Body | null = null;

    Events.on(mouseConstraint, 'mousemove', (event) => {
      projectBodies.forEach(body => {
        if (body.plugin && body.plugin.originalColor) {
           body.render.strokeStyle = '#ffffff';
           body.render.lineWidth = 0; 
        }
      });

      const hoveredBodies = Query.point(engine.world.bodies, event.mouse.position);
      const target = hoveredBodies.find(b => b.plugin && b.plugin.isProject);

      if (target) {
        if (render.canvas) render.canvas.style.cursor = 'pointer';
        
        target.render.strokeStyle = target.plugin.originalColor;
        target.render.lineWidth = 4; 
        
        if (currentHoverTarget !== target) {
          currentHoverTarget = target;
          setHoveredProject({ label: target.plugin.label, color: target.plugin.originalColor, x: target.position.x, y: target.position.y });
        } else {
          setHoveredProject(prev => prev ? { ...prev, x: target.position.x, y: target.position.y } : null);
        }

      } else {
        if (render.canvas) render.canvas.style.cursor = 'grab';
        if (currentHoverTarget !== null) {
          currentHoverTarget = null;
          setHoveredProject(null);
        }
      }
    });

    let mousedownPos = { x: 0, y: 0 };
    let mousedownTime = 0;

    Events.on(mouseConstraint, 'mousedown', (event) => {
      mousedownPos = { x: event.mouse.position.x, y: event.mouse.position.y };
      mousedownTime = Date.now();
    });

    Events.on(mouseConstraint, 'mouseup', (event) => {
      const dx = event.mouse.position.x - mousedownPos.x;
      const dy = event.mouse.position.y - mousedownPos.y;
      const timeElapsed = Date.now() - mousedownTime;
      
      if (timeElapsed < 400 && (dx * dx + dy * dy < 500)) {
        const clickedBodies = Query.point(engine.world.bodies, event.mouse.position);
        const target = clickedBodies.find(b => b.plugin && b.plugin.isProject);
        
        if (target && target.plugin && target.plugin.viewType) {
          handleNavigation(target.plugin.viewType as ActiveView);
        }
      }
    });

    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;

    gsap.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" });

    // Performance Update: Debounced Resize
    let resizeTimer: number;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 100 });
        Matter.Body.setPosition(rightWall, { x: window.innerWidth + 100, y: window.innerHeight / 2 });
      }, 150);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      Render.stop(render);
      Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, []); 

  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return;
    if (activeView === 'MUSEUM' && !isTransitioning) Matter.Runner.run(runnerRef.current, engineRef.current);
    else Matter.Runner.stop(runnerRef.current);
  }, [activeView, isTransitioning]);

  const currentIndex = SANDBOX_ORDER.indexOf(activeView);
  const showPrev = currentIndex > 0;
  const showNext = currentIndex !== -1 && currentIndex < SANDBOX_ORDER.length - 1;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      
      {/* KEYBOARD ACCESSIBILITY OVERLAY FOR MUSEUM (Only visible when tabbing) */}
      {activeView === 'MUSEUM' && !isTransitioning && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-[90%] max-w-sm">
          {PROJECTS.map((proj) => (
            <button
              key={proj.type}
              onClick={() => handleNavigation(proj.type)}
              aria-label={`Enter ${proj.label} interactive project`}
              className="opacity-0 focus:opacity-100 pointer-events-auto bg-black/95 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-white border-2 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-black scale-95 focus:scale-100 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-center"
              style={{ 
  borderColor: proj.color, 
  color: proj.color, 
  '--tw-ring-color': proj.color 
} as React.CSSProperties}
            >
              Enter: {proj.label}
            </button>
          ))}
        </div>
      )}

      {/* ARROW NAVIGATION */}
      {activeView !== 'MUSEUM' && !isTransitioning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none z-40">
          <div className="absolute inset-y-0 left-0 flex items-center">
            {showPrev && (
              <button 
                onClick={handlePrev} 
                aria-label="Previous Project"
                className="pointer-events-auto ml-6 p-4 rounded-full bg-[#111] hover:bg-white hover:text-black border border-white/20 transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-4 focus:ring-offset-[#050505]"
              >
                <ChevronLeft size={28} />
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
             {showNext && (
               <button 
                onClick={handleNext} 
                aria-label="Next Project"
                className="pointer-events-auto mr-6 p-4 rounded-full bg-[#111] hover:bg-white hover:text-black border border-white/20 transition-all duration-300 text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-4 focus:ring-offset-[#050505]"
               >
                 <ChevronRight size={28} />
               </button>
             )}
          </div>
        </motion.div>
      )}

      {/* TOP CONTROLS */}
      <div className={`absolute z-50 flex items-center gap-4 pointer-events-auto transition-all duration-700 ease-in-out ${
        activeView === 'GRAFFITI' && graffitiLayout === 'SPLIT_VERT' ? 'top-8 left-8' : 'top-8 right-8' 
      }`}>
        {activeView !== 'MUSEUM' && !isTransitioning && (
          <motion.button 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onClick={handleReturnToMuseum}
            aria-label="Return to Museum"
            className="flex items-center gap-2 px-6 h-12 bg-[#111] text-white text-sm font-bold tracking-widest uppercase border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-4 focus:ring-offset-[#050505]"
          >
            <X size={16} aria-hidden="true" /> Back
          </motion.button>
        )}
        <button 
          onClick={toggleAudio}
          aria-label={isAudioEnabled ? "Mute Ambient Audio" : "Enable Ambient Audio"}
          aria-pressed={isAudioEnabled}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 hover:scale-110 bg-[#111] shadow-[0_0_15px_rgba(255,255,255,0.05)] focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-4 focus:ring-offset-[#050505]"
          style={{ borderColor: isAudioEnabled ? '#ef4444' : '#52525b', color: isAudioEnabled ? '#ef4444' : '#52525b', backgroundColor: isAudioEnabled ? 'rgba(239, 68, 68, 0.1)' : '#111' }}
        >
          {isAudioEnabled ? <Volume2 size={24} aria-hidden="true" /> : <VolumeX size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* TRANSITIONS */}
      <AnimatePresence>
        {isTransitioning && nextView && (
          <TornadoTransition fromView={activeView} toView={nextView} onComplete={handleTransitionComplete} />
        )}
      </AnimatePresence>

      {/* ACTIVE VIEW RENDERING */}
      {!isTransitioning && activeView !== 'MUSEUM' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="absolute inset-0 z-30" style={{ willChange: "opacity, transform" }}>
          {activeView === 'GRAFFITI' && <GraffitiCanvas isAudioEnabled={isAudioEnabled} onLayoutChange={setGraffitiLayout} />}
          {activeView === 'GLASS_WALLS' && <GlassWalls isAudioEnabled={isAudioEnabled} />}
          {activeView === 'HOLOGRAM' && <Holograms isAudioEnabled={isAudioEnabled} />}
          {activeView === 'INK_WELL' && <InkWell isAudioEnabled={isAudioEnabled} />}
          {activeView === 'GACHA' && <Gacha isAudioEnabled={isAudioEnabled} />}
          {activeView === 'GALLERY' && (
            <div className="w-full h-full bg-black pt-24 px-8 overflow-y-auto">
              <h1 className="text-white text-6xl font-black uppercase mb-8">The Archives</h1>
              <InspirationGallery />
            </div>
          )}
        </motion.div>
      )}

      {/* MUSEUM BACKGROUND / PHYSICS INSTANCE */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${activeView === 'MUSEUM' && !isTransitioning ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="absolute top-8 left-8 z-20 pointer-events-none mix-blend-difference">
          <h2 className="text-white text-4xl font-black uppercase tracking-tighter">The Museum</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-400 font-mono text-sm pointer-events-none">Grab. Drag. Throw. Click to Enter.</p>
            <button 
              onClick={() => setIsSfxEnabled(!isSfxEnabled)}
              aria-label={isSfxEnabled ? "Disable Physics Sound Effects" : "Enable Physics Sound Effects"}
              aria-pressed={isSfxEnabled}
              className="pointer-events-auto flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md border transition-all duration-300 border-zinc-600 text-zinc-400 hover:text-white hover:border-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#050505]"
            >
              SFX: {isSfxEnabled ? <span className="text-green-400 font-bold">ON</span> : <span className="text-red-400 font-bold">OFF</span>}
            </button>
          </div>

          {/* NEW PREVIOUS PORTFOLIO LINK */}
<div className="mt-5 pointer-events-auto">
  <a 
    href="http://mr3anderson.pro" 
    target="_blank" 
    rel="noopener noreferrer"
    className="group relative inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono font-bold text-xs uppercase tracking-widest overflow-hidden transition-all duration-500 border border-emerald-500/30 bg-black/60 backdrop-blur-md text-emerald-400 animate-[pulse_3s_infinite] shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:scale-105 hover:bg-emerald-500 hover:text-black hover:animate-none hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
  >
    {/* Shimmer Effect */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"></div>

    {/* Text Layer */}
    <span className="relative z-10 flex items-center gap-2">
      View My Dev Projects
      <ExternalLink size={14} />
    </span>
  </a>
</div>

{/* 
  REQUIRED: Add this to your CSS file or global styles 
  so the shimmer animation is recognized by Tailwind.
*/}
<style>{`
  @keyframes shimmer {
    0% { transform: translateX(-150%); opacity: 0; }
    10% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateX(150%); opacity: 0; }
  }
`}</style>
        </div>

        

        {/* CUSTOM HOVER TOOLTIP */}
        {hoveredProject && (
          <div className="absolute z-30 pointer-events-none transition-all duration-150 ease-out" style={{ left: hoveredProject.x + 140, top: hoveredProject.y - 100 }}>
            <div className="bg-black/80 backdrop-blur-md border p-4 rounded-xl shadow-2xl min-w-[200px]" style={{ borderColor: `${hoveredProject.color}40` }}>
              <h3 className="font-bold uppercase tracking-widest text-sm" style={{ color: hoveredProject.color }}>{hoveredProject.label}</h3>
              <p className="text-xs text-zinc-400 mt-2 font-mono">Click to enter the time warp.</p>
            </div>
          </div>
        )}

        {/* PHYSICS CANVAS */}
        {/* aria-hidden hides the blank canvas rendering from screen readers since the keyboard menu now handles A11y routing */}
        <div ref={sceneRef} className="absolute inset-0" aria-hidden="true" />
      </div>
    </div>
  );
}