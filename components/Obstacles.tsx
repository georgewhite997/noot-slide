import { memo, useMemo, useRef } from "react";
import { IChunk, IObstacle, laneType } from "./shared";
import { lanes, SEGMENT_LENGTH } from "./shared";
import { noise2D } from "@/utils";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { SnowPlane } from "./Segment";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useAtom } from "jotai";
import { hasFishingNetAtom } from "@/atoms";

const RAMP_LENGTH = 2.5;
const RAMP_WIDTH = 3;
const RUNWAY_LENGTH = 8;
const RAMP_SLOPE = -0.9;

const chunks: IChunk[] = [
  {
    name: "one_ramp",
    length: 5,
    obstacleSpacing: 2,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
    ) => {


      const obstacles: IObstacle[] = [];
      const hasObstacle = Math.random() < 0.5;
      const hasRock = hasObstacle && Math.random() < 0.7;
      const hasSnowman = hasObstacle && !hasRock;

      // Determine which side to leave empty
      let emptySide: "left" | "right";
      if (entryLane === 0) {
        // Leftmost lane
        emptySide = "right";
      } else if (entryLane === 2) {
        // Rightmost lane
        emptySide = "left";
      } else {
        // Middle lane
        emptySide = Math.random() < 0.5 ? "left" : "right";
      }

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;
          // Skip the entry lane and leave 2 blocks empty on the chosen side if there's a tree
          const isOnEmptySide =
            emptySide === "left"
              ? j === (entryLane - 1 + 3) % 3
              : j === (entryLane + 1) % 3;

          if (
            j !== entryLane &&
            (!hasSnowman || i < length - 2 || !isOnEmptySide)
          ) {
            const random = noise2D(j + i, entropy);
            obstacles.push({
              position: [x, 0, z] as [number, number, number],
              type:
                random < -0.3 ? "tree" : random < 0.3 ? "snowman" : "low-rock",
            });
          } else if (j === entryLane) {
            if (i === length - 1 && hasObstacle) {
              continue;
            }

            // Check for fishing net placement at start or end
            const fishYPosition = i === 0 ? RAMP_LENGTH / 4 : RAMP_LENGTH / 2;

            if (i === 0 || i === length - 1) {
              const hasPowerUp = Math.random() < 0.2;
              if (hasPowerUp) {
                // If placing at start, don't place at end
                if (i === 0) {
                  obstacles.push({
                    position: [x, fishYPosition, z] as [number, number, number],
                    type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                  });
                } else if (i === length - 1) {
                  // Only place at end if there's no fishing net at start
                  const hasPowerUpAtStart = obstacles.some(
                    obs => (obs.type === "fishing-net" || obs.type === "fish-multiplier") && obs.position[2] === 0
                  );
                  if (!hasPowerUpAtStart) {
                    obstacles.push({
                      position: [x, 0, z] as [number, number, number],
                      type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                    });
                  }
                }
              } else {
                // If no fishing net, can place fish
                obstacles.push({
                  position: [x, fishYPosition, z] as [number, number, number],
                  type: "fish",
                });
              }
            } else {
              // Regular fish placement for non-start/end positions
              obstacles.push({
                position: [x, fishYPosition, z] as [number, number, number],
                type: "fish",
              });
            }
          }
        }
      }

      // Add a low rock at the end of the empty space if there's a tree
      if (hasSnowman && Math.random() < 0.25) {
        const emptyLane =
          emptySide === "left" ? (entryLane - 1 + 3) % 3 : (entryLane + 1) % 3;
        const rockPosition = Math.random() < 0.5 ? length - 1 : length - 2;
        obstacles.push({
          position: [lanes[emptyLane], 0, rockPosition * obstacleSpacing] as [
            number,
            number,
            number,
          ],
          type: "low-rock",
        });
      }

      return [
        ...obstacles,
        {
          position: [lanes[entryLane], 0, 0] as [number, number, number],
          type: "ramp",
          rampConfig: {
            hasRock,
            hasSnowman,
          },
        },
      ];
    },
  },
  {
    name: "two_ramps",
    length: 4,
    obstacleSpacing: 2,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
    ) => {
      const obstacles: IObstacle[] = [];

      // Determine the second ramp lane (must be different from entry lane)
      let secondRampLane: laneType;
      do {
        secondRampLane = Math.round(Math.random() * 2) as laneType;
      } while (secondRampLane === entryLane);

      const firstRampHasSnowman = Math.random() < 0.5;
      let firstRampHasRock = !firstRampHasSnowman && Math.random() < 0.5;

      const firstRampHasObstacle = firstRampHasSnowman || firstRampHasRock;

      const secondRampHasRock = firstRampHasRock && Math.random() < 0.5;

      // Ensure at least one ramp has an obstacle
      if (!firstRampHasSnowman && !firstRampHasRock && !secondRampHasRock) {
        firstRampHasRock = true;
      }

      // Track if any ramp has a fishing net
      let hasPowerUp = false;

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both ramp lanes and add obstacles only in the remaining lane
          if (j !== entryLane && j !== secondRampLane) {
            const random = noise2D(j + i, entropy);
            obstacles.push({
              position: [x, 0, z] as [number, number, number],
              type:
                random < -0.3 ? "tree" : random < 0.3 ? "snowman" : "low-rock",
            });
          } else {
            if (i === length - 1 && ((i === entryLane && firstRampHasObstacle) || (i === secondRampLane && secondRampHasRock))) {
              continue;
            }

            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 1) {
              let fishingNetChance = 0.3;

              // If this is the start of a ramp with an obstacle, increase chance to 20%
              if (i === 0) {
                if ((j === entryLane && firstRampHasObstacle) || (j === secondRampLane && secondRampHasRock)) {
                  fishingNetChance = 0.3;
                }
              }

              const shouldPlaceFishingNet = !hasPowerUp && Math.random() < fishingNetChance;
              if (shouldPlaceFishingNet) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                });
                hasPowerUp = true;
              } else {
                // If no fishing net, can place fish
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            } else {
              // Regular fish placement for non-start/end positions
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "fish",
              });
            }
          }
        }
      }

      return [
        ...obstacles,
        {
          position: [lanes[entryLane], 0, 0] as [number, number, number],
          type: "ramp",
          rampConfig: {
            hasRock: firstRampHasRock,
            hasSnowman: firstRampHasSnowman,
          },
        },
        {
          position: [lanes[secondRampLane], 0, 0] as [number, number, number],
          type: "ramp",
          rampConfig: {
            hasRock: secondRampHasRock,
            hasSnowman: false,
          },
        },
      ];
    },
  },
  {
    name: "turns_only",
    length: 4,
    obstacleSpacing: 2,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
    ) => {
      const obstacles: IObstacle[] = [];

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;
          if (j !== entryLane) {
            const random = noise2D(j + i, entropy);
            if (random < 0.4) {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "tree",
              });
            } else {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "snowman",
              });
            }
          } else {

            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 1) {
              const hasPowerUp = Math.random() < 0.2;
              if (hasPowerUp) {
                // If placing at start, don't place at end
                if (i === 0) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                  });
                } else if (i === length - 1) {
                  // Only place at end if there's no fishing net at start
                  const hasPowerUpAtStart = obstacles.some(
                    obs => (obs.type === "fishing-net" || obs.type === "fish-multiplier") && obs.position[2] === 0
                  );
                  if (!hasPowerUpAtStart) {
                    obstacles.push({
                      position: [x, 0, z] as [number, number, number],
                      type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                    });
                  }
                }
              } else {
                // If no fishing net, can place fish
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            } else {
              // Regular fish placement for non-start/end positions
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "fish",
              });
            }
          }
        }
      }
      return obstacles;
    },
  },
  {
    name: "forest",
    length: 4,
    obstacleSpacing: 2,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
    ) => {
      const obstacles: IObstacle[] = [];

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;
          if (j !== entryLane) {
            const random = noise2D(j + i, entropy);
            if (random < -0.5) {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "low-rock",
              });
            } else {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "tree",
              });
            }
          } else {
            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 1) {
              const hasPowerUp = Math.random() < 0.2;
              if (hasPowerUp) {
                // If placing at start, don't place at end
                if (i === 0) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                  });
                } else if (i === length - 1) {
                  // Only place at end if there's no fishing net at start
                  const hasPowerUpAtStart = obstacles.some(
                    obs => (obs.type === "fishing-net" || obs.type === "fish-multiplier") && obs.position[2] === 0
                  );
                  if (!hasPowerUpAtStart) {
                    obstacles.push({
                      position: [x, 0, z] as [number, number, number],
                      type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                    });
                  }
                }
              } else {
                // If no fishing net, can place fish
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            } else {
              // Regular fish placement for non-start/end positions
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "fish",
              });
            }
          }
        }
      }
      return obstacles;
    },
  },
];


