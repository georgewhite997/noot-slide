import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { RigidBody } from "@react-three/rapier";
import { useAtomValue } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { modelsGltfAtom } from "@/atoms";
import { OBSTACLE_SCALE_PRESET } from "@/utils";
import { IObstacle } from "../shared";

interface OptimizedTexturedObstaclesProps {
    obstacles: IObstacle[];
}

const FIXABLE_OBSTACLES = ["stone", "cane", "hydrant", "gift", "car", "sled", "dumpster"];
const OBSTACLES_PER_FRAME = 1;

export const OptimizedTexturedObstacles = ({ obstacles }: OptimizedTexturedObstaclesProps) => {
    const modelsGltf = useAtomValue(modelsGltfAtom);
    const [renderedCount, setRenderedCount] = useState(0);
    const requestRef = useRef<number>(0);

    // Flat list of obstacles with their group name and index
    const flatObstacles = useMemo(() => {
        return obstacles.map((obstacle, index) => ({
            obstacle,
            objectName: obstacle.name,
            groupIndex: index,
        }));
    }, [obstacles]);

    // Schedule progressive rendering
    useEffect(() => {
        const total = obstacles.length;
        const step = () => {
            setRenderedCount((prev) => {
                const next = Math.min(prev + OBSTACLES_PER_FRAME, total);
                if (next < total) requestRef.current = requestAnimationFrame(step);
                return next;
            });
        };
        setRenderedCount(0); // reset when obstacles change
        requestRef.current = requestAnimationFrame(step);
        return () => cancelAnimationFrame(requestRef.current!);
    }, [obstacles]);

    return (
        <>
            {flatObstacles.map(({ obstacle, objectName, groupIndex }, i) => {
                // These hooks are ALWAYS called
                const modelTemplate = useMemo(() => {
                    if (!modelsGltf?.scene) return null;
                    const base = modelsGltf.scene.getObjectByName(objectName);
                    if (!base) return null;
                    base.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            child.position.set(0, 0, 0);
                            child.updateMatrix();
                        }
                    });
                    return base;
                }, [modelsGltf, objectName]);

                const scale =
                    (OBSTACLE_SCALE_PRESET[obstacle.name as keyof typeof OBSTACLE_SCALE_PRESET] || 0.02) *
                    obstacle.scale;

                const model = useMemo(() => {
                    if (!modelTemplate) return null;
                    const instance = clone(modelTemplate);
                    instance.scale.set(scale, scale, scale);
                    return instance;
                }, [modelTemplate, scale]);

                const ghost = useMemo(() => {
                    if (!model) return null;
                    const ghost = clone(model);
                    ghost.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            if (Array.isArray(child.material)) {
                                child.material = child.material.map((mat) => {
                                    const m = mat.clone();
                                    m.transparent = true;
                                    m.opacity = 0;
                                    return m;
                                });
                            } else {
                                const m = child.material.clone();
                                m.transparent = true;
                                m.opacity = 0;
                                child.material = m;
                            }
                        }
                    });
                    return ghost;
                }, [model]);

                const isFixed = FIXABLE_OBSTACLES.some((item) =>
                    objectName.toLowerCase().includes(item)
                );

                const basePosition: [number, number, number] = [
                    obstacle.position[0],
                    obstacle.position[2],
                    obstacle.position[1],
                ];

                const fixedPosition: [number, number, number] = [
                    basePosition[0],
                    basePosition[1],
                    basePosition[2] + 0.1,
                ];

                // Now skip rendering conditionally — but keep all hooks above always called
                if (i >= renderedCount || !model) return null;

                return (
                    <group key={`${objectName}-${groupIndex}-${i}`}>
                        <RigidBody
                            type="fixed"
                            name={`deadly-obstacle-${objectName}-${i}`}
                            position={basePosition}
                            rotation={obstacle.rotation}
                            colliders="hull"
                        >
                            <primitive object={model} />
                        </RigidBody>

                        {isFixed && ghost && (
                            <RigidBody
                                type="fixed"
                                name="obstacle-fixed"
                                position={fixedPosition}
                                rotation={obstacle.rotation}
                                colliders="hull"
                            >
                                <primitive object={ghost} />
                            </RigidBody>
                        )}
                    </group>
                );
            })}
        </>
    );
};
