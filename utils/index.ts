import { createPublicClient, defineChain, formatEther, http, PublicClient } from "viem";
import { abstract, abstractTestnet } from "viem/chains";
import { useEffect, useState } from "react";
import { eip712WalletActions } from "viem/zksync";
import { createNoise2D } from "simplex-noise";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap } from "@react-three/fiber";
import * as THREE from 'three'

import Registry from "../artifacts-zk/contracts/Registry.sol/Registry.json";
import Powerups from "../artifacts-zk/contracts/Powerups.sol/Powerups.json";
import Skins from "../artifacts-zk/contracts/Skins.sol/Skins.json";
import registryAddress from "../addresses/Registry.json";
import powerupsAddress from "../addresses/Powerups.json";
import skinsAddress from "../addresses/Skins.json";
import NootToken from "../addresses/Noot.json";

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

export interface ISkin {
  id: number;
  name: string;
  price: number;
}

export const skins: ISkin[] = [
  {
    id: 1,
    name: "Skin 1",
    price: 100,
  },
  {
    id: 2,
    name: "Skin 2",
    price: 200,
  },
  {
    id: 3,
    name: "Skin 3",
    price: 300,
  },

]

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

export const skinsAbi = [...Skins.abi] as const;
export const skinsContractAddress = skinsAddress.address as `0x${string}`;

export const nootTokenAddress = NootToken.address as `0x${string}`;

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
  return Math.ceil((collectedAt + duration - Date.now()));
}

export const MAX_MOBILE_WIDTH = 402;
export const MAX_MOBILE_HEIGHT = 874;

export const displayAddress = (address: string) => {
  if (!address) return "";

  return address.slice(2, 4) + "..." + address.slice(-3);
}

export const formatNootBalance = (n?: bigint) => {
  if (!n) return "0"
  const number = Number(formatEther(n))
  if (number < 1000) {
    return number.toString();
  } else if (number < 1_000_000) {
    return Math.floor(number / 1000) + "K";
  } else {
    let formatted = (number / 1_000_000).toFixed(2);
    formatted = formatted.replace(/\.?0+$/, "");
    return formatted + "M";
  }
}

export const formatScore = (number: number | bigint): string => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export const getObstacleParentName = (e: any, index?: number) => {
  const parentName = e.eventObject.parent.parent.parent.parent.parent.name || e.eventObject.parent.parent.parent.parent.parent.parent.name;
  if (!parentName) alert("Failed to select object");

  return parentName + `-${index}`
}

export const possibleObstacles = [
  "ramp",
  "fish",
  "pickup/fish",
  "winter_well",
  "wooden_post__3_002",
  "universal_car_body",
  "tree_trunk_winter004",
  "tree_trunk_winter",
  "Tree_Part_6006",
  "Tree_Part_1014",
  "Tree_Part_1013",
  "Tree_Part_1011",
  "stones_group_winter_2011",
  "stones_group_winter_2",
  "stones_group_winter001",
  "stone_winter_small_8__5_005",
  "stone_winter_small_8__5_004",
  "stone_winter_small_8__2_002",
  "stone_winter_small_5002",
  "stone_winter_small_5001",
  "stone_winter_small_16__1_",
  "stone_winter_small_14__3_",
  "stone_winter_small001",
  "stone_winter_large_2014",
  "stone_winter_large_2003",
  "stone_winter_large_2001",
  "square_gift_box_red__1_",
  "square_gift_box_red",
  "snowman",
  "fairground_christmas_house_4",
  "fairground_christmas_house_3",
  "igloo_house",
  "snow_shovel_yellow__1_",
  "sled_green001",
  "sled_green",
  "ski_flag_red__1_",
  "santa_claus_sleigh",
  "rhombus_gift_box_white",
  "reindeer",
  "oval_gift_box_blue__1_001",
  "oval_gift_box_blue__1_",
  "land_christmass_fair001",
  "lamppost_4__5_001",
  "lamppost_3__3_",
  "information_plate_winter001",
  "information_plate_winter",
  "information_plate001",
  "ice_stalactite__9__2001",
  "ice_stalactite__8__2001",
  "ice_stalactite__7__2001",
  "ice_stalactite__6__2001",
  "ice_stalactite__5__2001",
  "ice_stalactite__4__2001",
  "ice_stalactite__3__2001",
  "ice_stalactite__2__2001",
  "ice_stalactite__1__2001",
  "hydrant",
  "garland__3_002",
  "fir_tree_winter_tilted_4",
  "fir_tree_winter_tilted_3001",
  "fir_tree_winter_tilted_3",
  "fir_tree_winter_tilted_2__1_",
  "fir_tree_winter_small_3__2_005",
  "fir_tree_winter_small_3__2_001",
  "fir_tree_winter_small_2__2_001",
  "fir_tree_winter_large_2__5_",
  "fir_tree_winter_large_2__1_",
  "electric_wire_winter__7_001",
  "electric_wire_winter__6_001",
  "electric_wire_winter__5_001",
  "electric_wire_winter__4_001",
  "electric_wire_winter__3_001",
  "electric_wire_winter__2_001",
  "electric_wire_winter__1_001",
  "electric_wire_winter001",
  "electric_pole_winter__2_001",
  "electric_pole_winter__1_001",
  "electric_pole_winter001",
  "dumpster_green_winter",
  "dry_tree_winter",
  "crystal_stones_group_2__3_001",
  "crystal_stones_group_2001",
  "crystal_stone_small_2__4_",
  "crystal_stone_lagre__1_001",
  "crystal_stone_lagre__1_",
  "crystal_mountain004",
  "country_fence",
  "christmas_tree_2",
  "caramel_cane__4__1003",
  "caramel_cane__4__1001",
  "car_SUV_large_body_1",
  "car_SUV_large_body",
  "bonfire",
]

