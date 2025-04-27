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
        <div className="absolute left-1/2 -translate-x-1/2 p-2 z-10 text-md text-white justify-between flex font-bold text-shadow-md" style={{
          width: dimensions.width,
          height: dimensions.height,
        }}>
          <div>
            {/* left side */}
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
    <div className="h-full w-full flex flex-col items-center px-[16px]"
      style={{ backgroundImage: "url('/hero2.svg')" }}>

      <div className="w-full px-[26px] mt-[9px]">
        <img src="/hero.webp" alt="hero" className="w-full " />
      </div>

      <div className="flex flex-col items-center gap-4 mt-15">
        <div className="flex items-center gap-4">
          <div className="relative">
            <svg className="absoute" width="299" height="46" viewBox="0 0 299 46" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_dii_8_3374)">
                <path d="M298.996 13.6444C298.996 14.7835 298.996 15.9156 298.996 17.0547C298.996 17.5964 298.996 18.1451 298.996 18.6938V19.5689C298.996 21.1178 298.689 22.6666 298.383 24.2085C298.383 24.9795 298.128 25.7435 297.873 26.5144C297.996 26.96 297.599 27.4054 296.698 27.8341C295.789 28.3489 295.259 28.8747 295.116 29.4038C295.091 29.5687 294.659 29.7277 293.891 29.8552C292.993 29.9468 291.899 29.9957 290.777 29.9941L285.212 30.0705C266.498 30.4116 298.32 31.2071 279.5 31L289.296 31.4944C290.44 31.5062 291.537 31.5616 292.461 31.6541C293.005 31.74 293.402 31.8412 293.623 31.9506C293.844 32.0599 293.883 32.1745 293.738 32.2861C293.592 32.6258 293.319 32.9643 292.921 33.3002C292.257 33.9947 291.338 34.6337 291.134 35.3213C291.134 35.4602 291.134 35.5992 291.134 35.7381C290.245 36.17 288.677 36.5705 286.539 36.9118C282.425 37.6936 277.084 38.341 270.903 38.8071C264.722 39.2732 257.856 39.5463 250.803 39.6067C183.846 40.1446 116.71 40.1307 49.7644 39.565C39.6575 39.4842 30.0102 38.963 22.2481 38.0787C17.4662 37.5407 13.5552 36.8739 10.7616 36.1201C9.58745 35.7797 9.28109 35.4255 8.15797 35.0505C7.88443 34.9771 7.6622 34.9003 7.49428 34.8213C7.22498 34.7111 7.19754 34.5927 7.41514 34.4804C7.63273 34.3682 8.08589 34.267 8.71946 34.1892C10.4191 34.0475 12.3958 33.9797 14.386 33.9947C36.5933 33.8906 -8.26869 33.6544 13.7343 33.5711C6.74031 33.5711 20.6773 33.5711 13.7343 33.5711C11.2328 33.5224 16.1337 33.6058 13.7343 33.5711C2.29887 33.3835 25.2208 33.6336 13.7343 33.5711C-0.151907 33.5369 28.7592 33.2573 15 33C12.3532 32.9455 12.4692 32.5435 9.99573 32.4042C8.2567 32.3009 6.75689 32.1353 5.65652 31.925C5.64091 31.9065 5.64091 31.8879 5.65652 31.8694C4.07344 31.5007 3.47804 31.0687 3.97175 30.647C4.3551 30.204 4.3551 29.7565 3.97175 29.3135L3.05286 26.9103C3.05286 26.4728 2.69532 26.0352 2.54217 25.5976C2.23795 25.3578 2.58253 25.111 3.51215 24.9031C4.57087 24.7685 5.907 24.6813 7.34098 24.653C11.6803 24.5072 11.1096 24.2641 15.5 24.1738C17.4568 24.1243 24.345 24.1891 26.3321 24.1738H15.5C13.9415 24.1351 7.94649 23.602 6.5243 23.507L5.60542 23.4306C4.53934 23.3171 3.67084 23.173 3.0619 23.0085C2.45296 22.844 2.1186 22.6632 2.08288 22.4791C2.08288 22.361 2.08279 22.236 1.67439 22.111C1.31703 21.8262 1.06191 21.5415 0.857706 21.2498C0.500348 20.8122 0.34717 20.3746 0.194017 19.9371C-0.16334 18.9786 -0.520747 17.7423 3.97175 16.9366C4.8982 16.8091 6.00395 16.7083 7.2232 16.6403C8.44245 16.5723 11.1823 15.9977 12.5 16C0.00950813 16.1343 24.9565 15.7916 12.5 16C1.98348 16.0625 22.9655 15.8889 12.5 16C-8.0976 16.1181 32.938 16.3677 12.5 16C9.15867 15.9541 11.6539 15.2201 8.56615 15.0405H8.31096C7.51223 14.9898 6.7586 14.9269 6.0647 14.8529C4.47005 14.6824 3.26587 14.4535 2.59327 14.1931C2.08168 13.9432 2.08168 13.679 2.59327 13.4291C2.59327 13.3249 2.59327 13.2277 2.59327 13.1305C2.59327 12.5193 2.59325 11.9011 2.89956 11.2969C2.89956 10.9843 2.89956 10.6718 2.89956 10.3592C3.20587 9.00252 3.66543 7.64815 4.27804 6.2961C4.97912 4.70763 9.99766 3.21141 18.3576 2.09843C26.7175 0.985455 37.8211 0.335277 49.5092 0.274347C116.25 -0.0914491 183.246 -0.0914491 250.497 0.274347C261.118 0.342033 271.269 0.890775 279.335 1.83335C287.401 2.77593 292.919 4.05826 295.014 5.47653C296.474 6.39003 296.63 7.33321 295.473 8.25473C295.194 8.48014 294.749 8.70119 294.146 8.91455C293.768 9.08553 293.162 9.24562 292.359 9.38684C291.712 9.42679 291.023 9.45257 290.317 9.46324C286.386 9.58826 283.482 11.408 279.5 11.4983C271.536 11.6927 287.515 11.401 279.5 11.4983C263.368 11.6927 295.683 11.4566 279.5 11.4983C284.361 11.4859 288.554 11.2075 292.921 11.4983C298.74 11.9358 299.047 12.8179 298.996 13.6444Z" fill="url(#paint0_linear_8_3374)" />
                <path d="M49.5117 0.774414C112.08 0.431489 174.872 0.409899 237.889 0.709961L250.494 0.774414C260.439 0.837794 269.965 1.32329 277.744 2.1582L279.276 2.33008C283.298 2.80009 286.675 3.35385 289.301 3.96387C291.945 4.57825 293.769 5.23733 294.733 5.89062L294.749 5.90039C295.449 6.33846 295.691 6.70077 295.731 6.94434C295.76 7.11928 295.702 7.3735 295.337 7.71289L295.162 7.86328L295.159 7.86523C294.946 8.03754 294.564 8.23656 293.979 8.44336L293.959 8.4502L293.939 8.45898C293.624 8.60148 293.079 8.75057 292.301 8.88867C291.99 8.90762 291.67 8.92426 291.342 8.93652L290.31 8.96289L290.301 8.96387C288.266 9.02863 286.5 9.5329 284.792 10.0127C283.18 10.4654 281.617 10.8972 279.846 10.9854L279.488 10.998C279.486 10.9981 279.484 10.998 279.481 10.998C277.472 11.0223 276.215 11.0405 275.523 11.0527C275.35 11.0558 275.212 11.0581 275.105 11.0605C275.052 11.0618 275.007 11.0634 274.969 11.0645C274.931 11.0655 274.9 11.0663 274.875 11.0674C274.863 11.0679 274.851 11.0687 274.84 11.0693C274.835 11.0696 274.829 11.0699 274.823 11.0703C274.818 11.0707 274.809 11.0713 274.8 11.0723C274.796 11.0727 274.787 11.0735 274.782 11.0742C274.775 11.0752 274.759 11.0782 274.749 11.0801C274.734 11.0835 274.693 11.0952 274.667 11.1045C274.608 11.1324 274.422 11.3102 274.354 11.4932C274.377 11.7355 274.578 11.9909 274.653 12.0312C274.685 12.0433 274.733 12.0577 274.751 12.0615C274.762 12.0635 274.78 12.0664 274.787 12.0674C274.793 12.0681 274.802 12.0689 274.807 12.0693C274.816 12.0702 274.824 12.071 274.83 12.0713C274.836 12.0716 274.842 12.072 274.847 12.0723C274.857 12.0727 274.869 12.073 274.88 12.0732C274.903 12.0738 274.931 12.0738 274.964 12.0742C275.03 12.075 275.119 12.0759 275.228 12.0762C275.336 12.0764 275.465 12.0763 275.611 12.0762C275.905 12.0758 276.269 12.0741 276.68 12.0723C277.502 12.0687 278.512 12.063 279.522 12.0557C280.533 12.0483 281.543 12.0396 282.363 12.0312C282.773 12.0271 283.137 12.0225 283.429 12.0186C283.574 12.0166 283.703 12.0155 283.811 12.0137C283.918 12.0118 284.007 12.0095 284.072 12.0078C284.104 12.007 284.133 12.0058 284.155 12.0049C284.166 12.0044 284.177 12.0045 284.188 12.0039C284.193 12.0036 284.199 12.0034 284.205 12.0029C284.208 12.0027 284.213 12.0022 284.216 12.002C284.219 12.0016 284.226 12.0005 284.23 12C284.235 11.9994 284.247 11.998 284.253 11.9971C284.262 11.9955 284.284 11.9914 284.297 11.9883C284.32 11.9819 284.391 11.9538 284.438 11.9287C284.439 11.9274 284.44 11.9252 284.441 11.9238C287.344 11.8616 290.07 11.809 292.883 11.9961V11.9971C295.793 12.2158 297.24 12.5423 297.945 12.877C298.286 13.0385 298.402 13.1789 298.447 13.2617C298.492 13.3439 298.508 13.4402 298.497 13.6133L298.496 13.6289V19.5693C298.496 21.0606 298.201 22.5611 297.893 24.1113L297.883 24.1592V24.209C297.883 24.8843 297.659 25.569 297.398 26.3574L297.351 26.501L297.391 26.6475C297.394 26.6603 297.416 26.7141 297.296 26.8486C297.164 26.9965 296.909 27.1804 296.483 27.3828L296.468 27.3906L296.452 27.3994C295.574 27.8967 294.912 28.4688 294.672 29.1475C294.654 29.1551 294.634 29.1657 294.609 29.1748C294.449 29.2339 294.191 29.2968 293.831 29.3574C293.175 29.424 292.409 29.4692 291.601 29.4863L290.777 29.4941H290.77L285.205 29.5703H285.203C282.863 29.613 281.305 29.6632 280.337 29.7178C279.856 29.7449 279.508 29.774 279.279 29.8057C279.171 29.8207 279.061 29.8401 278.972 29.8691C278.936 29.8808 278.847 29.9107 278.764 29.9785C278.719 30.0147 278.643 30.0883 278.6 30.209C278.55 30.3477 278.564 30.4908 278.62 30.6064C278.668 30.7059 278.736 30.7664 278.774 30.7959C278.816 30.828 278.856 30.8484 278.883 30.8613C278.936 30.8869 278.988 30.9041 279.027 30.915C279.108 30.9379 279.206 30.9566 279.306 30.9727C279.362 30.9817 279.424 30.9882 279.49 30.9971L279.475 31.499L289.271 31.9941H289.291C290.414 32.0058 291.488 32.06 292.39 32.1494C292.724 32.2024 292.977 32.2595 293.156 32.3115C293.035 32.4985 292.854 32.7021 292.599 32.918L292.578 32.9355L292.56 32.9551C292.406 33.1161 292.234 33.2766 292.052 33.4443C291.873 33.6087 291.681 33.7835 291.505 33.957C291.165 34.2908 290.796 34.7004 290.654 35.1787L290.634 35.249V35.4111C289.774 35.7651 288.369 36.1132 286.46 36.418L286.453 36.4189L286.446 36.4209C282.357 37.1979 277.035 37.8433 270.865 38.3086C265.468 38.7156 259.545 38.9753 253.431 39.0742L250.799 39.1064C188.029 39.6107 125.102 39.6307 62.3223 39.165L49.7686 39.0654L47.8818 39.0449C39.1049 38.9264 30.7521 38.4751 23.7773 37.7432L22.3047 37.582H22.3037C17.5373 37.0458 13.6574 36.3831 10.8994 35.6396H10.9004C10.3534 35.4811 10.0125 35.3218 9.66016 35.1494C9.37419 35.0095 9.07316 34.8575 8.66406 34.7012C8.69947 34.6965 8.73553 34.6911 8.77246 34.6865C10.2416 34.5644 11.9229 34.498 13.6416 34.4932L14.3818 34.4951H14.3887C17.1638 34.4821 18.8946 34.4668 19.8398 34.4502C20.305 34.442 20.5979 34.4334 20.7275 34.4229C20.7454 34.4214 20.7656 34.4195 20.7852 34.417C20.7972 34.4154 20.8377 34.41 20.8828 34.3965C20.8903 34.3942 20.9781 34.3707 21.0625 34.3008C21.1135 34.252 21.208 34.1005 21.2373 33.9951C21.2418 33.8693 21.1749 33.6611 21.1201 33.585C21.0798 33.5438 21.0063 33.4883 20.9756 33.4707C20.9546 33.4602 20.918 33.4451 20.9023 33.4395C20.8715 33.4289 20.8454 33.4234 20.833 33.4209C20.7882 33.4118 20.7393 33.4075 20.7119 33.4053C20.6759 33.4024 20.6323 33.399 20.584 33.3965C20.3418 33.384 19.8817 33.3724 19.2744 33.3594C19.2886 33.3271 19.3019 33.2919 19.3096 33.252C19.3669 32.9547 19.1585 32.7828 19.1094 32.7471C19.0446 32.7 18.9832 32.6781 18.9619 32.6709C18.8765 32.6422 18.7702 32.6311 18.7012 32.624C18.6122 32.6149 18.4968 32.6059 18.3555 32.5977C17.7909 32.5647 16.7285 32.5321 15.0098 32.5H15.0107C13.7224 32.4735 13.1196 32.3638 12.5332 32.2441C11.9166 32.1183 11.2981 31.977 10.0244 31.9053H10.0254C8.7007 31.8266 7.52407 31.7108 6.56445 31.5693L6.56641 31.5684L5.76953 31.3828C5.05965 31.2174 4.6195 31.0513 4.39551 30.916C4.61427 30.645 4.75873 30.3317 4.75879 29.9805C4.75879 29.6364 4.62131 29.3277 4.41016 29.0605L3.54785 26.8057C3.52393 26.5037 3.40274 26.2338 3.30273 26.0322C3.20116 25.8275 3.12086 25.6868 3.06055 25.5498C3.07096 25.5459 3.08148 25.5411 3.09277 25.5371C3.22076 25.4917 3.38676 25.4436 3.59375 25.3965C4.36722 25.2989 5.29584 25.2265 6.30664 25.1846L7.35059 25.1533L7.35742 25.1523C9.54112 25.0789 10.495 24.9814 11.4482 24.8906C12.1514 24.8237 12.8577 24.7602 14.0869 24.7139L15.5107 24.6738H26.332V24.6729C26.3333 24.6728 26.3346 24.6738 26.3359 24.6738L26.332 23.6738H26.3281C24.3727 23.6888 17.4883 23.6242 15.5059 23.6729C13.9483 23.6331 8.01219 23.1049 6.55762 23.0078H6.55664L5.65723 22.9326C4.86643 22.8484 4.19727 22.7486 3.6709 22.6387L3.19238 22.5254C2.9042 22.4475 2.71075 22.3737 2.5957 22.3115C2.58456 22.3055 2.57511 22.2982 2.56641 22.293C2.54746 22.2005 2.50697 22.0871 2.41699 21.9785C2.29277 21.8286 2.11613 21.7372 1.92773 21.6699C1.64067 21.4327 1.43392 21.2005 1.26758 20.9629L1.25684 20.9482L1.24512 20.9336L1.1416 20.7979C0.980921 20.5712 0.876321 20.3411 0.780273 20.0879L0.666016 19.7715L0.662109 19.7627L0.599609 19.5869C0.468052 19.1973 0.448594 18.947 0.65332 18.6934C0.794453 18.5186 1.07555 18.3001 1.62598 18.0732C2.17241 17.8481 2.95238 17.6272 4.05176 17.4297C4.95911 17.3053 6.04671 17.2068 7.25098 17.1396C7.89137 17.1039 8.916 16.9371 9.89941 16.7881C10.1829 16.7451 10.4633 16.7036 10.7334 16.666C11.2867 16.6709 11.8622 16.6791 12.4375 16.6826C13.7204 16.6904 15.005 16.6936 16.0508 16.6924C16.5736 16.6918 17.0377 16.69 17.4121 16.6865C17.5992 16.6848 17.7648 16.6832 17.9043 16.6807C17.9741 16.6794 18.0379 16.6773 18.0947 16.6758C18.1515 16.6743 18.2023 16.6727 18.2461 16.6709C18.268 16.67 18.2886 16.67 18.3076 16.6689C18.3264 16.6679 18.3445 16.6663 18.3613 16.665C18.3778 16.6638 18.3963 16.6622 18.4141 16.6602C18.423 16.6591 18.4339 16.658 18.4453 16.6562C18.4505 16.6554 18.4594 16.6534 18.4648 16.6523C18.4712 16.6511 18.4839 16.6491 18.4912 16.6475C18.5001 16.6453 18.5187 16.6399 18.5293 16.6367C18.5433 16.6321 18.5748 16.6203 18.5928 16.6123C18.6186 16.5993 18.6795 16.5601 18.7139 16.5322C18.7639 16.4811 18.8535 16.3272 18.8789 16.2227C18.8803 16.1037 18.8163 15.9064 18.7646 15.833C18.7261 15.7923 18.6545 15.7361 18.624 15.7178C18.6032 15.7068 18.5667 15.6906 18.5508 15.6846C18.5389 15.6804 18.5175 15.6746 18.5078 15.6719C18.4999 15.6698 18.4863 15.6656 18.4795 15.6641C18.4737 15.6628 18.4644 15.6612 18.459 15.6602C18.4468 15.6579 18.4351 15.6566 18.4258 15.6553C18.4163 15.654 18.4072 15.6523 18.3984 15.6514C18.3896 15.6504 18.3801 15.6493 18.3711 15.6484C18.3533 15.6468 18.3339 15.646 18.3135 15.6445C18.2928 15.643 18.2697 15.6411 18.2451 15.6396C18.196 15.6367 18.1378 15.6339 18.0703 15.6309C17.9349 15.6247 17.7587 15.6174 17.5391 15.6104C17.2356 15.6006 16.8465 15.5918 16.3623 15.5801C16.3019 15.5056 16.2455 15.4571 16.2197 15.4482C16.1969 15.4428 16.1623 15.4371 16.1504 15.4355C16.1435 15.4348 16.1321 15.433 16.127 15.4326C16.1233 15.4324 16.1163 15.4328 16.1133 15.4326C16.1072 15.4323 16.1015 15.4318 16.0977 15.4316C16.0936 15.4315 16.0896 15.4317 16.0859 15.4316C16.0784 15.4315 16.0701 15.4307 16.0615 15.4307C16.0445 15.4305 16.023 15.4306 15.998 15.4307C15.9476 15.4308 15.8785 15.431 15.7949 15.4316C15.7113 15.4323 15.6119 15.4335 15.499 15.4346C15.2728 15.4368 14.9919 15.4406 14.6748 15.4443C14.0405 15.4519 13.2602 15.4619 12.4805 15.4727C12.289 15.4753 12.0975 15.4778 11.9082 15.4805C11.4626 15.457 11.2005 15.4176 11.042 15.374C10.9398 15.3459 10.8975 15.3212 10.8818 15.3105C10.8675 15.3008 10.8558 15.29 10.8193 15.2471C10.7854 15.2071 10.7108 15.1131 10.6064 15.0264C10.4951 14.9339 10.3612 14.8565 10.1895 14.792C9.86347 14.6696 9.37747 14.5866 8.59473 14.541L8.58105 14.54H8.3291C7.54153 14.4899 6.79915 14.4281 6.11719 14.3555H6.11816C4.69024 14.2027 3.62021 14.0052 2.97754 13.7969L3.09375 13.7412V13.1309L3.09863 12.6836C3.11225 12.2564 3.16224 11.8844 3.3457 11.5225L3.39941 11.416V10.4199C3.65994 9.28031 4.0312 8.13995 4.51562 6.99902L4.7334 6.50293L4.73535 6.49805C4.84125 6.25812 5.16116 5.93345 5.83691 5.56543C6.49379 5.20771 7.41196 4.84893 8.58887 4.49805C10.9401 3.79708 14.2556 3.14867 18.4238 2.59375C26.2356 1.55377 36.463 0.918541 47.3301 0.792969L49.5117 0.774414Z" stroke="white" stroke-opacity="0.61" />
              </g>
              <defs>
                <filter id="filter0_dii_8_3374" x="0" y="-4" width="299" height="50" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
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
                  <stop stop-color="#A5F0FF" />
                  <stop offset="1" stop-color="#7EFFFF" />
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
        </div>

        <img src="/noot.webp" alt="noot" className="w-[60%] mx-auto" />
        <div className="relative w-full h-[88px] mt-[-20px]">
          <img src="/button-cover.svg" className="absolute z-[9] top-[-12px] left-1/2 -translate-x-1/2  min-w-[110%]" alt="snow" />

          <button className="bg-green-500 py-[14px] w-full mb-[16px] text-[40px] top-0 absolute top-0"
            onClick={() => setGameState("playing")}
          >
            PLAY NOW
          </button>

        </div>

        <div className="flex gap-[13px] w-full">
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white w-[calc(33%-6.5px)]"
            onClick={() => setMenuState(MenuStates.upgrades)}
          >
            Upgrade
          </button>

          <button
            className="rounded bg-blue-500 px-4 py-2 text-white w-[calc(33%-6.5px)]"
            onClick={() => setMenuState(MenuStates.items)}
          >
            Shop
          </button>
          <button
            className="rounded bg-blue-500 px-4 py-2 text-white w-[calc(33%-6.5px)]"
            onClick={() => setMenuState(MenuStates.skins)}
          >
            Skins
          </button>

        </div>

      </div>
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
