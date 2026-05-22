import { useEffect, useRef, useState } from 'react';

interface WaterPreloaderProps {
  onSplashComplete: () => void;
}

export default function WaterPreloader({ onSplashComplete }: WaterPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSplashing, setIsSplashing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const DAMPING = 0.96; 
    const scale = 4;
    const physicsWidth = Math.floor(width / scale);
    const physicsHeight = Math.floor(height / scale);
    const size = physicsWidth * physicsHeight;

    let current = new Float32Array(size);
    let previous = new Float32Array(size);
    let baseImageData: ImageData;
    let outputImageData = ctx.createImageData(width, height);
    let animationFrameId: number;

    // Load the logo and start the engine
    const logo = new Image();
    logo.src = '/logostefand.svg'; // Loads from the public folder
    logo.onload = () => {
      // 1. Draw Black Background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Logo in Center
      const logoWidth = Math.min(width * 0.6, 600); // Responsive width
      const logoHeight = (logo.height / logo.width) * logoWidth;
      const x = (width - logoWidth) / 2;
      const y = (height - logoHeight) / 2;
      ctx.drawImage(logo, x, y, logoWidth, logoHeight);

      // 3. Save the pixels for refraction
      baseImageData = ctx.getImageData(0, 0, width, height);
      processWater();
    };

    // If the image fails to load, draw a fallback text
    logo.onerror = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px serif';
      ctx.textAlign = 'center';
      ctx.fillText('STEFANDERSON', width / 2, height / 2);
      baseImageData = ctx.getImageData(0, 0, width, height);
      processWater();
    };

    const processWater = () => {
      for (let y = 1; y < physicsHeight - 1; y++) {
        for (let x = 1; x < physicsWidth - 1; x++) {
          const i = x + y * physicsWidth;
          current[i] = (
            previous[i - 1] + previous[i + 1] + 
            previous[i - physicsWidth] + previous[i + physicsWidth]
          ) / 2 - current[i];
          current[i] *= DAMPING;
        }
      }

      const baseData = baseImageData.data;
      const outData = outputImageData.data;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = Math.floor(x / scale);
          const py = Math.floor(y / scale);
          const pi = px + py * physicsWidth;

          let dx = x;
          let dy = y;

          if (px > 0 && px < physicsWidth - 1 && py > 0 && py < physicsHeight - 1) {
              const diffX = current[pi + 1] - current[pi - 1];
              const diffY = current[pi + physicsWidth] - current[pi - physicsWidth];
              dx += Math.floor(diffX * 1.5);
              dy += Math.floor(diffY * 1.5);
          }

          dx = Math.max(0, Math.min(width - 1, dx));
          dy = Math.max(0, Math.min(height - 1, dy));

          const outIndex = (x + y * width) * 4;
          const inIndex = (dx + dy * width) * 4;

          outData[outIndex] = baseData[inIndex];         
          outData[outIndex + 1] = baseData[inIndex + 1]; 
          outData[outIndex + 2] = baseData[inIndex + 2]; 
          outData[outIndex + 3] = 255;                   
        }
      }

      ctx.putImageData(outputImageData, 0, 0);

      let temp = previous;
      previous = current;
      current = temp;

      animationFrameId = requestAnimationFrame(processWater);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const px = Math.floor(e.clientX / scale);
      const py = Math.floor(e.clientY / scale);
      const radius = 2;
      for (let y = -radius; y <= radius; y++) {
        for (let x = -radius; x <= radius; x++) {
          if (x*x + y*y <= radius*radius) {
            const idx = (px + x) + (py + y) * physicsWidth;
            if (idx >= 0 && idx < size) {
              previous[idx] = 255; 
            }
          }
        }
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Step 4: The Bucket Splash Transition
  const triggerBucketSplash = () => {
    if (isSplashing) return;
    setIsSplashing(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // We combine the canvas physics with standard CSS transforms for a kinetic, violent wash away
    canvas.style.transition = 'transform 1.2s cubic-bezier(0.55, 0.085, 0.68, 0.53), opacity 1.2s ease-in';
    canvas.style.transform = 'translateY(100vh) scale(1.1) rotate(5deg)';
    canvas.style.opacity = '0';

    setTimeout(() => {
      onSplashComplete();
    }, 1200);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        onClick={triggerBucketSplash}
        className="absolute top-0 left-0 w-full h-full z-10 origin-bottom"
        style={{ willChange: 'transform, opacity' }}
      />
    </div>
  );
}