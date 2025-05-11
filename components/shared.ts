import { possibleObstacles } from "../utils/index"

export const lanes = [-3, 0, 3]; // X positions for left, middle, right lanes
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

export type IObstacleType = "ramp" | "obstacle" | "reward"

export interface IObstacle {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    name: typeof possibleObstacles[number];
    type: IObstacleType;
    rampConfig?: {
        hasSmallObstacle?: boolean;
        hasBigObstacle?: boolean;
    };
}

export interface ISegment {
    zOffset: number;
    yOffset: number;
    index: number;
    // isRoad: boolean;
    chunks: { obstacles: IObstacle[], name: string }[];
    overflow: number;
}

export type LaneType = 0 | 1 | 2;
export type DifficultyMode = "easy" | "medium" | "hard";

export interface IChunk {
    length: number;
    obstacles: IObstacle[];
}

export interface IObstacleTypeWithChance {
    type: IObstacleType;
    chance: number;
}