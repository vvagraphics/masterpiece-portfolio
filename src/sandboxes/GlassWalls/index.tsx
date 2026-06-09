// src/sandboxes/GlassWalls/index.tsx
import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, RoundedBox, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

// --- SCHEMA ---
const GLASS_SCHEMA: ControlDef[] = [
  { id: 'signoff', type: 'textarea', label: 'Signature', defaultValue: 'VVA\nGRAPHICS' },
  { id: 'tint', type: 'select', label: 'Global Tint', options: ['None', 'Rose', 'Cyan', 'Amber'], defaultValue: 'None' },
  { id: 'spacing', type: 'slider', label: 'Spacing', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5 },
  { id: 'quality', type: 'select', label: 'Render Mode', options: ['Fast (Draft)', 'Ultra (Render)'], defaultValue: 'Fast (Draft)' },
  { id: 'environment', type: 'select', label: 'Environment', options: ['city', 'studio', 'sunset', 'night'], defaultValue: 'city' },
  { id: 'background', type: 'select', label: 'Background', options: ['Floating Orbs', 'Minimal Dark', 'Custom Image'], defaultValue: 'Floating Orbs' },
  { id: 'textStyle', type: 'select', label: 'Text Style', options: ['Floating', 'Engraved'], defaultValue: 'Floating' },
  { id: 'neonCore', type: 'select', label: 'Neon Core', options: ['Off', 'Pulse', 'Static'], defaultValue: 'Off' },
  { id: 'depthChaos', type: 'slider', label: 'Depth Chaos', min: 0.0, max: 2.0, step: 0.1, defaultValue: 0.0 },
];

// --- TEXTURE HOOK ---
const useSafeTextures = () => {
  const [textures, setTextures] = useState<Record<string, THREE.Texture | null>>({});
  
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const urls = {
      glassNormal: '/textures/glass_normal.jpg',
      frostedNormal: '/textures/frosted.webp',
      brokenGlass: '/textures/broken.webp',
      rainGlass: '/textures/rain.webp',
      firstWebsite: '/glasswalls.jpeg',
      bgCustom: '/textures/bg_custom.webp' 
    };
    
    const loaded: Record<string, THREE.Texture | null> = {};
    let loadedCount = 0;
    const total = Object.keys(urls).length;

    Object.entries(urls).forEach(([key, url]) => {
      loader.load(
        url,
        (tex) => {
          if (key === 'firstWebsite' || key === 'bgCustom') {
            tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = THREE.SRGBColorSpace;
          } else {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping; 
          }
          loaded[key] = tex;
          loadedCount++;
          if (loadedCount === total) setTextures({ ...loaded });
        },
        undefined,
        () => {
          // Silent fail for production, will just render blank if texture is missing
          loaded[key] = null;
          loadedCount++;
          if (loadedCount === total) setTextures({ ...loaded });
        }
      );
    });
  }, []);

  return { textures };
};

// --- AUDIO PLAYER ---
const playClink = (type: string, isAudioEnabled: boolean) => {
  if (!isAudioEnabled) return;
  let src = '/audio/clink_clear.mp3';
  if (type === 'Frosted') src = '/audio/clink_frosted.mp3';
  if (type === 'Broken') src = '/audio/clink_church.mp3'; 
  if (type === 'Rain') src = '/audio/clink_clear.mp3';

  const audio = new Audio(src);
  audio.volume = 0.8;
  audio.playbackRate = 0.8 + Math.random() * 0.4;
  audio.play().catch(e => console.log("Audio blocked", e));
};