let previousEntryLane: laneType | null = null;
let previousChunkType: string | null = null;

export const getObstacles = () => {
  const obstacles: IObstacle[][] = [];
  const initialZoffset = -SEGMENT_LENGTH / 2 + 0.25;
  const endOfSegment = SEGMENT_LENGTH / 2;
  let zOffset = initialZoffset;
  const interchunkSpacing = 4;
  let i = 0;

  while (true) {
    let chunk = chunks[Math.floor(Math.random() * chunks.length)];

    // Check if we should reroll 
    if (previousChunkType === null) {
      previousChunkType = chunk.name;
    } else {
      do {
        chunk = chunks[Math.floor(Math.random() * chunks.length)];
      } while (previousChunkType === chunk.name);
    }


    let entryLaneIndex: laneType;
    if (previousEntryLane === null) {
      entryLaneIndex = Math.round(Math.random() * 2) as laneType;
    } else {
      // find index that's not too far from previousEntryLane
      do {
        entryLaneIndex = Math.round(Math.random() * 2) as laneType;
      } while (Math.abs(entryLaneIndex - previousEntryLane) != 1);
    }

    previousEntryLane = entryLaneIndex;

    const chunkObstacles = chunk.get(chunk, entryLaneIndex, i);
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

const Tree = ({
  x,
  y,
  z,
}: {
  x: number;
  y: number;
  z: number;
}) => {
  return (
    <>
      <RigidBody
        type="fixed"
        name="deadly-obstacle"
        position={[x, z, y + 2]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <mesh castShadow>
          <meshStandardMaterial color="green" />
          <coneGeometry args={[0.5, 1.5, 16]} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        name="deadly-obstacle"
        position={[x, z, y + 0.75]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <mesh castShadow>
          <meshStandardMaterial color="brown" />
          <cylinderGeometry args={[0.25, 0.25, 1.5, 16]} />
        </mesh>
      </RigidBody>
    </>
  );
};

const Snowman = ({
  x,
  y,
  z,
  snowColorMap,
  snowNormalMap,
}: {
  x: number;
  y: number;
  z: number;
  snowColorMap: THREE.Texture;
  snowNormalMap: THREE.Texture;
}) => {
  return (
    <>
      <RigidBody
        type="fixed"
        name="deadly-obstacle"
        position={[x, z, y]}
        colliders="ball"
      >
        <mesh castShadow>
          <meshStandardMaterial
            map={snowColorMap}
            normalMap={snowNormalMap}
            side={THREE.DoubleSide}
          />
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        name="deadly-obstacle"
        position={[x, z, y + 1]}
        colliders="ball"
      >
        <mesh castShadow>
          <meshStandardMaterial
            map={snowColorMap}
            normalMap={snowNormalMap}
            side={THREE.DoubleSide}
          />
          <sphereGeometry args={[0.5, 32, 16]} />
        </mesh>
      </RigidBody>
    </>
  );
};

const LowRock = ({
  x,
  y,
  z,
  obstacle,
}: {
  x: number;
  y: number;
  z: number;
  obstacle: IObstacle;
}) => {
  return (
    <>
      <RigidBody
        name={"deadly-obstacle-" + obstacle.type}
        position={[x - 0.61, z - 0.58, 0.65 + y]}
        rotation={[Math.PI / 2, -Math.PI - 0.6, 0]}
      >
        <mesh>
          <planeGeometry args={[0.35, 0.9]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody
        name={"deadly-obstacle-" + obstacle.type}
        position={[x + 0.61, z - 0.58, 0.65 + y]}
        rotation={[Math.PI / 2, -Math.PI + 0.6, 0]}
      >
        <mesh>
          <planeGeometry args={[0.35, 0.9]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody
        name={"deadly-obstacle-" + obstacle.type}
        position={[x, z - 0.7, 0.65 + y]}
        rotation={[Math.PI / 2, -Math.PI, 0]}
      >
        <mesh>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody
        name={"bouncy-obstacle-" + obstacle.type}
        position={[x - 0.7, z, 0.7 + y]}
        rotation={[Math.PI / 2, Math.PI / 2, 0]}
        restitution={0.5}
      >
        <mesh>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>
      <RigidBody
        name={"bouncy-obstacle-" + obstacle.type}
        position={[x + 0.7, z, 0.7 + y]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        restitution={0.5}
      >
        <mesh>
          <planeGeometry args={[0.9, 0.9]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </RigidBody>

      <RigidBody
        type="fixed"
        name="obstacle-fixed"
        position={[x, z, 0.5 + y]}
        colliders="ball"
      >
        <mesh castShadow>
          <meshStandardMaterial color="gray" />;
          <sphereGeometry args={[0.7, 32, 32]} />
        </mesh>
      </RigidBody>
    </>
  );
};



const Fish = ({ x, y, z, gltf }: { x: number; y: number; z: number, gltf: GLTF }) => {
  const [hasFishingNet] = useAtom(hasFishingNetAtom);
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; yOffset: number } | null>(null)
  const fishId = useMemo(() => THREE.MathUtils.generateUUID(), [])
  const clonedScene = useMemo(() => {
    const scene = clone(gltf.scene)
    // Clone all materials in the scene
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = child.material.clone()
        child.material.transparent = true
      }
    })
    return scene
  }, [gltf.scene])

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
            groupRef.current.opacity = 1
            groupRef.current.yOffset = 0
          }
        }}
      >
        <primitive object={clonedScene} />
      </RigidBody>

      <RigidBody
        type="fixed"
        name={`fish-hitbox-${fishId}`}
        position={[x, z, y + 0.3]}
        rotation={[Math.PI / 2, -Math.PI / 2, 0]}
        sensor
        onIntersectionEnter={({ other }) => {
          //if no hasMagnet atom return
          if (!hasFishingNet) return;
          if (other.rigidBodyObject?.name === 'player' && groupRef.current && !groupRef.current.wasHit) {
            groupRef.current.wasHit = true
            groupRef.current.opacity = 1
            groupRef.current.yOffset = 0
          }
        }}
      >
        <CuboidCollider args={[2, 5, 10]} />
      </RigidBody>
    </group>
  )
}

