// src/atoms.ts
import { atom } from "jotai";
import { useRef } from "react";

export type GameState = "playing" | "game-over" | "in-menu";
export type VideoSettings = {
    antialiasing: boolean;
    shadows: boolean;
    dpr: number;
}

// Define the atom with a type
export const gameStateAtom = atom<GameState>(
    process.env.NODE_ENV === "development" ? "playing" : "in-menu",
);

export const videoSettingsAtom = atom<VideoSettings>({
    antialiasing: true,
    dpr: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    shadows: true,
});

export const currentFishesAtom = atom<number>(0);
export const scoreAtom = atom<number>(0);
export const hasFishingNetAtom = atom<boolean>(false);