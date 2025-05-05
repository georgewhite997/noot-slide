import { memo, useEffect, useMemo, useRef } from "react";
import { DifficultyMode, IChunk, IObstacle, IObstacleType, IObstacleTypeWithChance, LaneType } from "./shared";
import { lanes, SEGMENT_LENGTH } from "./shared";
import { getSnowBumps, hasPowerup, noise2D } from "@/utils";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useAtom } from "jotai";
import { magnetCollectedAtAtom, magnetDurationAtom } from "@/atoms";
import { chunks } from "./Chunks";

export const RAMP_LENGTH = 2.5;
export const RAMP_WIDTH = 3;
export const RUNWAY_LENGTH = 8;
export const RAMP_SLOPE = -0.9;

export const SnowPlane = ({
  width,
  length,
  resolutionX = 32,
  resolutionY = 128,
  grooveAmplitude,
  grooveFrequency
}: {
  width: number;
  length: number;
  resolutionX?: number;
  resolutionY?: number;
  grooveAmplitude?: number;
  grooveFrequency?: number;
}) => {
  const geometryRef = useRef<THREE.PlaneGeometry>(null);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const microDetail = getSnowBumps(x, y, grooveAmplitude, grooveFrequency);
      positionAttribute.setZ(i, microDetail);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    return () => {
      geometry.dispose();
    };
  }, [geometryRef.current]);

  return (
    <planeGeometry
      ref={geometryRef}
      args={[width, length, resolutionX, resolutionY]}
    />
  );
}


let previousEntryLane: LaneType | null = null;
// let previousChunkType: string | null = null;

export const getObstacles = (allowedDifficulties: DifficultyMode[] = ["easy", "medium", "hard"], isRoad: boolean = false) => {
  const obstacles: IObstacle[][] = [];
  const initialZoffset = -SEGMENT_LENGTH / 2 + 0.25;
  const endOfSegment = SEGMENT_LENGTH / 2;
  let zOffset = initialZoffset;
  const interchunkSpacing = 4;
  let i = 0;

  while (true) {
    // Filter chunks based on allowed difficulties
    const availableChunks = chunks.filter(chunk =>
      chunk.possibleDifficulties.some(difficulty => allowedDifficulties.includes(difficulty)) && (!isRoad || chunk.canBeRoad === isRoad)
    );
    const chunk = availableChunks[Math.floor(Math.random() * availableChunks.length)];

    // Select a random difficulty from the chunk's possible difficulties that is also in allowedDifficulties
    const possibleDifficulties = chunk.possibleDifficulties.filter(d => allowedDifficulties.includes(d));
    const selectedDifficulty = possibleDifficulties[Math.floor(Math.random() * possibleDifficulties.length)];

    let entryLaneIndex: LaneType;
    if (previousEntryLane === null) {
      entryLaneIndex = Math.round(Math.random() * 2) as LaneType;
    } else {
      // find index that's not too far from previousEntryLane
      do {
        entryLaneIndex = Math.round(Math.random() * 2) as LaneType;
      } while (entryLaneIndex === previousEntryLane);
    }

    previousEntryLane = entryLaneIndex;

    const chunkObstacles = chunk.get(chunk, entryLaneIndex, i, selectedDifficulty, isRoad);
    let furthestZ = 0;
    for (const obstacle of chunkObstacles) {
      if (obstacle.position[2] > furthestZ) {
        furthestZ = obstacle.position[2];
      }
    }

    for (const obstacle of chunkObstacles) {
      obstacle.position[2] += zOffset;
    }

    zOffset = zOffset + furthestZ + interchunkSpacing;
    if (zOffset >= endOfSegment) {
      break;
    }
    i++;
    obstacles.push(chunkObstacles)
  }

  return obstacles;
};