const FishingNet = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; yOffset: number } | null>(null)

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
        <mesh castShadow>
          <meshStandardMaterial
            color="#FFD700"
            metalness={0.8}
            roughness={0.2}
          />
          <sphereGeometry args={[0.5, 32, 32]} />
        </mesh>
      </RigidBody>
    </group>
  )
}

const FishMultiplier = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; yOffset: number } | null>(null)

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

  return (
    <group ref={groupRef}>
      <RigidBody
        type="fixed"
        name={`fish-multiplier`}
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
        <mesh castShadow>
          <meshStandardMaterial
            color="#00FF00"
            metalness={0.8}
            roughness={0.2}
          />
          <sphereGeometry args={[0.5, 32, 32]} />
        </mesh>
      </RigidBody>
    </group>
  )
}


// each obstacle should have deadly planes and the object itself should be non-deadly - to minimze the collision detection complexity
// deadly planes have name={"obstacle-" + obstacle.type}>
export const Obstacle = memo(
  function Obstacle({
    obstacle,
    snowColorMap,
    snowNormalMap,
    fishGltf,
  }: {
    obstacle: IObstacle;
    snowColorMap: THREE.Texture;
    snowNormalMap: THREE.Texture;
    fishGltf: GLTF;
  }) {
    const [x, y, z] = obstacle.position;

    switch (obstacle.type) {
      case "low-rock":
        return <LowRock x={x} y={y} z={z} obstacle={obstacle} />;
      case "fish":
        return <Fish x={x} y={y} z={z} gltf={fishGltf} />;
      case "fishing-net":
        return <FishingNet x={x} y={y} z={z} />;
      case "fish-multiplier":
        return <FishMultiplier x={x} y={y} z={z} />;
      case "ramp":
        const hasRock = obstacle.rampConfig?.hasRock ?? false;
        const hasSnowman = obstacle.rampConfig?.hasSnowman ?? false;
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
                isSide={false}
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
                isSide={false}
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

            {hasRock && (
              <LowRock
                x={x}
                y={y + RAMP_LENGTH / 2}
                z={z + RUNWAY_LENGTH}
                obstacle={obstacle}
              />
            )}

            {hasSnowman && (
              <Snowman
                x={x}
                y={y + RAMP_LENGTH / 2}
                z={z + RUNWAY_LENGTH}
                snowColorMap={snowColorMap}
                snowNormalMap={snowNormalMap}
              />
            )}
          </>
        );
      case "tree":
        return <Tree x={x} y={y} z={z} />;
      case "snowman":
        return (
          <Snowman
            x={x}
            y={y}
            z={z}
            snowColorMap={snowColorMap}
            snowNormalMap={snowNormalMap}
          />
        );
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
