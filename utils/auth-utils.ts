import { apiUserAtom } from "@/atoms";
import { User, UserUpgrade } from "@/prisma/generated";
import axios, { AxiosError } from 'axios';
import { useAtomValue, useSetAtom } from "jotai";

export type UserWithUpgrades = User & { userUpgrades: UserUpgrade[], leaderboardPosition: number };

export type UpgradeLevel = {
    level: number,
    upgradePrice?: number,
    value: number
}

export const emptyUser = {
    id: 0,
    wallet: "",
    highestScore: 0,
    fishes: 0,
    userUpgrades: [],
    leaderboardPosition: -1
}

export const apiClient = axios.create({
    baseURL: 'api/'
});

apiClient.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('apiToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const convertBigIntsToStrings = (obj: any): any => {
    if (typeof obj === 'bigint') {
        return obj.toString();
    } else if (Array.isArray(obj)) {
        return obj.map(convertBigIntsToStrings);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertBigIntsToStrings(value)])
        );
    }
    return obj;
}