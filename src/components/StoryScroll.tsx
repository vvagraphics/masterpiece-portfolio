// src/components/StoryScroll.tsx
import { useLayoutEffect, useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import WarpBackground from './WarpBackground';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

interface StoryScrollProps {
  onStoryComplete: () => void;
  isAudioEnabled: boolean;
  toggleAudio: () => void;
}

// Optimized Flyby Item
const FlybyItem = ({ eraClass, z, xOffset, yOffset, rotate, label, imageUrl }: { 
  eraClass: string, 
  z: number, 
  xOffset: number, 
  yOffset: number, 
  rotate: number, 
  label: string,
  imageUrl: string
}) => (
  <div className={`${eraClass} absolute top-1/2 left-1/2 w-64 h-64 md:w-80 md:h-80 flex flex-col items-center justify-center bg-black/90 border border-white/20 rounded-2xl text-center p-4 md:p-6 opacity-0 pointer-events-none`} 
       data-x={xOffset} data-y={yOffset} data-rotate={rotate}
       style={{ transform: `translateZ(${z}px)`, willChange: "transform, opacity" }}>
    <img src={imageUrl} alt={label} className="w-40 h-40 md:w-56 md:h-56 object-contain mb-2 md:mb-4 transform-gpu" />
    <span className="text-white font-bold font-mono text-sm md:text-lg uppercase tracking-widest bg-black px-4 md:px-5 py-2 rounded-full border border-white/10">{label}</span>
  </div>
);

// --- Custom SVG Icons for the Controls ---
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path className="animate-slide-left" d="M13 5l7 7-7 7" />
    <path className="animate-slide-left" style={{ animationDelay: '0.5s' }} d="M5 5l7 7-7 7" />
  </svg>
);

const MutedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

const AudioOnIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse stroke-white-600" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-pulse stroke-red-800" style={{ animationDelay: '0.5s' }} />
  </svg>
);

