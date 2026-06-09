// src/sandboxes/InkWell/index.tsx
import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

// --- SCHEMA ---
const INK_SCHEMA: ControlDef[] = [
  { id: 'signature', type: 'textarea', label: 'Sign-Off', defaultValue: 'VVA\nGRAPHICS' },
  { id: 'color', type: 'select', label: 'Ink Pigment', options: ['Abyss Black', 'Crimson Blood', 'Deep Sea', 'Liquid Gold'], defaultValue: 'Abyss Black' },
  { id: 'viscosity', type: 'slider', label: 'Flow Speed', min: 0.5, max: 4.0, step: 0.1, defaultValue: 1.5 },
  { id: 'bleed', type: 'slider', label: 'Ink Bleed', min: 0.0, max: 1.0, step: 0.05, defaultValue: 0.4 },
  { id: 'droplets', type: 'select', label: 'Ink Droplets', options: ['Heavy', 'Light', 'None'], defaultValue: 'Heavy' },
  { id: 'paper', type: 'select', label: 'Fluid Canvas', options: ['Parchment', 'Deep Water', 'Void'], defaultValue: 'Parchment' },
];

const COLOR_MAP: Record<string, string> = {
  'Abyss Black': '#151515',
  'Crimson Blood': '#7a0000',
  'Deep Sea': '#001f4d',
  'Liquid Gold': '#d4af37'
};

const BG_MAP: Record<string, string> = {
  'Parchment': '#eaddcf',
  'Deep Water': '#0a1e3f',
  'Void': '#050505'
};

// --- SYNTHETIC AUDIO GENERATOR (Liquid Bubbles) ---
const playBubble = (isAudioEnabled: boolean) => {
  if (!isAudioEnabled) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Start at a mid frequency and drop rapidly to simulate a bubble popping underwater
    osc.frequency.setValueAtTime(300 + Math.random() * 200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.log("Audio blocked", e);
  }
};

// --- INK DROPLET PARTICLES ---
function InkParticles({ count, color, isAudioEnabled }: { count: number, color: string, isAudioEnabled: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 20,
      y: (Math.random() - 0.5) * 15 - 5,
      z: (Math.random() - 0.5) * 8 - 4,
      speed: 0.2 + Math.random() * 0.8,
      wobbleSpeed: 0.5 + Math.random() * 2,
      scale: 0.05 + Math.random() * 0.15,
      offset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    particles.forEach((p, i) => {
      // Float upwards
      p.y += p.speed * delta;
      // Wobble side to side
      p.x += Math.sin(state.clock.elapsedTime * p.wobbleSpeed + p.offset) * 0.005;
      
      // Reset if it floats too high
      if (p.y > 10) {
        p.y = -10;
        p.x = (Math.random() - 0.5) * 20;
        // Occasional bubble sound when a droplet resets (simulating reaching the surface)
        if (Math.random() > 0.98) playBubble(isAudioEnabled);
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial 
        color={color} 
        roughness={0.2} 
        metalness={color === '#d4af37' ? 0.8 : 0.1} 
        transparent 
        opacity={0.8} 
      />
    </instancedMesh>
  );
}

// --- LIQUID TEXT COMPONENT ---
function LiquidText({ text, color, viscosity, bleed }: any) {
  const hexColor = COLOR_MAP[color] || '#151515';
  const isGold = color === 'Liquid Gold';

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Center>
        {/* LAYER 1: THE INK CLOUD (Bleeding out) */}
        <Text
          position={[0, 0, -0.5]}
          fontSize={2}
          lineHeight={1.1}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {text}
          <MeshDistortMaterial 
            color={hexColor} 
            speed={viscosity * 0.8} 
            distort={bleed * 1.5} 
            transparent 
            opacity={0.3} 
            roughness={1}
          />
        </Text>

        {/* LAYER 2: THE SOLID INK CORE */}
        <Text
          position={[0, 0, 0]}
          fontSize={2}
          lineHeight={1.1}
          anchorX="center"
          anchorY="middle"
          textAlign="center"
        >
          {text}
          <MeshDistortMaterial 
            color={hexColor} 
            speed={viscosity} 
            distort={bleed * 0.5} // Core distorts less to remain readable
            roughness={0.2} 
            metalness={isGold ? 0.9 : 0.1}
            clearcoat={isGold ? 0 : 0.5}
            clearcoatRoughness={0.1}
          />
        </Text>
      </Center>
    </Float>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const bgColor = BG_MAP[controls.paper] || '#eaddcf';
  const inkColorHex = COLOR_MAP[controls.color] || '#151515';
  
  const dropletCount = controls.droplets === 'Heavy' ? 150 : controls.droplets === 'Light' ? 40 : 0;

  return (
    <>
      <Environment preset="studio" />
      <color attach="background" args={[bgColor]} />
      {/* Fog helps blend the particles into the liquid environment */}
      <fog attach="fog" args={[bgColor, 5, 25]} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight position={[-5, -5, -5]} intensity={1} color={bgColor} />

      {/* Shift entire scene up if in full mode to clear bottom UI */}
      <group position={[0, layoutMode === 'FULL' ? 1.5 : 0, 0]}>
        
        <LiquidText 
          text={controls.signature} 
          color={controls.color} 
          viscosity={controls.viscosity}
          bleed={controls.bleed}
        />

        {dropletCount > 0 && (
          <InkParticles 
            count={dropletCount} 
            color={inkColorHex} 
            isAudioEnabled={isAudioEnabled} 
          />
        )}
      </group>
    </>
  );
}

// --- MAIN COMPONENT ---
export default function InkWell({ isAudioEnabled = false }: Props) {
  const [controls, setControls] = useState({ 
    signature: 'VVA\nGRAPHICS', 
    color: 'Abyss Black', 
    viscosity: 1.5, 
    bleed: 0.4,
    droplets: 'Heavy',
    paper: 'Parchment'
  });
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);
  const envSoundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // A soft, low rumble to sound like heavy water/fluid
    const liquidHum = new Howl({ src: ['/audio/water-hover.mp3'], loop: true, volume: 0 });
    envSoundRef.current = liquidHum;
    return () => {
      const currentVol = liquidHum.volume() as number;
      liquidHum.fade(currentVol, 0, 500);
      setTimeout(() => liquidHum.unload(), 500);
    };
  }, []);

  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = envSoundRef.current.volume() as number;
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.5, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

  return (
    <SandboxShell
      title="InkWell Link"
      layoutMode={layoutMode}
      onLayoutChange={setLayoutMode}
      activeTexture="/inkwell.svg" // Assuming you have an inkwell SVG icon like the others
      isEnvAudioMuted={isEnvAudioMuted}
      onToggleEnvAudio={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
      controls={ <SandboxControls schema={INK_SCHEMA} onChange={(id, val) => setControls(p => ({...p, [id]: val}))} /> }
    >
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