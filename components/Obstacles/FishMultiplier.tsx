import { useAtomValue, useSetAtom } from "jotai";
import { IObstacle } from "../shared";
import { storeAssetsGltfAtom, selectedObstacleAtom } from "@/atoms";
import { useFrame } from "@react-three/fiber";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useMemo, useRef } from "react";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { getObstacleParentName } from "@/utils";
import { prepareModelForTransparency, fadeModelOnHit } from "./utils";

export const FishMultiplier = ({
  obstacle,
  index,
}: {
  obstacle: IObstacle;
  index?: number;
}) => {
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);
  const storeAssetsGltf = useAtomValue(storeAssetsGltfAtom);

  const meshRef = useRef<THREE.Mesh>(null);
  const wasHitRef = useRef(false);

  const [x, y, z] = obstacle.position;

  const model = useMemo(
    () => prepareModelForTransparency("diamond_fish", storeAssetsGltf),
    [!!storeAssetsGltf?.scene],
  );

  useFrame(() => {
    fadeModelOnHit(wasHitRef.current, meshRef.current);
  });

  if (!model) return null;

  const hitboxSize = [0.8, 0.5, 1.4] as [number, number, number];

  return (
    <group
      onClick={(e) => {
        if (index === undefined) return;
        setSelectedObstacle(getObstacleParentName(e, index));
      }}
    >
      <mesh
        ref={meshRef}
        position={[x, z - 1, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        scale={0.5}
      >
        <primitive object={clone(model)} />
      </mesh>

      <mesh position={[x, z, y + 0.8]} visible={false}>
        <meshBasicMaterial />
        <boxGeometry args={hitboxSize} />
      </mesh>

      <RigidBody
        type="fixed"
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
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
