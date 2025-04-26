import { memo, useMemo, useRef } from "react";
import { IChunk, IObstacle, IObstacleType, IObstacleTypeWithChance, laneType } from "./shared";
import { lanes, SEGMENT_LENGTH } from "./shared";
import { noise2D } from "@/utils";
import { CuboidCollider, RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { SnowPlane } from "./Segment";
import { useFrame } from "@react-three/fiber";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useAtom } from "jotai";
import { hasFishingNetAtom, scoreAtom } from "@/atoms";

const RAMP_LENGTH = 2.5;
const RAMP_WIDTH = 3;
const RUNWAY_LENGTH = 8;
const RAMP_SLOPE = -0.9;

const chunks: IChunk[] = [
  {
    name: "lying_tree",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: true,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const longObstaclesPositions: { i: number; j: number }[] = [];

      const obstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "tree", chance: 0.1 },
        { type: "low-rock", chance: 0.1 },
        { type: "dumpster", chance: 0.05 },
        { type: "lamp-winter", chance: 0.15 },
        { type: "lamp", chance: 0.15 },
        { type: "sleigh", chance: 0.1 },
        { type: "car", chance: 0.05 },
        { type: "snow-shovel", chance: 0.05 },
        { type: "gift", chance: 0.1 },
        { type: "information-plate", chance: 0.15 },
        { type: "winter-information-plate", chance: 0.1 },
      ] : [
        { type: "tree", chance: 0.43 },
        { type: "low-rock", chance: 0.05 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.05 },
        { type: "cane", chance: 0.05 },
        { type: "winter-well", chance: 0.05 },
        { type: "dumpster", chance: 0.04 },
        { type: "lamp-winter", chance: 0.03 },
        { type: "sleigh", chance: 0.03 },
        { type: "sled", chance: 0.03 },
        { type: "snow-shovel", chance: 0.02 },
        { type: "gift", chance: 0.02 },
        { type: 'car', chance: 1 }
      ]

      let additionalEntryLane: laneType | null = null;
      if (difficulty === "easy" || difficulty === "medium") {
        // For easy and medium, add an additional entry lane
        if (entryLane === 0) {
          additionalEntryLane = 1; // If left lane is entry, add middle as additional
        } else if (entryLane === 2) {
          additionalEntryLane = 1; // If right lane is entry, add middle as additional
        } else {
          additionalEntryLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
        }
      }

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (!isEntryLane && i !== length - 1) {
            if (longObstaclesPositions.some(pos => pos.i === i - 1 && pos.j === j)) continue;

            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              const obstacleType = getRandomObstacleType(obstacleTypes);
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: obstacleType,
              });

              if (obstacleType === "sleigh" || obstacleType === "reindeer" || obstacleType === "car") {
                longObstaclesPositions.push({ i, j });
              }
            }
          } else {
            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 2) {
              const hasPowerUp = Math.random() < 0.2;
              if (hasPowerUp) {
                // If placing at start, don't place at end
                if (i === 0) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                  });
                } else if (i === length - 2) {
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
                // If no fishing net, can place fish with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions with 70% chance
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            }
          }
        }
      }

      return [
        ...obstacles,
        {
          position: [lanes[entryLane], 0.2, (length - 1) * obstacleSpacing] as [number, number, number],
          type: Math.random() < 0.7 ? "lying-tree-long" : "tree-trunk-winter",
        }
      ];
    },
  },
  {
    name: "one_ramp",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: false,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const longObstaclesPositions: { i: number; j: number }[] = [];
      const obstacleTypes: IObstacleTypeWithChance[] = [
        { type: "tree", chance: 0.43 },
        { type: "low-rock", chance: 0.05 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.05 },
        { type: "cane", chance: 0.05 },
        { type: "winter-well", chance: 0.05 },
        { type: "dumpster", chance: 0.04 },
        { type: "lamp-winter", chance: 0.03 },
        { type: "sleigh", chance: 0.03 },
        { type: "sled", chance: 0.03 },
        { type: "snow-shovel", chance: 0.02 },
        { type: "gift", chance: 0.02 },
      ]

      const hasObstacle = difficulty !== "easy" ? Math.random() < 0.7 : Math.random() < 0.5;
      const hasSmallObstacle = hasObstacle && Math.random() < 0.7;
      const hasBigObstacle = hasObstacle && !hasSmallObstacle;

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

      // Determine additional entry lane based on difficulty
      let additionalEntryLane: laneType | null = null;
      if (difficulty === "easy" || difficulty === "medium") {
        // For easy and medium, add an additional entry lane
        if (entryLane === 0) {
          additionalEntryLane = 1; // If left lane is entry, add middle as additional
        } else if (entryLane === 2) {
          additionalEntryLane = 1; // If right lane is entry, add middle as additional
        } else {
          additionalEntryLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
        }
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

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (
            !isEntryLane &&
            (!hasBigObstacle || i < length - 2 || !isOnEmptySide)
          ) {
            if (longObstaclesPositions.some(pos => pos.i === i - 1 && pos.j === j)) continue;
            const obstacleType = getRandomObstacleType(obstacleTypes);
            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: obstacleType,
              });

              if (obstacleType === "sleigh" || obstacleType === "reindeer") {
                longObstaclesPositions.push({ i, j });
              }
            }
          } else if (isEntryLane) {
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
                    position: [x, j === entryLane ? fishYPosition : 0, z] as [number, number, number],
                    type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                  });
                } else if (i === length - 1) {
                  // Only place at end if there's no fishing net at start
                  const hasPowerUpAtStart = obstacles.some(
                    obs => (obs.type === "fishing-net" || obs.type === "fish-multiplier") && obs.position[2] === 0
                  );
                  if (!hasPowerUpAtStart) {
                    obstacles.push({
                      position: [x, entryLane ? fishYPosition : 0, z] as [number, number, number],
                      type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                    });
                  }
                }
              } else {
                // If no fishing net, can place fish with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, j === entryLane ? fishYPosition : 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions with 70% chance
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, j === entryLane ? fishYPosition : 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            }
          }
        }
      }

      // Add a low rock at the end of the empty space if there's a tree
      if (hasBigObstacle && Math.random() < 0.25) {
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
            hasSmallObstacle,
            hasBigObstacle,
          },
        },
      ];
    },
  },
  {
    name: "two_ramps",
    length: 4,
    obstacleSpacing: 2,
    possibleDifficulties: ["medium", "hard"],
    canBeRoad: false,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const longObstaclesPositions: { i: number; j: number }[] = [];
      // Determine the second ramp lane (must be different from entry lane)
      let secondRampLane: laneType;
      do {
        secondRampLane = Math.round(Math.random() * 2) as laneType;
      } while (secondRampLane === entryLane);

      const firstRampHasBigObstacle = Math.random() < 0.5;
      let firstRampHasSmallObstacle = !firstRampHasBigObstacle && Math.random() < 0.5;

      const firstRampHasObstacle = firstRampHasBigObstacle || firstRampHasSmallObstacle;

      const secondRampHasSmallObstacle = firstRampHasSmallObstacle && Math.random() < 0.5;

      // Ensure at least one ramp has an obstacle
      if (!firstRampHasBigObstacle && !firstRampHasSmallObstacle && !secondRampHasSmallObstacle) {
        firstRampHasSmallObstacle = true;
      }

      const obstacleTypes: IObstacleTypeWithChance[] = [
        { type: "tree", chance: 0.43 },
        { type: "low-rock", chance: 0.05 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.05 },
        { type: "cane", chance: 0.05 },
        { type: "winter-well", chance: 0.05 },
        { type: "dumpster", chance: 0.04 },
        { type: "lamp-winter", chance: 0.03 },
        { type: "sleigh", chance: 0.03 },
        { type: "sled", chance: 0.03 },
        { type: "snow-shovel", chance: 0.02 },
        { type: "gift", chance: 0.02 },
      ]

      // Track if any ramp has a fishing net
      let hasPowerUp = false;

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          const fishYPosition = (j !== entryLane && j !== secondRampLane) ? 0 : (i === 0 ? RAMP_LENGTH / 4 : RAMP_LENGTH / 2);

          // Skip both ramp lanes and add obstacles only in the remaining lane
          if (j !== entryLane && j !== secondRampLane) {
            if (longObstaclesPositions.some(pos => pos.i === i - 1 && pos.j === j)) continue;
            const obstacleType = getRandomObstacleType(obstacleTypes);
            obstacles.push({
              position: [x, 0, z] as [number, number, number],
              type: obstacleType,
            });

            if (obstacleType === "sleigh" || obstacleType === "reindeer") {
              longObstaclesPositions.push({ i, j });
            }
          } else {
            if (i === length - 1 && ((i === entryLane && firstRampHasObstacle) || (i === secondRampLane && secondRampHasSmallObstacle))) {
              continue;
            }

            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 1) {
              let fishingNetChance = 0.3;

              // If this is the start of a ramp with an obstacle, increase chance to 20%
              if (i === 0) {
                if ((j === entryLane && firstRampHasObstacle) || (j === secondRampLane && secondRampHasSmallObstacle)) {
                  fishingNetChance = 0.3;
                }
              }

              const shouldPlaceFishingNet = !hasPowerUp && Math.random() < fishingNetChance;
              if (shouldPlaceFishingNet) {
                obstacles.push({
                  position: [x, fishYPosition, z] as [number, number, number],
                  type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                });
                hasPowerUp = true;
              } else {
                // If no fishing net, can place fish
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, fishYPosition, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions 
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, fishYPosition, z] as [number, number, number],
                  type: "fish",
                });
              }
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
            hasSmallObstacle: firstRampHasSmallObstacle,
            hasBigObstacle: firstRampHasBigObstacle,
          },
        },
        {
          position: [lanes[secondRampLane], 0, 0] as [number, number, number],
          type: "ramp",
          rampConfig: {
            hasSmallObstacle: secondRampHasSmallObstacle,
            hasBigObstacle: false,
          },
        },
      ];
    },
  },
  {
    name: "turns_only",
    length: 4,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: true,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];

      const obstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "tree", chance: 0.2 },
        { type: "lamp-winter", chance: 0.25 },
        { type: "lamp", chance: 0.2 },
        { type: "snow-shovel", chance: 0.05 },
        { type: "information-plate", chance: 0.15 },
        { type: "winter-information-plate", chance: 0.15 },
      ] : [
        { type: "big-tree", chance: 0.6 },
        { type: "snowman", chance: 0.2 },
        { type: "cane", chance: 0.05 },
        { type: "lamp-winter", chance: 0.05 },
        { type: "reindeer", chance: 0.05 },
        { type: "information-plate", chance: 0.05 },
      ]

      // Determine additional entry lane based on difficulty
      let additionalEntryLane: laneType | null = null;
      if (difficulty === "easy" || difficulty === "medium") {
        // For easy and medium, add an additional entry lane
        if (entryLane === 0) {
          additionalEntryLane = 1; // If left lane is entry, add middle as additional
        } else if (entryLane === 2) {
          additionalEntryLane = 1; // If right lane is entry, add middle as additional
        } else {
          additionalEntryLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
        }
      }

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (!isEntryLane) {
            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              const obstacleType = getRandomObstacleType(obstacleTypes)
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: obstacleType,
              })

              // const random = noise2D(j + i, entropy);
              // if (random < 0.4) {
              //   obstacles.push({
              //     position: [x, 0, z] as [number, number, number],
              //     type: "tree",
              //   });
              // } else {
              //   obstacles.push({
              //     position: [x, 0, z] as [number, number, number],
              //     type: "hydrant",
              //   });
              // }
              // } else if (random < 0.7) {
              //   obstacles.push({
              //     position: [x, 0, z] as [number, number, number],
              //     type: "snowman",
              //   });
              // } else if (random < 0.9) {
              //   obstacles.push({
              //     position: [x, 0, z] as [number, number, number],
              //     type: "bonfire",
              //   });
              // } else {
              //   obstacles.push({
              //     position: [x, 0, z] as [number, number, number],
              //     type: "winter-well",
              //   });
              // }
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
                // If no fishing net, can place fish with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions with 70% chance
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            }
          }
        }
      }
      return obstacles;
    },
  },
  {
    name: "forest",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: false,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const longObstaclesPositions: { i: number; j: number }[] = []; // Track positions where cars are spawned

      const obstacleTypes: IObstacleTypeWithChance[] = [
        { type: "tree", chance: 0.55 },
        { type: "low-rock", chance: 0.1 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.1 },
        { type: "reindeer", chance: 0.05 },
        { type: "sleigh", chance: 0.05 },
        { type: "sled", chance: 0.05 },
      ]

      // Determine additional entry lane based on difficulty
      let additionalEntryLane: laneType | null = null;
      if (difficulty === "easy" || difficulty === "medium") {
        // For easy and medium, add an additional entry lane
        if (entryLane === 0) {
          additionalEntryLane = 1; // If left lane is entry, add middle as additional
        } else if (entryLane === 2) {
          additionalEntryLane = 1; // If right lane is entry, add middle as additional
        } else {
          additionalEntryLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
        }
      }

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (!isEntryLane) {
            // Skip if this position is after a car
            if (longObstaclesPositions.some(pos => pos.i === i - 1 && pos.j === j)) continue;

            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              // const random = Math.random();
              const obstacleType = getRandomObstacleType(obstacleTypes)
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: obstacleType,
              });
              if (obstacleType === "sleigh" || obstacleType === "reindeer") {
                longObstaclesPositions.push({ i, j });
              }
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
                // If no fishing net, can place fish with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions with 70% chance
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            }
          }
        }
      }

      return difficulty === 'hard' && Math.random() < 0.2 ? [
        ...obstacles,
        {
          position: [lanes[entryLane], 0, (length - 3) * obstacleSpacing] as [number, number, number],
          type: "fence",
        }
      ] : obstacles;
    },
  },
  {
    name: "fence_at_the_end",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: true,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const CLOSER_OFFSET = 1; // How much closer to move obstacles to the fence

      const longObstaclesPositions: { i: number; j: number }[] = [];

      const obstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "tree", chance: 0.1 },
        { type: "low-rock", chance: 0.1 },
        { type: "dumpster", chance: 0.05 },
        { type: "lamp-winter", chance: 0.15 },
        { type: "lamp", chance: 0.15 },
        { type: "sleigh", chance: 0.1 },
        { type: "car", chance: 0.05 },
        { type: "snow-shovel", chance: 0.05 },
        { type: "gift", chance: 0.1 },
        { type: "information-plate", chance: 0.15 },
        { type: "winter-information-plate", chance: 0.1 },
      ] : [
        { type: "tree", chance: 0.43 },
        { type: "low-rock", chance: 0.05 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.05 },
        { type: "cane", chance: 0.05 },
        { type: "winter-well", chance: 0.05 },
        { type: "dumpster", chance: 0.04 },
        { type: "lamp-winter", chance: 0.03 },
        { type: "sleigh", chance: 0.03 },
        { type: "sled", chance: 0.03 },
        { type: "snow-shovel", chance: 0.02 },
        { type: "gift", chance: 0.02 },
      ]

      const nextToFenceObstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "big-tree", chance: 0.5 },
        { type: "lamp-winter", chance: 0.18 },
        { type: "lamp", chance: 0.2 },
        { type: "winter-information-plate", chance: 0.15 },
        { type: "information-plate", chance: 0.15 },
      ] : [
        { type: "big-tree", chance: 0.5 },
        { type: "snowman", chance: 0.3 },
        { type: "lamp-winter", chance: 0.18 },
        { type: "information-plate", chance: 0.02 },
      ]

      // Determine additional entry lane based on difficulty
      let additionalEntryLane: laneType | null = null;
      if (difficulty === "easy" || difficulty === "medium") {
        // For easy and medium, add an additional entry lane
        if (entryLane === 0) {
          additionalEntryLane = 1; // If left lane is entry, add middle as additional
        } else if (entryLane === 2) {
          additionalEntryLane = 1; // If right lane is entry, add middle as additional
        } else {
          additionalEntryLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
        }
      }

      // Add fence at length - 2 in entry lane
      obstacles.push({
        position: [lanes[entryLane], 0, (length - 2) * obstacleSpacing] as [number, number, number],
        type: "fence",
      });

      // Determine which lanes to use based on fence position
      let availableLanes: { lane: number, offset: number }[];
      if (entryLane === 0) { // Fence on left
        availableLanes = [{ lane: lanes[1], offset: -CLOSER_OFFSET }]; // Move middle obstacle left
      } else if (entryLane === 2) { // Fence on right
        availableLanes = [{ lane: lanes[1], offset: CLOSER_OFFSET }]; // Move middle obstacle right
      } else { // Fence in middle
        availableLanes = [
          { lane: lanes[0], offset: CLOSER_OFFSET }, // Move left obstacle right
          { lane: lanes[2], offset: -CLOSER_OFFSET } // Move right obstacle left
        ];
      }

      // Add obstacles to available lanes with offset
      for (const { lane, offset } of availableLanes) {
        // For easy difficulty, reduce obstacle spawn chance by 50%

        if (longObstaclesPositions.some(pos => pos.i === length - 2 && pos.j === lane + offset)) continue;

        const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
        if (shouldSpawnObstacle) {
          const obstacleType = getRandomObstacleType(nextToFenceObstacleTypes);
          obstacles.push({
            position: [lane + offset, 0, (length - 2) * obstacleSpacing] as [number, number, number],
            type: obstacleType,
          });

          if (obstacleType === "sleigh" || obstacleType === "reindeer") {
            longObstaclesPositions.push({ i: length - 2, j: lane + offset });
          }
        }
      }

      // Add fish, fishing-net, and multiplier to empty spots
      for (let i = 0; i < length - 2; i++) { // Don't add to last two positions
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          // Skip positions with existing obstacles
          if (!obstacles.some(obs => obs.position[0] === x && obs.position[2] === z)) {
            if (isEntryLane) {
              // Check for fishing net placement at start or end
              if (i === 0 || i === length - 3) {
                const hasPowerUp = Math.random() < 0.2;
                if (hasPowerUp) {
                  // If placing at start, don't place at end
                  if (i === 0) {
                    obstacles.push({
                      position: [x, 0, z] as [number, number, number],
                      type: Math.random() < 0.5 ? "fishing-net" : "fish-multiplier",
                    });
                  } else if (i === length - 3) {
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
                  // If no fishing net, can place fish with 70% chance
                  if (Math.random() < 0.7) {
                    obstacles.push({
                      position: [x, 0, z] as [number, number, number],
                      type: "fish",
                    });
                  }
                }
              } else {
                // Regular fish placement for non-start/end positions with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // For easy difficulty, reduce obstacle spawn chance by 50%
              const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
              if (shouldSpawnObstacle) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: getRandomObstacleType(obstacleTypes)
                });
              }
            }
          }
        }
      }

      return obstacles;
    },
  },
  {
    name: "big_obstacle_at_the_end",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: true,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard",
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];

      const obstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "tree", chance: 0.1 },
        { type: "low-rock", chance: 0.1 },
        { type: "dumpster", chance: 0.05 },
        { type: "lamp-winter", chance: 0.15 },
        { type: "lamp", chance: 0.15 },
        { type: "sleigh", chance: 0.1 },
        { type: "car", chance: 0.05 },
        { type: "snow-shovel", chance: 0.05 },
        { type: "gift", chance: 0.1 },
        { type: "information-plate", chance: 0.15 },
        { type: "winter-information-plate", chance: 0.1 },
      ] : [
        { type: "tree", chance: 0.43 },
        { type: "low-rock", chance: 0.05 },
        { type: "snowman", chance: 0.1 },
        { type: "bonfire", chance: 0.05 },
        { type: "cane", chance: 0.05 },
        { type: "winter-well", chance: 0.05 },
        { type: "dumpster", chance: 0.04 },
        { type: "lamp-winter", chance: 0.03 },
        { type: "sleigh", chance: 0.03 },
        { type: "sled", chance: 0.03 },
        { type: "snow-shovel", chance: 0.02 },
        { type: "gift", chance: 0.02 },
      ]

      const bigObstacleTypes: IObstacleTypeWithChance[] = isRoad ? [
        { type: "big-tree", chance: 0.5 },
        { type: "lamp-winter", chance: 0.18 },
        { type: "lamp", chance: 0.2 },
        { type: "winter-information-plate", chance: 0.15 },
        { type: "information-plate", chance: 0.15 },
      ] : [
        { type: "tree", chance: 0.5 },
        { type: "snowman", chance: 0.16 },
        { type: "lamp-winter", chance: 0.02 },
        { type: "information-plate", chance: 0.02 },
        { type: "winter-well", chance: 0.15 },
        { type: "cane", chance: 0.15 },
      ]

      let escapeLane: laneType | undefined = undefined;
      // For easy and medium, add an additional entry lane
      if (entryLane === 0) {
        escapeLane = 1; // If left lane is entry, add middle as additional
      } else if (entryLane === 2) {
        escapeLane = 1; // If right lane is entry, add middle as additional
      } else {
        escapeLane = Math.random() < 0.5 ? 0 : 2; // If middle is entry, randomly add left or right
      }

      const additionalEntryLane: laneType | null = difficulty === "easy" || difficulty === "medium" ? escapeLane : null;

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (!isEntryLane) {
            if (j === escapeLane && i === length - 1 || i === length - 2) {
              continue;
            }
            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: getRandomObstacleType(obstacleTypes)
              });
            }
          } else {
            // Check for fishing net placement at start or end
            if (i === 0 || i === length - 2) {
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
                // If no fishing net, can place fish with 70% chance
                if (Math.random() < 0.7) {
                  obstacles.push({
                    position: [x, 0, z] as [number, number, number],
                    type: "fish",
                  });
                }
              }
            } else {
              // Regular fish placement for non-start/end positions with 70% chance
              if (Math.random() < 0.7) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "fish",
                });
              }
            }
          }
        }
      }

      return [
        ...obstacles,
        {
          position: [lanes[entryLane], 0.2, (length - 1) * obstacleSpacing] as [number, number, number],
          type: getRandomObstacleType(bigObstacleTypes)
        }
      ];
    },
  },
];


let previousEntryLane: laneType | null = null;
// let previousChunkType: string | null = null;

export const getObstacles = (allowedDifficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"], isRoad: boolean = false) => {
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

    let entryLaneIndex: laneType;
    if (previousEntryLane === null) {
      entryLaneIndex = Math.round(Math.random() * 2) as laneType;
    } else {
      // find index that's not too far from previousEntryLane
      do {
        entryLaneIndex = Math.round(Math.random() * 2) as laneType;
      } while (entryLaneIndex === previousEntryLane);
    }

    previousEntryLane = entryLaneIndex;

    console.log(entryLaneIndex)

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
  const [hasFishingNet] = useAtom(hasFishingNetAtom);
  const groupRef = useRef<THREE.Group & { wasHit: boolean; opacity: number; } | null>(null)
  const fishId = useMemo(() => THREE.MathUtils.generateUUID(), [])

  useFrame((state, delta) => {
    if (groupRef.current?.wasHit) {
      const z = delta * 3
      const y = delta * 2

      groupRef.current.position.z += z
      groupRef.current.position.y -= y
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
          if (!hasFishingNet) return;
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

const getRandomObstacleType = (obstacleTypes: IObstacleTypeWithChance[]) => {
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
