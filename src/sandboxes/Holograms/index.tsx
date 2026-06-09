// src/sandboxes/Holograms/index.tsx
import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Center, Text, Environment, Float, Grid, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Howl } from 'howler';

import SandboxControls, { type ControlDef } from '../../components/SandboxControls';
import SandboxShell, { type LayoutMode } from '../../components/SandboxShell';

interface Props {
  isAudioEnabled?: boolean;
}

// --- SCHEMA ---
const HOLO_SCHEMA: ControlDef[] = [
  { id: 'signature', type: 'textarea', label: 'Sign-Off', defaultValue: 'VVA\nGRAPHICS' },
  { id: 'color', type: 'select', label: 'Projection Core', options: ['Cyan', 'Neon Green', 'Magenta', 'Amber', 'Pure White'], defaultValue: 'Cyan' },
  { id: 'style', type: 'select', label: 'Holo Style', options: ['Solid Light', 'Wireframe Mesh', 'Ghostly'], defaultValue: 'Solid Light' },
  { id: 'glitch', type: 'slider', label: 'Instability (Glitch)', min: 0.0, max: 1.0, step: 0.1, defaultValue: 0.2 },
  { id: 'beam', type: 'select', label: 'Projector Beam', options: ['Active', 'Flicker', 'Off'], defaultValue: 'Active' },
  { id: 'rotation', type: 'slider', label: 'Spin Speed', min: 0.0, max: 2.0, step: 0.1, defaultValue: 0.5 },
];

const COLOR_MAP: Record<string, string> = {
  'Cyan': '#00ffff',
  'Neon Green': '#39ff14',
  'Magenta': '#ff00ff',
  'Amber': '#ffbf00',
  'Pure White': '#ffffff'
};

// --- SYNTHETIC AUDIO GENERATOR (Safe Sci-Fi Sounds) ---
const playSciFiBeep = (isAudioEnabled: boolean) => {
  if (!isAudioEnabled) return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 + Math.random() * 400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.log("Audio blocked", e);
  }
};

// --- HOLOGRAPHIC TEXT COMPONENT ---
function HolographicText({ text, color, style, glitch, rotationSpeed, isAudioEnabled }: any) {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<any>(null);
  const glowRef = useRef<any>(null);
  
  const hexColor = COLOR_MAP[color] || '#00ffff';
  const isWireframe = style === 'Wireframe Mesh';
  const opacityBase = style === 'Ghostly' ? 0.4 : 0.9;

  useFrame((_, delta) => {
    if (!groupRef.current || !textRef.current) return;

    // Base Rotation
    groupRef.current.rotation.y += delta * rotationSpeed;

    // Glitch Logic
    if (glitch > 0) {
      const glitchChance = Math.random();
      
      // Trigger a glitch frame
      if (glitchChance < (glitch * 0.05)) {
        groupRef.current.position.x = (Math.random() - 0.5) * glitch * 0.5;
        groupRef.current.position.z = (Math.random() - 0.5) * glitch * 0.5;
        textRef.current.material.opacity = opacityBase * (Math.random() * 0.5 + 0.2);
        
        if (Math.random() > 0.8) playSciFiBeep(isAudioEnabled);
      } else {
        // Return to center smoothly
        groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
        groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, 0, 0.1);
        textRef.current.material.opacity = THREE.MathUtils.lerp(textRef.current.material.opacity, opacityBase, 0.1);
      }
    }
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <Center>
          <Text
            ref={textRef}
            fontSize={1.5}
            lineHeight={1.2}
            anchorX="center"
            anchorY="middle"
            textAlign="center"
          >
            {text}
            <meshStandardMaterial 
              color={hexColor} 
              emissive={hexColor} 
              emissiveIntensity={style === 'Ghostly' ? 0.5 : 1.5} 
              transparent 
              opacity={opacityBase}
              blending={THREE.AdditiveBlending}
              wireframe={isWireframe}
              depthWrite={false}
            />
          </Text>
          
          {/* Subtle secondary ghost text behind it for the holographic bloom effect */}
          {style === 'Solid Light' && (
            <Text
              ref={glowRef}
              position={[0, 0, -0.1]}
              fontSize={1.5}
              lineHeight={1.2}
              anchorX="center"
              anchorY="middle"
              textAlign="center"
            >
              {text}
              <meshBasicMaterial 
                color={hexColor} 
                transparent 
                opacity={0.2} 
                blending={THREE.AdditiveBlending} 
                depthWrite={false} 
              />
            </Text>
          )}
        </Center>
      </Float>
    </group>
  );
}

