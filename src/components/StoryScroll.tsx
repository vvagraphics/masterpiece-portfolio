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

const FlybyItem = ({ eraClass, z, x, y, rotate, label }: { eraClass: string, z: number, x: string, y: string, rotate: number, label: string }) => (
  <div className={`${eraClass} absolute w-64 h-64 flex items-center justify-center bg-black/50 backdrop-blur-md border border-white/20 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center p-4 opacity-0`} 
       style={{ transform: `translateZ(${z}px) rotateZ(${rotate}deg)`, top: y, left: x }}>
    <span className="text-white font-mono text-sm uppercase">{label}</span>
  </div>
);

export default function StoryScroll({ onStoryComplete, isAudioEnabled, toggleAudio }: StoryScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRigRef = useRef<HTMLDivElement>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  
  const imgBase = "http://mr3anderson.pro/masterpiece-portfolio/";
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useLayoutEffect(() => {
    if (!cameraRigRef.current || !containerRef.current || prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=4500%', 
          scrub: 1,     
          pin: true,     
        }
      });

      tl.to('.scroll-hint', { opacity: 0, duration: 0.5, ease: "power2.out" })

      // ==========================================
      // 1. APPROACH SCENE 1 (Z: -4000 -> 0)
      // ==========================================
        .addLabel('approach1')
        .to(cameraRigRef.current, { z: 0, ease: "power1.inOut", duration: 5 }, 'approach1')
        .to('.era-1-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'approach1+=1')
        .to('.era-1-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'approach1+=2')
        .to('.scene-1-wrapper', { opacity: 1, duration: 2 }, 'approach1+=3') // Fade in scene right before arrival
        .to({}, { duration: 1 }) 

      // --- SCENE 1: BEDROOM (Pop-in elastic animation for old monitor UI) ---
        .fromTo('.scene-1-myspace', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-myspace', { scale: 1.2, opacity: 0, duration: 0.4 })
        
        .fromTo('.scene-1-yahoo', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-yahoo', { scale: 1.2, opacity: 0, duration: 0.4 })

      // ==========================================
      // 2. WARP TO SCENE 2 (FLY THROUGH SCENE 1) (Z: 0 -> 5000)
      // ==========================================
        .addLabel('warp2')
        .to(cameraRigRef.current, { z: 5000, ease: "power2.inOut", duration: 5 }, 'warp2')
        .to('.scene-1-wrapper', { opacity: 0, duration: 1.5 }, 'warp2') // Fly through & fade out scene 1
        
        .to('.era-2-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp2+=1')
        .to('.era-2-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp2+=2')
        .to('.scene-2-wrapper', { opacity: 1, duration: 2 }, 'warp2+=3') // Fade in scene 2
        .to({}, { duration: 1 }) 
        
      // --- SCENE 2: ITT TECH (3D Chalkboard swing down) ---
        .fromTo('.scene-2-content', { opacity: 0, rotationX: -90, transformOrigin: "top center" }, { opacity: 1, rotationX: 0, duration: 0.8, ease: "bounce.out" })
        .to({}, { duration: 2 })
        .to('.scene-2-content', { opacity: 0, y: 50, duration: 0.5 })
        
      // ==========================================
      // 3. WARP TO SCENE 3 (Z: 5000 -> 10000)
      // ==========================================
        .addLabel('warp3')
        .to(cameraRigRef.current, { z: 10000, ease: "power2.inOut", duration: 5 }, 'warp3')
        .to('.scene-2-wrapper', { opacity: 0, duration: 1.5 }, 'warp3') // Fly through scene 2
        
        .to('.era-3-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp3+=1')
        .to('.era-3-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp3+=2')
        .to('.scene-3-wrapper', { opacity: 1, duration: 2 }, 'warp3+=3') // Fade in scene 3
        .to({}, { duration: 1 }) 
        
      // --- SCENE 3: PC PROFESSOR (Blur reveal) ---
        .fromTo('.scene-3-content', { opacity: 0, filter: "blur(20px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.8 })
        .to({}, { duration: 2 }) 
        .to('.scene-3-content', { opacity: 0, filter: "blur(10px)", scale: 1.1, duration: 0.5 })

      // ==========================================
      // 4. WARP TO SCENE 4 (Z: 10000 -> 15000)
      // ==========================================
        .addLabel('warp4')
        .to(cameraRigRef.current, { z: 15000, ease: "power2.inOut", duration: 5 }, 'warp4')
        .to('.scene-3-wrapper', { opacity: 0, duration: 1.5 }, 'warp4') // Fly through scene 3
        
        .to('.era-4-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp4+=1')
        .to('.era-4-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp4+=2')
        .to('.scene-4-wrapper', { opacity: 1, duration: 2 }, 'warp4+=3') // Fade in scene 4
        .to({}, { duration: 1 }) 
        
      // --- SCENE 4: GOOGLE UI/UX (Slide in from sides) ---
        .fromTo('.scene-4-left', { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 0.5 })
        .fromTo('.scene-4-right', { opacity: 0, x: 100 }, { opacity: 1, x: 0, duration: 0.5 }, "<")
        .to({}, { duration: 2 })
        .to('.scene-4-content', { opacity: 0, duration: 0.5 })

      // ==========================================
      // 5. WARP TO SCENE 5 (Z: 15000 -> 20000)
      // ==========================================
        .addLabel('warp5')
        .to(cameraRigRef.current, { z: 20000, ease: "power2.inOut", duration: 5 }, 'warp5')
        .to('.scene-4-wrapper', { opacity: 0, duration: 1.5 }, 'warp5') // Fly through scene 4
        
        .to('.era-5-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp5+=1')
        .to('.era-5-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp5+=2')
        .to('.scene-5-wrapper', { opacity: 1, duration: 2 }, 'warp5+=3') // Fade in scene 5
        .to({}, { duration: 1 }) 
        
      // --- SCENE 5: AI FUTURE (Ominous slow zoom in) ---
        .fromTo('.scene-5-content', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" })
        .to({}, { duration: 4 }); 

    }, containerRef);

    return () => ctx.revert();
  }, [prefersReducedMotion]);

  useEffect(() => {
    let autoScrollTween: gsap.core.Tween;
    if (isAutoPlaying) {
      autoScrollTween = gsap.to(window, {
        scrollTo: "max",
        duration: 90, 
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

      <div className="fixed top-8 right-8 z-[100] flex gap-4">
        <button onClick={(e) => { e.stopPropagation(); setIsAutoPlaying(!isAutoPlaying); }}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all bg-black/50 backdrop-blur-md"
          style={{ borderColor: isAutoPlaying ? '#10b981' : '#52525b', color: isAutoPlaying ? '#10b981' : '#52525b' }}>
          {isAutoPlaying ? "⏸" : "▶️"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          className="flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all bg-black/50 backdrop-blur-md"
          style={{ borderColor: isAudioEnabled ? '#ef4444' : '#52525b', color: isAudioEnabled ? '#ef4444' : '#52525b' }}>
          {isAudioEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="scroll-hint absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
        <h1 className="text-5xl font-light tracking-[0.3em] uppercase mb-4 opacity-80">The Temporal Journey</h1>
        <p className="text-sm tracking-widest uppercase text-gray-400 mb-8 animate-pulse">Scroll to Initiate Jump</p>
      </div>

      <div ref={cameraRigRef} className="absolute inset-0 w-full h-full"
        style={{ transformStyle: "preserve-3d", transform: "translateZ(-4000px)" }}>
        
        {/* ================= ERA 1 FLYBYS (Z: 3000 -> 500) ================= */}
        <FlybyItem eraClass="era-1-flyby" z={3000} x="10%" y="20%" rotate={-15} label="Motorola Razr V3 (Spinning)" />
        <FlybyItem eraClass="era-1-flyby" z={2000} x="70%" y="60%" rotate={10} label="iPod Classic with Click-Wheel" />
        <FlybyItem eraClass="era-1-flyby" z={1000} x="20%" y="70%" rotate={-5} label="Top 8 Profile Grid" />
        <FlybyItem eraClass="era-1-flyby" z={500} x="80%" y="30%" rotate={25} label="Nintendo Wii Remote" />

        {/* ================= SCENE 1: BEDROOM (Z=0) ================= */}
        <div className="scene-1-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(0px)" }}>
          <img src={`${imgBase}scene1_bedroom_crt.jpeg`} alt="90s Bedroom" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] flex items-center justify-center">
             <div className="scene-1-myspace absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 border border-blue-900 rounded-lg opacity-0">
                 <img src={`${imgBase}MySpace_profile_page_2004.jpeg`} className="w-full h-32 object-cover mb-2 rounded" />
                 <h2 className="text-blue-500 text-2xl font-bold font-mono">:::myspace</h2>
             </div>
             <div className="scene-1-yahoo absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 border border-yellow-700 rounded-lg opacity-0">
                 <img src={`${imgBase}Yahoo_chat.jpeg`} className="w-full h-32 object-cover mb-2 rounded" />
                 <h2 className="text-yellow-500 text-2xl font-bold font-mono">Yahoo/A.I.M</h2>
             </div>
          </div>
        </div>

        {/* ================= ERA 2 FLYBYS (Z: -1000 -> -4000) ================= */}
        <FlybyItem eraClass="era-2-flyby" z={-1000} x="75%" y="20%" rotate={15} label="Retro Polaroid Icon" />
        <FlybyItem eraClass="era-2-flyby" z={-2000} x="15%" y="65%" rotate={-20} label="Glowing Bitcoin" />
        <FlybyItem eraClass="era-2-flyby" z={-3000} x="85%" y="50%" rotate={5} label="Minecraft Pickaxe" />
        <FlybyItem eraClass="era-2-flyby" z={-4000} x="10%" y="30%" rotate={-10} label="Pokéball" />

        {/* ================= SCENE 2: ITT TECH (Z=-5000) ================= */}
        <div className="scene-2-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-5000px)" }}>
          <img src={`${imgBase}scene2_itt_chalkboard.jpeg`} alt="ITT Tech Classroom" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="scene-2-content absolute top-[25%] left-[25%] w-[50%] h-[40%] flex flex-col items-center justify-center text-white opacity-0">
             <img src={`${imgBase}Newspaper_clipping_ITT_closes.jpeg`} className="w-48 mb-4 border-2 border-red-900 rotate-3 shadow-2xl" />
             <h2 className="text-red-500 text-5xl font-black uppercase tracking-widest border-b-4 border-red-500 pb-2 mb-4">The Raw Era</h2>
          </div>
        </div>

        {/* ================= ERA 3 FLYBYS (Z: -6000 -> -9000) ================= */}
        <FlybyItem eraClass="era-3-flyby" z={-6000} x="20%" y="70%" rotate={-15} label="Figma Pen Tool" />
        <FlybyItem eraClass="era-3-flyby" z={-7000} x="80%" y="25%" rotate={10} label="Original AirPods" />
        <FlybyItem eraClass="era-3-flyby" z={-8000} x="15%" y="30%" rotate={-5} label="TikTok Glitch Logo" />
        <FlybyItem eraClass="era-3-flyby" z={-9000} x="75%" y="60%" rotate={25} label="Fortnite Llama" />

        {/* ================= SCENE 3: PC PROFESSOR (Z=-10000) ================= */}
        <div className="scene-3-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-10000px)" }}>
          <img src={`${imgBase}scene3_pcprof_board.jpeg`} alt="PC Professor" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="scene-3-content absolute top-[30%] left-[30%] w-[40%] h-[40%] flex flex-col items-center justify-center bg-teal-900/40 backdrop-blur-sm border border-teal-500/50 rounded-xl p-8 opacity-0">
             <img src={`${imgBase}Two_interconnected_tech_stacks.jpeg`} className="w-full h-48 object-cover mb-4 rounded-lg shadow-2xl" />
             <h2 className="text-teal-400 text-4xl font-semibold mb-2">STRUCTURE & LOGIC</h2>
          </div>
        </div>

        {/* ================= ERA 4 FLYBYS (Z: -11000 -> -14000) ================= */}
        <FlybyItem eraClass="era-4-flyby" z={-11000} x="70%" y="30%" rotate={5} label="Zoom Webcams Grid" />
        <FlybyItem eraClass="era-4-flyby" z={-12000} x="10%" y="60%" rotate={-10} label="Masks Distancing" />
        <FlybyItem eraClass="era-4-flyby" z={-13000} x="80%" y="70%" rotate={15} label="Bored Ape NFT" />
        <FlybyItem eraClass="era-4-flyby" z={-14000} x="20%" y="20%" rotate={-20} label="James Webb Mirror" />

        {/* ================= SCENE 4: GOOGLE UI/UX (Z=-15000) ================= */}
        <div className="scene-4-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-15000px)" }}>
          <img src={`${imgBase}scene4_uiux_monitors.jpeg`} alt="Workspace" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="scene-4-content absolute top-[40%] left-[20%] w-[60%] h-[30%] flex justify-between items-center px-10">
             <div className="scene-4-left text-blue-400 font-bold text-3xl">Wireframes</div>
             <h2 className="text-white text-6xl font-black tracking-widest z-10">GOOGLE COLLAB</h2>
             <div className="scene-4-right text-blue-400 font-bold text-3xl">Prototypes</div>
          </div>
        </div>

        {/* ================= ERA 5 FLYBYS (Z: -16000 -> -19000) ================= */}
        <FlybyItem eraClass="era-5-flyby" z={-16000} x="15%" y="40%" rotate={-5} label="AR/VR Headset" />
        <FlybyItem eraClass="era-5-flyby" z={-17000} x="85%" y="30%" rotate={10} label="Neural Network Mesh" />
        <FlybyItem eraClass="era-5-flyby" z={-18000} x="25%" y="70%" rotate={-15} label="Robotic Hand" />
        <FlybyItem eraClass="era-5-flyby" z={-19000} x="75%" y="60%" rotate={20} label="Holographic UI Panels" />

        {/* ================= SCENE 5: AI FUTURE (Z=-20000) ================= */}
        <div className="scene-5-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-20000px)" }}>
          <img src={`${imgBase}scene5_cyberpunk_ultrawide.jpeg`} alt="AI Future" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="scene-5-content absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-50 opacity-0">
             <h2 className="text-purple-500 text-6xl font-bold mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">AUTONOMOUS AGENTS</h2>
             <button onClick={onStoryComplete} className="mt-12 px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-purple-500 hover:text-white hover:scale-110 transition-all rounded-sm pointer-events-auto">
                Enter the Museum
             </button>
          </div>
        </div>

      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.9)_100%)] z-10"></div>
    </div>
  );
}