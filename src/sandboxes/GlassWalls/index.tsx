// src/sandboxes/GlassWalls/index.tsx
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text3D, MeshTransmissionMaterial, Environment, Caustics, Float } from '@react-three/drei';

import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';

interface Props {
  isAudioEnabled?: boolean;
}

// --- Define our schema for the Control Panel ---
const GLASS_SCHEMA: ControlDef[] = [
  { id: 'ior', type: 'slider', label: 'Refractive Index (n)', min: 1.0, max: 2.5, step: 0.01, defaultValue: 1.5 },
  { id: 'chromaticAberration', type: 'slider', label: 'Chromatic Aberration', min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
  { id: 'roughness', type: 'slider', label: 'Surface Etching', min: 0, max: 0.5, step: 0.01, defaultValue: 0.05 },
  { id: 'thickness', type: 'slider', label: 'Glass Thickness', min: 0.1, max: 5, step: 0.1, defaultValue: 1.5 },
  { id: 'showCaustics', type: 'toggle', label: 'Caustic Projections', defaultValue: true }
];

// --- The 3D Scene Component ---
// Separating this from the parent prevents the whole canvas from tearing down on state changes
function GlassScene({ controlsRef }: { controlsRef: React.MutableRefObject<any> }) {
  const materialRef = useRef<any>(null);

  // The render loop: Directly mutate the material on the GPU based on our UI refs
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.ior = controlsRef.current.ior;
      materialRef.current.chromaticAberration = controlsRef.current.chromaticAberration;
      materialRef.current.roughness = controlsRef.current.roughness;
      materialRef.current.thickness = controlsRef.current.thickness;
    }
  });

  const GlassObject = (
    <Text3D 
      font="https://threejs.org/examples/fonts/helvetiker_bold.typeface.json" 
      size={2.5}
      height={1}
      curveSegments={32}
      bevelEnabled
      bevelThickness={0.1}
      bevelSize={0.1}
      bevelSegments={16}
    >
      VVA
      <MeshTransmissionMaterial 
        ref={materialRef}
        clearcoat={1}
        clearcoatRoughness={0.1}
        transmission={1}
        resolution={1024}
        color="#ffffff"
      />
    </Text3D>
  );

  return (
    <>
      <color attach="background" args={['#050505']} />
      
      {/* Studio lighting environment for reflections */}
      <Environment preset="city" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={2} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
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
            >
              {GlassObject}
            </Caustics>
          ) : (
            GlassObject
          )}
        </Center>
      </Float>

      {/* Background shape to refract through the glass */}
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
  // Holds the current control values to feed the WebGL loop
  const controlsRef = useRef<Record<string, any>>({
    ior: 1.5,
    chromaticAberration: 0.15,
    roughness: 0.05,
    thickness: 1.5,
    showCaustics: true
  });

  const envSoundRef = useRef<Howl | null>(null);
  // Optional local mute just like the Graffiti canvas
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);

  // Audio Lifecycle
  useEffect(() => {
    envSoundRef.current = new Howl({
      src: ['/audio/ambient.mp3'], // Add a glass/ambient track to public/audio/
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

  // Audio Playback Handler
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

  // Handle updates from SandboxControls
  const handleControlChange = (id: string, value: any) => {
    controlsRef.current[id] = value;
  };

  return (
    <div className="relative w-full h-full bg-black">
      
      {/* 3D Canvas Layer */}
      <div className="absolute inset-0 z-10">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <GlassScene controlsRef={controlsRef} />
        </Canvas>
      </div>

      {/* Dynamic UI Controls Layer */}
      <SandboxControls 
        title="Glass Physics" 
        schema={GLASS_SCHEMA} 
        onChange={handleControlChange} 
      />

      {/* Audio Mute Button (Optional, keeping consistent with Graffiti UI) */}
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