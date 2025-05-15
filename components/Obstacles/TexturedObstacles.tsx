import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { RigidBody } from "@react-three/rapier";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import * as THREE from "three";
import { modelsGltfAtom } from "@/atoms";
import { OBSTACLE_SCALE_PRESET } from "@/utils";
import { IObstacle } from "../shared";

interface OptimizedTexturedObstaclesProps {
    obstacles: IObstacle[];
}

const FIXABLE_OBSTACLES = ["stone", "cane", "hydrant", "gift", "car", "sled", "dumpster"];

export const OptimizedTexturedObstacles = ({ obstacles }: OptimizedTexturedObstaclesProps) => {
    const modelsGltf = useAtomValue(modelsGltfAtom);

    const grouped = useMemo(() => {
        const map = new Map<string, IObstacle[]>();
        for (const obs of obstacles) {
            if (!map.has(obs.name)) map.set(obs.name, []);
            map.get(obs.name)!.push(obs);
        }
        return map;
    }, [obstacles]);

    const renderedGroups = Array.from(grouped.entries()).map(([objectName, group], groupIndex) => {
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

        if (!modelTemplate) return null;

        const isFixed = FIXABLE_OBSTACLES.some((item) =>
            objectName.toLowerCase().includes(item)
        );

        return group.map((obstacle, i) => {
            const scale =
                (OBSTACLE_SCALE_PRESET[
                    obstacle.name as keyof typeof OBSTACLE_SCALE_PRESET
                ] || 0.02) * obstacle.scale;

            const model = useMemo(() => {
                const instance = clone(modelTemplate);
                instance.scale.set(scale, scale, scale);
                return instance;
            }, [modelTemplate, scale]);

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

            return (
                <group key={`${objectName}-${groupIndex}-${i}`}>
                    {/* Deadly obstacle collider (always present) */}
                    <RigidBody
                        type="fixed"
                        name={`deadly-obstacle-${objectName}-${i}`}
                        position={basePosition}
                        rotation={obstacle.rotation}
                        colliders="hull"
                    >
                        <primitive object={model} />
                    </RigidBody>

                    {/* Additional safe collider if obstacle is fixed */}
                    {isFixed && (
                        <RigidBody
                            type="fixed"
                            name="obstacle-fixed"
                            position={fixedPosition}
                            rotation={obstacle.rotation}
                            colliders="hull"
                        >
                            <primitive
                                object={useMemo(() => {
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
                                }, [model])}
                            />
                        </RigidBody>
                    )}
                </group>
            );
        });
    });

    return <>{renderedGroups}</>;
};