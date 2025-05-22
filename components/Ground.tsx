import * as THREE from "three";
import { memo, useEffect, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  SLOPE_ANGLE,
  SEGMENT_COUNT,
  SEGMENT_LENGTH,
  SEGMENT_WIDTH,
  TRACK_MARK_SPACING,
  TRACK_MARK_WIDTH,
  TRACK_MARK_LENGTH,
  TRACK_MARK_DEPTH,
} from "./shared";
import { useAtomValue } from "jotai";
import { customMapAtom, gameStateAtom, modelsGltfAtom, scoreAtom } from "@/atoms";
import { getSnowBumps } from "@/utils";
import { getChunks } from "./Obstacles";
import { Segment } from "./Segment";
import { Player } from "./Player";
import { ISegment } from "./shared";
import { SegmentObstacles } from "./SegmentObstacles";


const worldMatrixComponent1 = new THREE.Quaternion().setFromEuler(
  new THREE.Euler(-Math.PI / 2 + SLOPE_ANGLE, 0, 0),
);
const worldMatrixComponent2 = new THREE.Vector3(1, 1, 1);

const onTextureLoaded = (texture: THREE.Texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(SEGMENT_WIDTH * 0.5, SEGMENT_LENGTH * 0.5); // Adjust tiling as needed
  texture.needsUpdate = true; // Ensure texture updates apply immediately
};

