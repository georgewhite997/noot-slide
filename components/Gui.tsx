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
  items as itemsMeta,
  IItem,
  chain,
  nootTreasury,
  MAX_MOBILE_WIDTH,
  MAX_MOBILE_HEIGHT,
  IUserItem,
  truncateEther,
} from "@/utils";
import { useEffect, useState, memo } from "react";
import { formatEther, parseAbi, parseEther, PublicClient } from "viem";
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
  hasFishingNetAtom,
  hasMultiplierAtom,
} from "@/atoms";
import { toast, Toaster } from "react-hot-toast";
import NootToken from "../addresses/Noot.json";
import { AbstractClient } from "@abstract-foundation/agw-client";
import ConnectButton from "./ConnectButton";
import { ItemShop } from "./ItemShop";
import PrimaryButton from "./buttons/PrimaryButton";
import { ChestIcon, LightingIcon, ShoppingCartIcon, StarIcon } from "./Icons";

type Items = Array<IUserItem>;

const MenuStates = {
  upgrades: "upgrades",
  items: "items",
  videoSettings: "video-settings",
  landingPage: "landing-page",
  skins: "skins",
} as const;

type MenuState = (typeof MenuStates)[keyof typeof MenuStates];

const registryContract = { address: registryContractAddress, abi: registryAbi };
const powerupsContract = { address: powerupsContractAddress, abi: powerupsAbi };
// const skinsContract = { address: skinsContractAddress, abi: skinsAbi };

