"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import { Ground } from "./Ground";
import {
  OrbitControls,
  PerspectiveCamera,
  Stats,
} from "@react-three/drei";
import * as THREE from "three";
import { MAX_MOBILE_WIDTH, MAX_MOBILE_HEIGHT } from "@/utils";
import { useAtomValue } from "jotai";
import { settingsAtom, isGamePausedAtom } from "@/atoms";
import { ModelLoader } from "./ModelLoader";

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
              <Scene />
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

      <OrbitControls
        makeDefault
        enablePan={true} // Allows WASD and right-click panning
        enableZoom={true} // Allows scroll wheel zooming
        enableRotate={true} // Allows left-click rotation
      />
    </>
  );
};