export const Ground = memo(function Ground() {
  const gameState = useAtomValue(gameStateAtom);
  // const score = useAtomValue(scoreAtom);
  const modelsGltf = useAtomValue(modelsGltfAtom)
  const customMap = useAtomValue(customMapAtom)

  const [segments, setSegments] = useState<ISegment[]>([]);
  const lastPushedIndex = useRef<number | null>(null);

  const [colorMap, normalMap] = useTexture(
    ["/snow-color.webp", "/snow-normal.webp"],
    (textures) => textures.forEach(onTextureLoaded),
  );

  const { scene } = useThree();

  const getInitialSegments = () => {
    const initialSegments: ISegment[] = [];

    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const zOffset = -i * (SEGMENT_LENGTH * Math.cos(SLOPE_ANGLE));
      const yOffset = i * (SEGMENT_LENGTH * Math.sin(SLOPE_ANGLE));

      const { chunks, overflow } = i === 0 ? { chunks: [], overflow: 0 } : getChunks(i, 0, customMap);


      const object = scene.getObjectByName(`segment-snow-${i}`) as THREE.Mesh;
      if (object && object.geometry) {
        const geometry = object.geometry as THREE.PlaneGeometry;
        const positions = geometry.attributes.position;

        for (let j = 0; j < positions.count; j++) {
          const x = positions.getX(j);
          const y = positions.getY(j) + i * SEGMENT_LENGTH;
          positions.setZ(j, getSnowBumps(x, y));
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      }


      initialSegments.push({
        zOffset,
        yOffset,
        index: i,
        chunks,
        overflow,
        // isRoad
      });
    }
    lastPushedIndex.current = initialSegments[initialSegments.length - 1].index;

    setSegments(initialSegments);
  };

  const prevGameState = useRef('in-menu')
  useEffect(() => {
    if ((gameState === "playing" && prevGameState.current !== 'reviving') || ((gameState === "in-menu" || gameState === 'choosing-power-ups') && segments.length === 0)) {
      getInitialSegments();
    }
    prevGameState.current = gameState;
  }, [gameState]);

  useFrame(({ scene }) => {
    const player = scene.getObjectByName("player");
    if (!player || gameState !== "playing") return;

    const playerZ = player.position.z || 0;
    const lastEl = segments[segments.length - 1];
    if (!lastEl) return;

    const furthestZ = lastEl.zOffset || 0;
    const furthestY = lastEl.yOffset || 0;
    const newIndex = lastEl.index + 1;

    if (
      playerZ &&
      playerZ < furthestZ + SEGMENT_LENGTH / 3 &&
      lastPushedIndex.current !== newIndex
    ) {
      const newZ = furthestZ - SEGMENT_LENGTH * Math.cos(SLOPE_ANGLE);
      const newY = furthestY + SEGMENT_LENGTH * Math.sin(SLOPE_ANGLE);

      const { chunks, overflow } = getChunks(newIndex, lastEl.overflow, customMap);

      setSegments((prevSegments) => {
        const newSegments = [
          ...prevSegments,
          {
            zOffset: newZ,
            yOffset: newY,
            index: newIndex,
            chunks,
            overflow,
          },
        ];
        if (newSegments.length > SEGMENT_COUNT) {
          newSegments.shift();
        }
        lastPushedIndex.current = newIndex;
        return newSegments;
      });
    }

    // Apply track marks
    for (let j = 0; j < segments.length; j++) {
      const segment = segments[j];

      const isWithinRange =
        player.position.z > segment.zOffset - SEGMENT_LENGTH / 2 &&
        player.position.z < segment.zOffset + SEGMENT_LENGTH / 2;

      if (!isWithinRange) {
        continue;
      }

      const object = scene.getObjectByName(
        `segment-snow-${segment.index}`,
      ) as THREE.Mesh;
      if (!object || !object.geometry) {
        continue;
      }
      const geometry = object.geometry as THREE.PlaneGeometry;
      const positions = geometry.attributes.position;

      const worldMatrixTransform = new THREE.Matrix4().compose(
        new THREE.Vector3(0, segment.yOffset, segment.zOffset),
        worldMatrixComponent1,
        worldMatrixComponent2,
      );

      // Apply track marks from player history
      for (let i = 0; i < positions.count; i++) {
        const vertexPosition = new THREE.Vector3().fromBufferAttribute(
          positions,
          i,
        );

        const worldVertex = vertexPosition.clone();
        worldVertex.applyMatrix4(worldMatrixTransform);

        const x = worldVertex.x;
        const z = worldVertex.z;
        const pos = player.position;

        const leftSkiX = pos.x - TRACK_MARK_SPACING - TRACK_MARK_WIDTH;
        const rightSkiX = pos.x;
        const skiZ = pos.z;
        const isInAir = worldVertex.y - pos.y < -1;

        if (!isInAir) {
          const margin = 0.05;
          const inLeftSki =
            x + margin >= leftSkiX &&
            x - margin <= leftSkiX + TRACK_MARK_WIDTH &&
            z + margin >= skiZ &&
            z - margin <= skiZ + TRACK_MARK_LENGTH;

          const inRightSki =
            x + margin >= rightSkiX &&
            x - margin <= rightSkiX + TRACK_MARK_WIDTH &&
            z + margin >= skiZ &&
            z - margin <= skiZ + TRACK_MARK_LENGTH;

          if (inLeftSki || inRightSki) {
            positions.setZ(i, vertexPosition.z - TRACK_MARK_DEPTH);
          }
        }
      }
      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }
  });

  // const onChunkRemoved = (chunkName: string) => {
  //   const arr = chunkName.split('-');
  //   const nextChunkIndex = parseInt(arr[1]) + 1;
  //   const nextChunkName = `chunk-${nextChunkIndex}-segment-${arr[arr.length - 1]}`;

  //   setSegments((prevSegments) => {
  //     return prevSegments.map((segment) => {
  //       return {
  //         ...segment,
  //         chunks: segment.chunks.map((chunk) => {
  //           return {
  //             ...chunk,
  //             obstacles: chunk.name === chunkName || chunk.name === nextChunkName ? chunk.obstacles.filter((obstacle) => obstacle.type === "reward") : chunk.obstacles,
  //           };
  //         }),
  //       };
  //     });
  //   });
  // }

  const removeNextObstacles = (
    obstacle: THREE.Object3D<THREE.Object3DEventMap>
  ) => {
    const segmentName = obstacle.parent?.parent?.parent?.parent?.parent?.name ?? "";
    const [, indexStr] = segmentName.split("-");
    const currentIndex = Number(indexStr);
    if (Number.isNaN(currentIndex)) return;

    const startZ = obstacle.position.y - 2;
    const endZGlobal = startZ + 30;

    setSegments(prevSegments => {
      const currSeg = prevSegments.find(s => s.index === currentIndex);
      const nextSeg = prevSegments.find(s => s.index === currentIndex + 1);

      const currLastZ = currSeg
        ? Math.max(
          ...currSeg.chunks.flatMap(c =>
            c.obstacles.map(o => o.position[2])
          )
        )
        : startZ;

      const nextFirstZ = nextSeg
        ? Math.min(
          ...nextSeg.chunks.flatMap(c =>
            c.obstacles.map(o => o.position[2])
          )
        )
        : 0;

      const overflow = endZGlobal > currLastZ
        ? endZGlobal - currLastZ
        : 0;

      return prevSegments.map(segment => {
        if (segment.index === currentIndex) {
          const localEndZ = overflow ? currLastZ : endZGlobal;

          return {
            ...segment,
            chunks: segment.chunks.map(chunk => ({
              ...chunk,
              obstacles: chunk.obstacles.filter(o => {
                const z = o.position[2];
                return z < startZ || z > localEndZ;
              }),
            })),
          };
        }

        if (overflow && segment.index === currentIndex + 1) {
          const nextEndZ = nextFirstZ + overflow;

          return {
            ...segment,
            chunks: segment.chunks.map(chunk => ({
              ...chunk,
              obstacles: chunk.obstacles.filter(o => {
                const z = o.position[2];
                return z < nextFirstZ || z > nextEndZ;
              }),
            })),
          };
        }

        return segment;
      });
    });
  };


  if (!modelsGltf) return


  return (
    <>
      <Player removeNextObstacles={removeNextObstacles} />
      <group>
        {segments.map((segment) => (
          <group key={`${segment.index}-${segment.zOffset}-${segment.yOffset}`}>
            <Segment
              segment={segment}
              colorMap={colorMap}
              normalMap={normalMap}
              modelsGltf={modelsGltf}
            // isRoad={segment.isRoad}
            />
            <mesh
              position={[0, segment.yOffset, segment.zOffset]}
              rotation={[-Math.PI / 2 + SLOPE_ANGLE, 0, 0]}
            >
              <SegmentObstacles
                segment={segment}
              />
            </mesh>
          </group>
        ))}
      </group>
    </>
  )
})