// --- PROJECTOR BEAM COMPONENT ---
function ProjectorBase({ color, beam }: any) {
  const hexColor = COLOR_MAP[color] || '#00ffff';
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!beamRef.current) return;
    
    // Cast to THREE.Material so TS knows it has an opacity property
    const mat = beamRef.current.material as THREE.Material;
    
    if (beam === 'Flicker') {
      mat.opacity = 0.1 + Math.sin(state.clock.elapsedTime * 20) * 0.05;
    } else if (beam === 'Active') {
      mat.opacity = 0.15;
    } else {
      mat.opacity = 0;
    }
  });

  return (
    <group position={[0, -2, 0]}>
      {/* The physical projector box on the floor */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[1.5, 2, 0.2, 32]} />
        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Glowing ring on the projector (Moved rotation to the mesh!) */}
      <mesh position={[0, 0.21, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.4, 32]} />
        <meshBasicMaterial color={hexColor} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Volumetric Beam (Cylinder) */}
      <mesh ref={beamRef} position={[0, 3, 0]}>
        <cylinderGeometry args={[1.2, 0.1, 6, 32, 1, true]} />
        <meshBasicMaterial 
          color={hexColor} 
          transparent 
          opacity={0.15} 
          blending={THREE.AdditiveBlending} 
          side={THREE.DoubleSide} 
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// --- SCENE MANAGER ---
function SceneManager({ controls, isAudioEnabled, layoutMode }: any) {
  const hexColor = COLOR_MAP[controls.color] || '#00ffff';

  return (
    <>
      <Environment preset="night" />
      <color attach="background" args={['#020202']} />
      
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 10, 5]} intensity={1} color="#333" />
      
      {/* Core light emitted from the projector */}
      <pointLight position={[0, -1.5, 0]} intensity={5} color={hexColor} distance={10} />

      {/* Grid Floor */}
      <Grid 
        position={[0, -2, 0]} 
        args={[30, 30]} 
        cellSize={1} 
        cellThickness={1} 
        cellColor="#111" 
        sectionSize={5} 
        sectionThickness={1.5} 
        sectionColor={hexColor} 
        fadeDistance={20} 
        fadeStrength={1.5} 
      />

      {/* Shift entire scene up if in full mode to clear bottom UI */}
      <group position={[0, layoutMode === 'FULL' ? 1.5 : 0, 0]}>
        <ProjectorBase color={controls.color} beam={controls.beam} />
        
        <HolographicText 
          text={controls.signature} 
          color={controls.color} 
          style={controls.style}
          glitch={controls.glitch}
          rotationSpeed={controls.rotation}
          isAudioEnabled={isAudioEnabled}
        />
      </group>

      {/* Ground Reflections */}
      <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.5} far={10} color={hexColor} />
    </>
  );
}

// --- MAIN COMPONENT ---
export default function Holograms({ isAudioEnabled = false }: Props) {
  const [controls, setControls] = useState({ 
    signature: 'VVA\nGRAPHICS', 
    color: 'Cyan', 
    style: 'Solid Light', 
    glitch: 0.2,
    beam: 'Active',
    rotation: 0.5
  });
  
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('FULL');
  const [isEnvAudioMuted, setIsEnvAudioMuted] = useState(false);
  const envSoundRef = useRef<Howl | null>(null);

  useEffect(() => {
    // Deep sci-fi hum
    const hum = new Howl({ src: ['/audio/ambient.mp3'], loop: true, volume: 0 });
    envSoundRef.current = hum;
    return () => {
      const currentVol = hum.volume() as number;
      hum.fade(currentVol, 0, 500);
      setTimeout(() => hum.unload(), 500);
    };
  }, []);

  useEffect(() => {
    if (!envSoundRef.current) return;
    const currentVol = envSoundRef.current.volume() as number;
    if (isAudioEnabled && !isEnvAudioMuted) {
      if (!envSoundRef.current.playing()) envSoundRef.current.play();
      envSoundRef.current.fade(currentVol, 0.4, 1000);
    } else {
      envSoundRef.current.fade(currentVol, 0, 1000);
    }
  }, [isAudioEnabled, isEnvAudioMuted]);

  return (
    <SandboxShell
      title="Hologram Link"
      layoutMode={layoutMode}
      onLayoutChange={setLayoutMode}
      activeTexture="/hologram.svg"
      isEnvAudioMuted={isEnvAudioMuted}
      onToggleEnvAudio={() => setIsEnvAudioMuted(!isEnvAudioMuted)}
      controls={ <SandboxControls schema={HOLO_SCHEMA} onChange={(id, val) => setControls(p => ({...p, [id]: val}))} /> }
    >
      <div className={`absolute bottom-0 right-0 transition-all duration-500 ease-in-out ${
        layoutMode === 'FULL' ? 'w-full h-full' :
        layoutMode === 'SPLIT_VERT' ? 'w-1/2 h-full' : 'w-full h-1/2'
      }`}>
        <Canvas camera={{ position: [0, 2, 10], fov: 45 }} dpr={[1, 1.5]}>
          <SceneManager controls={controls} isAudioEnabled={isAudioEnabled && !isEnvAudioMuted} layoutMode={layoutMode} />
        </Canvas>
      </div>
    </SandboxShell>
  );
}