// --- GLASS SHADER ---
const GlassMaterial = ({ type, tint, textures, quality }: any) => {
  const baseTint = tint === 'Rose' ? '#fda4af' : tint === 'Cyan' ? '#67e8f9' : tint === 'Amber' ? '#fcd34d' : '#ffffff';
  const isDraft = quality === 'Fast (Draft)';

  if (!textures || Object.keys(textures).length === 0) {
    return <meshPhysicalMaterial transmission={1} roughness={0.1} thickness={2} color={baseTint} transparent />;
  }

  if (isDraft) {
    switch (type) {
      case 'Frosted': return <meshPhysicalMaterial normalMap={textures.frostedNormal} normalScale={new THREE.Vector2(3, 3)} transmission={0.9} roughness={0.4} thickness={2} ior={1.2} color={baseTint} transparent />;
      case 'Broken': return <meshPhysicalMaterial normalMap={textures.brokenGlass} normalScale={new THREE.Vector2(3, 3)} transmission={1} roughness={0.05} thickness={2} ior={1.5} color={baseTint} transparent />;
      case 'Rain': return <meshPhysicalMaterial normalMap={textures.rainGlass} normalScale={new THREE.Vector2(2, 2)} transmission={1} roughness={0.05} thickness={2} ior={1.3} color={baseTint} transparent />;
      case 'Clear': 
      default: return <meshPhysicalMaterial normalMap={textures.glassNormal} normalScale={new THREE.Vector2(1, 1)} transmission={1} roughness={0.0} thickness={2} ior={1.5} color={baseTint} transparent />;
    }
  }

  switch (type) {
    case 'Frosted': return <MeshTransmissionMaterial backside resolution={128} samples={2} thickness={1.5} roughness={0.4} transmission={1} ior={1.2} color={baseTint} normalMap={textures.frostedNormal} normalScale={new THREE.Vector2(3, 3)} distortion={0.1} distortionScale={0.5} />;
    case 'Broken': return <MeshTransmissionMaterial backside resolution={128} samples={2} thickness={1.5} roughness={0.05} transmission={1} ior={1.5} color={baseTint} normalMap={textures.brokenGlass} normalScale={new THREE.Vector2(3, 3)} distortion={0.4} distortionScale={1} />;
    case 'Rain': return <MeshTransmissionMaterial backside resolution={128} samples={2} thickness={1.5} roughness={0.05} transmission={1} ior={1.3} color={baseTint} normalMap={textures.rainGlass} normalScale={new THREE.Vector2(2, 2)} distortion={0.2} distortionScale={1} />;
    case 'Clear': 
    default: return <MeshTransmissionMaterial backside resolution={128} samples={3} thickness={1.5} roughness={0.05} transmission={1} ior={1.5} color={baseTint} normalMap={textures.glassNormal} normalScale={new THREE.Vector2(1, 1)} chromaticAberration={0.05} />;
  }
};

// --- ORB BACKGROUND ---
function BackgroundRefractors() {
  return (
    <group position={[0, 0, -6]}>
      <Float speed={1.5} floatIntensity={2}>
        <mesh position={[-4, 2, 0]}>
          <sphereGeometry args={[2, 32, 32]} />
          <meshBasicMaterial color="#00ffff" opacity={0.3} transparent />
        </mesh>
      </Float>
      <Float speed={2} floatIntensity={2}>
        <mesh position={[4, -2, 0]}>
          <sphereGeometry args={[3, 32, 32]} />
          <meshBasicMaterial color="#ff00ff" opacity={0.3} transparent />
        </mesh>
      </Float>
    </group>
  );
}

