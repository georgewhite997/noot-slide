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
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

const sideHeight = 0.4;
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
        // const meshRef = useRef<THREE.Mesh>(null);
        return (
            <>
                {/* flagpoles every 10 meters */}
                {/*
            {new Array(Math.floor(SEGMENT_LENGTH / flagpoleSeparation))
                .fill(0)
                .map((_, i) => (
                    <mesh
                        key={i}
                        position={[
                            isRight
                                ? SEGMENT_WIDTH / 2 + sideWidth / 2
                                : -SEGMENT_WIDTH / 2 - sideWidth / 2,
                            sideHeight + flagpoleHeight / 2,
                            0,
                        ]}
                        rotation={[SLOPE_ANGLE, 0, 0]}
                    >
                        <cylinderGeometry args={[0.01, 0.01, flagpoleHeight]} />
                        <meshStandardMaterial color="#FF5C00" />
                    </mesh>
                ))}
            */}

                <Instances limit={8}>
                    <SnowPlane width={sideWidth} length={SEGMENT_LENGTH} isSide={false} />
                    <meshStandardMaterial
                        map={colorMap} // Base color of the snow
                        normalMap={normalMap} // Surface detail
                        normalScale={new THREE.Vector2(1, 1)} // Adjust normal map strength
                        roughness={0.9} // Base roughness (snow is rough)
                        metalness={0} // Snow isn't metallic
                        side={THREE.DoubleSide}
                    />
                    <Instance
                        position={[
                            isRight
                                ? SEGMENT_WIDTH / 2 + sideWidth / 2
                                : -SEGMENT_WIDTH / 2 - sideWidth / 2,
                            sideHeight,
                            sideHeight * 2,
                        ]}
                        rotation={[0, 0, 0]}
                    />
                    <Instance
                        position={[
                            isRight ? SEGMENT_WIDTH / 2 : -SEGMENT_WIDTH / 2,
                            sideHeight,
                            sideHeight,
                        ]}
                        rotation={[0, isRight ? Math.PI / 2 : -Math.PI / 2, 0]}
                    />
                </Instances>
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

        if (!roadModel) return null;

        useEffect(() => {
            if (lightRef.current && targetRef.current) {
                lightRef.current.target = targetRef.current;
            }
        }, []);

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
