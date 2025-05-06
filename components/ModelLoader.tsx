import { fishMeshesAtom, storeAssetsGltfAtom } from "@/atoms";
import { useGLTF } from '@react-three/drei';
import { useSetAtom } from 'jotai';
import { modelsGltfAtom } from '../atoms';
import { useEffect } from "react";
import * as THREE from 'three'

export const ModelLoader = () => {
    const modelsGltf = useGLTF('/models.glb');
    const storeAssetsGltf = useGLTF('/store_assets.glb');
    const fishGltf = useGLTF('/fish.glb');
    const setModelsGltf = useSetAtom(modelsGltfAtom);
    const setStoreAssetsGltf = useSetAtom(storeAssetsGltfAtom);
    const setFishMeshes = useSetAtom(fishMeshesAtom);

    useEffect(() => {
        // @ts-expect-error idk why this is throwing an error
        setModelsGltf(modelsGltf);
        // @ts-expect-error idk why this is throwing an error
        setStoreAssetsGltf(storeAssetsGltf);
        const meshes = {}

        fishGltf?.scene.traverse((obj) => {
            // @ts-expect-error idk why this is throwing an error
            if (obj.isMesh && obj.name) {
                obj.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        if (!Array.isArray(child.material)) {
                            const clonedMat = child.material.clone();
                            clonedMat.transparent = true;
                            clonedMat.opacity = 1;
                            child.material = clonedMat;
                        }
                        child.position.set(0, 0, 0);
                        child.updateMatrix();
                    }
                });

                // @ts-expect-error idk why this is throwing an error
                meshes[obj.name] = obj as THREE.Mesh
            }
        })

        setFishMeshes(meshes);
    }, []);

    return null;
};