// --- LETTER PANE ---
function LetterPane({ char, rowIndex, colIndex, rowLength, totalRows, tint, spacing, isAudioEnabled, layoutMode, quality, textures, textStyle, neonCore, depthChaos }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const [localGlassType, setLocalGlassType] = useState('Clear');

  const randomDepth = useMemo(() => (Math.random() - 0.5) * depthChaos, [depthChaos]);

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

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 5, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 5, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, randomDepth, 5, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 8, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 8, delta);
    }
    
    if (neonCore === 'Pulse' && lightRef.current) {
      lightRef.current.intensity = 0.5 + Math.sin(state.clock.elapsedTime * 2 + colIndex) * 0.4;
    }
  });

  const handleCycleGlass = () => {
    const types = ['Clear', 'Frosted', 'Broken', 'Rain'];
    const currentIndex = types.indexOf(localGlassType);
    const nextType = types[(currentIndex + 1) % types.length];
    
    setLocalGlassType(nextType);
    playClink(nextType, isAudioEnabled);
    
    if (groupRef.current) {
      groupRef.current.rotation.z = (Math.random() - 0.5) * 0.8;
      groupRef.current.rotation.x = (Math.random() - 0.5) * 0.8;
    }
  };

  const isEngraved = textStyle === 'Engraved';
  const textZPosition = isEngraved ? 0.08 : 0.2;
  const neonColor = tint === 'Rose' ? '#fda4af' : tint === 'Cyan' ? '#67e8f9' : tint === 'Amber' ? '#fcd34d' : '#00ffff';

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <group onClick={handleCycleGlass} onPointerOver={() => document.body.style.cursor = 'pointer'} onPointerOut={() => document.body.style.cursor = 'auto'}>
          <mesh>
            <RoundedBox args={[spacing * 0.8, spacing * 1.3, 0.15]} radius={0.04} smoothness={2}>
              <GlassMaterial key={`${localGlassType}-${quality}`} type={localGlassType} tint={tint} textures={textures} quality={quality} />
            </RoundedBox>
          </mesh>
          
          {neonCore !== 'Off' && (
             <pointLight ref={lightRef} position={[0, 0, 0]} intensity={neonCore === 'Static' ? 0.8 : 0.5} distance={spacing * 1.5} color={neonColor} />
          )}

          <Text 
             position={[0, 0, textZPosition]} 
             fontSize={spacing * 0.7} 
             anchorX="center" 
             anchorY="middle"
          >
            {char}
            {isEngraved ? (
              <meshPhysicalMaterial color="#ffffff" transmission={0.9} roughness={0.8} ior={1.5} transparent opacity={0.6} />
            ) : (
              <meshBasicMaterial color={localGlassType === 'Frosted' ? '#111111' : '#ffffff'} />
            )}
          </Text>
        </group>
      </Float>
    </group>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const { textures } = useSafeTextures();
  const lines = controls.signoff.split('\n');

  useEffect(() => {
    if (textures.firstWebsite) {
      textures.firstWebsite.wrapS = textures.firstWebsite.wrapT = THREE.ClampToEdgeWrapping;
      textures.firstWebsite.minFilter = THREE.LinearFilter;
    }
  }, [textures.firstWebsite]);

  return (
    <>
      <Environment preset={controls.environment || 'city'} background={false} />

      {/* Increased planeGeometry args to [45, 30] to fill entire camera view, removing top/bottom black borders */}
      {layoutMode === 'FULL' && textures.firstWebsite && (
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[45, 30]} /> 
          <meshBasicMaterial map={textures.firstWebsite} toneMapped={false} />
        </mesh>
      )}

      {layoutMode !== 'FULL' && controls.background === 'Floating Orbs' && <BackgroundRefractors />}

      {layoutMode !== 'FULL' && controls.background === 'Custom Image' && textures.bgCustom && (
        <mesh position={[0, 0, -10]}>
          <planeGeometry args={[45, 30]} />
          <meshBasicMaterial map={textures.bgCustom} toneMapped={false} opacity={0.5} transparent />
        </mesh>
      )}

      {/* Shift Center UP by 2.5 on the Y-Axis during FULL layout so text doesn't hide behind controls */}
      <Center position={[0, layoutMode === 'FULL' ? 2.5 : 0, 0]}>
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
  const [controls, setControls] = useState({ 
    signoff: 'VVA\nGRAPHICS', 
    tint: 'None', 
    spacing: 1.5, 
    quality: 'Fast (Draft)',
    environment: 'city',
    background: 'Floating Orbs',
    textStyle: 'Floating',
    neonCore: 'Off',
    depthChaos: 0.0
  });
  
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
      splitBackgroundImage="/glasswalls.jpeg" 
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