export const Gui = memo(function Gui() {
  const { address: _address, isConnected } = useAccount();
  const address = _address as `0x${string}`;
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
  const [items, setItems] = useState<IUserItem[]>([]);
  const setHaloQuantity = useSetAtom(haloQuantityAtom);
  const setHasSlowSkis = useSetAtom(hasSlowSkisAtom);
  const setHasLuckyCharm = useSetAtom(hasLuckyCharmAtom);
  const setSpeedyStartQuantity = useSetAtom(speedyStartQuantityAtom);
  const [hasFishingNet] = useAtom(hasFishingNetAtom);
  const [hasMultiplier] = useAtom(hasMultiplierAtom);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [balance, setBalance] = useState<bigint>(BigInt(0));


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

    const ids = itemsMeta.map((p) => p.id);

    const [[registeredRes, ownedRes], balance] = await Promise.all([await publicClient.multicall({
      contracts: [
        {
          ...registryContract,
          functionName: "registeredAddresses",
          args: [address],
        },
        {
          ...powerupsContract,
          functionName: "getOwnedPowerups",
          args: [address, ids],
        },
      ],
    }), publicClient.getBalance({
      address: address as `0x${string}`,
    })])

    setBalance(balance);

    const registered = registeredRes.result as boolean;
    const owned =
      (ownedRes.result as number[]) || new Array(itemsMeta.length).fill(0);
    const disabledIds = JSON.parse(
      localStorage.getItem("disabledItems") || "[]",
    ) as number[];

    setIsRegistered(registered);
    setItems(
      owned.map((qty, i) => {
        const meta = itemsMeta[i];
        const hasDisabledIndex = disabledIds.indexOf(meta.id);
        const quantity = Number(qty);

        if (meta.name === "Abstract Halo") {
          setHaloQuantity(hasDisabledIndex == -1 ? quantity : 0);
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
          args: [address],
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

  const handlePurchase = async (item: IItem, quantity = 1) => {
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

    setItems((prev) =>
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

  const toggleItem = (item: IItem) => {
    setItems((prev) => {
      let newState = null;
      const newArr = prev.map((pu) => {
        if (pu.id === item.id) {
          newState = !pu.isDisabled;
          return { ...pu, isDisabled: newState };
        }
        return pu;
      });

      let localStorageDisabled = JSON.parse(
        localStorage.getItem("disabledItems") || "[]",
      ) as number[];
      if (newState) {
        localStorageDisabled.push(item.id);
      } else {
        localStorageDisabled = localStorageDisabled.filter(
          (id) => id !== item.id,
        );
      }
      localStorage.setItem(
        "disabledItems",
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

  useEffect(() => {
    const updateDimensions = () => {
      const width = Math.min(window.innerWidth, MAX_MOBILE_WIDTH);
      const height = Math.min(window.innerHeight, MAX_MOBILE_HEIGHT);
      setDimensions({ width, height });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  return (
    <>
      <Toaster />

      {(gameState === "playing" && dimensions.width > 0 && dimensions.height > 0) && (
        <div className="absolute left-1/2 -translate-x-1/2 p-2 top-1/2 -translate-y-1/2 z-10 text-md text-white justify-between flex font-bold text-shadow-md" style={{
          width: dimensions.width,
          height: dimensions.height,
        }}>
          <div>

          </div>
          <div className="flex h-fit flex-col items-end">
            <div className="bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">Score: {score}</div>
            <div className="mt-2 bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">Fishes: {currentFishes}</div>
            <div className="flex mt-2 justify-center">
              {hasFishingNet && <div className="bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">N</div>}
              {hasMultiplier && <div className="ml-2 bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">M</div>}
            </div>
          </div>
        </div>
      )}

      {overlay && (
        <div className="absolute inset-0 bg-black/80 z-[90] flex items-center justify-center">
          <div className="h-full"
            style={{
              width: dimensions.width + "px",
            }}
          >
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
              <Reviving
                setGameState={setGameState}
                address={address}
                publicClient={publicClient}
                abstractClient={abstractClient}
              />
            ) : (
              <>
                {(!isConnected || menuState === MenuStates.landingPage) && (
                  <LandingPage
                    balance={balance}
                    isLoading={isLoadingWalletData}
                    address={address}
                    isConnected={isConnected}
                    isRegistered={isRegistered}
                    register={register}
                    setGameState={setGameState}
                    setMenuState={setMenuState}
                    items={items}
                    handlePurchase={handlePurchase}
                  />
                )}
                {isConnected && (
                  <>
                    {menuState === MenuStates.videoSettings && (
                      <VideoSettings
                        onClose={() => setMenuState(MenuStates.landingPage)}
                      />
                    )}
                    {menuState === MenuStates.items && (
                      <ItemShop
                        onClose={() => setMenuState(MenuStates.landingPage)}
                        address={address}
                        items={items}
                        handlePurchase={handlePurchase}
                        onToggle={toggleItem}
                      />
                    )}

                    {menuState === MenuStates.skins && (
                      <Skins
                        onClose={() => setMenuState(MenuStates.landingPage)}
                        address={address}
                      />
                    )}
                    {menuState === MenuStates.upgrades && (
                      <Upgrades
                        onClose={() => setMenuState(MenuStates.landingPage)}
                        address={address}
                      />
                    )}

                  </>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
});

type UpgradesProps = {
  onClose: () => void;
  address: string;
};

export const Upgrades = ({
  onClose,
  address,
}: UpgradesProps) => {
  return (
    <div>
      <button
        className="text-white relative w-[40px] h-[40px] mx-[24px] mb-[16px]"
        onClick={onClose}
      >
        <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
        <img src="/arrow.png" alt="back" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
      </button>

      <div className="w-full px-[24px] flex justify-center h-full items-center">
        <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">
          <h2 className="text-2xl font-bold">Upgrades</h2>

          <p>Coming soon..</p>

        </div>
      </div>
    </div>
  );
};

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
  <div className="w-full px-[32px] flex justify-center h-full items-center">
    <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">

      <h2 className="text-2xl font-bold text-center mb-[24px]">Game over</h2>

      <p className="text-2xl text-white">Score: {score}</p>
      <p className="text-2xl text-white">Collected fishes: {currentFishes}</p>

      <button
        className="mt-4 rounded bg-green-500 px-4 py-2 text-white w-full"
        onClick={() => {
          setGameState("playing");
          setCurrentFishes(0);
          setScore(0);
        }}
      >
        Play again
      </button>

      <button
        className="mt-2 rounded bg-blue-500 px-4 py-2 text-white block w-full"
        onClick={() => setGameState("in-menu")}
      >
        Back to menu
      </button>

    </div>
  </div>
);

type LandingProps = {
  address?: string;
  isRegistered: boolean;
  register: () => void;
  setGameState: (gs: GameState) => void;
  setMenuState: (ms: MenuState) => void;
  items: Items;
  handlePurchase: (p: Items[number]) => void;
  isLoading: boolean;
  isConnected: boolean;
  balance: bigint;
};


const LandingPage = ({
  address,
  isRegistered,
  register,
  setGameState,
  setMenuState,
  isLoading,
  isConnected,
  balance
}: LandingProps) => {
  const { logout } = useLoginWithAbstract();

  if (!isConnected || !isRegistered) {
    return (
      <div
        className="h-full w-full flex flex-col items-center justify-between"
        style={{ backgroundImage: "url('/bg.webp')" }}
      >
        <img src="/top.svg" alt="top" className="w-full" />

        <div className="flex flex-col items-center justify-center gap-4 mx-12">
          <img src="/nooter.webp" alt="nooter" />
          <img src="/hero.webp" alt="hero" />

          {!isConnected ? (
            <ConnectButton />
          ) : !isRegistered ? (
            <>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[24px]">Create your nooter for</p>
                  <div className="flex items-center gap-1 text-[32px]">
                    <img src="/eth.svg" alt="eth" />
                    <p>0.0028</p>
                  </div>
                  <button
                    className="rounded bg-green-500 px-4 py-2 text-white"
                    onClick={() => register()}
                  >
                    Create nooter
                  </button>
                </div>
              )}
            </>
          ) : null}
        </div>

        <img src="/bottom.svg" alt="bottom" className="w-full" />
      </div>
    );
  }




  return (
    <div className="h-full w-full flex flex-col justify-between items-center px-[16px]"
      style={{
        backgroundImage: "url('/hero2.svg')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat'
      }}>

      <div className="w-full mt-[12px]">
        <img src="/hero.webp" className='px-[26px]' alt="hero" />

        <div className="flex justify-between mt-[15px] items-center">
          <div style={{
            backgroundImage: "url('/landing-stats-bg.png')",
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            overflow: "hidden"
          }}
            className="w-[80%] h-[46px] px-6 pt-1 pb-2 flex justify-between items-center"
          >
            <div className="flex items-center justify-center">
              <img src="/fish-icon.png" alt="fish icon" className="w-[24px] h-[24px]" />
              <span className="mx-1">0</span>
            </div>

            <div className="flex items-center justify-center">
              <img src="/penguin-icon.png" alt="fish icon" className="w-[20px] h-[20px]" />
              <span className="mx-1">0</span>
            </div>

            <div className="flex items-center justify-center">
              <img src="/eth-icon.png" alt="fish icon" className="w-[24px] h-[24px]" />
              <span className="">{truncateEther(balance)} ETH</span>
            </div>
          </div>

          <div className="mx-1"></div>

          <button
            className="text-white relative w-[40px] h-[40px]"
            onClick={() => setMenuState(MenuStates.videoSettings)}
          >
            <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
            <img src="/cog.png" alt="settings" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
          </button>
        </div>

        <div className="flex justify-between ml-2 mt-5">
          <div className="flex items-center">
            <div className="relative w-[40px] h-[40px]">
              <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
              <LightingIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="ml-2 flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                HIGH SCORE
              </span>
              <span className="text-[24px] mt-[-9px]">0</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                LEADRBOARD
              </span>
              <span className="text-[24px] mt-[-9px] text-right">1</span>
            </div>

            <div className="relative w-[40px] h-[40px] ml-2">
              <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
              <img src="/trophy-icon.png" alt="trophy-icon" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="ml-2 mt-2">
          <div className="flex items-center mt-2">
            <div className="relative w-[40px] h-[40px]">
              <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
              <ChestIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div className="ml-2 flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                RAFFLE
              </span>
              <span className="text-[24px] mt-[-9px]">$NOOT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 mb-10">
        <img src="/noot.webp" alt="noot" className="relative bottom-[-4px] w-[60%] mx-auto" />
        <div className="relative w-full h-[88px] mt-[-20px]">
          <img src="/button-cover.svg" className="absolute z-[9] top-[-14px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
          <PrimaryButton
            color='green'
            className="w-full text-[40px]"
            shineClassName="h-[70%]"
            onClick={() => setGameState('playing')}
          >
            PLAY NOW
          </PrimaryButton>
        </div>

        <div className="flex gap-[13px] w-full">
          <PrimaryButton
            color='blue'
            className="w-[calc(33%-6.5px)]"
            shineClassName="h-[50%]"
            onClick={() => setMenuState(MenuStates.upgrades)}
          >
            <div className="flex flex-col justify-center items-center">
              <StarIcon />

              UPGRADE
            </div>

          </PrimaryButton>

          <PrimaryButton
            color='blue'
            className="w-[calc(33%-6.5px)]"
            shineClassName="h-[50%]"
            onClick={() => setMenuState(MenuStates.items)}
          >
            <div className="flex flex-col justify-center items-center">
              <ShoppingCartIcon />
              SHOP
            </div>

          </PrimaryButton>

          <PrimaryButton
            color='blue'
            className="w-[calc(33%-6.5px)]"
            shineClassName="h-[50%]"
            onClick={() => setMenuState(MenuStates.skins)}
          >
            <div className="flex flex-col justify-center items-center">
              <img src="/coming-soon-icon.png" alt="coming soon icon" />
              SKINS
            </div>

          </PrimaryButton>
        </div>


      </div>
    </div >
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
  abstractClient: AbstractClient | undefined;
  address: `0x${string}`;
  publicClient: PublicClient | null;
};

const revivePrices = [50, 169, 420];

const Reviving = ({ setGameState, address, publicClient, abstractClient }: RevivingProps) => {
  const [timer, setTimer] = useState(0);
  const [reviveCount, setReviveCount] = useAtom(reviveCountAtom);

  useEffect(() => {
    const i = setInterval(() => {
      setTimer((t) => {
        const newTime = t + 1;
        if (newTime === 60) {
          setGameState("game-over");
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(i);
    };
  }, []);

  const currentPrice = revivePrices[reviveCount - 1];

  const handleRevive = async () => {
    try {
      const balance = await publicClient!.readContract({
        abi: parseAbi([
          "function balanceOf(address account) view returns (uint256)",
        ]),
        address: NootToken.address as `0x${string}`,
        functionName: "balanceOf",
        args: [address],
      });

      const toSend = parseEther(currentPrice + "");

      if (balance < toSend) {
        toast.error("Not enough $NOOT balance");
        return;
      }

      const tx = await abstractClient!.writeContract({
        abi: parseAbi([
          "function transfer(address to, uint256 value) external returns (bool)",
        ]),
        address: NootToken.address as `0x${string}`,
        functionName: "transfer",
        args: [nootTreasury, toSend],
      });

      setGameState("playing");
    } catch (e) {
      console.log(e);
      setGameState("game-over");
    }
  };

  const handleSkip = () => {
    setGameState("game-over");
    setReviveCount(0);
  };

  return (
    <div className="w-full px-[32px] flex justify-center h-full items-center">
      <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">

        <h2 className="text-2xl font-bold text-center mb-[24px]">Continue?</h2>
        <p className="text-center mb-[8px]">Time left: {60 - timer}</p>
        <div style={{ background: 'radial-gradient(circle, #A6F6FF 0%, #1594B9 100%)' }} className="rounded-md border-2 border-black">
          <img src="/revive.png" alt="revive" className="" />

          <p className="text-center mb-[8px] text-[20px] uppercase"><span className="font-bold text-[#A5F0FF]">{3 - reviveCount + 1}/3</span>  Revives left</p>

        </div>


        <div className="flex gap-[8px] flex-col mt-[10px]">
          <button
            onClick={handleRevive}
            className="bg-green-500 rounded-md px-4 py-2 rounded-md text-[20px] uppercase"
          >
            Revive for  {currentPrice} $NOOT
          </button>

          <button
            className="rounded bg-red-500 py-2 text-white"
            onClick={handleSkip}
          >
            END RUN
          </button>
        </div>
      </div>
    </div>
  );
};
