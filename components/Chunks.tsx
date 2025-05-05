import { getRandomObstacleType, RAMP_LENGTH } from "./Obstacles";
import { DifficultyMode, IChunk, IObstacle, IObstacleTypeWithChance, lanes, LaneType } from "./shared";

const calculateEscapeLane = (
  entryLane: LaneType
): LaneType | null => {
  if (entryLane === 0)
    return 1;

  if (entryLane === 2)
    return 1;

  return Math.random() < 0.5 ? 0 : 2;
}

const calculateAdditionalLane = (
  entryLane: LaneType,
  difficulty: DifficultyMode
): LaneType | null => {
  if (difficulty === "hard")
    return null;

  return calculateEscapeLane(entryLane);
}

const spawnFishOrPowerUp = (
  i: number,
  j: number,
  entryLane: LaneType,
  length: number,
  x: number, 
  z: number,
  obstacles: IObstacle[],
  difficulty: DifficultyMode,
  fishYPosition?: number,
) => {
  const calculateYPosition = () => {
    if (fishYPosition)
      return j === entryLane ? fishYPosition : 0;

    return 0;
  }

  const calculateFishChange = () => {
    if (difficulty === "hard")
      return 0.7;
    if (difficulty === "medium")
      return 0.5;

    return 0.3;
  }

  const atBoundary = i === 0 || i === length - 1;
  if (atBoundary) {
    // 20% chance for a power-up at the very first or last row
    if (Math.random() < 0.2) {
      const type = Math.random() < 0.5
        ? "fishing-net"
        : "fish-multiplier";

      if (i === 0) {
        // always place at start
        obstacles.push({ position: [x, calculateYPosition(), z], type });
      } else {
        // only place at end if none was placed at start
        const startHasPowerUp = obstacles.some(obs =>
          (obs.type === "fishing-net" || obs.type === "fish-multiplier")
          && obs.position[2] === 0
        );
        if (!startHasPowerUp) {
          obstacles.push({ position: [x, calculateYPosition(), z], type });
        }
      }
    } else {
      // no power-up → 70% chance to spawn a fish
      if (Math.random() < calculateFishChange()) {
        obstacles.push({ position: [x, calculateYPosition(), z], type: "fish" });
      }
    }
  } else {
    // non-boundary rows: 70% chance to spawn a fish
    if (Math.random() < calculateFishChange()) {
      obstacles.push({ position: [x, calculateYPosition(), z], type: "fish" });
    }
  }
}

export const chunks: IChunk[] = [
  {
    name: "lying_tree",
    length: 5,
    obstacleSpacing: 2,
    possibleDifficulties: ["easy", "medium", "hard"],
    canBeRoad: true,
    get: (
      { length, obstacleSpacing }: IChunk,
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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

      let additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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
            spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty);
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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

      let additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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

            const fishYPosition = i === 0 ? RAMP_LENGTH / 4 : RAMP_LENGTH / 2;
            spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty, fishYPosition);
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
      isRoad: boolean = false
    ) => {
      const obstacles: IObstacle[] = [];
      const longObstaclesPositions: { i: number; j: number }[] = [];
      // Determine the second ramp lane (must be different from entry lane)
      let secondRampLane: LaneType;
      do {
        secondRampLane = Math.round(Math.random() * 2) as LaneType;
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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
      let additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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
            }
          } else {
            spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty);
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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

      let additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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
            spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty);
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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

      let additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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
              spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty);
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
      entryLane: LaneType,
      entropy: number,
      difficulty: DifficultyMode,
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

      const escapeLane = calculateEscapeLane(entryLane);
      const additionalEntryLane = calculateAdditionalLane(entryLane, difficulty);

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
            spawnFishOrPowerUp(i, j, entryLane, length, x, z, obstacles, difficulty);
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