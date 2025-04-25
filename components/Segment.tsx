import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { Instance, Instances, useGLTF } from "@react-three/drei";
import { getSnowBumps } from "@/utils";
import {
    SEGMENT_LENGTH,
    SEGMENT_RESOLUTION,
    SEGMENT_WIDTH,
    SLOPE_ANGLE,
    ISegment,
} from "./shared";
import { Obstacle } from "./Obstacles";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap, useLoader } from "@react-three/fiber";
import React from "react";
import { useAtomValue } from "jotai";
import { modelsGltfAtom } from "@/atoms";

const sideHeight = 0.2;
const sideWidth = 1.2;
const flagpoleSeparation = 5;
const flagpoleHeight = 1;


export const SnowPlane = ({
    width,
    length,
    isSide,
    resolutionX = 32,
    resolutionY = 128,
    grooveAmplitude = 0.2,
    grooveFrequency = 1,
}: {
    width: number;
    length: number;
    isSide: boolean;
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
            const microDetail = Math.max(
                0,
                getSnowBumps(x, y, isSide ? 0.05 : grooveAmplitude, grooveFrequency),
            );
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

interface IEnvironmentSegment {
    name: string;
    GetEnvironment: (isRight: boolean, modelsGltf: GLTF & ObjectMap | null) => React.ReactElement;
}


function getModel(name: string, scale: number, modelsGltf: GLTF & ObjectMap | null) {
    // const modelsGltf = useLoader(GLTFLoader, '/models.glb');
    if (!modelsGltf?.scene) return null;
    const object = modelsGltf.scene.getObjectByName(name);
    if (!object) return null;

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

const OBSTACLE_MODELS = new Set([
    { name: "fir_tree_winter_large_2__5_", scale: 0.0045 },
    { name: "fir_tree_winter_small_2__2_001", scale: 0.0045 },
    { name: "fir_tree_winter_tilted_4", scale: 0.0045 },
    { name: "fir_tree_winter_large_2__1_", scale: 0.0045 },
    { name: "fir_tree_winter_small_3__2_001", scale: 0.0045 },
    { name: "fir_tree_winter_tilted_3001", scale: 0.0045 },
    { name: "fir_tree_winter_small_3__2_005", scale: 0.0045 },
    { name: "fir_tree_winter_tilted_2__1_", scale: 0.0045 },
    { name: "dry_tree_winter", scale: 0.0045 },
    { name: "stone_winter_small_8__2_002", scale: 0.02 },
    { name: "stone_winter_small_8__5_004", scale: 0.02 },
    { name: "stone_winter_small_8__5_005", scale: 0.02 },
    { name: "country_fence", scale: 0.006 },
    { name: "bonfire", scale: 0.015 },
    { name: "reindeer", scale: 0.008 },
    { name: "lamppost_3__3_", scale: 0.008 },
    { name: "lamppost_4__5_001", scale: 0.012 },
    { name: "caramel_cane__4__1003", scale: 0.03 },
    { name: "caramel_cane__4__1001", scale: 0.08 },
    { name: "dumpster_green_winter", scale: 0.008 },
    { name: "igloo_house", scale: 0.006 },
    { name: "snow_shovel_yellow__1_", scale: 0.02 },
    { name: "ski_flag_red__1_", scale: 0.012 },
    { name: "sled_green", scale: 0.012 },
    { name: "sled_green001", scale: 0.012 },
    { name: "santa_claus_sleigh", scale: 0.008 },
    { name: "information_plate001", scale: 0.01 },
    { name: "information_plate_winter001", scale: 0.004 },
    { name: "square_gift_box_red", scale: 0.025 },
    { name: "rhombus_gift_box_white", scale: 0.025 },
    { name: "oval_gift_box_blue__1_001", scale: 0.025 },
    { name: "winter_well", scale: 0.009 },
    { name: "snowman", scale: 0.015 },
    { name: "fairground_christmas_house_3", scale: 0.006 },
    { name: "fairground_christmas_house_4", scale: 0.006 },
    { name: "winter_house_7", scale: 0.006 },
    { name: "winter_house_8", scale: 0.006 },
    { name: "wooden_winter_house_3", scale: 0.006 },
    { name: "wooden_winter_house", scale: 0.006 },
    { name: "winter_house_6", scale: 0.006 },
    { name: "christmas_house_4", scale: 0.006 },
    { name: "christmas_house001", scale: 0.006 },
    { name: "christmas_house_2", scale: 0.006 },
    { name: "christmas_house", scale: 0.006 },
    { name: "christmas_house_3", scale: 0.006 },
]);

function getRandomObstacleModel(modelsGltf: GLTF & ObjectMap | null) {
    if (!modelsGltf) return;
    const modelsArray = Array.from(OBSTACLE_MODELS);
    const randomModel = modelsArray[Math.floor(Math.random() * modelsArray.length)];
    return getModel(randomModel.name, randomModel.scale, modelsGltf);
}

const environmentSegments: IEnvironmentSegment[] = [
    {
        name: "stones",
        GetEnvironment: (isRight, modelsGltf) => {
            const model1 = useMemo(() => getModel("stone_winter_large_2001", 0.03, modelsGltf), []);
            const model2 = useMemo(() => getModel("stone_winter_large_2014", 0.03, modelsGltf), []);
            const model3 = useMemo(() => getModel("stone_winter_large_2003", 0.03, modelsGltf), []);

            if (!model1 || !model2 || !model3) return <></>;

            // Generate array of 20 random obstacles
            const obstacles = Array.from({ length: 20 }, () => {
                let obstacle;
                do {
                    obstacle = getRandomObstacleModel(modelsGltf);
                } while (obstacle?.name.includes("house") && Math.random() < 0.8);
                return obstacle;
            });

            return (
                <>
                    <primitive object={clone(model1)} />
                    <primitive object={clone(model2)} position={[-20, 0, 0]} />
                    <primitive object={clone(model3)} position={[-40, 0, 0]} />
                    <primitive object={clone(model1)} position={[-40, 0, 0]} />
                    <primitive object={clone(model2)} position={[-60, 0, 0]} />
                    <primitive object={clone(model3)} position={[-80, 0, 0]} />
                    <primitive object={clone(model1)} position={[-80, 0, 0]} />
                    <primitive object={clone(model2)} position={[-90, 0, 0]} />

                    {obstacles.map((obstacle, index) =>
                        (obstacle) && (
                            <primitive
                                key={index}
                                object={clone(obstacle)}
                                {...(isRight ? { rotation: [Math.PI / 2, 0, 0] } : {})}
                                position={[-5 - (index * 5), obstacle.name.includes("cane") ? 2 : 0, isRight ? (Math.random() < 0.5 ? 7 : 6) : (Math.random() < 0.5 ? -7 : -6)]}
                            />
                        )
                    )}
                </>
            )
        }
    },
]


export const SideSlope = memo(
    function SideSlope({
        isRight,
        colorMap,
        normalMap,
    }: {
        isRight: boolean;
        colorMap: THREE.Texture;
        normalMap: THREE.Texture;
    }) {
        const modelsGltf = useAtomValue(modelsGltfAtom);
        const model1 = getModel("stone_winter_large_2001", 0.03, modelsGltf);
        const model2 = getModel("stone_winter_large_2014", 0.03, modelsGltf);
        const model3 = getModel("stone_winter_large_2003", 0.03, modelsGltf);

        if (!model1 || !model2 || !model3) return null;

        return (
            <>
                <Instances limit={8}>
                    <SnowPlane width={sideWidth} length={SEGMENT_LENGTH} isSide={false} />
                    <meshStandardMaterial
                        map={colorMap}
                        normalMap={normalMap}
                        normalScale={new THREE.Vector2(1, 1)}
                        roughness={0}
                        metalness={0}
                        side={THREE.DoubleSide}
                    />
                    <Instance
                        position={[
                            isRight ? SEGMENT_WIDTH / 2 : -SEGMENT_WIDTH / 2,
                            sideHeight * 2,
                            sideHeight * 1,
                        ]}
                        rotation={[0, isRight ? Math.PI / 2 : -Math.PI / 2, 0]}
                    />
                    <Instance
                        position={[
                            isRight ? SEGMENT_WIDTH / 2 + sideWidth * 3.5 : -SEGMENT_WIDTH / 2 - sideWidth * 3.5,
                            sideHeight * 4,
                            sideHeight * 4,
                        ]}
                        rotation={[0, 0, 0]}
                        scale={[7, 1, 0.5]}
                    />
                </Instances>

                <group position={[
                    isRight ? SEGMENT_WIDTH / 2 + sideWidth * 8 : -SEGMENT_WIDTH / 2 - sideWidth * 8,
                    -SEGMENT_LENGTH / 2,
                    sideHeight * 4
                ]}
                    rotation={[Math.PI / 2, -Math.PI / 2, 0]}>
                    {environmentSegments[0].GetEnvironment(isRight, modelsGltf)}
                </group>
            </>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.isRight === nextProps.isRight;
    },
);

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
        isRoad,
    }: {
        segment: ISegment;
        colorMap: THREE.Texture;
        normalMap: THREE.Texture;
        modelsGltf: GLTF;
        isRoad: boolean;
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

        if (!roadModel) return null;

        return (
            <>
                {/* Directional Light */}
                <directionalLight
                    rotation={[0, 0, 0.5]}
                    color={0xffffff}
                    intensity={2}
                    position={[50, 100, -segment.index * SEGMENT_LENGTH]}
                    castShadow
                    shadow-camera-left={-70}
                    shadow-camera-right={70}
                    shadow-camera-top={50}
                    shadow-camera-bottom={-50}
                    shadow-camera-far={200}
                    shadow-intensity={0.7}
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                    ref={lightRef}
                ></directionalLight>
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
                    position={[0, segment.yOffset, segment.zOffset]}
                    rotation={[-Math.PI / 2 + SLOPE_ANGLE, 0, 0]}
                    receiveShadow
                >
                    {isRoad ? (
                        <primitive
                            object={clone(roadModel)}
                            scale={[0.013, 0.025, 0.001]}
                            position={[0, 0, 0]}
                            rotation={[0, 0, 0]}
                        />
                    ) : (
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
                    )}
                    <SideSlope isRight={false} {...{ colorMap, normalMap }} />
                    <SideSlope isRight={true} {...{ colorMap, normalMap }} />
                </mesh>
            </>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.segment.yOffset === nextProps.segment.yOffset && prevProps.segment.zOffset === nextProps.segment.zOffset;
    }
);
