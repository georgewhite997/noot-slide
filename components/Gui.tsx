import {
  useLoginWithAbstract,
  useAbstractClient,
} from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { contractAddress, abi, usePublicClient, equipmentMock } from "@/utils";
import { useEffect, useState, memo } from "react";
import { formatEther } from "viem";
import { useAtom, useSetAtom } from "jotai";
import { gameStateAtom, videoSettingsAtom, currentFishesAtom, scoreAtom } from "@/atoms";
import { toast, Toaster } from "react-hot-toast";

const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (checked: boolean) => void }) => {
  return (
    <div className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onCheckedChange(e.target.checked)} />
    </div>
  )
}

const VideoSettings = ({ onClose }: { onClose: () => void }) => {
  const [videoSettings, setVideoSettings] = useAtom(videoSettingsAtom);

  return (
    <div>
      <h1 className="text-4xl font-bold mb-10">Video Settings</h1>

      <div className="flex gap-4">
        <p>Antialiasing: {videoSettings.antialiasing ? "On" : "Off"}</p>
        <Switch checked={videoSettings.antialiasing} onCheckedChange={() => setVideoSettings((prev) => ({ ...prev, antialiasing: !prev.antialiasing }))} />
      </div>
      <div className="flex gap-4">
        <p>Shadows: {videoSettings.shadows ? "On" : "Off"}</p>
        <Switch checked={videoSettings.shadows} onCheckedChange={() => setVideoSettings((prev) => ({ ...prev, shadows: !prev.shadows }))} />
      </div>
      <div className="flex gap-4">
        <p>Pixel Ratio: {videoSettings.dpr}</p>
        <input type="range" value={videoSettings.dpr} min={1} max={2} step={0.1} onChange={(e) => setVideoSettings((prev) => ({ ...prev, dpr: parseFloat(e.target.value) }))} />
      </div>

      <button
        className="bg-blue-500 text-white p-2 rounded-md"
        onClick={onClose}
      >
        Back to game
      </button>
    </div>
  )
}


