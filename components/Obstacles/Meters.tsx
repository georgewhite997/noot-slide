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

export const Meters = ({
  obstacle,
  index,
  pickupType
}: {
  obstacle: IObstacle;
  index?: number;
  pickupType: '100M' | '250M' | '750M'
}) => {
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);
  const storeAssetsGltf = useAtomValue(storeAssetsGltfAtom);

  const meshRef = useRef<THREE.Mesh>(null);
  const wasHitRef = useRef(false);

  const [x, y, z] = obstacle.position;



  const model = useMemo(
    () => prepareModelForTransparency(pickupType, storeAssetsGltf),
    [!!storeAssetsGltf?.scene],
  );

  useFrame(() => {
    fadeModelOnHit(wasHitRef.current, meshRef.current);
  });

  if (!model) return null;

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
        rotation={[Math.PI / 1, 0, 0]}
        scale={0.65}
      >
        <primitive object={clone(model)} />
      </mesh>

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
