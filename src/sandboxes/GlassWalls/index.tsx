// src/sandboxes/GlassWalls/index.tsx
import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text3D, MeshTransmissionMaterial, Environment, Caustics, Float } from '@react-three/drei';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';

interface Props {
  isAudioEnabled?: boolean;
}

// Map user-friendly names to Three.js Font JSON files
const FONTS: Record<string, string> = {
  Modern: 'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
  Classic: 'https://threejs.org/examples/fonts/gentilis_regular.typeface.json',
  Script: 'https://threejs.org/examples/fonts/optimer_regular.typeface.json'
};

const GLASS_SCHEMA: ControlDef[] = [
  { id: 'signature', type: 'text', label: 'Signature', defaultValue: 'VVA' },
  { id: 'font', type: 'select', label: 'Font Style', options: ['Modern', 'Classic', 'Script'], defaultValue: 'Modern' },
  { id: 'ior', type: 'slider', label: 'Refractive Index (n)', min: 1.0, max: 2.5, step: 0.01, defaultValue: 1.5 },
  { id: 'chromaticAberration', type: 'slider', label: 'Chromatic Aberration', min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
  { id: 'roughness', type: 'slider', label: 'Surface Etching', min: 0, max: 0.5, step: 0.01, defaultValue: 0.05 },
  { id: 'thickness', type: 'slider', label: 'Glass Thickness', min: 0.1, max: 5, step: 0.1, defaultValue: 1.5 },
  { id: 'showCaustics', type: 'toggle', label: 'Caustic Projections', defaultValue: true }
];

// --- The 3D Scene Component ---
function GlassScene({ 
  controlsRef, 
  signatureText, 
  fontStyle 
}: { 
  controlsRef: React.MutableRefObject<any>;
  signatureText: string;
  fontStyle: string;
}) {
  const materialRef = useRef<any>(null);

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.ior = controlsRef.current.ior;
      materialRef.current.chromaticAberration = controlsRef.current.chromaticAberration;
      materialRef.current.roughness = controlsRef.current.roughness;
      materialRef.current.thickness = controlsRef.current.thickness;
    }
  });

  const activeFontUrl = FONTS[fontStyle] || FONTS.Modern;

  const GlassObject = (
    <Text3D 
      font={activeFontUrl} 
      size={2.5}
      height={1}
      curveSegments={24} // PERFORMANCE: Reduced from 32
      bevelEnabled
      bevelThickness={0.1}
      bevelSize={0.05} // Narrowed bevel slightly for cleaner edges
      bevelSegments={8} // PERFORMANCE: Reduced from 16
    >
      {signatureText || " "} {/* Prevents crashing if input is totally empty */}
      <MeshTransmissionMaterial 
        ref={materialRef}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transmission={1}
        resolution={256} // PERFORMANCE: Huge frame saver. 256 is usually enough for refraction
        samples={4}      // PERFORMANCE: Controls raycasting blur density
        color="#ffffff"
      />
    </Text3D>
  );

  return (
    <>
      <color attach="background" args={['#050505']} />
      
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <Center>
          {controlsRef.current.showCaustics ? (
            <Caustics
              color="#ffffff"
              position={[0, -2, 0]}
              lightSource={[10, 10, 5]}
              intensity={0.05}
              worldRadius={0.2}
              ior={controlsRef.current.ior}
              causticsOnly={false}
              backside={false}
              resolution={512} // PERFORMANCE: Lower caustics map size
            >
              {GlassObject}
            </Caustics>
          ) : (
            GlassObject
          )}
        </Center>
      </Float>

      {/* Background shapes to refract through the glass */}
      <mesh position={[-3, -1, -5]}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial color="#ef4444" roughness={0.2} />
      </mesh>
      
      <mesh position={[4, 2, -8]}>
        <torusGeometry args={[1.5, 0.5, 32, 100]} />
        <meshStandardMaterial color="#14b8a6" roughness={0.2} />
      </mesh>
    </>
  );
}

// --- The Main Sandbox Component ---
export default function GlassWalls({ isAudioEnabled = false }: Props) {
  // Sliders map to Ref for 60fps WebGL updates
  const controlsRef = useRef<Record<string, any>>({
    ior: 1.5,
    chromaticAberration: 0.15,
    roughness: 0.05,
    thickness: 1.5,
    showCaustics: true
  });

  // Text/Font map to State because Geometry needs to rebuild
  const [signatureText, setSignatureText] = useState('VVA');
  const [fontStyle, setFontStyle] = useState('Modern');

  const envSoundRef = useRef<Howl | null>(null);
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);

  useEffect(() => {
    envSoundRef.current = new Howl({
      src: ['/audio/ambient.mp3'], 
      loop: true,
      volume: 0,
    });

    return () => {
      const envAudio = envSoundRef.current;
      if (envAudio) {
        const currentVol = typeof envAudio.volume() === 'number' ? envAudio.volume() as number : 0;
        envAudio.fade(currentVol, 0, 500);
        setTimeout(() => envAudio.unload(), 500);
      }
    };
  }, []);

  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = typeof envSoundRef.current.volume() === 'number' ? envSoundRef.current.volume() as number : 0;
    
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.3, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

  const handleControlChange = (id: string, value: any) => {
    if (id === 'signature') {
      setSignatureText(value);
    } else if (id === 'font') {
      setFontStyle(value);
    } else {
      controlsRef.current[id] = value;
    }
  };

  return (
    <div className="relative w-full h-full bg-black">
      
      {/* PERFORMANCE: dpr={...} clamping prevents 4K retina displays from tanking FPS */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }} dpr={[1, 1.5]}>
          {/* Suspense is required when loading fonts/textures asynchronously in R3F */}
          <Suspense fallback={null}>
             <GlassScene 
                controlsRef={controlsRef} 
                signatureText={signatureText}
                fontStyle={fontStyle}
             />
          </Suspense>
        </Canvas>
      </div>

      <SandboxControls 
        title="Glass Sandbox" 
        schema={GLASS_SCHEMA} 
        onChange={handleControlChange} 
      />

      <div className="absolute bottom-8 left-8 z-30">
        <button
          onClick={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded border transition-colors ${
            !isEnvAudioMuted ? 'bg-teal-600 border-teal-500 text-white' : 'border-zinc-600 text-zinc-400'
          }`}
        >
          {isEnvAudioMuted ? 'Unmute Ethereal Ambience' : 'Mute Ethereal Ambience'}
        </button>
      </div>

    </div>
  );
}