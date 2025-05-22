"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import { Ground } from "./Ground";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from "@react-three/drei";
import * as THREE from "three";
import { MAX_MOBILE_WIDTH, MAX_MOBILE_HEIGHT } from "@/utils";
import { useAtomValue } from "jotai";
import { settingsAtom, isGamePausedAtom } from "@/atoms";
import { ModelLoader } from "./ModelLoader";
import {
  EffectComposer,
  SMAA,        // Subpixel Morphological AA  ── czyste krawędzie
  FXAA,        // lub Fast Approximate AA ── lżejsza alternatywa
  Bloom,        // (opcjonalnie) subtelny bloom jak na nagraniu
  HueSaturation,
  ChromaticAberration,
  DepthOfField,
  Noise,
  SSAO,
  Vignette,
  BrightnessContrast,
  DotScreen,
  Glitch,
  Pixelation,
  Scanline,
  ToneMapping
} from '@react-three/postprocessing'
import { Leva, useControls, folder, button, levaStore } from "leva";

const levaTheme = {
  colors: {
    label: "#ffffff", // folder + control label text
    folderWidgetColor: "#ffffff", //dddsada folder name text
    highlight1: "#ffffff", // hovered value text
  },
} as const;

export const ThreeCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const settings = useAtomValue(settingsAtom);

  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(window.innerWidth, MAX_MOBILE_WIDTH);
      const height = Math.min(window.innerHeight, MAX_MOBILE_HEIGHT);
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);


  return (
    <>
      <Leva collapsed theme={levaTheme} />

      <div
        ref={containerRef}
        className="w-full h-full flex absolute left-0 justify-center items-center overflow-hidden bg-black"
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <>
            <Canvas
              style={{
                width: dimensions.width,
                height: dimensions.height,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              gl={{
                antialias: settings.antialiasing,
                powerPreference: "high-performance",
              }}
              dpr={settings.dpr}
              shadows={settings.shadows}
            >
              {process.env.NODE_ENV === "development" && <Stats />}
              <ModelLoader />
              <Environment backgroundRotation={[-0.2, 0, 0]} background files={'/sky.hdr'} />
              <Scene />
              <PostProcessingEffects />
            </Canvas>
          </>
        )}
      </div>
    </>
  );
};

const Scene = () => {
  const { scene, gl } = useThree(); // Access the scene and renderer (gl)
  const isGamePaused = useAtomValue(isGamePausedAtom);

  useEffect(() => {
    gl.setClearColor(0xd4e8f0, 1);
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;

    scene.fog = new THREE.FogExp2(0xd4e8f0, 0.002);
  }, []);


  return (
    <>
      <PerspectiveCamera
        makeDefault
        fov={75}
        near={0.5}
        far={110}
        position={[0, 10, 0]}
      />
      <ambientLight color={0x787878} intensity={1} />
      <Suspense>
        <Physics
          gravity={[0, -9.81, 0]}
          timeStep="vary"
          paused={isGamePaused}
        // debug
        >
          <Ground />
        </Physics>
      </Suspense>

      <EffectComposer>
        <FXAA />
        {/* <Bloom mipmapBlur luminanceThreshold={0.75} intensity={1.1} /> */}
        <HueSaturation saturation={0.3} />
      </EffectComposer>


      <OrbitControls
        makeDefault
        enablePan={true} // Allows WASD and right-click panning
        enableZoom={true} // Allows scroll wheel zooming
        enableRotate={true} // Allows left-click rotation
      />
    </>
  );
};

