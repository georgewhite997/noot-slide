"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useEffect, useRef, useState } from "react";
import { Ground } from "./Ground";
import {
  OrbitControls,
  PerformanceMonitor,
  PerspectiveCamera,
} from "@react-three/drei";
import * as THREE from "three";
import { useAtomValue } from "jotai";
import { fishMeshesAtom, storeAssetsGltfAtom, settingsAtom, isGamePausedAtom } from "@/atoms";
import { useGLTF } from '@react-three/drei';
import { useSetAtom } from 'jotai';
import { modelsGltfAtom } from '../atoms';
import { MAX_MOBILE_WIDTH, MAX_MOBILE_HEIGHT } from "@/utils";

export const ModelLoader = () => {
  const modelsGltf = useGLTF('/models.glb');
  const storeAssetsGltf = useGLTF('/store_assets.glb');
  const fishGltf = useGLTF('/fish.glb');
  const setModelsGltf = useSetAtom(modelsGltfAtom);
  const setStoreAssetsGltf = useSetAtom(storeAssetsGltfAtom);
  const setFishMeshes = useSetAtom(fishMeshesAtom);

  useEffect(() => {
    // @ts-expect-error idk why this is throwing an error
    setModelsGltf(modelsGltf);
    // @ts-expect-error idk why this is throwing an error
    setStoreAssetsGltf(storeAssetsGltf);
    const meshes = {}

    // fishGltf.scene.traverse((child) => {
    //   if (child instanceof THREE.Mesh) {
    //     child.material = child.material.clone()
    //     child.material.transparent = true
    //   }
    // })

    fishGltf?.scene.traverse((obj) => {
      // @ts-expect-error idk why this is throwing an error
      if (obj.isMesh && obj.name) {
        // @ts-expect-error idk why this is throwing an error
        meshes[obj.name] = obj as THREE.Mesh
      }
    })


    setFishMeshes(meshes);
  }, []);

  return null;
};


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
              <PerformanceMonitor
                onChange={(api) => {
                  console.log("FPS:", api.fps);
                }}
              />
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
        far={20000}
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
