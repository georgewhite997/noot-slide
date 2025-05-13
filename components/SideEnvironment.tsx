import { memo, useRef, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three'
import { useAtomValue } from "jotai";
import { modelsGltfAtom } from "@/atoms";
import { getSnowBumps, getModel } from '@/utils';
import {
    SEGMENT_LENGTH,
    SEGMENT_WIDTH,
} from "./shared";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { ObjectMap } from "@react-three/fiber";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";

const sideHeight = 1;
const sideWidth = 8.5;

export const SideSnowPlane = ({
    width,
    length,
    isRight = false,
    resolutionX = 32,
    resolutionY = 128,
    yOffset = 0,
    isSide = false,
    grooveAmplitude,
    grooveFrequency
}: {
    width: number;
    length: number;
    resolutionX?: number;
    resolutionY?: number;
    grooveAmplitude?: number;
    grooveFrequency?: number;
    yOffset?: number;
    isRight?: boolean
    isSide?: boolean
}) => {
    const geometryRef = useRef<THREE.PlaneGeometry>(null);

    useEffect(() => {
        const geometry = geometryRef.current;
        if (!geometry) return;
        const positionAttribute = geometry.attributes.position;

        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i) - yOffset
            if (!isSide) {
                const tillEnd = Math.max(0, (1.2 - (((isRight ? -x : x) + width / 2)) / width));
                const microDetail = getSnowBumps(x, y, tillEnd * 0.3, 1);
                positionAttribute.setZ(i, microDetail);
            } else {
                const microDetail = getSnowBumps(x, y, grooveAmplitude, grooveFrequency);
                positionAttribute.setZ(i, microDetail);

            }

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

const Stones = (isRight: boolean, modelsGltf: GLTF & ObjectMap | null) => {
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

            {obstacles.map((obstacle, index) => {
                if (!obstacle) return null;
                const x = -5 - (index * 5)
                const y = (obstacle.name.includes("cane") ? 2 : 0) - 0.1
                const z = (isRight ? 1 : -1) * (Math.random() < 0.5 ? 7 : 6)
                return obstacle &&
                    <primitive
                        key={index}
                        object={clone(obstacle)}
                        {...(isRight ? { rotation: [Math.PI / 2, 0, 0] } : {})}
                        position={[x, y, z]}
                        castShadow
                    />
            })}
        </>
    )
}
const Stones2 = (isRight: boolean, modelsGltf: GLTF & ObjectMap | null) => {
    const model1 = useMemo(() => getModel("stone_winter_large_2001", 0.03, modelsGltf), []);
    const model2 = useMemo(() => getModel("stone_winter_large_2014", 0.03, modelsGltf), []);
    const model3 = useMemo(() => getModel("stone_winter_large_2003", 0.03, modelsGltf), []);
    const model4 = useMemo(() => getModel("stone_winter_small_8__2_002", 0.09, modelsGltf), []);

    const redFlag = useMemo(() => getModel("ski_flag_red__1_", 0.018, modelsGltf), []);
    const house1 = useMemo(() => getModel("winter_house_7", 0.015, modelsGltf), []);
    const house2 = useMemo(() => getModel("winter_house_8", 0.015, modelsGltf), []);
    const house3 = useMemo(() => getModel("wooden_winter_house_3", 0.015, modelsGltf), []);
    const house4 = useMemo(() => getModel("wooden_winter_house", 0.015, modelsGltf), []);
    const house5 = useMemo(() => getModel("winter_house_6", 0.01, modelsGltf), []);
    const tree = useMemo(() => getModel("fir_tree_winter_large_2__5_", 0.0065, modelsGltf), []);
    const sled = useMemo(() => getModel("sled_green", 0.02, modelsGltf), []);

    const skiLift = useMemo(() => {
        const model = getModel("ski_lift", 0.011, modelsGltf);
        if (model) {
            const cloned = clone(model)
            cloned.children[0].position.set(278, 0, -1430)
            return cloned
        }
        return new THREE.Object3D()
    }, []);

    const hasLift = useMemo(() => Math.random() > 0.5, [])

    const arr = [model1, model2, model3, model4,
        skiLift, redFlag,
        house1, house2, house3, house4,
        tree, sled, house5
    ]

    if (!arr.every(Boolean)) {
        console.log("missing models in 'stones2'")
        return <></>;
    }

    return (
        <>
            <primitive object={clone(model2)} />
            {!isRight && (
                <>
                    <primitive object={clone(redFlag)} position={[-0.3, 13.5, -4]} rotation={[Math.PI / 2, 0, Math.PI / 2 - 0.4]} visible={hasLift} />
                    <primitive object={skiLift} position={[-3, 0, -17]} visible={hasLift} />
                    <primitive object={clone(model1)} position={[3, 8, 0]} visible={hasLift} />
                    <primitive object={clone(house1)} position={[-16, 0, -3]} rotation={[Math.PI / 2, 0, -Math.PI / 2 + 0.3]} />
                    <primitive object={clone(house2)} position={[-28, 0, -3]} rotation={[Math.PI / 2, 0, Math.PI + 0.3]} />
                    <primitive object={clone(model3)} position={[-36, 0, 0]} rotation={[Math.PI / 2, 0.2, -Math.PI / 2]} />
                    <primitive object={clone(model1)} position={[-58, -1, 6]} />

                    <primitive object={clone(house3)} position={[-57, 0, 0]} rotation={[Math.PI / 2, 0, -Math.PI - 0.6]} />
                    <primitive object={clone(tree)} position={[-65, 0, -2]} />
                    <primitive object={clone(tree)} position={[-69, 0, -2]} />
                    <primitive object={clone(house4)} position={[-77, 0, 0]} rotation={[Math.PI / 2, 0, -Math.PI + 0.6]} />
                    <primitive object={clone(model4)} position={[-87, 0, 0]} rotation={[Math.PI / 2, 0, 0.2]} />
                    <primitive object={clone(sled)} position={[-86, 0, -6.5]} rotation={[Math.PI / 2, 0, -Math.PI / 2 + 0.2]} />

                </>
            )}

            {isRight && (
                <>
                    <primitive object={clone(model2)} position={[-20, 0, -3]} />
                    <primitive object={clone(house4)} position={[-34, 0, 0]} rotation={[Math.PI / 2, 0, Math.PI - 0.6]} />
                    <primitive object={clone(model1)} position={[-40, 0, -3]} />
                    <primitive object={clone(model2)} position={[-60, 0, -3]} />
                    <primitive object={clone(house5)} position={[-60, 0, 5]} rotation={[Math.PI / 2, 0, 0.2]} />
                    <primitive object={clone(model3)} position={[-80, 0, -3]} />
                    <primitive object={clone(model1)} position={[-80, 0, -3]} />
                    <primitive object={clone(model2)} position={[-90, 0, -3]} />
                </>
            )}
        </>
    )
}

const allEnvironments = [Stones, Stones2]


export const SideEnvironment = memo(
    function SideEnvironment({
        yOffset,
        isRight,
        colorMap,
        normalMap,
    }: {
        yOffset: number
        isRight: boolean;
        colorMap: THREE.Texture;
        normalMap: THREE.Texture;
    }) {
        const modelsGltf = useAtomValue(modelsGltfAtom);

        // return null
        const EnvironmentSegment = useMemo(() =>
            allEnvironments[
            Math.floor(Math.random() * allEnvironments.length)
            ],
            [allEnvironments.length]
        );


        return (
            <>
                {/* SIDE WALL */}
                <mesh
                    position={[
                        isRight ? SEGMENT_WIDTH / 2 - 0.15 : -SEGMENT_WIDTH / 2 + 0.15,
                        0,
                        sideHeight / 2 - 0.2,
                    ]}
                    rotation={[0, isRight ? -Math.PI / 2 + 0.3 : Math.PI / 2 - 0.3, 0]}
                >
                    <SideSnowPlane width={sideHeight} length={SEGMENT_LENGTH} yOffset={yOffset} isRight={isRight} isSide
                        grooveAmplitude={0.1}
                        grooveFrequency={0.5}
                        resolutionY={128}
                        resolutionX={128}
                    />
                    <meshStandardMaterial
                        map={colorMap}
                        normalMap={normalMap}
                        normalScale={new THREE.Vector2(1, 1)}
                        roughness={0.3}
                        metalness={0}
                    />

                </mesh>

                {/* TOP SNOW PLANE */}
                <mesh
                    position={[
                        isRight ? SEGMENT_WIDTH / 2 + sideWidth / 2 : -SEGMENT_WIDTH / 2 - sideWidth / 2,
                        0,
                        sideHeight - 0.2,
                    ]}
                    rotation={[0, 0, 0]}
                    receiveShadow
                >
                    <SideSnowPlane width={sideWidth} length={SEGMENT_LENGTH} yOffset={yOffset} isRight={isRight} />
                    <meshStandardMaterial
                        map={colorMap}
                        normalMap={normalMap}
                        normalScale={new THREE.Vector2(1, 1)}
                        roughness={0}
                        metalness={0}
                        side={THREE.DoubleSide}
                    />

                </mesh>

                {/* BOX UNDERNEATH SNOW PLANES TO HIDE GAPS */}
                <mesh
                    position={[
                        isRight ? SEGMENT_WIDTH / 2 + sideWidth / 2 : -SEGMENT_WIDTH / 2 - sideWidth / 2,
                        0,
                        sideHeight / 2 - 0.2,
                    ]}
                    rotation={[0, 0, 0]}
                >
                    <boxGeometry args={[sideWidth, SEGMENT_LENGTH, 1]} />
                    <meshStandardMaterial
                        map={colorMap}
                        normalMap={normalMap}
                        normalScale={new THREE.Vector2(1, 1)}
                        roughness={0}
                        metalness={0}
                        side={THREE.DoubleSide}
                    />
                </mesh>

                {/*ENVIRONMENT BUILDINGS */}
                <group position={[
                    isRight ? SEGMENT_WIDTH / 2 + sideWidth : -SEGMENT_WIDTH / 2 - sideWidth,
                    -SEGMENT_LENGTH / 2,
                    sideHeight
                ]}
                    castShadow
                    rotation={[Math.PI / 2, -Math.PI / 2, 0]}>
                    {EnvironmentSegment(isRight, modelsGltf)}
                </group>
            </>
        );
    },
    (prevProps, nextProps) => {
        return prevProps.isRight === nextProps.isRight && prevProps.yOffset === nextProps.yOffset
    },
);