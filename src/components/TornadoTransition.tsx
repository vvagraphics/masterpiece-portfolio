// src/components/TornadoTransition.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

type TornadoTransitionProps = {
  fromView: string;
  toView: string;
  onComplete: () => void;
};

const BASE_URL = "https://mr3anderson.pro/masterpiece-portfolio/transition";

const getImageForView = (view: string) => {
  const normalized = view?.toUpperCase().replace(/[\s_]+/g, '') || '';
  switch (normalized) {
    case 'GRAFFITI':
    case 'GRAFFITICANVAS':
      return `${BASE_URL}/graffiti.avif`;
    case 'GLASSWALLS': 
      return `${BASE_URL}/glasswalls.avif`;
    case 'HOLOGRAM':
    case 'HOLOGRAMS': 
      return `${BASE_URL}/holograms.avif`;
    case 'INKWELL': 
      return `${BASE_URL}/inkwell.avif`;
    case 'GACHA': 
      return `${BASE_URL}/gacha.avif`;
    case 'GALLERY': 
    case 'INSPIRATIONGALLERY':
    case 'COMMUNITYARCHIVES':
      return `${BASE_URL}/archives.avif`;
    default: 
      return `${BASE_URL}/fallback.avif`;
  }
};

export default function TornadoTransition({ fromView, toView, onComplete }: TornadoTransitionProps) {
  const TOTAL_DURATION = 2.8;
  const [targetScale, setTargetScale] = useState(6);
  const [showLoadingText, setShowLoadingText] = useState(false);

  useEffect(() => {
    const calculateScale = () => {
      const baseSize = window.innerWidth < 768 ? 192 : 256; 
      const scaleX = window.innerWidth / baseSize;
      const scaleY = window.innerHeight / baseSize;
      setTargetScale(Math.max(scaleX, scaleY)); 
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);

    const textTimer = setTimeout(() => {
      setShowLoadingText(true);
    }, TOTAL_DURATION * 0.7 * 1000);

    const completionTimer = setTimeout(() => {
      onComplete();
    }, TOTAL_DURATION * 1000);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completionTimer);
      window.removeEventListener('resize', calculateScale);
    };
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black overflow-hidden select-none pointer-events-none"
    >
      {/* 3D Spinning Layer Container - Lightweight and separated from structural resizing operations */}
      <motion.div
        animate={{ 
          rotateY: [0, 1080, 1080], 
        }}
        transition={{ 
          duration: TOTAL_DURATION * 0.85, 
          times: [0, 0.7, 1], 
          ease: "easeInOut" 
        }}
        className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center"
        style={{ 
          transformStyle: 'preserve-3d',
          willChange: 'transform' // POLISH: Forces hardware acceleration on the 3D matrix
        }}
      >
        
        {/* Outgoing Sandbox Image */}
        <motion.div
          animate={{ 
            opacity: [1, 0, 0],
            x: [0, 80, 80], 
            scale: [1, 0.5, 0.5]
          }}
          transition={{ duration: TOTAL_DURATION * 0.85, times: [0, 0.3, 1], ease: "easeIn" }}
          className="absolute inset-0"
          style={{ willChange: 'transform, opacity' }}
        >
          <img 
            src={getImageForView(fromView)} 
            alt="Leaving View" 
            className="w-full h-full object-contain rounded-2xl" 
          />
        </motion.div>

        {/* Incoming Sandbox Image Wrapper */}
        <motion.div
          animate={{ 
            opacity: [0, 1, 1, 1],
            x: [-80, 0, 0, 0], 
            scale: [0.5, 1, 1, targetScale] 
          }}
          transition={{ 
            duration: TOTAL_DURATION * 0.85, 
            times: [0, 0.3, 0.7, 1], 
            ease: "linear" 
          }}
          className="absolute inset-0"
          style={{ willChange: 'transform, opacity' }} // POLISH: Keeps scaling rendering processes smooth
        >
          {/* Inner Image Panel - Removed glowing text-shadow animations to stop style-repaint stutters */}
          <motion.div
            animate={{
              borderRadius: ["16px", "16px", "16px", "0px"]
            }}
            transition={{ 
              duration: TOTAL_DURATION * 0.85, 
              times: [0, 0.3, 0.7, 1], 
              ease: "linear" 
            }}
            className="w-full h-full overflow-hidden"
          >
            <img 
              src={getImageForView(toView)} 
              alt="Entering View" 
              className="w-full h-full object-contain" 
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Loading Text Overlay - Pure flat solid coloring optimization */}
      <AnimatePresence>
        {showLoadingText && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: TOTAL_DURATION * 0.35, 
              times: [0, 0.2, 0.8, 1],
              ease: "easeInOut" 
            }}
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-[110]"
          >
            <div className="flex flex-col items-center gap-4">
              <h2 className="text-sm md:text-base font-bold tracking-[0.4em] uppercase text-white animate-pulse">
                Loading Application
              </h2>
              <div className="w-24 h-[1px] bg-white/20 relative overflow-hidden">
                <motion.div 
                  initial={{ left: "-100%" }}
                  animate={{ left: "100%" }}
                  transition={{ duration: TOTAL_DURATION * 0.35, ease: "linear" }}
                  className="absolute top-0 bottom-0 w-1/2 bg-white"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}