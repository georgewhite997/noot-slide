// src/atoms.ts
import { atom } from "jotai";

import { SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { Account } from "viem";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap } from "@react-three/fiber";
import * as THREE from "three";
import { IUserItem } from "@/utils";
import { Upgrade, User, UserUpgrade } from '@/prisma-client'
import { emptyUser, UserWithUpgrades } from "@/utils/auth-utils";
import { IChunk } from "@/components/shared";

export type GameState = "playing" | "game-over" | "in-menu" | "reviving" | 'choosing-power-ups'

export type SettingsType = {
    antialiasing: boolean;
    shadows: boolean;
    dpr: number;
    music: boolean;
    sounds: boolean;
    enabledPostProcessing: boolean;
}

export const gameStateAtom = atom<GameState>(
    // "in-menu",
    process.env.NODE_ENV === "development" ? "playing" : "in-menu",
);

export const settingsAtom = atom<SettingsType>({
    antialiasing: true,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    shadows: true,
    music: true,
    sounds: true,
    enabledPostProcessing: true,
});

export type SessionData = {
    session: SessionConfig;
    sessionSigner: Account;
} | null;

export type GLTFAtomType = (GLTF & ObjectMap) | null

export const itemsAtom = atom<IUserItem[]>([]);
export const currentFishesAtom = atom<number>(0);
export const scoreAtom = atom<number>(0);
export const magnetCollectedAtAtom = atom<number>(0);
export const magnetDurationAtom = atom<number>(0);
export const multiplierCollectedAtAtom = atom<number>(0);
export const multiplierDurationAtom = atom<number>(0);
export const haloQuantityAtom = atom<number>(0);
export const speedyStartQuantityAtom = atom<number>(0);
export const hasSlowSkisAtom = atom<boolean>(false);
export const hasLuckyCharmAtom = atom<boolean>(false);
export const abstractSessionAtom = atom<SessionData | null>(null);
export const reviveCountAtom = atom<number>(0);
export const modelsGltfAtom = atom<GLTFAtomType>(null);
export const storeAssetsGltfAtom = atom<GLTFAtomType>(null);
export const fishMeshesAtom = atom<Record<string, THREE.Mesh>>({});
export const isGamePausedAtom = atom<boolean>(false);
export const apiUserAtom = atom<UserWithUpgrades>(emptyUser);
export const upgradesAtom = atom<Upgrade[] | undefined>(undefined);
export const selectedObstacleAtom = atom<string>('chunk-0-segment-0-0');
export const segmentLengthsAtom = atom<number[][]>([]);
export const customMapAtom = atom<IChunk[]>([])