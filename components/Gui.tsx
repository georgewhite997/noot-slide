import {
  useLoginWithAbstract,
  useAbstractClient,
} from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { useAbstractSession } from "@/hooks/useAbstractSession";
import {
  registryContractAddress,
  registryAbi,
  powerupsContractAddress,
  powerupsAbi,
  // skinsContractAddress,
  // skinsAbi,
  usePublicClient,
  powerups as powerupsMeta,
  IPowerUp,
  chain,
} from "@/utils";
import { useEffect, useState, memo } from "react";
import { formatEther, parseAbi, parseEther } from "viem";
import { useAtom, useSetAtom } from "jotai";
import {
  gameStateAtom,
  videoSettingsAtom,
  currentFishesAtom,
  scoreAtom,
  haloQuantityAtom,
  hasSlowSkisAtom,
  hasLuckyCharmAtom,
  speedyStartQuantityAtom,
  GameState,
  abstractSessionAtom,
  SessionData,
  reviveCountAtom,
} from "@/atoms";
import { toast, Toaster } from "react-hot-toast";
import ConnectButton from "./ConnectButton";

type PowerUps = Array<IPowerUp & { quantity: number; isDisabled: boolean }>;

const MenuStates = {
  powerups: "powerups",
  videoSettings: "video-settings",
  landingPage: "landing-page",
  skins: "skins",
} as const;

type MenuState = (typeof MenuStates)[keyof typeof MenuStates];

const registryContract = { address: registryContractAddress, abi: registryAbi };
const powerupsContract = { address: powerupsContractAddress, abi: powerupsAbi };
// const skinsContract = { address: skinsContractAddress, abi: skinsAbi };

