import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import gsap from 'gsap';

export default function SandboxWrapper() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // 1. Setup Matter.js Engine & Render
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          MouseConstraint = Matter.MouseConstraint,
          Mouse = Matter.Mouse,
          World = Matter.World,
          Bodies = Matter.Bodies;

    const engine = Engine.create();
    engineRef.current = engine;
    
    // Slight gravity for a floaty, zero-g feel
    engine.world.gravity.y = 0.5;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: '#050505', // Deep museum black
        pixelRatio: window.devicePixelRatio
      }
    });

    // 2. Create the Museum Walls (Static Bodies)
    const wallOptions = { isStatic: true, render: { fillStyle: 'transparent' } };
    const ground = Bodies.rectangle(width / 2, height + 50, width, 100, wallOptions);
    const ceiling = Bodies.rectangle(width / 2, -50, width, 100, wallOptions);
    const leftWall = Bodies.rectangle(-50, height / 2, 100, height, wallOptions);
    const rightWall = Bodies.rectangle(width + 50, height / 2, 100, height, wallOptions);

    World.add(engine.world, [ground, ceiling, leftWall, rightWall]);

    // 3. Create Project Cards (Dynamic Bodies)
    // These are placeholders for your actual project images/data
    const projects = [
      { color: '#3b82f6', label: 'MySpace Layouts' }, // Blue
      { color: '#ef4444', label: 'VVA Graphics' },    // Red
      { color: '#14b8a6', label: 'Full Stack App' },  // Teal
      { color: '#a855f7', label: '3D Experience' },   // Purple
      { color: '#f59e0b', label: 'Brand Identity' }   // Orange
    ];

    const projectBodies = projects.map((proj, i) => {
      return Bodies.rectangle(
        width / 2 + (Math.random() * 200 - 100), 
        -200 - (i * 150), // Drop them from off-screen top
        250, // Width of card
        350, // Height of card
        {
          chamfer: { radius: 20 }, // Rounded corners
          restitution: 0.6, // Bounciness
          frictionAir: 0.02, // Air resistance
          render: {
            fillStyle: proj.color,
            strokeStyle: '#ffffff',
            lineWidth: 2
          }
        }
      );
    });

    World.add(engine.world, projectBodies);

    // 4. Add Mouse Interaction (Grab and Throw)
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    World.add(engine.world, mouseConstraint);
    
    // Keep mouse in sync with scrolling
    render.mouse = mouse;

    // 5. Run the Engine
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Intro Animation: Fade in the canvas
    gsap.fromTo(sceneRef.current, { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.out" });

    // Handle Resize
    const handleResize = () => {
      render.canvas.width = window.innerWidth;
      render.canvas.height = window.innerHeight;
      Matter.Body.setPosition(ground, { x: window.innerWidth / 2, y: window.innerHeight + 50 });
      Matter.Body.setPosition(rightWall, { x: window.innerWidth + 50, y: window.innerHeight / 2 });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050505]">
      
      {/* HUD overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none mix-blend-difference">
        <h2 className="text-white text-4xl font-black uppercase tracking-tighter">The Sandbox</h2>
        <p className="text-gray-400 font-mono text-sm mt-2">Grab. Drag. Throw.</p>
      </div>

      {/* Physics Canvas Mount Point */}
      <div ref={sceneRef} className="absolute inset-0 z-0 cursor-grab active:cursor-grabbing" />
      
    </div>
  );
}