const TexturedObstacle = ({ x, y, z, obstacle, objectName, gltf, scale = 1, rotation = [Math.PI / 2, 0, 0] }: { x: number; y: number; z: number, obstacle: IObstacle, objectName: string, gltf: GLTF, scale?: number, rotation?: [number, number, number] }) => {
  const model = useMemo(() => {
    const object = gltf.scene.getObjectByName(objectName);
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
  }, [gltf.scene, objectName, scale]);


  if (!model) return null;

  // Calculate model bounds for stone objects
  const isFixed = objectName.toLowerCase().includes('stone') ||
    objectName.toLowerCase().includes('cane') ||
    objectName.toLowerCase().includes('hydrant') ||
    objectName.toLowerCase().includes('gift') ||
    objectName.toLowerCase().includes('car') ||
    objectName.toLowerCase().includes('sled') ||
    objectName.toLowerCase().includes('dumpster');

  return (
    <>
      <RigidBody
        type="fixed"
        name={"deadly-obstacle-" + obstacle.type}
        position={[x, z, y]}
        rotation={rotation}
        colliders="hull"
      >
        <primitive object={clone(model)} />
      </RigidBody>

      {isFixed && (
        <RigidBody
          type="fixed"
          name={"obstacle-fixed"}
          position={[x, z, y + 0.1]}
          rotation={rotation}
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
    </>
  );
};

export const Fish = ({ x, y, z, Model }: { x: number; y: number; z: number, Model: any }) => {
  const [magnetCollectedAt] = useAtom(magnetCollectedAtAtom);
  const [magnetDuration] = useAtom(magnetDurationAtom);

  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; } | null>(null)
  const fishId = useMemo(() => THREE.MathUtils.generateUUID(), [])

  useFrame((state, delta) => {
    if (groupRef.current?.wasHit) {
      const z = delta * 3
      const y = delta * 2
      const opacity = delta * 10

      groupRef.current.position.z += z
      groupRef.current.position.y -= y
      groupRef.current.opacity -= opacity
    }
  })

  return (
    <group ref={groupRef}>
      <RigidBody
        type="fixed"
        name={`fish-${fishId}`}
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === 'player' && groupRef.current && !groupRef.current.wasHit) {
            groupRef.current.wasHit = true
          }
        }}
      >
        <CuboidCollider args={[0.35, 0.35, 0.35]} />
      </RigidBody>
      <mesh
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
      >
        <Model />
      </mesh>

      <RigidBody
        type="fixed"
        name={`fish-hitbox-${fishId}`}
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          //if no hasMagnet atom return
          if (!hasPowerup(magnetCollectedAt, magnetDuration)) return;
          if (other.rigidBodyObject?.name === 'player' && groupRef.current && !groupRef.current.wasHit) {
            groupRef.current.wasHit = true
          }
        }}
      >
        <CuboidCollider args={[2, 5, 10]} />
      </RigidBody>
    </group>
  )
}

const FishingNet = memo(function FishingNet({ x, y, z, store_assets_gltf }: { x: number; y: number; z: number, store_assets_gltf: GLTF }) {
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; yOffset: number } | null>(null)

  const model = useMemo(() => {
    const object = store_assets_gltf.scene.getObjectByName("fishing_rod");
    if (!object) return null;

    // Reset position of all meshes in the tree
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.position.set(0, 0, 0);
        child.updateMatrix();
      }
    });

    // object.scale.set(scale, scale, scale);
    return object;
  }, [store_assets_gltf.scene]);



  useFrame((state, delta) => {
    if (groupRef.current?.wasHit) {
      // Move up and fade out over 0.5 seconds
      groupRef.current.yOffset += delta * 2
      groupRef.current.opacity = Math.max(0, groupRef.current.opacity - delta * 2)

      // Update the group's position and opacity
      groupRef.current.position.y = groupRef.current.yOffset
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = groupRef.current!.opacity
        }
      })

      // Remove the fish after animation completes
      if (groupRef.current.opacity <= 0) {
        groupRef.current.visible = false
      }
    }
  })

  if (!model) return null;

  return (
    <group ref={groupRef}>
      <RigidBody
        type="fixed"
        name={`fishing-net`}
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === 'player' && groupRef.current && !groupRef.current.wasHit) {
            groupRef.current.wasHit = true
            groupRef.current.opacity = 1
            groupRef.current.yOffset = 0
          }
        }}
      >
        <primitive object={clone(model)} />
      </RigidBody>
    </group>
  )
}, (prevProps, nextProps) => {
  return prevProps.x === nextProps.x &&
    prevProps.y === nextProps.y &&
    prevProps.z === nextProps.z
})