export const Gui = memo(function Gui() {
  const { address, isConnected } = useAccount();
  const { getStoredSession, createAndStoreSession } = useAbstractSession(chain);
  const { data: abstractClient } = useAbstractClient();
  const publicClient = usePublicClient();

  const [session, setSession] = useAtom<SessionData>(abstractSessionAtom);
  const [isLoadingWalletData, setIsLoadingWalletData] =
    useState<boolean>(false);

  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [menuState, setMenuState] = useState<MenuState>(MenuStates.landingPage);
  const [currentFishes, setCurrentFishes] = useAtom(currentFishesAtom);
  const [score, setScore] = useAtom(scoreAtom);
  const [powerUps, setPowerUps] = useState<PowerUps>([]);
  const setHaloQuantity = useSetAtom(haloQuantityAtom);
  const setHasSlowSkis = useSetAtom(hasSlowSkisAtom);
  const setHasLuckyCharm = useSetAtom(hasLuckyCharmAtom);
  const setSpeedyStartQuantity = useSetAtom(speedyStartQuantityAtom);

  const [isRegistered, setIsRegistered] = useState(false);

  const fetchWallet = async (session?: SessionData) => {
    if (!publicClient || !address || !abstractClient) return;

    // for (let i = 0; i < powerupsMeta.length; i++) {
    //   console.log(i)
    //   const powerup = powerupsMeta[i];
    //   const price = parseEther(powerup.price.toString())
    //   const tx = await abstractClient.writeContract({
    //     address: powerupsContractAddress,
    //     abi: powerupsAbi,
    //     functionName: "setPowerupPrice",
    //     args: [powerup.id, price],
    //   })
    //   console.log("tx", tx)
    // }

    const ids = powerupsMeta.map((p) => p.id);

    // console.log(registryContractAddress, powerupsContractAddress)
    const [registeredRes, ownedRes] = await publicClient.multicall({
      contracts: [
        {
          ...registryContract,
          functionName: "registeredAddresses",
          args: [address as `0x${string}`],
        },
        {
          ...powerupsContract,
          functionName: "getOwnedPowerups",
          args: [address as `0x${string}`, ids],
        },
      ],
    });

    const registered = registeredRes.result as boolean;
    const owned =
      (ownedRes.result as number[]) || new Array(powerupsMeta.length).fill(0);
    const disabledIds = JSON.parse(
      localStorage.getItem("disabledPowerups") || "[]",
    ) as number[];

    setIsRegistered(registered);
    setPowerUps(
      owned.map((qty, i) => {
        const meta = powerupsMeta[i];
        const hasDisabledIndex = disabledIds.indexOf(meta.id);
        const quantity = Number(qty);

        if (meta.name === "Abstract Halo") {
          const x = hasDisabledIndex == -1 ? quantity : 0;
          console.log("halo", meta.id);
        }

        if (meta.name === "Speedy Start") {
          setSpeedyStartQuantity(hasDisabledIndex == -1 ? quantity : 0);
        }

        if (meta.name === "Slow Skis") {
          setHasSlowSkis(hasDisabledIndex == -1 ? quantity > 0 : false);
        }

        if (meta.name === "Lucky Charm") {
          setHasLuckyCharm(hasDisabledIndex == -1 ? quantity > 0 : false);
        }

        return { ...meta, quantity, isDisabled: hasDisabledIndex !== -1 };
      }),
    );

    if (!session && owned.some((qty) => qty > 0)) {
      await handleCreateSession();
    }
  };

  const register = async () => {
    if (!abstractClient || isRegistered || !publicClient) return;

    const bal = await publicClient.getBalance({
      address: abstractClient.account.address as `0x${string}`,
    });

    if (!bal) return toast.error("Error getting balance");

    const [feeRes, registeredRes] = await publicClient.multicall({
      contracts: [
        { ...registryContract, functionName: "registrationFee" },
        {
          ...registryContract,
          functionName: "registeredAddresses",
          args: [address as `0x${string}`],
        },
      ],
    });

    if (registeredRes.result) {
      setIsRegistered(true);
      return toast.error("You are already registered");
    }

    const fee = feeRes.result as bigint;
    if (bal < fee) {
      return toast.error(
        `Need ${formatEther(fee)} ETH, you have ${formatEther(bal)}`,
      );
    }

    try {
      toast.loading("Registering…");
      await abstractClient.writeContract({
        address: registryContractAddress,
        abi: registryAbi,
        functionName: "register",
        value: fee,
      });
      setIsRegistered(true);
      toast.dismiss();
      toast.success("Registered successfully");
    } catch (err) {
      console.error(err);
      toast.dismiss();
      toast.error("Failed to register");
    }
  };

  const handlePurchase = async (item: PowerUps[number], quantity = 1) => {
    if (!abstractClient || !publicClient) return;

    // set prices
    // for (let i = 0; i < powerupsMeta.length; i++) {
    //   const powerup = powerupsMeta[i];
    //   const price = parseEther(powerup.price.toString())
    //   const tx = await abstractClient.writeContract({
    //     address: powerupsContractAddress,
    //     abi: powerupsAbi,
    //     functionName: "setPowerupPrice",
    //     args: [powerup.id, price],
    //   })
    //   console.log("tx", tx)
    // }
    // return;

    const bal = await publicClient.getBalance({
      address: abstractClient.account.address as `0x${string}`,
    });

    if (!bal) return toast.error("Failed to get balance");

    const cost = parseEther(item.price.toString()) * BigInt(quantity);
    if (bal < cost) return toast.error("You don't have enough balance");

    await abstractClient.writeContract({
      address: powerupsContractAddress,
      abi: powerupsAbi,
      functionName: "purchasePowerups",
      value: cost,
      args: [[item.id], [quantity]],
    });
    toast.success("Purchase successful");

    setPowerUps((prev) =>
      prev.map((pu) =>
        pu.id === item.id ? { ...pu, quantity: pu.quantity + quantity } : pu,
      ),
    );

    if (item.name === "Abstract Halo") setHaloQuantity((p) => p + quantity);
    if (item.name === "Speedy Start")
      setSpeedyStartQuantity((p) => p + quantity);
    if (item.name === "Slow Skis") setHasSlowSkis(true);
    if (item.name === "Lucky Charm") setHasLuckyCharm(true);

    if (!session) {
      await handleCreateSession();
    }
  };

  const togglePowerup = (item: PowerUps[number]) => {
    setPowerUps((prev) => {
      let newState = null;
      const newArr = prev.map((pu) => {
        if (pu.id === item.id) {
          newState = !pu.isDisabled;
          return { ...pu, isDisabled: newState };
        }
        return pu;
      });

      let localStorageDisabled = JSON.parse(
        localStorage.getItem("disabledPowerups") || "[]",
      ) as number[];
      if (newState) {
        localStorageDisabled.push(item.id);
      } else {
        localStorageDisabled = localStorageDisabled.filter(
          (id) => id !== item.id,
        );
      }
      localStorage.setItem(
        "disabledPowerups",
        JSON.stringify(localStorageDisabled),
      );

      if (item.name === "Abstract Halo") setHaloQuantity(0);
      if (item.name === "Speedy Start") setSpeedyStartQuantity(0);
      if (item.name === "Slow Skis") setHasSlowSkis(false);
      if (item.name === "Lucky Charm") setHasLuckyCharm(false);

      return newArr;
    });
  };

  useEffect(() => {
    (async () => {
      if (isConnected) {
        setIsLoadingWalletData(true);
        if (abstractClient?.account) {
          const s = (await checkForExistingSession()) as SessionData;
          fetchWallet(s);
          setIsLoadingWalletData(false);
          setSession(s);
        } else {
          setSession(null);
        }
      }
    })();
  }, [address, isConnected, abstractClient?.account?.address]);

  const checkForExistingSession = async () => {
    let session = null;
    try {
      session = await getStoredSession(powerupsContractAddress);
      if (session) {
        setSession(session);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Error checking for session:", error);
    }

    return session;
  };

  const handleCreateSession = async () => {
    if (!isConnected) {
      return;
    }

    const s = await checkForExistingSession();
    if (s?.session) return;

    toast.loading("Approve session creation");
    try {
      const session = await createAndStoreSession();
      if (session) {
        setSession(session);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    } finally {
      toast.dismiss();
    }
  };

  const overlay =
    gameState === "game-over" ||
    gameState === "in-menu" ||
    gameState === "reviving";

  return (
    <>
      <Toaster />

      {gameState === "playing" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-black flex flex-col items-center text-xl">
          <div>Score: {score}</div>
          <div>Collected fishes: {currentFishes}</div>
        </div>
      )}

      {overlay && (
        <div className="flex flex-col items-center justify-center h-full bg-black/80 z-[90] overflow-y-auto absolute inset-0">
          {gameState === "game-over" ? (
            <GameOver
              score={score}
              currentFishes={currentFishes}
              setGameState={setGameState}
              setCurrentFishes={setCurrentFishes}
              setScore={setScore}
              setMenuState={setMenuState}
            />
          ) : gameState === "reviving" ? (
            <Reviving setGameState={setGameState} />
          ) : (
            <>
              {menuState === MenuStates.videoSettings && (
                <VideoSettings
                  onClose={() => setMenuState(MenuStates.landingPage)}
                />
              )}

              {isConnected ? (
                <>
                  {menuState === MenuStates.landingPage && (
                    <LandingPage
                      isLoading={isLoadingWalletData}
                      address={address}
                      isRegistered={isRegistered}
                      register={register}
                      setGameState={setGameState}
                      setMenuState={setMenuState}
                      powerUps={powerUps}
                      handlePurchase={handlePurchase}
                    />
                  )}

                  {menuState === MenuStates.powerups && (
                    <Powerups
                      onClose={() => setMenuState(MenuStates.landingPage)}
                      address={address as `0x${string}`}
                      powerUps={powerUps}
                      handlePurchase={handlePurchase}
                      onToggle={togglePowerup}
                    />
                  )}

                  {menuState === MenuStates.skins && (
                    <Skins
                      onClose={() => setMenuState(MenuStates.landingPage)}
                      address={address as `0x${string}`}
                    />
                  )}
                </>
              ) : (
                <ConnectButton />
              )}
            </>
          )}
        </div>
      )}
    </>
  );
});

type SkinsProps = {
  onClose: () => void;
  address: string;
};

const Skins = ({ onClose, address }: SkinsProps) => {
  if (!address) return null;

  return (
    <div className="mx-auto mt-10 flex w-full flex-col items-center gap-4 md:max-w-[500px] h-[80vh]">
      <div className="relative w-full w-[80%]">
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white absolute top-0 right-0"
          onClick={onClose}
        >
          Back
        </button>
      </div>

      <h2 className="text-2xl font-bold">Your skins</h2>

      <p>Coming soon</p>
    </div>
  );
};

type GameOverProps = {
  score: number;
  currentFishes: number;
  setGameState: (gs: GameState) => void;
  setCurrentFishes: (n: number) => void;
  setScore: (n: number) => void;
  setMenuState: (ms: MenuState) => void;
};

const GameOver = ({
  score,
  currentFishes,
  setGameState,
  setCurrentFishes,
  setScore,
  setMenuState,
}: GameOverProps) => (
  <>
    <h1 className="text-4xl text-white">Game Over</h1>
    <p className="text-2xl text-white">Score: {score}</p>
    <p className="text-2xl text-white">Collected fishes: {currentFishes}</p>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => {
        setGameState("playing");
        setCurrentFishes(0);
        setScore(0);
      }}
    >
      Play again
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => setGameState("in-menu")}
    >
      Back to menu
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => {
        setGameState("in-menu");
        setMenuState(MenuStates.videoSettings);
      }}
    >
      Change Video Settings
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => {
        setGameState("in-menu");
        setMenuState(MenuStates.powerups);
      }}
    >
      Buy Powerups
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => {
        setGameState("in-menu");
        setMenuState(MenuStates.skins);
      }}
    >
      Buy Skins
    </button>
  </>
);

