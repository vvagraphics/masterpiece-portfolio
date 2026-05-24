import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// 1. IMPORT ALL YOUR NEW SVG COMPONENTS HERE
import MySpaceSVG from './svgs/MySpaceSVG';
import VvaGraphicsSVG from './svgs/VvaGraphicsSVG.tsx'; 
import StructureLogicSVG from './svgs/StructureLogicSVG.tsx'; 
import EfandersonLogo from './svgs/EfandersonLogo';
import MagneticButton from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

interface StoryScrollProps {
  onStoryComplete: () => void;
}

export default function StoryScroll({ onStoryComplete }: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      
      // PRE-COMPUTE SVG MATHEMATICS FOR THE ENTIRE PAGE
      const svgPaths = gsap.utils.toArray<SVGPathElement>('.animate-svg-path');
      svgPaths.forEach(path => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      // Hide all SVG fills initially
      gsap.set('.svg-fill-group', { opacity: 0 });

      // CREATE THE MASTER SCROLL TIMELINE
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=500%', 
          scrub: 1,      
          pin: true,     
        }
      });

      // --- CHAPTER 1: MYSPACE ---
      tl.to('#chapter-1 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" })
        .to('#chapter-1 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">") 
        // FLY-THROUGH EXIT: Scale massively and blur to fly past the camera
        .to(sectionsRef.current[0], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5") 
      
      // --- CHAPTER 2: VVAGRAPHICS ---
        // Enter from deep space
        .fromTo(sectionsRef.current[1], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-2 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, "<0.2")
        .to('#chapter-2 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">")
        // FLY-THROUGH EXIT
        .to(sectionsRef.current[1], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5")

      // --- CHAPTER 3: STRUCTURE & LOGIC ---
        // Enter from deep space
        .fromTo(sectionsRef.current[2], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-3 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, "<0.2")
        .to('#chapter-3 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">")
        // FLY-THROUGH EXIT
        .to(sectionsRef.current[2], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5")

      // --- CHAPTER 4: THE EPIPHANY ---
        // Enter from deep space
        .fromTo(sectionsRef.current[3], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-4 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, "<0.5")
        .to('#chapter-4 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce flex flex-col items-center opacity-70 pointer-events-none">
        <span className="text-xs tracking-widest uppercase mb-2 font-mono">Scroll to Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
      </div>

      {/* Chapter 1: MySpace */}
      <div 
        id="chapter-1"
        ref={el => { sectionsRef.current[0] = el; }} 
        // Added origin-center so the scale effect pulls directly to the screen center
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center origin-center" 
      >
        <MySpaceSVG />
        <div className="bg-black/80 p-8 mt-4 rounded-xl backdrop-blur-sm border border-blue-500/30 shadow-2xl relative z-10">
          <h2 className="text-blue-500 text-6xl font-bold mb-4 font-mono tracking-tighter">:::myspace</h2>
          <p className="text-xl max-w-2xl text-gray-300">Where it all began. The thrill of raw HTML and CSS. The first time the browser became a canvas.</p>
        </div>
      </div>

      {/* Chapter 2: VVAGRAPHICS */}
      <div 
        id="chapter-2"
        ref={el => { sectionsRef.current[1] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 origin-center" 
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-50">
            <VvaGraphicsSVG />
        </div>
        <div className="bg-black/80 p-12 rounded-xl backdrop-blur-md border border-red-500/20 relative z-10">
          <h2 className="text-red-500 text-7xl font-black mb-4 uppercase italic transform -skew-x-12 tracking-tighter">VVAGRAPHICS</h2>
          <p className="text-xl max-w-2xl text-gray-300">The raw era. Digital graffiti, experimental graphics, and breaking the rules of grid design before I even knew them.</p>
        </div>
      </div>

      {/* Chapter 3: Structure & Logic */}
      <div 
        id="chapter-3"
        ref={el => { sectionsRef.current[2] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 bg-gradient-to-b from-black via-teal-950 to-black origin-center"
      >
        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40">
            <StructureLogicSVG />
        </div>
        <div className="relative z-10">
            <h2 className="text-teal-400 text-5xl font-semibold mb-4 tracking-widest drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">STRUCTURE & LOGIC</h2>
            <p className="text-xl max-w-2xl text-gray-300">Evolving into UI/UX and Full Stack logic. Mastering the rules so I could shatter them with purpose.</p>
        </div>
      </div>

      {/* Chapter 4: Epiphany */}
      <div 
        id="chapter-4"
        ref={el => { sectionsRef.current[3] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 bg-black origin-center"  
      >
        <EfandersonLogo />
        <div className="relative z-10 flex flex-col items-center mt-[-40px]">
            <h2 className="text-white text-8xl font-serif mb-4">THE EPIPHANY</h2>
            <p className="text-xl max-w-2xl text-gray-400 mb-12">The Masterpiece. Welcome to the Playground.</p>
            
            <MagneticButton onClick={onStoryComplete}
            className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-300 hover:scale-105 transition-all cursor-pointer pointer-events-auto shadow-[0_0_40px_rgba(255,255,255,0.3)]"
            >
            Enter the Museum
            </MagneticButton>
            
        </div>
      </div>

    </div>
  );
}