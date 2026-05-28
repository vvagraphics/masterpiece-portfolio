import type { SVGProps } from 'react';

export default function StructureLogicSVG(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="w-full max-w-4xl h-[60vh] flex items-center justify-center">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 800 600" // Change this to match your exported SVG's viewBox!
        className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(45,212,191,0.5)]"
        {...props}
      >
        {/* 1. Paste your SVG paths inside this <g> tag.
          2. Ensure every path has className="animate-svg-path"
          3. GSAP will trace the teal stroke, then flash the teal fill!
        */}
        <g className="svg-fill-group fill-[#2dd4bf] stroke-[#2dd4bf] stroke-[1px]">
            
            {/* PASTE PATHS HERE */}

        </g>
      </svg>
    </div>
  );
}