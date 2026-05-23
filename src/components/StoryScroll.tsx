import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface StoryScrollProps {
  onStoryComplete: () => void;
}

export default function StoryScroll({ onStoryComplete }: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLDivElement | null)[]>([]);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Create a master timeline locked to the scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=400%', // 4 screens worth of scrolling
          scrub: 1,      // Smoothly scrub the timeline
          pin: true,     // Pin the container in place
        }
      });

      // Chapter 1 -> Chapter 2
      tl.to(sectionsRef.current[0], { opacity: 0, y: -50, duration: 1 })
        .fromTo(sectionsRef.current[1], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, "<0.5") // <0.5 means overlap the previous animation by half a second
      
      // Chapter 2 -> Chapter 3
        .to(sectionsRef.current[1], { opacity: 0, y: -50, duration: 1 }, "+=1") // +=1 means pause for a moment so the user can read it
        .fromTo(sectionsRef.current[2], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, "<0.5")

      // Chapter 3 -> Chapter 4
        .to(sectionsRef.current[2], { opacity: 0, y: -50, duration: 1 }, "+=1")
        .fromTo(sectionsRef.current[3], { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 1 }, "<0.5");

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce flex flex-col items-center opacity-70 pointer-events-none">
        <span className="text-xs tracking-widest uppercase mb-2 font-mono">Scroll to Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
      </div>

      {/* Chapter 1: MySpace */}
      <div 
        ref={el => { sectionsRef.current[0] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-cover bg-center" 
        style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/myspace.png')" }}
      >
        <div className="bg-black/80 p-12 rounded-xl backdrop-blur-sm border border-blue-500/30 shadow-2xl">
          <h2 className="text-blue-500 text-6xl font-bold mb-4 font-mono tracking-tighter">:::myspace</h2>
          <p className="text-xl max-w-2xl text-gray-300">Where it all began. The thrill of raw HTML and CSS. The first time the browser became a canvas.</p>
        </div>
      </div>

      {/* Chapter 2: Statunderson Graffiti */}
      <div 
        ref={el => { sectionsRef.current[1] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 bg-cover bg-center" 
        style={{ backgroundImage: "url('https://mr3anderson.pro/masterpiece-portfolio/first_web-background.jpg')" }}
      >
        <div className="bg-black/70 p-12 rounded-xl backdrop-blur-sm">
          <h2 className="text-red-500 text-7xl font-black mb-4 uppercase italic transform -skew-x-12">Statunderson</h2>
          <p className="text-xl max-w-2xl text-gray-300">The raw era. Digital graffiti, experimental graphics, and breaking the rules of grid design before I even knew them.</p>
        </div>
      </div>

      {/* Chapter 3: Structure & Logic */}
      <div 
        ref={el => { sectionsRef.current[2] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 bg-gradient-to-b from-black via-teal-950 to-black"
      >
        <h2 className="text-teal-400 text-5xl font-semibold mb-4 tracking-widest">STRUCTURE & LOGIC</h2>
        <p className="text-xl max-w-2xl text-gray-400">Evolving into UI/UX and Full Stack logic. Mastering the rules so I could shatter them with purpose.</p>
      </div>

      {/* Chapter 4: Epiphany */}
      <div 
        ref={el => { sectionsRef.current[3] = el; }} 
        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center opacity-0 bg-black"
      >
        <h2 className="text-white text-8xl font-serif mb-4">EFANDERSON</h2>
        <p className="text-xl max-w-2xl text-gray-400 mb-12">The Epiphany. The Masterpiece. Welcome to the Playground.</p>
        <button 
          onClick={onStoryComplete}
          className="px-8 py-4 bg-white text-black font-bold uppercase tracking-widest hover:bg-gray-300 transition-all cursor-pointer pointer-events-auto"
        >
          Enter the Museum
        </button>
      </div>

    </div>
  );
}