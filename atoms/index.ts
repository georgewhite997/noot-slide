// src/atoms.ts
import { atom } from "jotai";

import { SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { Account } from "viem";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap } from "@react-three/fiber";
import * as THREE from "three";

export type GameState = "playing" | "game-over" | "in-menu" | "reviving"
export type VideoSettings = {
    antialiasing: boolean;
    shadows: boolean;
    dpr: number;
}

export const gameStateAtom = atom<GameState>(
    "in-menu",
    // process.env.NODE_ENV === "development" ? "playing" : "in-menu",
);

export const videoSettingsAtom = atom<VideoSettings>({
    antialiasing: true,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    shadows: true,
});

export type SessionData = {
    session: SessionConfig;
    sessionSigner: Account;
} | null;

export const currentFishesAtom = atom<number>(0);
export const scoreAtom = atom<number>(0);
export const hasFishingNetAtom = atom<boolean>(false);
export const hasMultiplierAtom = atom<boolean>(false);
export const haloQuantityAtom = atom<number>(0);
export const speedyStartQuantityAtom = atom<number>(0);
export const hasSlowSkisAtom = atom<boolean>(false);
export const hasLuckyCharmAtom = atom<boolean>(false);
export const abstractSessionAtom = atom<SessionData | null>(null);
export const reviveCountAtom = atom<number>(0);
export const modelsGltfAtom = atom<GLTF & ObjectMap | null>(null);
export const storeAssetsGltfAtom = atom<(GLTF & ObjectMap) | null>(null);
export const fishMeshesAtom = atom<Record<string, THREE.Mesh>>({});