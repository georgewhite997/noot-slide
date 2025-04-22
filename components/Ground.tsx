import * as THREE from "three";
import { Fragment, memo, useEffect, useRef, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
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
  IObstacle,
} from "./shared";
import { useAtomValue } from "jotai";
import { gameStateAtom, scoreAtom } from "@/atoms";
import { getSnowBumps } from "@/utils";
import { getObstacles, Obstacle } from "./Obstacles";
import { Segment } from "./Segment";
import { Player } from "./Player";
import { ISegment } from "./shared";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";


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
  const score = useAtomValue(scoreAtom);
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

      const obstacles = i === 0 ? [] : getObstacles(["easy"]);

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
        chunks: obstacles.map((obstacles, j) => ({ obstacles, name: `chunk-${j}-segment-${i}` })),
      });
    }
    lastPushedIndex.current = initialSegments[initialSegments.length - 1].index;

    setSegments(initialSegments);
  };

  useEffect(() => {
    if (gameState === "playing" || (gameState === "in-menu" && segments.length === 0)) {
      getInitialSegments();
    }
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

      // Determine allowed difficulties based on score
      let allowedDifficulties: ("easy" | "medium" | "hard")[];
      if (score < 600) {
        allowedDifficulties = ["easy", "medium"];
      } else if (score > 800) {
        allowedDifficulties = ["medium"];
      } else if (score > 1200) {
        allowedDifficulties = ["medium", "hard"];
      } else if (score > 2500) {
        allowedDifficulties = ["hard"]
      } else {
        allowedDifficulties = ["easy"];
      }

      const obstacles = getObstacles(allowedDifficulties);

      setSegments((prevSegments) => {
        const newSegments = [
          ...prevSegments,
          {
            zOffset: newZ,
            yOffset: newY,
            index: newIndex,
            chunks: obstacles.map((obstacles, j) => ({ obstacles, name: `chunk-${j}-segment-${newIndex}` })),
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

  const onChunkRemoved = (chunkName: string) => {
    const arr = chunkName.split('-');
    const nextChunkIndex = parseInt(arr[1]) + 1;
    const nextChunkName = `chunk-${nextChunkIndex}-segment-${arr[arr.length - 1]}`;

    setSegments((prevSegments) => {
      return prevSegments.map((segment) => {
        return {
          ...segment,
          chunks: segment.chunks.map((chunk) => {
            return {
              ...chunk,
              obstacles: chunk.name === chunkName || chunk.name === nextChunkName ? chunk.obstacles.filter((obstacle) => obstacle.type === "fish" || obstacle.type === "fishing-net" || obstacle.type === "fish-multiplier") : chunk.obstacles,
            };
          }),
        };
      });
    });
  }


  return (
    <>
      <Player onChunkRemoved={onChunkRemoved} />
      {segments.map((segment) => (
        <Fragment key={`${segment.index}-${segment.zOffset}`}>
          <Segment
            segment={segment}
            colorMap={colorMap}
            normalMap={normalMap}
          />
          <mesh
            position={[0, segment.yOffset, segment.zOffset]}
            rotation={[-Math.PI / 2 + SLOPE_ANGLE, 0, 0]}
          >
            <SegmentObstacles
              segment={segment}
              colorMap={colorMap}
              normalMap={normalMap}
            />
          </mesh>
        </Fragment >
      ))}
    </>
  )
})


const SegmentObstacles = memo(function SegmentObstacles({ segment, colorMap, normalMap }: { segment: ISegment, colorMap: THREE.Texture, normalMap: THREE.Texture }) {
  const fishGltf = useLoader(GLTFLoader, '/fish.glb')
  const modelsGltf = useLoader(GLTFLoader, '/models.glb')
  const store_assets_gltf = useLoader(GLTFLoader, '/store_assets.glb')

  //print all modelsGltf.scene.children.name
  // useEffect(() => {
  //   modelsGltf.scene.children.forEach((child) => {
  //     console.log(child.name);
  //   });
  // }, [modelsGltf]);

  return (
    <>
      {segment.chunks.length > 0 ? (
        segment.chunks.map((chunk, index) => {
          if (chunk.obstacles.length === 0) return null;
          return (
            <group key={chunk.name} name={chunk.name}>
              {chunk.obstacles.map((obstacle, obstacleIndex) => (
                <Obstacle
                  key={`obstacle-${obstacle.type}-${obstacle.position[0]}-${obstacle.position[1]}-${obstacle.position[2]}-${segment.index}-${obstacleIndex}`}
                  snowColorMap={colorMap}
                  snowNormalMap={normalMap}
                  {...{ obstacle }}
                  fishGltf={fishGltf}
                  modelsGltf={modelsGltf}
                  store_assets_gltf={store_assets_gltf}
                />
              ))}
            </group>
          )
        })
      ) : null}
    </>
  )
}, (prevProps, nextProps) => {
  const prevSegment = prevProps.segment as ISegment;
  const nextSegment = nextProps.segment as ISegment;

  return (
    prevSegment.chunks.length === nextSegment.chunks.length &&
    prevSegment.chunks.every((chunk, i) => {
      for (let j = 0; j < Math.max(chunk.obstacles.length, nextSegment.chunks[i].obstacles.length); j++) {

        if (
          !chunk.obstacles[j] ||
          !nextSegment.chunks[i].obstacles[j] ||
          chunk.obstacles[j].type !== nextSegment.chunks[i].obstacles[j].type ||
          chunk.obstacles[j].position[0] !== nextSegment.chunks[i].obstacles[j].position[0] ||
          chunk.obstacles[j].position[1] !== nextSegment.chunks[i].obstacles[j].position[1] ||
          chunk.obstacles[j].position[2] !== nextSegment.chunks[i].obstacles[j].position[2]
        ) {
          return false;
        }
      }
      return true;
    })

  );
},

);
