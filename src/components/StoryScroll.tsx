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

const FlybyItem = ({ eraClass, z, x, y, rotate, label, imageUrl }: { 
  eraClass: string, 
  z: number, 
  x: string, 
  y: string, 
  rotate: number, 
  label: string,
  imageUrl: string
}) => (
  // PERFORMANCE FIX: Removed inline willChange. GSAP handles this natively now.
  <div className={`${eraClass} absolute w-64 h-64 md:w-80 md:h-80 flex flex-col items-center justify-center bg-black/80 border border-white/20 rounded-2xl shadow-lg text-center p-4 md:p-6 opacity-0 pointer-events-none`} 
       style={{ transform: `translateZ(${z}px) rotateZ(${rotate}deg)`, top: y, left: x }}>
    <img src={imageUrl} alt={label} className="w-40 h-40 md:w-56 md:h-56 object-contain mb-2 md:mb-4" />
    <span className="text-white font-black font-mono text-sm md:text-lg uppercase tracking-widest bg-black/90 px-4 md:px-5 py-2 rounded-full border border-white/10">{label}</span>
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
      // PERFORMANCE FIX: Added a default force3D to ensure GPU offloading without memory leaks
      gsap.defaults({ force3D: true });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: '+=10000%', 
          scrub: 1,     
          pin: true,     
        }
      });

      tl.to('.scroll-hint', { opacity: 0, duration: 0.5, ease: "power2.out" })

      // ==========================================
      // 1. APPROACH SCENE 1
      // ==========================================
        .addLabel('warp1')
        .to(cameraRigRef.current, { z: 0, ease: "power1.inOut", duration: 6 }, 'warp1')
        .fromTo('.era-1-flyby', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.7, ease: "power2.out" }, 'warp1+=0.5')
        .to('.era-1-flyby', { opacity: 0, scale: 1.5, duration: 1.2, stagger: 0.7, ease: "power2.in" }, 'warp1+=1.5')
        .to('.scene-1-wrapper', { opacity: 1, duration: 1.5 }, 'warp1+=4.5')
        
        // Scene 1 Background Pan & Zoom
        .to('.scene-1-bg', { scale: 1.6, xPercent: 12, yPercent: 15, duration: 2, ease: "power2.inOut" }, 'warp1+=5')
        .to({}, { duration: 0.5 }) 

      // --- SCENE 1: BEDROOM ---
        .fromTo('.scene-1-part1', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-part1', { scale: 1.1, opacity: 0, duration: 0.4 })
        
        .fromTo('.scene-1-part2', { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-part2', { scale: 1.1, opacity: 0, duration: 0.4 })

      // ==========================================
      // 2. WARP TO SCENE 2
      // ==========================================
        .addLabel('warp2')
        .to(cameraRigRef.current, { z: 5000, ease: "power1.inOut", duration: 6 }, 'warp2')
        .to('.scene-1-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp2') 
        .fromTo('.era-2-flyby', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.7, ease: "power2.out" }, 'warp2+=1.5')
        .to('.era-2-flyby', { opacity: 0, scale: 1.5, duration: 1.2, stagger: 0.7, ease: "power2.in" }, 'warp2+=2.5')
        .to('.scene-2-wrapper', { opacity: 1, duration: 1.5 }, 'warp2+=4.5') 
        
        // Scene 2 Background Pan & Zoom: Zoom in and up, slight move right
        .to('.scene-2-bg', { scale: 1.5, xPercent: -2, yPercent: 15, duration: 2, ease: "power2.inOut" }, 'warp2+=5')
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
        .to(cameraRigRef.current, { z: 10000, ease: "power1.inOut", duration: 6 }, 'warp3')
        .to('.scene-2-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp3') 
        .fromTo('.era-3-flyby', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.7, ease: "power2.out" }, 'warp3+=1.5')
        .to('.era-3-flyby', { opacity: 0, scale: 1.5, duration: 1.2, stagger: 0.7, ease: "power2.in" }, 'warp3+=2.5')
        .to('.scene-3-wrapper', { opacity: 1, duration: 1.5 }, 'warp3+=4.5') 
        
        // Scene 3 Background Pan & Zoom: Top left corner 
        .to('.scene-3-bg', { scale: 1.6, xPercent: 15, yPercent: 18, duration: 2, ease: "power2.inOut" }, 'warp3+=5')
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 3: PC PROFESSOR ---
        .fromTo('.scene-3-part1', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-3-part1', { opacity: 0, scale: 1.1, duration: 0.4 })

        .fromTo('.scene-3-part2', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-3-part2', { opacity: 0, scale: 1.1, duration: 0.4 })

      // ==========================================
      // 4. WARP TO SCENE 4 
      // ==========================================
        .addLabel('warp4')
        .to(cameraRigRef.current, { z: 15000, ease: "power1.inOut", duration: 6 }, 'warp4')
        .to('.scene-3-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp4') 
        .fromTo('.era-4-flyby', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.7, ease: "power2.out" }, 'warp4+=1.5')
        .to('.era-4-flyby', { opacity: 0, scale: 1.5, duration: 1.2, stagger: 0.7, ease: "power2.in" }, 'warp4+=2.5')
        .to('.scene-4-wrapper', { opacity: 1, duration: 1.5 }, 'warp4+=4.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 4: GOOGLE UI/UX ---
        .fromTo('.scene-4-part1', { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.5 })
        .to({}, { duration: 1.5 })
        
        .fromTo('.scene-4-part2', 
            { opacity: 0, x: "100vw" }, 
            { opacity: 1, x: 0, duration: 1, ease: "power3.inOut" }
        )
        .to({}, { duration: 2 })
        .to('.scene-4-part2', { opacity: 0, x: "-100vw", duration: 0.8, ease: "power2.in" })
        .to('.scene-4-part1', { opacity: 0, duration: 0.1 }, "<") 

      // ==========================================
      // 5. WARP TO SCENE 5 
      // ==========================================
        .addLabel('warp5')
        .to(cameraRigRef.current, { z: 20000, ease: "power1.inOut", duration: 6 }, 'warp5')
        .to('.scene-4-wrapper', { opacity: 0, scale: 3, duration: 1.5, ease: "power2.in" }, 'warp5') 
        .fromTo('.era-5-flyby', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.2, stagger: 0.7, ease: "power2.out" }, 'warp5+=1.5')
        .to('.era-5-flyby', { opacity: 0, scale: 1.5, duration: 1.2, stagger: 0.7, ease: "power2.in" }, 'warp5+=2.5')
        .to('.scene-5-wrapper', { opacity: 1, duration: 1.5 }, 'warp5+=4.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 5: AI FUTURE ---
        .fromTo('.scene-5-part1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to({}, { duration: 2.5 })
        .to('.scene-5-part1', { opacity: 0, scale: 1.2, duration: 0.5 })

        .fromTo('.scene-5-question', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.5)" })
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
      autoScrollTween = gsap.to(window, {
        scrollTo: "max",
        duration: 130, 
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
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all bg-black/50 backdrop-blur-md hover:scale-110"
          style={{ borderColor: isAutoPlaying ? '#10b981' : '#52525b', color: isAutoPlaying ? '#10b981' : '#52525b' }}>
          {isAutoPlaying ? "⏸" : "▶️"}
        </button>
        <button onClick={(e) => { e.stopPropagation(); toggleAudio(); }}
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full border-2 transition-all bg-black/50 backdrop-blur-md hover:scale-110"
          style={{ borderColor: isAudioEnabled ? '#ef4444' : '#52525b', color: isAudioEnabled ? '#ef4444' : '#52525b' }}>
          {isAudioEnabled ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="scroll-hint absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
        <h1 className="text-3xl md:text-5xl font-light tracking-[0.2em] md:tracking-[0.3em] uppercase mb-4 opacity-80 drop-shadow-lg text-center px-4">The Temporal Journey</h1>
        <p className="text-xs md:text-sm tracking-widest uppercase text-gray-400 mb-8 animate-pulse text-center">Scroll to Initiate Jump</p>
      </div>

      <div ref={cameraRigRef} className="absolute inset-0 w-full h-full"
        style={{ transformStyle: "preserve-3d", transform: "translateZ(-4000px)" }}>
        
        {/* ================= ERA 1 FLYBYS ================= */}
        <FlybyItem eraClass="era-1-flyby" z={3500} x="5%" y="15%" rotate={-15} label="Motorola Razr" imageUrl={`${imgBase}razr_v3_spinning.jpg`}/>
        <FlybyItem eraClass="era-1-flyby" z={2500} x="60%" y="60%" rotate={10} label="iPod Classic" imageUrl={`${imgBase}ipod_classic_clickwheel.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={1500} x="10%" y="65%" rotate={-5} label="Top 8 Profile"imageUrl={`${imgBase}top8_grid.jpg`} />
        <FlybyItem eraClass="era-1-flyby" z={500} x="65%" y="20%" rotate={25} label="Wii Remote" imageUrl={`${imgBase}wii_remote.jpg`}/>

        {/* ================= SCENE 1: BEDROOM ================= */}
        <div className="scene-1-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(0px)" }}>
          <img src={`${imgBase}scene1_bedroom_crt.jpg`} alt="90s Bedroom" className="scene-1-bg absolute inset-0 w-full h-full object-cover opacity-80" />
          
          <div className="absolute inset-0 flex items-center justify-center md:inset-auto md:top-[40%] md:left-[35%] md:w-[30%] md:h-[30%] p-4">
             <div className="scene-1-part1 absolute w-[90%] md:w-full max-w-sm flex flex-col items-center justify-center bg-black/90 p-4 border border-blue-900 rounded-lg opacity-0 shadow-2xl">
                 <img src={`${imgBase}MySpace_profile_page_2004.jpg`} className="w-full h-32 md:h-48 object-cover mb-2 rounded" />
                 <h2 className="text-blue-500 text-xl md:text-2xl font-bold font-mono">:::myspace</h2>
             </div>
             
             <div className="scene-1-part2 absolute w-[90%] md:w-full max-w-sm flex flex-col items-center justify-center bg-black/90 p-4 border border-yellow-700 rounded-lg opacity-0 shadow-2xl">
                 <img src={`${imgBase}Yahoo_chat.jpg`} className="w-full h-32 md:h-48 object-cover mb-2 rounded" />
                 <h2 className="text-yellow-500 text-xl md:text-2xl font-bold font-mono">Yahoo/A.I.M</h2>
             </div>
          </div>
        </div>

        {/* ================= ERA 2 FLYBYS ================= */}
        <FlybyItem eraClass="era-2-flyby" z={-1000} x="65%" y="15%" rotate={15} label="Polaroid Icon" imageUrl={`${imgBase}polaroid_icon.jpg`} />
        <FlybyItem eraClass="era-2-flyby" z={-2000} x="5%" y="60%" rotate={-20} label="Glowing Bitcoin" imageUrl={`${imgBase}glowing_bitcoin.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-3000} x="70%" y="50%" rotate={5} label="Diamond Pickaxe" imageUrl={`${imgBase}minecraft_pickaxe.jpg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-4000} x="10%" y="25%" rotate={-10} label="Pokéball" imageUrl={`${imgBase}pokeball.jpg`}/>

        {/* ================= SCENE 2: ITT TECH ================= */}
        <div className="scene-2-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-5000px)" }}>
          <img src={`${imgBase}scene2_itt_chalkboard.jpg`} alt="ITT Tech Classroom" className="scene-2-bg absolute inset-0 w-full h-full object-cover opacity-60" />
          
          <div className="absolute inset-0 flex items-center justify-center md:inset-auto md:top-[25%] md:left-[25%] md:w-[50%] md:h-[40%] p-6">
             <div className="scene-2-part1 absolute w-[90%] md:w-full max-w-md flex flex-col items-center justify-center text-white opacity-0 bg-black/50 p-6 rounded-xl backdrop-blur-sm">
                 <img src={`${imgBase}Newspaper_clipping_ITT_closes.jpg`} className="w-48 md:w-64 mb-4 border-2 border-red-900 rotate-3 shadow-2xl" />
                 <h2 className="text-red-500 text-xl md:text-4xl font-black uppercase tracking-widest bg-black/90 px-4 md:px-6 py-2 md:py-3 border border-red-900/50 text-center">ITT TECH CLOSES</h2>
             </div>

             <div className="scene-2-part2 absolute w-[90%] md:w-full max-w-md flex flex-col items-center justify-center text-white opacity-0 bg-black/60 p-6 md:p-8 rounded-xl backdrop-blur-sm">
                 <h2 className="text-red-500 text-3xl md:text-6xl font-black uppercase tracking-widest border-b-4 border-red-500 pb-2 mb-4 transform -skew-x-12 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] text-center">The Raw Era</h2>
                 <p className="text-sm md:text-xl text-center bg-black/80 p-3 md:p-4 rounded font-mono border border-white/10">VVAGRAPHICS is born.</p>
             </div>
          </div>
        </div>

        {/* ================= ERA 3 FLYBYS ================= */}
        <FlybyItem eraClass="era-3-flyby" z={-6000} x="10%" y="65%" rotate={-15} label="Figma Pen" imageUrl={`${imgBase}figma_pen_tool.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-7000} x="65%" y="20%" rotate={10} label="OG AirPods" imageUrl={`${imgBase}original_airpods.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-8000} x="5%" y="25%" rotate={-5} label="Glitch Logo" imageUrl={`${imgBase}tiktok_glitch_logo.jpg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-9000} x="70%" y="60%" rotate={25} label="Llama Piñata" imageUrl={`${imgBase}fortnite_llama.jpg`}/>

        {/* ================= SCENE 3: PC PROFESSOR ================= */}
        <div className="scene-3-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-10000px)" }}>
          <img src={`${imgBase}scene3_pcprof_board.jpg`} alt="PC Professor" className="scene-3-bg absolute inset-0 w-full h-full object-cover opacity-60" />
          
          <div className="absolute inset-0 flex items-center justify-center md:inset-auto md:top-[30%] md:left-[30%] md:w-[40%] md:h-[40%] p-4">
             <div className="scene-3-part1 absolute w-[90%] md:w-full max-w-md flex flex-col items-center justify-center bg-teal-900/80 backdrop-blur-md border border-teal-500/50 rounded-xl p-6 md:p-8 opacity-0 shadow-2xl">
                 <img src={`${imgBase}Two_interconnected_tech_stacks.jpg`} className="w-full h-32 md:h-40 object-cover mb-4 rounded-lg" />
                 <h2 className="text-teal-400 text-2xl md:text-4xl font-semibold mb-2 drop-shadow-md text-center">MEAN / MERN</h2>
             </div>

             <div className="scene-3-part2 absolute w-[90%] md:w-full max-w-md flex flex-col items-center justify-center bg-teal-900/80 backdrop-blur-md border border-teal-500/50 rounded-xl p-6 md:p-8 opacity-0 shadow-2xl">
                 <h2 className="text-teal-300 text-3xl md:text-5xl font-black tracking-widest drop-shadow-[0_0_15px_rgba(45,212,191,0.8)] text-center leading-tight">STRUCTURE<br/>& LOGIC</h2>
                 <p className="text-sm md:text-lg text-teal-100 text-center mt-4 md:mt-6 bg-black/40 p-3 md:p-4 rounded w-full">SEO, Architecture & Full-Stack Mastery.</p>
             </div>
          </div>
        </div>

        {/* ================= ERA 4 FLYBYS ================= */}
        <FlybyItem eraClass="era-4-flyby" z={-11000} x="60%" y="25%" rotate={5} label="Zoom Webcams" imageUrl={`${imgBase}zoom_webcams_grid.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-12000} x="5%" y="55%" rotate={-10} label="Distancing" imageUrl={`${imgBase}masks_distancing.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-13000} x="65%" y="65%" rotate={15} label="Bored Ape" imageUrl={`${imgBase}bored_ape_nft.jpg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-14000} x="10%" y="15%" rotate={-20} label="James Webb" imageUrl={`${imgBase}james_webb_mirror.jpg`}/>

        {/* ================= SCENE 4: GOOGLE UI/UX ================= */}
        <div className="scene-4-wrapper absolute inset-0 w-full h-full opacity-0 overflow-hidden" style={{ transform: "translateZ(-15000px)" }}>
          <img src={`${imgBase}scene4_uiux_monitors.jpg`} alt="Workspace" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          
          {/* Part 1: Small Centered Graphic */}
          <div className="scene-4-part1 absolute inset-0 flex items-center justify-center p-4">
             <div className="flex flex-col items-center justify-center bg-blue-900/80 backdrop-blur-md border border-blue-400/50 rounded-xl p-6 shadow-2xl w-[90%] max-w-md">
                 <h2 className="text-blue-300 text-xl md:text-3xl font-mono uppercase tracking-widest text-center">Wireframing flows</h2>
                 <img src={`${imgBase}UX_wireframe_flow_planning.jpg`} className="w-full h-32 md:h-48 object-cover mt-4 md:mt-6 rounded-lg opacity-90 border border-white/10" />
             </div>
          </div>

          {/* Part 2: Floating Window */}
          <div className="scene-4-part2 absolute top-[15%] bottom-[15%] left-[5%] right-[5%] md:top-[10%] md:bottom-[8%] bg-[#0f172a] flex flex-col items-center justify-center z-50 border border-blue-500/50 shadow-[0_0_50px_rgba(0,0,0,0.9)] opacity-0 rounded-xl overflow-hidden">
             
             <div className="absolute top-0 left-0 w-full h-8 md:h-10 bg-[#1e293b] flex items-center px-4 border-b border-blue-900/50">
                <div className="flex gap-1 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-[10px] md:text-xs text-blue-300/50 font-mono truncate px-4">google_collab_ui_v2.fig</div>
             </div>

             <div className="w-full max-w-4xl px-4 md:px-8 text-center mt-6 md:mt-10">
                 <h2 className="text-white text-3xl sm:text-5xl md:text-7xl font-black tracking-[0.1em] md:tracking-[0.2em] drop-shadow-[0_0_30px_rgba(59,130,246,0.8)] mb-4 md:mb-6">GOOGLE COLLAB</h2>
                 <div className="w-16 md:w-32 h-1 bg-blue-500 mx-auto mb-4 md:mb-6 rounded-full"></div>
                 <h3 className="text-blue-200 text-lg sm:text-xl md:text-3xl font-light tracking-wide uppercase">Military Grade UI/UX Architecture</h3>
                 <p className="mt-4 md:mt-8 text-gray-400 font-mono text-xs sm:text-sm md:text-base max-w-2xl mx-auto">Scalable design systems. Component-driven development. Pixel-perfect execution.</p>
             </div>
          </div>
        </div>

        {/* ================= ERA 5 FLYBYS ================= */}
        <FlybyItem eraClass="era-5-flyby" z={-16000} x="5%" y="35%" rotate={-5} label="AR/VR Headset" imageUrl={`${imgBase}ar_vr_headset.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-17000} x="75%" y="25%" rotate={10} label="Neural Mesh" imageUrl={`${imgBase}neural_network_mesh.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-18000} x="15%" y="65%" rotate={-15} label="Robotic Hand" imageUrl={`${imgBase}robotic_hand.jpg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-19000} x="65%" y="60%" rotate={20} label="Hologram UI" imageUrl={`${imgBase}holographic_ui_panels.jpg`}/>

        {/* ================= SCENE 5: AI FUTURE ================= */}
        <div className="scene-5-wrapper absolute inset-0 w-full h-full opacity-0" style={{ transform: "translateZ(-20000px)" }}>
          <img src={`${imgBase}scene5_cyberpunk_ultrawide.jpg`} alt="AI Future" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
             
             {/* Part 1: Autonomous Agents Terminal */}
             <div className="scene-5-part1 absolute w-[95%] md:w-full max-w-3xl flex flex-col items-center justify-center opacity-0 z-30">
                 <div className="w-full bg-[#1e1e1e] rounded-xl overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.4)] border border-gray-700">
                    <div className="bg-[#2d2d2d] px-3 md:px-4 py-1.5 md:py-2 flex items-center gap-1.5 md:gap-2">
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-400 font-mono text-[10px] md:text-xs ml-2 md:ml-4">ai_agents_deploy.sh</span>
                    </div>
                    <div className="p-1 bg-black relative">
                        <img src={`${imgBase}ai_agents_terminal.gif`} alt="AI Agents Working" className="w-full h-auto object-cover opacity-90 mix-blend-screen" />
                    </div>
                 </div>
                 <h2 className="text-purple-400 text-2xl sm:text-3xl md:text-5xl font-mono mt-6 md:mt-8 font-bold tracking-wider text-center drop-shadow-md">AUTONOMOUS AGENTS</h2>
                 <p className="text-sm md:text-lg text-gray-400 mt-2 md:mt-4 font-mono text-center">The machines write the code. I architect the reality.</p>
             </div>

             {/* Part 2: The Question */}
             <div className="scene-5-question absolute inset-0 flex flex-col items-center justify-center bg-black opacity-0 z-40">
                 <h2 className="text-white text-3xl sm:text-4xl md:text-7xl font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-center max-w-5xl leading-tight drop-shadow-[0_0_25px_rgba(255,255,255,0.7)] px-4">
                    What is our future<br/>with AI?
                 </h2>
             </div>
             
             {/* Part 3: The 3 Futures Cliffhanger */}
             <div className="scene-5-part3 absolute inset-0 flex items-center justify-center bg-black/90 opacity-0 z-50">
                 <div className="absolute inset-0 flex flex-col md:flex-row w-full h-full opacity-60">
                    <div className="flex-1 relative group h-full">
                        <img src={`${imgBase}future_tools.jpg`} alt="AI as Tools" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:group-hover:grayscale-0 md:group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-4 md:bottom-1/4 flex justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 z-10">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl">Mere Tools</span>
                        </div>
                    </div>
                    <div className="flex-1 relative group h-full md:border-l md:border-r border-t md:border-t-0 border-white/20 z-10">
                        <img src={`${imgBase}future_colleagues.jpg`} alt="AI as Colleagues" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:group-hover:grayscale-0 md:group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-4 md:bottom-1/4 flex justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 z-10">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl">Side by Side</span>
                        </div>
                    </div>
                    <div className="flex-1 relative group h-full border-t md:border-t-0 border-white/20">
                        <img src={`${imgBase}future_downfall.jpg`} alt="AI as Downfall" className="absolute inset-0 w-full h-full object-cover grayscale md:transition-all md:duration-700 md:group-hover:grayscale-0 md:group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden"></div>
                        <div className="absolute inset-x-0 bottom-4 md:bottom-1/4 flex justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-500 z-10">
                            <span className="bg-black/90 text-white px-6 md:px-8 py-2 md:py-3 uppercase tracking-[0.2em] text-xs md:text-sm border border-white/30 rounded shadow-xl">Our Downfall?</span>
                        </div>
                    </div>
                 </div>

                 <div className="relative z-20 flex flex-col items-center p-6 md:p-14 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_80px_rgba(0,0,0,0.9)] w-[90%] md:w-auto">
                    <h3 className="text-gray-300 text-xs sm:text-sm md:text-xl uppercase tracking-[0.3em] md:tracking-[0.6em] mb-6 md:mb-12 font-light text-center drop-shadow-md">The Choice is Ours</h3>
                    <button onClick={onStoryComplete} className="px-6 md:px-14 py-3 md:py-6 bg-white text-black font-black text-sm md:text-2xl uppercase tracking-[0.1em] md:tracking-[0.3em] hover:bg-purple-600 hover:text-white hover:scale-105 transition-all duration-300 rounded-sm pointer-events-auto shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.8)] whitespace-nowrap">
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