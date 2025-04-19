import { createPublicClient, defineChain, http, PublicClient } from "viem";
import { abstract, abstractTestnet } from "viem/chains";
import { useEffect, useState } from "react";
import { eip712WalletActions } from "viem/zksync";
import Registry from "../artifacts-zk/contracts/Registry.sol/Registry.json";
import { createNoise2D } from "simplex-noise";

const dockerizedNode = defineChain({
  id: 270,
  name: "Localhost",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:3050"] },
  },
});

export const chain = abstractTestnet; //abstract; // Change to abstractTestnet or dockerizedNode if needed

export type SupportedChain = typeof chain;

export function usePublicClient(): PublicClient | null {
  const [publicClient, setPublicClient] = useState(null);

  useEffect(() => {
    const client = createPublicClient({
      chain,
      transport: http(),
    }).extend(eip712WalletActions());

    // @ts-ignore
    setPublicClient(client);
  }, []);

  return publicClient;
}

export const abi = [...Registry.abi] as const;
export const contractAddress = (Registry as any).address as `0x${string}`;

// MADE BY GROK
// function to generate snow on the ground
const _baseAmplitude = 0.2; // Overall height scale (adjust for taller/shorter terrain)
const _baseFrequency = 0.15; // Base frequency for large-scale features (lower = larger hills)
const octaves = 4; // Number of noise layers (more = more detail)
const persistence = 0.5; // How much each octave contributes (lower = less influence for higher frequencies)
const lacunarity = 2.0;

export const noise2D = createNoise2D(() => 0.5);

export const getSnowBumps = (
  x: number,
  y: number,
  baseAmplitude = _baseAmplitude,
  baseFrequency = _baseFrequency,
) => {
  let z = 0;
  let amplitude = baseAmplitude;
  let frequency = baseFrequency;

  // Layer multiple octaves of noise
  for (let i = 0; i < octaves; i++) {
    // Generate noise value at this scale
    const noiseValue = noise2D(x * frequency, y * frequency);
    z += noiseValue * amplitude;

    // Adjust amplitude and frequency for the next octave
    amplitude *= persistence; // Reduce amplitude for finer details
    frequency *= lacunarity; // Increase frequency for finer details
  }

  return z;
};

export interface IPowerUp {
  id: number;
  name: string;
  description: string;
  type: "permanent" | "one-time";
  price: number;
}

export const powerups: IPowerUp[] = [
  {
    id: 1,
    name: "Slow Skis",
    description: "Decreases the speed of the entire game by 15%.",
    type: "permanent",
    price: 0.01,
  },
  {
    id: 2,
    name: "Lucky charm",
    description: "Increases the amount of in-game pickups.",
    type: "permanent",
    price: 0.01,
  },
  {
    id: 3,
    name: "Abstract Halo",
    description: "Grants extra life on your first crash.",
    type: "one-time",
    price: 0.01,
  },
  {
    id: 4,
    name: "Speedy start",
    description: "Grants 1,000 distance points to your score from the start.",
    type: "one-time",
    price: 0.01,
  },
];


