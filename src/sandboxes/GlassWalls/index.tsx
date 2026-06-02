// src/sandboxes/GlassWalls/index.tsx
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, RoundedBox, MeshTransmissionMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

const GLASS_SCHEMA: ControlDef[] = [
  { id: 'signoff', type: 'textarea', label: 'Signature', defaultValue: 'VVA\nGRAPHICS' },
  { id: 'tint', type: 'select', label: 'Global Tint', options: ['None', 'Rose', 'Cyan', 'Amber'], defaultValue: 'None' },
  { id: 'spacing', type: 'slider', label: 'Spacing', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5 },
  { id: 'quality', type: 'select', label: 'Render Mode', options: ['Fast (Draft)', 'Ultra (Render)'], defaultValue: 'Fast (Draft)' },
];

// --- BULLETPROOF TEXTURE HOOK ---
const useSafeTextures = () => {
  const [textures, setTextures] = useState<Record<string, THREE.Texture | null>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const urls = {
      glassNormal: '/textures/glass_normal.jpg',
      frostedNormal: '/textures/frosted_normal.jpg',
      churchColor: '/textures/church_color.jpg',
      brokenGlass: '/textures/broken_glass.jpg',
      rainGlass: '/textures/rain_glass.jpg',
      firstWebsite: '/first_website.jpg'
    };
    
    const loaded: Record<string, THREE.Texture | null> = {};
    const currentStatus: Record<string, string> = {};

    Object.keys(urls).forEach(k => currentStatus[k] = '⏳ Loading...');
    setStatus({ ...currentStatus });

    let loadedCount = 0;
    const total = Object.keys(urls).length;

    Object.entries(urls).forEach(([key, url]) => {
      loader.load(
        url,
        (tex) => {
          tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
          if (key === 'firstWebsite') tex.colorSpace = THREE.SRGBColorSpace;
          loaded[key] = tex;
          currentStatus[key] = '✅ Loaded';
          loadedCount++;
          setStatus({ ...currentStatus });
          if (loadedCount === total) setTextures({ ...loaded });
        },
        undefined,
        (err) => {
          console.error(`Failed to load ${url}`, err);
          loaded[key] = null;
          currentStatus[key] = '❌ Failed';
          loadedCount++;
          setStatus({ ...currentStatus });
          if (loadedCount === total) setTextures({ ...loaded });
        }
      );
    });
  }, []);

  return { textures, status };
};

// --- INSTANT AUDIO PLAYER ---
const playClink = (type: string, isAudioEnabled: boolean) => {
  if (!isAudioEnabled) return;
  let src = '/audio/clink_clear.mp3';
  if (type === 'Frosted') src = '/audio/clink_frosted.mp3';
  if (type === 'Church' || type === 'Broken') src = '/audio/clink_church.mp3';
  if (type === 'Rain') src = '/audio/clink_clear.mp3';

  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.playbackRate = 0.8 + Math.random() * 0.4;
  audio.play().catch(e => console.log("Audio blocked by browser", e));
};

