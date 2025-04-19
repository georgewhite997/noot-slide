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
import { hasFishingNetAtom, scoreAtom } from "@/atoms";

const RAMP_LENGTH = 2.5;
const RAMP_WIDTH = 3;
const RUNWAY_LENGTH = 8;
const RAMP_SLOPE = -0.9;

const chunks: IChunk[] = [
  // {
  //   name: "lying_tree",
  //   length: 5,
  //   obstacleSpacing: 2,
  //   possibleDifficulties: ["easy"],
  //   get: (
  //     { length, obstacleSpacing }: IChunk,
  //     entryLane: laneType,
  //     entropy: number,
  //     difficulty: "easy" | "medium" | "hard"
  //   ) => {
  //     const obstacles: IObstacle[] = [];

  //     // Add the lying tree at the end of the chunk
  //     obstacles.push({
  //       position: [0, 0, (length - 1) * obstacleSpacing] as [number, number, number],
  //       type: "lying-tree-long",
  //     });

  //     // Add 2-3 random obstacles (tree, low-rock, or snowman)
  //     const numObstacles = Math.floor(Math.random() * 2) + 1; // 2 or 3 obstacles
  //     const obstacleTypes = ["tree", "low-rock", "snowman", "bonfire"];

  //     for (let i = 0; i < numObstacles; i++) {
  //       // Find a valid position (not on entry lane, not on last two positions)
  //       let validPosition = false;
  //       let x: number = 0;
  //       let z: number = 0;

  //       while (!validPosition) {
  //         x = lanes[Math.floor(Math.random() * lanes.length)];
  //         z = Math.floor(Math.random() * (length - 2)) * obstacleSpacing;

  //         // Check if position is valid (not on entry lane and not on last two positions)
  //         if (x !== lanes[entryLane] && z < (length - 2) * obstacleSpacing && z > 0 * obstacleSpacing) {
  //           // Check if position is not already occupied
  //           const isOccupied = obstacles.some(obs =>
  //             obs.position[0] === x && obs.position[2] === z
  //           );
  //           if (!isOccupied) {
  //             validPosition = true;
  //           }
  //         }
  //       }

  //       // Add the random obstacle
  //       obstacles.push({
  //         position: [x, 0, z] as [number, number, number],
  //         type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as "tree" | "low-rock" | "snowman",
  //       });
  //     }

  //     // Add fish, fishing-net, and multiplier to empty spots
  //     for (let i = 0; i < length - 2; i++) { // Don't add to last two positions
  //       for (let j = 0; j < lanes.length; j++) {
  //         const x = lanes[j];
  //         const z = i * obstacleSpacing;

  //         // Skip entry lane and positions with existing obstacles
  //         if (x !== lanes[entryLane] && !obstacles.some(obs =>
  //           obs.position[0] === x && obs.position[2] === z
  //         )) {
  //           const random = Math.random();
  //           if (random < 0.1) { // 10% chance for fishing net
  //             obstacles.push({
  //               position: [x, 0, z] as [number, number, number],
  //               type: "fishing-net",
  //             });
  //           } else if (random < 0.2) { // 10% chance for fish multiplier
  //             obstacles.push({
  //               position: [x, 0, z] as [number, number, number],
  //               type: "fish-multiplier",
  //             });
  //           } else if (random < 0.6) { // 40% chance for fish
  //             obstacles.push({
  //               position: [x, 0, z] as [number, number, number],
  //               type: "fish",
  //             });
  //           }
  //         }
  //       }
  //     }

  //     return obstacles;
  //   },
  // },
  {
    name: "lying_tree",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const obstacles: IObstacle[] = [];

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

      const obstacleTypes = ["tree", "low-rock", "snowman", "bonfire"];

      for (let i = 0; i < length; i++) {
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip both entry lanes if they exist
          const isEntryLane = j === entryLane || (additionalEntryLane !== null && j === additionalEntryLane);

          if (!isEntryLane && i !== length - 1) {
            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as "tree" | "low-rock" | "snowman"
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
          type: "lying-tree-long",
        }
      ];
    },
  },
  {
    name: "one_ramp",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const obstacles: IObstacle[] = [];
      const hasObstacle = difficulty !== "easy" ? Math.random() < 0.7 : Math.random() < 0.5;
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
            (!hasSnowman || i < length - 2 || !isOnEmptySide)
          ) {
            // For easy difficulty, reduce obstacle spawn chance by 50%
            const shouldSpawnObstacle = difficulty === "easy" ? Math.random() < 0.5 : true;
            if (shouldSpawnObstacle) {
              const random = noise2D(j + i, entropy);
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type:
                  random < -0.3 ? "tree" : random < 0.3 ? "snowman" : random < 0.6 ? "bonfire" : "low-rock",
              });
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
                      position: [x, fishYPosition, z] as [number, number, number],
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
    possibleDifficulties: ["medium", "hard"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
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
                random < -0.3 ? "tree" : random < 0.3 ? "snowman" : random < 0.6 ? "bonfire" : "low-rock",
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
    possibleDifficulties: ["easy", "medium", "hard"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const obstacles: IObstacle[] = [];

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
              const random = noise2D(j + i, entropy);
              if (random < 0.4) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "tree",
                });
              } else if (random < 0.8) {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "snowman",
                });
              } else {
                obstacles.push({
                  position: [x, 0, z] as [number, number, number],
                  type: "bonfire",
                });
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
      return obstacles;
    },
  },
  {
    name: "forest",
    length: 4,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const obstacles: IObstacle[] = [];

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
    name: "fence_chunk",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy"],
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: laneType,
      entropy: number,
      difficulty: "easy" | "medium" | "hard"
    ) => {
      const obstacles: IObstacle[] = [];
      const CLOSER_OFFSET = 1; // How much closer to move obstacles to the fence

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

      const obstacleTypes = ["big-tree", "snowman"];

      // Add obstacles to available lanes with offset
      for (const { lane, offset } of availableLanes) {
        obstacles.push({
          position: [lane + offset, 0, (length - 2) * obstacleSpacing] as [number, number, number],
          type: obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)] as "big-tree" | "snowman",
        });
      }

      // Add fish, fishing-net, and multiplier to empty spots
      for (let i = 0; i < length - 2; i++) { // Don't add to last two positions
        for (let j = 0; j < lanes.length; j++) {
          const x = lanes[j];
          const z = i * obstacleSpacing;

          // Skip entry lane and positions with existing obstacles
          if (x !== lanes[entryLane] && !obstacles.some(obs =>
            obs.position[0] === x && obs.position[2] === z
          )) {
            const random = Math.random();
            if (random < 0.1) { // 10% chance for fishing net
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "fishing-net",
              });
            } else if (random < 0.2) { // 10% chance for fish multiplier
              obstacles.push({
                position: [x, 0, z] as [number, number, number],
                type: "fish-multiplier",
              });
            } else if (random < 0.6) { // 40% chance for fish
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

export const getObstacles = (allowedDifficulties: ("easy" | "medium" | "hard")[] = ["easy", "medium", "hard"]) => {
  const obstacles: IObstacle[][] = [];
  const initialZoffset = -SEGMENT_LENGTH / 2 + 0.25;
  const endOfSegment = SEGMENT_LENGTH / 2;
  let zOffset = initialZoffset;
  const interchunkSpacing = 4;
  let i = 0;

  while (true) {
    // Filter chunks based on allowed difficulties
    const availableChunks = chunks.filter(chunk =>
      chunk.possibleDifficulties.some(difficulty => allowedDifficulties.includes(difficulty))
    );
    let chunk = availableChunks[Math.floor(Math.random() * availableChunks.length)];

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
      } while (Math.abs(entryLaneIndex - previousEntryLane) != 1);
    }

    previousEntryLane = entryLaneIndex;

    const chunkObstacles = chunk.get(chunk, entryLaneIndex, i, selectedDifficulty);
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
  //todo: rotacja do naprawy

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
  const isStone = objectName.toLowerCase().includes('stone');
  let modelHeight = 0;
  let modelWidth = 0;
  let modelDepth = 0;

  if (isStone) {
    const box = new THREE.Box3().setFromObject(model);
    modelHeight = box.max.y - box.min.y;
    modelWidth = box.max.x - box.min.x;
    modelDepth = box.max.z - box.min.z;
  }

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
      {isStone && (
        <RigidBody
          type="fixed"
          name="obstacle-fixed"
          position={[x, z + 0.05, y + modelHeight]}
          rotation={rotation}
        >
          <mesh>
            <boxGeometry args={[modelWidth - 0.1, 0.1, modelDepth - 0.1]} />
            <meshBasicMaterial visible={false} />
          </mesh>
        </RigidBody>
      )}
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
    modelsGltf,
  }: {
    obstacle: IObstacle;
    snowColorMap: THREE.Texture;
    snowNormalMap: THREE.Texture;
    fishGltf: GLTF;
    modelsGltf: GLTF;
  }) {
    const [x, y, z] = obstacle.position;

    const rockNames = [
      // "stones_group_winter_2",
      // "stone_winter_small_5001",
      // "stone_winter_small_5002",
      "stone_winter_small_8__2_002",
      "stone_winter_small_8__5_004",
      "stone_winter_small_8__5_005",
    ];
    const randomRockObjectName = rockNames[Math.floor(Math.random() * rockNames.length)];

    switch (obstacle.type) {
      case "low-rock":

        // return <LowRock x={x} y={y} z={z} obstacle={obstacle} />;
        return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName={randomRockObjectName} gltf={modelsGltf} scale={randomRockObjectName === "stones_group_winter_2" ? 0.003 : 0.02} />
      // return <TexturedObstacle x={x} y={y} z={z} obstacle={obstacle} objectName="stones_group_winter_2" gltf={modelsGltf} scale={2} />;
      case "lying-tree-long":

        return <TexturedObstacle x={x - 2} y={y} z={z} obstacle={obstacle} objectName="fir_tree_winter_tilted_3" rotation={[0, Math.PI / 2, 0]} gltf={modelsGltf} scale={0.004} />
      case "fish":
        return <Fish x={x} y={y} z={z} gltf={fishGltf} />;
      case "fishing-net":
        return <FishingNet x={x} y={y} z={z} />;
      case "fish-multiplier":
        return <FishMultiplier x={x} y={y} z={z} />;
      case "fence":
        //country_fence
        return <TexturedObstacle x={x} y={y + 0.1} z={z} obstacle={obstacle} objectName="country_fence" gltf={modelsGltf} scale={0.006} />
      case "bonfire":
        return <TexturedObstacle x={x} y={y + 0.1} z={z} obstacle={obstacle} objectName="bonfire" gltf={modelsGltf} scale={0.015} />
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
              // <LowRock
              //   x={x}
              //   y={y + RAMP_LENGTH / 2}
              //   z={z + RUNWAY_LENGTH}
              //   obstacle={obstacle}
              // />

              <TexturedObstacle x={x} y={y + RAMP_LENGTH / 2} z={z + RUNWAY_LENGTH} obstacle={obstacle} objectName={randomRockObjectName} gltf={modelsGltf} scale={0.003} />
            )}

            {hasSnowman && (
              // <Snowman
              //   x={x}
              //   y={y + RAMP_LENGTH / 2}
              //   z={z + RUNWAY_LENGTH}
              //   snowColorMap={snowColorMap}
              //   snowNormalMap={snowNormalMap}
              // />
              <TexturedObstacle x={x} y={y + RAMP_LENGTH / 2} z={z + RUNWAY_LENGTH} obstacle={obstacle} objectName="snowman" gltf={modelsGltf} scale={0.015} rotation={[Math.PI / 2, 0, 0]} />
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
