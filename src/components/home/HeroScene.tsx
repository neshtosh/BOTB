import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Outlines, RoundedBox } from '@react-three/drei';
import type { MotionValue } from 'framer-motion';
import { nextIdle } from '../../utils/idle';
import { clearWordSprites, loadGraffitiFonts, makeBrickTexture, makeFloorTexture, makeWallTexture } from './graffitiTextures';

// A stylised, cel-shaded performer built from primitives: illustration-style
// rather than realistic, and fully our own (no third-party model to license).

const SIGNAL = '#f2e600';
const INK = '#0b0b0c';
const SKIN = '#7a4a2a';
const BPM = 120;

// Three hard light bands give the flat, hand-inked look.
function useToonGradient() {
  return useMemo(() => {
    const tex = new THREE.DataTexture(new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), 3, 1);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

const ToonCtx = React.createContext<THREE.Texture | null>(null);

const Toon: React.FC<{ color: string; emissive?: string; emissiveIntensity?: number }> = ({ color, emissive, emissiveIntensity }) => {
  const gradientMap = React.useContext(ToonCtx);
  return (
    <meshToonMaterial
      color={color}
      gradientMap={gradientMap}
      emissive={emissive ?? '#000000'}
      emissiveIntensity={emissiveIntensity ?? 0}
    />
  );
};

const Ink: React.FC<{ thickness?: number }> = ({ thickness = 0.025 }) => (
  <Outlines thickness={thickness} color={INK} />
);

// Capsule limb hanging down from its parent's origin.
const Limb: React.FC<{ length: number; radius: number; color: string }> = ({ length, radius, color }) => (
  <mesh position={[0, -length / 2, 0]} castShadow>
    <capsuleGeometry args={[radius, length - radius * 2, 6, 16]} />
    <Toon color={color} />
    <Ink />
  </mesh>
);

// Cursor position (-1..1) plus "energy": rises with fast movement, decays each frame.
interface PointerState {
  x: number;
  y: number;
  energy: number;
}

interface SceneProps {
  progress: MotionValue<number>;
  reduceMotion: boolean;
}

const Artist: React.FC<SceneProps & { pointer: React.MutableRefObject<PointerState> }> = ({
  progress,
  reduceMotion,
  pointer,
}) => {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const micArm = useRef<THREE.Group>(null);
  const micForearm = useRef<THREE.Group>(null);
  const hypeArm = useRef<THREE.Group>(null);
  const hypeForearm = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  // Sit to the right of the copy on wide screens, centred behind it on phones.
  const wide = viewport.width > 7;
  const baseX = wide ? viewport.width * 0.26 : 0;
  // On narrow screens lift the figure above the headline instead of behind it.
  const baseY = wide ? -1.55 : -0.55;
  const scale = wide ? 1.12 : 0.72;

  useFrame((state) => {
    const t = reduceMotion ? 0 : state.clock.elapsedTime;
    const p = progress.get();
    const beat = Math.abs(Math.sin((t * Math.PI * BPM) / 60)); // one bounce per beat
    const px = reduceMotion ? 0 : pointer.current.x;
    const py = reduceMotion ? 0 : pointer.current.y;
    // Fast cursor movement gets them hyped: bigger bounce, wilder arm.
    const hype = reduceMotion ? 0 : Math.min(1, pointer.current.energy);
    const follow = (current: number, target: number, speed: number) => THREE.MathUtils.lerp(current, target, speed);

    if (root.current) {
      // Whole body turns to face the cursor, on top of the scroll turn.
      const target = THREE.MathUtils.lerp(-0.45, 0.85, p) + px * 0.75 + Math.sin(t * 0.4) * 0.05;
      root.current.rotation.y = follow(root.current.rotation.y, target, 0.12);
      root.current.position.y = baseY + p * 0.6;
    }
    if (body.current) {
      const bounce = 0.09 * (1 + hype * 2.2);
      body.current.position.y = beat * bounce;
      body.current.scale.set(1 + beat * 0.012, 1 - beat * 0.02 * (1 + hype), 1 + beat * 0.012);
      // Lean toward the cursor, and forward when it is low.
      body.current.rotation.z = follow(body.current.rotation.z, -px * 0.16 + Math.sin((t * Math.PI * BPM) / 120) * 0.03, 0.15);
      body.current.rotation.x = follow(body.current.rotation.x, py * 0.1, 0.15);
    }
    if (head.current) {
      // Head tracks the cursor quickly and nods harder on the beat when hyped.
      const targetY = px * 0.6;
      const targetX = -py * 0.45 + beat * (0.08 + hype * 0.12) - 0.04;
      head.current.rotation.y = follow(head.current.rotation.y, targetY, 0.2);
      head.current.rotation.x = follow(head.current.rotation.x, targetX, 0.22);
      head.current.rotation.z = follow(head.current.rotation.z, -px * 0.12, 0.15);
    }
    if (hypeArm.current && hypeForearm.current) {
      // Free arm reaches up when the cursor is high and waves faster when hyped.
      const reach = THREE.MathUtils.lerp(2.2, 2.85, p) - py * 0.45;
      hypeArm.current.rotation.z = follow(hypeArm.current.rotation.z, reach + Math.sin(t * (2 + hype * 10)) * (0.06 + hype * 0.25), 0.25);
      hypeArm.current.rotation.x = follow(hypeArm.current.rotation.x, -0.2 + px * 0.3, 0.2);
      hypeForearm.current.rotation.z = THREE.MathUtils.lerp(0.5, 0.1, p) + beat * (0.1 + hype * 0.3);
    }
    // Hype fades out when the cursor stops.
    pointer.current.energy *= 0.94;
    if (micArm.current && micForearm.current) {
      micArm.current.rotation.set(-1.15 - beat * 0.03, 0, 0.42);
      micForearm.current.rotation.set(-1.55, 0, -0.35);
    }
  });

  return (
    <group ref={root} position={[baseX, baseY, 0]} scale={scale}>
      {/* Stage glow */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.9, 1.35, 64]} />
        <meshBasicMaterial color={SIGNAL} transparent opacity={0.25} />
      </mesh>

      {/* Legs + sneakers stay planted while the body bounces */}
      {[-0.22, 0.22].map((x) => (
        <group key={x} position={[x, 1.25, 0]}>
          <Limb length={1.15} radius={0.17} color="#26262c" />
          <RoundedBox args={[0.32, 0.2, 0.55]} radius={0.08} position={[0, -1.15, 0.1]}>
            <Toon color="#f4f4f4" />
            <Ink />
          </RoundedBox>
        </group>
      ))}

      <group ref={body}>
        {/* Hoodie */}
        <mesh position={[0, 1.85, 0]}>
          <capsuleGeometry args={[0.5, 0.75, 8, 24]} />
          <Toon color={SIGNAL} />
          <Ink thickness={0.03} />
        </mesh>
        {/* Hood bunched at the neck */}
        <mesh position={[0, 2.42, -0.08]} rotation-x={Math.PI / 2.4}>
          <torusGeometry args={[0.3, 0.12, 12, 32]} />
          <Toon color="#d8cd00" />
          <Ink />
        </mesh>
        {/* Drawstrings */}
        {[-0.12, 0.12].map((x) => (
          <mesh key={x} position={[x, 2.22, 0.45]} rotation-x={-0.25}>
            <cylinderGeometry args={[0.018, 0.018, 0.26, 8]} />
            <Toon color={INK} />
          </mesh>
        ))}

        {/* Head */}
        <group ref={head} position={[0, 2.85, 0]}>
          <mesh>
            <sphereGeometry args={[0.38, 32, 32]} />
            <Toon color={SKIN} />
            <Ink />
          </mesh>
          {/* Beanie */}
          <mesh position={[0, 0.12, 0]}>
            <sphereGeometry args={[0.41, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <Toon color={INK} />
          </mesh>
          <mesh position={[0, 0.13, 0]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.4, 0.06, 10, 40]} />
            <Toon color="#1c1c22" />
            <Ink thickness={0.015} />
          </mesh>
          {/* Nose */}
          <mesh position={[0, -0.13, 0.37]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <Toon color="#6a3e22" />
          </mesh>
          {/* Smile */}
          <mesh position={[0, -0.22, 0.33]} rotation-z={Math.PI}>
            <torusGeometry args={[0.07, 0.014, 8, 16, Math.PI]} />
            <Toon color={INK} />
          </mesh>
          {/* Shades */}
          {[-0.14, 0.14].map((x) => (
            <RoundedBox key={x} args={[0.22, 0.12, 0.05]} radius={0.03} position={[x, -0.01, 0.37]} rotation-y={x * 0.6}>
              <meshStandardMaterial color="#050505" metalness={0.6} roughness={0.15} />
            </RoundedBox>
          ))}
          {/* Headphones */}
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.45, 0.045, 10, 40, Math.PI]} />
            <Toon color="#1c1c22" />
            <Ink thickness={0.015} />
          </mesh>
          {[-0.44, 0.44].map((x) => (
            <group key={x} position={[x, 0, 0]} rotation-z={Math.PI / 2}>
              <mesh>
                <cylinderGeometry args={[0.16, 0.16, 0.12, 24]} />
                <Toon color="#1c1c22" />
                <Ink thickness={0.015} />
              </mesh>
              <mesh position={[0, x > 0 ? -0.065 : 0.065, 0]}>
                <cylinderGeometry args={[0.1, 0.1, 0.01, 24]} />
                <meshBasicMaterial color={SIGNAL} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Mic arm (screen left): mic up to the mouth */}
        <group ref={micArm} position={[-0.58, 2.25, 0]}>
          <Limb length={0.62} radius={0.15} color={SIGNAL} />
          <group ref={micForearm} position={[0, -0.6, 0]}>
            <Limb length={0.55} radius={0.13} color={SIGNAL} />
            <group position={[0, -0.6, 0]}>
              <mesh>
                <sphereGeometry args={[0.12, 16, 16]} />
                <Toon color={SKIN} />
                <Ink />
              </mesh>
              {/* Microphone */}
              <group position={[0.02, -0.05, 0.12]} rotation-x={-0.9}>
                <mesh position={[0, -0.12, 0]}>
                  <cylinderGeometry args={[0.04, 0.03, 0.32, 12]} />
                  <Toon color="#2b2b31" />
                  <Ink thickness={0.012} />
                </mesh>
                <mesh position={[0, 0.1, 0]}>
                  <sphereGeometry args={[0.09, 16, 16]} />
                  <meshStandardMaterial color="#c9c9c9" metalness={0.8} roughness={0.35} />
                </mesh>
              </group>
            </group>
          </group>
        </group>

        {/* Hype arm (screen right): raised */}
        <group ref={hypeArm} position={[0.58, 2.25, 0]}>
          <Limb length={0.62} radius={0.15} color={SIGNAL} />
          <group ref={hypeForearm} position={[0, -0.6, 0]}>
            <Limb length={0.55} radius={0.13} color={SIGNAL} />
            <mesh position={[0, -0.62, 0]}>
              <sphereGeometry args={[0.13, 16, 16]} />
              <Toon color={SKIN} />
              <Ink />
            </mesh>
          </group>
        </group>
      </group>

      <SoundRings reduceMotion={reduceMotion} />
    </group>
  );
};

// Rings pulsing out from the mic, one per beat.
const SoundRings: React.FC<{ reduceMotion: boolean }> = ({ reduceMotion }) => {
  const rings = useRef<THREE.Mesh[]>([]);
  useFrame((state) => {
    const t = reduceMotion ? 0.3 : state.clock.elapsedTime;
    rings.current.forEach((ring, i) => {
      if (!ring) return;
      const phase = ((t * BPM) / 60 + i / 3) % 1;
      const s = 0.3 + phase * 2.2;
      ring.scale.set(s, s, s);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - phase) * 0.55;
    });
  });
  return (
    <group position={[-0.35, 2.8, 0.6]} rotation-y={-0.3}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => m && (rings.current[i] = m)}>
          <torusGeometry args={[0.5, 0.012, 8, 64]} />
          <meshBasicMaterial color={SIGNAL} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

// Vinyl records orbiting the performer; they spin faster as you scroll.
const Records: React.FC<SceneProps> = ({ progress, reduceMotion }) => {
  const group = useRef<THREE.Group>(null);
  const discs = useRef<THREE.Group[]>([]);
  const { viewport } = useThree();
  const wide = viewport.width > 7;
  const baseX = wide ? viewport.width * 0.26 : 0;
  const baseY = wide ? -1.55 : -0.55;
  const records = [
    { radius: 2.3, height: 1.2, size: 0.55, offset: 0 },
    { radius: 2.0, height: 2.6, size: 0.4, offset: 2.1 },
    { radius: 2.6, height: 0.2, size: 0.45, offset: 4.2 },
  ];
  const angle = useRef(0);

  useFrame((state, delta) => {
    if (reduceMotion) return;
    const p = progress.get();
    angle.current += delta * (0.25 + p * 1.6);
    records.forEach((r, i) => {
      const disc = discs.current[i];
      if (!disc) return;
      const a = angle.current + r.offset;
      disc.position.set(Math.cos(a) * r.radius, r.height + Math.sin(state.clock.elapsedTime + i) * 0.15 + baseY + p * 0.6, Math.sin(a) * r.radius * 0.6);
      disc.rotation.set(0.9 + Math.sin(a) * 0.3, a, 0.2);
    });
  });

  return (
    <group ref={group} position={[baseX, 0, 0]}>
      {records.map((r, i) => (
        <group key={i} ref={(g) => g && (discs.current[i] = g)} scale={r.size}>
          <mesh>
            <cylinderGeometry args={[1, 1, 0.04, 48]} />
            <meshStandardMaterial color="#111114" metalness={0.4} roughness={0.25} />
            <Ink thickness={0.02} />
          </mesh>
          {[0.55, 0.72, 0.88].map((g) => (
            <mesh key={g} position={[0, 0.022, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[g, g + 0.01, 48]} />
              <meshBasicMaterial color="#2c2c33" />
            </mesh>
          ))}
          <mesh position={[0, 0.023, 0]} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.32, 32]} />
            <meshBasicMaterial color={SIGNAL} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Graffiti subway tunnel around the performer. Surfaces are painted on
// canvases at load time (see graffitiTextures.ts), so there are no image files.
interface TunnelTextures {
  left: THREE.Texture;
  right: THREE.Texture;
  brick: THREE.Texture;
  floor: THREE.Texture;
}

// Roughly how long the hero headline takes to reveal after the scene mounts.
const TUNNEL_DELAY_MS = 2000;

// Full-size textures on desktop; on a phone-width screen half the size (a
// quarter of the pixels) looks the same and is far quicker to draw.
function textureScale() {
  return Math.min(1, Math.max(0.5, window.innerWidth / 1440));
}

const Tunnel: React.FC = () => {
  const gl = useThree((s) => s.gl);
  const [textures, setTextures] = useState<TunnelTextures | null>(null);

  useEffect(() => {
    let cancelled = false;
    const made: THREE.Texture[] = [];
    const scale = textureScale();
    const surfaces: Record<keyof TunnelTextures, () => THREE.Texture> = {
      left: () => makeWallTexture(3, true, scale),
      right: () => makeWallTexture(17, false, scale),
      brick: () => {
        const brick = makeBrickTexture(5, scale);
        brick.wrapT = THREE.RepeatWrapping;
        brick.repeat.set(5, 10);
        return brick;
      },
      floor: () => {
        const floor = makeFloorTexture(9, scale);
        floor.wrapT = THREE.RepeatWrapping;
        floor.repeat.set(1, 4);
        return floor;
      },
    };
    // Each surface is a big canvas, and drawing it to the GPU blocks the main
    // thread. Wait until the hero headline has finished revealing (its animation
    // runs on the main thread too), then do one surface per idle slot and show
    // the tunnel once they're all uploaded.
    (async () => {
      await Promise.all([loadGraffitiFonts(), new Promise((resolve) => window.setTimeout(resolve, TUNNEL_DELAY_MS))]);
      const t = {} as TunnelTextures;
      for (const key of Object.keys(surfaces) as (keyof TunnelTextures)[]) {
        await nextIdle(500);
        if (cancelled) return;
        t[key] = surfaces[key]();
        made.push(t[key]);
        gl.initTexture(t[key]);
      }
      clearWordSprites();
      if (!cancelled) setTextures(t);
    })();
    return () => {
      cancelled = true;
      made.forEach((tex) => tex.dispose());
    };
  }, [gl]);

  if (!textures) return null;

  const LENGTH = 52;
  const HEIGHT = 6.4;
  const FLOOR = -1.56;
  const LEFT = -4.6;
  const RIGHT = 6;
  const MID = (LEFT + RIGHT) / 2;
  const RADIUS = (RIGHT - LEFT) / 2;
  const CENTER_Z = -14;

  return (
    // Angled so the tunnel recedes toward the right, like a real subway passage.
    <group rotation-y={-0.42} position={[0.4, 0, 0]}>
      <mesh position={[LEFT, FLOOR + HEIGHT / 2, CENTER_Z]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[LENGTH, HEIGHT]} />
        <meshBasicMaterial map={textures.left} />
      </mesh>
      <mesh position={[RIGHT, FLOOR + HEIGHT / 2, CENTER_Z]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[LENGTH, HEIGHT]} />
        <meshBasicMaterial map={textures.right} color="#bdbdbd" />
      </mesh>
      <mesh position={[MID, FLOOR, CENTER_Z]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[RIGHT - LEFT, LENGTH]} />
        <meshBasicMaterial map={textures.floor} color="#a8a8a8" />
      </mesh>
      {/* Arched brick ceiling */}
      <mesh position={[MID, FLOOR + HEIGHT, CENTER_Z]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[RADIUS, RADIUS, LENGTH, 40, 1, true, Math.PI / 2, Math.PI]} />
        <meshBasicMaterial map={textures.brick} side={THREE.BackSide} color="#8a8a8a" />
      </mesh>
      {/* Fluorescent strips along the top of the left wall */}
      {[6, -2, -10, -18, -26, -34].map((z) => (
        <mesh key={z} position={[LEFT + 0.25, FLOOR + HEIGHT - 0.15, z]}>
          <boxGeometry args={[0.1, 0.07, 2.6]} />
          <meshBasicMaterial color="#fff6d8" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

// Camera eases in and lifts slightly as the hero scrolls away.
const CameraRig: React.FC<{
  progress: MotionValue<number>;
  pointer: React.MutableRefObject<PointerState>;
  reduceMotion: boolean;
}> = ({ progress, pointer, reduceMotion }) => {
  useFrame((state) => {
    const p = progress.get();
    const cam = state.camera;
    // The camera drifts with the cursor so the tunnel shifts in depth around the figure.
    const px = reduceMotion ? 0 : pointer.current.x;
    const py = reduceMotion ? 0 : pointer.current.y;
    cam.position.x = THREE.MathUtils.lerp(cam.position.x, px * 0.9, 0.06);
    cam.position.z = THREE.MathUtils.lerp(cam.position.z, 8.5 - p * 2.2, 0.08);
    cam.position.y = THREE.MathUtils.lerp(cam.position.y, 1.1 + p * 0.5 - py * 0.4, 0.06);
    cam.lookAt(px * 0.25, 0.9, 0);
  });
  return null;
};

const HeroScene: React.FC<SceneProps> = ({ progress, reduceMotion }) => {
  const gradient = useToonGradient();
  const pointer = useRef<PointerState>({ x: 0, y: 0, energy: 0 });
  const wrapper = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Track the pointer across the whole window (the canvas sits behind the copy).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      const speed = Math.hypot(x - pointer.current.x, y - pointer.current.y);
      pointer.current.energy = Math.min(1.2, pointer.current.energy + speed * 1.5);
      pointer.current.x = x;
      pointer.current.y = y;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  // Stop rendering once the hero is off screen.
  useEffect(() => {
    const el = wrapper.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapper} className="absolute inset-0">
      <Canvas
        frameloop={visible ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ position: [0, 1.1, 8.5], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ToonCtx.Provider value={gradient}>
          <fog attach="fog" args={['#0b0b0c', 16, 44]} />
          <Tunnel />
          <ambientLight intensity={0.55} />
          <directionalLight position={[4, 6, 5]} intensity={2.2} />
          {/* Cool rim light from behind for separation against the dark background */}
          <pointLight position={[-3, 3.5, -3]} intensity={30} color="#8fb3ff" />
          <pointLight position={[3, 1, -2]} intensity={14} color={SIGNAL} />
          <CameraRig progress={progress} pointer={pointer} reduceMotion={reduceMotion} />
          <Artist progress={progress} reduceMotion={reduceMotion} pointer={pointer} />
          <Records progress={progress} reduceMotion={reduceMotion} />
        </ToonCtx.Provider>
      </Canvas>
    </div>
  );
};

export default HeroScene;
