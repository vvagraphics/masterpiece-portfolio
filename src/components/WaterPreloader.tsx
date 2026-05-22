import { useEffect, useRef } from 'react';

interface WaterPreloaderProps {
  onSplashComplete: () => void;
}

export default function WaterPreloader({ onSplashComplete }: WaterPreloaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas to full window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    let animationFrameId: number;

    // TODO: Initialize 2D arrays for the water heightmap (current and previous)
    // const cols = canvas.width;
    // const rows = canvas.height;
    
    const renderLoop = () => {
      // 1. Calculate the wave propagation math for this frame
      // 2. Draw the background image (e.g., your old MySpace code/colors)
      // 3. Apply the pixel displacement based on the water heights
      
      // Placeholder drawing for now
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Move mouse to ripple. Click to wash away.', canvas.width / 2, canvas.height / 2);

      animationFrameId = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const triggerBucketSplash = () => {
    // 1. Inject a massive velocity spike into the center/top of the heightmap array
    // 2. Animate the canvas opacity or slide it out via CSS/GSAP
    // 3. Call the completion prop to move to Phase 2
    
    console.log("Bucket splash triggered! Washing away...");
    
    // Simulating the splash animation duration before advancing state
    setTimeout(() => {
      onSplashComplete();
    }, 1500); 
  };

  return (
    <div className="relative w-full h-screen cursor-crosshair">
      <canvas 
        ref={canvasRef} 
        onClick={triggerBucketSplash}
        className="absolute top-0 left-0 w-full h-full z-10"
      />
    </div>
  );
}