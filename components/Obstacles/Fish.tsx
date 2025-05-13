import { useAtom } from "jotai";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { IObstacle } from "../shared";
import {
  magnetCollectedAtAtom,
  magnetDurationAtom,
  selectedObstacleAtom,
} from "@/atoms";
import { useSetAtom } from "jotai";
import { getObstacleParentName, hasPowerup } from "@/utils";

export const Fish = ({
  obstacle,
  Model,
  index,
}: {
  obstacle: IObstacle;
  Model: any;
  index?: number;
}) => {
  const [magnetCollectedAt] = useAtom(magnetCollectedAtAtom);
  const [magnetDuration] = useAtom(magnetDurationAtom);
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);

  const [x, y, z] = obstacle.position;

  const meshRef = useRef<THREE.Mesh | null>(null);
  const wasHitRef = useRef(false);

  useFrame(() => {
    if (wasHitRef.current && meshRef.current) {
      meshRef.current.scale.set(
        meshRef.current.scale.x * 0.8,
        meshRef.current.scale.y * 0.8,
        meshRef.current.scale.z * 0.8,
      );
      meshRef.current.position.y -= 0.1;
    }
  });

  const rotation = [Math.PI / 2, -Math.PI / 2, 0] as const;
  const hitboxSize = [0.45, 0.45, 0.45] as [number, number, number];

  const fishId = useMemo(() => THREE.MathUtils.generateUUID(), [])

  return (
    <group
      onClick={(e) => {
        if (index === undefined) return;
        setSelectedObstacle(getObstacleParentName(e, index));
      }}
    >
      <RigidBody
        type="fixed"
        position={[x, z, y + 0.3]}
        rotation={rotation}
        name={`fish-${fishId}`}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === "player") {
            wasHitRef.current = true;
          }
        }}
      >
        <CuboidCollider args={hitboxSize} />
      </RigidBody>
      <mesh ref={meshRef} position={[x, z, y + 0.3]} rotation={rotation}>
        <Model />
      </mesh>

      <RigidBody
        type="fixed"
        position={[x, z, y + 0.3]}
        name={`fish-hitbox-${fishId}`}
        rotation={rotation}
        sensor
        onIntersectionEnter={({ other }) => {
          if (
            other.rigidBodyObject?.name === "player" &&
            hasPowerup(magnetCollectedAt, magnetDuration)
          ) {
            wasHitRef.current = true;
          }
        }}
      >
        <CuboidCollider args={[2, 5, 10]} />
      </RigidBody>
    </group>
  );
};
