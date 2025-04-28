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
  hasFishingNetAtom,
  hasMultiplierAtom,
} from "@/atoms";
import { toast, Toaster } from "react-hot-toast";
import NootToken from "../addresses/Noot.json";
import { AbstractClient } from "@abstract-foundation/agw-client";
import ConnectButton from "./ConnectButton";
import { ItemShop } from "./ItemShop";
import PrimaryButton from "./buttons/PrimaryButton";

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
  const [items, setItems] = useState<IUserItem[]>([]);
  const setHaloQuantity = useSetAtom(haloQuantityAtom);
  const setHasSlowSkis = useSetAtom(hasSlowSkisAtom);
  const setHasLuckyCharm = useSetAtom(hasLuckyCharmAtom);
  const setSpeedyStartQuantity = useSetAtom(speedyStartQuantityAtom);
  const [hasFishingNet] = useAtom(hasFishingNetAtom);
  const [hasMultiplier] = useAtom(hasMultiplierAtom);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });


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
                abstractClient={abstractClient}
              />
            ) : (
              <>
                {(!isConnected || menuState === MenuStates.landingPage) && (
                  <LandingPage
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
                        address={address as `0x${string}`}
                        items={items}
                        handlePurchase={handlePurchase}
                        onToggle={toggleItem}
                      />
                    )}

                    {menuState === MenuStates.skins && (
                      <Skins
                        onClose={() => setMenuState(MenuStates.landingPage)}
                        address={address as `0x${string}`}
                      />
                    )}
                    {menuState === MenuStates.upgrades && (
                      <Upgrades
                        onClose={() => setMenuState(MenuStates.landingPage)}
                        address={address as `0x${string}`}
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
};


const LandingPage = ({
  address,
  isRegistered,
  register,
  setGameState,
  setMenuState,
  isLoading,
  isConnected,
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
              <span className="mx-1">312</span>
            </div>

            <div className="flex items-center justify-center">
              <img src="/penguin-icon.png" alt="fish icon" className="w-[20px] h-[20px]" />
              <span className="mx-1">12</span>
            </div>

            <div className="flex items-center justify-center">
              <img src="/eth-icon.png" alt="fish icon" className="w-[24px] h-[24px]" />
              <span className="">0.234 ETH</span>
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
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="19" height="27" viewBox="0 0 19 27" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.0803 6.99471C17.9197 6.80961 17.7082 6.6759 17.4721 6.61028C17.2361 6.54466 16.9859 6.55004 16.7529 6.62573L9.66279 8.93984L12.1291 1.92131C12.2389 1.62647 12.2328 1.30096 12.1121 1.01041C11.9914 0.71986 11.765 0.485882 11.4787 0.35565C11.1923 0.225418 10.8672 0.208616 10.5689 0.308632C10.2706 0.408649 10.0213 0.618045 9.87132 0.894603L0.816222 16.8086C0.68982 17.0319 0.635322 17.2886 0.660157 17.544C0.684991 17.7993 0.78795 18.0408 0.955001 18.2355C1.12205 18.4302 1.34507 18.5686 1.59365 18.6319C1.84224 18.6952 2.1043 18.6804 2.34412 18.5893L10.132 15.6295L7.10427 25.2549C7.01343 25.5535 7.03782 25.8753 7.17265 26.1568C7.30748 26.4383 7.54293 26.659 7.83252 26.7754C8.12211 26.8917 8.4448 26.8952 8.73687 26.7853C9.02894 26.6753 9.26918 26.4598 9.41015 26.1814L18.2327 8.37836C18.3476 8.1587 18.3946 7.90975 18.3674 7.6633C18.3403 7.41684 18.2403 7.18407 18.0803 6.99471Z" fill="#003C80" />
                <path d="M10.974 1.30295L1.92289 17.221C1.87599 17.2933 1.85367 17.3789 1.85923 17.465C1.8648 17.551 1.89794 17.633 1.95376 17.6987C2.00958 17.7644 2.0851 17.8104 2.16911 17.8298C2.25312 17.8493 2.34116 17.8411 2.42016 17.8065L11.0381 14.5339C11.1105 14.4967 11.1924 14.4824 11.273 14.4928C11.3537 14.5032 11.4292 14.538 11.4897 14.5923C11.5502 14.6467 11.5927 14.7182 11.6116 14.7973C11.6305 14.8764 11.6249 14.9594 11.5956 15.0352L8.29915 25.4908C8.25874 25.5913 8.2599 25.7038 8.3024 25.8034C8.34489 25.9031 8.42522 25.9818 8.52573 26.0222C8.62624 26.0626 8.73869 26.0615 8.83833 26.019C8.93798 25.9765 9.01667 25.8961 9.05709 25.7956L17.8796 7.9886C17.9195 7.91671 17.9364 7.83428 17.9279 7.75249C17.9194 7.6707 17.8859 7.59349 17.8321 7.53134C17.7783 7.46918 17.7066 7.42508 17.6269 7.405C17.5472 7.38493 17.4632 7.38985 17.3863 7.4191L9.47415 10.0019C9.40126 10.0294 9.32193 10.035 9.24588 10.0182C9.16983 10.0013 9.10033 9.96264 9.04589 9.90691C8.99145 9.85119 8.95441 9.78081 8.93931 9.70438C8.9242 9.62795 8.93168 9.54878 8.96084 9.47653L11.7159 1.63984C11.7605 1.54145 11.7643 1.42934 11.7263 1.32818C11.6883 1.22702 11.6117 1.14509 11.5134 1.10041C11.415 1.05574 11.3029 1.05198 11.2017 1.08997C11.1006 1.12795 11.0186 1.20456 10.974 1.30295Z" fill="#91D9F8" />
                <path d="M2.42033 17.8066L11.0383 14.5339C11.0897 14.5131 11.1449 14.5032 11.2003 14.5048C11.2558 14.5064 11.3103 14.5195 11.3604 14.5432C11.4105 14.567 11.4552 14.6009 11.4916 14.6428C11.5279 14.6847 11.5552 14.7336 11.5717 14.7866C12.867 13.3428 16.1594 9.61695 15.7664 9.41642C15.2811 9.17177 6.14183 14.6302 5.55232 13.5594C4.96282 12.4885 7.39302 8.2373 7.39302 8.2373C7.39302 8.2373 7.0722 8.54612 6.59097 8.98327L1.90702 17.221C1.85576 17.2946 1.83061 17.3831 1.83558 17.4726C1.84055 17.5621 1.87535 17.6474 1.93444 17.7148C1.99352 17.7822 2.07349 17.8278 2.16156 17.8445C2.24963 17.8611 2.34073 17.8478 2.42033 17.8066Z" fill="#37B3E7" />
                <path d="M14.1901 11.7717C13.2322 12.7935 12.1765 13.719 11.0381 14.535C11.1104 14.4978 11.1923 14.4835 11.273 14.4939C11.3536 14.5044 11.4292 14.5391 11.4896 14.5935C11.5501 14.6478 11.5926 14.7193 11.6115 14.7984C11.6304 14.8775 11.6248 14.9605 11.5955 15.0363L8.38733 25.1671C8.34188 25.3836 8.30579 25.5762 8.27905 25.7446C8.30204 25.8082 8.33987 25.8654 8.38939 25.9114C8.43891 25.9574 8.49869 25.991 8.56378 26.0093C9.84304 23.6029 14.7395 12.0725 15.7822 9.52979C15.3328 10.3316 14.7991 11.0832 14.1901 11.7717Z" fill="white" />
                <path d="M12.2451 14.0254C11.5266 14.2691 10.8224 14.5529 10.1357 14.8756L11.038 14.5347C11.1103 14.4975 11.1922 14.4832 11.2729 14.4937C11.3535 14.5041 11.4291 14.5388 11.4896 14.5932C11.55 14.6476 11.5925 14.719 11.6114 14.7981C11.6303 14.8772 11.6248 14.9602 11.5954 15.0361L8.29902 25.4917C8.27185 25.5745 8.27242 25.664 8.30064 25.7465C8.32886 25.829 8.3832 25.9 8.45542 25.9489C8.93264 23.6989 12.6261 14.0254 12.2451 14.0254Z" fill="#006AB6" />
                <path d="M2.02699 17.7391C3.23006 15.2325 10.6049 2.82775 10.9538 2.09783C11.3548 1.29571 11.7157 1.64463 11.7157 1.64463C11.7609 1.54624 11.7652 1.43392 11.7276 1.33238C11.69 1.23085 11.6136 1.14841 11.5152 1.1032C11.4168 1.058 11.3045 1.05373 11.203 1.09133C11.1015 1.12894 11.019 1.20534 10.9738 1.30373L1.92273 17.2218C1.87458 17.306 1.85861 17.4049 1.87778 17.5C1.89695 17.5951 1.94997 17.6801 2.02699 17.7391Z" fill="#37B3E7" />
                <path d="M17.3866 7.42L9.4744 10.0028C9.40151 10.0303 9.32218 10.0359 9.24613 10.0191C9.17008 10.0022 9.10058 9.96354 9.04614 9.90781C8.9917 9.85209 8.95466 9.78172 8.93956 9.70528C8.92445 9.62885 8.93193 9.54968 8.96109 9.47743C8.96109 9.47743 8.33951 10.3517 8.47987 10.7688C8.62022 11.1859 17.2382 7.56037 17.8879 7.6486C17.8493 7.55367 17.7759 7.47709 17.6827 7.43458C17.5895 7.39207 17.4835 7.38686 17.3866 7.42Z" fill="white" />
              </svg>
            </div>

            <div className="ml-2 flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                HIGH SCORE
              </span>
              <span className="text-[24px] mt-[-9px]">323,232</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                LEADBOARD
              </span>
              <span className="text-[24px] mt-[-9px] text-right">20</span>
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
              <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="31" height="26" viewBox="0 0 31 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25.0731 18.2574C25.0187 18.2107 24.9545 18.1767 24.8853 18.1579C24.816 18.1392 24.7435 18.1361 24.6729 18.1489C24.6023 18.1374 24.5301 18.1418 24.4615 18.1619C24.3929 18.1819 24.3296 18.2171 24.2764 18.2648C24.1155 18.4257 24.4597 18.4257 24.6691 18.4257C24.8936 18.422 25.2228 18.4182 25.0731 18.2574Z" fill="#F8D21E" />
                <path d="M24.8497 18.2351C24.8497 18.2876 24.7785 18.3288 24.6885 18.3288C24.5985 18.3288 24.5273 18.2876 24.5236 18.2388C24.5198 18.1901 24.5985 18.1451 24.6848 18.1413C24.771 18.1376 24.8497 18.1826 24.8497 18.2351Z" fill="#F9ED43" />
                <path d="M26.5358 19.0244C26.5374 19.0007 26.5374 18.9769 26.5358 18.9533C26.5379 18.9359 26.5379 18.9183 26.5358 18.9009C26.5313 18.8792 26.525 18.858 26.5171 18.8373C26.444 18.6706 26.3351 18.5222 26.198 18.4025C26.0609 18.2829 25.899 18.195 25.724 18.1452C25.0535 17.9095 24.3216 17.9161 23.6554 18.1639C23.4816 18.217 23.3216 18.3079 23.1871 18.4302C23.0526 18.5524 22.9468 18.703 22.8774 18.871C22.8774 18.8897 22.8774 18.9084 22.8774 18.9308C22.8774 18.9495 22.8774 18.9682 22.8774 18.9869C22.8755 19.0094 22.8755 19.0319 22.8774 19.0543V19.1403C22.8761 19.2997 22.9088 19.4576 22.9733 19.6034C23.0378 19.7492 23.1326 19.8795 23.2514 19.9858L23.3113 20.0382C23.6789 20.2894 24.1155 20.4201 24.5607 20.4123H24.8487C24.9572 20.4123 25.0582 20.4123 25.1667 20.3861H25.2003C26.0869 20.2701 26.5507 19.8324 26.547 19.1216C26.547 19.1216 26.547 19.0917 26.547 19.0767C26.547 19.0618 26.5358 19.0356 26.5358 19.0244Z" fill="#8E381E" />
                <path d="M26.2517 19.0765C26.2517 19.4506 26.1096 20.1277 24.6918 20.1389C23.2741 20.1501 23.117 19.488 23.1133 19.1027C23.1133 18.5265 23.809 18.1487 24.6731 18.1412C25.5372 18.1337 26.248 18.5116 26.2517 19.0765Z" fill="#F47920" />
                <path d="M24.3701 20.1273C24.4674 20.1273 24.5759 20.1273 24.6918 20.1273H24.9387V19.8393L25.0434 19.8131V20.1199L25.1931 20.1012V19.7271L24.3701 19.8019V20.1273Z" fill="#FAAD1B" />
                <path d="M23.7266 19.6675C23.7041 19.5216 23.3301 19.3794 23.3301 19.3794L23.3675 19.7535L23.461 19.8358L23.4161 19.4954L23.5096 19.5403L23.5695 19.9144C23.6346 19.9547 23.7035 19.9885 23.7752 20.0154L23.7266 19.6675Z" fill="#FAAD1B" />
                <path d="M26.2517 19.0016C26.2517 19.4805 25.556 19.8771 24.6881 19.8845C23.8203 19.892 23.117 19.5104 23.1133 19.0241C23.1096 18.5378 23.8091 18.1487 24.6732 18.1412C25.5373 18.1337 26.248 18.5116 26.2517 19.0016Z" fill="#FAAD1B" />
                <path d="M26.2065 18.8003C26.21 18.8314 26.21 18.8627 26.2065 18.8938C26.2065 19.3652 25.5257 19.7543 24.6766 19.758C23.8275 19.7617 23.1354 19.3839 23.1317 18.92C23.1298 18.8889 23.1298 18.8576 23.1317 18.8265C23.1046 18.889 23.0918 18.9567 23.0943 19.0248C23.0943 19.5073 23.8013 19.8889 24.6691 19.8852C25.537 19.8815 26.2365 19.4812 26.2327 19.0023C26.239 18.9339 26.23 18.8649 26.2065 18.8003Z" fill="#F8D21E" />
                <path d="M25.8137 18.9946C25.8137 19.3388 25.3125 19.6268 24.6915 19.6305C24.0706 19.6343 23.5693 19.3574 23.5693 19.0095C23.5693 18.6616 24.0743 18.3773 24.6915 18.3736C25.3088 18.3698 25.81 18.6467 25.8137 18.9946Z" fill="#8E381E" />
                <path d="M25.6832 19.0537C25.6832 19.3492 25.238 19.5961 24.6844 19.5999C24.1308 19.6036 23.6856 19.3679 23.6819 19.0687C23.6782 18.7694 24.127 18.5262 24.6769 18.5187C25.2268 18.5112 25.6794 18.7544 25.6832 19.0537Z" fill="#F8D21E" />
                <path d="M25.5107 18.9981C25.5107 19.245 25.1367 19.4508 24.6841 19.4545C24.2314 19.4583 23.8536 19.26 23.8499 19.0094C23.8461 18.7587 24.2239 18.5604 24.6766 18.5567C25.1292 18.553 25.5107 18.7512 25.5107 18.9981Z" fill="#FAAD1B" />
                <path d="M24.8083 19.8141C24.8083 19.8516 24.7558 19.8853 24.6883 19.8853C24.6209 19.8853 24.5684 19.8553 24.5684 19.8178C24.5684 19.7803 24.6209 19.7466 24.6883 19.7466C24.7558 19.7466 24.8083 19.7766 24.8083 19.8141Z" fill="#F9ED43" />
                <path d="M24.8046 19.5221C24.8046 19.5596 24.7521 19.5896 24.6846 19.5896C24.6171 19.5896 24.5684 19.5596 24.5646 19.5221C24.5609 19.4846 24.6209 19.4546 24.6846 19.4546C24.7483 19.4546 24.8046 19.4846 24.8046 19.5221Z" fill="#F9ED43" />
                <path d="M25.0772 18.654C24.9579 18.5789 24.8198 18.5391 24.6788 18.5391C24.5378 18.5391 24.3997 18.5789 24.2804 18.654C24.1158 18.8148 24.4637 18.8148 24.6732 18.8148C24.8939 18.8148 25.2418 18.8111 25.0772 18.654Z" fill="#F8D21E" />
                <path d="M24.8498 18.6281C24.8498 18.6806 24.7749 18.7218 24.6886 18.7218C24.6024 18.7218 24.5237 18.6843 24.5237 18.6318C24.5237 18.5793 24.5949 18.5381 24.6849 18.5381C24.7749 18.5381 24.8498 18.5756 24.8498 18.6281Z" fill="#F9ED43" />
                <path d="M24.5533 18.2308L24.7366 18.4627C24.7366 18.4627 24.7366 18.4627 24.759 18.4627L25.0358 18.3542C25.0545 18.3542 25.0695 18.3542 25.0545 18.3842L24.8226 18.5712V18.5899L24.9311 18.8667C24.9311 18.8667 24.9311 18.9004 24.9012 18.8667L24.7141 18.6348C24.7141 18.6348 24.7141 18.6348 24.6954 18.6348L24.4186 18.7433C24.3999 18.7433 24.3849 18.7246 24.3999 18.7134L24.6318 18.53C24.6335 18.5265 24.6344 18.5227 24.6344 18.5188C24.6344 18.5149 24.6335 18.5111 24.6318 18.5076L24.5233 18.2308C24.5159 18.2308 24.5421 18.2158 24.5533 18.2308Z" fill="white" />
                <path d="M24.9011 19.589L24.8786 19.7761L25.0507 19.8509C25.0507 19.8509 25.0507 19.8771 25.0507 19.8734L24.8637 19.8546L24.7888 20.0267C24.7888 20.0267 24.7627 20.0267 24.7664 20.0267L24.7851 19.8397L24.613 19.7649C24.613 19.7649 24.613 19.7387 24.613 19.7424H24.8001L24.8749 19.5703L24.9011 19.589Z" fill="white" />
                <path d="M3.381 19.9446C3.32641 19.8981 3.26221 19.8643 3.19302 19.8455C3.12382 19.8268 3.05133 19.8236 2.98075 19.8361C2.91019 19.8246 2.83796 19.8291 2.76934 19.8491C2.70073 19.8692 2.63748 19.9044 2.58424 19.9521C2.41965 20.113 2.76753 20.1092 2.9583 20.1129C3.19771 20.1092 3.54559 20.1017 3.381 19.9446Z" fill="#F8D21E" />
                <path d="M3.15381 19.9224C3.15381 19.9711 3.07883 20.0161 2.9926 20.0161C2.90637 20.0161 2.82764 19.9748 2.82764 19.9224C2.82764 19.8699 2.89887 19.8286 2.98885 19.8286C3.07883 19.8286 3.15381 19.8699 3.15381 19.9224Z" fill="#F9ED43" />
                <path d="M4.83981 20.7078C4.84167 20.6854 4.84167 20.6629 4.83981 20.6404V20.5843C4.83981 20.5656 4.83981 20.5469 4.83981 20.5207C4.76592 20.355 4.65663 20.2075 4.51962 20.0886C4.38261 19.9697 4.22122 19.8822 4.04678 19.8324C3.37917 19.5865 2.6458 19.5865 1.97819 19.8324C1.80433 19.8855 1.64439 19.9764 1.50986 20.0986C1.37533 20.2209 1.26955 20.3714 1.20012 20.5394C1.19883 20.5594 1.19883 20.5794 1.20012 20.5993C1.20012 20.618 1.20012 20.6367 1.20012 20.6554C1.19827 20.6778 1.19827 20.7003 1.20012 20.7228V20.8088C1.20003 20.968 1.23327 21.1255 1.2977 21.2711C1.36212 21.4167 1.4563 21.5472 1.57419 21.6543L1.63778 21.7029C2.00233 21.9576 2.4389 22.0887 2.88343 22.077H3.15276C3.26124 22.077 3.36598 22.077 3.47072 22.0546H3.50812C4.39467 21.9386 4.85851 21.5009 4.85103 20.7901V20.704L4.83981 20.7078Z" fill="#8E381E" />
                <path d="M4.55957 20.7562C4.55957 21.1303 4.41743 21.8036 2.99597 21.8149C1.57451 21.8261 1.42114 21.1639 1.42114 20.7824C1.42114 20.2062 2.11317 19.8284 2.98101 19.8209C3.84884 19.8134 4.55583 20.1913 4.55957 20.7562Z" fill="#F47920" />
                <path d="M2.67432 21.8111C2.77532 21.8111 2.88005 21.8111 2.99602 21.8111H3.24664V21.523L3.35138 21.4931V21.7999L3.50475 21.7812V21.4258L2.6818 21.5006L2.67432 21.8111Z" fill="#FAAD1B" />
                <path d="M2.03079 21.355C2.00835 21.2091 1.63428 21.0669 1.63428 21.0669L1.67168 21.441C1.70104 21.4716 1.73227 21.5003 1.7652 21.527L1.72031 21.1866L1.81383 21.2315L1.86994 21.6056C1.93676 21.6452 2.00684 21.679 2.07942 21.7066L2.03079 21.355Z" fill="#FAAD1B" />
                <path d="M4.55942 20.6854C4.55942 21.168 3.86366 21.5646 2.99582 21.5683C2.12798 21.572 1.42099 21.1942 1.41725 20.7116C1.41351 20.229 2.11302 19.8362 2.98086 19.8287C3.84869 19.8212 4.55568 20.2066 4.55942 20.6854Z" fill="#FAAD1B" />
                <path d="M4.51467 20.4873C4.51832 20.5184 4.51832 20.5498 4.51467 20.5808C4.51467 21.0522 3.83013 21.4375 2.98473 21.445C2.13934 21.4525 1.44357 21.0709 1.43983 20.607C1.43798 20.5746 1.43798 20.5421 1.43983 20.5097C1.41367 20.5739 1.39972 20.6425 1.39868 20.7118C1.39868 21.1906 2.10941 21.5759 2.97725 21.5685C3.84509 21.561 4.5446 21.1682 4.54086 20.6856C4.5431 20.6185 4.53425 20.5515 4.51467 20.4873Z" fill="#F8D21E" />
                <path d="M4.12186 20.6774C4.12186 21.0253 3.61686 21.3096 2.99965 21.3171C2.38243 21.3246 1.87744 21.044 1.87744 20.6961C1.87744 20.3481 2.37869 20.0638 2.99965 20.0601C3.6206 20.0564 4.11811 20.3332 4.12186 20.6774Z" fill="#8E381E" />
                <path d="M3.98727 20.7559C3.98727 21.0552 3.54587 21.3021 2.99225 21.3058C2.43863 21.3096 1.98975 21.0701 1.98975 20.7746C1.98975 20.479 2.43115 20.2284 2.98477 20.2247C3.53839 20.2209 3.98727 20.4416 3.98727 20.7559Z" fill="#F8D21E" />
                <path d="M3.81885 20.6851C3.81885 20.932 3.44478 21.134 2.99216 21.1377C2.53954 21.1415 2.16173 20.9432 2.15799 20.6963C2.15425 20.4494 2.53206 20.2437 2.98468 20.2437C3.4373 20.2437 3.81511 20.4344 3.81885 20.6851Z" fill="#FAAD1B" />
                <path d="M3.11266 21.505C3.11266 21.5425 3.06017 21.5725 2.99644 21.5725C2.9327 21.5725 2.87646 21.5425 2.87646 21.505C2.87646 21.4675 2.92895 21.4375 2.99269 21.4375C3.05642 21.4375 3.11266 21.4637 3.11266 21.505Z" fill="#F9ED43" />
                <path d="M3.1125 21.2057C3.1125 21.2432 3.06001 21.2769 2.99253 21.2769C2.92505 21.2769 2.87256 21.2469 2.87256 21.2094C2.87256 21.1719 2.92505 21.1382 2.99253 21.1382C3.06001 21.1382 3.1125 21.1682 3.1125 21.2057Z" fill="#F9ED43" />
                <path d="M3.38516 20.3372C3.33056 20.2907 3.26637 20.2569 3.19717 20.2381C3.12798 20.2194 3.05549 20.2161 2.9849 20.2287C2.91435 20.2172 2.84211 20.2216 2.7735 20.2417C2.70488 20.2618 2.64163 20.297 2.58839 20.3447C2.4238 20.5055 2.77168 20.5055 2.96246 20.5055C3.20186 20.5018 3.54975 20.4943 3.38516 20.3372Z" fill="#F8D21E" />
                <path d="M3.15372 20.3149C3.15372 20.3674 3.08249 20.4087 2.99251 20.4087C2.90253 20.4087 2.8313 20.3674 2.8313 20.3187C2.8313 20.2699 2.90253 20.2212 2.99251 20.2212C3.08249 20.2212 3.15372 20.2624 3.15372 20.3149Z" fill="#F9ED43" />
                <path d="M2.86105 19.9183L3.04434 20.1502C3.04434 20.1502 3.04434 20.1502 3.06678 20.1502L3.33985 20.0417V20.0717L3.10793 20.255C3.10627 20.2585 3.1054 20.2623 3.1054 20.2662C3.1054 20.2701 3.10627 20.2739 3.10793 20.2774L3.21641 20.5542C3.21641 20.5542 3.21641 20.5879 3.18274 20.5542L2.99945 20.3223H2.97701L2.70394 20.4308C2.68149 20.4308 2.66653 20.4121 2.70394 20.4009L2.93586 20.2138C2.93586 20.2138 2.93586 20.2138 2.93586 20.1951L2.82738 19.9183C2.8199 19.9183 2.84608 19.9033 2.86105 19.9183Z" fill="white" />
                <path d="M3.2094 21.2762L3.18691 21.4637L3.35937 21.5386V21.5611L3.17566 21.5386L3.10068 21.7111H3.07819L3.10068 21.5236L2.92822 21.4487V21.4262L3.11568 21.4487L3.19066 21.2762C3.19066 21.2762 3.2094 21.2612 3.2094 21.2762Z" fill="white" />
                <path d="M4.60439 22.8217C4.5504 22.7742 4.48638 22.7394 4.41708 22.7199C4.34779 22.7005 4.275 22.6969 4.20414 22.7095C4.13358 22.6975 4.0612 22.7017 3.9925 22.7217C3.9238 22.7418 3.86057 22.7773 3.80763 22.8255C3.64304 22.9864 3.99092 22.9864 4.1817 22.9864C4.4211 23.0013 4.76898 22.9789 4.60439 22.8217Z" fill="#F8D21E" />
                <path d="M4.36563 22.7956C4.36563 22.8481 4.2944 22.8893 4.20442 22.8893C4.11445 22.8893 4.04321 22.8518 4.04321 22.7993C4.04321 22.7468 4.11445 22.7056 4.20442 22.7056C4.2944 22.7056 4.36563 22.7431 4.36563 22.7956Z" fill="#F9ED43" />
                <path d="M6.06332 23.5843C6.06518 23.5619 6.06518 23.5394 6.06332 23.517C6.0654 23.4996 6.0654 23.482 6.06332 23.4646C6.06465 23.4434 6.06465 23.4222 6.06332 23.401C5.98966 23.2348 5.88049 23.0866 5.74349 22.9671C5.60649 22.8475 5.44498 22.7594 5.2703 22.7089C4.93868 22.5873 4.58723 22.529 4.23413 22.5368C3.88101 22.5345 3.53067 22.5993 3.2017 22.7276C3.02675 22.775 2.86451 22.8606 2.72671 22.9784C2.58892 23.0961 2.47901 23.243 2.40493 23.4085C2.40493 23.4272 2.40493 23.4459 2.40493 23.4683C2.40311 23.487 2.40311 23.5058 2.40493 23.5245C2.40493 23.5469 2.40493 23.5693 2.40493 23.5918C2.40493 23.6142 2.40493 23.618 2.40493 23.6292V23.6741C2.40367 23.8335 2.43637 23.9914 2.50087 24.1371C2.56537 24.2829 2.66019 24.4133 2.779 24.5196L2.83885 24.5719C3.2049 24.8264 3.64258 24.9575 4.08824 24.946H4.42865C4.53503 24.9431 4.64117 24.9343 4.7466 24.9199H4.78401C5.66681 24.8039 6.13439 24.3699 6.12691 23.6591V23.5731L6.06332 23.5843Z" fill="#8E381E" />
                <path d="M5.77124 23.6404C5.77124 24.0145 5.6291 24.6878 4.21138 24.6991C2.79366 24.7103 2.63655 24.0481 2.63281 23.6628C2.63281 23.0904 3.32858 22.7088 4.19642 22.7051C5.06426 22.7014 5.77124 23.0642 5.77124 23.6404Z" fill="#F47920" />
                <path d="M3.90096 24.6884C4.00196 24.6884 4.1067 24.6884 4.22266 24.6884C4.33862 24.6884 4.39473 24.6884 4.46954 24.6884V24.4003L4.57054 24.3741V24.6809L4.72017 24.6622V24.2881L3.89722 24.3629L3.90096 24.6884Z" fill="#FAAD1B" />
                <path d="M3.2427 24.2282C3.22026 24.086 2.84619 23.9438 2.84619 23.9438L2.8836 24.318C2.91303 24.3485 2.94425 24.3772 2.97711 24.404L2.92849 24.0598L3.022 24.1085L3.08185 24.4826C3.14828 24.5229 3.21843 24.5567 3.29133 24.5836L3.2427 24.2282Z" fill="#FAAD1B" />
                <path d="M5.77126 23.5618C5.77126 24.0407 5.07549 24.4372 4.20765 24.4447C3.33982 24.4522 2.63657 24.0706 2.63283 23.588C2.62909 23.1054 3.32859 22.7088 4.19643 22.7051C5.06427 22.7014 5.77126 23.0792 5.77126 23.5618Z" fill="#FAAD1B" />
                <path d="M5.73383 23.3745C5.73774 23.4056 5.73774 23.437 5.73383 23.468C5.73383 23.9357 5.05302 24.3247 4.20389 24.3322C3.35475 24.3397 2.66647 23.9581 2.66273 23.4905C2.6572 23.4596 2.6572 23.4279 2.66273 23.397C2.63586 23.4609 2.62188 23.5296 2.62158 23.599C2.62158 24.0778 3.33231 24.4632 4.19641 24.4557C5.06051 24.4482 5.76375 24.0516 5.76001 23.5728C5.7658 23.5056 5.75687 23.4379 5.73383 23.3745Z" fill="#F8D21E" />
                <path d="M5.34109 23.5548C5.34109 23.8989 4.83984 24.187 4.21888 24.1907C3.59793 24.1945 3.09668 23.9176 3.09668 23.5697C3.09668 23.2218 3.59793 22.9412 4.21888 22.9337C4.83984 22.9263 5.34109 23.2068 5.34109 23.5548Z" fill="#8E381E" />
                <path d="M5.21028 23.6148C5.21028 23.914 4.76513 24.1572 4.21525 24.161C3.66537 24.1647 3.21275 23.929 3.20901 23.6297C3.20527 23.3304 3.65415 23.0873 4.20777 23.0835C4.76139 23.0798 5.20654 23.3155 5.21028 23.6148Z" fill="#F8D21E" />
                <path d="M5.02309 23.5587C5.02309 23.8056 4.64902 24.0114 4.20014 24.0151C3.75126 24.0189 3.36597 23.8206 3.36597 23.5737C3.36597 23.3267 3.74004 23.121 4.19266 23.1172C4.64528 23.1135 5.02309 23.3118 5.02309 23.5587Z" fill="#FAAD1B" />
                <path d="M4.33556 24.3737C4.33556 24.4112 4.28307 24.4449 4.21559 24.4449C4.1481 24.4449 4.09937 24.4149 4.09937 24.3774C4.09937 24.3399 4.15185 24.3062 4.21559 24.3062C4.27932 24.3062 4.33556 24.3362 4.33556 24.3737Z" fill="#F9ED43" />
                <path d="M4.33166 24.0826C4.33166 24.1201 4.27917 24.1501 4.21543 24.1501C4.1517 24.1501 4.09546 24.1239 4.09546 24.0826C4.09546 24.0414 4.14795 24.0151 4.21543 24.0151C4.28292 24.0151 4.33166 24.0451 4.33166 24.0826Z" fill="#F9ED43" />
                <path d="M4.60395 23.214C4.48463 23.139 4.34653 23.0991 4.20557 23.0991C4.0646 23.0991 3.9265 23.139 3.80718 23.214C3.64634 23.3712 3.99422 23.3712 4.18125 23.3712C4.4244 23.3749 4.76854 23.3749 4.60395 23.214Z" fill="#F8D21E" />
                <path d="M4.36954 23.1881C4.36954 23.2406 4.29831 23.2856 4.20833 23.2856C4.11835 23.2856 4.04712 23.2444 4.04712 23.1919C4.04712 23.1394 4.11835 23.0981 4.20833 23.0981C4.29831 23.0981 4.36954 23.1394 4.36954 23.1881Z" fill="#F9ED43" />
                <path d="M4.08434 22.7952L4.26763 23.0271L4.54444 22.9186C4.5476 22.9201 4.55027 22.9225 4.55214 22.9255C4.554 22.9285 4.55499 22.9319 4.55499 22.9354C4.55499 22.939 4.554 22.9424 4.55214 22.9454C4.55027 22.9483 4.5476 22.9507 4.54444 22.9523L4.31252 23.1356C4.31252 23.1356 4.31252 23.1356 4.31252 23.158L4.421 23.4311C4.41947 23.4343 4.41707 23.4369 4.4141 23.4388C4.41112 23.4407 4.40768 23.4417 4.40417 23.4417C4.40065 23.4417 4.39721 23.4407 4.39423 23.4388C4.39125 23.4369 4.38887 23.4343 4.38733 23.4311L4.20404 23.1992H4.18159L3.90479 23.3077V23.274L4.13671 23.0907C4.13868 23.0873 4.13971 23.0834 4.13971 23.0795C4.13971 23.0755 4.13868 23.0717 4.13671 23.0682L4.02823 22.7952C4.02823 22.7877 4.03118 22.7806 4.03644 22.7753C4.04171 22.77 4.04884 22.7671 4.05628 22.7671C4.06372 22.7671 4.07086 22.77 4.07612 22.7753C4.08138 22.7806 4.08434 22.7877 4.08434 22.7952Z" fill="white" />
                <path d="M4.4286 24.1498V24.3369L4.60067 24.4117V24.4341L4.41363 24.4117L4.33882 24.5838H4.31638L4.33882 24.3967L4.16675 24.3219V24.2995L4.35378 24.3219L4.4286 24.1498C4.43234 24.1236 4.4286 24.1498 4.4286 24.1498Z" fill="white" />
                <path d="M4.98603 18.6574C4.86671 18.5823 4.72861 18.5425 4.58765 18.5425C4.44668 18.5425 4.30858 18.5823 4.18926 18.6574C4.02842 18.8183 4.3763 18.8183 4.56333 18.8183C4.80648 18.822 5.15062 18.8183 4.98603 18.6574Z" fill="#F8D21E" />
                <path d="M4.75064 18.635C4.75064 18.6875 4.67941 18.7287 4.58943 18.7287C4.49945 18.7287 4.42822 18.6875 4.42822 18.6387C4.42822 18.59 4.49945 18.545 4.58943 18.5412C4.67941 18.5375 4.75064 18.5825 4.75064 18.635Z" fill="#F9ED43" />
                <path d="M6.44835 19.4245C6.44835 19.402 6.44835 19.3796 6.44835 19.3534C6.45043 19.336 6.45043 19.3184 6.44835 19.301C6.44385 19.2793 6.4376 19.2581 6.42965 19.2374C6.3597 19.0625 6.25043 18.9061 6.11032 18.7802C5.9702 18.6544 5.803 18.5625 5.62166 18.5116C5.29004 18.3901 4.93859 18.3317 4.58549 18.3396C4.23237 18.3373 3.88203 18.402 3.55306 18.5304C3.3779 18.5868 3.21751 18.6815 3.08357 18.8077C2.94962 18.9339 2.84549 19.0884 2.77874 19.2599C2.77874 19.2599 2.77874 19.2973 2.77874 19.3197V19.3758C2.77688 19.3982 2.77688 19.4208 2.77874 19.4432C2.77689 19.4568 2.77689 19.4707 2.77874 19.4843C2.7769 19.4992 2.7769 19.5143 2.77874 19.5292C2.77747 19.6886 2.81017 19.8465 2.87467 19.9923C2.93917 20.138 3.03399 20.2684 3.1528 20.3747L3.21266 20.427C3.58026 20.6783 4.01687 20.809 4.46204 20.8012H4.80245C4.91093 20.8012 5.01567 20.8011 5.12041 20.775H5.15407C6.04061 20.659 6.50446 20.2213 6.50072 19.5105C6.50256 19.4956 6.50256 19.4805 6.50072 19.4656C6.48723 19.4475 6.46915 19.4333 6.44835 19.4245Z" fill="#8E381E" />
                <path d="M6.16407 19.4764C6.16407 19.8505 6.02192 20.5276 4.6042 20.5388C3.18648 20.5501 3.02938 19.8879 3.02563 19.5026C3.02563 18.9265 3.7214 18.5486 4.58924 18.5411C5.45708 18.5336 6.14536 18.904 6.16407 19.4764Z" fill="#F47920" />
                <path d="M4.27523 20.5282C4.37248 20.5282 4.48096 20.5282 4.59692 20.5282C4.71289 20.5282 4.76525 20.5282 4.84381 20.5282V20.2402L4.94481 20.214V20.5207L5.09444 20.502V20.1279L4.27148 20.2027L4.27523 20.5282Z" fill="#FAAD1B" />
                <path d="M3.62471 20.0678C3.60601 19.9219 3.23193 19.7798 3.23193 19.7798L3.26934 20.1539C3.29702 20.1851 3.32843 20.2127 3.36286 20.2362L3.31423 19.8958L3.40775 19.9406L3.4676 20.3147C3.53403 20.3551 3.60418 20.3889 3.67708 20.4158L3.62471 20.0678Z" fill="#FAAD1B" />
                <path d="M6.16408 19.4016C6.16408 19.8804 5.46832 20.277 4.60048 20.2844C3.73264 20.2919 3.02939 19.9103 3.02565 19.424C3.02191 18.9377 3.72141 18.5486 4.58925 18.5411C5.45709 18.5336 6.14538 18.919 6.16408 19.4016Z" fill="#FAAD1B" />
                <path d="M6.11916 19.2002C6.12262 19.2313 6.12262 19.2626 6.11916 19.2937C6.11916 19.7651 5.43836 20.1542 4.58922 20.1579C3.74009 20.1616 3.04806 19.7838 3.04432 19.3199C3.04041 19.2889 3.04041 19.2574 3.04432 19.2264C3.01784 19.2892 3.00386 19.3565 3.00317 19.4247C3.00317 19.9072 3.7139 20.2926 4.578 20.2851C5.4421 20.2776 6.14535 19.8811 6.14161 19.4022C6.14903 19.334 6.14136 19.2651 6.11916 19.2002Z" fill="#F8D21E" />
                <path d="M5.72683 19.3945C5.72683 19.7386 5.22558 20.0267 4.60463 20.0305C3.98367 20.0342 3.48242 19.7574 3.48242 19.4094C3.48242 19.0615 3.98367 18.7772 4.60463 18.7735C5.22558 18.7697 5.72683 19.0466 5.72683 19.3945Z" fill="#8E381E" />
                <path d="M5.59552 19.4541C5.59552 19.7534 5.15038 19.9966 4.6005 20.0003C4.05063 20.0041 3.598 19.7684 3.59426 19.4691C3.59052 19.1698 4.0394 18.9266 4.58928 18.9229C5.13916 18.9192 5.59178 19.1548 5.59552 19.4541Z" fill="#F8D21E" />
                <path d="M5.42373 19.3985C5.42373 19.6454 5.04966 19.8512 4.59703 19.8549C4.14441 19.8587 3.7666 19.6604 3.7666 19.4097C3.7666 19.1591 4.14067 18.9608 4.58955 18.9571C5.03843 18.9533 5.42373 19.1516 5.42373 19.3985Z" fill="#FAAD1B" />
                <path d="M4.7209 20.214C4.7209 20.2515 4.66841 20.2852 4.60093 20.2852C4.53344 20.2852 4.48096 20.2552 4.48096 20.2177C4.48096 20.1802 4.53344 20.1465 4.60093 20.1465C4.66841 20.1465 4.7209 20.1765 4.7209 20.214Z" fill="#F9ED43" />
                <path d="M4.71715 19.9225C4.71715 19.96 4.66466 19.99 4.60093 19.99C4.53719 19.99 4.48096 19.96 4.48096 19.9225C4.48096 19.885 4.53344 19.855 4.59718 19.855C4.66091 19.855 4.71715 19.885 4.71715 19.9225Z" fill="#F9ED43" />
                <path d="M4.98951 19.0548C4.87019 18.9798 4.73209 18.9399 4.59112 18.9399C4.45016 18.9399 4.31206 18.9798 4.19274 19.0548C4.03189 19.2157 4.37603 19.2157 4.56681 19.2157C4.80995 19.2157 5.1541 19.212 4.98951 19.0548Z" fill="#F8D21E" />
                <path d="M4.75452 19.0285C4.75452 19.081 4.68329 19.1222 4.59331 19.126C4.50333 19.1297 4.4321 19.0847 4.42835 19.0322C4.4246 18.9797 4.50333 18.9385 4.58956 18.9385C4.67579 18.9385 4.75452 18.976 4.75452 19.0285Z" fill="#F9ED43" />
                <path d="M4.46609 18.6317L4.65312 18.8636L4.92993 18.7551C4.92993 18.7551 4.96359 18.7738 4.92993 18.785L4.69801 18.9721C4.69801 18.9721 4.69801 18.9721 4.69801 18.9908L4.80649 19.2676C4.80649 19.2676 4.80649 19.3013 4.77656 19.2676L4.59327 19.0357C4.58976 19.034 4.58593 19.0332 4.58205 19.0332C4.57816 19.0332 4.57433 19.034 4.57082 19.0357L4.29402 19.1442C4.29402 19.1442 4.26035 19.1255 4.29402 19.1142L4.52594 18.9309C4.52594 18.9309 4.52594 18.9309 4.52594 18.9085L4.41746 18.6317C4.42868 18.6317 4.45486 18.6167 4.46609 18.6317Z" fill="white" />
                <path d="M4.81384 20.0085V20.1955L4.98591 20.2704C4.98591 20.2704 4.98591 20.2966 4.98591 20.2928L4.79887 20.2741L4.72406 20.4462C4.72406 20.4462 4.69787 20.4462 4.70161 20.4462V20.2591L4.52954 20.1843C4.52954 20.1843 4.52954 20.1581 4.52954 20.1619L4.71658 20.1843L4.79139 20.0122C4.79139 20.0122 4.81758 19.9786 4.81384 20.0085Z" fill="white" />
                <path d="M2.93207 17.9096C2.8788 17.8621 2.81542 17.8273 2.74673 17.8079C2.67804 17.7884 2.60584 17.7848 2.53556 17.7974C2.46443 17.7866 2.39181 17.7914 2.32271 17.8114C2.25361 17.8314 2.18967 17.8662 2.13531 17.9133C1.97446 18.0742 2.32234 18.0742 2.50938 18.0742C2.75252 18.0705 3.1004 18.0667 2.93207 17.9096Z" fill="#F8D21E" />
                <path d="M2.69742 17.8835C2.69742 17.9359 2.62619 17.9772 2.53621 17.9809C2.44623 17.9847 2.375 17.9397 2.375 17.8872C2.375 17.8347 2.44623 17.7935 2.53621 17.7935C2.62619 17.7935 2.69742 17.8347 2.69742 17.8835Z" fill="#F9ED43" />
                <path d="M4.39496 18.6732C4.39496 18.6507 4.39496 18.6283 4.39496 18.6058C4.39653 18.5884 4.39653 18.5709 4.39496 18.5534C4.3973 18.5323 4.3973 18.511 4.39496 18.4898C4.32314 18.3129 4.21101 18.1551 4.0675 18.0291C3.92398 17.9031 3.75303 17.8124 3.56827 17.7641C3.23665 17.6425 2.8852 17.5842 2.5321 17.592C2.17915 17.5916 1.82915 17.6562 1.49967 17.7828C1.3235 17.839 1.16199 17.9335 1.02679 18.0597C0.891598 18.1858 0.786085 18.3404 0.717867 18.5123C0.719156 18.5322 0.719156 18.5522 0.717867 18.5722C0.715789 18.5895 0.715789 18.6071 0.717867 18.6245C0.717867 18.647 0.717867 18.6694 0.717867 18.6919C0.716024 18.7043 0.716024 18.7169 0.717867 18.7293C0.717867 18.7293 0.717867 18.7592 0.717867 18.7742C0.7166 18.9336 0.749308 19.0914 0.813807 19.2372C0.878307 19.383 0.97312 19.5134 1.09194 19.6196C1.1101 19.639 1.13015 19.6566 1.15179 19.672C1.51784 19.9265 1.95552 20.0575 2.40117 20.0461H2.74158C2.84796 20.0431 2.9541 20.0344 3.05953 20.0199H3.0932C3.97974 19.904 4.44733 19.47 4.43985 18.7592V18.6732H4.39496Z" fill="#8E381E" />
                <path d="M4.11084 18.7288C4.11084 19.1029 3.9687 19.7763 2.55098 19.7875C1.13326 19.7988 0.976153 19.1366 0.972412 18.7513C0.972412 18.1789 1.66818 17.8011 2.53602 17.7936C3.40386 17.7861 4.1071 18.1377 4.11084 18.7288Z" fill="#F47920" />
                <path d="M2.22908 19.7763C2.33008 19.7763 2.43482 19.7763 2.55078 19.7763C2.66674 19.7763 2.71911 19.7763 2.79767 19.7763V19.4882L2.89867 19.462V19.7688L3.04829 19.7501V19.376L2.22534 19.4508L2.22908 19.7763Z" fill="#FAAD1B" />
                <path d="M1.57449 19.3198C1.55205 19.1739 1.17798 19.0317 1.17798 19.0317L1.21538 19.4058C1.24391 19.4373 1.27521 19.4661 1.3089 19.4919L1.26027 19.1477L1.35379 19.1963L1.41364 19.5704C1.48074 19.6106 1.55077 19.6456 1.62312 19.6752L1.57449 19.3198Z" fill="#FAAD1B" />
                <path d="M4.11086 18.6503C4.11086 19.1328 3.41509 19.5257 2.54726 19.5331C1.67942 19.5406 0.976168 19.159 0.972427 18.6764C0.968686 18.1939 1.66819 17.801 2.53603 17.7936C3.40387 17.7861 4.10712 18.1714 4.11086 18.6503Z" fill="#FAAD1B" />
                <path d="M4.06545 18.4521C4.06936 18.4832 4.06936 18.5146 4.06545 18.5457C4.06545 19.017 3.38465 19.4024 2.53551 19.4099C1.68638 19.4173 0.994351 19.0357 0.990611 18.5681C0.986956 18.5371 0.986956 18.5057 0.990611 18.4746C0.963742 18.5386 0.949759 18.6072 0.949463 18.6766C0.949463 19.1555 1.66019 19.5408 2.52429 19.5333C3.38839 19.5258 4.09163 19.133 4.08789 18.6504C4.09488 18.5835 4.08723 18.5158 4.06545 18.4521Z" fill="#F8D21E" />
                <path d="M3.67288 18.6426C3.67288 18.9906 3.17163 19.2749 2.55067 19.2786C1.92972 19.2824 1.42847 19.0055 1.42847 18.6613C1.42847 18.3172 1.92972 18.0291 2.55067 18.0216C3.17163 18.0141 3.67288 18.2947 3.67288 18.6426Z" fill="#8E381E" />
                <path d="M3.52717 18.7022C3.52717 19.0015 3.08203 19.2446 2.53214 19.2521C1.98226 19.2596 1.52964 19.0164 1.5259 18.7171C1.52216 18.4178 1.97104 18.1747 2.52092 18.1709C3.0708 18.1672 3.52717 18.4029 3.52717 18.7022Z" fill="#F8D21E" />
                <path d="M3.37001 18.6466C3.37001 18.8972 2.99595 19.0992 2.54332 19.103C2.0907 19.1067 1.71289 18.9084 1.71289 18.6615C1.71289 18.4146 2.08696 18.2089 2.53958 18.2051C2.99221 18.2014 3.37001 18.3997 3.37001 18.6466Z" fill="#FAAD1B" />
                <path d="M2.66735 19.4618C2.66735 19.5031 2.61486 19.5331 2.54738 19.5331C2.4799 19.5331 2.43116 19.5031 2.42741 19.4656C2.42366 19.4281 2.48365 19.3981 2.54738 19.3943C2.61112 19.3906 2.66735 19.4243 2.66735 19.4618Z" fill="#F9ED43" />
                <path d="M2.66344 19.17C2.66344 19.2075 2.61095 19.2413 2.54722 19.2413C2.48348 19.2413 2.42725 19.2113 2.42725 19.1738C2.42725 19.1363 2.47973 19.1025 2.54347 19.1025C2.6072 19.1025 2.66344 19.1325 2.66344 19.17Z" fill="#F9ED43" />
                <path d="M2.93603 18.3029C2.81671 18.2278 2.67862 18.188 2.53765 18.188C2.39669 18.188 2.25859 18.2278 2.13927 18.3029C1.97842 18.4637 2.32256 18.46 2.51334 18.4637C2.75648 18.4637 3.10062 18.46 2.93603 18.3029Z" fill="#F8D21E" />
                <path d="M2.82617 18.3011C2.91521 18.3002 2.98697 18.2575 2.98645 18.2057C2.98593 18.154 2.91333 18.1127 2.8243 18.1136C2.73526 18.1145 2.66351 18.1572 2.66402 18.209C2.66454 18.2607 2.73714 18.302 2.82617 18.3011Z" fill="#F9ED43" />
                <path d="M2.40483 17.8832L2.59187 18.1152L2.86868 18.0067C2.86868 18.0067 2.90235 18.0067 2.86868 18.0404L2.63676 18.2237C2.63676 18.2237 2.63676 18.2237 2.63676 18.2461L2.7789 18.5117L2.74898 18.5304L2.56568 18.2985C2.56218 18.2968 2.55834 18.296 2.55446 18.296C2.55058 18.296 2.54675 18.2968 2.54324 18.2985L2.26643 18.407C2.26643 18.407 2.23276 18.3883 2.26643 18.3733L2.49835 18.19V18.1676L2.38987 17.8945C2.37491 17.8795 2.40483 17.8645 2.40483 17.8832Z" fill="white" />
                <path d="M2.77894 19.2601V19.4434L2.95101 19.5183V19.5407L2.76397 19.5183L2.68916 19.6904C2.68916 19.6904 2.66297 19.6904 2.66671 19.6904L2.68916 19.5033L2.51709 19.4285V19.406L2.70412 19.4285L2.77894 19.2564C2.77894 19.2564 2.77894 19.2265 2.77894 19.2601Z" fill="white" />
                <path d="M5.13564 16.6817C5.08146 16.6345 5.0173 16.6003 4.94797 16.5815C4.87865 16.5627 4.80596 16.5599 4.73539 16.5732C4.66483 16.5606 4.59231 16.5645 4.52351 16.5846C4.45471 16.6047 4.39151 16.6405 4.33888 16.6892C4.17429 16.8463 4.52217 16.8463 4.71294 16.8463H4.73165C4.95235 16.8426 5.30023 16.8388 5.13564 16.6817Z" fill="#F8D21E" />
                <path d="M4.89689 16.6417C4.89689 16.6942 4.82565 16.7392 4.73568 16.7392C4.6457 16.7392 4.57446 16.698 4.57446 16.6455C4.57446 16.593 4.6457 16.5518 4.73568 16.5518C4.82565 16.5518 4.89689 16.608 4.89689 16.6417Z" fill="#F9ED43" />
                <path d="M6.59461 17.4456C6.59646 17.4232 6.59646 17.4007 6.59461 17.3783V17.3259C6.59461 17.3072 6.59461 17.2885 6.59461 17.2623C6.52094 17.0961 6.41178 16.948 6.27478 16.8284C6.13778 16.7088 5.97627 16.6207 5.80159 16.5702C5.47126 16.4487 5.12104 16.3903 4.76916 16.3982C4.41499 16.3977 4.06376 16.4623 3.73299 16.5889C3.55914 16.642 3.3992 16.7329 3.26467 16.8552C3.13014 16.9775 3.02436 17.128 2.95493 17.296C2.95323 17.3159 2.95323 17.3359 2.95493 17.3559C2.95285 17.3733 2.95285 17.3908 2.95493 17.4082V17.5728C2.95366 17.7322 2.98637 17.8901 3.05087 18.0359C3.11536 18.1817 3.21018 18.312 3.329 18.4183L3.38885 18.4707C3.75489 18.7252 4.19258 18.8562 4.63823 18.8448H4.97863C5.08711 18.8448 5.19186 18.8448 5.29659 18.8223H5.334C6.22054 18.7064 6.68439 18.2724 6.6769 17.5616V17.4756L6.59461 17.4456Z" fill="#8E381E" />
                <path d="M6.31404 17.5018C6.31404 17.8759 6.1719 18.5493 4.75044 18.5605C3.32898 18.5717 3.17562 17.9095 3.17188 17.5242C3.17188 16.9518 3.86764 16.574 4.73548 16.5665C5.60332 16.559 6.30656 16.9257 6.31404 17.5018Z" fill="#F47920" />
                <path d="M4.42822 18.5492C4.52922 18.5492 4.63396 18.5492 4.74992 18.5492C4.86588 18.5492 4.92199 18.5492 5.00055 18.5492V18.2649L5.10529 18.235V18.5417L5.25492 18.523V18.1489L4.43196 18.2238L4.42822 18.5492Z" fill="#FAAD1B" />
                <path d="M3.77371 18.0923C3.75127 17.9464 3.3772 17.8042 3.3772 17.8042L3.4146 18.1783C3.44306 18.2098 3.47436 18.2386 3.50812 18.2644L3.45949 17.9202L3.55301 17.9688L3.61286 18.3429C3.67957 18.3837 3.74965 18.4188 3.82234 18.4477L3.77371 18.0923Z" fill="#FAAD1B" />
                <path d="M6.31032 17.4232C6.31032 17.9058 5.61455 18.2986 4.75046 18.3061C3.88636 18.3136 3.17563 17.932 3.17189 17.4494C3.16815 16.9668 3.86766 16.574 4.7355 16.5665C5.60333 16.559 6.30658 16.9444 6.31032 17.4232Z" fill="#FAAD1B" />
                <path d="M6.26906 17.2246V17.3181C6.26906 17.7895 5.58452 18.1748 4.73539 18.1823C3.88625 18.1898 3.19796 17.8082 3.19422 17.3406C3.19238 17.3094 3.19238 17.2782 3.19422 17.2471C3.16736 17.311 3.15337 17.3797 3.15308 17.4491C3.15308 17.9279 3.86381 18.3133 4.73164 18.3058C5.59948 18.2983 6.29525 17.9055 6.29151 17.4229C6.2968 17.356 6.28918 17.2887 6.26906 17.2246Z" fill="#F8D21E" />
                <path d="M5.87625 17.4156C5.87625 17.7635 5.37125 18.0478 4.75404 18.0516C4.13683 18.0553 3.63184 17.7785 3.63184 17.4343C3.63184 17.0901 4.13309 16.8021 4.75404 16.7946C5.37499 16.7871 5.8725 17.0677 5.87625 17.4156Z" fill="#8E381E" />
                <path d="M5.74142 17.4756C5.74142 17.7749 5.30002 18.0218 4.7464 18.0255C4.19278 18.0293 3.7439 17.7898 3.7439 17.4906C3.7439 17.1913 4.18529 16.9481 4.73891 16.9444C5.29254 16.9406 5.74142 17.1763 5.74142 17.4756Z" fill="#F8D21E" />
                <path d="M5.57321 17.4195C5.57321 17.6702 5.19914 17.8722 4.74652 17.8759C4.2939 17.8797 3.90112 17.6814 3.90112 17.4345C3.90112 17.1876 4.27519 16.9818 4.72781 16.9781C5.18044 16.9743 5.56947 17.1726 5.57321 17.4195Z" fill="#FAAD1B" />
                <path d="M4.86632 18.239C4.86632 18.2765 4.81383 18.3065 4.7501 18.3065C4.68636 18.3065 4.63013 18.2765 4.63013 18.239C4.63013 18.2015 4.68262 18.1715 4.74635 18.1678C4.81008 18.164 4.86632 18.1978 4.86632 18.239Z" fill="#F9ED43" />
                <path d="M4.86665 17.9435C4.86665 17.981 4.81416 18.0147 4.74668 18.0147C4.6792 18.0147 4.62671 17.9847 4.62671 17.9472C4.62671 17.9097 4.6792 17.876 4.74668 17.876C4.81416 17.876 4.86665 17.906 4.86665 17.9435Z" fill="#F9ED43" />
                <path d="M5.13931 17.0749C5.01999 16.9998 4.88189 16.96 4.74092 16.96C4.59996 16.96 4.46186 16.9998 4.34254 17.0749C4.17795 17.2357 4.52583 17.232 4.71661 17.2357C4.95601 17.2357 5.3039 17.232 5.13931 17.0749Z" fill="#F8D21E" />
                <path d="M4.90055 17.0532C4.90055 17.1019 4.82931 17.1469 4.73934 17.1469C4.64936 17.1469 4.57812 17.1057 4.57812 17.0532C4.57812 17.0007 4.64936 16.9595 4.73934 16.9595C4.82931 16.9595 4.90055 17.0157 4.90055 17.0532Z" fill="#F9ED43" />
                <path d="M4.61542 16.6413L4.79871 16.8732C4.79871 16.8732 4.79871 16.8732 4.82115 16.8732L5.09422 16.7647C5.09739 16.7662 5.10005 16.7686 5.10192 16.7716C5.10378 16.7746 5.10477 16.778 5.10477 16.7815C5.10477 16.7851 5.10378 16.7885 5.10192 16.7915C5.10005 16.7945 5.09739 16.7969 5.09422 16.7984L4.8623 16.9817C4.86033 16.9851 4.85929 16.989 4.85929 16.9929C4.85929 16.9969 4.86033 17.0007 4.8623 17.0041L4.97078 17.2772C4.97326 17.2817 4.97386 17.287 4.97246 17.2919C4.97106 17.2968 4.96776 17.3009 4.9633 17.3034C4.95883 17.3059 4.95357 17.3065 4.94866 17.3051C4.94375 17.3037 4.93959 17.3004 4.93711 17.2959L4.75382 17.064C4.75041 17.062 4.74654 17.061 4.7426 17.061C4.73866 17.061 4.73479 17.062 4.73138 17.064L4.4583 17.1725C4.45514 17.171 4.45248 17.1686 4.45061 17.1656C4.44874 17.1626 4.44775 17.1592 4.44775 17.1556C4.44775 17.1521 4.44874 17.1487 4.45061 17.1457C4.45248 17.1427 4.45514 17.1403 4.4583 17.1388L4.69023 16.9555C4.69023 16.9555 4.69023 16.9555 4.69023 16.9331L4.58175 16.66C4.58052 16.6577 4.57974 16.6553 4.57945 16.6528C4.57916 16.6503 4.57937 16.6478 4.58007 16.6453C4.58076 16.6429 4.58193 16.6406 4.5835 16.6386C4.58507 16.6367 4.58702 16.635 4.58923 16.6338C4.59144 16.6326 4.59387 16.6318 4.59638 16.6315C4.5989 16.6312 4.60144 16.6314 4.60387 16.6321C4.6063 16.6328 4.60858 16.634 4.61056 16.6355C4.61254 16.6371 4.61419 16.639 4.61542 16.6413Z" fill="white" />
                <path d="M4.96389 18.0141L4.94139 18.1979L5.11385 18.2729V18.2954L4.92639 18.2729L4.85141 18.4453H4.82892L4.85141 18.2579L4.67896 18.1829V18.1604L4.86641 18.1829L4.94139 18.0104C4.94139 18.0104 4.96389 17.9991 4.96389 18.0141Z" fill="white" />
                <path d="M26.4762 9.06171V8.85971C26.4762 8.81481 26.4762 8.76991 26.4762 8.72128V8.22747C26.4729 8.16324 26.4642 8.09941 26.45 8.03668C26.3643 6.25853 25.7625 4.54386 24.7181 3.10228C23.319 1.10457 21.7928 0.206727 19.9075 0.303993C19.0753 0.373176 18.2548 0.545339 17.4649 0.816522C16.8268 0.974946 16.2074 1.20067 15.617 1.4899C12.7657 2.25243 9.95628 3.16399 7.20044 4.22084C6.47181 4.3836 5.76581 4.63487 5.09817 4.96904L5.06077 4.98775C2.52458 6.25222 2.49092 9.25625 2.84628 10.7601C2.90796 11.5635 3.07266 12.3556 3.33631 13.117L4.64555 18.1673C4.53661 18.3 4.45506 18.453 4.40562 18.6173C4.35618 18.7817 4.33983 18.9543 4.35752 19.1251C4.35752 19.1512 4.55204 21.8784 5.57698 22.2451L13.8701 25.2042C13.9982 25.2516 14.1337 25.2757 14.2703 25.2753C14.4601 25.2746 14.647 25.2298 14.8165 25.1443L23.824 20.5541C23.9612 20.4837 24.0802 20.3825 24.1719 20.2586L24.228 20.1763C24.2586 20.1328 24.2849 20.0864 24.3066 20.0379L24.344 19.9668C24.3664 19.9219 24.3851 19.8695 24.4076 19.8134L24.4263 19.7685C24.4487 19.7086 24.4712 19.6413 24.4974 19.5627L24.6619 18.923C24.7031 18.736 24.7405 18.5489 24.7742 18.3394C24.8317 18.0044 24.8642 17.6655 24.8714 17.3256C24.8714 17.2134 24.8714 17.1124 24.8527 17.045C24.834 16.9777 24.8527 17.0114 24.8527 16.9964C24.841 16.9228 24.8235 16.8503 24.8004 16.7794L24.7742 16.7121C25.3819 15.1949 25.866 13.631 26.2218 12.0358C26.2443 11.9161 26.2667 11.7964 26.2817 11.6916C26.4475 10.8254 26.5128 9.94292 26.4762 9.06171Z" fill="#5F3C00" />
                <path d="M25.2828 10.3672C25.3651 12.3873 23.4124 17.0337 23.4124 17.0337L22.9897 16.7194C22.9897 16.7194 24.3364 11.3398 24.3027 10.861C24.2691 10.3821 25.2828 10.3672 25.2828 10.3672Z" fill="#FBAE1A" />
                <path d="M14.8276 16.7311L5.47584 18.4071C5.18407 18.5305 5.74143 20.9622 6.04068 21.0707L14.158 23.9662C14.2028 23.9827 14.2507 23.9896 14.2984 23.9863C14.3461 23.9831 14.3925 23.9699 14.4348 23.9475L23.2628 19.4583C23.5471 19.3124 24.0371 16.761 23.7266 16.6787L15.0557 16.7236C14.981 16.7001 14.9005 16.7027 14.8276 16.7311Z" fill="#FBAE1A" />
                <path d="M14.835 14.3972L5.66284 18.2355C5.59831 18.267 5.5442 18.3164 5.50699 18.3779C5.46978 18.4393 5.45105 18.5102 5.45302 18.582C5.45499 18.6538 5.47759 18.7235 5.51811 18.7828C5.55864 18.8421 5.61538 18.8884 5.68155 18.9164L14.1318 21.9316C14.2228 21.9691 14.325 21.9691 14.416 21.9316L23.6106 17.2441C23.6713 17.207 23.7201 17.1534 23.7514 17.0896C23.7827 17.0258 23.7951 16.9543 23.7873 16.8837C23.7794 16.813 23.7516 16.746 23.7071 16.6906C23.6625 16.6352 23.6031 16.5936 23.5358 16.5708L15.0632 14.3972C14.989 14.3735 14.9092 14.3735 14.835 14.3972Z" fill="#FFF200" />
                <path d="M23.8166 17.0342L14.4163 21.8975L14.2929 21.9349C14.2929 21.9349 14.132 21.9723 14.132 22.3576C14.132 22.743 14.0609 24.1346 14.4275 23.9513L23.2555 19.4621C23.4762 19.3349 23.8241 17.7637 23.8166 17.0342Z" fill="#FCD01E" />
                <path d="M5.86108 18.9604C5.86108 18.9604 13.4958 21.8784 13.7764 22.1328C14.0569 22.3872 14.1953 23.7377 14.1953 23.7377C14.1953 23.7377 14.3337 21.9757 14.2402 21.7662C14.1467 21.5567 5.86108 18.9604 5.86108 18.9604Z" fill="#FFF59D" />
                <path d="M8.0647 17.21L15.0635 14.726L21.4227 15.9942L15.0635 14.3594C14.9874 14.3416 14.9076 14.3482 14.8353 14.3781L8.0647 17.21Z" fill="#FFF59D" />
                <path d="M14.8276 9.47343L4.78014 11.097C4.49211 11.2167 6.01831 18.1863 6.31008 18.291L14.1655 21.0968C14.2086 21.1123 14.2545 21.1187 14.3003 21.1155C14.346 21.1122 14.3906 21.0995 14.4311 21.0781L22.9786 16.7198C23.2591 16.5776 24.905 9.49214 24.602 9.41357L15.0296 9.45846C14.9624 9.44157 14.8916 9.44682 14.8276 9.47343Z" fill="#6E493A" />
                <path d="M24.6133 9.41357H24.3141L14.304 13.9028V20.184C14.304 20.184 14.2629 21.1641 15.1569 20.7114L22.9786 16.7198C23.2704 16.5776 24.9163 9.49214 24.6133 9.41357Z" fill="#A66B4F" />
                <path d="M15.1567 20.7152L22.9785 16.7198C23.1131 16.6524 23.5508 15.0288 23.9436 13.3267C21.9423 16.297 17.3637 18.9718 16.0545 19.6415C14.9323 20.2176 14.416 20.1091 14.2926 20.0642V20.1877C14.2926 20.1877 14.2627 21.1678 15.1567 20.7152Z" fill="#B1795D" />
                <path d="M24.6322 9.8252L14.3042 15.5564V19.1777C14.4276 18.7101 14.9177 17.079 16.0137 16.2448C17.1097 15.4105 22.3729 12.8404 24.2694 11.9015C24.4489 11.0298 24.5873 10.2816 24.6322 9.8252Z" fill="#8C5A44" />
                <path d="M5.86096 13.1245L7.27867 18.6388L6.79613 18.8857L5.14648 13.3527L5.86096 13.1245Z" fill="#F47A20" />
                <path d="M17.5886 1.67703C18.3128 1.42275 19.0675 1.2655 19.833 1.2094C20.9552 1.15703 22.3281 1.46006 23.8281 3.59992C25.3281 5.73978 25.3505 7.43445 25.4067 8.66524C25.4628 9.89604 21.0974 8.66524 21.045 8.59416C20.9926 8.52308 17.6859 1.82667 17.5886 1.67703Z" fill="#FCD01E" />
                <path d="M14.7195 13.8771L24.737 8.63969C24.7036 7.15034 24.3354 5.68762 23.6597 4.35998C23.2948 3.63024 22.7577 3.00028 22.0949 2.52449C21.4321 2.0487 20.6635 1.74137 19.8554 1.62903C19.2008 1.52803 14.7195 13.8771 14.7195 13.8771Z" fill="#FFF59D" />
                <path d="M15.8901 2.291C16.5915 1.9343 17.3414 1.68222 18.1158 1.5428C18.9516 1.41901 19.8052 1.51894 20.5898 1.83239C21.3743 2.14585 22.0618 2.66165 22.5822 3.32726C24.0261 5.17532 24.2468 6.41359 24.5835 8.23172C24.9201 10.0499 24.6022 10.0124 24.6022 10.0124L24.273 11.0263L15.8901 2.291Z" fill="#FBAE1A" />
                <path d="M18.9199 1.87178H18.7066C16.668 1.66602 8.50954 4.55783 6.67661 5.35841C4.84367 6.15898 4.74268 6.91842 4.74268 6.91842L13.8026 14.4004L24.1942 8.83007C24.1942 8.83007 23.9099 2.0289 18.9199 1.87178Z" fill="#A66B4F" />
                <path d="M23.6297 5.96801L23.5175 5.64627L23.495 5.58643V7.74873C23.495 7.74873 15.7743 11.7367 15.2954 11.8975C14.9921 11.9919 14.6673 11.9919 14.364 11.8975L14.6446 13.3266C14.6446 13.3266 22.7693 9.305 24.1646 8.46327C24.0746 7.615 23.8953 6.77861 23.6297 5.96801Z" fill="#8C5A44" />
                <path d="M19.7993 1.97217L9.74805 5.21189L13.0885 9.19233L23.2557 5.0211C22.6235 3.65188 21.5649 2.35001 19.7993 1.97217Z" fill="#B1795D" />
                <path d="M25.3874 8.13379L14.3748 14.0521L14.2364 14.097C14.2364 14.097 14.0531 14.1381 14.0531 14.5721C14.0531 15.006 13.9746 16.581 14.386 16.3752L25.2228 10.4532C25.4622 10.326 25.3949 8.95681 25.3874 8.13379Z" fill="#FCD01E" />
                <path d="M14.7195 13.8768L24.737 8.63938V8.48975L14.7195 13.8768Z" fill="#FFF59D" />
                <path d="M5.67017 5.66114C6.37801 5.30806 7.13442 5.06221 7.91458 4.93165C8.89838 4.78201 10.7799 4.6623 12.2238 6.50662C13.6677 8.35094 14.0493 9.79871 14.3822 11.6168C14.5507 12.3987 14.6756 13.1892 14.7563 13.9849L14.053 14.3964L5.67017 5.66114Z" fill="#FCD01E" />
                <path d="M6.91992 5.29129C7.57247 5.18436 8.24015 5.21462 8.88035 5.38016C9.52054 5.5457 10.1192 5.84288 10.6382 6.25273C12.4711 7.65935 13.3689 10.8018 13.6644 12.4067C13.9599 14.0116 14.0384 14.4119 14.0384 14.4119C13.9766 12.563 13.6258 10.7352 12.9985 8.99489C12.0035 6.49589 10.814 5.89359 9.89003 5.411C8.95067 4.99728 7.88953 4.9545 6.91992 5.29129Z" fill="#FFF59D" />
                <path d="M13.0134 15.4557L13.1593 20.9961C13.1593 20.9961 14.2142 21.4076 14.3638 21.46C14.5134 21.5124 15.486 20.8352 15.486 20.8352L15.1606 14.8496L14.1207 15.4669L13.0134 15.4557Z" fill="#FCD01E" />
                <path d="M14.1468 16.3945C14.0608 15.3358 14.0608 14.9953 14.0608 14.5726C14.0564 14.5166 14.0564 14.4603 14.0608 14.4042C14.0608 14.4042 13.4623 5.20508 8.00834 5.20508C2.55443 5.20508 3.90107 10.4911 3.90107 10.4911C3.90107 11.2805 4.36492 13.0762 4.64921 13.1735L13.9186 16.4805C14.0196 16.5179 13.885 17.6028 13.986 17.5654L14.057 18.7925L14.1468 16.3945Z" fill="#FBAE1A" />
                <path d="M4.82495 11.9014L13.2602 14.752L12.5981 12.1071L4.82495 11.9014Z" fill="#FFF59D" />
                <path d="M7.69786 5.96045C5.87988 5.96045 4.79135 7.13513 4.52202 8.20506C4.25269 9.27499 4.82501 11.8937 4.82501 11.8937L13.0134 14.3964C13.0134 14.3964 12.1904 6.0652 7.69786 5.96045Z" fill="#F47A20" />
                <path d="M5.8499 11.4297L5.52072 11.5943L4.82495 11.9011L13.0096 14.415L12.9422 13.8763L5.8499 11.4297Z" fill="#FCD01E" />
                <path d="M7.6982 5.96048C7.32687 5.9589 6.9574 6.01313 6.60218 6.12134C5.92414 6.50923 5.4267 7.14923 5.21813 7.90207C4.95254 8.97574 5.52112 11.5944 5.52112 11.5944L12.9426 13.8764C12.6696 12.0284 11.495 6.05027 7.6982 5.96048Z" fill="#6E493A" />
                <path d="M24.6319 8.54192L24.1606 8.44092L14.6443 13.3267L14.7191 13.8766L24.6319 8.54192Z" fill="#FFF200" />
                <path d="M7.69768 5.96045H7.5705C5.7413 7.18002 6.75129 9.73138 6.75129 9.73138L12.5606 11.9461C11.9508 9.48448 10.578 6.02779 7.69768 5.96045Z" fill="#8C5A44" />
                <path d="M4.3501 12.6647L5.86134 18.4932L6.79651 18.886L4.87379 12.3354L4.3501 12.6647Z" fill="#FBAE1A" />
                <path d="M14.1244 17.412C14.1566 17.0123 14.1566 16.6107 14.1244 16.2111C14.0907 16.1213 13.9187 15.7659 13.7503 15.4629H13.0022L13.1481 21.0033C13.1481 21.0033 14.203 21.4148 14.3526 21.4672H14.375C14.405 20.5993 14.1244 17.412 14.1244 17.412Z" fill="#FBAE1A" />
                <path d="M24.5609 10.3676C25.1706 10.304 25.092 10.5621 24.9013 11.6283C24.7105 12.6945 23.4648 16.5141 23.4648 16.5141L23.6032 16.559C23.6032 16.559 24.7965 13.5138 25.1444 11.7181C25.347 10.8289 25.4338 9.91729 25.4025 9.00586L24.5609 10.3676Z" fill="#FCD01E" />
                <path d="M14.1466 22.9745L14.2738 22.6004C14.2738 22.6004 14.2514 22.331 14.921 21.8522C15.5905 21.3733 23.7939 17.1385 23.6704 17.1086C23.547 17.0786 15.2464 21.3995 14.7489 21.5454C14.4039 21.6326 14.0427 21.6326 13.6978 21.5454L14.1466 22.9745Z" fill="#FFF59D" />
                <path d="M14.4015 21.9685C14.4015 22.0695 14.2893 22.148 14.1471 22.148C14.005 22.148 13.8965 22.0695 13.8965 21.9685C13.8965 21.8675 14.0087 21.7852 14.1471 21.7852C14.2855 21.7852 14.4015 21.8787 14.4015 21.9685Z" fill="white" />
                <path d="M24.138 8.80762L23.7003 9.0433L23.3823 11.4563L24.007 11.1121L24.138 8.80762Z" fill="#FFF59D" />
                <path d="M18.875 13.9211L22.5783 11.8935L23.0907 9.37207L19.6568 11.2164L18.875 13.9211Z" fill="#FFF59D" />
                <path d="M19.6123 11.243L19.0549 11.0597L22.0737 9.51086L22.9901 9.4585L19.6123 11.243Z" fill="white" />
                <path d="M23.7005 9.04336L23.0571 9.00595L23.7005 8.67676L24.1382 8.80768L23.7005 9.04336Z" fill="white" />
                <path d="M4.4698 13.1242L14.1469 16.3938L25.7206 10.1875V10.917L14.1469 17.0785L4.3501 13.951L4.4698 13.1242Z" fill="#5F3C00" />
                <path d="M24.9426 20.9699C24.8777 20.9392 24.8068 20.9233 24.735 20.9233C24.6632 20.9233 24.5923 20.9392 24.5274 20.9699C24.4565 20.9765 24.388 20.9992 24.3271 21.0361C24.2662 21.0731 24.2145 21.1233 24.1758 21.1831C24.0598 21.3814 24.3927 21.2916 24.5947 21.2392C24.8079 21.1756 25.1409 21.0821 24.9426 20.9699Z" fill="#F8D21E" />
                <path d="M24.7076 21.0114C24.7076 21.0601 24.6626 21.1201 24.5764 21.1426C24.4902 21.1651 24.4077 21.1426 24.3964 21.0976C24.3852 21.0526 24.4414 20.9889 24.5277 20.9627C24.6139 20.9364 24.6926 20.9589 24.7076 21.0114Z" fill="#F9ED43" />
                <path d="M26.5508 21.3327L26.5283 21.2654L26.5059 21.2168C26.4966 21.1969 26.4853 21.1781 26.4722 21.1606C26.3591 21.0185 26.2158 20.9032 26.0529 20.823C25.8899 20.7428 25.7112 20.6997 25.5296 20.6968C25.1784 20.6655 24.8245 20.6997 24.4859 20.7978C24.1434 20.8873 23.8211 21.0409 23.5358 21.2504C23.3813 21.3469 23.2502 21.4765 23.1519 21.6298C23.0535 21.7832 22.9905 21.9564 22.9672 22.137V22.2081C22.9654 22.2268 22.9654 22.2456 22.9672 22.2642C22.9654 22.2866 22.9654 22.3092 22.9672 22.3316V22.369V22.4101C23.0048 22.5641 23.0745 22.7084 23.1719 22.8335C23.2692 22.9586 23.392 23.0617 23.532 23.1359L23.6031 23.1696C24.0231 23.3163 24.4786 23.3268 24.9049 23.1995L25.0769 23.1583L25.2153 23.1172C25.3163 23.0835 25.4173 23.0498 25.5146 23.0087H25.5483C26.375 22.6683 26.7116 22.1258 26.5208 21.4375C26.5218 21.4238 26.5218 21.41 26.5208 21.3963C26.5374 21.3789 26.5479 21.3566 26.5508 21.3327Z" fill="#8E381E" />
                <path d="M26.2929 21.459C26.3939 21.8331 26.4276 22.5065 25.0585 22.8844C23.6894 23.2622 23.3677 22.6636 23.2667 22.2933C23.1133 21.7396 23.6894 21.1934 24.5273 20.9615C25.3652 20.7295 26.1395 20.9054 26.2929 21.459Z" fill="#F47920" />
                <path d="M24.7444 22.9561C24.8503 22.938 24.9552 22.9143 25.0586 22.8851L25.2943 22.8102L25.2195 22.5334L25.313 22.481L25.3915 22.7766L25.5337 22.7205L25.4364 22.3726L24.6621 22.6606L24.7444 22.9561Z" fill="#FAAD1B" />
                <path d="M23.9923 22.6866C23.9324 22.5519 23.5359 22.5107 23.5359 22.5107L23.6631 22.8474L23.7753 22.9073L23.6444 22.5893L23.7454 22.608L23.8987 22.9484C23.9728 22.9723 24.0494 22.9874 24.1269 22.9933L23.9923 22.6866Z" fill="#FAAD1B" />
                <path d="M26.2706 21.3848C26.3978 21.8449 25.8255 22.4098 24.9913 22.6418C24.1571 22.8737 23.3753 22.6829 23.2444 22.2191C23.1135 21.7552 23.6895 21.194 24.5274 20.9621C25.3653 20.7301 26.1434 20.9209 26.2706 21.3848Z" fill="#FAAD1B" />
                <path d="M26.1769 21.2017C26.1919 21.23 26.2032 21.2602 26.2106 21.2914C26.3378 21.7441 25.7766 22.294 24.9574 22.5222C24.1382 22.7504 23.3751 22.5634 23.2479 22.1107C23.2479 22.0771 23.2479 22.0471 23.2479 22.0172C23.2331 22.0837 23.2331 22.1527 23.2479 22.2192C23.3789 22.6831 24.1569 22.8702 24.9948 22.642C25.8328 22.4138 26.4013 21.8451 26.2742 21.385C26.2549 21.3177 26.2218 21.2553 26.1769 21.2017Z" fill="#F8D21E" />
                <path d="M25.8476 21.5047C25.9374 21.8376 25.5259 22.2529 24.9237 22.41C24.3214 22.5671 23.7566 22.4399 23.6631 22.107C23.5695 21.774 23.9848 21.3588 24.587 21.2016C25.1893 21.0445 25.7541 21.153 25.8476 21.5047Z" fill="#8E381E" />
                <path d="M25.7354 21.5792C25.814 21.8673 25.4474 22.2227 24.9162 22.3686C24.3851 22.5145 23.8875 22.4023 23.794 22.1142C23.7005 21.8261 24.0783 21.4745 24.6132 21.3286C25.1482 21.1827 25.6531 21.2949 25.7354 21.5792Z" fill="#F8D21E" />
                <path d="M25.5561 21.5719C25.6234 21.8113 25.3167 22.1031 24.8753 22.2265C24.4339 22.35 24.0224 22.2527 23.9551 22.0133C23.8877 21.7739 24.1945 21.4821 24.6359 21.3624C25.0773 21.2427 25.4888 21.3324 25.5561 21.5719Z" fill="#FAAD1B" />
                <path d="M25.0849 22.5412C25.0849 22.5787 25.0549 22.6237 24.9912 22.6424C24.9275 22.6612 24.8675 22.6424 24.8562 22.6049C24.845 22.5674 24.89 22.5262 24.9537 22.5074C25.0174 22.4887 25.0774 22.5074 25.0849 22.5412Z" fill="#F9ED43" />
                <path d="M25.01 22.2529C25.01 22.2904 24.9763 22.3316 24.9126 22.3504C24.8488 22.3691 24.7889 22.3504 24.7776 22.3166C24.7664 22.2829 24.8114 22.2341 24.8751 22.2191C24.9388 22.2041 24.9988 22.2229 25.01 22.2529Z" fill="#F9ED43" />
                <path d="M25.0473 21.3511C24.9826 21.3199 24.9116 21.3037 24.8397 21.3037C24.7679 21.3037 24.6969 21.3199 24.6321 21.3511C24.5608 21.3579 24.492 21.381 24.431 21.4186C24.3701 21.4562 24.3186 21.5074 24.2805 21.5681C24.1645 21.7626 24.4975 21.6728 24.6995 21.6204C24.9127 21.5531 25.2456 21.4596 25.0473 21.3511Z" fill="#F8D21E" />
                <path d="M24.8121 21.3884C24.8121 21.4372 24.7671 21.4972 24.6809 21.5234C24.5947 21.5496 24.5122 21.5234 24.5009 21.4747C24.4897 21.4259 24.5459 21.3659 24.6322 21.3434C24.7184 21.3209 24.7971 21.3397 24.8121 21.3884Z" fill="#F9ED43" />
                <path d="M24.4335 21.0815L24.6692 21.2574C24.6726 21.2593 24.6765 21.2604 24.6804 21.2604C24.6843 21.2604 24.6882 21.2593 24.6916 21.2574L24.931 21.0815C24.9497 21.0815 24.9684 21.0815 24.9572 21.1077L24.7814 21.3434V21.3659L24.9572 21.6053C24.9599 21.6089 24.9612 21.6134 24.9609 21.6178C24.9606 21.6223 24.9586 21.6266 24.9555 21.6297C24.9523 21.6329 24.9481 21.6349 24.9436 21.6352C24.9391 21.6355 24.9346 21.6342 24.931 21.6315L24.6916 21.4556C24.6916 21.4556 24.6916 21.4556 24.6692 21.4556L24.4335 21.6315C24.4335 21.6315 24.3924 21.6315 24.4073 21.6053L24.5831 21.3659C24.5851 21.3625 24.5861 21.3586 24.5861 21.3546C24.5861 21.3507 24.5851 21.3468 24.5831 21.3434L24.4073 21.1077L24.4335 21.0815Z" fill="white" />
                <path d="M25.1219 22.3018L25.1481 22.4888L25.3314 22.5187C25.3314 22.5187 25.3314 22.5187 25.3314 22.5412L25.1481 22.5674L25.1219 22.7544H25.0957L25.0695 22.5674L24.8862 22.5412V22.5187L25.0695 22.4888L25.0957 22.3018H25.1219Z" fill="white" />
                <path d="M22.6721 21.1306C22.5703 21.0327 22.4428 20.9657 22.3044 20.9372C22.1661 20.9088 22.0225 20.92 21.8903 20.9698C21.6958 21.0932 22.0362 21.1643 22.2382 21.2092C22.4589 21.2578 22.7993 21.3252 22.6721 21.1306Z" fill="#F8D21E" />
                <path d="M22.4443 21.0634C22.4443 21.1158 22.3543 21.1421 22.2681 21.1233C22.1818 21.1046 22.1181 21.0521 22.1256 20.9996C22.1331 20.9471 22.2156 20.9246 22.3056 20.9396C22.3955 20.9546 22.4555 21.0146 22.4443 21.0634Z" fill="#F9ED43" />
                <path d="M23.94 22.1853C23.94 22.1678 23.94 22.1454 23.94 22.1179C23.9419 22.0993 23.9419 22.0805 23.94 22.0618C23.94 22.0431 23.94 22.0244 23.94 21.9982C23.9032 21.82 23.8274 21.6521 23.7181 21.5066C23.6088 21.3611 23.4687 21.2415 23.3078 21.1565C23.0085 20.9721 22.6774 20.8452 22.3315 20.7824C21.986 20.7078 21.6296 20.6977 21.2804 20.7525C21.0991 20.7688 20.9237 20.8248 20.7666 20.9167C20.6095 21.0085 20.4746 21.1338 20.3714 21.2837L20.3415 21.3398L20.3228 21.3922C20.3228 21.4109 20.3228 21.4333 20.3228 21.4558C20.3228 21.4782 20.3228 21.482 20.3228 21.4932V21.5381C20.2868 21.6923 20.2839 21.8523 20.3142 22.0077C20.3445 22.1631 20.4073 22.3103 20.4986 22.4397L20.5472 22.5033C20.8541 22.8246 21.2547 23.0407 21.6918 23.1205H21.7106L21.8826 23.1579L22.0248 23.1879C22.1295 23.2066 22.2342 23.2178 22.3427 23.229H22.3764C23.2667 23.2964 23.8128 22.9671 23.955 22.2713C23.955 22.2713 23.955 22.2414 23.955 22.2264C23.9519 22.2121 23.9468 22.1983 23.94 22.1853Z" fill="#8E381E" />
                <path d="M23.6519 22.1815C23.5771 22.5556 23.2779 23.1766 21.905 22.896C20.5322 22.6155 20.4985 21.9346 20.5771 21.5567C20.6893 20.9956 21.4524 20.7674 22.3053 20.9395C23.1582 21.1116 23.7679 21.6203 23.6519 22.1815Z" fill="#F47920" />
                <path d="M21.5947 22.8175C21.6967 22.8494 21.8003 22.8757 21.9052 22.8961C21.9912 22.8961 22.0735 22.926 22.1521 22.9372L22.2082 22.6566H22.3167L22.2531 22.9597H22.4065L22.4775 22.608L21.6546 22.5107L21.5947 22.8175Z" fill="#FAAD1B" />
                <path d="M21.0482 22.2525C21.0482 22.1066 20.719 21.8784 20.719 21.8784L20.6816 22.2525C20.7019 22.2897 20.7257 22.3248 20.7527 22.3573L20.7789 22.0131L20.8612 22.0767L20.8425 22.4508C20.899 22.5038 20.9604 22.5514 21.0258 22.593L21.0482 22.2525Z" fill="#FAAD1B" />
                <path d="M23.6668 22.1068C23.5732 22.5781 22.8064 22.8213 21.9573 22.6455C21.1081 22.4696 20.4947 21.9534 20.5919 21.482C20.6892 21.0106 21.4523 20.7675 22.3052 20.9396C23.158 21.1116 23.764 21.6354 23.6668 22.1068Z" fill="#FAAD1B" />
                <path d="M23.6668 21.9015C23.6707 21.9325 23.6707 21.9639 23.6668 21.995C23.5733 22.4589 22.8251 22.6946 21.991 22.5262C21.1568 22.3579 20.562 21.8453 20.6555 21.3852C20.661 21.3539 20.6711 21.3237 20.6855 21.2954C20.6453 21.3513 20.6172 21.4151 20.6032 21.4825C20.5059 21.9538 21.1194 22.4738 21.9685 22.6459C22.8176 22.818 23.5845 22.5786 23.678 22.1072C23.6892 22.0386 23.6854 21.9684 23.6668 21.9015Z" fill="#F8D21E" />
                <path d="M23.2439 22.0094C23.1729 22.3499 22.6192 22.5219 22.0058 22.3835C21.3923 22.2451 20.9546 21.8822 21.022 21.5418C21.0893 21.2014 21.6429 21.0255 22.2564 21.1677C22.8699 21.3099 23.3113 21.669 23.2439 22.0094Z" fill="#8E381E" />
                <path d="M23.0984 22.0393C23.0423 22.3311 22.5522 22.4807 22.0136 22.3685C21.4749 22.2562 21.0822 21.9345 21.142 21.6427C21.2019 21.3509 21.6882 21.2013 22.2268 21.3098C22.7655 21.4183 23.1582 21.7475 23.0984 22.0393Z" fill="#F8D21E" />
                <path d="M22.945 21.9498C22.8964 22.1929 22.4924 22.3239 22.0435 22.2266C21.5946 22.1293 21.2692 21.8525 21.3178 21.6205C21.3664 21.3886 21.7704 21.2464 22.223 21.3475C22.6757 21.4485 22.9787 21.7066 22.945 21.9498Z" fill="#FAAD1B" />
                <path d="M22.0888 22.6048C22.0888 22.6423 22.0213 22.661 21.9575 22.646C21.8938 22.631 21.8451 22.5935 21.8526 22.556C21.8601 22.5186 21.92 22.4998 21.9838 22.5111C22.0475 22.5223 22.0963 22.5673 22.0888 22.6048Z" fill="#F9ED43" />
                <path d="M22.1449 22.3168C22.1449 22.3543 22.0812 22.3731 22.0137 22.3618C21.9462 22.3506 21.905 22.3056 21.9125 22.2681C21.92 22.2306 21.98 22.2119 22.0437 22.2269C22.1075 22.2419 22.1524 22.2794 22.1449 22.3168Z" fill="#F9ED43" />
                <path d="M22.6043 21.5232C22.5598 21.4658 22.5032 21.419 22.4386 21.386C22.3739 21.3531 22.3028 21.3348 22.2302 21.3324C22.1636 21.3061 22.0919 21.2955 22.0206 21.3014C21.9492 21.3072 21.8802 21.3293 21.8188 21.3661C21.6242 21.4858 21.9646 21.5569 22.1666 21.6018H22.1853C22.3799 21.6429 22.7203 21.7102 22.6043 21.5232Z" fill="#F8D21E" />
                <path d="M22.3659 21.4524C22.3659 21.5011 22.2759 21.5274 22.1897 21.5086C22.1035 21.4899 22.0397 21.4374 22.0472 21.3849C22.0547 21.3324 22.1372 21.3099 22.2272 21.3249C22.3172 21.3399 22.3771 21.3999 22.3659 21.4524Z" fill="#F9ED43" />
                <path d="M22.1668 21.0034L22.2977 21.269C22.3011 21.271 22.305 21.272 22.3089 21.272C22.3128 21.272 22.3167 21.271 22.3201 21.269L22.6119 21.2204V21.2541L22.3463 21.385C22.3443 21.3884 22.3433 21.3923 22.3433 21.3962C22.3433 21.4002 22.3443 21.404 22.3463 21.4074L22.3949 21.6992H22.3613L22.2303 21.4336C22.2269 21.4317 22.2231 21.4306 22.2191 21.4306C22.2152 21.4306 22.2113 21.4317 22.2079 21.4336L21.9161 21.4823C21.9161 21.4823 21.8862 21.4561 21.9161 21.4486L22.1817 21.3177C22.1834 21.3142 22.1842 21.3103 22.1842 21.3064C22.1842 21.3026 22.1834 21.2987 22.1817 21.2952L22.1331 21.0034H22.1668Z" fill="white" />
                <path d="M22.2313 22.4025L22.1713 22.5825L22.325 22.6912C22.325 22.6912 22.325 22.7137 22.325 22.71L22.1488 22.65L22.0401 22.8037H22.0176L22.0775 22.6275L21.9238 22.5187C21.9238 22.5187 21.9238 22.4963 21.9238 22.5L22.1038 22.56L22.2125 22.41C22.2125 22.41 22.2313 22.3913 22.2313 22.4025Z" fill="white" />
                <path d="M20.8241 23.7231C20.7222 23.6266 20.5952 23.5607 20.4576 23.5329C20.32 23.5051 20.1774 23.5166 20.046 23.566C19.8515 23.6895 20.1919 23.7605 20.3939 23.8054C20.6146 23.8466 20.955 23.9139 20.8241 23.7231Z" fill="#F8D21E" />
                <path d="M20.6002 23.6523C20.6002 23.701 20.5102 23.731 20.424 23.7123C20.3377 23.6936 20.2703 23.6373 20.2815 23.5886C20.2927 23.5398 20.3715 23.5098 20.4577 23.5286C20.5439 23.5473 20.6114 23.5998 20.6002 23.6523Z" fill="#F9ED43" />
                <path d="M22.0959 24.7738V24.7064C22.0979 24.689 22.0979 24.6715 22.0959 24.6541C22.0959 24.6316 22.0959 24.6129 22.0959 24.5867C22.0583 24.4093 21.9822 24.2422 21.873 24.0974C21.7637 23.9526 21.624 23.8336 21.4637 23.7487C21.1644 23.5643 20.8332 23.4375 20.4874 23.3746C20.1416 23.3011 19.7852 23.2922 19.4362 23.3484C19.2548 23.364 19.0791 23.4197 18.9219 23.5116C18.7646 23.6035 18.6298 23.7292 18.5272 23.8797C18.5157 23.8975 18.5057 23.9163 18.4973 23.9358C18.4973 23.9358 18.4973 23.9695 18.4973 23.9882C18.4973 24.0106 18.4973 24.033 18.4973 24.0555C18.4973 24.0779 18.4973 24.0779 18.4973 24.0929V24.1378C18.4614 24.292 18.4585 24.452 18.4888 24.6074C18.5191 24.7628 18.5819 24.91 18.6731 25.0394C18.6882 25.0602 18.7044 25.0802 18.7218 25.0992C19.0277 25.4218 19.4288 25.6382 19.8664 25.7165L20.0385 25.7539L20.1806 25.7801C20.2858 25.7996 20.3919 25.8133 20.4986 25.8213H20.5323C21.4225 25.8923 21.9687 25.5594 22.1108 24.8636C22.109 24.8486 22.109 24.8336 22.1108 24.8187C22.1108 24.8187 22.0921 24.785 22.0959 24.7738Z" fill="#8E381E" />
                <path d="M21.8075 24.7703C21.7326 25.1444 21.4334 25.7654 20.0606 25.4811C18.6877 25.1968 18.6541 24.5196 18.7326 24.1455C18.8448 23.5806 19.6079 23.3562 20.4571 23.5283C21.3062 23.7004 21.9234 24.2054 21.8075 24.7703Z" fill="#F47920" />
                <path d="M19.7502 25.4064C19.8438 25.4326 19.9485 25.4588 20.0607 25.4812L20.3076 25.5261L20.36 25.2455H20.4685L20.4049 25.5448H20.5582L20.6293 25.1969L19.8064 25.0996L19.7502 25.4064Z" fill="#FAAD1B" />
                <path d="M19.2007 24.8228C19.2007 24.6769 18.8753 24.4487 18.8753 24.4487L18.8379 24.8228C18.859 24.8582 18.8828 24.892 18.909 24.9238L18.9352 24.5797L19.0174 24.647V25.0211C19.074 25.0741 19.1353 25.1217 19.2007 25.1633V24.8228Z" fill="#FAAD1B" />
                <path d="M21.8225 24.6956C21.729 25.1632 20.9622 25.4064 20.113 25.2343C19.2639 25.0622 18.6504 24.5385 18.7477 24.0671C18.8449 23.5957 19.608 23.3563 20.4572 23.5284C21.3063 23.7005 21.9198 24.2242 21.8225 24.6956Z" fill="#FAAD1B" />
                <path d="M21.8228 24.497C21.8264 24.5281 21.8264 24.5595 21.8228 24.5905C21.7293 25.0507 20.9811 25.2901 20.147 25.118C19.3128 24.9459 18.718 24.4371 18.8115 23.977C18.8181 23.946 18.8282 23.9159 18.8415 23.8872C18.8013 23.9431 18.7733 24.0069 18.7592 24.0743C18.6619 24.5456 19.2754 25.0694 20.1245 25.2415C20.9736 25.4135 21.7405 25.1704 21.834 24.7027C21.8452 24.6342 21.8414 24.564 21.8228 24.497Z" fill="#F8D21E" />
                <path d="M21.3959 24.5948C21.3286 24.9352 20.7749 25.111 20.1615 24.9689C19.548 24.8267 19.1066 24.4676 19.1777 24.1272C19.2487 23.7867 19.7986 23.6146 20.4121 23.7531C21.0256 23.8915 21.4819 24.2544 21.3959 24.5948Z" fill="#8E381E" />
                <path d="M21.2544 24.6286C21.1983 24.9204 20.7083 25.0663 20.1696 24.9578C19.6309 24.8493 19.2382 24.5201 19.298 24.2096C19.3579 23.8991 19.8442 23.7719 20.3828 23.8804C20.9215 23.9889 21.3142 24.3368 21.2544 24.6286Z" fill="#F8D21E" />
                <path d="M21.1083 24.5385C21.0597 24.7816 20.6557 24.9126 20.2068 24.8115C19.7579 24.7105 19.4325 24.4375 19.4811 24.2055C19.5298 23.9736 19.9338 23.8314 20.3826 23.9324C20.8315 24.0334 21.1495 24.2953 21.1083 24.5385Z" fill="#FAAD1B" />
                <path d="M20.2445 25.1894C20.2445 25.2269 20.177 25.2456 20.1133 25.2344C20.0496 25.2232 20.0008 25.1819 20.0083 25.1444C20.0158 25.1069 20.0758 25.0844 20.1396 25.0994C20.2033 25.1144 20.252 25.1519 20.2445 25.1894Z" fill="#F9ED43" />
                <path d="M20.3009 24.9013C20.3009 24.9388 20.2372 24.9613 20.1697 24.9463C20.1022 24.9313 20.061 24.8938 20.0685 24.8563C20.076 24.8188 20.136 24.8001 20.1997 24.8113C20.2635 24.8226 20.3084 24.8713 20.3009 24.9013Z" fill="#F9ED43" />
                <path d="M20.7339 24.1227C20.6908 24.0642 20.6344 24.0167 20.5694 23.9842C20.5044 23.9517 20.4326 23.935 20.3599 23.9356C20.2934 23.9094 20.222 23.8984 20.1507 23.9036C20.0795 23.9088 20.0103 23.9299 19.9484 23.9656C19.7539 24.089 20.0943 24.1601 20.2963 24.205H20.315C20.5357 24.2312 20.8761 24.2985 20.7339 24.1227Z" fill="#F8D21E" />
                <path d="M20.5219 24.0376C20.5219 24.0901 20.4319 24.1163 20.3457 24.0976C20.2595 24.0788 20.1957 24.0226 20.2032 23.9738C20.2107 23.9251 20.2932 23.8951 20.3832 23.9138C20.4732 23.9326 20.5332 23.9888 20.5219 24.0376Z" fill="#F9ED43" />
                <path d="M20.323 23.5913L20.4539 23.8569H20.4764L20.7682 23.8083C20.7682 23.8083 20.7981 23.8345 20.7682 23.842L20.5026 23.9766C20.5009 23.9795 20.5001 23.9827 20.5001 23.986C20.5001 23.9893 20.5009 23.9925 20.5026 23.9954L20.5512 24.2872H20.5175L20.3866 24.0215H20.3642L20.0724 24.0702C20.0724 24.0702 20.0425 24.044 20.0724 24.0328L20.338 23.9018C20.3396 23.899 20.3405 23.8958 20.3405 23.8925C20.3405 23.8892 20.3396 23.886 20.338 23.8831L20.2893 23.5913H20.323Z" fill="white" />
                <path d="M20.3831 24.9912L20.3231 25.1712L20.4768 25.2799V25.3024L20.3006 25.2424L20.1919 25.3961C20.1919 25.3961 20.1657 25.3961 20.1694 25.3961L20.2294 25.2162L20.0757 25.1074C20.0757 25.1074 20.0757 25.0812 20.0757 25.0849L20.2556 25.1449L20.3644 24.9912H20.3831Z" fill="white" />
                <path d="M28.7094 19.739C28.6548 19.6926 28.5906 19.6587 28.5214 19.64C28.4522 19.6212 28.3797 19.618 28.3091 19.6305C28.2386 19.619 28.1663 19.6235 28.0977 19.6436C28.0291 19.6636 27.9658 19.6988 27.9126 19.7465C27.748 19.9074 28.0959 19.9074 28.2867 19.9074H28.3054C28.5261 19.9037 28.874 19.8962 28.7094 19.739Z" fill="#F8D21E" />
                <path d="M28.4706 19.7168C28.4706 19.7693 28.3994 19.8105 28.3094 19.8105C28.2194 19.8105 28.1482 19.7693 28.1482 19.7205C28.1482 19.6718 28.2194 19.623 28.3094 19.623C28.3994 19.623 28.4706 19.6643 28.4706 19.7168Z" fill="#F9ED43" />
                <path d="M30.1679 20.5053C30.1697 20.4817 30.1697 20.4579 30.1679 20.4342V20.3781C30.1697 20.357 30.1697 20.3357 30.1679 20.3145C30.0942 20.1483 29.9851 20.0002 29.8481 19.8806C29.7111 19.761 29.5496 19.6729 29.3749 19.6224C29.0445 19.5012 28.6943 19.4428 28.3424 19.4504C27.9879 19.4459 27.636 19.5107 27.3063 19.6411C27.1318 19.693 26.9713 19.7835 26.8366 19.9059C26.7019 20.0283 26.5965 20.1795 26.5282 20.3482C26.5261 20.3681 26.5261 20.3882 26.5282 20.4081C26.5264 20.4267 26.5264 20.4455 26.5282 20.4642V20.6288C26.5269 20.7882 26.5596 20.946 26.6241 21.0918C26.6886 21.2376 26.7835 21.368 26.9023 21.4742L26.9621 21.5266C27.3297 21.7779 27.7663 21.9086 28.2115 21.9007H28.5519C28.6604 21.9007 28.7651 21.9007 28.8699 21.8745H28.9073C29.7901 21.7586 30.2577 21.3209 30.2502 20.6101V20.5278L30.1679 20.5053Z" fill="#8E381E" />
                <path d="M29.8875 20.5584C29.8875 20.9325 29.7454 21.6059 28.3239 21.6171C26.9025 21.6283 26.7491 20.9662 26.7454 20.5846C26.7454 20.0085 27.4411 19.6306 28.309 19.6232C29.1768 19.6157 29.88 19.986 29.8875 20.5584Z" fill="#F47920" />
                <path d="M28.0024 21.6055C28.1095 21.6132 28.217 21.6132 28.3241 21.6055H28.5748V21.3175L28.6795 21.2913V21.5981L28.8291 21.5756V21.2202L28.0062 21.295L28.0024 21.6055Z" fill="#FAAD1B" />
                <path d="M27.3477 21.1494C27.3252 21.0035 26.9512 20.8613 26.9512 20.8613L26.9886 21.2354L27.0821 21.3177L27.0335 20.9773L27.127 21.0222L27.1868 21.3963C27.2533 21.4366 27.3234 21.4704 27.3963 21.4973L27.3477 21.1494Z" fill="#FAAD1B" />
                <path d="M29.8838 20.4836C29.8838 20.9624 29.188 21.359 28.3239 21.3665C27.4598 21.3739 26.7491 20.9924 26.7454 20.506C26.7416 20.0197 27.4411 19.6306 28.309 19.6232C29.1768 19.6157 29.8801 20.0085 29.8838 20.4836Z" fill="#FAAD1B" />
                <path d="M29.8427 20.2808C29.8446 20.3119 29.8446 20.3431 29.8427 20.3743C29.8427 20.8457 29.1619 21.2347 28.3128 21.2385C27.4636 21.2422 26.7754 20.8644 26.7716 20.4005C26.7697 20.3693 26.7697 20.3381 26.7716 20.3069C26.7451 20.3697 26.7312 20.4371 26.7305 20.5052C26.7305 20.9878 27.4412 21.3694 28.309 21.3657C29.1769 21.3619 29.8726 20.9616 29.8689 20.4828C29.8734 20.4144 29.8645 20.3458 29.8427 20.2808Z" fill="#F8D21E" />
                <path d="M29.45 20.4723C29.45 20.8202 28.945 21.1045 28.3278 21.112C27.7106 21.1195 27.2056 20.8389 27.2056 20.491C27.2056 20.1431 27.7068 19.8588 28.3278 19.855C28.9487 19.8513 29.4462 20.1281 29.45 20.4723Z" fill="#8E381E" />
                <path d="M29.3152 20.5356C29.3152 20.8312 28.8737 21.0781 28.3201 21.0818C27.7665 21.0855 27.3176 20.8499 27.3176 20.5506C27.3176 20.2513 27.759 20.0081 28.3126 20.0007C28.8663 19.9932 29.3152 20.2363 29.3152 20.5356Z" fill="#F8D21E" />
                <path d="M29.1469 20.4791C29.1469 20.726 28.7729 20.9318 28.3203 20.9318C27.8676 20.9318 27.4861 20.741 27.4861 20.4903C27.4861 20.2397 27.8601 20.0414 28.3128 20.0376C28.7654 20.0339 29.1432 20.2322 29.1469 20.4791Z" fill="#FAAD1B" />
                <path d="M28.4405 21.2955C28.4405 21.333 28.388 21.363 28.3243 21.3668C28.2606 21.3705 28.2043 21.3368 28.2043 21.2955C28.2043 21.2543 28.2568 21.228 28.3206 21.228C28.3843 21.228 28.4405 21.258 28.4405 21.2955Z" fill="#F9ED43" />
                <path d="M28.4406 21.0032C28.4406 21.0407 28.3881 21.0707 28.3207 21.0707C28.2532 21.0707 28.2007 21.0407 28.2007 21.0032C28.2007 20.9657 28.2532 20.9357 28.3207 20.9319C28.3881 20.9282 28.4406 20.9619 28.4406 21.0032Z" fill="#F9ED43" />
                <path d="M28.713 20.1352C28.659 20.0876 28.595 20.0528 28.5257 20.0334C28.4564 20.014 28.3836 20.0104 28.3128 20.023C28.2422 20.0109 28.1698 20.0151 28.1011 20.0352C28.0324 20.0553 27.9692 20.0908 27.9163 20.139C27.7517 20.2998 28.0996 20.2998 28.2903 20.2998C28.5297 20.2961 28.8776 20.2923 28.713 20.1352Z" fill="#F8D21E" />
                <path d="M28.474 20.1095C28.474 20.162 28.4028 20.2032 28.3128 20.2032C28.2228 20.2032 28.1516 20.1658 28.1516 20.1133C28.1516 20.0608 28.2228 20.0195 28.3128 20.0195C28.4028 20.0195 28.474 20.057 28.474 20.1095Z" fill="#F9ED43" />
                <path d="M28.1894 19.7126L28.3727 19.9446H28.3951L28.6682 19.8361C28.6907 19.8361 28.7056 19.8548 28.6682 19.866L28.4363 20.0531V20.0718L28.5448 20.3486C28.5448 20.3673 28.5448 20.3823 28.5111 20.3673L28.3278 20.1354H28.3054L28.0323 20.2439C28.0099 20.2439 27.9949 20.2252 28.0136 20.2139L28.2455 20.0306C28.2472 20.0271 28.248 20.0233 28.248 20.0194C28.248 20.0155 28.2472 20.0117 28.2455 20.0082L28.137 19.7314C28.1483 19.7127 28.1744 19.6977 28.1894 19.7126Z" fill="white" />
                <path d="M28.5379 21.0701L28.5154 21.2576L28.6878 21.3326C28.6878 21.3326 28.6878 21.3588 28.6878 21.3551L28.5004 21.3326L28.4254 21.505H28.4029L28.4254 21.3176L28.2529 21.2426C28.2529 21.2426 28.2529 21.2163 28.2529 21.2201L28.4366 21.2388L28.5116 21.0626C28.5116 21.0626 28.5379 21.0589 28.5379 21.0701Z" fill="white" />
                <path d="M23.091 22.5818C23.0364 22.5353 22.9722 22.5015 22.903 22.4828C22.8338 22.464 22.7613 22.4608 22.6907 22.4733C22.6202 22.4618 22.5479 22.4663 22.4793 22.4863C22.4107 22.5064 22.3474 22.5416 22.2942 22.5893C22.1296 22.7502 22.4775 22.7501 22.6683 22.7501C22.9077 22.7464 23.2556 22.7427 23.091 22.5818Z" fill="#F8D21E" />
                <path d="M22.8525 22.5598C22.8525 22.6123 22.7812 22.6535 22.695 22.6535C22.6088 22.6535 22.53 22.6123 22.53 22.5635C22.53 22.5148 22.6013 22.4698 22.6912 22.466C22.7812 22.4623 22.8525 22.5073 22.8525 22.5598Z" fill="#F9ED43" />
                <path d="M24.5495 23.3486C24.5512 23.3249 24.5512 23.3012 24.5495 23.2775V23.2251V23.1615C24.4758 22.9953 24.3667 22.8472 24.2297 22.7276C24.0927 22.608 23.9311 22.5199 23.7565 22.4694C23.0859 22.2337 22.354 22.2404 21.6879 22.4882C21.5138 22.5407 21.3536 22.6315 21.219 22.7538C21.0844 22.8761 20.9788 23.0269 20.9098 23.1952C20.9077 23.2151 20.9077 23.2352 20.9098 23.2551C20.9098 23.2738 20.9098 23.2925 20.9098 23.3112C20.9079 23.3336 20.9079 23.3561 20.9098 23.3785V23.4645C20.9062 23.6226 20.936 23.7795 20.9972 23.9252C21.0584 24.0709 21.1497 24.2021 21.2652 24.31L21.3288 24.3624C21.6949 24.6138 22.1304 24.7446 22.5744 24.7365H22.9148C23.0233 24.7365 23.128 24.7365 23.2328 24.7103H23.2702C24.1567 24.5943 24.6206 24.1566 24.6131 23.4458V23.3635L24.5495 23.3486Z" fill="#8E381E" />
                <path d="M24.269 23.4012C24.269 23.7753 24.1269 24.4524 22.7054 24.4636C21.284 24.4749 21.1306 23.8127 21.1306 23.4274C21.1306 22.8513 21.8226 22.4734 22.6905 22.4659C23.5583 22.4584 24.2653 22.8288 24.269 23.4012Z" fill="#F47920" />
                <path d="M22.3838 24.4525C22.4848 24.4525 22.5895 24.4525 22.7055 24.4525C22.8214 24.4525 22.8776 24.4525 22.9561 24.4525V24.1645L23.0609 24.1383V24.4451L23.2142 24.4264V24.0522L22.3913 24.1271L22.3838 24.4525Z" fill="#FAAD1B" />
                <path d="M21.7293 23.9926C21.7068 23.8467 21.3328 23.7046 21.3328 23.7046L21.3702 24.0787L21.4637 24.161L21.4151 23.8206L21.5123 23.8655L21.5684 24.2396C21.6352 24.2791 21.7053 24.3129 21.7779 24.3406L21.7293 23.9926Z" fill="#FAAD1B" />
                <path d="M24.2691 23.3264C24.2691 23.8052 23.5734 24.2018 22.7055 24.2092C21.8377 24.2167 21.1307 23.8351 21.127 23.3488C21.1232 22.8625 21.8227 22.4734 22.6906 22.4659C23.5584 22.4584 24.2654 22.8438 24.2691 23.3264Z" fill="#FAAD1B" />
                <path d="M24.2241 23.124C24.2276 23.1551 24.2276 23.1865 24.2241 23.2175C24.2241 23.6889 23.5396 24.078 22.6942 24.0817C21.8488 24.0855 21.153 23.7076 21.1493 23.2437C21.1474 23.2126 21.1474 23.1814 21.1493 23.1502C21.1228 23.213 21.1088 23.2803 21.1082 23.3485C21.1082 23.8311 21.8189 24.2164 22.6867 24.2089C23.5546 24.2014 24.2541 23.8049 24.2503 23.326C24.2526 23.2577 24.2437 23.1895 24.2241 23.124Z" fill="#F8D21E" />
                <path d="M22.7102 23.9536C23.3361 23.9487 23.8413 23.6633 23.8386 23.3162C23.8359 22.9691 23.3262 22.6917 22.7003 22.6967C22.0743 22.7016 21.5691 22.9869 21.5718 23.334C21.5746 23.6811 22.0842 23.9585 22.7102 23.9536Z" fill="#8E381E" />
                <path d="M23.6967 23.375C23.6967 23.6743 23.2553 23.9175 22.7017 23.9212C22.1481 23.925 21.6992 23.6893 21.6992 23.39C21.6992 23.0907 22.1406 22.8475 22.6942 22.8438C23.2479 22.8401 23.6967 23.0795 23.6967 23.375Z" fill="#F8D21E" />
                <path d="M23.5283 23.3228C23.5283 23.5697 23.1543 23.7755 22.7016 23.7792C22.249 23.783 21.8712 23.5847 21.8675 23.3341C21.8637 23.0834 22.2415 22.8851 22.6942 22.8814C23.1468 22.8777 23.5246 23.0759 23.5283 23.3228Z" fill="#FAAD1B" />
                <path d="M22.8219 24.1232C22.8219 24.1607 22.7694 24.1944 22.7057 24.1944C22.6419 24.1944 22.5857 24.1644 22.5857 24.1269C22.5857 24.0894 22.6382 24.0557 22.7019 24.0557C22.7657 24.0557 22.8219 24.1007 22.8219 24.1232Z" fill="#F9ED43" />
                <path d="M22.822 23.8463C22.822 23.8838 22.7695 23.9138 22.702 23.9138C22.6345 23.9138 22.582 23.8838 22.582 23.8463C22.582 23.8088 22.6345 23.7788 22.702 23.7788C22.7695 23.7788 22.822 23.8088 22.822 23.8463Z" fill="#F9ED43" />
                <path d="M23.0946 22.9787C22.9753 22.9036 22.8372 22.8638 22.6962 22.8638C22.5553 22.8638 22.4172 22.9036 22.2979 22.9787C22.1333 23.1395 22.4812 23.1395 22.6719 23.1395H22.6906C22.9113 23.1395 23.2592 23.1358 23.0946 22.9787Z" fill="#F8D21E" />
                <path d="M22.8559 22.9523C22.8559 23.0048 22.7846 23.046 22.6947 23.0498C22.6047 23.0535 22.5334 23.0085 22.5334 22.956C22.5334 22.9035 22.6047 22.8623 22.6947 22.8623C22.7846 22.8623 22.8559 22.8998 22.8559 22.9523Z" fill="#F9ED43" />
                <path d="M22.5709 22.5554L22.7542 22.7874H22.7767L23.0497 22.6789C23.0722 22.6789 23.0871 22.6789 23.0684 22.7088L22.8365 22.8958V22.9145L22.945 23.1914C22.945 23.2101 22.9263 23.225 22.9113 23.2101L22.728 22.9781C22.728 22.9781 22.728 22.9781 22.7056 22.9781L22.4325 23.0866L22.4138 23.0567L22.6457 22.8734V22.851L22.5373 22.5741C22.5298 22.5554 22.556 22.5405 22.5709 22.5554Z" fill="white" />
                <path d="M22.9196 23.9139L22.8971 24.1013L23.0696 24.1763C23.0696 24.1763 23.0696 24.2026 23.0696 24.1988L22.8859 24.1801L22.8109 24.3525H22.7884L22.8109 24.1651L22.6384 24.0901C22.6384 24.0901 22.6384 24.0638 22.6384 24.0676L22.8259 24.0901L22.9009 23.9176C22.9009 23.9176 22.9196 23.9026 22.9196 23.9139Z" fill="white" />
                <path d="M25.9262 22.75C25.8722 22.7024 25.8081 22.6676 25.7389 22.6482C25.6696 22.6287 25.5968 22.6252 25.5259 22.6377C25.4554 22.627 25.3833 22.6319 25.3148 22.6519C25.2464 22.6719 25.1831 22.7067 25.1294 22.7537C24.9648 22.9146 25.3127 22.9146 25.5035 22.9146H25.5222C25.7429 22.9108 26.0908 22.9071 25.9262 22.75Z" fill="#F8D21E" />
                <path d="M25.6877 22.7243C25.6877 22.7768 25.6164 22.818 25.5264 22.8218C25.4365 22.8255 25.3652 22.7805 25.3652 22.728C25.3652 22.6755 25.4365 22.6343 25.5264 22.6343C25.6164 22.6343 25.6877 22.6755 25.6877 22.7243Z" fill="#F9ED43" />
                <path d="M27.3851 23.5138C27.3869 23.4913 27.3869 23.4688 27.3851 23.4464C27.3867 23.429 27.3867 23.4115 27.3851 23.394C27.3851 23.3753 27.3851 23.3566 27.3851 23.3304C27.3114 23.1642 27.2023 23.0161 27.0653 22.8965C26.9283 22.777 26.7667 22.6888 26.5921 22.6384C26.2617 22.5171 25.9115 22.4587 25.5596 22.4663C25.1911 22.4497 24.8228 22.5043 24.4748 22.6271C24.3061 22.6844 24.1518 22.7776 24.0227 22.9003C23.8935 23.023 23.7925 23.1723 23.7267 23.3379C23.7246 23.3578 23.7246 23.3779 23.7267 23.3978C23.7246 23.4152 23.7246 23.4328 23.7267 23.4502C23.7248 23.4726 23.7248 23.4951 23.7267 23.5175V23.5998C23.7254 23.7592 23.7581 23.9171 23.8226 24.0629C23.8871 24.2086 23.982 24.339 24.1008 24.4453L24.1606 24.4976C24.5267 24.7521 24.9643 24.8832 25.41 24.8718H25.7504C25.8568 24.8688 25.9629 24.86 26.0684 24.8456H26.1058C26.9886 24.7296 27.4562 24.2956 27.4487 23.5848V23.4988L27.3851 23.5138Z" fill="#8E381E" />
                <path d="M27.0933 23.5696C27.0933 23.9437 26.9549 24.6171 25.5334 24.6284C24.1119 24.6396 23.9586 23.9774 23.9548 23.5921C23.9548 23.0197 24.6506 22.6419 25.5184 22.6344C26.3863 22.6269 27.0933 23.001 27.0933 23.5696Z" fill="#F47920" />
                <path d="M25.2231 24.6166C25.3241 24.6166 25.4289 24.6166 25.5448 24.6166C25.6608 24.6166 25.7169 24.6166 25.7955 24.6166V24.3285L25.9002 24.3024V24.6091L26.0498 24.5904V24.2163L25.2269 24.2911L25.2231 24.6166Z" fill="#FAAD1B" />
                <path d="M24.5647 24.1606C24.5423 24.0147 24.1682 23.8726 24.1682 23.8726L24.2056 24.2466C24.235 24.2772 24.2663 24.3059 24.2991 24.3327L24.2505 23.9885L24.344 24.0372L24.4039 24.4112C24.4703 24.4516 24.5405 24.4854 24.6134 24.5123L24.5647 24.1606Z" fill="#FAAD1B" />
                <path d="M27.0933 23.4911C27.0933 23.9737 26.3975 24.3665 25.5334 24.374C24.6693 24.3814 23.9586 23.9999 23.9548 23.5173C23.9511 23.0347 24.6506 22.6419 25.5184 22.6344C26.3863 22.6269 27.0933 23.001 27.0933 23.4911Z" fill="#FAAD1B" />
                <path d="M27.0598 23.2925C27.0617 23.3236 27.0617 23.3549 27.0598 23.386C27.0598 23.8574 26.379 24.2427 25.5298 24.2502C24.6807 24.2577 23.9924 23.8761 23.9887 23.4085C23.985 23.3774 23.985 23.346 23.9887 23.3149C23.9618 23.3789 23.9478 23.4476 23.9475 23.5169C23.9475 23.9958 24.6582 24.3811 25.5261 24.3736C26.3939 24.3662 27.0897 23.9733 27.0859 23.4908C27.09 23.4236 27.0811 23.3563 27.0598 23.2925Z" fill="#F8D21E" />
                <path d="M26.6668 23.4835C26.6668 23.8314 26.1618 24.1157 25.5446 24.1194C24.9274 24.1232 24.4224 23.8463 24.4224 23.5022C24.4224 23.158 24.9236 22.8699 25.5446 22.8625C26.1655 22.855 26.663 23.1355 26.6668 23.4835Z" fill="#8E381E" />
                <path d="M26.5322 23.5435C26.5322 23.8428 26.0908 24.0859 25.5372 24.0934C24.9835 24.1009 24.5347 23.8577 24.5347 23.5584C24.5347 23.2592 24.9761 23.016 25.5297 23.0123C26.0833 23.0085 26.5284 23.2442 26.5322 23.5435Z" fill="#F8D21E" />
                <path d="M26.3637 23.4874C26.3637 23.738 25.9897 23.9401 25.5371 23.9438C25.0844 23.9475 24.7029 23.7493 24.7029 23.5024C24.7029 23.2554 25.077 23.0497 25.5296 23.046C25.9822 23.0422 26.345 23.2405 26.3637 23.4874Z" fill="#FAAD1B" />
                <path d="M25.6573 24.3031C25.6573 24.3444 25.6048 24.3744 25.5411 24.3744C25.4774 24.3744 25.4211 24.3444 25.4211 24.3069C25.4211 24.2694 25.4736 24.2394 25.5374 24.2356C25.6011 24.2319 25.6573 24.2656 25.6573 24.3031Z" fill="#F9ED43" />
                <path d="M25.6574 24.0114C25.6574 24.0488 25.6012 24.0826 25.5375 24.0826C25.4737 24.0826 25.4175 24.0526 25.4175 24.0151C25.4175 23.9776 25.47 23.9438 25.5375 23.9438C25.6049 23.9438 25.6537 23.9739 25.6574 24.0114Z" fill="#F9ED43" />
                <path d="M25.9261 23.1435C25.8072 23.0692 25.6698 23.0298 25.5296 23.0298C25.3894 23.0298 25.252 23.0692 25.1331 23.1435C24.9685 23.3044 25.3164 23.3006 25.5071 23.3044C25.7465 23.3044 26.0944 23.3006 25.9261 23.1435Z" fill="#F8D21E" />
                <path d="M25.6913 23.1211C25.6913 23.1698 25.6201 23.2148 25.5301 23.2148C25.4401 23.2148 25.3689 23.1736 25.3689 23.1211C25.3689 23.0686 25.4401 23.0273 25.5301 23.0273C25.6201 23.0273 25.6913 23.0686 25.6913 23.1211Z" fill="#F9ED43" />
                <path d="M25.4064 22.7239L25.5897 22.9559C25.5897 22.9559 25.5897 22.9559 25.6122 22.9559L25.8852 22.8474C25.8884 22.8489 25.8911 22.8513 25.8929 22.8543C25.8948 22.8573 25.8958 22.8607 25.8958 22.8642C25.8958 22.8677 25.8948 22.8712 25.8929 22.8742C25.8911 22.8771 25.8884 22.8795 25.8852 22.8811L25.6533 23.0644C25.6533 23.0644 25.6533 23.0644 25.6533 23.0868L25.7618 23.3599C25.7603 23.3631 25.7579 23.3657 25.7549 23.3676C25.7519 23.3695 25.7485 23.3705 25.745 23.3705C25.7414 23.3705 25.738 23.3695 25.735 23.3676C25.732 23.3657 25.7297 23.3631 25.7281 23.3599L25.5448 23.128C25.5414 23.126 25.5375 23.125 25.5336 23.125C25.5297 23.125 25.5258 23.126 25.5224 23.128L25.2493 23.2365C25.2449 23.2389 25.2396 23.2395 25.2347 23.2381C25.2298 23.2367 25.2256 23.2334 25.2231 23.229C25.2206 23.2245 25.22 23.2192 25.2214 23.2143C25.2228 23.2094 25.2261 23.2053 25.2306 23.2028L25.4625 23.0195C25.4645 23.0161 25.4655 23.0122 25.4655 23.0082C25.4655 23.0043 25.4645 23.0004 25.4625 22.997L25.3541 22.7239C25.3541 22.717 25.3568 22.7103 25.3617 22.7054C25.3666 22.7005 25.3733 22.6978 25.3802 22.6978C25.3872 22.6978 25.3938 22.7005 25.3988 22.7054C25.4037 22.7103 25.4064 22.717 25.4064 22.7239Z" fill="white" />
                <path d="M25.7549 24.0825L25.7324 24.2662L25.9049 24.3412V24.3637L25.7174 24.3412L25.6424 24.5137H25.6199L25.6424 24.3262L25.47 24.2512V24.2287L25.6537 24.2512L25.7287 24.0788C25.7287 24.0788 25.7549 24.0675 25.7549 24.0825Z" fill="white" />
              </svg>

            </div>

            <div className="ml-2 flex flex-col justify-center">
              <span className="text-[14px] text-[#A5F0FF]">
                RAFFLE
              </span>
              <span className="text-[24px] mt-[-9px]">$NOOT</span>
            </div>
          </div>
        </div>


        {/* <div className="flex items-center gap-4 mt-4">
          <div className="relative">
            <svg className="absoute" width="299" height="46" viewBox="0 0 299 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_dii_8_3374)">
                <path d="M298.996 13.6444C298.996 14.7835 298.996 15.9156 298.996 17.0547C298.996 17.5964 298.996 18.1451 298.996 18.6938V19.5689C298.996 21.1178 298.689 22.6666 298.383 24.2085C298.383 24.9795 298.128 25.7435 297.873 26.5144C297.996 26.96 297.599 27.4054 296.698 27.8341C295.789 28.3489 295.259 28.8747 295.116 29.4038C295.091 29.5687 294.659 29.7277 293.891 29.8552C292.993 29.9468 291.899 29.9957 290.777 29.9941L285.212 30.0705C266.498 30.4116 298.32 31.2071 279.5 31L289.296 31.4944C290.44 31.5062 291.537 31.5616 292.461 31.6541C293.005 31.74 293.402 31.8412 293.623 31.9506C293.844 32.0599 293.883 32.1745 293.738 32.2861C293.592 32.6258 293.319 32.9643 292.921 33.3002C292.257 33.9947 291.338 34.6337 291.134 35.3213C291.134 35.4602 291.134 35.5992 291.134 35.7381C290.245 36.17 288.677 36.5705 286.539 36.9118C282.425 37.6936 277.084 38.341 270.903 38.8071C264.722 39.2732 257.856 39.5463 250.803 39.6067C183.846 40.1446 116.71 40.1307 49.7644 39.565C39.6575 39.4842 30.0102 38.963 22.2481 38.0787C17.4662 37.5407 13.5552 36.8739 10.7616 36.1201C9.58745 35.7797 9.28109 35.4255 8.15797 35.0505C7.88443 34.9771 7.6622 34.9003 7.49428 34.8213C7.22498 34.7111 7.19754 34.5927 7.41514 34.4804C7.63273 34.3682 8.08589 34.267 8.71946 34.1892C10.4191 34.0475 12.3958 33.9797 14.386 33.9947C36.5933 33.8906 -8.26869 33.6544 13.7343 33.5711C6.74031 33.5711 20.6773 33.5711 13.7343 33.5711C11.2328 33.5224 16.1337 33.6058 13.7343 33.5711C2.29887 33.3835 25.2208 33.6336 13.7343 33.5711C-0.151907 33.5369 28.7592 33.2573 15 33C12.3532 32.9455 12.4692 32.5435 9.99573 32.4042C8.2567 32.3009 6.75689 32.1353 5.65652 31.925C5.64091 31.9065 5.64091 31.8879 5.65652 31.8694C4.07344 31.5007 3.47804 31.0687 3.97175 30.647C4.3551 30.204 4.3551 29.7565 3.97175 29.3135L3.05286 26.9103C3.05286 26.4728 2.69532 26.0352 2.54217 25.5976C2.23795 25.3578 2.58253 25.111 3.51215 24.9031C4.57087 24.7685 5.907 24.6813 7.34098 24.653C11.6803 24.5072 11.1096 24.2641 15.5 24.1738C17.4568 24.1243 24.345 24.1891 26.3321 24.1738H15.5C13.9415 24.1351 7.94649 23.602 6.5243 23.507L5.60542 23.4306C4.53934 23.3171 3.67084 23.173 3.0619 23.0085C2.45296 22.844 2.1186 22.6632 2.08288 22.4791C2.08288 22.361 2.08279 22.236 1.67439 22.111C1.31703 21.8262 1.06191 21.5415 0.857706 21.2498C0.500348 20.8122 0.34717 20.3746 0.194017 19.9371C-0.16334 18.9786 -0.520747 17.7423 3.97175 16.9366C4.8982 16.8091 6.00395 16.7083 7.2232 16.6403C8.44245 16.5723 11.1823 15.9977 12.5 16C0.00950813 16.1343 24.9565 15.7916 12.5 16C1.98348 16.0625 22.9655 15.8889 12.5 16C-8.0976 16.1181 32.938 16.3677 12.5 16C9.15867 15.9541 11.6539 15.2201 8.56615 15.0405H8.31096C7.51223 14.9898 6.7586 14.9269 6.0647 14.8529C4.47005 14.6824 3.26587 14.4535 2.59327 14.1931C2.08168 13.9432 2.08168 13.679 2.59327 13.4291C2.59327 13.3249 2.59327 13.2277 2.59327 13.1305C2.59327 12.5193 2.59325 11.9011 2.89956 11.2969C2.89956 10.9843 2.89956 10.6718 2.89956 10.3592C3.20587 9.00252 3.66543 7.64815 4.27804 6.2961C4.97912 4.70763 9.99766 3.21141 18.3576 2.09843C26.7175 0.985455 37.8211 0.335277 49.5092 0.274347C116.25 -0.0914491 183.246 -0.0914491 250.497 0.274347C261.118 0.342033 271.269 0.890775 279.335 1.83335C287.401 2.77593 292.919 4.05826 295.014 5.47653C296.474 6.39003 296.63 7.33321 295.473 8.25473C295.194 8.48014 294.749 8.70119 294.146 8.91455C293.768 9.08553 293.162 9.24562 292.359 9.38684C291.712 9.42679 291.023 9.45257 290.317 9.46324C286.386 9.58826 283.482 11.408 279.5 11.4983C271.536 11.6927 287.515 11.401 279.5 11.4983C263.368 11.6927 295.683 11.4566 279.5 11.4983C284.361 11.4859 288.554 11.2075 292.921 11.4983C298.74 11.9358 299.047 12.8179 298.996 13.6444Z" fill="url(#paint0_linear_8_3374)" />
                <path d="M49.5117 0.774414C112.08 0.431489 174.872 0.409899 237.889 0.709961L250.494 0.774414C260.439 0.837794 269.965 1.32329 277.744 2.1582L279.276 2.33008C283.298 2.80009 286.675 3.35385 289.301 3.96387C291.945 4.57825 293.769 5.23733 294.733 5.89062L294.749 5.90039C295.449 6.33846 295.691 6.70077 295.731 6.94434C295.76 7.11928 295.702 7.3735 295.337 7.71289L295.162 7.86328L295.159 7.86523C294.946 8.03754 294.564 8.23656 293.979 8.44336L293.959 8.4502L293.939 8.45898C293.624 8.60148 293.079 8.75057 292.301 8.88867C291.99 8.90762 291.67 8.92426 291.342 8.93652L290.31 8.96289L290.301 8.96387C288.266 9.02863 286.5 9.5329 284.792 10.0127C283.18 10.4654 281.617 10.8972 279.846 10.9854L279.488 10.998C279.486 10.9981 279.484 10.998 279.481 10.998C277.472 11.0223 276.215 11.0405 275.523 11.0527C275.35 11.0558 275.212 11.0581 275.105 11.0605C275.052 11.0618 275.007 11.0634 274.969 11.0645C274.931 11.0655 274.9 11.0663 274.875 11.0674C274.863 11.0679 274.851 11.0687 274.84 11.0693C274.835 11.0696 274.829 11.0699 274.823 11.0703C274.818 11.0707 274.809 11.0713 274.8 11.0723C274.796 11.0727 274.787 11.0735 274.782 11.0742C274.775 11.0752 274.759 11.0782 274.749 11.0801C274.734 11.0835 274.693 11.0952 274.667 11.1045C274.608 11.1324 274.422 11.3102 274.354 11.4932C274.377 11.7355 274.578 11.9909 274.653 12.0312C274.685 12.0433 274.733 12.0577 274.751 12.0615C274.762 12.0635 274.78 12.0664 274.787 12.0674C274.793 12.0681 274.802 12.0689 274.807 12.0693C274.816 12.0702 274.824 12.071 274.83 12.0713C274.836 12.0716 274.842 12.072 274.847 12.0723C274.857 12.0727 274.869 12.073 274.88 12.0732C274.903 12.0738 274.931 12.0738 274.964 12.0742C275.03 12.075 275.119 12.0759 275.228 12.0762C275.336 12.0764 275.465 12.0763 275.611 12.0762C275.905 12.0758 276.269 12.0741 276.68 12.0723C277.502 12.0687 278.512 12.063 279.522 12.0557C280.533 12.0483 281.543 12.0396 282.363 12.0312C282.773 12.0271 283.137 12.0225 283.429 12.0186C283.574 12.0166 283.703 12.0155 283.811 12.0137C283.918 12.0118 284.007 12.0095 284.072 12.0078C284.104 12.007 284.133 12.0058 284.155 12.0049C284.166 12.0044 284.177 12.0045 284.188 12.0039C284.193 12.0036 284.199 12.0034 284.205 12.0029C284.208 12.0027 284.213 12.0022 284.216 12.002C284.219 12.0016 284.226 12.0005 284.23 12C284.235 11.9994 284.247 11.998 284.253 11.9971C284.262 11.9955 284.284 11.9914 284.297 11.9883C284.32 11.9819 284.391 11.9538 284.438 11.9287C284.439 11.9274 284.44 11.9252 284.441 11.9238C287.344 11.8616 290.07 11.809 292.883 11.9961V11.9971C295.793 12.2158 297.24 12.5423 297.945 12.877C298.286 13.0385 298.402 13.1789 298.447 13.2617C298.492 13.3439 298.508 13.4402 298.497 13.6133L298.496 13.6289V19.5693C298.496 21.0606 298.201 22.5611 297.893 24.1113L297.883 24.1592V24.209C297.883 24.8843 297.659 25.569 297.398 26.3574L297.351 26.501L297.391 26.6475C297.394 26.6603 297.416 26.7141 297.296 26.8486C297.164 26.9965 296.909 27.1804 296.483 27.3828L296.468 27.3906L296.452 27.3994C295.574 27.8967 294.912 28.4688 294.672 29.1475C294.654 29.1551 294.634 29.1657 294.609 29.1748C294.449 29.2339 294.191 29.2968 293.831 29.3574C293.175 29.424 292.409 29.4692 291.601 29.4863L290.777 29.4941H290.77L285.205 29.5703H285.203C282.863 29.613 281.305 29.6632 280.337 29.7178C279.856 29.7449 279.508 29.774 279.279 29.8057C279.171 29.8207 279.061 29.8401 278.972 29.8691C278.936 29.8808 278.847 29.9107 278.764 29.9785C278.719 30.0147 278.643 30.0883 278.6 30.209C278.55 30.3477 278.564 30.4908 278.62 30.6064C278.668 30.7059 278.736 30.7664 278.774 30.7959C278.816 30.828 278.856 30.8484 278.883 30.8613C278.936 30.8869 278.988 30.9041 279.027 30.915C279.108 30.9379 279.206 30.9566 279.306 30.9727C279.362 30.9817 279.424 30.9882 279.49 30.9971L279.475 31.499L289.271 31.9941H289.291C290.414 32.0058 291.488 32.06 292.39 32.1494C292.724 32.2024 292.977 32.2595 293.156 32.3115C293.035 32.4985 292.854 32.7021 292.599 32.918L292.578 32.9355L292.56 32.9551C292.406 33.1161 292.234 33.2766 292.052 33.4443C291.873 33.6087 291.681 33.7835 291.505 33.957C291.165 34.2908 290.796 34.7004 290.654 35.1787L290.634 35.249V35.4111C289.774 35.7651 288.369 36.1132 286.46 36.418L286.453 36.4189L286.446 36.4209C282.357 37.1979 277.035 37.8433 270.865 38.3086C265.468 38.7156 259.545 38.9753 253.431 39.0742L250.799 39.1064C188.029 39.6107 125.102 39.6307 62.3223 39.165L49.7686 39.0654L47.8818 39.0449C39.1049 38.9264 30.7521 38.4751 23.7773 37.7432L22.3047 37.582H22.3037C17.5373 37.0458 13.6574 36.3831 10.8994 35.6396H10.9004C10.3534 35.4811 10.0125 35.3218 9.66016 35.1494C9.37419 35.0095 9.07316 34.8575 8.66406 34.7012C8.69947 34.6965 8.73553 34.6911 8.77246 34.6865C10.2416 34.5644 11.9229 34.498 13.6416 34.4932L14.3818 34.4951H14.3887C17.1638 34.4821 18.8946 34.4668 19.8398 34.4502C20.305 34.442 20.5979 34.4334 20.7275 34.4229C20.7454 34.4214 20.7656 34.4195 20.7852 34.417C20.7972 34.4154 20.8377 34.41 20.8828 34.3965C20.8903 34.3942 20.9781 34.3707 21.0625 34.3008C21.1135 34.252 21.208 34.1005 21.2373 33.9951C21.2418 33.8693 21.1749 33.6611 21.1201 33.585C21.0798 33.5438 21.0063 33.4883 20.9756 33.4707C20.9546 33.4602 20.918 33.4451 20.9023 33.4395C20.8715 33.4289 20.8454 33.4234 20.833 33.4209C20.7882 33.4118 20.7393 33.4075 20.7119 33.4053C20.6759 33.4024 20.6323 33.399 20.584 33.3965C20.3418 33.384 19.8817 33.3724 19.2744 33.3594C19.2886 33.3271 19.3019 33.2919 19.3096 33.252C19.3669 32.9547 19.1585 32.7828 19.1094 32.7471C19.0446 32.7 18.9832 32.6781 18.9619 32.6709C18.8765 32.6422 18.7702 32.6311 18.7012 32.624C18.6122 32.6149 18.4968 32.6059 18.3555 32.5977C17.7909 32.5647 16.7285 32.5321 15.0098 32.5H15.0107C13.7224 32.4735 13.1196 32.3638 12.5332 32.2441C11.9166 32.1183 11.2981 31.977 10.0244 31.9053H10.0254C8.7007 31.8266 7.52407 31.7108 6.56445 31.5693L6.56641 31.5684L5.76953 31.3828C5.05965 31.2174 4.6195 31.0513 4.39551 30.916C4.61427 30.645 4.75873 30.3317 4.75879 29.9805C4.75879 29.6364 4.62131 29.3277 4.41016 29.0605L3.54785 26.8057C3.52393 26.5037 3.40274 26.2338 3.30273 26.0322C3.20116 25.8275 3.12086 25.6868 3.06055 25.5498C3.07096 25.5459 3.08148 25.5411 3.09277 25.5371C3.22076 25.4917 3.38676 25.4436 3.59375 25.3965C4.36722 25.2989 5.29584 25.2265 6.30664 25.1846L7.35059 25.1533L7.35742 25.1523C9.54112 25.0789 10.495 24.9814 11.4482 24.8906C12.1514 24.8237 12.8577 24.7602 14.0869 24.7139L15.5107 24.6738H26.332V24.6729C26.3333 24.6728 26.3346 24.6738 26.3359 24.6738L26.332 23.6738H26.3281C24.3727 23.6888 17.4883 23.6242 15.5059 23.6729C13.9483 23.6331 8.01219 23.1049 6.55762 23.0078H6.55664L5.65723 22.9326C4.86643 22.8484 4.19727 22.7486 3.6709 22.6387L3.19238 22.5254C2.9042 22.4475 2.71075 22.3737 2.5957 22.3115C2.58456 22.3055 2.57511 22.2982 2.56641 22.293C2.54746 22.2005 2.50697 22.0871 2.41699 21.9785C2.29277 21.8286 2.11613 21.7372 1.92773 21.6699C1.64067 21.4327 1.43392 21.2005 1.26758 20.9629L1.25684 20.9482L1.24512 20.9336L1.1416 20.7979C0.980921 20.5712 0.876321 20.3411 0.780273 20.0879L0.666016 19.7715L0.662109 19.7627L0.599609 19.5869C0.468052 19.1973 0.448594 18.947 0.65332 18.6934C0.794453 18.5186 1.07555 18.3001 1.62598 18.0732C2.17241 17.8481 2.95238 17.6272 4.05176 17.4297C4.95911 17.3053 6.04671 17.2068 7.25098 17.1396C7.89137 17.1039 8.916 16.9371 9.89941 16.7881C10.1829 16.7451 10.4633 16.7036 10.7334 16.666C11.2867 16.6709 11.8622 16.6791 12.4375 16.6826C13.7204 16.6904 15.005 16.6936 16.0508 16.6924C16.5736 16.6918 17.0377 16.69 17.4121 16.6865C17.5992 16.6848 17.7648 16.6832 17.9043 16.6807C17.9741 16.6794 18.0379 16.6773 18.0947 16.6758C18.1515 16.6743 18.2023 16.6727 18.2461 16.6709C18.268 16.67 18.2886 16.67 18.3076 16.6689C18.3264 16.6679 18.3445 16.6663 18.3613 16.665C18.3778 16.6638 18.3963 16.6622 18.4141 16.6602C18.423 16.6591 18.4339 16.658 18.4453 16.6562C18.4505 16.6554 18.4594 16.6534 18.4648 16.6523C18.4712 16.6511 18.4839 16.6491 18.4912 16.6475C18.5001 16.6453 18.5187 16.6399 18.5293 16.6367C18.5433 16.6321 18.5748 16.6203 18.5928 16.6123C18.6186 16.5993 18.6795 16.5601 18.7139 16.5322C18.7639 16.4811 18.8535 16.3272 18.8789 16.2227C18.8803 16.1037 18.8163 15.9064 18.7646 15.833C18.7261 15.7923 18.6545 15.7361 18.624 15.7178C18.6032 15.7068 18.5667 15.6906 18.5508 15.6846C18.5389 15.6804 18.5175 15.6746 18.5078 15.6719C18.4999 15.6698 18.4863 15.6656 18.4795 15.6641C18.4737 15.6628 18.4644 15.6612 18.459 15.6602C18.4468 15.6579 18.4351 15.6566 18.4258 15.6553C18.4163 15.654 18.4072 15.6523 18.3984 15.6514C18.3896 15.6504 18.3801 15.6493 18.3711 15.6484C18.3533 15.6468 18.3339 15.646 18.3135 15.6445C18.2928 15.643 18.2697 15.6411 18.2451 15.6396C18.196 15.6367 18.1378 15.6339 18.0703 15.6309C17.9349 15.6247 17.7587 15.6174 17.5391 15.6104C17.2356 15.6006 16.8465 15.5918 16.3623 15.5801C16.3019 15.5056 16.2455 15.4571 16.2197 15.4482C16.1969 15.4428 16.1623 15.4371 16.1504 15.4355C16.1435 15.4348 16.1321 15.433 16.127 15.4326C16.1233 15.4324 16.1163 15.4328 16.1133 15.4326C16.1072 15.4323 16.1015 15.4318 16.0977 15.4316C16.0936 15.4315 16.0896 15.4317 16.0859 15.4316C16.0784 15.4315 16.0701 15.4307 16.0615 15.4307C16.0445 15.4305 16.023 15.4306 15.998 15.4307C15.9476 15.4308 15.8785 15.431 15.7949 15.4316C15.7113 15.4323 15.6119 15.4335 15.499 15.4346C15.2728 15.4368 14.9919 15.4406 14.6748 15.4443C14.0405 15.4519 13.2602 15.4619 12.4805 15.4727C12.289 15.4753 12.0975 15.4778 11.9082 15.4805C11.4626 15.457 11.2005 15.4176 11.042 15.374C10.9398 15.3459 10.8975 15.3212 10.8818 15.3105C10.8675 15.3008 10.8558 15.29 10.8193 15.2471C10.7854 15.2071 10.7108 15.1131 10.6064 15.0264C10.4951 14.9339 10.3612 14.8565 10.1895 14.792C9.86347 14.6696 9.37747 14.5866 8.59473 14.541L8.58105 14.54H8.3291C7.54153 14.4899 6.79915 14.4281 6.11719 14.3555H6.11816C4.69024 14.2027 3.62021 14.0052 2.97754 13.7969L3.09375 13.7412V13.1309L3.09863 12.6836C3.11225 12.2564 3.16224 11.8844 3.3457 11.5225L3.39941 11.416V10.4199C3.65994 9.28031 4.0312 8.13995 4.51562 6.99902L4.7334 6.50293L4.73535 6.49805C4.84125 6.25812 5.16116 5.93345 5.83691 5.56543C6.49379 5.20771 7.41196 4.84893 8.58887 4.49805C10.9401 3.79708 14.2556 3.14867 18.4238 2.59375C26.2356 1.55377 36.463 0.918541 47.3301 0.792969L49.5117 0.774414Z" stroke="white" strokeOpacity="0.61" />
              </g>
              <defs>
                <filter id="filter0_dii_8_3374" x="0" y="-4" width="299" height="50" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                  <feFlood floodOpacity="0" result="BackgroundImageFix" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dy="6" />
                  <feComposite in2="hardAlpha" operator="out" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.270588 0 0 0 0 0.862745 0 0 0 0 0.968627 0 0 0 1 0" />
                  <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_3374" />
                  <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_3374" result="shape" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dy="-4" />
                  <feGaussianBlur stdDeviation="2" />
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.494118 0 0 0 0 0.968627 0 0 0 0 0.996078 0 0 0 1 0" />
                  <feBlend mode="normal" in2="shape" result="effect2_innerShadow_8_3374" />
                  <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
                  <feOffset dy="4" />
                  <feGaussianBlur stdDeviation="2" />
                  <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
                  <feColorMatrix type="matrix" values="0 0 0 0 0.929412 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0" />
                  <feBlend mode="normal" in2="effect2_innerShadow_8_3374" result="effect3_innerShadow_8_3374" />
                </filter>
                <linearGradient id="paint0_linear_8_3374" x1="149.5" y1="0" x2="149.5" y2="40" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#A5F0FF" />
                  <stop offset="1" stopColor="#7EFFFF" />
                </linearGradient>
              </defs>
            </svg>
            <p className="absolute z-[10]  top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </p>

          </div>
          <button
            className="text-white relative w-[40px] h-[40px]"
            onClick={() => setMenuState(MenuStates.videoSettings)}
          >
            <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
            <img src="/cog.png" alt="settings" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
          </button>
        </div> */}
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
              <svg width="42" height="41" viewBox="0 0 42 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M41.8114 15.5728C41.572 14.8496 41.1237 14.2136 40.5231 13.7451C39.9225 13.2766 39.1966 12.9966 38.4369 12.9405L29.0493 12.1913C28.9262 12.1811 28.8082 12.1373 28.7082 12.0647C28.6083 11.9921 28.5301 11.8935 28.4824 11.7796L24.8852 3.14024C24.5921 2.44101 24.0986 1.84419 23.4668 1.425C22.8351 1.00581 22.0935 0.783016 21.3353 0.784683C20.5762 0.782571 19.8335 1.0051 19.2006 1.42426C18.5677 1.84342 18.073 2.44047 17.7787 3.14024L14.1613 11.7796C14.1135 11.8935 14.0354 11.9921 13.9354 12.0647C13.8355 12.1373 13.7175 12.1811 13.5944 12.1913L4.20671 12.9337C3.45142 12.9892 2.72965 13.2679 2.13311 13.7345C1.53657 14.2011 1.09217 14.8345 0.856372 15.5542C0.620578 16.274 0.604029 17.0476 0.80883 17.7767C1.01363 18.5059 1.43054 19.1577 2.00658 19.6494L9.16038 25.7239C9.2554 25.8054 9.32592 25.9116 9.36406 26.0308C9.40219 26.15 9.40645 26.2774 9.37634 26.3989L7.16271 35.4972C6.98364 36.2327 7.0287 37.0049 7.29209 37.7146C7.55549 38.4242 8.02517 39.0388 8.64071 39.4793C9.25696 39.9253 9.9912 40.1792 10.7512 40.2092C11.5113 40.2392 12.2633 40.044 12.9127 39.6481L20.9439 34.775C21.0465 34.7157 21.1629 34.6845 21.2813 34.6845C21.3998 34.6845 21.5162 34.7157 21.6188 34.775L29.6567 39.6548C30.3057 40.0485 31.0562 40.2424 31.8147 40.2123C32.5732 40.1823 33.306 39.9298 33.922 39.4861C34.5375 39.0456 35.0072 38.431 35.2706 37.7213C35.534 37.0116 35.579 36.2394 35.4 35.5039L33.2808 26.4056C33.2507 26.2842 33.255 26.1567 33.2931 26.0375C33.3312 25.9184 33.4017 25.8121 33.4968 25.7307L40.6506 19.6562C41.2291 19.1689 41.6488 18.5197 41.8557 17.7921C42.0625 17.0644 42.0471 16.2916 41.8114 15.5728Z" fill="#8E381E" />
                <path d="M30.5404 38.1296L22.5093 33.216C22.1541 32.9975 21.7453 32.8818 21.3282 32.8818C20.9112 32.8818 20.5024 32.9975 20.1472 33.216L12.1093 38.1229C11.7276 38.3515 11.287 38.4628 10.8425 38.4429C10.398 38.4229 9.96921 38.2727 9.60949 38.0108C9.24976 37.7489 8.97503 37.3869 8.81951 36.97C8.66399 36.5531 8.63456 36.0996 8.73487 35.6661L10.9215 26.507C11.0198 26.1022 11.0045 25.6781 10.877 25.2815C10.7496 24.8849 10.5151 24.5312 10.1994 24.2595L3.04558 18.1377C2.70785 17.8456 2.46386 17.4603 2.3442 17.0302C2.22453 16.6 2.23451 16.144 2.37289 15.7195C2.51126 15.2949 2.77188 14.9207 3.12206 14.6437C3.47224 14.3667 3.8964 14.1992 4.34136 14.1623L13.7223 13.4131C14.1379 13.38 14.5362 13.2326 14.8733 12.9872C15.2103 12.7418 15.473 12.408 15.6322 12.0227L19.2428 3.32939C19.414 2.91624 19.7037 2.5631 20.0755 2.31465C20.4473 2.0662 20.8845 1.93359 21.3316 1.93359C21.7788 1.93359 22.2159 2.0662 22.5877 2.31465C22.9595 2.5631 23.2493 2.91624 23.4204 3.32939L27.0378 12.0294C27.2022 12.4076 27.4672 12.7335 27.804 12.9715C28.1408 13.2095 28.5363 13.3506 28.9477 13.3793L38.3286 14.1353C38.7747 14.1703 39.2004 14.3369 39.5517 14.614C39.903 14.8911 40.1642 15.2663 40.3023 15.6919C40.4403 16.1176 40.4489 16.5747 40.327 17.0052C40.2052 17.4358 39.9583 17.8205 39.6177 18.1107L32.4706 24.2662C32.1531 24.5369 31.9165 24.89 31.7867 25.2865C31.6569 25.6831 31.639 26.1077 31.735 26.5138L33.9216 35.6728C34.0231 36.1073 33.9942 36.5621 33.8385 36.9802C33.6829 37.3983 33.4073 37.7612 33.0464 38.0235C32.6854 38.2858 32.2551 38.4357 31.8094 38.4546C31.3637 38.4735 30.9222 38.3604 30.5404 38.1296Z" fill="#F4EE72" />
                <path d="M30.8712 29.6116C27.2673 25.3122 21.2811 20.2568 21.2811 20.2568C21.2811 20.2568 14.5862 25.3662 11.7922 29.3281C10.0853 31.8055 9.21725 34.7647 9.31535 37.7717C9.67073 38.1409 10.1419 38.3771 10.6503 38.441C11.1588 38.5049 11.6737 38.3925 12.1094 38.1227L20.1473 33.2158C20.5025 32.9973 20.9113 32.8816 21.3283 32.8816C21.7453 32.8816 22.1542 32.9973 22.5094 33.2158L30.5405 38.1294C31.0455 38.4395 31.6522 38.5383 32.2294 38.4044C32.8066 38.2705 33.3079 37.9147 33.6248 37.414C33.5992 34.5794 32.6304 31.8342 30.8712 29.6116Z" fill="#F58220" />
                <path d="M21.281 1.93945C20.8444 1.94718 20.4197 2.0831 20.0597 2.33031C19.6997 2.57751 19.4203 2.9251 19.2563 3.32984L15.6389 12.0231C15.4797 12.4085 15.2171 12.7423 14.88 12.9877C14.5429 13.233 14.1446 13.3804 13.729 13.4135L4.34809 14.1627C3.7909 14.2028 3.26861 14.449 2.88306 14.8533C2.49752 15.2576 2.27635 15.791 2.2627 16.3495C3.96341 16.8288 5.84634 17.227 7.41883 17.6319C12.1025 18.8401 21.2945 20.2575 21.2945 20.2575L21.281 1.93945Z" fill="#FCD01E" />
                <path d="M33.9353 35.6654C34.0269 36.0368 34.0216 36.4254 33.92 36.7941C33.8184 37.1628 33.6238 37.4993 33.3549 37.7713C32.5567 35.0774 31.3601 32.5181 29.805 30.1781C26.8625 25.9867 21.3352 20.2024 21.3352 20.2024C21.3352 20.2024 25.9649 17.6714 30.1087 16.8749C34.2525 16.0785 40.286 15.6128 40.286 15.6128C40.4506 16.0514 40.4741 16.5305 40.353 16.9831C40.232 17.4357 39.9726 17.8392 39.6111 18.1371L32.4641 24.2588C32.1465 24.5294 31.9103 24.8827 31.7816 25.2795C31.6529 25.6763 31.6369 26.101 31.7352 26.5064L33.9353 35.6654Z" fill="#F58220" />
                <path d="M29.8049 30.1785C27.0244 26.2301 21.9155 20.8575 21.3823 20.2568C28.6374 21.384 31.6136 24.7992 31.6136 24.7992L31.8363 25.1772C31.666 25.6066 31.633 26.0782 31.7418 26.5271L33.9352 35.6861C34.0273 36.0579 34.0216 36.4473 33.9187 36.8163C33.8158 37.1853 33.6192 37.5214 33.3481 37.7919C32.5572 35.0901 31.3627 32.5233 29.8049 30.1785Z" fill="#FCD01E" />
                <path d="M8.72814 35.6654C8.63607 36.0373 8.64175 36.4266 8.74464 36.7956C8.84752 37.1646 9.04411 37.5007 9.31529 37.7713C10.108 35.0765 11.3025 32.5167 12.8584 30.1781C15.8009 25.9867 21.335 20.2024 21.335 20.2024C21.335 20.2024 16.712 17.6714 12.5615 16.8749C8.41094 16.0785 2.4382 15.6128 2.4382 15.6128C2.26696 16.0471 2.23607 16.5241 2.34985 16.9769C2.46364 17.4296 2.71638 17.8354 3.07259 18.1371L10.2264 24.2588C10.5421 24.5306 10.7766 24.8843 10.904 25.2809C11.0315 25.6775 11.0469 26.1016 10.9485 26.5064L8.72814 35.6654Z" fill="#F58220" />
                <path d="M12.858 30.1785C15.6318 26.2301 20.7407 20.8575 21.2806 20.2568C14.0188 21.384 11.0493 24.7992 11.0493 24.7992L10.8266 25.1772C10.9951 25.6072 11.0257 26.0789 10.9143 26.5271L8.72769 35.6861C8.63562 36.0579 8.64131 36.4473 8.74419 36.8163C8.84708 37.1853 9.04366 37.5214 9.31484 37.7919C10.1057 35.0901 11.3002 32.5233 12.858 30.1785Z" fill="#FBAE1A" />
                <path d="M9.68628 36.6245C11.1291 33.3086 13.058 30.2262 15.4093 27.479C19.1819 23.1053 21.3281 20.9522 21.3281 20.9522C24.4458 23.9068 27.2069 27.2163 29.5549 30.8132C32.7606 36.0238 33.2263 37.3872 33.2263 37.3872C32.1614 34.0521 30.6999 30.857 28.8733 27.8704C26.9067 24.7107 24.5484 21.8124 21.8545 19.2446L20.309 19.7238C20.309 19.7238 10.9821 29.6658 9.68628 36.6245Z" fill="#F4EE72" />
                <path d="M21.8747 19.251L20.3292 19.7302C20.3292 19.7302 10.9821 29.6654 9.68628 36.6241C11.1291 33.3082 13.058 30.2258 15.4093 27.4786C19.1819 23.1049 21.3281 20.9518 21.3281 20.9518L21.8747 19.251Z" fill="#FCD01E" />
                <path d="M2.91748 15.6535C2.91748 15.6535 6.87906 15.7817 12.1229 16.3284C14.9876 16.5471 17.7877 17.2907 20.3835 18.522C20.3835 18.522 20.7277 11.6511 21.0044 7.65539C21.2811 3.65971 21.2811 2.63379 21.2811 2.63379C21.2811 2.63379 21.7468 12.974 21.8548 15.6332C21.9628 18.2925 22.2665 18.522 22.2665 18.522L21.2811 20.2769C21.2811 20.2769 16.9551 17.1519 2.91748 15.6535Z" fill="white" />
                <path d="M40.2993 15.7417C40.3022 15.7686 40.3022 15.7958 40.2993 15.8227C40.3022 15.7958 40.3022 15.7686 40.2993 15.7417Z" fill="white" />
                <path d="M40.2318 15.6142C40.0845 15.2136 39.8246 14.8642 39.4834 14.6079C39.1421 14.3517 38.7341 14.1995 38.3084 14.1698L28.9275 13.4138C28.4657 13.3784 28.0267 13.199 27.6722 12.9009C27.6722 12.9009 24.372 14.2508 21.3013 20.1903C21.3013 20.1903 25.931 17.6592 30.0748 16.8628C34.2186 16.0664 39.9889 15.6344 40.2318 15.6142Z" fill="white" />
                <path d="M40.3938 16.1802C40.397 16.1935 40.397 16.2074 40.3938 16.2207C40.397 16.2074 40.397 16.1935 40.3938 16.1802Z" fill="white" />
                <path d="M24.3652 20.9048L31.6877 25.8319C31.7061 25.5316 31.7849 25.2381 31.9194 24.9691C32.0539 24.7 32.2414 24.4609 32.4706 24.266L32.8148 23.969C31.8424 23.2735 30.7856 22.7043 29.6698 22.2749C27.9636 21.6053 26.1823 21.1452 24.3652 20.9048Z" fill="#8E381E" />
                <path d="M22.3538 33.1419C22.1496 32.7701 21.9889 32.3761 21.8747 31.9675C21.6992 31.2521 21.4562 22.9165 21.4562 22.9165C21.4562 22.9165 21.2538 30.5366 21.1053 31.7785C21.0911 32.0291 21.0236 32.2737 20.9072 32.4961C20.7908 32.7184 20.6282 32.9133 20.4304 33.0677C20.7362 32.9354 21.0677 32.8734 21.4006 32.8863C21.7334 32.8991 22.0592 32.9865 22.3538 33.1419Z" fill="#8E381E" />
              </svg>

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
              <svg width="40" height="41" viewBox="0 0 40 41" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.481 32.8475C10.4691 32.8152 10.4545 32.7839 10.4374 32.754L10.3875 32.6667C9.76403 31.6317 8.23033 31.6005 7.61312 31.7502C6.91683 31.9699 6.30235 32.3933 5.84896 32.9656C5.39556 33.538 5.12404 34.2331 5.06943 34.9612C4.85745 36.5075 5.4248 37.4553 6.74652 37.8418C6.99802 37.8826 7.25234 37.9034 7.50713 37.9042C7.93155 37.9368 8.35786 37.8729 8.75403 37.7171C9.32461 37.4177 9.81189 36.9812 10.1721 36.4468C10.5323 35.9125 10.7541 35.297 10.8177 34.6557C10.9312 34.0321 10.8114 33.3885 10.481 32.8475Z" fill="#3E4448" />
                <path d="M8.80421 34.4937C8.66706 35.5162 9.16582 36.4951 8.51119 36.9877C8.01811 37.1118 7.50537 37.1372 7.00244 37.0625C6.04232 36.7944 5.57473 36.1709 5.75553 34.8553C5.78743 34.2795 5.99178 33.7266 6.34201 33.2685C6.69224 32.8104 7.17217 32.4682 7.71941 32.2865C8.22441 32.1618 9.46508 32.2366 9.85162 32.991C10.0511 33.4088 8.89773 33.7766 8.80421 34.4937Z" fill="#C37332" />
                <path d="M9.84502 33.0097C9.70894 32.8157 9.50252 32.6823 9.26967 32.6381C9.03682 32.5938 8.79589 32.6422 8.59812 32.7728C8.10036 33.1057 7.69515 33.5595 7.42039 34.0916C7.14563 34.6237 7.01029 35.2169 7.02702 35.8155C7.01997 36.1038 7.11304 36.3856 7.29036 36.6129C7.46769 36.8403 7.71832 36.9992 7.9996 37.0625C7.9996 37.0625 7.05196 36.5575 7.53825 35.0174C8.02454 33.4774 8.58565 32.567 9.84502 33.0097Z" fill="#F99D42" />
                <path d="M10.1445 34.5248C9.98863 35.6908 9.22801 36.8068 8.44246 37.0188C7.6569 37.2308 7.15191 36.4826 7.30777 35.3229C7.46363 34.1632 8.22425 33.0408 9.00357 32.8288C9.78289 32.6169 10.3066 33.3651 10.1445 34.5248Z" fill="#C37332" />
                <path d="M9.58351 34.6995C9.55563 35.0062 9.44687 35.2999 9.26833 35.5508C9.08979 35.8016 8.84787 36.0006 8.56728 36.1273C8.09969 36.252 7.78797 35.8156 7.87525 35.1547C7.90496 34.8477 8.01515 34.5541 8.19468 34.3034C8.37421 34.0527 8.61672 33.8538 8.89771 33.7268C9.3653 33.6021 9.67079 34.0386 9.58351 34.6995Z" fill="#3E4448" />
                <path d="M9.47711 34.7556C9.4572 34.9826 9.37978 35.2007 9.25215 35.3895C9.12452 35.5782 8.9509 35.7313 8.74767 35.8343C8.41101 35.9278 8.1928 35.5973 8.26138 35.0985C8.28115 34.8723 8.35859 34.655 8.48629 34.4672C8.614 34.2795 8.7877 34.1276 8.99082 34.0261C9.32748 33.9326 9.52075 34.263 9.47711 34.7556Z" fill="#75888C" />
                <path d="M9.384 34.4754C9.40156 34.5904 9.3896 34.7079 9.34925 34.817C9.3089 34.926 9.24148 35.0231 9.15332 35.0989C8.99123 35.1987 8.82289 35.0989 8.78548 34.8121C8.76534 34.6976 8.77546 34.5799 8.81482 34.4705C8.85419 34.3611 8.92145 34.2639 9.00993 34.1886C9.17203 34.0888 9.34036 34.2135 9.384 34.4754Z" fill="#899EA2" />
                <path d="M9.35247 34.4374C9.36725 34.5092 9.36229 34.5836 9.33814 34.6528C9.31399 34.722 9.27154 34.7833 9.21531 34.8302C9.11556 34.8926 9.01581 34.8302 8.99088 34.6619C8.97678 34.5901 8.98205 34.5159 9.00616 34.4469C9.03027 34.3778 9.07233 34.3165 9.12803 34.2691C9.22778 34.2005 9.32753 34.2753 9.35247 34.4374Z" fill="#C5D9DB" />
                <path d="M8.59216 36.9754C8.59216 36.9754 8.06845 37.2934 7.40759 36.645C6.74673 35.9965 7.23926 34.5063 7.23926 34.5063C6.973 35.0761 6.86943 35.7083 6.94 36.3332C7.00139 36.6015 7.14167 36.8452 7.34279 37.033C7.54391 37.2208 7.79665 37.3441 8.06845 37.387L8.59216 36.9754Z" fill="#3E4448" />
                <path d="M7.56979 37.0873H7.39522C7.14907 36.9338 6.9471 36.7189 6.80918 36.4638C6.70895 36.2884 6.65129 36.0919 6.64084 35.8901C6.58977 36.1096 6.58977 36.3378 6.64084 36.5573C6.6755 36.8028 6.80262 37.0259 6.99621 37.1808C7.18949 37.1641 7.38123 37.1329 7.56979 37.0873Z" fill="#3E4448" />
                <path d="M6.85867 37.2991V37.0185C6.74854 36.9253 6.64636 36.8231 6.55318 36.713C6.45966 36.5758 6.41602 36.5571 6.41602 36.5571C6.4697 36.6742 6.50744 36.7979 6.52824 36.925C6.5033 37.0622 6.85867 37.2991 6.85867 37.2991Z" fill="#3E4448" />
                <path d="M27.1584 30.0731C27.1546 29.8699 27.0861 29.6733 26.9627 29.5118C26.8393 29.3503 26.6676 29.2324 26.4726 29.1753H26.3791L17.0647 29.2252C16.8951 29.205 16.7233 29.2198 16.5597 29.2688L6.58444 31.0521L6.41611 31.0957C6.21181 31.1983 6.04617 31.3643 5.94392 31.5688C5.84168 31.7733 5.8083 32.0054 5.84877 32.2305C5.84877 32.2305 6.06075 35.055 7.05827 35.4166L15.7492 38.5342C15.8733 38.5786 16.004 38.6018 16.1357 38.6027C16.3204 38.6024 16.5021 38.5575 16.6657 38.4718L26.111 33.6583C26.9776 33.1907 27.2083 30.5096 27.1584 30.0731Z" fill="#3E4448" />
                <path d="M16.7593 29.9916L6.74667 31.7873C6.42871 31.9183 7.02723 34.5245 7.37013 34.6368L16.0548 37.7543C16.1018 37.7757 16.1528 37.7867 16.2045 37.7867C16.2561 37.7867 16.3071 37.7757 16.3541 37.7543L25.7994 32.9408C26.1111 32.7849 26.6348 30.0477 26.2982 29.9604L17.0025 29.9729C16.9215 29.9528 16.8362 29.9593 16.7593 29.9916Z" fill="#899EA2" />
                <path d="M16.7717 27.4728L6.95232 31.5817C6.87941 31.6109 6.81691 31.6612 6.77288 31.7262C6.72885 31.7912 6.70532 31.868 6.70532 31.9465C6.70532 32.025 6.72885 32.1017 6.77288 32.1667C6.81691 32.2318 6.87941 32.2821 6.95232 32.3112L15.9986 35.541C16.047 35.5611 16.099 35.5714 16.1514 35.5714C16.2038 35.5714 16.2557 35.5611 16.3041 35.541L26.1422 30.5529C26.2137 30.5179 26.2727 30.4616 26.311 30.3917C26.3493 30.3219 26.3651 30.2419 26.3562 30.1628C26.3473 30.0836 26.3142 30.0091 26.2614 29.9495C26.2086 29.8899 26.1387 29.848 26.0612 29.8297L17.0024 27.4541C16.9253 27.4378 16.8451 27.4443 16.7717 27.4728Z" fill="#9EAEB4" />
                <path d="M26.3849 30.3164L16.3224 35.5165L16.1915 35.5601C16.1915 35.5601 16.0169 35.5975 16.0169 36.009C16.0169 36.4206 15.9421 37.917 16.3349 37.7175L25.7802 32.904C26.0233 32.7793 26.3912 31.0958 26.3849 30.3164Z" fill="#75888C" />
                <path d="M7.16431 32.3794C7.16431 32.3794 15.3378 35.4969 15.637 35.7713C15.9363 36.0456 16.0859 37.4922 16.0859 37.4922C16.1561 36.7919 16.1707 36.0872 16.1296 35.3847C16.0298 35.1602 7.16431 32.3794 7.16431 32.3794Z" fill="#C5D9DB" />
                <path d="M9.52124 30.5094L17.0027 27.847L23.8607 29.2063L17.0027 27.4542C16.9235 27.4293 16.8387 27.4293 16.7595 27.4542L9.52124 30.5094Z" fill="#C5D9DB" />
                <path d="M21.1231 35.6035C21.1121 35.5737 21.0997 35.5446 21.0857 35.5162L21.0296 35.4289C20.4061 34.3876 18.8724 34.3627 18.2614 34.5123C17.5649 34.7307 16.9498 35.1526 16.4953 35.7238C16.0408 36.2951 15.7678 36.9893 15.7115 37.7172C15.5058 39.2697 16.0731 40.2112 17.3948 40.604C17.6463 40.6448 17.9007 40.6656 18.1555 40.6664C18.5804 40.697 19.0067 40.6309 19.4024 40.4731C19.9718 40.1737 20.4582 39.7381 20.8183 39.205C21.1784 38.6719 21.4009 38.0579 21.466 37.4179C21.5775 36.7915 21.4555 36.1459 21.1231 35.6035Z" fill="#3E4448" />
                <path d="M19.4524 37.2556C19.3152 38.2782 19.814 39.2571 19.1594 39.7497C18.6664 39.8749 18.153 39.8982 17.6506 39.8182C16.6905 39.5564 16.2167 38.9329 16.4037 37.611C16.4355 37.0383 16.6393 36.4885 16.9886 36.0335C17.3379 35.5785 17.8163 35.2395 18.3614 35.0609C18.8664 34.9362 20.107 35.011 20.4936 35.7654C20.6993 36.1707 19.5459 36.5324 19.4524 37.2556Z" fill="#C37332" />
                <path d="M20.4936 35.7715C20.3575 35.5774 20.151 35.444 19.9182 35.3998C19.6853 35.3555 19.4444 35.4039 19.2466 35.5345C18.7531 35.8699 18.3524 36.3249 18.0821 36.8569C17.8117 37.389 17.6804 37.9808 17.7005 38.5772C17.6934 38.8655 17.7865 39.1473 17.9638 39.3747C18.1411 39.602 18.3918 39.7609 18.6731 39.8243C18.6731 39.8243 17.7192 39.3254 18.2055 37.7854C18.6918 36.2453 19.2342 35.335 20.4936 35.7715Z" fill="#FFC546" />
                <path d="M20.7934 37.2864C20.6375 38.4461 19.8769 39.5684 19.0976 39.7804C18.3183 39.9924 17.807 39.238 17.9567 38.0782C18.1063 36.9185 18.8794 35.8024 19.6587 35.5842C20.438 35.366 20.9493 36.1267 20.7934 37.2864Z" fill="#F99D42" />
                <path d="M20.2319 37.4617C20.2024 37.7671 20.0929 38.0593 19.9145 38.3088C19.7361 38.5584 19.4951 38.7565 19.2157 38.8833C18.7481 39.0143 18.4364 38.5778 18.5237 37.9169C18.5516 37.6102 18.6603 37.3165 18.8389 37.0656C19.0174 36.8148 19.2593 36.6158 19.5399 36.489C20.0075 36.3643 20.3192 36.8008 20.2319 37.4617Z" fill="#3E4448" />
                <path d="M20.1196 37.5175C20.1004 37.7439 20.0232 37.9615 19.8954 38.1494C19.7676 38.3372 19.5936 38.489 19.3901 38.59C19.0535 38.6835 18.8352 38.3593 18.8976 37.8605C18.9174 37.6335 18.9955 37.4154 19.1244 37.2275C19.2533 37.0396 19.4286 36.8882 19.6333 36.788C19.9699 36.6945 20.1881 37.0187 20.1196 37.5175Z" fill="#75888C" />
                <path d="M20.0262 37.2304C20.0457 37.3449 20.0353 37.4624 19.9959 37.5717C19.9566 37.6809 19.8897 37.7781 19.8017 37.8539C19.6396 37.9537 19.4713 37.8539 19.4276 37.5671C19.4105 37.4527 19.422 37.3358 19.4612 37.227C19.5004 37.1182 19.566 37.0208 19.6521 36.9436C19.8204 36.8501 19.9888 36.9748 20.0262 37.2304Z" fill="#899EA2" />
                <path d="M19.9949 37.1937C20.0098 37.2649 20.0055 37.3388 19.9825 37.4078C19.9595 37.4768 19.9186 37.5385 19.864 37.5865C19.7643 37.6489 19.6583 37.5865 19.6333 37.4182C19.6186 37.3464 19.6235 37.272 19.6477 37.2028C19.6718 37.1337 19.7143 37.0723 19.7705 37.0254C19.8702 36.963 19.97 37.0379 19.9949 37.1937Z" fill="#C5D9DB" />
                <path d="M19.2408 39.7372C19.2408 39.7372 18.7171 40.0551 18.0563 39.4067C17.3954 38.7583 17.8879 37.2681 17.8879 37.2681C17.6214 37.8378 17.5157 38.4695 17.5824 39.0949C17.6446 39.3628 17.7851 39.6061 17.9861 39.7938C18.1871 39.9815 18.4394 40.105 18.7109 40.1487L19.2408 39.7372Z" fill="#3E4448" />
                <path d="M18.2121 39.8495H18.0375C17.7928 39.6943 17.5912 39.4798 17.4515 39.226C17.355 39.049 17.2976 38.8534 17.2831 38.6523C17.2357 38.8701 17.2357 39.0955 17.2831 39.3133C17.3223 39.5587 17.4512 39.7809 17.6447 39.9368C17.8357 39.9216 18.0254 39.8924 18.2121 39.8495Z" fill="#3E4448" />
                <path d="M17.5009 40.0496V39.769C17.3892 39.6775 17.2869 39.5752 17.1954 39.4635C17.0956 39.3263 17.052 39.3076 17.052 39.3076C17.1057 39.4247 17.1434 39.5484 17.1642 39.6755C17.1518 39.8189 17.5009 40.0496 17.5009 40.0496Z" fill="#3E4448" />
                <path d="M31.1423 18.1008C31.125 17.8408 31.0268 17.5927 30.8613 17.3914C30.6958 17.1901 30.4714 17.0457 30.2196 16.9785H30.0949L17.2206 17.0409C16.9972 17.0107 16.7699 17.0277 16.5535 17.0907L3.16172 19.2169L2.89363 19.298C2.62597 19.4159 2.40525 19.6198 2.26637 19.8772C2.1275 20.1347 2.07838 20.4311 2.12678 20.7196C2.33811 22.5535 2.65872 24.3733 3.0869 26.169C4.12807 30.8391 4.38992 30.9326 5.00714 31.1571L15.5373 34.8981C15.7136 34.9599 15.8991 34.9915 16.0859 34.9917C16.3436 34.9933 16.5979 34.9334 16.8278 34.8171L28.2869 28.9748C28.7919 28.7192 29.0475 28.5882 30.1572 23.675C30.6685 21.5675 31.2296 18.9052 31.1423 18.1008Z" fill="#3E4448" />
                <path d="M16.8093 17.7524L3.34892 19.9285C2.96862 20.0906 5.01354 29.4308 5.40008 29.5679L15.9364 33.309C15.9925 33.3335 16.053 33.3462 16.1141 33.3462C16.1753 33.3462 16.2358 33.3335 16.2918 33.309L27.7509 27.4667C28.1249 27.2734 30.332 17.7774 29.9267 17.6714L17.0961 17.7337C17.001 17.7088 16.9003 17.7154 16.8093 17.7524Z" fill="#899EA2" />
                <path d="M29.9267 17.6714H29.5215L16.111 23.6882V32.1056C16.111 32.1056 16.0549 33.4212 17.2519 32.8102L27.7509 27.4605C28.125 27.2734 30.332 17.7774 29.9267 17.6714Z" fill="#75888C" />
                <path d="M39.7772 3.38087C39.2909 2.24609 38.7921 2.07774 33.1124 1.15495C33.0626 1.15495 28.0064 0.325684 27.0338 0.325684C25.4939 0.325684 20.5374 2.81972 19.4214 4.32237C18.6047 5.44469 17.1895 9.21691 16.778 10.3517L16.5037 11.0874L20.1945 12.4405L20.4626 11.7047C21.0573 9.97939 21.7633 8.29446 22.5761 6.66053C23.0063 6.14925 26.3168 4.42213 27.0774 4.25379C27.5887 4.2912 29.858 4.60919 32.2334 4.98953C30.5937 5.8375 29.5027 6.50465 28.954 7.16557C27.8754 8.46247 26.1485 11.898 25.8368 12.5714L25.4876 13.276L29.0039 15.028L29.353 14.3234C30.1143 12.724 30.9873 11.1801 31.9653 9.70325C32.3643 9.29173 35.2447 7.87014 36.1923 7.40874C39.1974 5.91855 40.5752 5.23893 39.7772 3.38087Z" fill="#3E4448" />
                <path d="M28.6234 13.9738L26.5161 12.9201C26.7156 12.5148 28.5174 8.91717 29.5585 7.67015C30.2194 6.87829 32.0523 5.94303 34.7394 4.61496C31.8217 4.09745 27.5947 3.47394 27.0273 3.46147C26.2667 3.56123 22.4948 5.48787 21.9586 6.17373C21.091 7.87064 20.3451 9.62713 19.7267 11.4299L17.5134 10.6193C17.8002 9.83372 19.284 5.84327 20.0571 4.78331C21.0048 3.48017 25.7492 1.11084 27.0336 1.11084C27.7006 1.11084 31.0424 1.60965 32.9875 1.92764C36.7282 2.55115 38.0562 2.81925 38.5986 3.12477C38.8195 3.2447 38.985 3.44599 39.06 3.68593C39.565 4.86436 38.7732 5.25717 35.8305 6.70371C34.4215 7.39581 31.7967 8.68647 31.3665 9.19774C30.3406 10.7231 29.424 12.3191 28.6234 13.9738Z" fill="#9EAEB4" />
                <path d="M20.0326 10.6135C20.5757 9.0878 21.23 7.60403 21.9903 6.1741C22.5264 5.48824 26.2983 3.5616 27.0589 3.46184C27.6263 3.46184 31.8533 4.08535 34.7711 4.61533L36.8908 3.52419L35.8434 3.60525C35.2885 3.65513 27.9255 2.55775 27.3021 2.2647C27.1275 2.17177 26.989 2.02304 26.9088 1.84222C26.8285 1.66141 26.8112 1.45893 26.8594 1.26709L26.6849 1.72849C26.5983 2.07774 26.5317 2.43163 26.4854 2.78845C25.2067 3.34633 23.9581 3.97069 22.7446 4.65898C22.0989 5.00766 21.5748 5.54488 21.2421 6.19904C20.6187 7.09689 19.4528 7.44606 19.459 5.97458C18.9416 7.05948 18.3618 8.53096 17.969 9.55352C18.6315 9.95424 19.321 10.3084 20.0326 10.6135Z" fill="#75888C" />
                <path d="M38.6614 4.55887C38.1377 5.00156 32.0029 7.89464 31.1799 8.41839C30.357 8.94213 30.4754 9.82752 29.3594 9.95845C29.165 9.99579 28.964 9.97624 28.7804 9.90214C28.5968 9.82804 28.4385 9.70254 28.3245 9.5407C27.5764 10.8251 26.8407 12.2592 26.5913 12.7642L27.4891 12.97C28.0293 13.0669 28.5824 13.0669 29.1225 12.97C29.7734 11.6485 30.5215 10.3772 31.3607 9.1666C31.7909 8.67403 34.4156 7.38336 35.8246 6.67256C38.6988 5.2572 39.5155 4.85192 39.0853 3.73584C39.0518 4.05353 38.9005 4.34715 38.6614 4.55887Z" fill="#75888C" />
                <path d="M38.6614 4.55887C38.1377 5.00156 32.0029 7.89464 31.1799 8.41839C30.357 8.94213 30.4754 9.82752 29.3594 9.95845C29.165 9.99579 28.964 9.97624 28.7804 9.90214C28.5968 9.82804 28.4385 9.70254 28.3245 9.5407C27.5764 10.8251 26.8407 12.2592 26.5913 12.7642L27.4891 12.97C28.0293 13.0669 28.5824 13.0669 29.1225 12.97C29.7734 11.6485 30.5215 10.3772 31.3607 9.1666C31.7909 8.67403 34.4156 7.38336 35.8246 6.67256C38.6988 5.2572 39.5155 4.85192 39.0853 3.73584C39.0518 4.05353 38.9005 4.34715 38.6614 4.55887Z" fill="#75888C" />
                <path d="M33 12.8209V12.7835C32.9832 12.6778 32.9581 12.5736 32.9252 12.4717L32.8753 12.3283L32.7693 12.1163L32.707 12.0415C32.4663 11.6806 32.0994 11.4226 31.6783 11.3182L17.5883 7.70813C17.2135 7.61006 16.8168 7.63856 16.4598 7.78918L1.19144 14.1739C0.882648 14.3033 0.618311 14.52 0.430826 14.7974C0.268866 14.9927 0.148315 15.2188 0.0765044 15.4622C0.00469427 15.7055 -0.0168725 15.9609 0.0131136 16.2128C0.0131136 16.2564 0.337309 20.5773 1.88347 21.126L15.3875 25.9457C15.5763 26.01 15.7741 26.0437 15.9735 26.0455C16.2512 26.0467 16.5251 25.9803 16.7715 25.8522L31.4601 18.3701C32.7319 17.7092 33.106 13.5566 33 12.8209Z" fill="#3E4448" />
                <path d="M16.8906 12.4586L1.30431 15.2457C0.811779 15.4515 1.74072 19.5043 2.23949 19.6789L15.7559 24.4986C15.8307 24.5261 15.9105 24.5375 15.9899 24.5321C16.0694 24.5268 16.1469 24.5047 16.2173 24.4674L30.9059 16.9853C31.3797 16.7421 32.1964 12.4898 31.6789 12.3589L17.2522 12.4337C17.1319 12.406 17.006 12.4147 16.8906 12.4586Z" fill="#899EA2" />
                <path d="M16.9089 8.54936L1.64681 14.9341C1.5397 14.9844 1.44913 15.0642 1.3857 15.1642C1.32226 15.2641 1.28857 15.38 1.28857 15.4984C1.28857 15.6167 1.32226 15.7326 1.3857 15.8326C1.44913 15.9325 1.5397 16.0123 1.64681 16.0626L15.7057 21.0507C15.8575 21.1131 16.0277 21.1131 16.1795 21.0507L31.504 13.2381C31.6069 13.177 31.69 13.0874 31.7434 12.9802C31.7968 12.873 31.8182 12.7527 31.8051 12.6337C31.7919 12.5147 31.7448 12.402 31.6693 12.309C31.5938 12.2161 31.4931 12.1468 31.3793 12.1096L17.2892 8.49948C17.1605 8.47197 17.0262 8.48958 16.9089 8.54936Z" fill="#9EAEB4" />
                <path d="M16.7781 10.5076L7.14578 14.5417C7.0743 14.5705 7.01307 14.62 6.96996 14.6839C6.92684 14.7478 6.90381 14.8231 6.90381 14.9002C6.90381 14.9773 6.92684 15.0526 6.96996 15.1165C7.01307 15.1804 7.0743 15.2299 7.14578 15.2587L16.0175 18.4261C16.0659 18.4462 16.1178 18.4565 16.1703 18.4565C16.2227 18.4565 16.2746 18.4462 16.323 18.4261L25.9741 13.5067C26.0442 13.4724 26.1021 13.4174 26.1399 13.3492C26.1777 13.2809 26.1936 13.2027 26.1854 13.1251C26.1772 13.0475 26.1454 12.9743 26.0942 12.9154C26.043 12.8565 25.975 12.8148 25.8992 12.7959L17.0026 10.4951C16.9283 10.4753 16.8497 10.4797 16.7781 10.5076Z" fill="#899EA2" />
                <path d="M15.132 14.5721C14.8387 14.6701 14.5816 14.8537 14.3938 15.0994C14.2059 15.345 14.0961 15.6413 14.0783 15.95L14.0098 17.7021L15.718 18.3256C15.8953 18.086 15.9993 17.8001 16.0173 17.5026L16.0983 15.4387C16.122 15.3106 16.1123 15.1785 16.0702 15.0552C16.0282 14.9319 15.9552 14.8214 15.8582 14.7344C15.7612 14.6474 15.6434 14.5868 15.5163 14.5584C15.3891 14.5299 15.2568 14.5347 15.132 14.5721Z" fill="#C5D9DB" />
                <path d="M15.132 14.5723C14.8392 14.671 14.5825 14.8549 14.3948 15.1003C14.2071 15.3458 14.0969 15.6417 14.0783 15.9502L14.0098 17.7023L14.8265 17.9953C14.9743 17.876 15.096 17.7275 15.1839 17.5591C15.2719 17.3907 15.3242 17.2059 15.3377 17.0164L15.4063 15.2269C15.4195 15.1035 15.4013 14.9788 15.3533 14.8643C15.3053 14.7499 15.2292 14.6494 15.132 14.5723Z" fill="#75888C" />
                <path d="M12.445 15.814C12.2177 15.8898 12.0113 16.0179 11.8424 16.1878C11.6735 16.3578 11.5468 16.5651 11.4724 16.7929L13.3802 17.4725V16.6682C13.3993 16.5443 13.3875 16.4176 13.3458 16.2994C13.3042 16.1811 13.234 16.075 13.1414 15.9905C13.0489 15.906 12.9369 15.8456 12.8154 15.8148C12.6939 15.784 12.5666 15.7837 12.445 15.814Z" fill="#C5D9DB" />
                <path d="M12.4451 15.813C12.2168 15.8876 12.0098 16.016 11.8416 16.1875C11.6734 16.359 11.5489 16.5684 11.4788 16.7981L12.7257 17.2284V16.4677C12.7364 16.3439 12.7165 16.2193 12.6675 16.1051C12.6186 15.9909 12.5422 15.8906 12.4451 15.813Z" fill="#75888C" />
                <path d="M25.9924 13.4813C26.0625 13.447 26.1204 13.3921 26.1582 13.3238C26.196 13.2555 26.2119 13.1773 26.2038 13.0997C26.1956 13.0221 26.1638 12.9489 26.1126 12.89C26.0614 12.8311 25.9933 12.7894 25.9176 12.7705L17.0022 10.4947C16.9236 10.4666 16.8377 10.4666 16.7591 10.4947L15.7927 10.9C15.7927 10.9 16.7778 10.6194 16.7778 11.5235V18.1701L25.9924 13.4813Z" fill="#75888C" />
                <path d="M31.853 12.9702L16.2106 21.0758L16.0048 21.1444C16.0048 21.1444 15.7367 21.2005 15.7367 21.8427C15.7367 22.485 15.6245 24.7982 16.2293 24.4927L30.9178 17.0105C31.2857 16.7923 31.8592 14.1798 31.853 12.9702Z" fill="#75888C" />
                <path d="M1.98315 16.1748C1.98315 16.1748 14.6767 21.0319 15.1318 21.4497C15.5869 21.8674 15.83 24.1183 15.83 24.1183C15.83 24.1183 16.0607 21.1878 15.9049 20.8386C15.749 20.4895 1.98315 16.1748 1.98315 16.1748Z" fill="#C5D9DB" />
                <path d="M5.64282 13.2388L17.2889 9.09867L27.8876 11.2124L17.2889 8.49387C17.1658 8.45061 17.0317 8.45061 16.9086 8.49387L5.64282 13.2388Z" fill="#C5D9DB" />
                <path d="M7.13356 29.4491C6.57245 29.4491 5.99887 28.8256 5.88665 28.0649L5.40659 25.521C5.2632 24.7666 5.59986 24.1431 6.15473 24.1431C6.71584 24.1431 7.28942 24.7666 7.40164 25.521L7.87547 28.0649C8.0251 28.8256 7.68843 29.4491 7.13356 29.4491Z" fill="#75888C" />
                <path d="M7.91296 28.2712C7.91861 28.1944 7.91861 28.1173 7.91296 28.0405L7.43914 25.4966C7.29574 24.7422 6.72216 24.1249 6.19223 24.1187C6.03369 24.3918 5.98467 24.7149 6.05507 25.0227L6.46654 27.23C6.59123 27.8535 7.09 28.4271 7.57629 28.4271C7.70173 28.4105 7.81915 28.3561 7.91296 28.2712Z" fill="#3E4448" />
                <path d="M10.1448 30.3041C9.58365 30.3041 9.01631 29.6806 8.89785 28.9199L8.4178 26.376C8.2744 25.6216 8.61107 24.998 9.17217 24.998C9.72704 24.998 10.3006 25.6216 10.4191 26.376L10.8991 28.9199C11.055 29.6806 10.7121 30.3041 10.1448 30.3041Z" fill="#75888C" />
                <path d="M10.9363 29.1506C10.9363 29.0758 10.9363 29.001 10.9363 28.9199L10.4562 26.376C10.3128 25.6216 9.73925 25.0043 9.20932 24.998C9.05078 25.2712 9.00176 25.5943 9.07216 25.9021L9.48364 28.1094C9.60833 28.764 10.1071 29.3065 10.5934 29.3065C10.721 29.2911 10.8408 29.2367 10.9363 29.1506Z" fill="#3E4448" />
                <path d="M13.4425 31.433C12.8876 31.433 12.314 30.8095 12.1956 30.0488L11.7155 27.5111C11.5721 26.7505 11.915 26.127 12.4699 26.127C13.031 26.127 13.5983 26.7505 13.7168 27.5111L14.1969 30.0738C14.3402 30.8095 14.0036 31.433 13.4425 31.433Z" fill="#75888C" />
                <path d="M14.222 30.2795C14.2309 30.2029 14.2309 30.1255 14.222 30.0488L13.742 27.5111C13.5986 26.7505 13.0312 26.1332 12.4951 26.127C12.3344 26.3992 12.2831 26.7224 12.3517 27.031L12.7694 29.2383C12.8941 29.8992 13.3928 30.4354 13.8729 30.4354C14.0041 30.4264 14.1278 30.3712 14.222 30.2795Z" fill="#3E4448" />
                <path d="M19.7583 15.0713C19.7583 14.3169 19.3094 13.6934 18.7545 13.6934C18.1996 13.6934 17.7383 14.3169 17.7321 15.0713V17.6152C17.729 17.6442 17.729 17.6735 17.7321 17.7025L19.7583 16.6675V15.0713Z" fill="#9EAEB4" />
                <path d="M19.7583 15.0713C19.7583 14.3169 19.3094 13.6934 18.7545 13.6934C18.5479 13.9489 18.4376 14.2689 18.4428 14.5974V16.8047C18.4439 16.9741 18.4712 17.1424 18.5239 17.3035L19.7708 16.68L19.7583 15.0713Z" fill="#3E4448" />
                <path d="M22.4761 15.2768C22.418 15.0854 22.3037 14.9159 22.1481 14.7902C21.9924 14.6646 21.8026 14.5887 21.6033 14.5723C21.0484 14.5723 20.587 15.1958 20.5808 15.9502V16.2433L22.4761 15.2768Z" fill="#9EAEB4" />
                <path d="M22.4766 15.2768C22.4189 15.0863 22.3056 14.9174 22.1512 14.7919C21.9967 14.6663 21.8083 14.5898 21.61 14.5723C21.4012 14.827 21.2886 15.147 21.2921 15.4764V15.8816L22.4766 15.2768Z" fill="#3E4448" />
                <path d="M24.0911 28.1087C24.39 27.9975 24.6517 27.8048 24.8467 27.5524C25.0418 27.3001 25.1623 26.9982 25.1946 26.6809L25.5562 24.3365C25.6622 23.6319 25.3442 23.1331 24.8517 23.2142C24.5528 23.3255 24.2911 23.5182 24.0961 23.7705C23.901 24.0228 23.7805 24.3247 23.7482 24.642L23.3866 26.9927C23.2806 27.691 23.5986 28.2023 24.0911 28.1087Z" fill="#899EA2" />
                <path d="M23.3682 27.1981C23.3682 27.1295 23.3682 27.0609 23.3682 26.9923L23.7298 24.6417C23.7639 24.3232 23.8865 24.0206 24.0837 23.7683C24.281 23.5159 24.5449 23.3239 24.8457 23.2139C24.9219 23.3282 24.9743 23.4566 25 23.5915C25.0257 23.7265 25.0241 23.8652 24.9954 23.9995L24.6774 26.0384C24.6509 26.3146 24.5475 26.5779 24.3789 26.7984C24.2103 27.0188 23.9832 27.1875 23.7235 27.2854C23.6615 27.2958 23.5979 27.2935 23.5368 27.2785C23.4757 27.2635 23.4183 27.2361 23.3682 27.1981Z" fill="#3E4448" />
                <path d="M26.6536 26.9556C26.9521 26.8429 27.2132 26.6489 27.4071 26.3954C27.6011 26.142 27.7201 25.8392 27.7508 25.5216L28.1124 23.1772C28.2247 22.4788 27.9067 21.9738 27.4079 22.0611C27.1094 22.172 26.8482 22.3648 26.6541 22.6173C26.4601 22.8698 26.341 23.1719 26.3107 23.4889L25.9491 25.8333C25.8368 26.5503 26.1548 27.0491 26.6536 26.9556Z" fill="#899EA2" />
                <path d="M25.9305 26.0584C25.9245 25.9879 25.9245 25.917 25.9305 25.8464L26.2921 23.5021C26.3225 23.185 26.4416 22.883 26.6356 22.6305C26.8297 22.3779 27.0909 22.1852 27.3894 22.0742C27.4661 22.1882 27.5185 22.3169 27.5431 22.4521C27.5678 22.5872 27.5643 22.7261 27.5328 22.8598L27.2211 24.8925C27.196 25.1692 27.0931 25.4332 26.9243 25.6539C26.7555 25.8745 26.5277 26.0429 26.2672 26.1395C26.1487 26.1572 26.028 26.1282 25.9305 26.0584Z" fill="#3E4448" />
                <path d="M21.4225 29.3561C21.7214 29.2458 21.983 29.0532 22.1772 28.8006C22.3713 28.5479 22.4901 28.2455 22.5198 27.9283L22.8814 25.5839C22.9936 24.8856 22.6757 24.3805 22.1769 24.4678C21.878 24.5781 21.6164 24.7707 21.4222 25.0234C21.2281 25.276 21.1093 25.5784 21.0796 25.8957L20.7429 28.24C20.6058 28.9384 20.9237 29.4497 21.4225 29.3561Z" fill="#899EA2" />
                <path d="M20.6991 28.4519C20.6931 28.3813 20.6931 28.3104 20.6991 28.2399L21.0607 25.8955C21.0915 25.5752 21.2128 25.2703 21.4104 25.0164C21.608 24.7624 21.8738 24.57 22.1767 24.4614C22.2534 24.5754 22.3057 24.7041 22.3304 24.8393C22.3551 24.9744 22.3516 25.1133 22.3201 25.247L22.0083 27.2797C21.9833 27.5564 21.8804 27.8204 21.7116 28.0411C21.5428 28.2617 21.315 28.4301 21.0545 28.5267C20.9933 28.5389 20.9302 28.5386 20.8691 28.5257C20.808 28.5129 20.7502 28.4877 20.6991 28.4519Z" fill="#3E4448" />
                <path d="M18.5174 30.8708C18.8154 30.76 19.0765 30.5682 19.2715 30.3171C19.4664 30.0659 19.5874 29.7654 19.6209 29.4492L19.9825 27.1048C20.0885 26.4002 19.7767 25.8952 19.278 25.9825C18.9795 26.0934 18.7183 26.2862 18.5242 26.5387C18.3301 26.7912 18.2111 27.0933 18.1807 27.4103L17.8129 29.7609C17.7069 30.453 18.0248 30.9581 18.5174 30.8708Z" fill="#899EA2" />
                <path d="M17.8005 29.9608C17.8005 29.8922 17.8005 29.8236 17.8005 29.755L18.1684 27.4044C18.1988 27.0874 18.3178 26.7853 18.5119 26.5328C18.7059 26.2803 18.9672 26.0875 19.2657 25.9766C19.414 26.2097 19.4655 26.4916 19.4091 26.7622L19.1036 28.826C19.0771 29.1023 18.9736 29.3656 18.805 29.586C18.6364 29.8064 18.4094 29.9752 18.1497 30.073C18.0869 30.0788 18.0236 30.0718 17.9636 30.0526C17.9036 30.0333 17.8482 30.002 17.8005 29.9608Z" fill="#3E4448" />
                <path d="M21.7963 4.29052C21.9584 4.53369 21.7402 4.97015 21.3038 5.25696C20.8674 5.54377 20.3873 5.59365 20.2252 5.35048C20.0631 5.10732 20.2751 4.67086 20.7115 4.37781C21.1479 4.08476 21.628 4.04735 21.7963 4.29052Z" fill="#C5D9DB" />
                <path d="M31.4416 7.28369C31.6037 7.52685 31.3855 7.95707 30.9553 8.25012C30.5251 8.54317 30.0326 8.58682 29.8705 8.34365C29.7084 8.10048 29.9266 7.66403 30.3568 7.37098C30.7869 7.07793 31.2795 7.04052 31.4416 7.28369Z" fill="#C5D9DB" />
                <path d="M38.5988 3.12466C38.0564 2.81914 36.7284 2.53856 32.9877 1.92752C31.0425 1.60953 27.7008 1.10449 27.0337 1.10449H26.8467C26.803 1.3726 26.7843 1.728 26.7469 2.17069C26.7041 2.38662 26.7069 2.60912 26.7553 2.82389C26.8036 3.03866 26.8963 3.24093 27.0275 3.41771C27.5948 3.41771 31.7844 4.04122 34.696 4.56496C35.3962 4.16317 36.1185 3.80097 36.8593 3.48006C37.4875 3.25294 38.1605 3.17814 38.8232 3.26183C38.7538 3.20783 38.6785 3.16182 38.5988 3.12466Z" fill="#C72828" />
                <path d="M28.7296 1.67199C28.7296 1.87151 28.4241 2.00868 28.0688 1.98374C27.7134 1.9588 27.4453 1.78422 27.4453 1.5847C27.4453 1.38518 27.7508 1.248 28.1062 1.27294C28.4615 1.29788 28.7421 1.47247 28.7296 1.67199Z" fill="#F2623B" />
                <path d="M27.2706 2.26466C27.1202 2.19279 26.9954 2.07661 26.9129 1.93171C26.8304 1.78682 26.7943 1.62015 26.8093 1.4541C26.8093 1.66609 26.7719 1.90303 26.7469 2.18984C26.7041 2.40577 26.7069 2.62827 26.7553 2.84304C26.8036 3.05781 26.8963 3.26008 27.0275 3.43686L27.4016 3.46803H27.5761H27.7008C28.237 3.53662 29.035 3.64262 29.9453 3.77979H29.9827L30.5188 3.86084C31.853 4.06037 33.3493 4.30354 34.6087 4.52176H34.6648C35.3651 4.11997 36.0873 3.75777 36.8282 3.43686L35.7808 3.51791C35.2571 3.65509 27.8941 2.55771 27.2706 2.26466Z" fill="#9D1D21" />
                <path d="M30.7747 31.2074C30.7677 31.1743 30.7551 31.1426 30.7373 31.1139L30.6812 31.0266C30.0577 29.9916 28.524 29.9604 27.913 30.11C27.2156 30.3287 26.5998 30.7517 26.1452 31.3241C25.6906 31.8965 25.4182 32.5922 25.3631 33.3211C25.1574 34.8674 25.7247 35.8151 27.0465 36.2079C27.2987 36.2409 27.5527 36.2597 27.8071 36.264C28.2315 36.2967 28.6578 36.2327 29.054 36.077C29.6239 35.7767 30.1105 35.3399 30.4706 34.8057C30.8307 34.2716 31.053 33.6565 31.1176 33.0156C31.2293 32.3912 31.1073 31.7475 30.7747 31.2074Z" fill="#3E4448" />
                <path d="M29.1035 32.8544C28.9664 33.877 29.4651 34.8559 28.8105 35.3485C28.3174 35.4726 27.8047 35.498 27.3018 35.4233C26.3416 35.1552 25.8678 34.5317 26.0549 33.2161C26.0959 32.6498 26.3038 32.1083 26.6522 31.66C27.0006 31.2117 27.4739 30.8767 28.0125 30.6971C28.5175 30.5724 29.7582 30.6472 30.1447 31.4017C30.3505 31.7695 29.1971 32.1374 29.1035 32.8544Z" fill="#C37332" />
                <path d="M30.145 31.3701C30.009 31.176 29.8025 31.0427 29.5697 30.9984C29.3368 30.9542 29.0959 31.0025 28.8981 31.1331C28.405 31.469 28.0047 31.924 27.7344 32.4559C27.4641 32.9879 27.3325 33.5795 27.352 34.1759C27.3449 34.4641 27.438 34.7459 27.6153 34.9733C27.7926 35.2007 28.0433 35.3595 28.3246 35.4229C28.3246 35.4229 27.3769 34.9178 27.857 33.3778C28.337 31.8377 28.8857 30.9336 30.145 31.3701Z" fill="#FFC546" />
                <path d="M30.4439 32.8856C30.288 34.0516 29.5274 35.1677 28.7481 35.3797C27.9688 35.5917 27.4576 34.8434 27.6134 33.6837C27.7693 32.524 28.5299 31.4017 29.3092 31.1897C30.0885 30.9777 30.5998 31.7259 30.4439 32.8856Z" fill="#F99D42" />
                <path d="M29.883 33.0592C29.8521 33.3675 29.74 33.662 29.5582 33.9129C29.3764 34.1637 29.1314 34.3618 28.848 34.4871C28.3805 34.6118 28.0687 34.1753 28.156 33.5144C28.1839 33.2077 28.2927 32.914 28.4712 32.6631C28.6497 32.4123 28.8917 32.2133 29.1722 32.0865C29.6585 31.9431 29.9703 32.3983 29.883 33.0592Z" fill="#3E4448" />
                <path d="M29.7769 33.115C29.757 33.342 29.6796 33.5601 29.552 33.7488C29.4243 33.9376 29.2507 34.0907 29.0475 34.1936C28.7108 34.2872 28.4926 33.9567 28.5612 33.4579C28.581 33.2317 28.6584 33.0143 28.7861 32.8266C28.9138 32.6388 29.0875 32.487 29.2906 32.3855C29.6211 32.2919 29.8455 32.6224 29.7769 33.115Z" fill="#75888C" />
                <path d="M29.6767 32.8346C29.6968 32.9491 29.6867 33.0668 29.6474 33.1762C29.608 33.2855 29.5407 33.3827 29.4523 33.4581C29.2902 33.5578 29.1218 33.4581 29.0782 33.1713C29.0606 33.0563 29.0726 32.9388 29.1129 32.8297C29.1533 32.7206 29.2207 32.6236 29.3089 32.5478C29.471 32.448 29.6393 32.5665 29.6767 32.8346Z" fill="#899EA2" />
                <path d="M29.6458 32.7917C29.6611 32.8639 29.6571 32.9388 29.6341 33.0089C29.6111 33.079 29.57 33.1418 29.5149 33.1908C29.4151 33.2469 29.3091 33.1908 29.2842 33.0162C29.272 32.9445 29.2781 32.8708 29.3021 32.8021C29.3261 32.7334 29.3671 32.6719 29.4213 32.6234C29.5211 32.5673 29.6209 32.6359 29.6458 32.7917Z" fill="#C5D9DB" />
                <path d="M28.8912 35.3353C28.8912 35.3353 28.3675 35.6533 27.7067 35.0048C27.0458 34.3564 27.5383 32.8662 27.5383 32.8662C27.2721 33.4359 27.1685 34.0682 27.2391 34.6931C27.2993 34.9609 27.4384 35.2044 27.6384 35.3922C27.8385 35.5801 28.0903 35.7036 28.3613 35.7468L28.8912 35.3353Z" fill="#3E4448" />
                <path d="M27.8628 35.4476H27.6882C27.4435 35.2925 27.2419 35.078 27.1022 34.8241C27.0057 34.6472 26.9483 34.4515 26.9339 34.2505C26.8863 34.4703 26.8863 34.6978 26.9339 34.9176C26.9725 35.1633 27.1014 35.3856 27.2955 35.5412C27.4866 35.5239 27.6762 35.4926 27.8628 35.4476Z" fill="#3E4448" />
                <path d="M27.1519 35.6844V35.4038C27.0402 35.3123 26.9379 35.21 26.8464 35.0983C26.8076 35.0406 26.7615 34.9882 26.7092 34.9424C26.7599 35.0601 26.7955 35.1837 26.8152 35.3103C26.8027 35.4225 27.1519 35.6844 27.1519 35.6844Z" fill="#3E4448" />
              </svg>


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
};

const revivePrices = [50, 169, 420];

const Reviving = ({ setGameState, abstractClient }: RevivingProps) => {
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
      const tx = await abstractClient!.writeContract({
        abi: parseAbi([
          "function transfer(address to, uint256 value) external returns (bool)",
        ]),
        address: NootToken.address as `0x${string}`,
        functionName: "transfer",
        args: [nootTreasury, parseEther(currentPrice + "")],
      });
      console.log(tx);

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
