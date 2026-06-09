// src/sandboxes/Gacha/index.tsx
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, Sparkles, MeshTransmissionMaterial, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

// --- SCHEMA ---
// We keep controls minimal because the GACHA SYSTEM does the hard work!
const GACHA_SCHEMA: ControlDef[] = [
  { id: 'signature', type: 'textarea', label: 'Sign-Off', defaultValue: 'VVA\nGRAPHICS' },
];

// --- RARITY SYSTEM ---
type RarityLevel = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

interface StyleTrait {
  name: string;
  rarity: RarityLevel;
  color: string;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  isGlass?: boolean;
}

const GACHA_POOL: StyleTrait[] = [
  // COMMON (Matte / Plastic)
  { name: 'Matte Slate', rarity: 'COMMON', color: '#475569', metalness: 0.1, roughness: 0.8 },
  { name: 'Forest Plastic', rarity: 'COMMON', color: '#166534', metalness: 0.1, roughness: 0.8 },
  { name: 'Cobalt Shell', rarity: 'COMMON', color: '#1e3a8a', metalness: 0.1, roughness: 0.8 },
  // RARE (Metallic / Shiny)
  { name: 'Polished Silver', rarity: 'RARE', color: '#e2e8f0', metalness: 1.0, roughness: 0.2 },
  { name: 'Copper Core', rarity: 'RARE', color: '#b45309', metalness: 1.0, roughness: 0.2 },
  { name: 'Bismuth', rarity: 'RARE', color: '#c026d3', metalness: 0.9, roughness: 0.1 },
  // EPIC (Glowing / Neon)
  { name: 'Cyber Pink', rarity: 'EPIC', color: '#fdf2f8', emissive: '#ec4899', emissiveIntensity: 2, metalness: 0.5, roughness: 0.2 },
  { name: 'Toxic Glow', rarity: 'EPIC', color: '#f0fdf4', emissive: '#22c55e', emissiveIntensity: 2, metalness: 0.5, roughness: 0.2 },
  { name: 'Plasma Blue', rarity: 'EPIC', color: '#eff6ff', emissive: '#3b82f6', emissiveIntensity: 2, metalness: 0.5, roughness: 0.2 },
  // LEGENDARY (Glass / Prismatic / Overpowered)
  { name: 'ASTRAL GOLD', rarity: 'LEGENDARY', color: '#fef08a', emissive: '#eab308', emissiveIntensity: 1, metalness: 1, roughness: 0, isGlass: true },
  { name: 'VOID CRYSTAL', rarity: 'LEGENDARY', color: '#ffffff', emissive: '#a855f7', emissiveIntensity: 1.5, metalness: 1, roughness: 0, isGlass: true }
];

const rollGacha = (): StyleTrait => {
  const roll = Math.random() * 100;
  let targetRarity: RarityLevel = 'COMMON';
  
  if (roll > 95) targetRarity = 'LEGENDARY'; // 5% chance
  else if (roll > 80) targetRarity = 'EPIC'; // 15% chance
  else if (roll > 50) targetRarity = 'RARE'; // 30% chance

  const pool = GACHA_POOL.filter(t => t.rarity === targetRarity);
  return pool[Math.floor(Math.random() * pool.length)];
};

// --- SYNTHETIC AUDIO ---
const playSound = (type: 'roll' | 'common' | 'rare' | 'epic' | 'legendary', isAudioEnabled: boolean) => {
  if (!isAudioEnabled) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    if (type === 'roll') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 1.5);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0, now + 1.5);
      osc.start(now);
      osc.stop(now + 1.5);
    } else if (type === 'common') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'rare') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Epic & Legendary get a major chord arp
      osc.type = type === 'legendary' ? 'sawtooth' : 'sine';
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = osc.type;
        subOsc.frequency.value = freq;
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        
        subGain.gain.setValueAtTime(0, now);
        subGain.gain.setValueAtTime(0.1, now + i * 0.1);
        subGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 1);
        
        subOsc.start(now + i * 0.1);
        subOsc.stop(now + i * 0.1 + 1);
      });
    }
  } catch (e) {
    console.log("Audio blocked");
  }
};