export const OBSTACLE_SCALE_PRESET = {
  "stones_group_winter_2": 0.003,
  "fir_tree_winter_tilted_3": 0.004,
  "tree_trunk_winter": 0.01,
  "country_fence": 0.006,
  "bonfire": 0.015,
  "reindeer": 0.008,
  "lamppost_3__3_": 0.008,
  "lamppost_4__5_001": 0.012,
  "caramel_cane__4__1003": 0.03,
  "caramel_cane__4__1001": 0.03,
  "dumpster_green_winter": 0.008,
  "sled_green": 0.012,
  "sled_green001": 0.012,
  "ski_flag_red__1_": 0.012,
  "snow_shovel_yellow__1_": 0.02,
  "santa_claus_sleigh": 0.008,
  "hydrant": 0.012,
  "information_plate001": 0.01,
  "information_plate_winter001": 0.004,
  "winter_well": 0.009,
  "car_SUV_large_body": 0.008,
  "car_SUV_large_body_1": 0.008,
  "universal_car_body": 0.008,
  "square_gift_box_red": 0.025,
  "rhombus_gift_box_white": 0.025,
  "oval_gift_box_blue__1_001": 0.025,
  "fir_tree_winter_large_2__5_": 0.0045,
  "fir_tree_winter_small_2__2_001": 0.0045,
  "fir_tree_winter_tilted_4": 0.0045,
  "fir_tree_winter_large_2__1_": 0.0045,
  "fir_tree_winter_small_3__2_001": 0.0045,
  "fir_tree_winter_tilted_3001": 0.0045,
  "fir_tree_winter_small_3__2_005": 0.0045,
  "fir_tree_winter_tilted_2__1_": 0.0045,
  "dry_tree_winter": 0.0045,
  "snowman": 0.015,
  "Tree_Part_6006": 0.8,
  "Tree_Part_1014": 0.8,
  "Tree_Part_1013": 0.8,
  "Tree_Part_1011": 0.8,
  "Street_Light004": 1,
  "information_plate_winter": 0.003,
}

// returns sum of chunks' lengths up to a given chunk index
export function sumUpTo(arr: { length: number }[], n: number): number {
  return arr.slice(0, n).reduce((sum, el) => sum + el.length, 0);
}


// returns the z-offset of a given chunk
export function getChunkOffset(
  chunks: { length: number; obstacles: { position: [number, number, number] }[] }[],
  n: number,
): number {
  let totalZ = 0;
  for (let i = 0; i < n; i++) {
    const chunk = chunks[i];
    if (chunk.obstacles.length) {
      const smallestZ = getSmallestZ(chunk.obstacles);
      totalZ += smallestZ;
    }
  }

  return totalZ;
}

export const getSmallestZ = (obstacles: { position: [number, number, number] }[]) => {
  let smallestZ = 99999999999;
  for (let j = 0; j < obstacles.length; j++) {
    const obstacle = obstacles[j];
    if (obstacle.position[2] < smallestZ) {
      smallestZ = obstacle.position[2];
    }
  }
  return smallestZ;
}
