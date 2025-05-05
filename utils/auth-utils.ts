import { User, UserUpgrade } from "@/prisma/generated";
import axios, { AxiosError } from 'axios';
import { useAtomValue } from "jotai";

export type UserWithUpgrades = User & { userUpgrades: UserUpgrade[] };

export type UpgradeLevel = {
    level: number,
    upgradePrice?: number,
    value: number
}

export const apiClient = axios.create({
    baseURL: 'api/'
});

apiClient.interceptors.request.use(async (config) => {
    const token = sessionStorage.getItem('apiToken')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});