// --- GACHA PRISM COMPONENT ---
function GachaPrism({ onRollComplete, isAudioEnabled }: any) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isRolling, setIsRolling] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (isRolling) {
      // Shake and spin fast!
      meshRef.current.rotation.y += delta * 15;
      meshRef.current.rotation.x += delta * 10;
      meshRef.current.position.x = (Math.random() - 0.5) * 0.2;
      meshRef.current.position.y = (Math.random() - 0.5) * 0.2;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 20) * 0.2;
      meshRef.current.scale.set(scale, scale, scale);
    } else {
      // Idle float
      meshRef.current.rotation.y += delta * 1;
      meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, 0, 0.1);
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0, 0.1);
      meshRef.current.scale.set(1, 1, 1);
    }
  });

  const handleClick = () => {
    if (isRolling) return;
    setIsRolling(true);
    playSound('roll', isAudioEnabled);
    
    // Simulate gacha roll duration
    setTimeout(() => {
      setIsRolling(false);
      onRollComplete();
    }, 1500);
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef} 
        onClick={handleClick}
        onPointerOver={() => document.body.style.cursor = 'pointer'} 
        onPointerOut={() => document.body.style.cursor = 'auto'}
      >
        <octahedronGeometry args={[1.5, 0]} />
        <meshPhysicalMaterial 
          color={isRolling ? "#ffffff" : "#3b82f6"} 
          emissive={isRolling ? "#60a5fa" : "#1e3a8a"}
          emissiveIntensity={isRolling ? 2 : 0.5}
          metalness={0.8} 
          roughness={0.2} 
          wireframe={isRolling}
        />
      </mesh>
    </Float>
  );
}

