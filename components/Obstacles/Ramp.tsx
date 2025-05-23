import { getObstacleParentName } from "@/utils";

import { useMemo } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useAtomValue, useSetAtom } from "jotai";
import { modelsGltfAtom, selectedObstacleAtom } from "@/atoms";
import { IObstacle } from "../shared";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";


export const Ramp = ({
  obstacle,
  index,
}: {
  obstacle: IObstacle;
  index?: number;
}) => {
  const modelsGltf = useAtomValue(modelsGltfAtom);
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);

  const model = useMemo(() => {
    if (!modelsGltf?.scene) return null;
    const object = modelsGltf.scene.getObjectByName("Cube001");
    if (!object) return null;
    object.position.set(0, 0, 0);

    // Reset position of all meshes in the tree
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.position.set(0, 0, 0);
        child.updateMatrix();
      }
    });
    object.scale.set(1.3, 1.3, 1.3);
    return object;
  }, [!!modelsGltf?.scene]);

  if (!model) return null;

  const [x, y, z] = obstacle.position;

  return (
    <group onClick={(e) => {
      if (index === undefined) return;
      setSelectedObstacle(getObstacleParentName(e, index));
    }}
    >
      <RigidBody
        type="fixed"
        name="obstacle-fixed"
        colliders='hull'
        position={[x, z + 6, y + 1.2]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        friction={0.3}

      >
        <primitive object={clone(model)} />
      </RigidBody>
    </group>
  );
};