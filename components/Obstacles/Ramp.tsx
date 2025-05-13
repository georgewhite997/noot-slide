import { getObstacleParentName } from "@/utils";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { getSnowBumps } from "@/utils";
import { RigidBody } from "@react-three/rapier";
import { useSetAtom } from "jotai";
import { selectedObstacleAtom } from "@/atoms";
import { IObstacle } from "../shared";

const RAMP_LENGTH = 2.5;
const RAMP_WIDTH = 3;
const RUNWAY_LENGTH = 8;
const RAMP_SLOPE = -0.9;

const SnowPlane = ({
  width,
  length,
  resolutionX = 32,
  resolutionY = 128,
  grooveAmplitude,
  grooveFrequency,
}: {
  width: number;
  length: number;
  resolutionX?: number;
  resolutionY?: number;
  grooveAmplitude?: number;
  grooveFrequency?: number;
}) => {
  const geometryRef = useRef<THREE.PlaneGeometry>(null);

  useEffect(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;
    const positionAttribute = geometry.attributes.position;

    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i);
      const y = positionAttribute.getY(i);
      const microDetail = getSnowBumps(x, y, grooveAmplitude, grooveFrequency);
      positionAttribute.setZ(i, microDetail);
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    return () => {
      geometry.dispose();
    };
  }, [geometryRef.current]);

  return (
    <planeGeometry
      ref={geometryRef}
      args={[width, length, resolutionX, resolutionY]}
    />
  );
};

export const Ramp = ({
  obstacle,
  snowColorMap,
  snowNormalMap,
  index,
}: {
  obstacle: IObstacle;
  snowColorMap: THREE.Texture;
  snowNormalMap: THREE.Texture;
  index?: number;
}) => {
  const setSelectedObstacle = useSetAtom(selectedObstacleAtom);

  const [x, , z] = obstacle.position;

  return (
    <>
      <RigidBody
        type="fixed"
        name="ground"
        position={[x, z - 3.7 + RUNWAY_LENGTH / 2, 0.7]}
        rotation={[Math.PI / 2 + RAMP_SLOPE, 0, 0]}
        friction={0.3}
      >
        <mesh
          onClick={(e) => {
            if (index === undefined) return;
            setSelectedObstacle(getObstacleParentName(e, index));
          }}
        >
          <meshBasicMaterial visible={false} />
          <planeGeometry args={[RAMP_WIDTH, RAMP_LENGTH]} />
        </mesh>
      </RigidBody>
      <RigidBody
        type="fixed"
        name="ground"
        position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
        friction={0.03}
      >
        <mesh
          onClick={(e) => {
            if (index === undefined) return;
            setSelectedObstacle(getObstacleParentName(e, index));
          }}
        >
          <meshBasicMaterial visible={false} />
          <boxGeometry args={[RAMP_WIDTH, RAMP_LENGTH, RUNWAY_LENGTH]} />
        </mesh>
      </RigidBody>

      <mesh
        position={[x, z - 3.7 + RUNWAY_LENGTH / 2, 0.7]}
        rotation={[Math.PI / 2 + RAMP_SLOPE, 0, 0]}
        onClick={(e) => {
          if (index === undefined) return;
          setSelectedObstacle(getObstacleParentName(e, index));
        }}
      >
        <SnowPlane
          width={RAMP_WIDTH}
          length={RAMP_LENGTH}
          resolutionX={30}
          resolutionY={30}
          grooveAmplitude={0.05}
          grooveFrequency={3}
        />
        <meshStandardMaterial
          map={snowColorMap} // Base color of the snow
          normalMap={snowNormalMap} // Surface detail
          normalScale={new THREE.Vector2(1, 1)} // Adjust normal map strength
          roughness={0.9} // Base roughness (snow is rough)
          metalness={0} // Snow isn't metallic
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh
        position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 1.45]}
        rotation={[0, 0, 0]}
        onClick={(e) => {
          if (index === undefined) return;
          setSelectedObstacle(getObstacleParentName(e, index));
        }}
      >
        <meshStandardMaterial map={snowColorMap} side={THREE.DoubleSide} />
        <SnowPlane
          width={RAMP_WIDTH}
          length={RUNWAY_LENGTH}
          resolutionX={30}
          resolutionY={30}
          grooveAmplitude={0.05}
          grooveFrequency={3}
        />
      </mesh>

      <mesh
        position={[x, z + RAMP_LENGTH / 2 + RUNWAY_LENGTH / 2, 0.2]}
        rotation={[Math.PI / 2, 0, 0]}
        onClick={(e) => {
          if (index === undefined) return;
          setSelectedObstacle(getObstacleParentName(e, index));
        }}
      >
        <meshStandardMaterial map={snowColorMap} side={THREE.DoubleSide} />
        <boxGeometry args={[RAMP_WIDTH, RAMP_LENGTH, RUNWAY_LENGTH]} />
      </mesh>
    </>
  );
};