export default function StoryScroll({ onStoryComplete, isAudioEnabled, toggleAudio }: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRigRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  const imgBase = "http://mr3anderson.pro/masterpiece-portfolio/";
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [hoveredFuture, setHoveredFuture] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!cameraRigRef.current || !containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.defaults({ force3D: true });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=11000%', 
          scrub: 1,     
          pin: true,     
        }
      });

      tl.to('.scroll-hint', { opacity: 0, duration: 0.5, ease: "power2.out" })

      // ==========================================
      // 1. APPROACH SCENE 1
      // ==========================================
        .addLabel('warp1')
        .to(cameraRigRef.current, { z: 0, ease: "power1.inOut", duration: 6.5 }, 'warp1')
        
        .fromTo('.era-1-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.5, stagger: 0.9, ease: "power1.out" }, 
          'warp1+=0.5'
        )
        .to('.era-1-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 1.0, stagger: 0.9, ease: "power2.in" }, 
          'warp1+=2.0'
        )
        
        .to('.scene-1-wrapper', { opacity: 1, duration: 1.5 }, 'warp1+=5.2')
        .to('.scene-1-pan-zoom', { scale: 2.0, xPercent: 10, yPercent: 1, duration: 2, ease: "power2.inOut" }, 'warp1+=6.0')
        .to({}, { duration: 0.5 }) 

      // --- SCENE 1: BEDROOM ---
        .fromTo('.scene-1-part1', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 'warp1+=7.2')
        // Scroll the MySpace image up vertically during the hold duration
        .to('.myspace-scroll-img', { yPercent: -60, duration: 1.5, ease: "power1.inOut" }) 
        .to('.scene-1-part1', { scale: 1.1, opacity: 0, duration: 0.4 })
        
        .fromTo('.scene-1-part2', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-part2', { scale: 1.1, opacity: 0, duration: 0.4 })

      // ==========================================
      // 2. WARP TO SCENE 2 
      // ==========================================
        .addLabel('warp2')
        .to(cameraRigRef.current, { z: 4000, ease: "power1.inOut", duration: 6.5 }, 'warp2')
        .to('.scene-1-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp2') 
        
        .fromTo('.era-2-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.5, stagger: 0.9, ease: "power1.out" }, 
          'warp2+=0.5'
        )
        .to('.era-2-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 1.0, stagger: 0.9, ease: "power2.in" }, 
          'warp2+=2.0'
        )
        
        .to('.scene-2-wrapper', { opacity: 1, duration: 1.5 }, 'warp2+=5.2') 
        .to('.scene-2-pan-zoom', { scale: 2.0, xPercent: -5, yPercent: -10, duration: 2, ease: "power2.inOut" }, 'warp2+=6.0')
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 2: ITT TECH ---
        .fromTo('.scene-2-part1', { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" })
        .to({}, { duration: 1.5 })
        .to('.scene-2-part1', { opacity: 0, scale: 1.1, duration: 0.4 })
        
        .fromTo('.scene-2-part2', { opacity: 0, scale: 1.2 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" })
        .to({}, { duration: 1.5 })
        .to('.scene-2-part2', { opacity: 0, scale: 1.1, duration: 0.4 })

      // ==========================================
      // 3. WARP TO SCENE 3
      // ==========================================
        .addLabel('warp3')
        .to(cameraRigRef.current, { z: 8000, ease: "power1.inOut", duration: 6.5 }, 'warp3')
        .to('.scene-2-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp3') 
        
        .fromTo('.era-3-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.5, stagger: 0.9, ease: "power1.out" }, 
          'warp3+=0.5'
        )
        .to('.era-3-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 1.0, stagger: 0.9, ease: "power2.in" }, 
          'warp3+=2.0'
        )
        
        .to('.scene-3-wrapper', { opacity: 1, duration: 1.5 }, 'warp3+=5.2') 
        .to('.scene-3-pan-zoom', { scale: 1, xPercent: 0, yPercent: 0, duration: 2, ease: "power2.inOut" }, 'warp3+=6.0')
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 3: GOOGLE UI/UX ---
        .fromTo('.scene-3-part1', { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 0.5 })
        .to({}, { duration: 1.5 })
        .to('.scene-3-part1', { opacity: 0, x: 100, duration: 0.4 })

        .fromTo('.scene-3-part2', { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 0.5, ease: "back.out(1.5)" })
        .to({}, { duration: 1.5 })
        .to('.scene-3-part2', { opacity: 0, scale: 1.2, duration: 0.4 })

      // ==========================================
      // 4. WARP TO SCENE 4
      // ==========================================
        .addLabel('warp4')
        .to(cameraRigRef.current, { z: 12000, ease: "power1.inOut", duration: 6.5 }, 'warp4')
        .to('.scene-3-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp4') 
        
        .fromTo('.era-4-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.5, stagger: 0.9, ease: "power1.out" }, 
          'warp4+=0.5'
        )
        .to('.era-4-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 1.0, stagger: 0.9, ease: "power2.in" }, 
          'warp4+=2.0'
        )
        
        .to('.scene-4-wrapper', { opacity: 1, duration: 1.5 }, 'warp4+=5.2') 
        .to('.scene-4-pan-zoom', { scale: 3.0, xPercent: -55, yPercent: -25, duration: 2, ease: "power2.inOut" }, 'warp4+=6.0')
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 4: PC PROFESSOR ---
        .fromTo('.scene-4-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-4-part1', { opacity: 0, scale: 1.1, duration: 0.4 })

        .fromTo('.scene-4-part2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-4-part2', { opacity: 0, scale: 1.1, duration: 0.4 })

      // ==========================================
      // 5. WARP TO SCENE 5 
      // ==========================================
        .addLabel('warp5')
        .to(cameraRigRef.current, { z: 16000, ease: "power1.inOut", duration: 6.5 }, 'warp5')
        .to('.scene-4-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp5') 
        
        .fromTo('.era-5-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.5, stagger: 0.9, ease: "power1.out" }, 
          'warp5+=0.5'
        )
        .to('.era-5-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 1.0, stagger: 0.9, ease: "power2.in" }, 
          'warp5+=2.0'
        )
        
        .to('.scene-5-wrapper', { opacity: 1, duration: 1.5 }, 'warp5+=5.2') 
        .to('.scene-5-pan-zoom', { scale: 1.2, duration: 2, ease: "power1.inOut" }, 'warp5+=6.0')
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 5: AI FUTURE ---
        .fromTo('.scene-5-assist', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp5+=5.2')
        .to({}, { duration: 0.5 })
        .to('.scene-5-assist', { opacity: 0, scale: 1.1, duration: 0.5 })

        .fromTo('.scene-5-part1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to({}, { duration: 2.5 })
        
        .addLabel('hideAgents')
        .to('.scene-5-part1', { opacity: 0, scale: 1.2, duration: 0.5 }, 'hideAgents')
        .to('.scene-5-text-overlay', { opacity: 0, duration: 0.5 }, 'hideAgents')

        .fromTo('.scene-5-question', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1, ease: "power2.out" })
        .to({}, { duration: 2.5 })

        .addLabel('finale')
        .to('.scene-5-question', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'finale')
        .fromTo('.scene-5-part3', { opacity: 0 }, { opacity: 1, duration: 1.5, ease: "power2.inOut" }, 'finale')
        
        .to({}, { duration: 5 }); 

    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    let autoScrollTween: gsap.core.Tween;
    
    if (isAutoPlaying) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const remainingProgress = 1 - (currentScroll / maxScroll);
      const duration = 130 * remainingProgress;

      autoScrollTween = gsap.to(window, {
        scrollTo: "max",
        duration: Math.max(duration, 1), 
        ease: "none",
      });
    }
    
    const handleManualScroll = () => {
      if (autoScrollTween && isAutoPlaying) {
        autoScrollTween.pause();
        setIsAutoPlaying(false);
      }
    };
    
    window.addEventListener("wheel", handleManualScroll);
    return () => {
      if (autoScrollTween) autoScrollTween.kill();
      window.removeEventListener("wheel", handleManualScroll);
    };
  }, [isAutoPlaying]);

  return (
    <div ref={containerRef} className="relative w-full h-screen bg-black text-white overflow-hidden font-sans"
      style={{ perspective: "1500px", perspectiveOrigin: "50% 50%" }}
      onClick={() => window.innerWidth < 768 && setIsAutoPlaying(!isAutoPlaying)}
    >
      <WarpBackground />

      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[100] flex gap-2 md:gap-4">
        <button onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); }}
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 bg-black/50 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:border-white/70 transition-all duration-300"
          title={isAutoPlaying ? "Pause Journey" : "Auto-scroll Journey"}>
          {isAutoPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        
        <button onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 bg-black/50 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:border-white/70 transition-all duration-300"
          title={isAudioEnabled ? "Mute Audio" : "Enable Audio"}>
          {isAudioEnabled ? <AudioOnIcon /> : <MutedIcon />}
        </button>
      </div>

      <div className="scroll-hint absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] md:tracking-[0.3em] uppercase mb-4 opacity-80 drop-shadow-lg text-center px-4">The Temporal Journey</h1>
        <p className="text-xs md:text-sm tracking-widest uppercase text-gray-400 mb-8 animate-pulse text-center">Scroll to Initiate Jump</p>
      </div>

      <div ref={cameraRigRef} className="absolute inset-0 w-full h-full"
        style={{ transformStyle: "preserve-3d", transform: "translateZ(-4000px)" }}>
        
        {/* ================= ERA 1 FLYBYS ================= */}
        <FlybyItem eraClass="era-1-flyby" z={3500} xOffset={-35} yOffset={-25} rotate={-15} label="Motorola Razr" imageUrl={`${imgBase}razr_v3_spinning.jpg`}/>
        <FlybyItem eraClass="era-1-flyby" z={2500} xOffset={30} yOffset={20} rotate={10} label="iPod Classic" imageUrl={`${imgBase}ipod_classic_clickwheel.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={1500} xOffset={-40} yOffset={30} rotate={-5} label="Top 8 Profile"imageUrl={`${imgBase}top8_grid.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={500} xOffset={35} yOffset={-30} rotate={25} label="Wii Remote" imageUrl={`${imgBase}wii_remote.jpg`}/>

        {/* ================= SCENE 1: BEDROOM ================= */}
        <div className="scene-1-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(0px)" }}>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/60 px-6 py-3 border border-cyan-500/30 rounded-full z-50 pointer-events-none w-[90%] md:w-auto text-center shadow-[0_0_20px_rgba(6,182,212,0.1)]">
            <p className="text-cyan-100 text-xs md:text-base font-mono font-bold uppercase tracking-widest drop-shadow-md">
              - My First Encounter With HTML & CSS
            </p>
          </div>
          <div className="scene-1-pan-zoom absolute inset-0 w-full h-full origin-center">
            <img src={`${imgBase}scene1_bedroom_crt.jpg`} alt="90s Bedroom" className="absolute inset-0 w-full h-full object-cover opacity-80 transform-gpu" />
            <div className="absolute top-[50%] left-[44%] transform -translate-x-1/2 -translate-y-1/2 w-[21vw] h-[23vh] md:w-[21vw] md:h-[23vh]">
               
               {/* FIX: Re-structured MySpace Container for Scrolling */}
               <div className="scene-1-part1 absolute inset-0 flex flex-col bg-black/90 p-2 pb-8 md:pb-10 border border-blue-900 rounded-xl opacity-0 shadow-2xl overflow-hidden">
                   <div className="flex-1 w-full relative overflow-hidden rounded-sm border border-white/10 bg-black">
                       <img src={`${imgBase}MySpace_profile_page_2004.jpg`} className="myspace-scroll-img absolute top-0 left-0 w-full h-auto min-h-full object-cover transform-gpu" />
                   </div>
                   <h2 className="absolute bottom-1 md:bottom-2 left-0 w-full text-blue-500 text-sm md:text-2xl font-bold font-mono text-center shrink-0">:::myspace</h2>
               </div>

               <div className="scene-1-part2 absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-1  border border-yellow-700 rounded-xl opacity-0 shadow-2xl">
                   <div className="flex-1 w-full min-h-0 flex items-center justify-center mb-4">
                       <img src={`${imgBase}Yahoo_chat.jpg`} className="w-full h-full object-contain rounded drop-shadow-lg" />
                   </div>
                   <h2 className="absolute bottom-0 text-yellow-500 text-sm md:text-1xl font-bold font-mono text-center shrink-0">Yahoo/A.I.M</h2>
               </div>
            </div>
          </div>
        </div>

        {/* ================= ERA 2 FLYBYS ================= */}
        <FlybyItem eraClass="era-2-flyby" z={-500} xOffset={35} yOffset={-25} rotate={15} label="Polaroid Icon" imageUrl={`${imgBase}polaroid_icon.jpg`} />
        <FlybyItem eraClass="era-2-flyby" z={-1500} xOffset={-40} yOffset={20} rotate={-20} label="Glowing Bitcoin" imageUrl={`${imgBase}glowing_bitcoin.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-2500} xOffset={40} yOffset={25} rotate={5} label="Diamond Pickaxe" imageUrl={`${imgBase}minecraft_pickaxe.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-3500} xOffset={-30} yOffset={-20} rotate={-10} label="Pokéball" imageUrl={`${imgBase}pokeball.jpg`}/>

        {/* ================= SCENE 2: ITT TECH ================= */}
        <div className="scene-2-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-4000px)" }}>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/60 px-6 py-3 border border-red-500/30 rounded-full z-50 pointer-events-none w-[90%] md:w-auto text-center shadow-[0_0_20px_rgba(239,68,68,0.1)]">
            <p className="text-red-100 text-xs md:text-base font-mono font-bold uppercase tracking-widest drop-shadow-md">
              - Building My First Site & The Fall of Flash
            </p>
          </div>
          <div className="scene-2-pan-zoom absolute inset-0 w-full h-full origin-top">
            <img src={`${imgBase}scene2_itt_chalkboard.jpg`} alt="ITT Tech Classroom" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
            <div className="absolute top-[32%] left-[54%] transform -translate-x-1/2 -translate-y-1/2 w-[20vw] h-[25vh] md:w-[20vw] md:h-[25vh]">
               <div className="scene-2-part1 absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 bg-black/80 md:bg-black/50 p-1 rounded-xl shadow-2xl">
                   <div className="flex-1 w-full min-h-0 flex items-center justify-center ">
                       <img src={`${imgBase}first_website.jpg`} className="w-full h-full object-contain border-2 border-red-900 rotate-3 shadow-[0_0_30px_rgba(153,27,27,0.5)]" />
                   </div>
                   <p className="text-base md:text-xl text-center bg-black/80 p-1 rounded font-mono border border-white/10 shrink-0">VVA GRAPHICS is born.</p>
               </div>
               <div className="scene-2-part2 absolute inset-0 flex flex-col items-center justify-center text-white opacity-0 bg-black/90 md:bg-black/60 p-1 rounded-xl shadow-2xl border border-white/10">
                   <div className="flex-1 w-full min-h-0 flex items-center justify-center ">
                       <img src={`${imgBase}Newspaper_clipping_ITT_closes.jpg`} className="w-full h-full object-contain border-2 border-red-900 rotate-3 shadow-[0_0_30px_rgba(153,27,27,0.5)]" />
                   </div>
                   <h2 className="text-red-500 text-sm md:text-1xl font-black uppercase tracking-widest bg-black/90 px-1 py-2 border border-red-900/50 text-center shrink-0">ITT TECH CLOSES</h2>
               </div>
            </div>
          </div>
        </div>

        {/* ================= ERA 3 FLYBYS ================= */}
        <FlybyItem eraClass="era-3-flyby" z={-4500} xOffset={-35} yOffset={30} rotate={-15} label="Figma Pen" imageUrl={`${imgBase}figma_pen_tool.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-5500} xOffset={30} yOffset={-25} rotate={10} label="OG AirPods" imageUrl={`${imgBase}original_airpods.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-6500} xOffset={-40} yOffset={-20} rotate={-5} label="Glitch Logo" imageUrl={`${imgBase}tiktok_glitch_logo.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-7500} xOffset={35} yOffset={20} rotate={25} label="Llama Piñata" imageUrl={`${imgBase}fortnite_llama.jpg`}/>

        {/* ================= SCENE 3: GOOGLE UI/UX ================= */}
        <div className="scene-3-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-8000px)", willChange: "opacity, transform" }}>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/60 px-6 py-3 border border-blue-500/30 rounded-full z-50 pointer-events-none w-[90%] md:w-auto text-center shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <p className="text-blue-100 text-xs md:text-base font-mono font-bold uppercase tracking-widest drop-shadow-md">
              - Google Certifications & Mobile Apps
            </p>
          </div>
          <div className="scene-3-pan-zoom absolute inset-0 w-full h-full origin-center">
            <img src={`${imgBase}scene4_uiux_monitors.jpg`} alt="Workspace" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
            <div className="absolute top-[4%] left-[2.5%] w-[95%] h-[90%] flex items-center justify-center">
               <div className="scene-3-part1 absolute inset-0 flex flex-col items-center justify-center opacity-0 bg-blue-900/60 border-2 border-blue-400/50 rounded-xl p-8 shadow-2xl">
                   <h2 className="text-white text-5xl font-black tracking-widest drop-shadow-2xl mb-2">GOOGLE UX DESIGN</h2>
                   <h3 className="text-blue-200 text-xl font-bold mb-6 tracking-wide">UI/UX Project</h3>
                   <div className="flex-1 w-full min-h-0">
                       <img src={`${imgBase}UX_finished_product.jpg`} alt="Finished UI" className="w-full h-full object-contain rounded-lg border border-white/20 shadow-inner" />
                   </div>
               </div>
               <div className="scene-3-part2 absolute inset-0 flex flex-col items-center justify-center opacity-0 bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.8)] rounded-xl p-8">
                   <h2 className="text-blue-300 text-4xl font-mono uppercase tracking-widest mb-6 drop-shadow-md">Certificate</h2>
                   <div className="flex-1 w-full min-h-0">
                       <img src={`${imgBase}UX_wireframe_flow_planning.jpg`} className="w-full h-full object-contain rounded-lg border border-blue-400/30 opacity-90 shadow-inner" />
                   </div>
               </div>
            </div>
          </div>
        </div>

        {/* ================= ERA 4 FLYBYS ================= */}
        <FlybyItem eraClass="era-4-flyby" z={-8500} xOffset={30} yOffset={-30} rotate={5} label="Zoom Webcams" imageUrl={`${imgBase}zoom_webcams_grid.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-9500} xOffset={-35} yOffset={25} rotate={-10} label="Masks & Space" imageUrl={`${imgBase}masks_distancing.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-10500} xOffset={40} yOffset={30} rotate={15} label="Bored Ape NFT" imageUrl={`${imgBase}bored_ape_nft.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-11500} xOffset={-30} yOffset={-35} rotate={-20} label="James Webb" imageUrl={`${imgBase}james_webb_mirror.jpg`}/>

        {/* ================= SCENE 4: PC PROFESSOR ================= */}
        <div className="scene-4-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-12000px)", willChange: "opacity, transform" }}>
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/60 px-6 py-3 border border-teal-500/30 rounded-full z-50 pointer-events-none w-[90%] md:w-auto text-center shadow-[0_0_20px_rgba(20,184,166,0.1)]">
            <p className="text-teal-100 text-xs md:text-base font-mono font-bold uppercase tracking-widest drop-shadow-md">
              - Mastering the Full Stack
            </p>
          </div>
          <div className="scene-4-pan-zoom absolute inset-0 w-full h-full origin-top-left">
            <img src={`${imgBase}scene3_pcprof_board.jpg`} alt="PC Professor" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
            <div className="absolute top-[26%] left-[36%] transform -translate-x-1/2 -translate-y-1/2 w-[20vw] h-[17vh] md:w-[20vw] md:h-[17vh]">
               <div className="scene-4-part1 absolute inset-0 flex flex-col items-center justify-center bg-teal-900/80 border border-teal-500/50 rounded-xl p-1 opacity-0 shadow-2xl">
                   <div className="flex-1 w-full min-h-0 flex items-center justify-center ">
                       <img src={`${imgBase}webmaster.jpg`} className="w-full h-full object-contain rounded-lg shadow-lg" />
                   </div>
                   <h2 className="absolute bottom-0 text-red-400 text-1xl md:text-1xl font-semibold  drop-shadow-md text-center shrink-0">Webmaster.</h2>
               </div>
               <div className="scene-4-part2 absolute inset-0 flex flex-col items-center justify-center bg-teal-900/90 border border-teal-500/50 rounded-xl p-1 opacity-0 shadow-2xl">
                   <div className="flex-1 w-full min-h-0 flex items-center justify-center ">
                       <img src={`${imgBase}Two_interconnected_tech_stacks.jpg`} className="w-full h-full object-contain rounded-lg shadow-lg" />
                   </div>
                   <h2 className="absolute bottom-0 text-red-400 text-1xl md:text-1xl font-semibold  drop-shadow-md text-center shrink-0">MEAN / MERN</h2>
               </div>
            </div>
          </div>
        </div>

        {/* ================= ERA 5 FLYBYS ================= */}
        <FlybyItem eraClass="era-5-flyby" z={-12500} xOffset={-40} yOffset={-10} rotate={-5} label="AR/VR Headset" imageUrl={`${imgBase}ar_vr_headset.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-13500} xOffset={35} yOffset={-25} rotate={10} label="Neural Mesh" imageUrl={`${imgBase}neural_network_mesh.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-14500} xOffset={-30} yOffset={35} rotate={-15} label="Robotic Hand" imageUrl={`${imgBase}robotic_hand.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-15500} xOffset={40} yOffset={25} rotate={20} label="Hologram UI" imageUrl={`${imgBase}holographic_ui_panels.jpg`}/>

        {/* ================= SCENE 5: AI FUTURE ================= */}
        <div className="scene-5-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-16000px)" }}>
          <div className="scene-5-text-overlay absolute top-10 left-1/2 transform -translate-x-1/2 bg-black/60 px-6 py-3 border border-white/20 rounded-full z-[100] pointer-events-none w-[90%] md:w-auto text-center shadow-[0_0_20px_rgba(168,85,247,0.1)]">
            <p className="text-white text-xs md:text-base font-mono font-bold uppercase tracking-widest drop-shadow-md">
              - My first AI assist, AI Agent
            </p>
          </div>
          <img src={`${imgBase}scene5_cyberpunk_ultrawide.jpg`} alt="AI Future" className="absolute inset-0 w-full h-full object-cover opacity-50 transform-gpu" />
          
          <div className="scene-5-pan-zoom absolute inset-0 w-full h-full">
              <div className="absolute inset-0 flex items-center justify-center p-4">

                 <div className="scene-5-assist absolute inset-0 flex flex-col items-center justify-center opacity-0 z-20 pointer-events-none">
                     <img src={`${imgBase}code_assist.jpg`} alt="AI Assistant" className="max-w-xl w-[90%] rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.4)] border border-white/10" />
                     <h2 className="text-blue-400 text-2xl sm:text-3xl font-mono mt-6 font-bold tracking-widest drop-shadow-md">AI ASSISTANT</h2>
                 </div>
                 
                 <div className="scene-5-part1 absolute w-[95%] md:w-full max-w-3xl flex flex-col items-center justify-center opacity-0 z-30 pointer-events-none">
                     <div className="w-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)] border border-gray-700">
                        <div className="bg-[#2d2d2d] px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                            <span className="text-gray-400 font-mono text-[10px] md:text-xs ml-2 md:ml-4">ai_agents_deploy.sh</span>
                        </div>
                        <div className="p-1 bg-black relative">
                            <img src={`${imgBase}ai_agents_terminal.gif`} alt="AI Agents Working" className="w-full h-auto object-cover opacity-90 mix-blend-screen transform-gpu" />
                        </div>
                     </div>
                     <h2 className="text-purple-400 text-2xl sm:text-3xl md:text-5xl font-mono mt-6 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">AUTONOMOUS AGENTS</h2>
                     <p className="text-sm md:text-lg text-gray-400 mt-2 md:mt-4 font-mono text-center">The machines write the code. I architect the reality.</p>
                 </div>

                 <div className="scene-5-question absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 z-40 pointer-events-none">
                     <h2 className="text-white text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-center max-w-5xl leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] px-4">
                        What is our future<br/>with AI?
                     </h2>
                 </div>
                 
                 {/* FIX: Spring-like custom easing for the Cliffhanger sections */}
                 <div className="scene-5-part3 absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 z-50">
                     <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full opacity-60">
                        
                        <div 
                            className={`relative group h-full transform-gpu border-b md:border-b-0 md:border-r border-white/20 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer overflow-hidden min-w-0 ${
                                hoveredFuture === 0 ? 'flex-[4]' : 'flex-1'
                            }`}
                            onMouseEnter={() => setHoveredFuture(0)}
                            onMouseLeave={() => setHoveredFuture(null)}
                            onClick={() => setHoveredFuture(hoveredFuture === 0 ? null : 0)}
                        >
                            <img src={`${imgBase}future_tools.jpg`} alt="AI as Tools" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                            <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                                <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Mere Tools</span>
                            </div>
                        </div>

                        <div 
                            className={`relative group h-full transform-gpu border-b md:border-b-0 md:border-r border-white/20 z-10 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer overflow-hidden min-w-0 ${
                                hoveredFuture === 1 ? 'flex-[4]' : 'flex-1'
                            }`}
                            onMouseEnter={() => setHoveredFuture(1)}
                            onMouseLeave={() => setHoveredFuture(null)}
                            onClick={() => setHoveredFuture(hoveredFuture === 1 ? null : 1)}
                        >
                            <img src={`${imgBase}future_colleagues.jpg`} alt="AI as Colleagues" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                            <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                                <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Side by Side</span>
                            </div>
                        </div>

                        <div 
                            className={`relative group h-full transform-gpu transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer overflow-hidden min-w-0 ${
                                hoveredFuture === 2 ? 'flex-[4]' : 'flex-1'
                            }`}
                            onMouseEnter={() => setHoveredFuture(2)}
                            onMouseLeave={() => setHoveredFuture(null)}
                            onClick={() => setHoveredFuture(hoveredFuture === 2 ? null : 2)}
                        >
                            <img src={`${imgBase}future_downfall2.jpg`} alt="AI as Downfall" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                            <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                                <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Our Downfall?</span>
                            </div>
                        </div>

                     </div>

                     <div 
                        className="relative z-20 flex flex-col items-center p-6 md:p-14 bg-black/70  rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] w-[90%] md:w-auto"
                        onMouseEnter={() => setHoveredFuture(null)}
                     >
                        <h3 className="text-gray-300 text-xs sm:text-sm md:text-xl uppercase tracking-[0.3em] md:tracking-[0.6em] mb-6 md:mb-12 font-light text-center drop-shadow-md">The Choice is Ours</h3>
                        <button onClick={onStoryComplete} className="px-6 md:px-14 py-3 md:py-6 bg-white text-black font-black text-sm md:text-2xl uppercase tracking-[0.1em] md:tracking-[0.3em] hover:bg-purple-600 hover:text-white hover:scale-105 transition-all duration-300 rounded-sm pointer-events-auto shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.8)] whitespace-nowrap">
                            Enter the Museum
                        </button>
                     </div>
                 </div>
              </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.9)_100%)] z-10"></div>
    </div>
  );
}