const FishMultiplier = ({ x, y, z, store_assets_gltf }: { x: number; y: number; z: number, store_assets_gltf: GLTF }) => {
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; yOffset: number } | null>(null)

  const model = useMemo(() => {
    const object = store_assets_gltf.scene.getObjectByName("diamond_fish");
    if (!object) return null;

    // Reset position of all meshes in the tree
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.position.set(0, 0, 0);
        child.updateMatrix();
      }
    });

    // object.scale.set(scale, scale, scale);
    return object;
  }, [store_assets_gltf.scene]);



  useFrame((state, delta) => {
    if (groupRef.current?.wasHit) {
      // Move up and fade out over 0.5 seconds
      groupRef.current.yOffset += delta * 2
      groupRef.current.opacity = Math.max(0, groupRef.current.opacity - delta * 2)

      // Update the group's position and opacity
      groupRef.current.position.y = groupRef.current.yOffset
      groupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = groupRef.current!.opacity
        }
      })

      // Remove the fish after animation completes
      if (groupRef.current.opacity <= 0) {
        groupRef.current.visible = false
      }
    }
  })

  if (!model) return null;

  return (
    <group ref={groupRef}>
      <RigidBody
        type="fixed"
        name={`fish-multiplier`}
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        scale={0.5}
        sensor
        onIntersectionEnter={({ other }) => {
          if (other.rigidBodyObject?.name === 'player' && groupRef.current && !groupRef.current.wasHit) {
            groupRef.current.wasHit = true
            groupRef.current.opacity = 1
            groupRef.current.yOffset = 0
          }
        }}
      >
        {/* <mesh castShadow>
          <meshStandardMaterial
            color="#00FF00"
            metalness={0.8}
            roughness={0.2}
          />
          <sphereGeometry args={[0.5, 32, 32]} />
        </mesh> */}
        <primitive object={clone(model)} />
      </RigidBody>
    </group>
  )
}

export const getRandomObstacleType = (obstacleTypes: IObstacleTypeWithChance[]) => {
  // Normalize chances to ensure they sum to 1
  const totalChance = obstacleTypes.reduce((sum, { chance }) => sum + chance, 0);
  const normalizedTypes = obstacleTypes.map(({ type, chance }) => ({
    type,
    chance: chance / totalChance
  }));

  // Generate random number between 0 and 1
  const random = Math.random();

  // Find the first obstacle type where the cumulative chance exceeds the random number
  let cumulativeChance = 0;
  for (const { type, chance } of normalizedTypes) {
    cumulativeChance += chance;
    if (random <= cumulativeChance) {
      return type;
    }
  }

  // Fallback to last type (should never happen if chances are properly normalized)
  return normalizedTypes[normalizedTypes.length - 1].type;
}
const carNames = [
  "car_SUV_large_body",
  "car_SUV_large_body_1",
  "universal_car_body",
];

const rockNames = [
  // "stones_group_winter_2",
  // "stone_winter_small_5001",
  // "stone_winter_small_5002",
  "stone_winter_small_8__2_002",
  "stone_winter_small_8__5_004",
  "stone_winter_small_8__5_005",
]