const PostProcessingEffects = () => {
  const settings = useAtomValue(settingsAtom);

  // Bloom -----------------------------------------------------------------------
  const bloom = useControls(
    "Bloom",
    {
      enabled: true,
      intensity: { value: 0.26, min: 0, max: 3 },
      radius: { value: 0, min: 0, max: 2 },
      threshold: { value: 0, min: 0, max: 1 },
    },
    { collapsed: false }
  );

  // Depth‑of‑Field --------------------------------------------------------------
  const dof = useControls(
    "Depth of Field",
    {
      enabled: false,
      focusDistance: { value: 0.02, min: 0, max: 1, label: "focus" },
      focalLength: { value: 0.02, min: 0, max: 1, label: "focal" },
      bokehScale: { value: 2, min: 0, max: 10 },
    },
    { collapsed: true }
  );

  // Chromatic Aberration --------------------------------------------------------
  const chroma = useControls(
    "Chromatic Aberration",
    {
      enabled: false,
      offset: { value: 0.0015, min: 0, max: 0.02 },
    },
    { collapsed: true }
  );

  // Vignette --------------------------------------------------------------------
  const vignette = useControls(
    "Vignette",
    {
      enabled: false,
      eskil: true,
      offset: { value: 0.1, min: 0, max: 1 },
      darkness: { value: 1.1, min: 0, max: 3 },
    },
    { collapsed: true }
  );

  // Noise -----------------------------------------------------------------------
  const noise = useControls(
    "Noise",
    {
      enabled: false,
      premultiply: false,
      opacity: { value: 0.1, min: 0, max: 1 },
    },
    { collapsed: true }
  );

  // SSAO ------------------------------------------------------------------------
  const ssao = useControls(
    "SSAO",
    {
      enabled: false,
      samples: { value: 6, min: 1, max: 32, step: 1 },
      radius: { value: 0.1, min: 0, max: 2 },
      intensity: { value: 20, min: 0, max: 50 },
    },
    { collapsed: true }
  );

  // ───────── Additional FX ─────────────────────────────────────────────────────

  // Hue / Saturation ------------------------------------------------------------
  const hueSat = useControls(
    "Hue & Saturation",
    {
      enabled: false,
      hue: { value: 0, min: -Math.PI, max: Math.PI },
      saturation: { value: 0, min: -1, max: 1 },
    },
    { collapsed: true }
  );

  // Brightness / Contrast -------------------------------------------------------
  const brCon = useControls(
    "Brightness & Contrast",
    {
      enabled: true,
      brightness: { value: -0.07, min: -1, max: 1 },
      contrast: { value: 0, min: -1, max: 1 },
    },
    { collapsed: true }
  );

  // Tone Mapping ----------------------------------------------------------------
  const tone = useControls(
    "Tone Mapping",
    {
      enabled: false,
      exposure: { value: 1, min: 0, max: 4 },
      mode: {
        options: {
          "ACES_FILMIC": "ACES_FILMIC",
          REINHARD: "REINHARD",
          LINEAR: "LINEAR",
        },
        value: "ACES_FILMIC",
      },
    },
    { collapsed: true }
  );

  // Pixelation ------------------------------------------------------------------
  const pixel = useControls(
    "Pixelation",
    {
      enabled: false,
      granularity: { value: 4, min: 1, max: 16, step: 1 },
    },
    { collapsed: true }
  );

  // DotScreen -------------------------------------------------------------------
  const dot = useControls(
    "Dot Screen",
    {
      enabled: false,
      scale: { value: 1, min: 0.5, max: 3 },
      angle: { value: 1.57, min: 0, max: Math.PI * 2 },
    },
    { collapsed: true }
  );

  // Scanline --------------------------------------------------------------------
  const scan = useControls(
    "Scanline",
    {
      enabled: false,
      density: { value: 1, min: 0.2, max: 6 },
      blend: { value: true },
    },
    { collapsed: true }
  );

  // Glitch ----------------------------------------------------------------------
  const glitch = useControls(
    "Glitch",
    {
      enabled: false,
      minDelay: { value: 1, min: 0.1, max: 5 },
      maxDelay: { value: 5, min: 0.5, max: 10 },
      minDuration: { value: 0.6, min: 0.1, max: 5 },
      maxDuration: { value: 1.0, min: 0.1, max: 5 },
      strength: { value: 0.3, min: 0, max: 1 },
      mode: {
        options: { SPORADIC: "SPORADIC", CONSTANT_MILD: "CONSTANT_MILD", CONSTANT_WILD: "CONSTANT_WILD" },
        value: "SPORADIC",
      },
    },
    { collapsed: true }
  );

  // SMAA (anti‑alias) -----------------------------------------------------------
  const smaa = useControls(
    "SMAA",
    {
      enabled: false,
    },
    { collapsed: true }
  );


  // -----------------------------------------------------------------------------
  if (!settings.antialiasing) return null;

  return (
    <EffectComposer multisampling={8} enableNormalPass>
      {/* Base effects */}
      {bloom.enabled && <Bloom intensity={bloom.intensity} radius={bloom.radius} luminanceThreshold={bloom.threshold} />}
      {dof.enabled && <DepthOfField focusDistance={dof.focusDistance} focalLength={dof.focalLength} bokehScale={dof.bokehScale} />}
      {chroma.enabled && <ChromaticAberration offset={new THREE.Vector2(chroma.offset, chroma.offset)} />}
      {vignette.enabled && (
        <Vignette
          eskil={vignette.eskil}
          offset={vignette.offset}
          darkness={vignette.darkness}
        />
      )}

      {/* ————— extra FX ———— */}
      {noise.enabled && (
        <Noise premultiply={noise.premultiply} opacity={noise.opacity} />
      )}

      {ssao.enabled && (
        <SSAO
          samples={ssao.samples}
          radius={ssao.radius}
          intensity={ssao.intensity}
        />
      )}

      {hueSat.enabled && (
        <HueSaturation hue={hueSat.hue} saturation={hueSat.saturation} />
      )}

      {brCon.enabled && (
        <BrightnessContrast
          brightness={brCon.brightness}
          contrast={brCon.contrast}
        />
      )}

      {tone.enabled && (
        <ToneMapping mode={tone.mode} exposure={tone.exposure} />
      )}

      {pixel.enabled && <Pixelation granularity={pixel.granularity} />}

      {dot.enabled && <DotScreen scale={dot.scale} angle={dot.angle} />}

      {scan.enabled && (
        <Scanline density={scan.density} blend={scan.blend} />
      )}

      {glitch.enabled && (
        <Glitch
          delay={[glitch.minDelay, glitch.maxDelay]}
          duration={[glitch.minDuration, glitch.maxDuration]}
          strength={glitch.strength}
          mode={glitch.mode}
        />
      )}

      {smaa.enabled && <SMAA />}
    </EffectComposer>
  )
}