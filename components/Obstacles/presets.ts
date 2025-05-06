import { IChunk } from "../shared";

const presets: IChunk[] = [
  {
    obstacles: [
      {
        name: "winter_well",
        position: [0, 0, 2],
        rotation: [1.5707963267948966, 0, 0],
        scale: 1,
        type: "obstacle",
      },
      {
        name: "sled_green",
        position: [0, 0, 8],
        rotation: [1.5707963267948966, 1.5707963267948966, 0],
        scale: 1,
        type: "obstacle",
      },
      {
        name: "fish",
        position: [-3, 0, 2],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
      {
        name: "fish",
        position: [-3, 0, 5],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
      {
        name: "fish",
        position: [3, 0, 2],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
      {
        name: "fish",
        position: [3, 0, 5],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
      {
        name: "pickup/fish",
        position: [3, 0, 7],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
      {
        name: "pickup/fish",
        position: [-3, 0, 8],
        rotation: [0, 0, 0],
        scale: 1,
        type: "reward",
      },
    ],
    length: 8.198363079882185,
  },
];

export default presets;