// each obstacle should have deadly planes and the object itself should be non-deadly - to minimze the collision detection complexity
// deadly planes have name={"obstacle-" + obstacle.type}>
export const Obstacle = memo(
  function Obstacle({
    obstacle,
    snowColorMap,
    snowNormalMap,
    modelsGltf,
    store_assets_gltf,
    FishModel,
  }: {
    obstacle: IObstacle;
    snowColorMap: THREE.Texture;
    snowNormalMap: THREE.Texture;
    modelsGltf: GLTF;
    store_assets_gltf: GLTF;
    FishModel: any;
  }) {
    const [x, y, z] = obstacle.position;

    const randomRockObjectName = rockNames[Math.floor(Math.random() * rockNames.length)];

    switch (obstacle.type) {
      case "fish":
        return <Fish x={x} y={y} z={z} Model={FishModel} />;
      case "low-rock":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={randomRockObjectName} gltf={modelsGltf} scale={randomRockObjectName === "stones_group_winter_2" ? 0.003 : 0.02} />
      case "lying-tree-long":
        return <TexturedObstacle x={x - 2} y={y} z={z} obstacle={obstacle} objectName="fir_tree_winter_tilted_3" rotation={[0, Math.PI / 2, 0]} gltf={modelsGltf} scale={0.004} />
      case "tree-trunk-winter":
        return <TexturedObstacle x={x} y={y + 0.1} z={z} obstacle={obstacle} objectName="tree_trunk_winter" gltf={modelsGltf} rotation={[0, Math.PI / 1.8, 0]} scale={0.010} />
      case "fishing-net":
        return <FishingNet x={x} y={y} z={z} store_assets_gltf={store_assets_gltf} />;
      case "fish-multiplier":
        return <FishMultiplier x={x} y={y} z={z} store_assets_gltf={store_assets_gltf} />;
      case "fence":
        //country_fence
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="country_fence" gltf={modelsGltf} scale={0.006} />
      case "bonfire":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="bonfire" gltf={modelsGltf} scale={0.015} />
      case "car":
        const randomCarObjectName = carNames[Math.floor(Math.random() * carNames.length)];
        return <TexturedObstacle x={x} y={y} z={z + 1} obstacle={obstacle} objectName={randomCarObjectName} gltf={modelsGltf} scale={0.008} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "reindeer":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="reindeer" gltf={modelsGltf} scale={0.008} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "lamp":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="lamppost_3__3_" gltf={modelsGltf} scale={0.008} />
      case "lamp-winter":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="lamppost_4__5_001" gltf={modelsGltf} scale={0.012} />
      case "cane":
        const caneName = Math.random() > 0.5 ? "caramel_cane__4__1003" : "caramel_cane__4__1001";
        return <TexturedObstacle x={x} y={y + caneName === "caramel_cane__4__1003" ? 1.3 : 1.8} z={z} obstacle={obstacle} objectName={caneName} rotation={[Math.PI / 2, Math.random() > 0.5 ? Math.PI : 0, 0]} gltf={modelsGltf} scale={caneName === "caramel_cane__4__1003" ? 0.03 : 0.08} />
      case "dumpster":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="dumpster_green_winter" gltf={modelsGltf} scale={0.008} rotation={[Math.PI / 2, 0, 0]} />
      case "sled":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={Math.random() > 0.5 ? "sled_green" : "sled_green001"} gltf={modelsGltf} scale={0.012} rotation={[Math.PI / 2, Math.random() > 0.5 ? -Math.PI / 2 : Math.PI / 2, 0]} />
      case "ski-flag":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="ski_flag_red__1_" gltf={modelsGltf} scale={0.012} rotation={[Math.PI / 2, Math.PI, 0]} />
      case "snow-shovel":
        return <TexturedObstacle x={x} y={y + 1} z={z} obstacle={obstacle} objectName="snow_shovel_yellow__1_" gltf={modelsGltf} scale={0.02} rotation={[Math.PI / 2, Math.PI, 0]} />
      case "sleigh":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="santa_claus_sleigh" gltf={modelsGltf} scale={0.008} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "hydrant":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="hydrant" gltf={modelsGltf} scale={0.012} />
      case "information-plate":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="information_plate001" gltf={modelsGltf} scale={0.01} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "winter-information-plate":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="information_plate_winter001" gltf={modelsGltf} scale={0.004} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "gift":
        const giftNames = [
          "square_gift_box_red",
          "rhombus_gift_box_white",
          "oval_gift_box_blue__1_001",
        ];

        const randomGiftObjectName = giftNames[Math.floor(Math.random() * giftNames.length)];
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={randomGiftObjectName} gltf={modelsGltf} scale={0.025} />
      case "winter-well":
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="winter_well" gltf={modelsGltf} scale={0.009} rotation={[Math.PI / 2, -Math.PI / 2, 0]} />
      case "ramp":
        const hasSmallObstacle = obstacle.rampConfig?.hasSmallObstacle ?? false;
        const hasBigObstacle = obstacle.rampConfig?.hasBigObstacle ?? false;

        const rampBigObstacleTypes: IObstacleTypeWithChance[] = [
          { type: "snowman", chance: 0.35 },
          { type: "lamp-winter", chance: 0.2 },
          { type: "information-plate", chance: 0.25 },
          { type: "cane", chance: 0.2 },
        ]

        const rampSmallObstacleTypes: IObstacleTypeWithChance[] = [
          { type: "low-rock", chance: 0.7 },
          { type: "gift", chance: 0.25 },
          { type: "fence", chance: 0.05 },
        ]

        return (
          <>
            <RigidBody
              type="fixed"
              name="ground"
              position={[x, z - 3.7 + RUNWAY_LENGTH / 2, 0.7]}
              rotation={[Math.PI / 2 + RAMP_SLOPE, 0, 0]}
              friction={0.3}
            >
              <mesh>
                <meshBasicMaterial visible={false} />
                <planeGeometry args={[RAMP_WIDTH, RAMP_LENGTH]} />
              </mesh>
            </RigidBody>
            <RigidBody
              type="fixed"
              name="ground"
              position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 0.2]}
              rotation={[Math.PI / 2, 0, 0]}
              friction={0.03}
            >
              <mesh>
                <meshBasicMaterial visible={false} />
                <boxGeometry args={[RAMP_WIDTH, RAMP_LENGTH, RUNWAY_LENGTH]} />
              </mesh>
            </RigidBody>

            <mesh
              position={[x, z - 3.7 + RUNWAY_LENGTH / 2, 0.7]}
              rotation={[Math.PI / 2 + RAMP_SLOPE, 0, 0]}
            >
              <SnowPlane
                width={RAMP_WIDTH}
                length={RAMP_LENGTH}
                resolutionX={30}
                resolutionY={30}
                grooveAmplitude={0.05}
                grooveFrequency={3}
              />
              <meshStandardMaterial
                map={snowColorMap} // Base color of the snow
                normalMap={snowNormalMap} // Surface detail
                normalScale={new THREE.Vector2(1, 1)} // Adjust normal map strength
                roughness={0.9} // Base roughness (snow is rough)
                metalness={0} // Snow isn't metallic
                side={THREE.DoubleSide}
              />
            </mesh>

            <mesh
              position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 1.45]}
              rotation={[0, 0, 0]}
            >
              <meshStandardMaterial
                map={snowColorMap}
                side={THREE.DoubleSide}
              />
              <SnowPlane
                width={RAMP_WIDTH}
                length={RUNWAY_LENGTH}
                resolutionX={30}
                resolutionY={30}
                grooveAmplitude={0.05}
                grooveFrequency={3}
              />
            </mesh>

            <mesh
              position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 0.2]}
              rotation={[Math.PI / 2, 0, 0]}
            >
              <meshStandardMaterial
                map={snowColorMap}
                side={THREE.DoubleSide}
              />
              <boxGeometry args={[RAMP_WIDTH, RAMP_LENGTH, RUNWAY_LENGTH]} />
            </mesh>

            {hasSmallObstacle && (
              // <LowRock
              //   x={x}
              //   y={y + RAMP_LENGTH / 2}
              //   z={z + RUNWAY_LENGTH}
              //   obstacle={obstacle}
              // />

              //<TexturedObstacle x={x} y={y + RAMP_LENGTH / 2} z={z + RUNWAY_LENGTH} obstacle={obstacle} objectName={randomRockObjectName} gltf={modelsGltf} scale={0.003} />
              <Obstacle obstacle={{ ...obstacle, type: getRandomObstacleType(rampSmallObstacleTypes), position: [x, y + RAMP_LENGTH / 2, z + RUNWAY_LENGTH] }} snowColorMap={snowColorMap} snowNormalMap={snowNormalMap} FishModel={FishModel} modelsGltf={modelsGltf} store_assets_gltf={store_assets_gltf} />
            )}

            {hasBigObstacle && (
              // <Snowman
              //   x={x}
              //   y={y + RAMP_LENGTH / 2}
              //   z={z + RUNWAY_LENGTH}
              //   snowColorMap={snowColorMap}
              //   snowNormalMap={snowNormalMap}
              // />
              // <TexturedObstacle x={x} y={y + RAMP_LENGTH / 2} z={z + RUNWAY_LENGTH} obstacle={obstacle} objectName="snowman" gltf={modelsGltf} scale={0.015} rotation={[Math.PI / 2, 0, 0]} />
              <Obstacle obstacle={{ ...obstacle, type: getRandomObstacleType(rampBigObstacleTypes), position: [x, y + RAMP_LENGTH / 2, z + RUNWAY_LENGTH] }} snowColorMap={snowColorMap} snowNormalMap={snowNormalMap} FishModel={FishModel} modelsGltf={modelsGltf} store_assets_gltf={store_assets_gltf} />

            )}
          </>
        );
      case "tree":
        //return <Tree x={x} y={y} z={z} />;
        const treeNames = [
          "fir_tree_winter_large_2__5_",
          "fir_tree_winter_small_2__2_001",
          "fir_tree_winter_tilted_4",
          "fir_tree_winter_large_2__1_",
          "fir_tree_winter_small_3__2_001",
          "fir_tree_winter_tilted_3001",
          "fir_tree_winter_small_3__2_005",
          "fir_tree_winter_tilted_2__1_",
          "dry_tree_winter"
          // "Tree_Part_1013",
          // "Tree_Part_6006",
          // "Tree_Part_1011",
          // "Tree_Part_1014"
        ] as const;
        const randomObjectName = treeNames[Math.floor(Math.random() * treeNames.length)];

        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={randomObjectName} gltf={modelsGltf} scale={0.0045} />;
      case "big-tree":
        //return <Tree x={x} y={y} z={z} />;
        const bigTreeNames = [
          "fir_tree_winter_large_2__5_",
          "fir_tree_winter_tilted_4",
          "fir_tree_winter_large_2__1_",
          "fir_tree_winter_tilted_3001",
          "fir_tree_winter_tilted_2__1_",
          // "Tree_Part_1013",
          // "Tree_Part_6006",
          // "Tree_Part_1011",
          // "Tree_Part_1014"
        ] as const;
        const bigTreeObjectName = bigTreeNames[Math.floor(Math.random() * bigTreeNames.length)];

        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={bigTreeObjectName} gltf={modelsGltf} scale={0.0045} />;
      case "snowman":
        // return (
        //   <Snowman
        //     x={x}
        //     y={y}
        //     z={z}
        //     snowColorMap={snowColorMap}
        //     snowNormalMap={snowNormalMap}
        //   />
        // );
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="snowman" gltf={modelsGltf} scale={0.015} />;

      default:
        return null;
    }
  },
  (prevProps, nextProps) => {
    const prevObstacle = prevProps.obstacle as IObstacle;
    const nextObstacle = nextProps.obstacle as IObstacle;

    return (
      prevObstacle.position[0] === nextObstacle.position[0] &&
      prevObstacle.position[1] === nextObstacle.position[1] &&
      prevObstacle.position[2] === nextObstacle.position[2] &&
      prevObstacle.type === nextObstacle.type
    );
  },
);
