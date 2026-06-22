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

// ==========================================
// 1. COMPONENTS & ICONS
// ==========================================

const FlybyItem = ({ eraClass, z, xOffset, yOffset, rotate, label, imageUrl }: { 
  eraClass: string, 
  z: number, 
  xOffset: number, 
  yOffset: number, 
  rotate: number, 
  label: string,
  imageUrl: string
}) => (
  <div 
    aria-hidden="true"
    className={`${eraClass} absolute top-1/2 left-1/2 w-64 h-64 md:w-80 md:h-80 flex flex-col items-center justify-center bg-black/90 border border-white/20 rounded-2xl text-center p-4 md:p-6 opacity-0 pointer-events-none`} 
    data-x={xOffset} data-y={yOffset} data-rotate={rotate}
    style={{ transform: `translateZ(${z}px)`, willChange: "transform, opacity" }}>
    <img src={imageUrl} alt="" className="w-40 h-40 md:w-56 md:h-56 object-contain mb-2 md:mb-4 transform-gpu" />
    <span className="text-white font-bold font-mono text-sm md:text-lg uppercase tracking-widest bg-black px-4 md:px-5 py-2 rounded-full border border-white/10">{label}</span>
  </div>
);

const PlayIcon = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const PauseIcon = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path className="animate-slide-left" d="M13 5l7 7-7 7" />
    <path className="animate-slide-left" style={{ animationDelay: '0.5s' }} d="M5 5l7 7-7 7" />
  </svg>
);

const MutedIcon = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <line x1="23" y1="9" x2="17" y2="15"></line>
    <line x1="17" y1="9" x2="23" y2="15"></line>
  </svg>
);

const AudioOnIcon = () => (
  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" className="animate-pulse stroke-white-600" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" className="animate-pulse stroke-red-800" style={{ animationDelay: '0.5s' }} />
  </svg>
);

