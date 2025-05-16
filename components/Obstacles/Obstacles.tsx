import { useState, useEffect, useMemo, useRef } from "react";
import * as THREE from 'three'
import { Obstacle } from ".";
import { IObstacle } from "../shared";

interface ObstaclesProps {
    obstacles: IObstacle[];
    FishModel: any;
    snowColorMap: THREE.Texture;
    snowNormalMap: THREE.Texture;
}

const OBSTACLES_PER_FRAME = 1

export const Obstacles = ({
    obstacles,
    FishModel,
    snowColorMap,
    snowNormalMap,
}: ObstaclesProps) => {
    const [renderedCount, setRenderedCount] = useState(0);
    const requestRef = useRef<number>(0);

    useEffect(() => {
        const total = obstacles.length;

        const step = () => {
            setRenderedCount((prev) => {
                const next = Math.min(prev + OBSTACLES_PER_FRAME, total);
                if (next < total) requestRef.current = requestAnimationFrame(step);
                return next;
            });
        };

        setRenderedCount(0); // Reset on obstacles change
        requestRef.current = requestAnimationFrame(step);

        return () => cancelAnimationFrame(requestRef.current);
    }, [obstacles]);

    return (
        <>
            {obstacles.map((obstacle, index) => {
                if (index >= renderedCount) return null;
                return (
                    <Obstacle
                        key={`obstacle-${obstacle.type}-${obstacle.position.join("-")}-${index}`}
                        index={index}
                        obstacle={obstacle}
                        FishModel={FishModel}
                        snowColorMap={snowColorMap}
                        snowNormalMap={snowNormalMap}
                    />
                );
            })}
        </>
    );
};
