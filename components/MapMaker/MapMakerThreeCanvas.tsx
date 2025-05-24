"use client";

import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import {
  Dispatch,
  SetStateAction,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { MapMakerGround } from "@/components/MapMaker/MapMakerGround";
import {
  Environment,
  OrbitControls,
  PerformanceMonitor,
  PerspectiveCamera,
} from "@react-three/drei";
import { useAtom, useAtomValue } from "jotai";
import {
  settingsAtom,
  selectedObstacleAtom,
  segmentLengthsAtom,
} from "@/atoms";
import {
  MAX_MOBILE_WIDTH,
  MAX_MOBILE_HEIGHT,
  possibleObstacles,
} from "@/utils";
import { ModelLoader } from "@/components/ModelLoader";
import { AxisControl } from "@/components/MapMaker/AxisControl";
import SearchableDropdown from "@/components/MapMaker/Dropdown";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import toast from "react-hot-toast";
import { IChunk } from "../shared";
import { PostProcessingEffects, PostProcessingMenu } from "../PostProcessing";

const radToDeg = (rad: number) => rad * (180 / Math.PI);
const degToRad = (deg: number) => deg * (Math.PI / 180);

export type Segments = {
  chunks: {
    obstacles: {
      name: string;
      position: number[];
      rotation: number[];
      scale: number;
      type: string;
    }[];
  }[];
}[];

const mapToJSONString = (segments: Segments) =>
  JSON.stringify(segments.flatMap((x) => x.chunks).flat());

const getSegmentsWithRadians = (
  segments: Segments,
  segmentLengths: number[][],
) =>
  segments.map((segment, i) => ({
    ...segment,
    chunks: segment.chunks.map((chunk, j) => {
      return {
        ...chunk,
        length: segmentLengths?.[i]?.[j] || 0,
        obstacles: chunk.obstacles.map((obstacle) => ({
          ...obstacle,
          rotation: obstacle.rotation.map(degToRad),
        })),
      }
    })
  }));

const getSegmentsWithLengths = (
  segments: Segments,
  segmentLengths: number[][],
) =>
  segments.map((segment, i) => ({
    ...segment,
    chunks: segment.chunks.map((chunk, j) => ({
      ...chunk,
      length: segmentLengths?.[i]?.[j] || 0,
    })),
  }));

const roundUpToTenThousandth = (value: number) =>
  Math.ceil(value * 100000) / 100000;

export const MapMakerThreeCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const settings = useAtomValue(settingsAtom);
  const [selectedObstacle, setSelectedObstacle] = useAtom(selectedObstacleAtom);
  const segmentLengths = useAtomValue(segmentLengthsAtom);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [dropdownSelectedObstacle, setDropdownSelectedObstacle] =
    useState<string>(possibleObstacles[0]);
  const [displayChunkBoundaries, setDisplayChunkBoundaries] = useState(true);
  const [displayPlayerBoundaries, setDisplayPlayerBoundaries] = useState(true);
  const [segments, _setSegments] = useState<Segments>(() => {
    if (typeof window === "undefined") return [{ chunks: [{ obstacles: [] }] }];

    try {
      const param = new URLSearchParams(window.location.search).get(
        "custom-map",
      );
      if (!param) return [{ chunks: [{ obstacles: [] }] }];
      const parsed = JSON.parse(
        decompressFromEncodedURIComponent(param),
      ) as IChunk[];
      return [{ chunks: parsed }];
    } catch {
      return [{ chunks: [{ obstacles: [] }] }];
    }
  });

  const setSegments: Dispatch<SetStateAction<Segments>> = (value) => {
    _setSegments((prev) =>
      typeof value === "function"
        ? (value as (p: Segments) => Segments)(prev)
        : value,
    );
  };

  useEffect(() => {
    if (segments.length === 0) return;

    try {
      const segmentsWithLengths = getSegmentsWithLengths(
        segments,
        segmentLengths,
      );
      const params = new URLSearchParams(window.location.search);
      const jsonString = mapToJSONString(segmentsWithLengths);
      const compressed = compressToEncodedURIComponent(jsonString);
      params.set("custom-map", compressed);

      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`,
      );
    } catch {
      toast.error("Failed to store changes in the URL");
    }
  }, [segments, segmentLengths]);

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: Math.min(window.innerWidth, MAX_MOBILE_WIDTH),
        height: Math.min(window.innerHeight, MAX_MOBILE_HEIGHT),
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const selectedObstacleArray = selectedObstacle && selectedObstacle.split("-");
  const [, selectedChunk, , selectedSegment, selectedObstacleIndex] =
    (selectedObstacleArray && selectedObstacleArray.map(Number)) as [
      number,
      number,
      number,
      number,
      number,
    ];
  const selectedObstacleObject =
    segments?.[selectedSegment]?.chunks?.[selectedChunk]?.obstacles?.[
    selectedObstacleIndex
    ];

  const axis = ["X", "Y", "Z"] as const;

  const PositionControl = ({ index }: { index: 0 | 1 | 2 }) => {
    const setPosition = (v: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment].chunks[selectedChunk].obstacles[
          selectedObstacleIndex
        ].position[index] = roundUpToTenThousandth(v);
        if (axis[index] === "Z") {
          next[selectedSegment].chunks[selectedChunk].obstacles[
            selectedObstacleIndex
          ].position[2] = Math.max(roundUpToTenThousandth(v), 0);
        }
        return next;
      });

    return (
      <AxisControl
        label={axis[index]}
        value={selectedObstacleObject?.position[index] ?? 0}
        setValue={setPosition}
        steps={[0.1, 0.5]}
        prepare={roundUpToTenThousandth}
        presets={
          index === 0
            ? [
              { label: "L", value: -2.5 },
              { label: "M", value: 0 },
              { label: "R", value: 2.5 },
            ]
            : []
        }
      />
    );
  };


  const RotationControl = ({ index }: { index: 0 | 1 | 2 }) => {
    const setRotation = (v: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment].chunks[selectedChunk].obstacles[
          selectedObstacleIndex
        ].rotation[index] = v;
        return next;
      });

    return (
      <AxisControl
        label={axis[index]}
        value={selectedObstacleObject?.rotation[index] ?? 0}
        setValue={setRotation}
        steps={[1, 5]}
        presets={[
          { label: "R", value: 90 },
          { label: "T", value: 180 },
          { label: "F", action: -1 },
        ]}
      />
    );
  };

  const ScaleControl = () => {
    const adjustScale = (delta: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment].chunks[selectedChunk].obstacles[
          selectedObstacleIndex
        ].scale += delta;
        return next;
      });

    const setTo = (value: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment].chunks[selectedChunk].obstacles[
          selectedObstacleIndex
        ].scale = value;
        return next;
      });

    return (
      <div className="flex gap-2 items-center bg-gray-200 rounded-md p-1 max-w-min">
        <input
          type="text"
          value={selectedObstacleObject?.scale}
          className="max-w-[60px] bg-white rounded-md px-1"
          onChange={(e) => {
            e.preventDefault();
            const value = parseFloat(e.target.value.trim()) || 0;
            setTo(value);
            e.target.focus();
          }}
        />
        <button
          className="p-1 bg-green-500 rounded-md max-w-min"
          onClick={() => adjustScale(0.2)}
        >
          +
        </button>
        <button
          className="p-1 bg-red-500 rounded-md max-w-min"
          onClick={() => adjustScale(-0.2)}
        >
          -
        </button>
      </div>
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return toast.error("No file selected");

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const text = e.target?.result as string;
        const jsonData = JSON.parse(text) as IChunk[];
        const preparedData = jsonData.map((chunk) => ({
          ...chunk,
          obstacles: chunk.obstacles.map((obstacle) => ({
            ...obstacle,
            rotation: obstacle.rotation.map(radToDeg),
          })),
        }));
        setSegments([{ chunks: preparedData }]);
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    };
    reader.readAsText(file);
  };

  const segmentsWithRadians = getSegmentsWithRadians(segments, segmentLengths);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex justify-between absolute inset-0 overflow-hidden bg-black"
    >
      <PostProcessingMenu collapsed />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Canvas
          style={{
            width: dimensions.width,
            height: dimensions.height,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
          gl={{
            antialias: settings.antialiasing,
            powerPreference: "high-performance",
          }}
          dpr={settings.dpr}
          shadows={settings.shadows}
        >
          <PerformanceMonitor
            onChange={(api) => console.log("FPS:", api.fps)}
          />
          <ModelLoader />
          <PerspectiveCamera
            makeDefault
            fov={75}
            near={0.5}
            far={20000}
            position={[
              1.2893086911256295, 30.852080096367917, 63.07371076093109,
            ]}
            rotation={[
              -0.4549245505405106, 0.018360238206654656, 0.008980040698515523,
            ]}
          />
          <Suspense>
            <Physics gravity={[0, -9.81, 0]} timeStep="vary">
              <MapMakerGround
                makerSegments={segmentsWithRadians.map((segment, i) => ({
                  ...segment,
                  chunks: segment.chunks.map((chunk, j) => ({
                    ...chunk,
                    isSelected: i === selectedSegment && j === selectedChunk,
                  })),
                }))}
                displayChunkBoundaries={displayChunkBoundaries}
                debug={displayPlayerBoundaries}
              />
            </Physics>
          </Suspense>

          <OrbitControls makeDefault enablePan enableZoom enableRotate />

          <Environment backgroundRotation={[-0.2, 0, 0]} background files={'/sky.hdr'} />
          <PostProcessingEffects />
        </Canvas>
      )}

      <div className="h-screen">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 relative">
            <SearchableDropdown
              options={possibleObstacles}
              selected={dropdownSelectedObstacle}
              onSelect={setDropdownSelectedObstacle}
            />
            <button
              className="py-1 bg-green-500 rounded-md px-3"
              onClick={() => {
                if (!dropdownSelectedObstacle) return;

                let type = "obstacle";
                if (dropdownSelectedObstacle === "ramp") {
                  type = "ramp";
                } else if (["fish", "pickup/fish"].includes(dropdownSelectedObstacle)) {
                  type = "reward";
                }

                const obstacle = {
                  name: dropdownSelectedObstacle,
                  position: [0, 0, 0],
                  rotation: [90, 0, 0],
                  scale: 1,
                  type,
                };

                setSegments((prev) => {
                  const next = [...prev];
                  const len =
                    next[selectedSegment].chunks[selectedChunk].obstacles.push(
                      obstacle,
                    );
                  setSelectedObstacle(
                    `chunk-${selectedChunk}-segment-${selectedSegment}-${len - 1}`,
                  );
                  return next;
                });
              }}
            >
              +
            </button>
          </div>

          {selectedObstacle && selectedObstacleObject && (
            <div className="flex flex-col items-center gap-1 bg-white rounded-md p-1">
              <p>Selected: {selectedObstacleObject.name}</p>
              <button
                className="p-1 bg-red-500 rounded-md max-w-min"
                onClick={() =>
                  setSegments((prev) => {
                    const next = [...prev];
                    const newObstacles = next[selectedSegment].chunks[
                      selectedChunk
                    ].obstacles.filter((_, i) => i !== selectedObstacleIndex);

                    next[selectedSegment].chunks[selectedChunk].obstacles =
                      newObstacles;

                    setSelectedObstacle(
                      `chunk-${selectedChunk}-segment-${selectedSegment}-${newObstacles.length}`,
                    );
                    return next;
                  })
                }
              >
                Remove
              </button>
              <button
                className="p-1 bg-blue-500 rounded-md max-w-min"
                onClick={() =>
                  setSegments((prev) => {
                    const next = [...prev];
                    const newObstacle = {
                      ...selectedObstacleObject,
                      position: [
                        selectedObstacleObject.position[0],
                        selectedObstacleObject.position[1],
                        selectedObstacleObject.position[2] + 1,
                      ],
                    };
                    const newIndex = next[selectedSegment].chunks[selectedChunk].obstacles.push(
                      newObstacle,
                    );
                    setSelectedObstacle(
                      `chunk-${selectedChunk}-segment-${selectedSegment}-${newIndex - 1}`,
                    );
                    return next;
                  })
                }
              >
                Duplicate
              </button>



              <p className="text-center">Move</p>
              <div className="grid grid-cols-3 gap-1">
                <PositionControl index={0} />
                <PositionControl index={1} />
                <PositionControl index={2} />
              </div>

              <p className="text-center">Rotate</p>
              <div className="grid grid-cols-3 gap-1">
                <RotationControl index={0} />
                <RotationControl index={1} />
                <RotationControl index={2} />
              </div>

              <p className="text-center">Scale</p>
              <ScaleControl />
            </div>
          )}
        </div>
      </div>

      {/* ----------------- UI Panel: Chunk & file controls ----------------- */}
      <div className="h-screen">
        <div className="flex flex-col gap-2">
          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() => setDisplayChunkBoundaries(!displayChunkBoundaries)}
          >
            Toggle Chunk Boundaries
          </button>
          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() => setDisplayPlayerBoundaries(!displayPlayerBoundaries)}
          >
            Toggle Player Boundaries
          </button>

          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() =>
              setSegments((prev) => {
                const next = [...prev];
                const len = next[selectedSegment].chunks.push({
                  obstacles: [],
                });
                setSelectedObstacle(
                  `chunk-${len - 1}-segment-${selectedSegment}-0`,
                );
                return next;
              })
            }
          >
            Add New Chunk
          </button>

          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() =>
              setSegments((prev) => {
                const next = [...prev];
                setSelectedObstacle(`chunk-0-segment-${selectedSegment}-0`);
                next[selectedSegment].chunks = next[
                  selectedSegment
                ].chunks.filter((_, i) => i !== selectedChunk);
                if (next[selectedSegment].chunks.length === 0) {
                  next[selectedSegment].chunks.push({ obstacles: [] });
                }
                return next;
              })
            }
          >
            Remove Selected Chunk
          </button>

          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() => {
              const jsonString = mapToJSONString(segmentsWithRadians);
              const blob = new Blob([jsonString], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `noot-slide-${new Date()
                .toLocaleDateString()
                .replaceAll("/", "-")}-${new Date()
                  .toLocaleTimeString()
                  .replace(" ", "-")}.json`;
              a.click();
            }}
          >
            Export JSON
          </button>

          <button
            className="p-1 bg-white rounded-md max-w-min"
            onClick={() => {
              if (segments[0].chunks[0].obstacles.length > 0) {
                const cont = window.confirm(
                  "Importing will overwrite current changes. Continue?",
                );
                if (!cont) return;
              }
              fileInputRef.current?.click();
            }}
          >
            Import JSON
          </button>
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <button
            className="p-1 bg-green-500 rounded-md max-w-min"
            onClick={() => {
              let url = window.location.href.replace("map-maker", "");
              url += `&debug=${displayPlayerBoundaries}`;

              window.open(
                url,
                "_blank",
              )
            }
            }
          >
            PLAYTEST
          </button>
        </div>
      </div>
    </div>
  );
};
