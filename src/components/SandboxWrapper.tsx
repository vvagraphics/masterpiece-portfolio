// src/components/SandboxWrapper.tsx
import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import gsap from 'gsap';
import { Howl } from 'howler';
import { ChevronLeft, ChevronRight, X } from 'lucide-react'; 
import { motion, AnimatePresence } from 'framer-motion'; 

import GraffitiCanvas from '../sandboxes/GraffitiCanvas';
import GlassWalls from '../sandboxes/GlassWalls';
import InspirationGallery from './InspirationGallery';
import TornadoTransition from './TornadoTransition'; 

type ActiveView = 'MUSEUM' | 'GRAFFITI' | 'GLASS_WALLS' | 'GALLERY';
const SANDBOX_ORDER: ActiveView[] = ['GRAFFITI', 'GLASS_WALLS', 'GALLERY'];

export default function SandboxWrapper() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  
  const thudSoundRef = useRef<Howl | null>(null);
  
  // State Machine for Transitions
  const [activeView, setActiveView] = useState<ActiveView>('MUSEUM');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [nextView, setNextView] = useState<ActiveView | null>(null);

  // --- Navigation Handlers ---
  const handleNavigation = (targetView: ActiveView) => {
    setNextView(targetView);
    setIsTransitioning(true);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    const currentIndex = SANDBOX_ORDER.indexOf(activeView);
    if (currentIndex < SANDBOX_ORDER.length - 1) {
      handleNavigation(SANDBOX_ORDER[currentIndex + 1]);
    }
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    const currentIndex = SANDBOX_ORDER.indexOf(activeView);
    if (currentIndex > 0) {
      handleNavigation(SANDBOX_ORDER[currentIndex - 1]);
    }
  };

  const handleReturnToMuseum = () => {
    if (isTransitioning) return;
    handleNavigation('MUSEUM');
  };

  const handleTransitionComplete = () => {
    if (nextView) {
      setActiveView(nextView);
      setNextView(null);
      setIsTransitioning(false);
    }
  };

  // --- Audio Setup ---
  useEffect(() => {
    thudSoundRef.current = new Howl({
      src: ['/audio/thud.mp3'],
      preload: true
    });

    return () => {
      thudSoundRef.current?.unload();
    }
  }, []);

  // --- Matter.js Museum Setup ---
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
        pixelRatio: window.devicePixelRatio || 1 
      }
    });

    const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
    const ground = Bodies.rectangle(width / 2, height + 100, width * 2, 200, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -1000, width * 2, 200, wallOptions);
    const leftWall = Bodies.rectangle(-100, height / 2, 200, height * 3, wallOptions);
    const rightWall = Bodies.rectangle(width + 100, height / 2, 200, height * 3, wallOptions);

    World.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    const projects = [
      { color: '#ef4444', label: 'VVA Graffiti', type: 'GRAFFITI' },
      { color: '#14b8a6', label: 'Glass Structure', type: 'GLASS_WALLS' },
      { color: '#a855f7', label: 'Community Archives', type: 'GALLERY' },
      { color: '#3b82f6', label: 'MySpace Layouts', type: null }, 
      { color: '#f59e0b', label: 'Brand Identity', type: null }   
    ];

    const projectBodies = projects.map((proj, i) => {
      const spacing = width / projects.length; 
      const xPos = (spacing / 2) + (i * spacing);
      
      return Bodies.rectangle(
        xPos, 
        -100 - (Math.random() * 400), 
        250, 
        350, 
        {
          chamfer: { radius: 20 },
          restitution: 0.6,
          frictionAir: 0.03, 
          render: {
            fillStyle: proj.color,
            strokeStyle: '#ffffff',
            lineWidth: 2
          },
          plugin: { 
            viewType: proj.type, 
            label: proj.label,
            originalColor: proj.color 
          } 
        }
      );
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
        const speedA = pair.bodyA.speed;
        const speedB = pair.bodyB.speed;
        const impactVelocity = speedA + speedB;

        if (impactVelocity > 1.5 && thudSoundRef.current) {
          const volume = Math.min(1, impactVelocity / 20);
          const rate = 0.8 + Math.random() * 0.4; 
          
          const soundId = thudSoundRef.current.play();
          thudSoundRef.current.volume(volume, soundId);
          thudSoundRef.current.rate(rate, soundId);
        }
      });
    });

    Events.on(mouseConstraint, 'mousemove', (event) => {
      projectBodies.forEach(body => {
        if (body.plugin && body.plugin.originalColor) {
           body.render.fillStyle = body.plugin.originalColor;
           body.render.strokeStyle = '#ffffff';
           body.render.lineWidth = 2;
        }
      });

      const hoveredBodies = Query.point(engine.world.bodies, event.mouse.position);
      const target = hoveredBodies.find(b => b.plugin && b.plugin.viewType);

      if (target) {
        if (render.canvas) render.canvas.style.cursor = 'pointer';
        target.render.fillStyle = '#ffffff';
        target.render.strokeStyle = target.plugin.originalColor;
        target.render.lineWidth = 8;
      } else {
        if (render.canvas) render.canvas.style.cursor = 'grab';
      }
    });

    Events.on(render, 'afterRender', () => {
      const ctx = render.context;
      ctx.font = '900 28px "Inter", sans-serif'; 
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      projectBodies.forEach(body => {
        if (body.plugin && body.plugin.viewType) {
          ctx.save();
          ctx.translate(body.position.x, body.position.y);
          ctx.rotate(body.angle);
          
          const isHovered = body.render.fillStyle === '#ffffff';
          ctx.fillStyle = isHovered ? body.plugin.originalColor : 'rgba(255, 255, 255, 0.9)'; 
          ctx.fillText('ENTER', 0, 0); 
          ctx.restore();
        }
      });
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
        const target = clickedBodies.find(b => b.plugin && b.plugin.viewType);
        
        if (target && target.plugin) {
          handleNavigation(target.plugin.viewType as ActiveView);
        }
      }
    });

    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;

    gsap.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.out" });

    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 100 });
      Matter.Body.setPosition(rightWall, { x: window.innerWidth + 100, y: window.innerHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Engine.clear(engine);
      if (render.canvas) render.canvas.remove();
    };
  }, []);

  // Pause Matter.js when not in museum to save CPU
  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return;
    if (activeView === 'MUSEUM' && !isTransitioning) {
      Matter.Runner.run(runnerRef.current, engineRef.current);
    } else {
      Matter.Runner.stop(runnerRef.current);
    }
  }, [activeView, isTransitioning]);

  const currentIndex = SANDBOX_ORDER.indexOf(activeView);
  const showPrev = currentIndex > 0;
  const showNext = currentIndex !== -1 && currentIndex < SANDBOX_ORDER.length - 1;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      
      {/* 1. Global Navigation Overlay */}
      {activeView !== 'MUSEUM' && !isTransitioning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 pointer-events-none z-50">
          <div className="absolute top-6 right-6 flex gap-4 pointer-events-auto">
            <button 
              onClick={handleReturnToMuseum}
              className="flex items-center gap-2 px-6 py-2 bg-[#111] text-white text-sm font-bold tracking-widest uppercase border border-white/20 rounded-full hover:bg-white hover:text-black transition-colors duration-300"
            >
              <X size={16} /> Return to Museum
            </button>
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center">
            {showPrev && (
              <button 
                onClick={handlePrev} 
                className="pointer-events-auto ml-6 p-4 rounded-full bg-[#111] hover:bg-white hover:text-black border border-white/20 transition-all duration-300 text-white"
              >
                <ChevronLeft size={28} />
              </button>
            )}
          </div>
          <div className="absolute inset-y-0 right-0 flex items-center">
             {showNext && (
               <button 
                onClick={handleNext} 
                className="pointer-events-auto mr-6 p-4 rounded-full bg-[#111] hover:bg-white hover:text-black border border-white/20 transition-all duration-300 text-white"
               >
                 <ChevronRight size={28} />
               </button>
             )}
          </div>
        </motion.div>
      )}

      {/* 2. The Interstitial Loading Screen (Tornado) */}
      <AnimatePresence>
        {isTransitioning && nextView && (
          <TornadoTransition 
            fromView={activeView} 
            toView={nextView} 
            onComplete={handleTransitionComplete} 
          />
        )}
      </AnimatePresence>

      {/* 3. The Active Sandbox */}
      {!isTransitioning && activeView !== 'MUSEUM' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 z-40"
        >
          {activeView === 'GRAFFITI' && <GraffitiCanvas />}
          {activeView === 'GLASS_WALLS' && <GlassWalls />}
          {activeView === 'GALLERY' && (
            <div className="w-full h-full bg-black pt-24 px-8 overflow-y-auto">
              <h1 className="text-white text-6xl font-black uppercase mb-8">The Archives</h1>
              <InspirationGallery />
            </div>
          )}
        </motion.div>
      )}

      {/* 4. The Matter.js Museum Canvas */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${activeView === 'MUSEUM' && !isTransitioning ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
        <div className="absolute top-8 left-8 z-20 pointer-events-none mix-blend-difference">
          <h2 className="text-white text-4xl font-black uppercase tracking-tighter">The Sandbox</h2>
          <p className="text-gray-400 font-mono text-sm mt-2">Grab. Drag. Throw. Click to Enter.</p>
        </div>
        <div ref={sceneRef} className="absolute inset-0" />
      </div>

    </div>
  );
}