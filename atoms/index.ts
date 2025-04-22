// src/atoms.ts
import { atom } from "jotai";

import { SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { Account } from "viem";

export type GameState = "playing" | "game-over" | "in-menu";
export type VideoSettings = {
    antialiasing: boolean;
    shadows: boolean;
    dpr: number;
}

// Define the atom with a type
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
export const haloQuantityAtom = atom<number>(0);
export const speedyStartQuantityAtom = atom<number>(0);
export const hasSlowSkisAtom = atom<boolean>(false);
export const hasLuckyCharmAtom = atom<boolean>(false);
export const abstractSessionAtom = atom<SessionData | null>(null);