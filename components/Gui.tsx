import {
  useLoginWithAbstract,
  useAbstractClient,
  useCreateSession,
} from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { useAbstractSession } from "@/hooks/useAbstractSession"
import {
  contractAddress,
  abi,
  usePublicClient,
  powerups as powerupsMeta,
  IPowerUp,
  chain,
} from "@/utils";
import { useEffect, useState, memo } from "react";
import { Account, formatEther, parseAbi, parseEther, toFunctionSelector } from "viem";
import { useAtom, useSetAtom } from "jotai";
import {
  gameStateAtom,
  videoSettingsAtom,
  currentFishesAtom,
  scoreAtom,
  haloQuantityAtom,
  GameState,
} from "@/atoms";
import { toast, Toaster } from "react-hot-toast";
import { getGeneralPaymasterInput } from "viem/zksync";
import { privateKeyToAccount } from "viem/accounts";
import { LimitType, SessionConfig } from "@abstract-foundation/agw-client/sessions";
import { generatePrivateKey } from "viem/accounts";
import ConnectButton from "./ConnectButton";

type PowerUps = Array<IPowerUp & { quantity: number }>;

const MenuStates = {
  powerups: "powerups",
  videoSettings: "video-settings",
  landingPage: "landing-page",
  skins: "skins",
} as const;

type MenuState = (typeof MenuStates)[keyof typeof MenuStates];

type SessionData = {
  session: SessionConfig;
  sessionSigner: Account;
} | null;

