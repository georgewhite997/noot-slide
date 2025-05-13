import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { getSnowBumps } from "@/utils";
import {
    SEGMENT_LENGTH,
    SEGMENT_RESOLUTION,
    SEGMENT_WIDTH,
    SLOPE_ANGLE,
    ISegment,
} from "./shared";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import React from "react";

import { SideEnvironment } from "./SideEnvironment";

const GroundGeometry = memo(function GroundGeometry({ yOffset }: { yOffset: number }) {
    const ref = useRef<THREE.PlaneGeometry>(null);

    useEffect(() => {
        const geometry = ref.current;
        if (!geometry) return;

        const positions = geometry.attributes.position;

        for (let j = 0; j < positions.count; j++) {
            const x = positions.getX(j);
            const y = positions.getY(j) + yOffset;
            positions.setZ(j, getSnowBumps(x, y))
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
    }, [ref]);

    return (
        <planeGeometry
            ref={ref}
            args={[
                SEGMENT_WIDTH,
                SEGMENT_LENGTH,
                SEGMENT_RESOLUTION[0],
                SEGMENT_RESOLUTION[1],
            ]}
        />
    );
}, (prevProps, nextProps) => {
    return prevProps.yOffset === nextProps.yOffset;
});

export const Segment = memo(
    function Segment({
        segment,
        colorMap,
        normalMap,
        modelsGltf,
        // isRoad,
    }: {
        segment: ISegment;
        colorMap: THREE.Texture;
        normalMap: THREE.Texture;
        modelsGltf: GLTF;
        // isRoad: boolean;
    }) {
        const lightRef = useRef<THREE.DirectionalLight>(null);
        const targetRef = useRef<THREE.Object3D>(null);
        const targetPosition = new THREE.Vector3(
            0,
            segment.yOffset,
            segment.zOffset - SEGMENT_LENGTH / 2,
        );
        // const { nodes } = ;
        const roadModel = useMemo(() => {
            const object = modelsGltf.scene.getObjectByName("road");
            if (!object) return null;

            // Reset position of all meshes in the tree
            object.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                    child.position.set(0, 0, 0);
                    child.updateMatrix();
                }
            });

            object.scale.set(0.013, 0.025, 0.001);
            return object;
        }, [modelsGltf.scene]);


        useEffect(() => {
            if (lightRef.current && targetRef.current) {
                lightRef.current.target = targetRef.current;
            }
        }, []);

        // if (!roadModel) return null;
        return (
            <>
                {/* Directional Light */}
                <directionalLight
                    rotation={[0, 0, 0.5]}
                    color={0xffffff}
                    intensity={1.5}
                    position={[2, 100, -segment.index * SEGMENT_LENGTH]}
                    castShadow
                    shadow-camera-left={-70}
                    shadow-camera-right={70}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                    shadow-camera-far={200}
                    shadow-intensity={0.7}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    ref={lightRef} />

                <ambientLight intensity={0.5} color={0xffffff} />

                <object3D ref={targetRef} position={targetPosition} />
                <RigidBody type="fixed" friction={0.03} name="ground">
                    <mesh
                        position={[0, segment.yOffset, segment.zOffset]}
                        rotation={[-Math.PI / 2 + SLOPE_ANGLE, 0, 0]}
                    >
                        <planeGeometry args={[SEGMENT_WIDTH, SEGMENT_LENGTH]} />
                        <meshBasicMaterial visible={false} />
                    </mesh>
                </RigidBody>
                <mesh
                    position={[0, segment.yOffset - (segment.index / 100), segment.zOffset]}
                    rotation={[-Math.PI / 2 + SLOPE_ANGLE, 0, 0]}
                    receiveShadow
                >
                    <mesh name={`segment-snow-${segment.index}`} receiveShadow>
                        <GroundGeometry yOffset={segment.index * SEGMENT_LENGTH} />
                        <meshStandardMaterial
                            map={colorMap}
                            normalMap={normalMap}
                            normalScale={new THREE.Vector2(1, 1)}
                            roughness={0.9}
                            metalness={0}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                    <SideEnvironment isRight={false} {...{ colorMap, normalMap }} />
                    <SideEnvironment isRight={true} {...{ colorMap, normalMap }} />
                </mesh>
            </>
        );
    },
    (prevProps, nextProps) =>
        prevProps.segment.yOffset === nextProps.segment.yOffset && prevProps.segment.zOffset === nextProps.segment.zOffset
);
