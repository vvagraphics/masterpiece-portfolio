// src/components/StoryScroll.tsx
import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import MySpaceSVG from './svgs/MySpaceSVG';
import VvaGraphicsSVG from './svgs/VvaGraphicsSVG.tsx'; 
import StructureLogicSVG from './svgs/StructureLogicSVG.tsx'; 
import EfandersonLogo from './svgs/EfandersonLogo';
import MagneticButton from './MagneticButton';

gsap.registerPlugin(ScrollTrigger);

interface StoryScrollProps {
  onStoryComplete: () => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
}

export default function StoryScroll({ onStoryComplete, isAudioEnabled, toggleAudio }: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      
      const svgPaths = gsap.utils.toArray<SVGPathElement>('.animate-svg-path');
      svgPaths.forEach(path => {
        const length = path.getTotalLength();
        gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      });

      gsap.set('.svg-fill-group', { opacity: 0 });

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
        // Parallax the background images outward
        .to('#chapter-1 .parallax-img-1', { y: -200, rotate: -10, duration: 1.5 }, "<")
        .to('#chapter-1 .parallax-img-2', { y: 200, rotate: 15, duration: 1.5 }, "<")
        .to(sectionsRef.current[0], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5") 
      
      // --- CHAPTER 2: VVAGRAPHICS ---
        .fromTo(sectionsRef.current[1], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-2 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, "<0.2")
        .to('#chapter-2 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">")
        .to('#chapter-2 .parallax-img-1', { x: -300, y: -100, rotate: -25, duration: 1.5 }, "<")
        .to(sectionsRef.current[1], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5")

      // --- CHAPTER 3: STRUCTURE & LOGIC ---
        .fromTo(sectionsRef.current[2], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-3 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power1.inOut" }, "<0.2")
        .to('#chapter-3 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">")
        .to(sectionsRef.current[2], { opacity: 0, scale: 5, filter: "blur(20px)", duration: 1.5, ease: "power2.in" }, "+=0.5")

      // --- CHAPTER 4: THE EPIPHANY ---
        .fromTo(sectionsRef.current[3], { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" }, "<0.5")
        .to('#chapter-4 .animate-svg-path', { strokeDashoffset: 0, duration: 1.5, ease: "power2.inOut" }, "<0.5")
        .to('#chapter-4 .svg-fill-group', { opacity: 1, duration: 0.5 }, ">");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white overflow-hidden font-sans">
      
      {/* GLOBAL AUDIO TOGGLE (Wired to App.tsx state) */}
      <button
        onClick={toggleAudio}
        className="fixed top-8 right-8 z-[100] flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 hover:scale-110 bg-black/50 backdrop-blur-md"
        style={{
          borderColor: isAudioEnabled ? '#ef4444' : '#52525b',
          color: isAudioEnabled ? '#ef4444' : '#52525b',
        }}
      >
        {isAudioEnabled ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <line x1="23" y1="9" x2="17" y2="15"></line>
            <line x1="17" y1="9" x2="23" y2="15"></line>
          </svg>
        )}
      </button>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce flex flex-col items-center opacity-70 pointer-events-none">
        <span className="text-xs tracking-widest uppercase mb-2 font-mono">Scroll to Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
      </div>

      {/* Chapter 1: MySpace */}
      <div 
        id="chapter-1"
        ref={el => { sectionsRef.current[0] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center origin-center" 
      >
        {/* Placeholders for future cinematic images */}
        <div className="parallax-img-1 absolute top-20 left-20 w-64 h-64 bg-zinc-800 border border-zinc-700 shadow-2xl rounded rotate-6 opacity-40"></div>
        <div className="parallax-img-2 absolute bottom-20 right-20 w-80 h-48 bg-zinc-800 border border-zinc-700 shadow-2xl rounded -rotate-6 opacity-40"></div>

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
        <div className="parallax-img-1 absolute top-1/4 right-32 w-72 h-96 bg-red-900/20 border border-red-500/30 shadow-2xl rounded rotate-12 opacity-50"></div>

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