// ==========================================
// 2. MAIN COMPONENT
// ==========================================
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
        id: "storyTimeline", 
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
      // SCENE 1: BEDROOM (Fade In Foreground)
      // ==========================================
        .addLabel('warp1')
        .to(cameraRigRef.current, { z: 0, ease: "power1.inOut", duration: 6.5 }, 'warp1')
        
        .fromTo('.era-1-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.2, stagger: 0.9, ease: "power2.out" }, 
          'warp1+=0.5' 
        )
        .to('.era-1-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 0.5, stagger: 0.9, ease: "power3.in" }, 
          'warp1+=1.8' 
        )
        
        .to('.scene-1-wrapper', { opacity: 1, duration: 1.0 }, 'warp1+=5.0')
        .fromTo('.scene-1-bg', 
          { scale: 0.1, opacity: 0, rotationZ: 15 }, 
          { scale: 1, opacity: 1, rotationZ: 0, duration: 2, ease: "power3.out" }, 
          'warp1+=5.5'
        )
        .fromTo('.scene-1-title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp1+=6.5')

        .fromTo('.scene-1-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 'warp1+=7.0')
        .to('.myspace-scroll-img', { yPercent: -60, duration: 1.5, ease: "power1.inOut" }) 
        .to('.scene-1-part1', { opacity: 0, scale: 1.1, duration: 0.4 })
        
        .fromTo('.scene-1-part2', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" })
        .to({}, { duration: 1.5 }) 
        
        .to('.scene-1-bg, .scene-1-title, .scene-1-part2', { opacity: 0, scale: 1.1, duration: 0.5 })

      // ==========================================
      // SCENE 2: ITT TECH (Fade In Foreground)
      // ==========================================
        .addLabel('warp2')
        .to(cameraRigRef.current, { z: 4000, ease: "power1.inOut", duration: 6.5 }, 'warp2')
        
        .fromTo('.era-2-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.2, stagger: 0.9, ease: "power2.out" }, 
          'warp2+=0.5'
        )
        .to('.era-2-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 0.5, stagger: 0.9, ease: "power3.in" }, 
          'warp2+=1.8'
        )
        
        .to('.scene-2-wrapper', { opacity: 1, duration: 1.0 }, 'warp2+=5.0') 
        .fromTo('.scene-2-bg', 
          { scale: 0.1, opacity: 0, rotationZ: 15 }, 
          { scale: 1, opacity: 1, rotationZ: 0, duration: 2, ease: "power3.out" }, 
          'warp2+=5.5'
        )
        .fromTo('.scene-2-title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp2+=6.5')
        
        .fromTo('.scene-2-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 'warp2+=7.0')
        .to({}, { duration: 1.5 })
        .to('.scene-2-part1', { opacity: 0, scale: 1.1, duration: 0.4 })
        
        .fromTo('.scene-2-part2', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" })
        .to({}, { duration: 1.5 })
        
        .to('.scene-2-bg, .scene-2-title, .scene-2-part2', { opacity: 0, scale: 1.1, duration: 0.5 })

      // ==========================================
      // SCENE 3: GOOGLE UI/UX (Slide In Foreground)
      // ==========================================
        .addLabel('warp3')
        .to(cameraRigRef.current, { z: 8000, ease: "power1.inOut", duration: 6.5 }, 'warp3')
        
        .fromTo('.era-3-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.2, stagger: 0.9, ease: "power2.out" }, 
          'warp3+=0.5'
        )
        .to('.era-3-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 0.5, stagger: 0.9, ease: "power3.in" }, 
          'warp3+=1.8'
        )
        
        .to('.scene-3-wrapper', { opacity: 1, duration: 1.0 }, 'warp3+=5.0') 
        .fromTo('.scene-3-bg', 
          { scale: 0.1, opacity: 0, rotationZ: 15 }, 
          { scale: 1, opacity: 1, rotationZ: 0, duration: 2, ease: "power3.out" }, 
          'warp3+=5.5'
        )
        .fromTo('.scene-3-title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp3+=6.5')
        
        // Slide in from Left
        .fromTo('.scene-3-part1', { opacity: 0, x: "-50vw" }, { opacity: 1, x: "0vw", duration: 1.0, ease: "power2.out" }, 'warp3+=7.0')
        .to({}, { duration: 1.5 })
        // Slide out to Right
        .to('.scene-3-part1', { opacity: 0, x: "50vw", duration: 0.6 })

        // Slide in from Right
        .fromTo('.scene-3-part2', { opacity: 0, x: "50vw" }, { opacity: 1, x: "0vw", duration: 1.0, ease: "power2.out" })
        .to({}, { duration: 1.5 })
        
        .to('.scene-3-bg, .scene-3-title, .scene-3-part2', { opacity: 0, scale: 1.1, duration: 0.5 })

      // ==========================================
      // SCENE 4: PC PROFESSOR (Fade In Foreground)
      // ==========================================
        .addLabel('warp4')
        .to(cameraRigRef.current, { z: 12000, ease: "power1.inOut", duration: 6.5 }, 'warp4')
        
        .fromTo('.era-4-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.2, stagger: 0.9, ease: "power2.out" }, 
          'warp4+=0.5'
        )
        .to('.era-4-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 0.5, stagger: 0.9, ease: "power3.in" }, 
          'warp4+=1.8'
        )
        
        .to('.scene-4-wrapper', { opacity: 1, duration: 1.0 }, 'warp4+=5.0') 
        .fromTo('.scene-4-bg', 
           { scale: 0.1, opacity: 0, rotationZ: 15 }, 
           { scale: 1, opacity: 1, rotationZ: 0, duration: 2, ease: "power3.out" }, 
           'warp4+=5.5'
        )
        .fromTo('.scene-4-title', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp4+=6.5')
        
        // Webmaster fades in
        .fromTo('.scene-4-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 'warp4+=7.0')
        .to({}, { duration: 1.5 }) 
        .to('.scene-4-part1', { opacity: 0, scale: 1.1, duration: 0.4 })

        // Tech Stack fades in
        .fromTo('.scene-4-part2', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" })
        .to({}, { duration: 1.5 }) 

        .to('.scene-4-part2, .scene-4-bg, .scene-4-title', { opacity: 0, scale: 1.1, duration: 0.5 })

      // ==========================================
      // SCENE 5: AI FUTURE (Fade In Foreground)
      // ==========================================
        .addLabel('warp5')
        .to(cameraRigRef.current, { z: 16000, ease: "power1.inOut", duration: 6.5 }, 'warp5')
        
        .fromTo('.era-5-flyby', 
          { xPercent: -50, yPercent: -50, x: "0vw", y: "0vh", scale: 0, opacity: 0, rotationZ: 0 }, 
          { x: (_, el) => `${el.dataset.x}vw`, y: (_, el) => `${el.dataset.y}vh`, scale: 1, opacity: 1, rotationZ: (_, el) => el.dataset.rotate, duration: 1.2, stagger: 0.9, ease: "power2.out" }, 
          'warp5+=0.5'
        )
        .to('.era-5-flyby', 
          { x: (_, el) => `${Number(el.dataset.x) * 3}vw`, y: (_, el) => `${Number(el.dataset.y) * 3}vh`, scale: 3, opacity: 0, duration: 0.5, stagger: 0.9, ease: "power3.in" }, 
          'warp5+=1.8'
        )
        
        .to('.scene-5-wrapper', { opacity: 1, duration: 1.0 }, 'warp5+=5.0') 
        .fromTo('.scene-5-bg', 
           { scale: 0.1, opacity: 0, rotationZ: 15 }, 
           { scale: 1, opacity: 1, rotationZ: 0, duration: 2, ease: "power3.out" }, 
           'warp5+=5.5'
        )
        .fromTo('.scene-5-text-overlay', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }, 'warp5+=6.5')
        
        .fromTo('.scene-5-assist', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" }, 'warp5+=7.0')
        .to({}, { duration: 1.5 })
        .to('.scene-5-assist', { opacity: 0, scale: 1.1, duration: 0.5 })

        .fromTo('.scene-5-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 1.0, ease: "power2.out" })
        .to({}, { duration: 2.5 })
        
        .addLabel('hideAgents')
        .to('.scene-5-part1', { opacity: 0, scale: 1.1, duration: 0.5 }, 'hideAgents')
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

  // ==========================================
  // DEV TOOL WORKFLOW  (Commented out for Production)
  // Keeps your scroll position saved when you refresh the page!
  // ==========================================
  
  useEffect(() => {
    const savedScroll = sessionStorage.getItem("dev-scroll-pos");
    if (savedScroll) {
      setTimeout(() => window.scrollTo(0, parseInt(savedScroll)), 100);
    }
    const handleScroll = () => {
      sessionStorage.setItem("dev-scroll-pos", window.scrollY.toString());
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ==========================================
  // DEV TOOL JUMP FUNCTION (Commented out for Production)
  // ==========================================
  
  const handleJump = (label: string) => {
    const tl = gsap.getById("storyTimeline") as gsap.core.Timeline;
    if (tl && tl.scrollTrigger) {
      const st = tl.scrollTrigger;
      const labelTime = tl.labels[label];
      const scrollPos = st.start + (labelTime / tl.duration()) * (st.end - st.start);
      window.scrollTo({ top: scrollPos, behavior: 'smooth' });
    }
  };

  // ==========================================
  // AUTOSCROLL LISTENER
  // ==========================================
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
    
    window.addEventListener("wheel", handleManualScroll, { passive: true });
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

      {/* DEV TOOLS JUMP MENU - Commented out for Production */}
      <div className="fixed bottom-4 left-4 z-[9999] flex flex-col gap-1 bg-black/80 p-2 rounded-lg border border-white/20 shadow-2xl ">
        <span className="text-[10px] text-gray-400 font-mono text-center uppercase tracking-widest mb-1 border-b border-white/20 pb-1">Dev Jump</span>
        <button onClick={(e) => { e.stopPropagation(); handleJump('warp2'); }} className="text-xs text-white p-1 hover:bg-blue-600 rounded">Scene 1 (Bedroom)</button>
        <button onClick={(e) => { e.stopPropagation(); handleJump('warp3'); }} className="text-xs text-white p-1 hover:bg-red-600 rounded">Scene 2 (ITT)</button>
        <button onClick={(e) => { e.stopPropagation(); handleJump('warp4'); }} className="text-xs text-white p-1 hover:bg-blue-400 rounded">Scene 3 (UX/UI)</button>
        <button onClick={(e) => { e.stopPropagation(); handleJump('warp5'); }} className="text-xs text-white p-1 hover:bg-teal-600 rounded">Scene 4 (PC Prof)</button>
        <button onClick={(e) => { e.stopPropagation(); handleJump('hideAgents'); }} className="text-xs text-white p-1 hover:bg-purple-600 rounded">Scene 5 (Future)</button>
      </div>

      {/* CONTROLS MENU */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-[100] flex gap-2 md:gap-4">
        <button 
          onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); }}
          aria-label={isAutoPlaying ? "Pause Journey" : "Auto-scroll Journey"}
          aria-pressed={isAutoPlaying}
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 bg-black/50 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:border-white/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white">
          {isAutoPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          aria-label={isAudioEnabled ? "Mute Journey Audio" : "Enable Journey Audio"}
          aria-pressed={isAudioEnabled}
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 bg-black/50 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:border-white/70 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white">
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
        <FlybyItem eraClass="era-1-flyby" z={3500} xOffset={-25} yOffset={-18} rotate={-15} label="Motorola Razr" imageUrl={`${imgBase}razr_v3_spinning.jpg`}/>
        <FlybyItem eraClass="era-1-flyby" z={2500} xOffset={25} yOffset={18} rotate={10} label="iPod Classic" imageUrl={`${imgBase}ipod_classic_clickwheel.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={1500} xOffset={-20} yOffset={20} rotate={-5} label="Myspace"imageUrl={`${imgBase}top8_grid.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={500} xOffset={25} yOffset={-18} rotate={15} label="Wii" imageUrl={`${imgBase}wii_remote.jpg`}/>

        {/* ================= SCENE 1: BEDROOM ================= */}
        <div className="scene-1-wrapper absolute inset-0 w-full h-full opacity-0 overflow-hidden" style={{ transform: "translateZ(0px)" }}>
          <div className="scene-1-title opacity-0 absolute top-10 sm:top-5 md:top-16 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 border border-cyan-500/50 rounded-full z-[60] pointer-events-none w-[90%] sm:w-[60%] md:w-auto text-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <p className="text-cyan-100 text-sm md:text-lg font-mono font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              - My First Encounter With HTML & CSS
            </p>
          </div>
          
          <div className="scene-1-bg absolute inset-0 w-full h-full opacity-0 origin-center pointer-events-none">
            <img src={`${imgBase}scene1_bedroom_crt.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80 transform-gpu" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mt-10">
             
             <div className="glow-container scene-1-part1 absolute z-20 flex flex-col items-center justify-center p-1  rounded-xl opacity-0 shadow-2xl w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="flex-1 w-full  min-h-0 flex items-center justify-center ">
                     <img src={`${imgBase}myspace11.avif`} alt="Early Web Profile" className="w-full h-full object-contain rounded drop-shadow-lg" />
                 </div>
                 <h2 className="background-text text-blue-600 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">:::myspace(html/css)</h2>
             </div>

             <div className="scene-1-part2 absolute z-20 flex flex-col items-center justify-center p-1  rounded-xl opacity-0 shadow-2xl w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="flex-1 w-full min-h-0 flex items-center justify-center mb-4">
                     <img src={`${imgBase}yahooaim11.avif`} alt="Classic Chat Interface" className="w-full h-full object-contain rounded drop-shadow-lg" />
                 </div>
                 <h2 className="text-yellow-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">YAHOO CHAT(JAVASCRIPT)</h2>
             </div>
             
          </div>
        </div>

        {/* ================= ERA 2 FLYBYS ================= */}
        <FlybyItem eraClass="era-2-flyby" z={-500} xOffset={25} yOffset={-18} rotate={15} label="Instagram" imageUrl={`${imgBase}polaroid_icon.jpg`} />
        <FlybyItem eraClass="era-2-flyby" z={-1500} xOffset={-25} yOffset={15} rotate={-20} label="Bitcoin" imageUrl={`${imgBase}glowing_bitcoin.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-2500} xOffset={25} yOffset={20} rotate={5} label="Minecraft" imageUrl={`${imgBase}minecraft_pickaxe.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-3500} xOffset={-25} yOffset={-20} rotate={-10} label="Pokémon" imageUrl={`${imgBase}pokeball.jpg`}/>

        {/* ================= SCENE 2: ITT TECH ================= */}
        <div className="scene-2-wrapper absolute inset-0 w-full h-full opacity-0 overflow-hidden" style={{ transform: "translateZ(-4000px)" }}>
          <div className="scene-2-title opacity-0 absolute top-10 sm:top-5 md:top-16 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 border border-red-500/50 rounded-full z-[60] pointer-events-none w-[90%] sm:w-[65%] md:w-[60%] text-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
            <p className="text-red-100 text-sm md:text-lg font-mono font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              - Building My First Site & The Fall of Flash
            </p>
          </div>
          
          <div className="scene-2-bg absolute inset-0 w-full h-full opacity-0 origin-center pointer-events-none">
            <img src={`${imgBase}scene2_itt_chalkboard.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mt-10">
             
             <div className="scene-2-part1 absolute z-10 flex flex-col items-center justify-center text-white opacity-0 p-1 rounded-xl  w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="glow-container flex-1 w-full min-h-0 flex items-center justify-center ">
                     <img src={`${imgBase}ittvva11.avif`} alt="First Website Design" className="w-full h-full object-contain" />
                 </div>
                 <h2 className=" background-text text-purple-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">MY FIRST WEBSITE</h2>
             </div>
             
             <div className="scene-2-part2 absolute z-20 flex flex-col items-center justify-center text-white opacity-0 p-1 rounded-xl  w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="glow-container flex-1 w-full min-h-0 flex items-center justify-center ">
                     <img src={`${imgBase}ittclose11.avif`} alt="Newspaper Clipping" className="w-full h-full object-contain" />
                 </div>
                 <h2 className="background-text text-grey-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">ITT TECH CLOSES</h2>
             </div>

          </div>
        </div>

        {/* ================= ERA 3 FLYBYS ================= */}
        <FlybyItem eraClass="era-3-flyby" z={-4500} xOffset={-25} yOffset={18} rotate={-15} label="Figma" imageUrl={`${imgBase}figma_pen_tool.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-5500} xOffset={25} yOffset={-18} rotate={10} label="OG AirPods" imageUrl={`${imgBase}original_airpods.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-6500} xOffset={-25} yOffset={-15} rotate={-5} label="TikTok" imageUrl={`${imgBase}tiktok_glitch_logo.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-7500} xOffset={25} yOffset={20} rotate={25} label="Fortnite" imageUrl={`${imgBase}fortnite_llama.jpg`}/>

        {/* ================= SCENE 3: GOOGLE UI/UX (SLIDES IN) ================= */}
        <div className="scene-3-wrapper absolute inset-0 w-full h-full opacity-0 overflow-hidden" style={{ transform: "translateZ(-8000px)", willChange: "opacity, transform" }}>
          <div className="scene-3-title opacity-0 absolute top-10 sm:top-5 md:top-16 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 border border-blue-500/50 rounded-full z-[60] pointer-events-none w-[90%] sm:w-[60%] md:w-auto text-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <p className="text-blue-100 text-sm md:text-lg font-mono font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              - Google Certifications & Mobile Apps
            </p>
          </div>
          
          <div className="scene-3-bg absolute inset-0 w-full h-full opacity-0 origin-center pointer-events-none">
            <img src={`${imgBase}scene4_uiux_monitors.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mt-10 overflow-hidden">
             
             <div className="scene-3-part1 absolute z-10 flex flex-col items-center justify-center opacity-0 bg-blue-900/60 border-2 border-blue-400/50 rounded-xl p-4 sm:p-1 shadow-2xl w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="flex-1 w-full min-h-0">
                     <img src={`${imgBase}UX_finished_product.jpg`} alt="Finished UI Layout" className="w-full h-full object-contain rounded-lg border border-white/20 shadow-inner sm:pt-4" />
                 </div>
                 <h2 className="text-white text-xl sm:text-2xl md:text-5xl font-black tracking-widest drop-shadow-2xl mb-1 mt-2">GOOGLE UI/UX DESIGN</h2>
             </div>
             
             <div className="scene-3-part2 absolute z-20 flex flex-col items-center justify-center opacity-0 bg-blue-900/80 border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.8)] rounded-xl p-1 w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="flex-1 w-full min-h-0">
                     <img src={`${imgBase}UX_wireframe_flow_planning.jpg`} alt="UX Wireframe Flow" className="w-full h-full object-contain rounded-lg border border-blue-400/30 opacity-90 sm:pt-4 shadow-inner" />
                 </div>
                 <h2 className="text-blue-300 text-3xl sm:text-4xl font-mono uppercase tracking-widest mb-4 sm:mb-2 drop-shadow-md mt-2">Certificate</h2>
             </div>

          </div>
        </div>

        {/* ================= ERA 4 FLYBYS ================= */}
        <FlybyItem eraClass="era-4-flyby" z={-8500} xOffset={25} yOffset={-20} rotate={5} label="Zoom" imageUrl={`${imgBase}zoom_webcams_grid.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-9500} xOffset={-25} yOffset={18} rotate={-10} label="COVID-19" imageUrl={`${imgBase}masks_distancing.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-10500} xOffset={25} yOffset={20} rotate={15} label="NFTs" imageUrl={`${imgBase}bored_ape_nft.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-11500} xOffset={-25} yOffset={-18} rotate={-20} label="James Webb" imageUrl={`${imgBase}james_webb_mirror.jpg`}/>

        {/* ================= SCENE 4: PC PROFESSOR ================= */}
        <div className="scene-4-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0 overflow-hidden" style={{ transform: "translateZ(-12000px)", willChange: "opacity, transform" }}>
          
          <div className="scene-4-title opacity-0 absolute top-10 sm:top-5 md:top-16 left-1/2 transform -translate-x-1/2 bg-black/80 px-6 py-3 border border-teal-500/50 rounded-full z-[60] pointer-events-none w-[90%] sm:w-[60%] md:w-auto text-center shadow-[0_0_20px_rgba(20,184,166,0.3)]">
            <p className="text-teal-100 text-md md:text-lg font-mono font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              - Mastering the Full Stack
            </p>
          </div>
          
          <div className="scene-4-bg absolute inset-0 w-full h-full opacity-0 origin-center pointer-events-none">
            <img src={`${imgBase}scene3_pcprof_board.jpg`} alt="Room Background" className="absolute inset-0 w-full h-full object-cover opacity-60 transform-gpu" />
          </div>

          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mt-10">
             
             <div className="scene-4-part1 absolute z-10 flex flex-col items-center justify-center  rounded-xl p-1 opacity-0 shadow-2xl w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="glow-container flex-1 w-full min-h-0 flex items-center justify-center ">
                     <img src={`${imgBase}webmaster2.avif`} alt="Webmaster Coding" className="w-full h-full object-contain rounded-lg shadow-lg" />
                 </div>
                 <h2 className="background-text text-white-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">WEBMASTER</h2>
             </div>
             
             <div className="scene-4-part2 absolute z-20 flex flex-col items-center justify-center  rounded-xl p-1 opacity-0 shadow-2xl w-[90vw] md:w-auto md:h-[80vh]">
                 <div className="glow-container flex-1 w-full min-h-0 flex items-center justify-center ">
                     <img src={`${imgBase}Two_interconnected_tech_stacks2.avif`} alt="Tech Stack Architecture" className="w-full h-full object-contain rounded-lg shadow-lg" />
                 </div>
                 <h2 className="background-text text-white-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">MEAN/MERN STACK</h2>
             </div>

          </div>
        </div>

        {/* ================= ERA 5 FLYBYS ================= */}
        <FlybyItem eraClass="era-5-flyby" z={-12500} xOffset={-25} yOffset={-15} rotate={-5} label="AR/VR Headset" imageUrl={`${imgBase}ar_vr_headset.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-13500} xOffset={25} yOffset={-18} rotate={10} label="Neural Mesh" imageUrl={`${imgBase}neural_network_mesh.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-14500} xOffset={-25} yOffset={20} rotate={-15} label="Robotic Hand" imageUrl={`${imgBase}robotic_hand.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-15500} xOffset={25} yOffset={18} rotate={20} label="Hologram UI" imageUrl={`${imgBase}holographic_ui_panels.jpg`}/>

        

        {/* ================= SCENE 5: AI FUTURE ================= */}
        <div className="scene-5-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-16000px)" }}>
          {/* UPDATED: Bolder text, kept at top */}
          <div className="scene-5-text-overlay opacity-0 absolute top-30 sm:top-4 lg:top-10 left-1/2 transform -translate-x-1/2 bg-black/80 px-6  py-3 border border-white/50 rounded-full z-[100] pointer-events-none w-[90%] sm:w-[60%] md:w-auto text-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
            <p className="text-white text-md md:text-lg font-mono font-black uppercase tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              - My first AI assist, AI Agent
            </p>
          </div>
          
          <div className="scene-5-pan-zoom absolute inset-0 w-full h-full">
             <img src={`${imgBase}scene5_cyberpunk_ultrawide.jpg`} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover opacity-50 transform-gpu" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center p-4 z-10 pointer-events-none">
              <div className="scene-5-assist absolute top:1 md:top:1 sm:top-10 inset-0 flex flex-col items-center justify-center opacity-0 z-20 pointer-events-none">
                  <img src={`${imgBase}code_assist.jpg`} alt="AI Code Assistant UI" className="max-w-xl lg:max-w-3xl 2xl:max-w-4xl w-[90%] md:w-[80%] sm:w-[40%] rounded-xl shadow-[0_0_40px_rgba(59,130,246,0.4)] border border-white/10" />
                  <h2 className="text-blue-400 text-2xl sm:text-2xl lg:text-4xl 2xl:text-5xl font-mono mt-6 sm:mt-1 font-bold tracking-widest drop-shadow-md">AI ASSISTANT</h2>
              </div>
              
              <div className="scene-5-part1 absolute w-[95%] md:top-25 sm:top-15 sm:w-[45%] md:w-full max-w-3xl lg:max-w-4xl 2xl:max-w-6xl flex flex-col items-center justify-center opacity-0 z-30 pointer-events-none">
                  <div className="w-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)] border border-gray-700">
                     <div className="bg-[#2d2d2d] px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2">
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                         <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                         <span className="text-gray-400 font-mono text-[10px] md:text-xs ml-2 md:ml-4">ai_agents_deploy.sh</span>
                     </div>
                     <div className="p-1 bg-black relative">
                         <img src={`${imgBase}ai_agents_terminal.gif`} alt="AI Autonomous Agents Terminal" className="w-full h-auto object-cover opacity-90 mix-blend-screen transform-gpu" />
                     </div>
                  </div>
                  <h2 className="text-purple-400 text-2xl sm:text-3xl md:text-5xl 2xl:text-6xl font-mono mt-6 sm:mt-2 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">AUTONOMOUS AGENTS</h2>
                  <p className="text-sm md:text-lg 2xl:text-2xl text-gray-400 mt-2 md:mt-4 font-mono text-center">The machines write the code. I architect the reality.</p>
              </div>

              <div className="scene-5-question absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 z-40 pointer-events-none">
                  <h2 className="text-white text-3xl sm:text-4xl md:text-7xl 2xl:text-8xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-center max-w-5xl 2xl:max-w-7xl leading-tight drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] px-4">
                     What is our future<br/>with AI?
                  </h2>
              </div>

              <div className="scene-5-part3 absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 z-50 pointer-events-auto">
                <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full opacity-60">
                    
                    {/* PANEL 0 */}
                    <div 
                        className={`relative group h-full transform-gpu border-b md:border-b-0 md:border-r border-white/20 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden min-w-0 ${
                            hoveredFuture === 0 ? 'flex-[4]' : 'flex-1'
                        } ${hoveredFuture !== null && hoveredFuture !== 0 ? 'brightness-[0.3]' : 'brightness-100'}`}
                        onMouseEnter={() => setHoveredFuture(0)}
                        onMouseLeave={() => setHoveredFuture(null)}
                        onClick={() => setHoveredFuture(hoveredFuture === 0 ? null : 0)}
                    >
                        <img src={`${imgBase}future_tools.jpg`} alt="AI as Tools" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-500 md:ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Mere Tools</span>
                        </div>
                    </div>

                    {/* PANEL 1 */}
                    <div 
                        className={`relative group h-full transform-gpu border-b md:border-b-0 md:border-r border-white/20 z-10 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden min-w-0 ${
                            hoveredFuture === 1 ? 'flex-[4]' : 'flex-1'
                        } ${hoveredFuture !== null && hoveredFuture !== 1 ? 'brightness-[0.3]' : 'brightness-100'}`}
                        onMouseEnter={() => setHoveredFuture(1)}
                        onMouseLeave={() => setHoveredFuture(null)}
                        onClick={() => setHoveredFuture(hoveredFuture === 1 ? null : 1)}
                    >
                        <img src={`${imgBase}future_colleagues.jpg`} alt="AI as Colleagues" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-500 md:ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Side by Side</span>
                        </div>
                    </div>

                    {/* PANEL 2 */}
                    <div 
                        className={`relative group h-full transform-gpu transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] cursor-pointer overflow-hidden min-w-0 ${
                            hoveredFuture === 2 ? 'flex-[4]' : 'flex-1'
                        } ${hoveredFuture !== null && hoveredFuture !== 2 ? 'brightness-[0.3]' : 'brightness-100'}`}
                        onMouseEnter={() => setHoveredFuture(2)}
                        onMouseLeave={() => setHoveredFuture(null)}
                        onClick={() => setHoveredFuture(hoveredFuture === 2 ? null : 2)}
                    >
                        <img src={`${imgBase}future_downfall2.jpg`} alt="AI as Downfall" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-500 md:ease-[cubic-bezier(0.25,1,0.5,1)] group-hover:grayscale-0 group-hover:scale-105 transform-gpu" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-8 md:bottom-[10%] flex justify-center opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl whitespace-nowrap">Our Downfall?</span>
                        </div>
                    </div>

                </div>

                <div 
    className="relative z-20 flex flex-col items-center p-6 md:p-14 bg-black/70 rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] w-[90%] md:w-auto"
    onMouseEnter={() => setHoveredFuture(null)}
>
    {/* Small context question added here */}
    <h4 className="text-gray-400 text-[10px] md:text-xs uppercase tracking-widest mb-2 font-light opacity-70 text-center">
        What is our future with AI?
    </h4>
    
    <h3 className="text-gray-300 text-xs sm:text-sm md:text-xl 2xl:text-3xl uppercase tracking-[0.3em] md:tracking-[0.6em] mb-6 md:mb-12 font-light text-center drop-shadow-md">
        The Choice is Ours
    </h3>
    
    <button 
      onClick={onStoryComplete} 
      className="px-6 md:px-14 py-3 md:py-6 bg-white text-black font-black text-sm md:text-2xl 2xl:text-4xl uppercase tracking-[0.1em] md:tracking-[0.3em] hover:bg-purple-600 hover:text-white hover:scale-105 transition-all duration-300 rounded-sm pointer-events-auto shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.8)] whitespace-nowrap focus:outline-none focus:ring-4 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-black"
    >
        Enter the Museum
    </button>
</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.9)_100%)] z-10"></div>
    </div>
  );
}