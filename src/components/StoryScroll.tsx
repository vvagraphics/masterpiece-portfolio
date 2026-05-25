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
  <div className={`${eraClass} absolute w-64 h-64 flex flex-col items-center justify-center bg-black/50 backdrop-blur-md border border-white/20 rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.1)] text-center p-4 opacity-0`} 
       style={{ transform: `translateZ(${z}px) rotateZ(${rotate}deg)`, top: y, left: x }}>
    {/* Add the image here */}
    <img src={imageUrl} alt={label} className="w-32 h-32 object-contain mb-2" />
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
          end: '+=6000%', // Extended to give you plenty of scroll space for all sub-animations
          scrub: 1,     
          pin: true,     
        }
      });

      tl.to('.scroll-hint', { opacity: 0, duration: 0.5, ease: "power2.out" })

      // ==========================================
      // 1. APPROACH SCENE 1 (Camera Z: -4000 -> 0)
      // ==========================================
        .addLabel('warp1')
        .to(cameraRigRef.current, { z: 0, ease: "power2.inOut", duration: 4 }, 'warp1') // Faster approach
        .to('.era-1-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp1+=0.5')
        .to('.era-1-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp1+=1.5')
        .to('.scene-1-wrapper', { opacity: 1, duration: 1.5 }, 'warp1+=2.5') // Fade in right before arriving
        .to({}, { duration: 0.5 }) 

      // --- SCENE 1: BEDROOM (2 Animations) ---
        // Part 1: MySpace
        .fromTo('.scene-1-part1', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) // Read time
        .to('.scene-1-part1', { scale: 1.2, opacity: 0, duration: 0.4 })
        
        // Part 2: Yahoo/AIM
        .fromTo('.scene-1-part2', { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" })
        .to({}, { duration: 1.5 }) 
        .to('.scene-1-part2', { scale: 1.2, opacity: 0, duration: 0.4 })

      // ==========================================
      // 2. WARP TO SCENE 2 (Camera Z: 0 -> 5000)
      // ==========================================
        .addLabel('warp2')
        .to(cameraRigRef.current, { z: 5000, ease: "power2.inOut", duration: 4 }, 'warp2')
        // THE ZOOM-THROUGH EFFECT: Scale up massively as we fly past it
        .to('.scene-1-wrapper', { opacity: 0, scale: 5, duration: 0.5 }, 'warp2') 
        
        .to('.era-2-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp2+=0.5')
        .to('.era-2-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp2+=1.5')
        .to('.scene-2-wrapper', { opacity: 1, duration: 1.5 }, 'warp2+=2.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 2: ITT TECH (2 Animations) ---
        // Part 1: ITT Closes
        .fromTo('.scene-2-part1', { opacity: 0, y: -50 }, { opacity: 1, y: 0, duration: 0.5, ease: "bounce.out" })
        .to({}, { duration: 1.5 })
        .to('.scene-2-part1', { opacity: 0, y: 50, duration: 0.4 })
        
        // Part 2: VVAGRAPHICS Raw Era
        .fromTo('.scene-2-part2', { opacity: 0, scale: 2, rotationZ: -10 }, { opacity: 1, scale: 1, rotationZ: 0, duration: 0.5, ease: "power3.out" })
        .to({}, { duration: 1.5 })
        .to('.scene-2-part2', { opacity: 0, scale: 1.5, duration: 0.4 })

      // ==========================================
      // 3. WARP TO SCENE 3 (Camera Z: 5000 -> 10000)
      // ==========================================
        .addLabel('warp3')
        .to(cameraRigRef.current, { z: 10000, ease: "power2.inOut", duration: 4 }, 'warp3')
        .to('.scene-2-wrapper', { opacity: 0, scale: 3, duration: 1.5 }, 'warp3') // Zoom Through
        
        .to('.era-3-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp3+=0.5')
        .to('.era-3-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp3+=1.5')
        .to('.scene-3-wrapper', { opacity: 1, duration: 1.5 }, 'warp3+=2.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 3: PC PROFESSOR (2 Animations) ---
        // Part 1: MEAN/MERN Stack
        .fromTo('.scene-3-part1', { opacity: 0, filter: "blur(20px)" }, { opacity: 1, filter: "blur(0px)", duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-3-part1', { opacity: 0, filter: "blur(10px)", duration: 0.4 })

        // Part 2: SEO / Architecture
        .fromTo('.scene-3-part2', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 })
        .to({}, { duration: 1.5 }) 
        .to('.scene-3-part2', { opacity: 0, scale: 1.1, duration: 0.4 })

      // ==========================================
      // 4. WARP TO SCENE 4 (Camera Z: 10000 -> 15000)
      // ==========================================
        .addLabel('warp4')
        .to(cameraRigRef.current, { z: 15000, ease: "power2.inOut", duration: 4 }, 'warp4')
        .to('.scene-3-wrapper', { opacity: 0, scale: 3, duration: 1.5 }, 'warp4') // Zoom Through
        
        .to('.era-4-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp4+=0.5')
        .to('.era-4-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp4+=1.5')
        .to('.scene-4-wrapper', { opacity: 1, duration: 1.5 }, 'warp4+=2.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 4: GOOGLE UI/UX (2 Animations) ---
        // Part 1: Wireframing
        .fromTo('.scene-4-part1', { opacity: 0, x: -100 }, { opacity: 1, x: 0, duration: 0.5 })
        .to({}, { duration: 1.5 })
        .to('.scene-4-part1', { opacity: 0, x: 100, duration: 0.4 })

        // Part 2: Google Collab Prototype
        .fromTo('.scene-4-part2', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" })
        .to({}, { duration: 1.5 })
        .to('.scene-4-part2', { opacity: 0, scale: 1.2, duration: 0.4 })

      // ==========================================
      // 5. WARP TO SCENE 5 (Camera Z: 15000 -> 20000)
      // ==========================================
        .addLabel('warp5')
        .to(cameraRigRef.current, { z: 20000, ease: "power2.inOut", duration: 4 }, 'warp5')
        .to('.scene-4-wrapper', { opacity: 0, scale: 3, duration: 1.5 }, 'warp5') // Zoom Through
        
        .to('.era-5-flyby', { opacity: 0.8, duration: 1, stagger: 0.2 }, 'warp5+=0.5')
        .to('.era-5-flyby', { opacity: 0, duration: 1, stagger: 0.2 }, 'warp5+=1.5')
        .to('.scene-5-wrapper', { opacity: 1, duration: 1.5 }, 'warp5+=2.5') 
        .to({}, { duration: 0.5 }) 
        
      // --- SCENE 5: AI FUTURE (2 Animations) ---
        // Part 1: AI Assisted Coding
        .fromTo('.scene-5-part1', { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" })
        .to({}, { duration: 1.5 })
        .to('.scene-5-part1', { opacity: 0, filter: "blur(10px)", duration: 0.5 })

        // Part 2: Autonomous Agents (Final State - Does NOT fade out)
        .fromTo('.scene-5-part2', { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 1.5, ease: "power2.out" })
        .to({}, { duration: 5 }); // Hold at the end to allow clicking the museum button

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
        
        {/* ================= ERA 1 FLYBYS ================= */}
        <FlybyItem eraClass="era-1-flyby" z={3000} x="10%" y="20%" rotate={-15} label="Motorola Razr V3 (Spinning)" imageUrl={`${imgBase}razr_v3_spinning.jpeg`}/>
        <FlybyItem eraClass="era-1-flyby" z={2000} x="70%" y="60%" rotate={10} label="iPod Classic with Click-Wheel" imageUrl={`${imgBase}ipod_classic_clickwheel.jpeg`} />
        <FlybyItem eraClass="era-1-flyby" z={1000} x="20%" y="70%" rotate={-5} label="Top 8 Profile Grid"imageUrl={`${imgBase}top8_grid.jpeg`} />
        <FlybyItem eraClass="era-1-flyby" z={500} x="80%" y="30%" rotate={25} label="Nintendo Wii Remote" imageUrl={`${imgBase}wii_remote.jpeg`}/>

        {/* ================= SCENE 1: BEDROOM ================= */}
        <div className="scene-1-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(0px)" }}>
          <img src={`${imgBase}scene1_bedroom_crt.jpeg`} alt="90s Bedroom" className="absolute inset-0 w-full h-full object-cover opacity-80" />
          <div className="absolute top-[40%] left-[35%] w-[30%] h-[30%] flex items-center justify-center">
             
             {/* Part 1: MySpace */}
             <div className="scene-1-part1 absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 border border-blue-900 rounded-lg opacity-0">
                 <img src={`${imgBase}MySpace_profile_page_2004.jpeg`} className="w-full h-32 object-cover mb-2 rounded" />
                 <h2 className="text-blue-500 text-2xl font-bold font-mono">:::myspace</h2>
             </div>
             
             {/* Part 2: Yahoo Chat */}
             <div className="scene-1-part2 absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 border border-yellow-700 rounded-lg opacity-0">
                 <img src={`${imgBase}Yahoo_chat.jpeg`} className="w-full h-32 object-cover mb-2 rounded" />
                 <h2 className="text-yellow-500 text-2xl font-bold font-mono">Yahoo/A.I.M</h2>
             </div>
          </div>
        </div>

        {/* ================= ERA 2 FLYBYS ================= */}
        <FlybyItem eraClass="era-2-flyby" z={-1000} x="75%" y="20%" rotate={15} label="Retro Polaroid Icon" imageUrl={`${imgBase}polaroid_icon.jpeg`} />
        <FlybyItem eraClass="era-2-flyby" z={-2000} x="15%" y="65%" rotate={-20} label="Glowing Bitcoin" imageUrl={`${imgBase}glowing_bitcoin.jpeg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-3000} x="85%" y="50%" rotate={5} label="Minecraft Pickaxe" imageUrl={`${imgBase}minecraft_pickaxe.jpeg`}/>
        <FlybyItem eraClass="era-2-flyby" z={-4000} x="10%" y="30%" rotate={-10} label="Pokéball" imageUrl={`${imgBase}pokeball.jpeg`}/>

        {/* ================= SCENE 2: ITT TECH ================= */}
        <div className="scene-2-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-5000px)" }}>
          <img src={`${imgBase}scene2_itt_chalkboard.jpeg`} alt="ITT Tech Classroom" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute top-[25%] left-[25%] w-[50%] h-[40%] flex items-center justify-center">
             
             {/* Part 1: ITT Closes */}
             <div className="scene-2-part1 absolute inset-0 flex flex-col items-center justify-center text-white opacity-0">
                 <img src={`${imgBase}Newspaper_clipping_ITT_closes.jpeg`} className="w-48 mb-4 border-2 border-red-900 rotate-3 shadow-2xl" />
                 <h2 className="text-red-500 text-3xl font-black uppercase tracking-widest bg-black/80 px-4 py-2">ITT TECH CLOSES</h2>
             </div>

             {/* Part 2: VVAGRAPHICS */}
             <div className="scene-2-part2 absolute inset-0 flex flex-col items-center justify-center text-white opacity-0">
                 <h2 className="text-red-500 text-6xl font-black uppercase tracking-widest border-b-4 border-red-500 pb-2 mb-4 transform -skew-x-12">The Raw Era</h2>
                 <p className="text-xl text-center max-w-lg bg-black/80 p-4 backdrop-blur-md rounded font-mono">VVAGRAPHICS is born.</p>
             </div>
          </div>
        </div>

        {/* ================= ERA 3 FLYBYS ================= */}
        <FlybyItem eraClass="era-3-flyby" z={-6000} x="20%" y="70%" rotate={-15} label="Figma Pen Tool" imageUrl={`${imgBase}figma_pen_tool.jpeg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-7000} x="80%" y="25%" rotate={10} label="Original AirPods" imageUrl={`${imgBase}original_airpods.jpeg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-8000} x="15%" y="30%" rotate={-5} label="TikTok Glitch Logo" imageUrl={`${imgBase}tiktok_glitch_logo.jpeg`}/>
        <FlybyItem eraClass="era-3-flyby" z={-9000} x="75%" y="60%" rotate={25} label="Fortnite Llama" imageUrl={`${imgBase}fortnite_llama.jpeg`}/>

        {/* ================= SCENE 3: PC PROFESSOR ================= */}
        <div className="scene-3-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-10000px)" }}>
          <img src={`${imgBase}scene3_pcprof_board.jpeg`} alt="PC Professor" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] flex items-center justify-center">
             
             {/* Part 1: MEAN/MERN */}
             <div className="scene-3-part1 absolute inset-0 flex flex-col items-center justify-center bg-teal-900/60 backdrop-blur-md border border-teal-500/50 rounded-xl p-8 opacity-0">
                 <img src={`${imgBase}Two_interconnected_tech_stacks.jpeg`} className="w-full h-32 object-cover mb-4 rounded-lg shadow-2xl" />
                 <h2 className="text-teal-400 text-4xl font-semibold mb-2">MEAN / MERN</h2>
             </div>

             {/* Part 2: SEO / Logic */}
             <div className="scene-3-part2 absolute inset-0 flex flex-col items-center justify-center bg-teal-900/60 backdrop-blur-md border border-teal-500/50 rounded-xl p-8 opacity-0">
                 <h2 className="text-teal-300 text-5xl font-black tracking-widest drop-shadow-[0_0_10px_rgba(45,212,191,0.8)]">STRUCTURE & LOGIC</h2>
                 <p className="text-lg text-teal-100 text-center mt-4">SEO, Architecture & Full-Stack Mastery.</p>
             </div>
          </div>
        </div>

        {/* ================= ERA 4 FLYBYS ================= */}
        <FlybyItem eraClass="era-4-flyby" z={-11000} x="70%" y="30%" rotate={5} label="Zoom Webcams Grid" imageUrl={`${imgBase}zoom_webcams_grid.jpeg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-12000} x="10%" y="60%" rotate={-10} label="Masks Distancing" imageUrl={`${imgBase}masks_distancing.jpeg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-13000} x="80%" y="70%" rotate={15} label="Bored Ape NFT" imageUrl={`${imgBase}bored_ape_nft.jpeg`}/>
        <FlybyItem eraClass="era-4-flyby" z={-14000} x="20%" y="20%" rotate={-20} label="James Webb Mirror" imageUrl={`${imgBase}james_webb_mirror.jpeg`}/>

        {/* ================= SCENE 4: GOOGLE UI/UX ================= */}
        <div className="scene-4-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-15000px)" }}>
          <img src={`${imgBase}scene4_uiux_monitors.jpeg`} alt="Workspace" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute top-[40%] left-[20%] w-[60%] h-[30%] flex items-center justify-center">
             
             {/* Part 1: Wireframing */}
             <div className="scene-4-part1 absolute inset-0 flex flex-col items-center justify-center opacity-0 bg-blue-900/40 backdrop-blur-sm border-2 border-blue-400/50 rounded-lg">
                 <h2 className="text-blue-300 text-4xl font-mono uppercase tracking-widest">Wireframing flows</h2>
                 <img src={`${imgBase}UX_wireframe_flow_planning.jpeg`} className="w-64 h-32 object-cover mt-4 rounded-lg opacity-80" />
             </div>

             {/* Part 2: Prototypes */}
             <div className="scene-4-part2 absolute inset-0 flex flex-col items-center justify-center opacity-0 bg-blue-900/80 backdrop-blur-md border-2 border-blue-400 shadow-[0_0_40px_rgba(59,130,246,0.6)] rounded-lg">
                 <h2 className="text-white text-6xl font-black tracking-widest drop-shadow-2xl">GOOGLE COLLAB</h2>
                 <h3 className="text-blue-200 text-2xl font-bold mt-2">Military UI/UX Prototypes</h3>
             </div>
          </div>
        </div>

        {/* ================= ERA 5 FLYBYS ================= */}
        <FlybyItem eraClass="era-5-flyby" z={-16000} x="15%" y="40%" rotate={-5} label="AR/VR Headset" imageUrl={`${imgBase}ar_vr_headset.jpeg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-17000} x="85%" y="30%" rotate={10} label="Neural Network Mesh" imageUrl={`${imgBase}neural_network_mesh.jpeg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-18000} x="25%" y="70%" rotate={-15} label="Robotic Hand" imageUrl={`${imgBase}robotic_hand.jpeg`}/>
        <FlybyItem eraClass="era-5-flyby" z={-19000} x="75%" y="60%" rotate={20} label="Holographic UI Panels" imageUrl={`${imgBase}holographic_ui_panels.jpeg`}/>

        {/* ================= SCENE 5: AI FUTURE ================= */}
        <div className="scene-5-wrapper absolute inset-0 w-full h-full flex items-center justify-center opacity-0" style={{ transform: "translateZ(-20000px)" }}>
          <img src={`${imgBase}scene5_cyberpunk_ultrawide.jpeg`} alt="AI Future" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 flex items-center justify-center">
             
             {/* Part 1: AI Assisting */}
             <div className="scene-5-part1 absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm opacity-0">
                 <img src={`${imgBase}Developer_workspace_with_AI_assist.jpeg`} className="w-96 h-64 object-cover rounded-xl border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
                 <h2 className="text-purple-400 text-5xl font-mono mt-8">AI Assisted Coding</h2>
             </div>

             {/* Part 2: Autonomous Agents (Final Stop) */}
             <div className="scene-5-part2 absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md z-50 opacity-0">
                 <h2 className="text-purple-500 text-7xl font-bold mb-4 drop-shadow-[0_0_20px_rgba(168,85,247,0.8)]">AUTONOMOUS AGENTS</h2>
                 <p className="text-2xl text-gray-300 mb-12 max-w-2xl text-center">The machines do the heavy lifting. I engineer the experiences.</p>
                 <button onClick={onStoryComplete} className="px-10 py-5 bg-white text-black font-black uppercase tracking-[0.3em] hover:bg-purple-500 hover:text-white hover:scale-110 transition-all rounded-sm pointer-events-auto">
                    Enter the Museum
                 </button>
             </div>
          </div>
        </div>

      </div>
      
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.9)_100%)] z-10"></div>
    </div>
  );
}