export const Gui = memo(function Gui() {
  const { address, status, isConnected } = useAccount();
  const { data: abstractClient } = useAbstractClient();
  const { login, logout } = useLoginWithAbstract();
  const publicClient = usePublicClient();
  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [isChangingVideoSettings, setIsChangingVideoSettings] = useState(false);
  const [equipment, setEquipment] = useState<typeof equipmentMock>(equipmentMock);
  const [currentFishes, setCurrentFishes] = useAtom(currentFishesAtom);
  const [score, setScore] = useAtom(scoreAtom);

  const [{ isRegistered, regsiterFee }, setUserState] = useState({
    isRegistered: false,
    regsiterFee: BigInt(0),
  });

  const fetchWallet = async () => {
    if (publicClient) {
      if (!address) {
        return;
      }

      const [isRegistered, regsiterFee] = await Promise.all([
        publicClient.readContract({
          address: contractAddress,
          abi: abi,
          functionName: "registeredAddresses",
          args: [address as `0x${string}`],
        }),
        publicClient.readContract({
          address: contractAddress,
          abi: abi,
          functionName: "registrationFee",
        }),
      ]);

      setUserState({
        isRegistered: isRegistered as boolean,
        regsiterFee: regsiterFee as bigint,
      });
    }
  };

  const register = async () => {
    if (!abstractClient || isRegistered || !regsiterFee) {
      return;
    }


    if (!publicClient) {
      toast.dismiss();
      toast.error(
        `Error initializing public client`,
      );
      return;
    }

    const balance = await publicClient.getBalance({
      address: abstractClient.account.address as `0x${string}`,
    });

    if (!balance) {
      toast.dismiss();
      toast.error(
        `Error getting balance`,
      );
      return;
    }

    const _isRegistered = await publicClient?.readContract({
      address: contractAddress,
      abi: abi,
      functionName: "registeredAddresses",
      args: [address as `0x${string}`],
    });

    if (_isRegistered) {
      setUserState((state) => ({
        ...state,
        isRegistered: _isRegistered as boolean,
      }));
      toast.dismiss();
      toast.error(
        `You are already registered`,
      );
      return;
    }

    toast.loading("Registering...");
    if (balance < regsiterFee) {
      toast.dismiss();
      toast.error(
        `You don't have enough balance to register (need ${formatEther(regsiterFee)}, have ${formatEther(balance)} ETH)`,
      );
      return;
    }

    try {
      const tx = await abstractClient.writeContract({
        address: contractAddress,
        abi: abi,
        functionName: "register",
        value: regsiterFee,
      });

      setUserState((state) => ({
        ...state,
        balance: balance - regsiterFee,
        isRegistered: true,
      }));
      toast.dismiss();
      toast.success("Registered successfully");
    } catch (error) {
      console.error(error);
      toast.dismiss();
      toast.error("Failed to register");
    }
  };

  useEffect(() => {
    fetchWallet();
  }, [publicClient, address]);

  const shouldDisplayOverlay = isChangingVideoSettings || gameState === "game-over" || gameState === "in-menu"

  return (
    <>
      <Toaster />

      {gameState === "playing" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xl z-10 text-black flex justify-center flex-col items-center">
          <div>Score: {score}</div>
          <div>Collected fishes: {currentFishes}</div>
        </div>
      )}


      {shouldDisplayOverlay && (
        <div className="flex flex-col items-center justify-center relative z-10 h-full bg-black/80 overflow-y-auto">
          {isChangingVideoSettings ? (
            <VideoSettings onClose={() => setIsChangingVideoSettings(false)} />
          ) : (
            gameState === "in-menu" ? (
              <>
                <h1 className="text-4xl font-bold mb-10"
                  onClick={() => {
                    setGameState("playing");
                  }}
                >Noot Slide</h1>
                <div className="flex  items-center justify-center gap-4">
                  {!isConnected ? (
                    <button
                      className="bg-blue-500 text-white p-2 rounded-md"
                      onClick={login}
                    >
                      Connect wallet
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4">
                      <p>
                        connected as {address?.slice(0, 6)}...{address?.slice(-4)}
                      </p>
                      <button
                        className="bg-blue-500 text-white p-2 rounded-md"
                        onClick={() => {
                          if (isRegistered) {
                            setGameState("playing");
                          } else {
                            register();
                          }
                        }}
                        disabled={!abstractClient || status !== "connected"}
                      >
                        {isRegistered ? "Play the game" : "Register to play"}
                      </button>
                      <button
                        className="bg-blue-500 text-white p-2 rounded-md"
                        onClick={logout}
                      >
                        Logout
                      </button>

                      <button
                        className="bg-blue-500 text-white p-2 rounded-md"
                        onClick={() => {
                          setIsChangingVideoSettings(!isChangingVideoSettings);
                        }}
                      >
                        Change video settings
                      </button>
                    </div>
                  )}
                </div>

                {address && (
                  <div className="flex flex-col items-center justify-center gap-4 md:max-w-[500px] mx-auto mt-10">
                    <h2 className="text-2xl font-bold">Your add-ons</h2>
                    <div className="flex gap-4 max-w-full flex-col">

                      {equipment.map((item) => (
                        <div key={item.name} className="w-full rounded-md p-4 border border-gray-300 flex">
                          <div className="w-[20%]">
                            <img />
                          </div>
                          <div className="w-[80%] text-sm">
                            <p className="font-semibold text-center text-base">{item.name}</p>
                            <p>{item.description}</p>
                            {item.type === "one-time" && <>
                              <p>Owned: {item.quantity}</p>
                              <button className="bg-green-500 w-full text-white p-2 rounded-md text-center">{item.price} ETH</button>
                            </>}
                            {item.type === "permanent" && <>
                              <p>Permanent upgrade</p>
                              {item.quantity > 0 ? (
                                <div className="bg-green-500 w-full text-white p-2 rounded-md text-center">Owned</div>
                              ) : (
                                <button className="bg-red-500 w-full text-white p-2 rounded-md text-center">Buy</button>
                              )}
                            </>}
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>
                )}



              </>
            ) : gameState === "game-over" && (
              <>
                <div className="text-white text-4xl">Game Over</div>
                <div className="text-white text-2xl">Score: {score}</div>
                <div className="text-white text-2xl">Collected fishes: {currentFishes}</div>
                <button
                  className="bg-blue-500 text-white p-2 rounded-md"
                  onClick={() => {
                    setGameState("playing");
                    setCurrentFishes(0);
                    setScore(0);
                  }}
                >
                  Play again
                </button>
                <button
                  className="bg-blue-500 text-white p-2 rounded-md mt-5"
                  onClick={() => {
                    setGameState("in-menu");
                  }}
                >
                  Back to menu
                </button>

                <button
                  className="bg-blue-500 text-white p-2 rounded-md mt-5"
                  onClick={() => {
                    setIsChangingVideoSettings(!isChangingVideoSettings);
                  }}
                >
                  Change Video Settings
                </button>
              </>
            )
          )}
        </div>
      )}
    </>
  );
});