type LandingProps = {
  address?: string;
  isRegistered: boolean;
  register: () => void;
  setGameState: (gs: GameState) => void;
  setMenuState: (ms: MenuState) => void;
  powerUps: PowerUps;
  handlePurchase: (p: PowerUps[number]) => void;
  isLoading: boolean;
};

const LandingPage = ({
  address,
  isRegistered,
  register,
  setGameState,
  setMenuState,
  isLoading,
}: LandingProps) => {
  const { logout } = useLoginWithAbstract();

  return (
    <>
      <h1
        className="mb-10 text-4xl font-bold"
        onClick={() => setGameState("playing")}
      >
        Noot Slide
      </h1>

      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center gap-4">
          <p>
            connected as {address?.slice(0, 6)}…{address?.slice(-4)}
          </p>
          {isLoading ? (
            <>loading...</>
          ) : (
            <button
              className="rounded bg-blue-500 px-4 py-2 text-white"
              onClick={() =>
                isRegistered ? setGameState("playing") : register()
              }
            >
              {isRegistered ? "Play the game" : "Register to play"}
            </button>
          )}

          <button
            className="rounded bg-blue-500 px-4 py-2 text-white"
            onClick={logout}
          >
            Logout
          </button>

          <button
            className="rounded bg-blue-500 px-4 py-2 text-white"
            onClick={() => setMenuState(MenuStates.videoSettings)}
          >
            Change Video settings
          </button>

          <button
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
            onClick={() => setMenuState(MenuStates.powerups)}
          >
            Buy Powerups
          </button>

          <button
            className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
            onClick={() => setMenuState(MenuStates.skins)}
          >
            Buy Skins
          </button>
        </div>
      </div>
    </>
  );
};

