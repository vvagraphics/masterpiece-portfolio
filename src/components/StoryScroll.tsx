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
      // Pin the container to the screen
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: '+=400%', // 4x the height of the screen to give scroll distance
        pin: true,
      });

      // Animate each section based on scroll progress
      sectionsRef.current.forEach((section, index) => {
        if (!section) return;
        
        // FIX: Chapter 1 is visible by default. We only animate Chapters 2, 3, and 4 IN.
        if (index > 0) {
          gsap.fromTo(section, 
            { opacity: 0, y: 100, scale: 0.95 },
            {
              opacity: 1, 
              y: 0,
              scale: 1,
              scrollTrigger: {
                trigger: containerRef.current,
                start: `${index * 100 - 50}% top`, // Fade in slightly before hitting the absolute top
                end: `${index * 100}% top`,
                scrub: 1,
              }
            }
          );
        }

        // Fade OUT logic (for all except the last chapter)
        if (index < sectionsRef.current.length - 1) {
          gsap.to(section, {
            opacity: 0,
            y: -100,
            scrollTrigger: {
              trigger: containerRef.current,
              start: `${(index + 1) * 100 - 20}% top`, // Start fading out as the next one comes in
              end: `${((index + 1) * 100) + 30}% top`,
              scrub: 1,
            }
          });
        }
      });
    }, containerRef);

    return () => ctx.revert(); // Cleanup GSAP on unmount
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* Scroll Down Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 animate-bounce flex flex-col items-center opacity-70 pointer-events-none">
        <span className="text-xs tracking-widest uppercase mb-2 font-mono">Scroll to Explore</span>
        <div className="w-px h-12 bg-gradient-to-b from-white to-transparent"></div>
      </div>

      {/* Chapter 1: MySpace (Removed opacity-0 so it's visible on load) */}
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

      {/* Chapter 3: Structure & Logic (Added a subtle background gradient) */}
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