// --- DUAL-MODE GLASS SHADER (FIXED FOR B&W IMPRINTS) ---
const GlassMaterial = ({ type, tint, textures, quality }: any) => {
  const baseTint = tint === 'Rose' ? '#fda4af' : tint === 'Cyan' ? '#67e8f9' : tint === 'Amber' ? '#fcd34d' : '#ffffff';
  const isDraft = quality === 'Fast (Draft)';

  if (!textures || Object.keys(textures).length === 0) {
    return <meshPhysicalMaterial transmission={1} roughness={0.1} thickness={2} color={baseTint} transparent />;
  }

  // --- DRAFT MODE ---
  if (isDraft) {
    switch (type) {
      case 'Frosted': 
        return <meshPhysicalMaterial normalMap={textures.frostedNormal} normalScale={new THREE.Vector2(3, 3)} transmission={0.9} roughness={0.4} thickness={2} ior={1.2} color={baseTint} transparent />;
      case 'Church': 
        // FIX: Use 'map' instead of 'bumpMap' to show the picture. 
        // We set 'opacity' to 0.8 so it's slightly see-through!
        return <meshPhysicalMaterial map={textures.churchColor} opacity={0.8} transmission={0.2} roughness={0.2} thickness={1} ior={1.5} color={baseTint} transparent={true} />;
      case 'Frosted':
      case 'Broken': 
        return <meshPhysicalMaterial normalMap={textures.brokenGlass} normalScale={new THREE.Vector2(3, 3)} transmission={1} roughness={0.05} thickness={2} ior={1.5} color={baseTint} transparent />;
      case 'Rain': 
        return <meshPhysicalMaterial normalMap={textures.rainGlass} normalScale={new THREE.Vector2(2, 2)} transmission={1} roughness={0.05} thickness={2} ior={1.3} color={baseTint} transparent />;
      case 'Clear': 
      default: 
        return <meshPhysicalMaterial normalMap={textures.glassNormal} normalScale={new THREE.Vector2(1, 1)} transmission={1} roughness={0.0} thickness={2} ior={1.5} color={baseTint} transparent />;
    }
  }

  // --- ULTRA MODE ---
  switch (type) {
    case 'Frosted': 
      return <MeshTransmissionMaterial backside resolution={256} samples={2} thickness={1.5} roughness={0.4} transmission={1} ior={1.2} color={baseTint} normalMap={textures.frostedNormal} normalScale={new THREE.Vector2(3, 3)} distortion={0.1} distortionScale={0.5} />;
    case 'Church': 
      return <MeshTransmissionMaterial backside resolution={256} samples={2} thickness={1.5} roughness={0.05} transmission={1} ior={1.5} color={baseTint} normalMap={textures.churchColor} normalScale={new THREE.Vector2(2, 2)} distortion={0.3} distortionScale={1} />;
    case 'Broken': 
      return <MeshTransmissionMaterial backside resolution={256} samples={2} thickness={1.5} roughness={0.05} transmission={1} ior={1.5} color={baseTint} normalMap={textures.brokenGlass} normalScale={new THREE.Vector2(3, 3)} distortion={0.4} distortionScale={1} />;
    case 'Rain': 
      return <MeshTransmissionMaterial backside resolution={256} samples={2} thickness={1.5} roughness={0.05} transmission={1} ior={1.3} color={baseTint} normalMap={textures.rainGlass} normalScale={new THREE.Vector2(2, 2)} distortion={0.2} distortionScale={1} />;
    case 'Clear': 
    default: 
      return <MeshTransmissionMaterial backside resolution={256} samples={3} thickness={1.5} roughness={0.05} transmission={1} ior={1.5} color={baseTint} normalMap={textures.glassNormal} normalScale={new THREE.Vector2(1, 1)} chromaticAberration={0.05} />;
  }
};

