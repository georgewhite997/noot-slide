import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useTexture } from "@react-three/drei";
import {
  SLOPE_ANGLE,
  SEGMENT_LENGTH,
  SEGMENT_WIDTH,
  ISegment,
} from "@/components/shared";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  modelsGltfAtom,
  segmentLengthsAtom,
  selectedObstacleAtom,
} from "@/atoms";
import { Segment } from "@/components/Segment";
import { SegmentObstacles } from "@/components/SegmentObstacles";
import { useThree } from "@react-three/fiber";
import { sumUpTo, getChunkOffset, getSmallestZ } from "@/utils";
import { PLAYER_COLLIDER_WIDTH, SWAY_AMPLITUDE } from "../Player";
import { SwayBoundaries } from "../SwayBoundaries";

const onTextureLoaded = (texture: THREE.Texture) => {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(SEGMENT_WIDTH * 0.5, SEGMENT_LENGTH * 0.5); // Adjust tiling as needed
  texture.needsUpdate = true; // Ensure texture updates apply immediately
};

export const MapMakerGround = ({
  makerSegments,
  displayChunkBoundaries,
  debug = false
}: {
  makerSegments: {
    chunks: { length: number; obstacles: any[]; isSelected: boolean }[];
  }[];
  displayChunkBoundaries: boolean;
  debug: boolean;
}) => {
  const modelsGltf = useAtomValue(modelsGltfAtom);

  const [segments, setSegments] = useState<ISegment[]>([]);
  const lastPushedIndex = useRef<number | null>(null);
  const [segmentLengths, setSegmentLengths] = useAtom(segmentLengthsAtom);
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);

  const [colorMap, normalMap] = useTexture(
    ["/snow-color.webp", "/snow-normal.webp"],
    (textures) => textures.forEach(onTextureLoaded),
  );

  const getInitialSegments = () => {
    const initialSegments: ISegment[] = [];

    for (let i = 0; i < 1; i++) {
      const zOffset = -i * (SEGMENT_LENGTH * Math.cos(SLOPE_ANGLE));
      const yOffset = i * (SEGMENT_LENGTH * Math.sin(SLOPE_ANGLE));

      // const isRoad = Math.random() < 0.2 && i !== 0;
      initialSegments.push({
        zOffset,
        yOffset,
        index: i,
        chunks: [], // obstacles.map((obstacles, j) => ({ obstacles, name: `chunk-${j}-segment-${i}` })),
        overflow: 0,
        // isRoad,
      });
    }
    lastPushedIndex.current = initialSegments[initialSegments.length - 1].index;

    setSegments(initialSegments);
  };

  const { scene } = useThree();

  useEffect(() => {
    getInitialSegments();
  }, []);

  const normalizedSegments = segments.map((segment, i) => ({
    ...segment,
    chunks: makerSegments[i].chunks.map((chunk, j) => {
      const middleOfSegment = -SEGMENT_LENGTH / 2;
      const obstacleOffset = sumUpTo(makerSegments[i].chunks, j);
      const chunkOffset = getChunkOffset(makerSegments[i].chunks, j);
      const beginningOfChunk = middleOfSegment + obstacleOffset + chunkOffset;
      return {
        ...chunk,
        beginning: beginningOfChunk,
        obstacles: chunk.obstacles.map((obstacle) => ({
          ...obstacle,
          position: [
            obstacle.position[0],
            obstacle.position[1],
            obstacle.position[2] + beginningOfChunk,
          ],
        })),
        name: `chunk-${j}-segment-${segment.index}`,
      };
    }),
  }));

  useEffect(() => {
    const _segmentLengths = [];
    for (let i = 0; i < normalizedSegments.length; i++) {
      const chunks = [];
      if (normalizedSegments[i].chunks.length === 0) continue;
      for (let j = 0; j < normalizedSegments[i].chunks.length; j++) {
        const segment = scene.getObjectByName(
          `chunk-${j}-segment-${normalizedSegments[i].index}`,
        );
        if (!segment) {
          continue;
        }
        const obstaclesGroup = segment.children[0].children[0].children[0]
          .children[0] as THREE.Object3D;
        if (!obstaclesGroup) {
          continue;
        }
        const box = new THREE.Box3().setFromObject(obstaclesGroup);
        const chunkLength = box.max.z - box.min.z || 0;

        chunks.push(chunkLength);
      }
      _segmentLengths.push(chunks);
    }

    if (JSON.stringify(segmentLengths) !== JSON.stringify(_segmentLengths)) {
      setSegmentLengths(_segmentLengths);
    }
  });

  if (!modelsGltf) return;

  return (
    <>
      <group>
        {normalizedSegments.map((segment) => (
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
                optimize={false}
              />
              {(displayChunkBoundaries && segment.chunks.length > 0) ? segment.chunks.map((chunk, i) => (
                <ChunkBoundary
                  key={`${chunk.name}-${chunk.beginning}`}
                  chunk={chunk}
                  onClick={() => {
                    setSelectedObstacle(
                      `chunk-${i}-segment-${segment.index}-0`,
                    );
                  }}
                />
              )) : null}
              {debug ? <SwayBoundaries /> : null}
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
};

const ChunkBoundary = ({ chunk, onClick }: { chunk: { beginning: number, length: number, obstacles: any[], name: string, isSelected: boolean }, onClick: () => void }) => {
  const chunkZOffset = (getSmallestZ(chunk.obstacles) + SEGMENT_LENGTH / 2);
  const chunkEnd = (chunk.length / 2) + chunkZOffset / 2;

  return (
    <group>
      <mesh
        position={[0, chunk.beginning, 2.5]}
        onClick={onClick}
      >
        <boxGeometry args={[20, 0.1, 5]} />
        <meshStandardMaterial
          color={chunk.isSelected ? "lightgreen" : "lightblue"}
          opacity={0.5}
          transparent
        />
      </mesh>
      <mesh
        position={[-5, chunk.beginning + chunkEnd, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={onClick}
      >
        <boxGeometry args={[chunk.length + chunkZOffset, 0.1, 2]} />
        <meshStandardMaterial
          color={chunk.isSelected ? "lightgreen" : "lightblue"}
          opacity={0.5}
          transparent
        />
      </mesh>
      <mesh
        position={[5, chunk.beginning + chunkEnd, 0]}
        rotation={[0, 0, Math.PI / 2]}
        onClick={onClick}
      >
        <boxGeometry args={[chunk.length + chunkZOffset, 0.1, 2]} />
        <meshStandardMaterial
          color={chunk.isSelected ? "lightgreen" : "lightblue"}
          opacity={0.5}
          transparent
        />
      </mesh>
    </group>
  )
}

