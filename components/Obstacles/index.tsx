import { memo, useMemo } from "react";
import { IObstacle } from "../shared";
import { OBSTACLE_SCALE_PRESET } from "@/utils";
import * as THREE from "three";
import { useAtomValue } from "jotai";
import { hasLuckyCharmAtom } from "@/atoms";
import { FishMultiplier } from "./FishMultiplier";
import { FishingNet } from "./FishingNet";
import { Ramp } from "./Ramp";
import { TexturedObstacle } from "./TexturedObstacle";
import { Fish } from "./Fish";
import { getChunks } from "./utils";
import { Meters } from "./Meters";

const RandomPickup = ({
  obstacle,
  index,
  FishModel,
}: {
  obstacle: IObstacle;
  index?: number;
  FishModel: any;
}) => {
  const hasLuckyCharm = useAtomValue(hasLuckyCharmAtom);
  const [random1, random2, random3] = useMemo(() => [Math.random(), Math.random(), Math.random()], []);

  const chanceForPickup = 0.2 * (hasLuckyCharm ? 1.5 : 1);
  if (random1 <= chanceForPickup) {
    if (random2 >= 0 && random2 <= 0.33) {
      return <FishMultiplier obstacle={obstacle} index={index} />;
    } else if (random2 > 0.33 && random2 <= 0.66) {
      return <FishingNet obstacle={obstacle} index={index} />;
    } else {
      let pickupType: '100M' | '250M' | '750M';

      if (random3 <= 0.5) {
        pickupType = '100M';
      } else if (random3 <= 0.85) {
        pickupType = '250M';
      } else {
        pickupType = '750M';
      }

      return <Meters obstacle={obstacle} index={index} pickupType={pickupType} />;
    }
  } else {
    return <Fish obstacle={obstacle} Model={FishModel} index={index} />;
  }
};

const Obstacle = memo(
  function Obstacle({
    obstacle,
    index,
    snowColorMap,
    snowNormalMap,
    FishModel,
  }: {
    obstacle: IObstacle;
    index?: number;
    snowColorMap: THREE.Texture;
    snowNormalMap: THREE.Texture;
    FishModel: any;
  }) {
    switch (obstacle.type) {
      case "reward":
        if (obstacle.name === "fish")
          return <Fish obstacle={obstacle} Model={FishModel} index={index} />;

        if (obstacle.name === "pickup/fish")
          return (
            <RandomPickup
              obstacle={obstacle}
              index={index}
              FishModel={FishModel}
            />
          );

      case "obstacle":
        return (
          <TexturedObstacle
            obstacle={obstacle}
            objectName={obstacle.name}
            scale={
              (OBSTACLE_SCALE_PRESET[
                obstacle.name as keyof typeof OBSTACLE_SCALE_PRESET
              ] || 0.02) * obstacle.scale
            }
            index={index}
          />
        );
      case "ramp":
        return (
          <Ramp
            obstacle={obstacle}
            snowColorMap={snowColorMap}
            snowNormalMap={snowNormalMap}
            index={index}
          />
        );
      default:
        return null;
    }
  },
  ({ obstacle: a }, { obstacle: b }) =>
    a.type === b.type &&
    a.scale === b.scale &&
    a.position.every((v, i) => v === b.position[i]) &&
    a.rotation.every((v, i) => v === b.rotation[i]),
);

export { Obstacle, getChunks };