type PowerupsProps = {
  onClose: () => void;
  address: string;
  powerUps: PowerUps;
  handlePurchase: (p: PowerUps[number], quantity?: number) => void;
  onToggle: (p: PowerUps[number]) => void;
};

const Powerups = ({
  onClose,
  address,
  powerUps,
  handlePurchase,
  onToggle,
}: PowerupsProps) => {
  return (
    <div className="mx-auto mt-10 flex max-w-full flex-col items-center gap-4 md:max-w-[500px]">
      <div className="relative w-full">
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white absolute top-0 right-0"
          onClick={onClose}
        >
          Back
        </button>
      </div>

      <h2 className="text-2xl font-bold">Your powerups</h2>
      {powerUps.length > 0
        ? powerUps.map((item) => {
          const [quantity, setQuantity] = useState(1);

          return (
            <div
              key={item.id}
              className="flex w-full rounded border border-gray-300 p-4 justify-around"
            >
              <div className="w-1/5 flex items-center justify-center ">
                <img
                  src={`/${item.name.toLowerCase().replace(" ", "")}.jpeg`}
                  alt={item.name}
                />
              </div>
              <div className="w-3/5 text-sm">
                <p className="mb-1 text-center text-base font-semibold">
                  {item.name}
                </p>
                <p>{item.description}</p>

                {item.type === "one-time" ? (
                  <>
                    <p>Owned: {item.quantity}</p>
                    <div className="flex gap-2">
                      <button
                        className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
                        onClick={() => handlePurchase(item, quantity)}
                      >
                        Buy for {item.price} ETH
                      </button>
                      <input
                        className="rounded bg-gray-200 px-2 py-1 text-center text-black"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        min={1}
                        max={100}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p>Permanent upgrade</p>
                    {item.quantity > 0 ? (
                      <div className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-center text-white">
                        Owned
                      </div>
                    ) : (
                      <button
                        className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
                        onClick={() => handlePurchase(item)}
                      >
                        Buy for {item.price} ETH
                      </button>
                    )}
                  </>
                )}
              </div>
              {item.quantity > 0 && (
                <button
                  className="mt-2 max-w-min max-h-min rounded bg-blue-500 px-2 py-1 text-white"
                  onClick={() => onToggle(item)}
                >
                  {item.isDisabled ? "Enable" : "Disable"}
                </button>
              )}
            </div>
          );
        })
        : null}
    </div>
  );
};

