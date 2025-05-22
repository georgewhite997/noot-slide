import { GLTFAtomType } from "@/atoms";
import * as THREE from "three";
import presets from "./presets";
import { IChunk, SEGMENT_LENGTH } from "../shared";
import { getSmallestZ } from "@/utils";

export const prepareModelForTransparency = (
  name: string,
  gltf?: GLTFAtomType,
) => {
  if (gltf?.scene) {
    const object = gltf.scene.getObjectByName(name);
    if (!object) return null;

    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // if (!Array.isArray(child.material)) {
        //   const clonedMat = child.material.clone();
        //   clonedMat.transparent = true;
        //   clonedMat.opacity = 1;
        //   child.material = clonedMat;
        // }
        child.position.set(0, 0, 0);
        child.updateMatrix();
      }
    });

    return object;
  }
  return null;
};

export const fadeModelOnHit = (wasHit: boolean, current: THREE.Mesh | null) => {
  if (wasHit && current) {
    // const opacity = Math.max(
    //   0,
    //   // @ts-expect-error we can expect the model to have only one material
    //   current.material.opacity - 0.04,
    // );

    if (current.position.z > -2) {
      current.position.z -= 0.04;

    }
    // current.traverse((child) => {
    //   if (child instanceof THREE.Mesh) {
    //     child.material.opacity = opacity;
    //   }
    // });
  }
};

export const getChunks = (
  segmentIndex: number,
  previousOverflow: number = 0,
  customMap?: IChunk[],
) => {
  const chunkPresets = customMap && customMap.length > 0 ? customMap : presets;
  let totalLength = previousOverflow;
  let overflow = 0;
  const chunks = [];
  let j = 0;
  const middleOfSegment = -SEGMENT_LENGTH / 2;

  while (true) {
    const chunk = chunkPresets[Math.floor(Math.random() * chunkPresets.length)];
    // const chunk = chunkPresets[j % chunkPresets.length];
    const firstObstacleZ = getSmallestZ(chunk.obstacles);
    const chunkLength = chunk.length + firstObstacleZ;
    const beginningOfChunk = middleOfSegment + totalLength;

    chunks.push({
      ...chunk,
      chunkLength,
      name: `chunk-${j}-segment-${segmentIndex}`,
      obstacles: chunk.obstacles.map((obstacle) => {
        const position: [number, number, number] = [
          obstacle.position[0],
          obstacle.position[1],
          obstacle.position[2] + beginningOfChunk,
        ];

        return {
          ...obstacle,
          position,
        };
      }),
    });
    totalLength += chunkLength;
    j++;
    if (totalLength > SEGMENT_LENGTH) {
      overflow = totalLength - SEGMENT_LENGTH;
      break;
    }
  }
  return { chunks, overflow };
};
