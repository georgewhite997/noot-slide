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
import { IChunk, IObstacle } from "../shared";

const radToDeg = (rad: number) => {
  return rad * (180 / Math.PI);
};

const degToRad = (deg: number) => {
  return deg * (Math.PI / 180);
};

const mapToJSONString = (segments: Segments) => {
  const arr = segments.flatMap((x) => x.chunks).flat();
  return JSON.stringify(arr);
};

const getSegmentsWithRadians = (
  segments: Segments,
  segmentLengths: number[][],
) => {
  return segments.map((segment, i) => {
    return {
      ...segment,
      chunks: segment.chunks.map((chunk, j) => {
        return {
          ...chunk,
          length: segmentLengths?.[i]?.[j] || 0,
          obstacles: chunk.obstacles.map((obstacle) => {
            return {
              ...obstacle,
              rotation: obstacle.rotation.map(degToRad),
            };
          }),
        };
      }),
    };
  });
};

const getSegmentsWithLengths = (
  segments: Segments,
  segmentLengths: number[][],
) => {
  return segments.map((segment, i) => {
    return {
      ...segment,
      chunks: segment.chunks.map((chunk, j) => {
        return {
          ...chunk,
          length: segmentLengths?.[i]?.[j] || 0,
        };
      }),
    };
  });
};

