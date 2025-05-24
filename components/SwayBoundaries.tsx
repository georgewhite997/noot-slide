import { SEGMENT_LENGTH } from "./shared";

import { PLAYER_COLLIDER_WIDTH } from "./Player";
import { lanes } from "./shared";

const colors = ['rgb(255, 0, 0)', 'rgb(255, 100, 0)', 'rgb(255, 200, 0)']

export const SwayBoundaries = () => {
    const left = -0.55 - PLAYER_COLLIDER_WIDTH;
    const right = 0.55 + PLAYER_COLLIDER_WIDTH;


    return (
        <>
            {lanes.map((lane, index) => (
                <group key={`${index}-${lane}`}>
                    <mesh
                        position={[left - lane, 0, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        <boxGeometry args={[SEGMENT_LENGTH, 0.1, 1]} />
                        <meshStandardMaterial color={colors[index]} transparent opacity={0.5} />
                    </mesh>
                    <mesh
                        position={[right - lane, 0, 0]}
                        rotation={[0, 0, Math.PI / 2]}
                    >
                        <boxGeometry args={[SEGMENT_LENGTH, 0.01, 1]} />
                        <meshStandardMaterial color={colors[index]} transparent opacity={0.5} />
                    </mesh>
                </group>
            ))}
        </>
    )
}

