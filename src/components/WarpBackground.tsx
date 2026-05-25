// src/components/WarpBackground.tsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function WarpBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const numStars = 1200; 
    const stars: any[] = [];
    const speed = { current: 0.5 }; // Ambient drift speed slightly faster
    
    const crystalColors = [
      '255, 255, 255', 
      '174, 232, 250', 
      '224, 195, 252', 
      '138, 236, 255', 
      '200, 255, 200'  
    ];

    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * width,
        pz: 0,
        color: crystalColors[Math.floor(Math.random() * crystalColors.length)]
      });
    }

    const scrollObserver = ScrollTrigger.create({
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const velocity = Math.abs(self.getVelocity());
        
        // DOUBLED SPEED SENSITIVITY
        const targetSpeed = 0.5 + (velocity / 15); 

        gsap.to(speed, { 
            current: Math.min(targetSpeed, 300), // Massive max speed cap for true warp
            duration: 0.2, 
            ease: "power2.out" 
        });
      }
    });

    let animationFrameId: number;

    const render = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'; 
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      stars.forEach(star => {
        star.pz = star.z; 
        star.z -= speed.current; 

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = width;
          star.pz = width;
        }

        const scale = width / star.z;
        const x = cx + star.x * scale;
        const y = cy + star.y * scale;

        const pScale = width / star.pz;
        const px = cx + star.x * pScale;
        const py = cy + star.y * pScale;

        const opacity = Math.min(1, (width - star.z) / width);

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        
        ctx.strokeStyle = `rgba(${star.color}, ${opacity})`;
        ctx.lineWidth = Math.max(0.5, (1 - star.z / width) * 5);
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      scrollObserver.kill();
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />;
}