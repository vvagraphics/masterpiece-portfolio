// src/sandboxes/GlassWalls/index.tsx
import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, useTexture, RoundedBox } from '@react-three/drei';
import { Howl } from 'howler';
import * as THREE from 'three';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

const GLASS_SCHEMA: ControlDef[] = [
  // Changed to 'textarea' for multi-line!
  { id: 'signoff', type: 'textarea', label: 'Signature', defaultValue: 'VVA\nGRAPHICS' },
  { id: 'tint', type: 'select', label: 'Global Tint', options: ['None', 'Rose', 'Cyan', 'Amber'], defaultValue: 'None' },
  { id: 'spacing', type: 'slider', label: 'Spacing', min: 1.0, max: 3.0, step: 0.1, defaultValue: 1.5 },
];

const getMaterialProps = (type: string, tint: string, textures: any) => {
  const baseTint = tint === 'Rose' ? '#fda4af' : tint === 'Cyan' ? '#67e8f9' : tint === 'Amber' ? '#fcd34d' : '#ffffff';
  
  switch (type) {
    case 'Frosted': 
      return { transmission: 0.9, roughness: 0.5, clearcoat: 1, ior: 1.2, color: baseTint, normalMap: textures?.frostedNormal };
    case 'Church': 
      return { transmission: 0.7, roughness: 0.2, metalness: 0.5, clearcoat: 1, ior: 2.0, map: textures?.churchColor };
    case 'Clear': 
    default: 
      return { transmission: 1, roughness: 0.05, clearcoat: 1, ior: 1.5, color: baseTint, normalMap: textures?.glassNormal };
  }
};

// --- INTERACTIVE LETTER BLOCK ---
function LetterPane({ char, rowIndex, colIndex, rowLength, totalRows, tint, spacing, isAudioEnabled, textures, layoutMode }: any) {
  const clinkSoundRef = useRef<Howl | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [localGlassType, setLocalGlassType] = useState('Clear');

  // --- NEW GRID MATH ---
  const isVertical = layoutMode === 'SPLIT_VERT';
  
  let targetX = 0;
  let targetY = 0;

  if (isVertical) {
    // VERTICAL MODE: Letters go Top-to-Bottom (Y), New lines go Left-to-Right (X)
    targetY = ((rowLength - 1) / 2 - colIndex) * (spacing * 1.3);
    targetX = (rowIndex - (totalRows - 1) / 2) * (spacing * 1.2);
  } else {
    // HORIZONTAL MODE: Letters go Left-to-Right (X), New lines go Top-to-Bottom (Y)
    targetX = (colIndex - (rowLength - 1) / 2) * spacing;
    targetY = ((totalRows - 1) / 2 - rowIndex) * (spacing * 1.5);
  }

  useEffect(() => {
    const soundFile = localGlassType === 'Frosted' ? '/audio/clink_frosted.mp3' : 
                      localGlassType === 'Church' ? '/audio/clink_church.mp3' : 
                      '/audio/clink_clear.mp3';

    const sound = new Howl({ src: [soundFile], volume: 0.8 });
    clinkSoundRef.current = sound;
    return () => { sound.unload(); };
  }, [localGlassType]);

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetX, 4, delta);
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 4, delta);
      
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, 0, 8, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, 0, 8, delta);
    }
  });

  const handleCycleGlass = () => {
    if (isAudioEnabled && clinkSoundRef.current) {
      clinkSoundRef.current.rate(0.8 + Math.random() * 0.4); 
      clinkSoundRef.current.play();
    }
    setLocalGlassType(prev => prev === 'Clear' ? 'Frosted' : prev === 'Frosted' ? 'Church' : 'Clear');
    
    if (groupRef.current) {
      groupRef.current.rotation.z = (Math.random() - 0.5) * 0.8;
      groupRef.current.rotation.x = (Math.random() - 0.5) * 0.8;
    }
  };

  const matProps = getMaterialProps(localGlassType, tint, textures);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
        <group 
          onClick={handleCycleGlass} 
          onPointerOver={() => document.body.style.cursor = 'pointer'} 
          onPointerOut={() => document.body.style.cursor = 'auto'}
        >
          <mesh castShadow receiveShadow>
            <RoundedBox args={[spacing * 0.8, spacing * 1.3, 0.15]} radius={0.04} smoothness={4}>
              <meshPhysicalMaterial {...matProps} thickness={1.5} envMapIntensity={2} />
            </RoundedBox>
          </mesh>
          <Text
            position={[0, 0, 0.08]} 
            fontSize={spacing * 0.7}
            color={localGlassType === 'Church' ? '#ffffff' : '#111111'} 
            anchorX="center"
            anchorY="middle"
          >
            {char}
          </Text>
        </group>
      </Float>
    </group>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const textures = useTexture({
    glassNormal: '/textures/glass_normal.jpeg',
    frostedNormal: '/textures/frosted_normal.jpeg',
    churchColor: '/textures/church_color.jpeg'
  });

  // MULTI-LINE PARSING
  // Split the string by 'Enter' (newline), then process each row
  const lines = controls.signoff.split('\n');

  return (
    <Center>
      {lines.map((line: string, rowIndex: number) => {
        // Remove spaces so empty blocks don't render
        const chars = line.split('').filter(c => c !== ' ');
        return chars.map((char: string, colIndex: number) => (
          <LetterPane 
            key={`${rowIndex}-${colIndex}-${char}`} 
            char={char} 
            rowIndex={rowIndex}
            colIndex={colIndex}
            rowLength={chars.length}
            totalRows={lines.length} 
            textures={textures}
            layoutMode={layoutMode}
            {...controls} 
            isAudioEnabled={isAudioEnabled} 
          />
        ));
      })}
    </Center>
  );
}

// --- MAIN COMPONENT ---
export default function GlassWalls({ isAudioEnabled = false }: Props) {
  const [controls, setControls] = useState({ signoff: 'VVA\nGRAPHICS', tint: 'None', spacing: 1.5 });
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
          <Environment preset="city" background={false} />
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 10, 5]} intensity={3} />
          
          <pointLight position={[-5, 0, -5]} intensity={2} color="#00ffff" />
          <pointLight position={[5, 0, -5]} intensity={2} color="#ff00ff" />

          <Suspense fallback={null}>
            <SceneManager controls={controls} isAudioEnabled={isAudioEnabled && !isEnvAudioMuted} layoutMode={layoutMode} />
          </Suspense>
        </Canvas>
      </div>
    </SandboxShell>
  );
}