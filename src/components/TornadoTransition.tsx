import { motion } from 'framer-motion';
import { useEffect } from 'react';

// Import your new SVG components
import GraffitiSVG from './svgs/GraffitiSVG';
import GlassWallsSVG from './svgs/GlassWallsSVG';
// Import your gallery logo (using a placeholder name here, update if needed)
import EfandersonLogo from './svgs/EfandersonLogo'; 

type TornadoTransitionProps = {
  fromView: string;
  toView: string;
  onComplete: () => void;
};

// Map the views to the new components
const getLogoForView = (view: string) => {
  switch (view) {
    case 'GRAFFITI': 
      return <GraffitiSVG className="w-32 h-32 text-red-500 drop-shadow-lg" />;
    case 'GLASS_WALLS': 
      return <GlassWallsSVG className="w-32 h-32 text-teal-500 drop-shadow-lg" />;
    case 'GALLERY': 
      // Ensure EfandersonLogo also accepts SVGProps so it doesn't error out!
      return <EfandersonLogo className="w-32 h-32 text-purple-500 drop-shadow-lg" />;
    default: 
      return <div className="w-24 h-24 bg-white rounded-full" />;
  }
};

export default function TornadoTransition({ fromView, toView, onComplete }: TornadoTransitionProps) {
  
  useEffect(() => {
    // Automatically trigger the completion after the animation duration
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        animate={{ 
          rotateY: [0, 1080], // Spins 3 times
          scale: [0.5, 1.2, 0.5] // Scales up then back down
        }}
        transition={{ 
          duration: 1.8, 
          ease: "easeInOut" 
        }}
        className="relative w-64 h-64 flex items-center justify-center transform-style-3d"
      >
        {/* Outgoing Sandbox Logo */}
        <motion.div
          animate={{ x: [80, 0], opacity: [1, 0] }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeIn" }}
          className="absolute"
        >
          {getLogoForView(fromView)}
        </motion.div>

        {/* Incoming Sandbox Logo */}
        <motion.div
          animate={{ x: [-80, 0], opacity: [0, 1] }}
          transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
          className="absolute"
        >
          {getLogoForView(toView)}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}