type Segments = {
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

export const MapMakerThreeCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const settings = useAtomValue(settingsAtom);
  const [selectedObstacle, setSelectedObstacle] = useAtom(selectedObstacleAtom);
  const [dropdownSelectedObstacle, setDropdownSelectedObstacle] =
    useState<string>(possibleObstacles[0]);
  const segmentLengths = useAtomValue(segmentLengthsAtom);
  const [displayChunkBoundaries, setDisplayChunkBoundaries] = useState(true);

  const [segments, _setSegments] = useState<Segments>([
    {
      chunks: [
        {
          obstacles: [],
        },
      ],
    },
  ]);

  const setSegments: React.Dispatch<React.SetStateAction<Segments>> = (
    value,
  ) => {
    _setSegments((prev) => {
      const next =
        typeof value === "function"
          ? (value as (p: Segments) => Segments)(prev)
          : value;

      try {
        if (segments.length > 0) {
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
            window.location.pathname + "?" + params.toString(),
          );
        }
      } catch {
        toast.error("Failed to store changes in the URL");
      }

      return next;
    });
  };

  const updateDimensions = () => {
    const width = Math.min(window.innerWidth, MAX_MOBILE_WIDTH);
    const height = Math.min(window.innerHeight, MAX_MOBILE_HEIGHT);
    setDimensions({ width, height });
  };

  useEffect(() => {
    updateDimensions();

    const params = new URLSearchParams(window.location.search);
    const customMap = params.get("custom-map");
    if (customMap) {
      const parsed = JSON.parse(
        decompressFromEncodedURIComponent(customMap),
      ) as IChunk[];
      _setSegments([{ chunks: parsed }]);
    }

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

  const axis = ["X", "Y", "Z"];

  const PositionControl = ({ index }: { index: number }) => {
    const setPosition = (v: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment].chunks[selectedChunk!].obstacles[
          selectedObstacleIndex!
        ].position[index] = roundUpToTenThousandth(v);
        if (axis[index] === "Z") {
          next[selectedSegment].chunks[selectedChunk!].obstacles[
            selectedObstacleIndex!
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

  const RotationControl = ({ index }: { index: number }) => {
    const setRotation = (v: number) =>
      setSegments((prev) => {
        const next = [...prev];
        next[selectedSegment!].chunks[selectedChunk!].obstacles[
          selectedObstacleIndex!
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
    const setTo = (value: number) => {
      setSegments((prev) => {
        const newSegments = [...prev];
        newSegments[selectedSegment as number].chunks[
          selectedChunk as number
        ].obstacles[selectedObstacleIndex as number].scale = value;
        return newSegments;
      });
    };

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
          onClick={() => {
            setTo(
              segments[selectedSegment as number].chunks[
                selectedChunk as number
              ].obstacles[selectedObstacleIndex as number].scale + 0.2,
            );
          }}
        >
          +
        </button>
        <button
          className="p-1 bg-red-500 rounded-md max-w-min"
          onClick={() => {
            setTo(
              segments[selectedSegment as number].chunks[
                selectedChunk as number
              ].obstacles[selectedObstacleIndex as number].scale - 0.2,
            );
          }}
        >
          -
        </button>
      </div>
    );
  };

  function roundUpToTenThousandth(value: number) {
    return Math.ceil(value * 100000) / 100000;
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      alert("No file selected");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const text = e.target?.result as string;
        const jsonData: unknown = JSON.parse(text);
        const data = jsonData as IChunk[];
        const preparedData = data.map((chunk) => {
          return {
            ...chunk,
            obstacles: chunk.obstacles.map((obstacle) => {
              return { ...obstacle, rotation: obstacle.rotation.map(radToDeg) };
            }),
          };
        });
        _setSegments([{ chunks: preparedData }]);
      } catch (err) {
        console.error("Error parsing JSON:", err);
      }
    };
    reader.readAsText(file);
  };

  const segmentsWithRadians = getSegmentsWithRadians(segments, segmentLengths);

  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full flex justify-between absolute inset-0 overflow-hidden bg-black"
      >
        {dimensions.width > 0 && dimensions.height > 0 && (
          <>
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
                onChange={(api) => {
                  console.log("FPS:", api.fps);
                }}
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
                  -0.4549245505405106, 0.018360238206654656,
                  0.008980040698515523,
                ]}
              />
              <ambientLight color={0x787878} intensity={1} />
              <Suspense>
                <Physics gravity={[0, -9.81, 0]} timeStep="vary">
                  <MapMakerGround
                    makerSegments={segmentsWithRadians.map((segment, i) => ({
                      ...segment,
                      chunks: segment.chunks.map((chunk, j) => ({
                        ...chunk,
                        isSelected:
                          i === selectedSegment && j === selectedChunk,
                      })),
                    }))}
                    displayChunkBoundaries={displayChunkBoundaries}
                  />
                </Physics>
              </Suspense>

              <OrbitControls
                makeDefault
                enablePan={true} // Allows WASD and right-click panning
                enableZoom={true} // Allows scroll wheel zooming
                enableRotate={true} // Allows left-click rotation
              />
            </Canvas>
          </>
        )}

        <div className="h-screen">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 relative">
              <SearchableDropdown
                options={possibleObstacles}
                selected={dropdownSelectedObstacle}
                onSelect={(value) => setDropdownSelectedObstacle(value)}
              />
              <button
                className="py-1 bg-green-500 rounded-md px-3"
                onClick={() => {
                  if (dropdownSelectedObstacle) {
                    const obstacle = {
                      name: dropdownSelectedObstacle,
                      position: [0, 0, 0],
                      rotation: [0, 0, 0],
                      scale: 1,
                      type:
                        dropdownSelectedObstacle === "ramp"
                          ? "ramp"
                          : ["fish", "pickup/fish"].includes(
                                dropdownSelectedObstacle,
                              )
                            ? "reward"
                            : "obstacle",
                    };
                    setSegments((prev) => {
                      const newSegments = [...prev];
                      const len =
                        newSegments[selectedSegment].chunks[
                          selectedChunk
                        ].obstacles.push(obstacle);
                      setSelectedObstacle(
                        `chunk-${selectedChunk}-segment-${selectedSegment}-${len - 1}`,
                      );
                      return newSegments;
                    });
                  }
                }}
              >
                +
              </button>
            </div>

            {selectedObstacle && selectedObstacleObject && (
              <div className="flex flex-col items-center gap-1 bg-white rounded-md p-1">
                <p>Selected: {selectedObstacleObject?.name}</p>
                <button
                  className="p-1 bg-red-500 rounded-md max-w-min"
                  onClick={() => {
                    setSegments((prev) => {
                      const newSegments = [...prev];
                      const newObstacles = newSegments[selectedSegment].chunks[
                        selectedChunk
                      ].obstacles.filter(
                        (_: any, i: number) => i !== selectedObstacleIndex,
                      );

                      newSegments[selectedSegment].chunks[
                        selectedChunk
                      ].obstacles = newObstacles;

                      setSelectedObstacle(
                        `chunk-${selectedChunk}-segment-${selectedSegment}-${newObstacles.length}`,
                      );
                      return newSegments;
                    });
                  }}
                >
                  Remove
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

        <div className="h-screen">
          <div className="flex flex-col gap-2">
            <button
              className="p-1 bg-white rounded-md max-w-min"
              onClick={() => {
                setDisplayChunkBoundaries(!displayChunkBoundaries);
              }}
            >
              Toggle Chunk Boundaries
            </button>
            <button
              className="p-1 bg-white rounded-md max-w-min"
              onClick={() => {
                setSegments((prev) => {
                  const newSegments = [...prev];
                  const len = newSegments[selectedSegment].chunks.push({
                    obstacles: [],
                  });

                  setSelectedObstacle(
                    `chunk-${len - 1}-segment-${selectedSegment}-0`,
                  );
                  return newSegments;
                });
              }}
            >
              Add New Chunk
            </button>
            <button
              className="p-1 bg-white rounded-md max-w-min"
              onClick={() => {
                setSegments((prev) => {
                  const newSegments = [...prev];
                  setSelectedObstacle(`chunk-0-segment-${selectedSegment}-0`);
                  newSegments[selectedChunk].chunks = newSegments[
                    selectedSegment
                  ].chunks.filter((_, i) => i !== selectedChunk);
                  if (newSegments[selectedSegment].chunks.length === 0) {
                    newSegments[selectedSegment].chunks.push({ obstacles: [] });
                  }
                  return newSegments;
                });
              }}
            >
              Remove Selected Chunk
            </button>
            <button
              className="p-1 bg-white rounded-md max-w-min"
              onClick={() => {
                const jsonString = mapToJSONString(segmentsWithRadians);
                const blob = new Blob([jsonString], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `noot-slide-${new Date().toLocaleDateString()}-${new Date().toLocaleTimeString().replace(" ", "-")}.json`;
                a.click();
              }}
            >
              Export JSON
            </button>
            <button
              className="p-1 bg-white rounded-md max-w-min"
              onClick={() => {
                if (segments[0].chunks[0].obstacles.length > 0) {
                  alert(
                    "If you select a file, all your current changes will be overwritten. Are you sure you want to continue?",
                  );
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
                window.open(
                  window.location.href.replace("map-maker", ""),
                  "_blank",
                );
              }}
            >
              PLAYTEST
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
