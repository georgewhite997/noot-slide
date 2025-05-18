import { useAtomValue, useSetAtom } from "jotai";
import { IObstacle } from "../shared";
import { modelsGltfAtom, selectedObstacleAtom } from "@/atoms";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import * as THREE from "three";
import { useMemo } from "react";
import { RigidBody } from "@react-three/rapier";
import { getObstacleParentName } from "@/utils";

export const TexturedObstacle = ({
  obstacle,
  objectName,
  scale = 1,
  index,
}: {
  obstacle: IObstacle;
  objectName: string;
  scale?: number;
  index?: number;
}) => {
  const modelsGltf = useAtomValue(modelsGltfAtom);
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);

  const model = useMemo(() => {
    if (!modelsGltf?.scene) return null;
    const object = modelsGltf.scene.getObjectByName(objectName);
    if (!object) return null;

    // Reset position of all meshes in the tree
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.position.set(0, 0, 0);
        child.updateMatrix();
      }
    });

    object.scale.set(scale, scale, scale);
    return object;
  }, [!!modelsGltf?.scene, objectName, scale]);

  if (!model) return null;

  // Calculate model bounds for stone objects
  const isFixed =
    objectName.toLowerCase().includes("stone") ||
    objectName.toLowerCase().includes("cane") ||
    objectName.toLowerCase().includes("hydrant") ||
    objectName.toLowerCase().includes("gift") ||
    objectName.toLowerCase().includes("car") ||
    objectName.toLowerCase().includes("sled") ||
    objectName.toLowerCase().includes("dumpster");

  return (
    <group
      onClick={(e: any) => setSelectedObstacle(getObstacleParentName(e, index))}
    >
      <RigidBody
        type="fixed"
        name={"deadly-obstacle-" + obstacle.type + "-" + index}
        position={[
          obstacle.position[0],
          obstacle.position[2],
          obstacle.position[1],
        ]}
        rotation={obstacle.rotation}
        colliders="hull"
      >
        <primitive object={clone(model)} />
      </RigidBody>

      {isFixed && (
        <RigidBody
          type="fixed"
          name={"obstacle-fixed"}
          position={[
            obstacle.position[0],
            obstacle.position[2],
            obstacle.position[1] + 0.1,
          ]}
          rotation={obstacle.rotation}
          colliders="hull"
        >
          <primitive
            object={(() => {
              const obj = clone(model);

              obj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  // Deep clone the material(s)
                  if (Array.isArray(child.material)) {
                    child.material = child.material.map((mat) => {
                      const clonedMat = mat.clone();
                      clonedMat.transparent = true;
                      clonedMat.opacity = 0;
                      return clonedMat;
                    });
                  } else {
                    const clonedMat = child.material.clone();
                    clonedMat.transparent = true;
                    clonedMat.opacity = 0;
                    child.material = clonedMat;
                  }
                }
              });

              return obj;
            })()}
          />
        </RigidBody>
      )}
    </group>
  );
};
