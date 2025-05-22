import { useState, useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Obstacle } from ".";
import { IObstacle } from "../shared";
import { fishMeshesAtom } from "@/atoms";
import { useAtomValue } from "jotai";
import { Merged } from "@react-three/drei";


const OBSTACLES_PER_FRAME = 1;

interface ObstaclesProps {
    obstacles: IObstacle[];
}

export const Obstacles = ({
    obstacles,
}: ObstaclesProps) => {
    const fishMeshes = useAtomValue(fishMeshesAtom);
    const mergedRef = useRef<THREE.Group>(null);
    const [renderedCount, setRenderedCount] = useState(0);

    // reset when the list identity changes
    useMemo(() => {
        setRenderedCount(0);
    }, [obstacles]);

    useFrame(() => {
        setRenderedCount((c) =>
            c < obstacles.length ? Math.min(c + OBSTACLES_PER_FRAME, obstacles.length) : c
        );
    });

    useEffect(() => {
        if (mergedRef.current) mergedRef.current.frustumCulled = false;
    }, []);

    return (
        <Merged meshes={fishMeshes} limit={300} ref={mergedRef} frustumCulled={false}>
            {(model) => obstacles.slice(0, renderedCount).map((obstacle, index) => (
                <Obstacle
                    key={`obstacle-${obstacle.type}-${obstacle.position.join("-")}-${index}`}
                    index={index}
                    obstacle={obstacle}
                    FishModel={model.KoiFish_low}
                />
            ))
            }
        </Merged>
    );
};