export const Gui = memo(function Gui() {
  const { address, status, isConnected } = useAccount();
  const { getStoredSession, createAndStoreSession, clearStoredSession } =
    useAbstractSession(chain);
  const { data: abstractClient } = useAbstractClient();
  const publicClient = usePublicClient();

  const [session, setSession] = useState<SessionData>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [gameState, setGameState] = useAtom(gameStateAtom);
  const [menuState, setMenuState] = useState<MenuState>(MenuStates.landingPage);
  const [currentFishes, setCurrentFishes] = useAtom(currentFishesAtom);
  const [score, setScore] = useAtom(scoreAtom);
  const [powerUps, setPowerUps] = useState<PowerUps>([]);
  const setHaloQuantity = useSetAtom(haloQuantityAtom);

  const [isRegistered, setIsRegistered] = useState(false);

  const fetchWallet = async () => {
    if (!publicClient || !address) return;

    const wagmiContract = { address: contractAddress, abi };

    const ids = powerupsMeta.map((p) => p.id);

    const [registeredRes,
      //  ownedRes

    ] = await publicClient.multicall({
      contracts: [
        {
          ...wagmiContract,
          functionName: "registeredAddresses",
          args: [address as `0x${string}`],
        },
        // {
        //   ...wagmiContract,
        //   functionName: "getOwnedPowerups",
        //   args: [address as `0x${string}`, ids],
        // },
      ],
    });

    const registered = registeredRes.result as boolean;
    // const owned = ownedRes.result as number[];
    const owned = [0, 0, 0, 0]

    setIsRegistered(registered);
    setPowerUps(
      owned.map((qty, i) => {
        const meta = powerupsMeta[i];
        if (meta.name === "Abstract Halo") {
          setHaloQuantity(Number(qty));
        }
        return { ...meta, quantity: Number(qty) };
      }),
    );
  };

  const register = async () => {
    if (!abstractClient || isRegistered || !publicClient) return;

    const bal = await publicClient.getBalance({
      address: abstractClient.account.address as `0x${string}`,
    });
    if (!bal) return toast.error("Error getting balance");

    const wagmiContract = { address: contractAddress, abi };
    const [feeRes, regRes] = await publicClient.multicall({
      contracts: [
        { ...wagmiContract, functionName: "registrationFee" },
        {
          ...wagmiContract,
          functionName: "registeredAddresses",
          args: [address as `0x${string}`],
        },
      ],
    });

    if (regRes.result) {
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
        address: contractAddress,
        abi,
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

  const { data: agwClient } = useAbstractClient();


  const handlePurchase = async (item: PowerUps[number]) => {
    console.log("handle1337")
    if (!abstractClient || !publicClient) return;


    const sessionClient = agwClient?.toSessionClient(sessionSigner, session);
    console.log("CREATED SESSION CLIENT")

    const hash = await sessionClient?.writeContract({
      account: sessionClient.account,
      chain,
      abi: parseAbi(["function mint(address,uint256) external"]),
      address: "0xC4822AbB9F05646A9Ce44EFa6dDcda0Bf45595AA",
      functionName: "mint",
      args: [sessionClient.account.address, BigInt(1)],
    });
    console.log("CREATED HASH")
    console.log(hash)

    return

    const bal = await publicClient.getBalance({
      address: abstractClient.account.address as `0x${string}`,
    });
    if (!bal) return toast.error("Failed to get balance");

    const quantity = 1;
    const cost = parseEther(item.price.toString()) * BigInt(quantity);
    if (bal < cost) return toast.error("You don't have enough balance");

    await abstractClient.writeContract({
      address: contractAddress,
      abi,
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
  };

  useEffect(() => {
    fetchWallet();
  }, [address]);

  const checkForExistingSession = async () => {
    setIsLoading(true);

    try {
      const session = await getStoredSession() as SessionData;
      if (session) {
        setSession(session);
      } else {
        setSession(null);
      }
    } catch (error) {
      console.error("Error checking for session:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSession = async () => {
    setIsLoading(true);

    try {
      const session = await createAndStoreSession() as SessionData;
      if (session) {
        setSession(session);
      }
    } catch (error) {
      console.error("Error creating session:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = () => {
    try {
      clearStoredSession();
      setSession(null);
    } catch (error) {
      console.error("Error clearing session:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  };


  useEffect(() => {
    if (isConnected) {
      checkForExistingSession();
    } else {
      setSession(null);
    }
  }, [isConnected]);


  const overlay = gameState === "game-over" || gameState === "in-menu";

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
          ) : (
            <>
              {menuState === MenuStates.videoSettings && (
                <VideoSettings
                  onClose={() => setMenuState(MenuStates.landingPage)}
                />
              )}

              {menuState === MenuStates.landingPage && (
                <LandingPage
                  isConnected={isConnected}
                  address={address}
                  abstractReady={!!abstractClient && status === "connected"}
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
                />
              )}

              {menuState === MenuStates.skins && (
                <Skins
                  onClose={() => setMenuState(MenuStates.landingPage)}
                  address={address as `0x${string}`}
                />
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
}

const Skins = ({ onClose, address }: SkinsProps) => {
  if (!address) return null;

  return (
    <div>
      <div className="relative w-full">
        <button
          className="mt-4 rounded bg-blue-500 px-4 py-2 text-white absolute top-0 right-0"
          onClick={onClose}
        >
          Back
        </button>
      </div>


      <h1>Skins</h1>
    </div>
  )
}

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
      onClick={() => setMenuState(MenuStates.videoSettings)}
    >
      Change Video Settings
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => setMenuState(MenuStates.powerups)}
    >
      Change Powerups
    </button>

    <button
      className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      onClick={() => setMenuState(MenuStates.skins)}
    >
      Change Skins
    </button>

  </>
);

type LandingProps = {
  isConnected: boolean;
  address?: string;
  abstractReady: boolean;
  isRegistered: boolean;
  register: () => void;
  setGameState: (gs: GameState) => void;
  setMenuState: (ms: MenuState) => void;
  powerUps: PowerUps;
  handlePurchase: (p: PowerUps[number]) => void;
};

const LandingPage = ({
  isConnected,
  address,
  abstractReady,
  isRegistered,
  register,
  setGameState,
  setMenuState,
}: LandingProps) => {

  const { logout } = useLoginWithAbstract();

  return (
    <>
      <h1
        className="mb-10 cursor-pointer text-4xl font-bold"
        onClick={() => setGameState("playing")}
      >
        Noot Slide
      </h1>

      <div className="flex items-center justify-center gap-4">
        {!isConnected ? (
          <ConnectButton />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p>
              connected as {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>

            <button
              className="rounded bg-blue-500 px-4 py-2 text-white"
              disabled={!abstractReady}
              onClick={() =>
                isRegistered ? setGameState("playing") : register()
              }
            >
              {isRegistered ? "Play the game" : "Register to play"}
            </button>

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
              Change Powerups
            </button>

            <button
              className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
              onClick={() => setMenuState(MenuStates.skins)}
            >
              Change Skins
            </button>


          </div>
        )}
      </div>

    </>
  )
}

type PowerupsProps = {
  onClose: () => void;
  address: string;
  powerUps: PowerUps;
  handlePurchase: (p: PowerUps[number]) => void;
}

const Powerups = ({ onClose, address, powerUps, handlePurchase }: PowerupsProps) => {
  if (!address) return null;

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
      {powerUps.map((item) => {
        return (
          <div
            key={item.id}
            className="flex w-full rounded border border-gray-300 p-4"
          >
            <div className="w-1/5">{/* placeholder for img */}</div>
            <div className="w-4/5 text-sm">
              <p className="mb-1 text-center text-base font-semibold">
                {item.name}
              </p>
              <p>{item.description}</p>

              {item.type === "one-time" ? (
                <>
                  <p>Owned: {item.quantity}</p>
                  <button
                    className="mt-2 w-full rounded bg-green-500 px-2 py-1 text-white"
                    onClick={() => handlePurchase(item)}
                  >
                    {item.price} ETH
                  </button>
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
                      Buy
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
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
  <label className="flex items-center gap-2 cursor-pointer select-none">
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
