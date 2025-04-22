export const lanes = [-3.5, 0, 3.5]; // X positions for left, middle, right lanes
export const TRACK_MARK_DEPTH = 0.1;
export const TRACK_MARK_WIDTH = 0.2;
export const TRACK_MARK_SPACING = 0.25;
export const TRACK_MARK_LENGTH = 0.02;

export const SEGMENT_LENGTH = 100;
export const SEGMENT_WIDTH = 10;
export const SEGMENT_COUNT = 2;
export const BASE_RESOLUTION = 75;
export const SEGMENT_RESOLUTION = [BASE_RESOLUTION, BASE_RESOLUTION * 3];

export const SLOPE_ANGLE = -0.2;

export type IObstacleType =
    "low-rock" | 
    "tree" | 
    "snowman" | 
    "ramp" | 
    "lying-tree-long" | 
    "fish" | 
    "fishing-net" | 
    "fish-multiplier" | 
    "fence" | 
    "bonfire" | 
    "big-tree" | 
    'car' | 
    'winter-information-plate' | 
    'information-plate' | 
    'winter-well' | 
    'gift' | 
    'tree-trunk-winter' | 
    'hydrant' |
    'reindeer' | 
    'sleigh' |
    'cane' |
    'lamp' | 
    'lamp-winter' | 
    'dumpster' | 
    'sled' | 
    'snow-shovel' | 
    'ski-flag';

export interface IObstacle {
    position: [number, number, number];
    type: IObstacleType;
    rampConfig?: {
        hasRock?: boolean;
        hasSnowman?: boolean;
    };
}

export interface ISegment {
    zOffset: number;
    yOffset: number;
    index: number;
    chunks: { obstacles: IObstacle[], name: string }[];
}

export type laneType = 0 | 1 | 2;

export interface IChunk {
    name: string;
    length: number;
    obstacleSpacing: number;
    possibleDifficulties: ("easy" | "medium" | "hard")[];
    get: (chunk: IChunk, entryLane: laneType, entropy: number, difficulty: "easy" | "medium" | "hard") => IObstacle[];
}