import { createPublicClient, defineChain, formatEther, http, PublicClient } from "viem";
import { abstract, abstractTestnet } from "viem/chains";
import { useEffect, useState } from "react";
import { eip712WalletActions } from "viem/zksync";
import Registry from "../artifacts-zk/contracts/Registry.sol/Registry.json";
import Powerups from "../artifacts-zk/contracts/Powerups.sol/Powerups.json";
// import Skins from "../artifacts-zk/contracts/Skins.sol/Skins.json";
import registryAddress from "../addresses/Registry.json";
import powerupsAddress from "../addresses/Powerups.json";
// import { address as SkinsAddress } from "../addresses/Skins.json";
import { createNoise2D } from "simplex-noise";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap } from "@react-three/fiber";
import * as THREE from 'three'


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

export const truncateEther = (value: bigint) => {
  const formatted = formatEther(value);
  const [integer, decimal] = formatted.split('.');
  if (decimal?.length > 4) {
    return `${integer}.${decimal.slice(0, 4)}`;
  }
  return formatted;
};

export const chain = abstractTestnet; //abstract; /
export const nootTreasury = '0x1Ed3aB46773Dd5789eC5553A7D4b4E2f34d7c7c6'

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

export const registryAbi = [...Registry.abi] as const;
export const registryContractAddress = registryAddress.address as `0x${string}`;

export const powerupsAbi = [...Powerups.abi] as const;
export const powerupsContractAddress = powerupsAddress.address as `0x${string}`;

// export const skinsAbi = [...Skins.abi] as const;
// export const skinsContractAddress = skinsAddress as `0x${string}`;

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

export function getModel(name: string, scale: number, modelsGltf: GLTF & ObjectMap | null) {
  if (!modelsGltf?.scene) {
    console.log("Error getting model for", name)
    return new THREE.Object3D()
  }
  const object = modelsGltf.scene.getObjectByName(name);

  if (!object) {
    console.log("Missing object", name)
    return new THREE.Object3D()
  }

  // Reset position of all meshes in the tree
  object.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      child.position.set(0, 0, 0);
      child.updateMatrix();
    }
  });

  object.scale.set(scale, scale, scale);
  return object;
}

export interface IItem {
  id: number;
  name: string;
  description: string;
  type: "permanent" | "one-time";
  price: number;
  iconPath: string,
}

export type IUserItem = IItem & { quantity: number; isDisabled: boolean }

export const items: IItem[] = [
  {
    id: 1,
    name: "Slow Skis",
    description: "Decreases the speed of the entire game by 15%.",
    type: "permanent",
    price: 0.0022,
    iconPath: '/slow-skis-icon.png',
  },
  {
    id: 2,
    name: "Lucky charm",
    description: "Increases the amount of in-game pickups.",
    type: "permanent",
    price: 0.0022,
    iconPath: '/lucky-charm-icon.png',
  },
  {
    id: 3,
    name: "Abstract Halo",
    description: "Grants extra life on your first crash.",
    type: "one-time",
    price: 0.0005,
    iconPath: '/abstract-halo-icon.png',
  },
  {
    id: 4,
    name: "Speedy start",
    description: "Grants 1,000 distance points to your score from the start.",
    type: "one-time",
    price: 0.0005,
    iconPath: '/speedy-start-icon.png',
  },
];


export const hasPowerup = (collectedAt: number, duration: number) => {
  return Date.now() < collectedAt + duration;
}

export const getRemainingTime = (collectedAt: number, duration: number) => {
  return Math.ceil((collectedAt + duration - Date.now()) / 1000);
}

export const MAX_MOBILE_WIDTH = 402;
export const MAX_MOBILE_HEIGHT = 874;

