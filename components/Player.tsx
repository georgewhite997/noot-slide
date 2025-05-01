import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import * as THREE from "three";
import { useRef, useEffect, memo, useState } from "react";
import {
  CollisionEnterHandler,
  IntersectionEnterHandler,
  RapierRigidBody,
  RigidBody,
} from "@react-three/rapier";
import { SLOPE_ANGLE, lanes } from "./shared";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { abstractSessionAtom, currentFishesAtom, gameStateAtom, haloQuantityAtom, hasFishingNetAtom, hasMultiplierAtom, hasSlowSkisAtom, reviveCountAtom, scoreAtom } from "@/atoms";
import { useAbstractClient } from "@abstract-foundation/agw-react";
import { chain, items, powerupsContractAddress } from "@/utils";
import { parseAbi } from "viem";

const LANE_TRANSITION_SPEED = 2.5;
const CAMERA_POSITION_SMOOTHING = 3; // Lower = smoother but slower
const CAMERA_LOOKAT_SMOOTHING = 5; // Lower = smoother but slower
const SWAY_AMPLITUDE = 0.035;
const MAX_REVIVE_COUNT = 3;

const PLAYER_START_POSITION = new THREE.Vector3(0, 10, -20);

export const Player = memo(function Player({ onChunkRemoved }: { onChunkRemoved: (chunkName: string) => void }) {
  const [score, setScore] = useAtom(scoreAtom);
  const ref = useRef<RapierRigidBody>(null);
  const lastCollided = useRef('')
  const cameraTargetRef = useRef(new THREE.Vector3(0, 0, 0));
  const cameraLookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const initialZPosition = useRef<number | null>(null);
  const lane = useRef<number>(1); // Lane index: 0 (left), 1 (middle), 2 (right)
  const mixer = useRef<THREE.AnimationMixer>(null);
  const isJumping = useRef(false);
  const isOnGround = useRef(true);
  const skiingAction = useRef<THREE.AnimationAction | null>(null);
  const jumpAction = useRef<THREE.AnimationAction | null>(null);
  const slideAction = useRef<THREE.AnimationAction | null>(null);
  const backflipAction = useRef<THREE.AnimationAction | null>(null);
  const deathAction = useRef<THREE.AnimationAction | null>(null);
  const rightTurnAction = useRef<THREE.AnimationAction | null>(null);
  const leftTurnAction = useRef<THREE.AnimationAction | null>(null);
  const lastRemovedName = useRef<string>('');
  const hasHalo = useRef(false);
  const [reviveCount, setReviveCount] = useAtom(reviveCountAtom);
  const hasSlowSkis = useAtomValue(hasSlowSkisAtom);

  const magnetCollectedAt = useRef<number>(0);
  const magnetDuration = useRef<number>(0);

  const multiplierCollectedAt = useRef<number>(0);
  const multiplierDuration = useRef<number>(0);
  const [haloQuantity, setHaloQuantity] = useAtom(haloQuantityAtom);
  const [hasMultiplier, setHasMultiplier] = useAtom(hasMultiplierAtom);

  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const isTouchActive = useRef<boolean>(false);
  const abstractSession = useAtomValue(abstractSessionAtom);

  const targetZVelocity = useRef(-3);
  const lastTakenFishes = useRef<Set<string>>(new Set());

  const [gameState, setGameState] = useAtom(gameStateAtom);
  const setCurrentFishes = useSetAtom(currentFishesAtom);
  const isVisible = useRef(true)

  const [hasFishingNet, setHasFishingNet] = useAtom(hasFishingNetAtom);

  const gltf = useLoader(GLTFLoader, "/animations.glb");

  const endGame = () => {
    playDeathAnimation();
    if (reviveCount < MAX_REVIVE_COUNT) {
      if (gameState !== 'reviving') {
        setReviveCount((r) => r + 1);
        setGameState("reviving");
      }
    } else {
      setGameState("game-over");
      // playDeathAnimation()
      lastTakenFishes.current = new Set<string>();
      ref.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      ref.current?.lockTranslations(true, true);

    }
  };


  const startMovingAnimation = () => {
    if (!mixer.current || !skiingAction.current) return;

    mixer.current?.stopAllAction();
    skiingAction.current?.play(); // Start the animation
  };

  useEffect(() => {
    if (!gltf.animations || !gltf.animations.length) return;

    mixer.current = new THREE.AnimationMixer(gltf.scene);

    const animations = {
      skiing: gltf.animations.find((a) => a.name === "skiing"),
      backflip: gltf.animations.find((a) => a.name === "flip"),
      death: gltf.animations.find((a) => a.name === "death"),
      jump: gltf.animations.find((a) => a.name === "jump"),
      rightTurn: gltf.animations.find((a) => a.name === "right_turn"),
      leftTurn: gltf.animations.find((a) => a.name === "left_turn"),
      slide: gltf.animations.find((a) => a.name === "slide"),
    };

    if (Object.values(animations).some((anim) => !anim)) {
      alert("Error: Missing animations");
      return;
    }

    // Filter position tracks once
    animations.jump!.tracks = animations.jump!.tracks.filter(
      (track) => !track.name.includes(".position"),
    );
    animations.backflip!.tracks = animations.backflip!.tracks.filter(
      (track) => !track.name.includes(".position"),
    );

    // Create actions
    skiingAction.current = mixer.current.clipAction(animations.skiing!);
    jumpAction.current = mixer.current.clipAction(animations.jump!);
    backflipAction.current = mixer.current.clipAction(animations.backflip!);
    deathAction.current = mixer.current.clipAction(animations.death!);
    rightTurnAction.current = mixer.current.clipAction(animations.rightTurn!);
    leftTurnAction.current = mixer.current.clipAction(animations.leftTurn!);
    slideAction.current = mixer.current.clipAction(animations.slide!);


    if (skiingAction.current) {
      skiingAction.current.play();
    }

    mixer.current?.addEventListener("finished", onAnimationFinished);

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return () => {
      mixer.current?.removeEventListener("finished", onAnimationFinished);
    }

  }, [gltf]);

  const onAnimationFinished = (e: { action: THREE.AnimationAction }) => {
    if (e.action === backflipAction.current || e.action === jumpAction.current || e.action === rightTurnAction.current) {
      mixer.current?.stopAllAction();
      if (skiingAction.current) {
        skiingAction.current.time = 0.2;
        skiingAction.current.setLoop(THREE.LoopRepeat, Infinity);
        skiingAction.current.play();
      }
    }

    if (e.action === leftTurnAction.current || e.action === slideAction.current) {
      mixer.current?.stopAllAction();
      if (skiingAction.current) {
        skiingAction.current.time = 1.15;
        skiingAction.current.setLoop(THREE.LoopRepeat, Infinity);
        skiingAction.current.play();
      }
    }
  }

  useEffect(() => {
    if (gameState === "playing" && reviveCount === 0) {
      ref.current?.setTranslation(PLAYER_START_POSITION, true);
      ref.current?.setLinvel({ x: 0, y: 0, z: -0.5 }, true);
      ref.current?.lockTranslations(false, false);
      startMovingAnimation();
      lane.current = 1;
      isJumping.current = false;
    }

    if (reviveCount > 0 && gameState === "playing") {
      onChunkRemoved(lastCollided.current)
      lastCollided.current = ''
      startMovingAnimation();
    }


  }, [gameState]);

  const playDeathAnimation = () => {
    if (!deathAction.current) {
      return;
    }
    // stop the current animation
    mixer.current?.stopAllAction();

    deathAction.current.setLoop(THREE.LoopOnce, 1);
    deathAction.current.clampWhenFinished = true;
    deathAction.current.play();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "a" || key === "arrowleft") {
        const currentLane = lane.current;
        if (currentLane > 0) {
          if (isOnGround.current) {
            playLeftTurnAnimation();
          }
          lane.current = currentLane - 1;
        }
      }
      if (key === "d" || key === "arrowright") {
        const currentLane = lane.current;
        if (currentLane < 2) {
          if (isOnGround.current) {
            playRightTurnAnimation();
          }
          lane.current = currentLane + 1;
        }
      }

      if (key === " " || key === "space" || key === "w" || key === "arrowup") {
        jump();
      }

      if (key === "s" || key === "arrowdown") {
        slide();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      isTouchActive.current = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouchActive.current) return;

      const touchEndX = e.touches[0].clientX;
      const touchEndY = e.touches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Process horizontal swipes
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 20) { // Swipe right
          const currentLane = lane.current;
          if (currentLane < 2) {
            if (isOnGround.current) {
              playRightTurnAnimation();
            }
            lane.current = currentLane + 1;
          }
          isTouchActive.current = false;
        } else if (deltaX < -20) { // Swipe left
          const currentLane = lane.current;
          if (currentLane > 0) {
            if (isOnGround.current) {
              playLeftTurnAnimation();
            }
            lane.current = currentLane - 1;
          }
          isTouchActive.current = false;
        }
      }
      // Process vertical swipes
      else if (Math.abs(deltaY) > 20) {
        if (deltaY < -20) { // Swipe up
          jump();
          isTouchActive.current = false;
        } else if (deltaY > 20) { // Swipe down
          slide();
          isTouchActive.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isTouchActive.current = false;
    }

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("touchstart", handleTouchStart);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    };
  }, []);

  const { data: agwClient } = useAbstractClient();


  const utilizeHalo = async () => {
    if (!abstractSession || !agwClient) return;
    try {

      const { session, sessionSigner } = abstractSession;
      const sessionClient = agwClient.toSessionClient(sessionSigner, session);

      const hash = await sessionClient?.writeContract({
        account: sessionClient.account,
        chain,
        abi: parseAbi(["function usePowerup(uint16,uint256) public"]),
        address: powerupsContractAddress,
        functionName: "usePowerup",
        args: [items.find(p => p.name === 'Abstract Halo')!.id, BigInt(1)],
      });
      console.log("hash", hash)
    } catch (e) {
      console.log(e)
      endGame();
      playDeathAnimation();
    }
  }

  const jump = () => {
    if (isJumping.current || gameState === "game-over") return;

    isJumping.current = true;
    ref.current?.applyImpulse({ x: 0, y: 10, z: 0 }, true);
    if (!isOnGround.current) {
      playBackflipAnimation();
    } else {
      isOnGround.current = false;
      playJumpAnimation();
    }
  };

  const slide = () => {
    //tutaj to wiecej warunkow powinno byc ale czekam az bedzie ten slide rzeczywiscie dzialac
    if (gameState === "game-over" || gameState === "reviving") return;

    if (!isOnGround.current) {
      ref.current?.applyImpulse({ x: 0, y: -6, z: 0 }, true);
    }

    playSlideAnimation();
  }

  const playSlideAnimation = () => {
    if (!slideAction.current) {
      return;
    }

    mixer.current?.stopAllAction();
    slideAction.current.setLoop(THREE.LoopOnce, 1);
    slideAction.current.time = 0.2;
    slideAction.current.play();
  }


  const playBackflipAnimation = () => {
    if (!backflipAction.current) {
      return;
    }

    mixer.current?.stopAllAction();
    backflipAction.current.setLoop(THREE.LoopOnce, 1);
    backflipAction.current.time = 0.2;
    backflipAction.current.play();
  };

  const playJumpAnimation = () => {
    if (!jumpAction.current) {
      return;
    }

    mixer.current?.stopAllAction();
    jumpAction.current.setLoop(THREE.LoopOnce, 1);
    jumpAction.current.time = 0.2; // Start the animation 0.2 seconds in
    jumpAction.current.play();
  };

  const playRightTurnAnimation = () => {
    if (!rightTurnAction.current || !skiingAction.current || !mixer.current) {
      return;
    }

    mixer.current.stopAllAction();
    rightTurnAction.current.setLoop(THREE.LoopOnce, 1);
    rightTurnAction.current.time = 0.2; // Start the animation 0.2 seconds in
    rightTurnAction.current.setDuration(0.4);
    rightTurnAction.current.play();
  };

  const playLeftTurnAnimation = () => {
    if (!leftTurnAction.current || !skiingAction.current || !mixer.current) {
      return;
    }

    mixer.current.stopAllAction();
    leftTurnAction.current.setLoop(THREE.LoopOnce, 1);
    leftTurnAction.current.time = 0.2; // Start the animation 0.2 seconds in
    leftTurnAction.current.setDuration(0.4);
    leftTurnAction.current.play();
  };

  const { scene } = useThree()

  // Handle collision events
  const handleCollision: CollisionEnterHandler = (event) => {
    if (event.other.rigidBodyObject) {
      const name = event.other.rigidBodyObject.name;

      if (name === "ground" || name === "obstacle-fixed") {
        // console.log({name})
        isJumping.current = false;
      }

      if (
        name === "ground" &&
        skiingAction.current &&
        backflipAction.current &&
        jumpAction.current &&
        slideAction.current
      ) {
        isOnGround.current = true;

        backflipAction.current.stop();
        jumpAction.current.stop();

        if (!skiingAction.current?.isRunning() && !slideAction.current?.isRunning()) {
          skiingAction.current.time = 0.517; // start skiing from the middle
          skiingAction.current?.play();
        }
      }

      if (name === "obstacle-fixed") {
        isOnGround.current = false;
      }

      if (name.startsWith("deadly-obstacle")) {

        let current = event.other.rigidBodyObject.parent;
        let chunk = null;
        for (let i = 0; i < 6 && current; i++) {
          if (current.name?.startsWith('chunk-')) {
            chunk = current;
            break;
          }
          current = current.parent;
        }

        if (hasHalo.current) {
          setHaloQuantity(prev => prev - 1);
          utilizeHalo();

          hasHalo.current = false
          if (chunk) {
            onChunkRemoved(chunk.name);
            lastRemovedName.current = chunk.name;
          }
        } else if (!(chunk?.name) ? true : chunk?.name !== lastRemovedName.current) {
          if (chunk) {
            if (lastCollided.current !== chunk.name) {
              lastCollided.current = chunk.name
              endGame();
            }
          }
        }
      }
    }
  };

  const handleIntersection: IntersectionEnterHandler = (event) => {
    if (!ref.current) return;

    if (event.other.rigidBodyObject) {
      const name = event.other.rigidBodyObject.name;

      if (name === "fishing-net") {
        const currentPosition = ref.current.translation();

        // Initialize initial position if not set
        if (initialZPosition.current === null) {
          initialZPosition.current = currentPosition.z;
        }

        // Calculate and log distance traveled
        if (initialZPosition.current !== null) {
          const distanceTraveled = Math.round(Math.abs(initialZPosition.current - currentPosition.z) * 2);

          let newDuration;

          // Randomly select magnet duration based on rarity
          const rarity = Math.random();
          if (rarity < 0.6) { // 60% chance for common
            newDuration = 100;
          } else if (rarity < 0.9) { // 30% chance for rare
            newDuration = 250;
          } else { // 10% chance for giga rare
            newDuration = 750;
          }

          if (hasFishingNet) {
            magnetDuration.current += newDuration;
          } else {
            magnetCollectedAt.current = distanceTraveled;
            magnetDuration.current = newDuration;
            setHasFishingNet(true);
          }
        }
      }

      if (name === "fish-multiplier") {
        const currentPosition = ref.current.translation();

        // Initialize initial position if not set
        if (initialZPosition.current === null) {
          initialZPosition.current = currentPosition.z;
        }

        // Calculate and log distance traveled
        if (initialZPosition.current !== null) {
          const distanceTraveled = Math.round(Math.abs(initialZPosition.current - currentPosition.z) * 2);

          let newDuration;

          // Randomly select magnet duration based on rarity
          const rarity = Math.random();
          if (rarity < 0.6) { // 60% chance for common
            newDuration = 100;
          } else if (rarity < 0.9) { // 30% chance for rare
            newDuration = 250;
          } else { // 10% chance for giga rare
            newDuration = 750;
          }

          if (hasMultiplier) {
            multiplierDuration.current += newDuration;
          } else {
            multiplierCollectedAt.current = distanceTraveled;
            multiplierDuration.current = newDuration;
            setHasMultiplier(true);
          }
        }
      }

      if (name.startsWith('fish') && !hasFishingNet) {
        const fishUuid = name.split("-")[1];

        if (!lastTakenFishes.current.has(fishUuid)) {
          lastTakenFishes.current.add(fishUuid);
          setCurrentFishes(prev => prev + (hasMultiplier ? 2 : 1));
        }

        if (lastTakenFishes.current.size === 20) {
          const fishesToDelete = Array.from(lastTakenFishes.current.values()).slice(0, 5);
          fishesToDelete.forEach(fish => lastTakenFishes.current.delete(fish));
        }
      }

      if (hasFishingNet && name.startsWith("fish-hitbox")) {
        const fishUuid = name.split("-")[2];

        if (!lastTakenFishes.current.has(fishUuid)) {
          lastTakenFishes.current.add(fishUuid);
          // setCurrentFishes(prev => prev + 1);
          setCurrentFishes(prev => prev + (hasMultiplier ? 2 : 1));
        }

        if (lastTakenFishes.current.size === 20) {
          const fishesToDelete = Array.from(lastTakenFishes.current.values()).slice(0, 5);
          fishesToDelete.forEach(fish => lastTakenFishes.current.delete(fish));
        }
      }
    }
  };

  function getPlayerSine(time: number) {
    const scale = Math.PI / 2 / 0.55;
    const angle = time * scale;
    return Math.sin(angle);
  }

  const idealCameraPosition = new THREE.Vector3(); // Reusable vector
  const lookAtPosition = new THREE.Vector3();

  useFrame(({ camera }, delta) => {
    if (!ref || !("current" in ref) || !ref.current || !isVisible.current) return;


    const maxDelta = 1 / 20; // Clamp to 50ms
    const clampedDelta = Math.min(delta, maxDelta);

    if (mixer.current && gameState !== "in-menu") {
      mixer.current.update(clampedDelta); // Delta is the time between frames
    }

    const halo = scene.getObjectByName("halo");
    if (halo) {
      if (!abstractSession) {
        hasHalo.current = false;
      } else {
        if (hasHalo.current) {
          halo.visible = true;
        } else {
          halo.visible = false;
        }
      }
    }

    // Get current position and velocity
    const currentPosition = ref.current.translation();

    // Initialize initial position if not set
    if (initialZPosition.current === null) {
      initialZPosition.current = currentPosition.z;
    }

    // Calculate and log distance traveled
    if (initialZPosition.current !== null) {
      const distanceTraveled = Math.round(Math.abs(initialZPosition.current - currentPosition.z) * 2);
      if (score != distanceTraveled) {
        setScore(distanceTraveled);
      }

      if (score > magnetCollectedAt.current + magnetDuration.current) {
        setHasFishingNet(false);
        magnetCollectedAt.current = 0;
        magnetDuration.current = 0;
      }

      if (score > multiplierCollectedAt.current + multiplierDuration.current) {
        setHasMultiplier(false);
        multiplierCollectedAt.current = 0;
        multiplierDuration.current = 0;
      }
    }

    const currentVelocity = ref.current.linvel();

    // Target X position based on current lane
    const targetX = lanes[lane.current];
    // Smoothly interpolate to the target lane position
    const newX = THREE.MathUtils.lerp(
      currentPosition.x,
      targetX,
      LANE_TRANSITION_SPEED * clampedDelta,
    );

    const skiingTime = skiingAction.current?.time || 0;

    if (gameState === "game-over" || gameState === "in-menu") {
      ref.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

      setReviveCount(0)
      setHasFishingNet(false);
      setHasMultiplier(false);
      hasHalo.current = haloQuantity > 0;
      lastRemovedName.current = '';
      lastCollided.current = ''
      targetZVelocity.current = -3;
    } else {
      if (
        mixer.current &&
        isOnGround.current &&
        !leftTurnAction.current?.isRunning() &&
        !rightTurnAction.current?.isRunning() && gameState != 'reviving'
      ) {
        ref.current.setTranslation(
          {
            x: newX + getPlayerSine(skiingTime) * SWAY_AMPLITUDE,
            y: currentPosition.y,
            z: currentPosition.z,
          },
          true,
        );
      } else {
        ref.current.setTranslation(
          { x: newX, y: currentPosition.y, z: currentPosition.z },
          true,
        );
      }

      console.log(hasSlowSkis)

      if (!jumpAction.current?.isRunning()) {
        targetZVelocity.current = THREE.MathUtils.lerp(
          targetZVelocity.current,
          -9,
          (0.05 * (hasSlowSkis ? 0.85 : 1)) * clampedDelta,
        );
        const zVelocity = THREE.MathUtils.lerp(
          currentVelocity.z,
          targetZVelocity.current,
          4 * clampedDelta,
        );

        ref.current.setLinvel(
          { x: currentVelocity.x, y: currentVelocity.y, z: zVelocity },
          true,
        );
      } else {
        const speed = currentVelocity.x ** 2 + currentVelocity.z ** 2;
        const dragCoefficient = 0.001; // Adjust based on desired drag
        const dragForce = -dragCoefficient * speed;
        const dragVector = new THREE.Vector3(
          currentVelocity.x,
          0,
          currentVelocity.z,
        )
          .normalize()
          .multiplyScalar(dragForce);
        ref.current.applyImpulse(
          { x: dragVector.x, y: 0, z: dragVector.z },
          true,
        );
      }
    }

    if (slideAction.current?.isRunning() && skiingAction.current) {
      const slideDuration = 1.1;
      const slideTime = slideAction.current.time;
      if (slideTime >= slideDuration) {
        skiingAction.current.time = 1.15;
        slideAction.current.crossFadeTo(skiingAction.current, 0.1, false);
      }
    }

    if (gameState === 'reviving') {
      ref.current.setLinvel(
        { x: 0, y: 0, z: 0 },
        true,
      );

    }

    idealCameraPosition.set(currentPosition.x, currentPosition.y + 3, currentPosition.z + 3);
    cameraTargetRef.current.lerp(
      idealCameraPosition,
      CAMERA_POSITION_SMOOTHING * clampedDelta,
    );

    lookAtPosition.set(currentPosition.x, currentPosition.y + 2, currentPosition.z);
    cameraLookAtRef.current.lerp(
      lookAtPosition,
      CAMERA_LOOKAT_SMOOTHING * clampedDelta,
    );

    camera.position.copy(cameraTargetRef.current);
    camera.lookAt(cameraLookAtRef.current);
  });

  return (
    <RigidBody
      name="player"
      // lockTranslations={gameState === "reviving" ? true : false}
      enabledRotations={[false, false, false]}
      ref={ref}
      position={PLAYER_START_POSITION}
      mass={50}
      friction={0.1}
      onCollisionEnter={handleCollision}
      onIntersectionEnter={handleIntersection}
      rotation={[SLOPE_ANGLE, Math.PI, 0]}
      ccd={true}
    >
      <Halo />
      {/*{hasFishingNet && (
        <FishingNetIndicator />
      )}
      {hasMultiplier && (
        <MultiplierIndicator />
      )}*/}
      <primitive
        object={gltf.scene}
        scale={[10, 10, 10]}
        castShadow
        receiveShadow
      />
    </RigidBody>
  );
}, () => {
  return true;
});


const Halo = memo(function Halo() {
  return (
    <mesh name="halo" visible={false} position={[0, 1.7, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.2, 0.02]} />
      <meshBasicMaterial color="#41f09c" />
    </mesh>
  )
});

const FishingNetIndicator = memo(function FishingNetIndicator() {
  return (
    <mesh position={[0, 2, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.2, 0.02, 0.2]} />
      <meshBasicMaterial color="#FFD700" />
    </mesh>
  )
});

const MultiplierIndicator = memo(function MultiplierIndicator() {
  return (
    <mesh position={[0, 3.5, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.2, 0.02, 0.2]} />
      <meshBasicMaterial color="#00FF00" />
    </mesh>
  )
})