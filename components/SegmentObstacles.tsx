import * as THREE from "three";
import { memo, useMemo } from "react";
import { Merged } from "@react-three/drei";
import { useAtomValue } from "jotai";
import { fishMeshesAtom } from "@/atoms";
import { ISegment, IObstacle } from "./shared";
import { Obstacle } from "./Obstacles";
import { Obstacles } from "./Obstacles/Obstacles";

interface Props {
    segment: ISegment;
    colorMap: THREE.Texture;
    normalMap: THREE.Texture;
    optimize?: boolean,
}

export const SegmentObstacles = memo(function SegmentObstacles({
    segment,
    optimize = true,
}: Props) {
    const fishMeshes = useAtomValue(fishMeshesAtom);

    const allObstacles = useMemo(
        () => segment.chunks.flatMap((chunk) => chunk.obstacles),
        [segment.chunks]
    );



    if (optimize) {
        if (allObstacles.length === 0) return null;

        return (
            <group name={`segment-${segment.index}`}>
                <Obstacles
                    obstacles={allObstacles}
                />
            </group>
        );
    } else {
        return segment.chunks.length > 0 ? (
            segment.chunks.map((chunk) => {
                if (chunk.obstacles.length === 0) return null
                const chunkKey = chunk.name + segment.index + segment.yOffset
                return (
                    <group key={chunkKey} name={chunk.name}>
                        <Merged meshes={fishMeshes} limit={20}>
                            {(model) =>
                                <group>
                                    {chunk.obstacles.map((obstacle, obstacleIndex) =>
                                        <Obstacle
                                            key={`${chunkKey}-obstacle-${obstacle.type}-${obstacle.position.join('-')}-${segment.index}-${obstacleIndex}`}
                                            index={obstacleIndex}
                                            obstacle={obstacle}
                                            FishModel={model.KoiFish_low}
                                        />
                                    )}
                                </group>
                            }
                        </Merged >
                    </group >
                )
            })
        ) : null
    }

},
    // porównanie propsów
    (prevProps, nextProps) => {
        const p = prevProps.segment, n = nextProps.segment;

        if (p.index !== n.index || p.yOffset !== n.yOffset || p.zOffset !== n.zOffset) {
            return false;
        }

        if (p.chunks.length !== n.chunks.length) {
            return false;
        }

        for (let i = 0; i < p.chunks.length; i++) {
            const pc = p.chunks[i], nc = n.chunks[i];
            if (haveObstaclesChanged(pc.obstacles, nc.obstacles)) {
                return false;
            }
        }

        return true;
    });



const haveObstaclesChanged = (a: IObstacle[], b: IObstacle[]) => {
    if (a.length !== b.length) return true;
    for (let i = 0; i < a.length; i++) {
        const ao = a[i], bo = b[i];
        if (!bo ||
            ao.type !== bo.type ||
            ao.scale !== bo.scale ||
            ao.position.some((v, k) => v !== bo.position[k]) ||
            ao.rotation.some((v, k) => v !== bo.rotation[k]))
            return true;
    }
    return false;
};