export default function VvaGraphicsSVG() {
return (
<div className="w-full max-w-4xl h-[50vh] flex items-center justify-center">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" // Change this to match your exported SVG's viewBox!
        className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(239,68,68,0.4)]">
        {/* 1. Paste your SVG paths inside this <g> tag.
            2. Ensure every path has className="animate-svg-path"
            3. GSAP will trace the red stroke, then flash the red fill!
            */}
            <g className="svg-fill-group fill-[#ef4444] stroke-[#ef4444] stroke-[1px]">

                {/* PASTE PATHS HERE */}
                {/* Example:
                <path className="animate-svg-path" d="M10... " /> */}

            </g>
    </svg>
</div>
);
}