const Switch = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
}) => (
  <label className="flex items-center gap-2 select-none">
    <input
      type="checkbox"
      className="h-4 w-4"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  </label>
);

const VideoSettings = ({ onClose }: { onClose: () => void }) => {
  const [videoSettings, setVideoSettings] = useAtom(videoSettingsAtom);

  return (
    <div>
      <h1 className="mb-10 text-4xl font-bold">Video Settings</h1>

      <div className="mb-4 flex gap-4">
        <p>Antialiasing: {videoSettings.antialiasing ? "On" : "Off"}</p>
        <Switch
          checked={videoSettings.antialiasing}
          onCheckedChange={() =>
            setVideoSettings((prev) => ({
              ...prev,
              antialiasing: !prev.antialiasing,
            }))
          }
        />
      </div>

      <div className="mb-4 flex gap-4">
        <p>Shadows: {videoSettings.shadows ? "On" : "Off"}</p>
        <Switch
          checked={videoSettings.shadows}
          onCheckedChange={() =>
            setVideoSettings((prev) => ({ ...prev, shadows: !prev.shadows }))
          }
        />
      </div>

      <div className="mb-8 flex gap-4">
        <p>Pixel Ratio: {videoSettings.dpr}</p>
        <input
          type="range"
          min={1}
          max={2}
          step={0.1}
          value={videoSettings.dpr}
          onChange={(e) =>
            setVideoSettings((prev) => ({
              ...prev,
              dpr: parseFloat(e.target.value),
            }))
          }
        />
      </div>

      <button
        className="rounded bg-blue-500 px-4 py-2 text-white"
        onClick={onClose}
      >
        Back to game
      </button>
    </div>
  );
};

type RevivingProps = {
  setGameState: (gs: GameState) => void;
};

const revivePrices = [50, 169, 420]

const Reviving = ({ setGameState }: RevivingProps) => {
  const [timer, setTimer] = useState(0);
  const [reviveCount, setReviveCount] = useAtom(reviveCountAtom)

  useEffect(() => {
    const i = setInterval(() => {
      setTimer((t) => {
        const newTime = t + 1
        if (newTime === 60) {
          setGameState("game-over")
        }
        return newTime
      });
    }, 1000);

    return () => {
      clearInterval(i);
    };
  }, []);

  const handleRevive = () => {
    setGameState("playing")
  };

  const handleSkip = () => {
    setGameState("game-over");
    setReviveCount(0)
  }

  return (
    <div className="mx-auto mt-10 flex w-full flex-col items-center gap-4 md:max-w-[500px]">
      <div className="relative w-full">
        <button
          className="rounded bg-blue-500 px-2 py-1 text-white absolute top-0 right-0 text-sm"
          onClick={handleSkip}
        >
          Skip revive
        </button>
      </div>

      <h2 className="text-2xl font-bold">Revive?</h2>
      <p>Available {3 - reviveCount + 1}/3</p>
      <p>Price: {revivePrices[reviveCount - 1]} $NOOT</p>
      <p>Time left: {60 - timer}</p>
      <p>Buy more noot <a href="uniswap.com" target="_blank">here</a></p>

      <button onClick={handleRevive} className="bg-green-500 rounded-md px-4 py-2 rounded-md">Revive</button>
    </div>
  );
};