// --- BACKGROUND REFRACTORS ---
function BackgroundRefractors() {
  return (
    <group position={[0, 0, -6]}>
      <Float speed={1.5} floatIntensity={2}>
        <mesh position={[-4, 2, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial color="#00ffff" opacity={0.5} transparent />
        </mesh>
      </Float>
      <Float speed={2} floatIntensity={2}>
        <mesh position={[4, -2, 0]}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial color="#ff00ff" opacity={0.5} transparent />
        </mesh>
      </Float>
    </group>
  );
}

// --- INTERACTIVE LETTER BLOCK ---
function LetterPane({ char, rowIndex, colIndex, rowLength, totalRows, tint, spacing, isAudioEnabled, layoutMode, quality, textures }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const [localGlassType, setLocalGlassType] = useState('Clear');

  const isVertical = layoutMode === 'SPLIT_VERT';
  let targetX = 0;
  let targetY = 0;

  if (isVertical) {
    targetY = ((rowLength - 1) / 2 - colIndex) * (spacing * 1.3);
    targetX = (rowIndex - (totalRows - 1) / 2) * (spacing * 1.2);
  } else {
    targetX = (colIndex - (rowLength - 1) / 2) * spacing;
    targetY = ((totalRows - 1) / 2 - rowIndex) * (spacing * 1.5);
  }

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 5, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 8, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 8, delta);
    }
  });

  const handleCycleGlass = () => {
    const types = ['Clear', 'Frosted', 'Church', 'Broken', 'Rain'];
    const currentIndex = types.indexOf(localGlassType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    setLocalGlassType(nextType);
    playClink(nextType, isAudioEnabled);
    
    if (groupRef.current) {
      groupRef.current.rotation.z = (Math.random() - 0.5) * 0.8;
      groupRef.current.rotation.x = (Math.random() - 0.5) * 0.8;
    }
  };

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <group onClick={handleCycleGlass} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
          <mesh>
            <RoundedBox args={[spacing * 0.8, spacing * 1.3, 0.15]} radius={0.04} smoothness={2}>
              <GlassMaterial key={`${localGlassType}-${quality}`} type={localGlassType} tint={tint} textures={textures} quality={quality} />
            </RoundedBox>
          </mesh>
          <Text position={[0, 0, 0.08]} fontSize={spacing * 0.7} color={localGlassType === 'Frosted' ? '#111111' : '#ffffff'} anchorX="center" anchorY="middle">
            {char}
          </Text>
        </group>
      </Float>
    </group>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const { textures, status } = useSafeTextures();
  const lines = controls.signoff.split('\n');

  useEffect(() => {
    if (textures.firstWebsite) {
      textures.firstWebsite.wrapS = textures.firstWebsite.wrapT = THREE.ClampToEdgeWrapping;
      textures.firstWebsite.minFilter = THREE.LinearFilter;
    }
  }, [textures.firstWebsite]);

  return (
    <>
      <Html position={[-6, 4, 0]} className="pointer-events-none select-none">
        <div className="bg-black/90 p-4 rounded-lg border border-zinc-700 w-72 text-white font-mono text-xs shadow-2xl backdrop-blur-md opacity-50 hover:opacity-100 transition-opacity">
          <h3 className="text-teal-400 font-bold mb-3 border-b border-zinc-700 pb-2 uppercase tracking-widest">Diagnostics</h3>
          <div className="flex flex-col gap-2">
            {Object.entries(status).map(([key, state]) => (
              <div key={key} className="flex justify-between items-center">
                <span className="text-zinc-400">{key}:</span>
                <span className={state.includes('✅') ? 'text-green-400 font-bold' : state.includes('❌') ? 'text-red-400 font-bold' : 'text-yellow-400 animate-pulse'}>
                  {state}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Html>

      {layoutMode === 'FULL' && textures.firstWebsite && (
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[26, 16]} /> 
          <meshBasicMaterial map={textures.firstWebsite} toneMapped={false} />
        </mesh>
      )}

      {layoutMode !== 'FULL' && <BackgroundRefractors />}

      <Center>
        {lines.map((line: string, rowIndex: number) => {
          const chars = line.split('').filter(c => c !== ' ');
          return chars.map((char: string, colIndex: number) => (
            <LetterPane 
              key={`${rowIndex}-${colIndex}-${char}`} 
              char={char} 
              rowIndex={rowIndex}
              colIndex={colIndex}
              rowLength={chars.length}
              totalRows={lines.length} 
              layoutMode={layoutMode}
              textures={textures}
              {...controls} 
              isAudioEnabled={isAudioEnabled} 
            />
          ));
        })}
      </Center>
    </>
  );
}

// --- MAIN COMPONENT ---
export default function GlassWalls({ isAudioEnabled = false }: Props) {
  const [controls, setControls] = useState({ signoff: 'VVA\nGRAPHICS', tint: 'None', spacing: 1.5, quality: 'Fast (Draft)' });
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);
  const envSoundRef = useRef<Howl | null>(null);

  useEffect(() => {
    const windChimes = new Howl({ src: ['/audio/wind_chimes_loop.mp3'], loop: true, volume: 0 });
    envSoundRef.current = windChimes;
    return () => {
      const currentVol = windChimes.volume() as number;
      windChimes.fade(currentVol, 0, 500);
      setTimeout(() => windChimes.unload(), 500);
    };
  }, []);

  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = envSoundRef.current.volume() as number;
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.3, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

  return (
    <SandboxShell
      title="Glass Signature"
      layoutMode={layoutMode}
      onLayoutChange={setLayoutMode}
      splitBackgroundImage="/first_website.jpg" 
      isEnvAudioMuted={isEnvAudioMuted}
      onToggleEnvAudio={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
      controls={ <SandboxControls schema={GLASS_SCHEMA} onChange={(id, val) => setControls(p => ({...p, [id]: val}))} /> }
    >
      <div className={`absolute bottom-0 right-0 transition-all duration-500 ease-in-out ${
        layoutMode === 'FULL' ? 'w-full h-full' :
        layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
      }`}>
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 1.5]}>
          <color attach="background" args={['#050505']} />
          
          <Environment preset="city" background={false} />
          <ambientLight intensity={2} />
          <directionalLight position={[5, 10, 5]} intensity={4} />
          
          <pointLight position={[-5, 0, -5]} intensity={3} color="#00ffff" />
          <pointLight position={[5, 0, -5]} intensity={3} color="#ff00ff" />
          <pointLight position={[0, 0, 5]} intensity={2} color="#ffffff" />

          <SceneManager controls={controls} isAudioEnabled={isAudioEnabled && !isEnvAudioMuted} layoutMode={layoutMode} />
        </Canvas>
      </div>
    </SandboxShell>
  );
}