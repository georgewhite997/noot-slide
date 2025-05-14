import { useAtomValue, useSetAtom } from "jotai";
import { IObstacle } from "../shared";
import { storeAssetsGltfAtom, selectedObstacleAtom } from "@/atoms";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { useMemo, useRef, useEffect, useState } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { getObstacleParentName } from "@/utils";
import { fadeModelOnHit } from "./utils";

export const Meters = ({
  obstacle,
  index,
  pickupType
}: {
  obstacle: IObstacle;
  index?: number;
  pickupType: '100m' | '250m' | '750m'
}) => {
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);
  const meshRef = useRef<THREE.Mesh>(null);
  const wasHitRef = useRef(false);
  const [x, y, z] = obstacle.position;
  const [font, setFont] = useState<Font | null>(null);
  const [opacity, setOpacity] = useState(1.0); // State to manage opacity, optional usage

  useEffect(() => {
    const loader = new FontLoader();
    loader.load(
      '/titan_one.typeface.json',
      (loadedFont) => {
        setFont(loadedFont);
      },
      undefined,
      (error) => {
        console.error('Error loading font:', error);
      }
    );
  }, []);

  const textGeometry = useMemo(() => {
    if (!font) return null;
    const geometry = new TextGeometry(pickupType, {
      font: font,
      size: 1,
      depth: 0.5,
      curveSegments: 12,
    });
    geometry.center();
    return geometry;
  }, [pickupType, font]);

  useEffect(() => {
    if (textGeometry) {
      textGeometry.computeVertexNormals();
    }
  }, [textGeometry]);

  const material = useMemo(() => {
    let color1, color2;

    switch (pickupType) {
      case '100m':
        color1 = new THREE.Color(0x008000);
        color2 = new THREE.Color(0x41d941);
        break;
      case '250m':
        color1 = new THREE.Color(0xCC8400);
        color2 = new THREE.Color(0xf5a81b);
        break;
      case '750m':
        color1 = new THREE.Color(0x800080);
        color2 = new THREE.Color(0xdb46db);
        break;
      default:
        color1 = new THREE.Color(0xFFFFFF);
        color2 = new THREE.Color(0xFFFFFF);
    }

    return new THREE.ShaderMaterial({
      uniforms: {
        color1: { value: color1 },
        color2: { value: color2 },
        opacity: { value: opacity }, // Use opacity state
      },
      vertexShader: `
        varying vec3 vPosition;
        void main() {
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color1;
        uniform vec3 color2;
        uniform float opacity;
        varying vec3 vPosition;
        void main() {
          float mixValue = (vPosition.y + 0.5) / 1.0;
          vec3 color = mix(color1, color2, mixValue);
          gl_FragColor = vec4(color, opacity);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true,
    });
  }, [pickupType, opacity]);

  useFrame(() => {
    if (wasHitRef.current && meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      if (material && material.uniforms && material.uniforms.opacity) {
        const currentOpacity = material.uniforms.opacity.value;
        const newOpacity = Math.max(0, currentOpacity - 0.04);
        material.uniforms.opacity.value = newOpacity;
        // Only call setOpacity if it’s being used (e.g., for state sync or external control)
        if (setOpacity) setOpacity(newOpacity);
      }
      meshRef.current.position.z += 0.04;
    }
  });

  if (!textGeometry || !material) return null;

  const hitboxSize = [1, 0.6, 0.6] as [number, number, number];

  return (
    <group
      onClick={(e) => {
        if (index === undefined) return;
        setSelectedObstacle(getObstacleParentName(e, index));
      }}
    >
      <mesh
        ref={meshRef}
        position={[x, z, y + 0.5]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.57}
        geometry={textGeometry}
        material={material}
      />

      <mesh position={[x, z + 1, y + 0.9]} visible={false}>
        <meshBasicMaterial />
        <boxGeometry args={hitboxSize} />
      </mesh>

      <RigidBody
        type="fixed"
        name={'meters-' + pickupType}
        position={[x, z, y + 0.5]}
        rotation={[0, 0, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === "player") {
            wasHitRef.current = true;
          }
        }}
      >
        <CuboidCollider args={hitboxSize} />
      </RigidBody>
    </group>
  );
};