// --- RENDERED TEXT COMPONENT ---
function PulledText({ text, styleObj, onReset }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const isEpic = styleObj.rarity === 'EPIC';
  const isLegendary = styleObj.rarity === 'LEGENDARY';

  useFrame((_, __) => {
    if (groupRef.current) {
      // Smooth entrance scale
      groupRef.current.scale.x = THREE.MathUtils.lerp(groupRef.current.scale.x, 1, 0.1);
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 1, 0.1);
      groupRef.current.scale.z = THREE.MathUtils.lerp(groupRef.current.scale.z, 1, 0.1);
    }
  });

  return (
    <group 
      ref={groupRef} 
      scale={[0.01, 0.01, 0.01]} // Start tiny for pop-in effect
      onClick={onReset}
      onPointerOver={() => document.body.style.cursor = 'pointer'} 
      onPointerOut={() => document.body.style.cursor = 'auto'}
    >
      <Float speed={isLegendary ? 3 : 1} floatIntensity={isLegendary ? 1 : 0.2}>
        <Center>
          <Text
            fontSize={2}
            lineHeight={1.1}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
          >
            {text}
            
            {styleObj.isGlass ? (
              <MeshTransmissionMaterial 
                backside 
                thickness={2} 
                roughness={styleObj.roughness} 
                transmission={1} 
                ior={1.5} 
                color={styleObj.color} 
                distortion={0.5} 
                distortionScale={0.5}
              />
            ) : (
              <meshStandardMaterial 
                color={styleObj.color} 
                emissive={styleObj.emissive || '#000000'}
                emissiveIntensity={styleObj.emissiveIntensity || 0}
                metalness={styleObj.metalness}
                roughness={styleObj.roughness}
              />
            )}
          </Text>
        </Center>
      </Float>

      {/* Rarity Effects */}
      {isEpic && <Sparkles count={50} scale={8} size={2} speed={0.4} color={styleObj.emissive} />}
      {isLegendary && (
        <>
          <Sparkles count={150} scale={10} size={4} speed={0.8} color="#ffffff" />
          <pointLight intensity={5} color={styleObj.emissive} distance={10} />
        </>
      )}
      
      {/* Rarity Label Floating above */}
      <Text position={[0, 3, 0]} fontSize={0.4} color={styleObj.emissive || styleObj.color} anchorX="center">
        {`[ ${styleObj.rarity} ]`}
      </Text>
      <Text position={[0, -2.5, 0]} fontSize={0.3} color="#666" anchorX="center">
        (Click text to reroll)
      </Text>
    </group>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const [gameState, setGameState] = useState<'IDLE' | 'REVEALED'>('IDLE');
  const [pulledStyle, setPulledStyle] = useState<StyleTrait | null>(null);

  const handleRollComplete = () => {
    const result = rollGacha();
    setPulledStyle(result);
    setGameState('REVEALED');
    
    // Play sound based on rarity
    if (result.rarity === 'COMMON') playSound('common', isAudioEnabled);
    if (result.rarity === 'RARE') playSound('rare', isAudioEnabled);
    if (result.rarity === 'EPIC') playSound('epic', isAudioEnabled);
    if (result.rarity === 'LEGENDARY') playSound('legendary', isAudioEnabled);
  };

  const resetGacha = () => {
    setGameState('IDLE');
    setPulledStyle(null);
  };

  return (
    <>
      <Environment preset="city" />
      <color attach="background" args={['#0a0a0a']} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />

      {/* Ground Pedestal */}
      <mesh position={[0, -3.5, 0]}>
        <cylinderGeometry args={[4, 5, 0.5, 32]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>
      <ContactShadows position={[0, -3.2, 0]} resolution={512} scale={15} blur={2} opacity={0.5} />

      {/* Shift entire scene up if in full mode to clear bottom UI */}
      <group position={[0, layoutMode === 'FULL' ? 1.5 : 0, 0]}>
        {gameState === 'IDLE' ? (
          <GachaPrism onRollComplete={handleRollComplete} isAudioEnabled={isAudioEnabled} />
        ) : (
          pulledStyle && (
            <PulledText 
              text={controls.signature} 
              styleObj={pulledStyle} 
              onReset={resetGacha} 
            />
          )
        )}
      </group>
    </>
  );
}

// --- MAIN COMPONENT ---
export default function Gacha({ isAudioEnabled = false }: Props) {
  const [controls, setControls] = useState({ 
    signature: 'VVA\nGRAPHICS'
  });
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);
  const envSoundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Ambient sci-fi space drone
    const drone = new Howl({ src: ['/audio/ambient.mp3'], loop: true, volume: 0 });
    envSoundRef.current = drone;
    return () => {
      const currentVol = drone.volume() as number;
      drone.fade(currentVol, 0, 500);
      setTimeout(() => drone.unload(), 500);
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
      title="Gacha Engine"
      layoutMode={layoutMode}
      onLayoutChange={setLayoutMode}
      activeTexture="/gacha.svg" 
      isEnvAudioMuted={isEnvAudioMuted}
      onToggleEnvAudio={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
      controls={ <SandboxControls schema={GACHA_SCHEMA} onChange={(id, val) => setControls(p => ({...p, [id]: val}))} /> }
    >
      {/* We add UI overlay text to guide the user */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 z-10 pointer-events-none text-center">
        <h2 className="text-white/30 tracking-[0.5em] text-sm md:text-xl uppercase font-bold blur-[0.5px]">
          Style Recombinator
        </h2>
      </div>

      <div className={`absolute bottom-0 right-0 transition-all duration-500 ease-in-out ${
        layoutMode === 'FULL' ? 'w-full h-full' :
        layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
      }`}>
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }} dpr={[1, 1.5]}>
          <SceneManager controls={controls} isAudioEnabled={isAudioEnabled && !isEnvAudioMuted} layoutMode={layoutMode} />
        </Canvas>
      </div>
    </SandboxShell>
  );
}