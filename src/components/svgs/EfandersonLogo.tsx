export default function EfandersonLogo() {
  return (
    <div className="w-full max-w-3xl h-[40vh] flex items-center justify-center">
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 800 600" // Change this to match your exported SVG's viewBox!
        className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.6)]"
      >
        {/* 1. Paste your SVG paths inside this <g> tag.
          2. Ensure every path has className="animate-svg-path"
          3. GSAP will trace the white stroke, then flash the white fill!
        */}
        <g className="svg-fill-group fill-white stroke-white stroke-[1px]">
            
            {/* PASTE PATHS HERE */}

        </g>
      </svg>
    </div>
  );
}