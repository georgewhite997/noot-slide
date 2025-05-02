import {
  useAbstractClient
} from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import { useAbstractSession } from "@/hooks/useAbstractSession";
import {
  registryContractAddress,
  registryAbi,
  powerupsContractAddress,
  powerupsAbi,
  usePublicClient,
  items as itemsMeta,
  IItem,
  chain, MAX_MOBILE_WIDTH,
  MAX_MOBILE_HEIGHT
} from "@/utils";
import { useEffect, useState, memo } from "react";
import { formatEther, parseEther } from "viem";
import { useAtom, useSetAtom } from "jotai";
import {
  gameStateAtom, currentFishesAtom,
  scoreAtom,
  haloQuantityAtom,
  hasSlowSkisAtom,
  hasLuckyCharmAtom,
  speedyStartQuantityAtom, abstractSessionAtom,
  SessionData,
  itemsAtom
} from "@/atoms";
import { toast, Toaster } from "react-hot-toast";
import LandingPage from "./LandingPage";
import GameOver from "./GameOver";
import Reviving from "./Reviving";
import { InGameGui } from "./InGameGui";

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
  const [currentFishes, setCurrentFishes] = useAtom(currentFishesAtom);
  const [score, setScore] = useAtom(scoreAtom);
  const setHaloQuantity = useSetAtom(haloQuantityAtom);
  const setHasSlowSkis = useSetAtom(hasSlowSkisAtom);
  const setHasLuckyCharm = useSetAtom(hasLuckyCharmAtom);
  const setSpeedyStartQuantity = useSetAtom(speedyStartQuantityAtom);
  const setItems = useSetAtom(itemsAtom)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [balance, setBalance] = useState<bigint>(BigInt(0));


  const [isRegistered, setIsRegistered] = useState(true);//

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

    let registeredRes, ownedRes, balance;

    try {
      [[registeredRes, ownedRes], balance] = await Promise.all([await publicClient.multicall({
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
    } catch (err) {
      toast.error("Error fetching player's data");
      registeredRes = { result: false };
      ownedRes = { result: new Array(itemsMeta.length).fill(0) };
      balance = BigInt(0);
    }

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
        const isEnabled = hasDisabledIndex == -1;
        const quantity = Number(qty);

        if (meta.name === "Abstract Halo") {
          setHaloQuantity(isEnabled ? quantity : 0);
        }

        if (meta.name === "Speedy Start") {
          setSpeedyStartQuantity(isEnabled ? quantity : 0);
        }

        if (meta.name === "Slow Skis") {
          setHasSlowSkis(isEnabled ? quantity > 0 : false);
        }

        if (meta.name === "Lucky Charm") {
          setHasLuckyCharm(isEnabled ? quantity > 0 : false);
        }

        return { ...meta, quantity, isDisabled: !isEnabled };
      }),
    );

    if (!session && owned.some((qty) => qty > 0)) {
      await handleCreateSession();
    }
  };

  const register = async () => {
    return;
    // if (!abstractClient || isRegistered || !publicClient) return;

    // const bal = await publicClient.getBalance({
    //   address: abstractClient.account.address as `0x${string}`,
    // });

    // if (!bal) return toast.error("Error getting balance");

    // const [feeRes, registeredRes] = await publicClient.multicall({
    //   contracts: [
    //     { ...registryContract, functionName: "registrationFee" },
    //     {
    //       ...registryContract,
    //       functionName: "registeredAddresses",
    //       args: [address],
    //     },
    //   ],
    // });

    // if (registeredRes.result) {
    //   // setIsRegistered(true);
    //   return toast.error("You are already registered");
    // }

    // const fee = feeRes.result as bigint;
    // if (bal < fee) {
    //   return toast.error(
    //     `Need ${formatEther(fee)} ETH, you have ${formatEther(bal)}`,
    //   );
    // }

    // try {
    //   toast.loading("Registering…");
    //   await abstractClient.writeContract({
    //     address: registryContractAddress,
    //     abi: registryAbi,
    //     functionName: "register",
    //     value: fee,
    //   });
    //   setIsRegistered(true);
    //   toast.dismiss();
    //   toast.success("Registered successfully");
    // } catch (err) {
    //   console.error(err);
    //   toast.dismiss();
    //   toast.error("Failed to register");
    // }
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

  useEffect(() => {
    (async () => {
      if (isConnected) {
        setIsLoadingWalletData(true);
        if (abstractClient?.account.address) {
          const s = (await checkForExistingSession()) as SessionData;
          fetchWallet(s);
          setIsLoadingWalletData(false);
          setSession(s);
        } else {
          setSession(null);
        }
      }
    })();
  }, [isConnected, abstractClient?.account?.address]);

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
        <InGameGui style={{
          width: dimensions.width,
          height: dimensions.height,
        }} />
      )}

      {overlay && (
        <div className="absolute inset-0 bg-black/80 z-[90] flex items-center justify-center w-screen">
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
                <LandingPage
                  balance={balance}
                  isLoading={isLoadingWalletData}
                  address={address}
                  isConnected={isConnected}
                  isRegistered={isRegistered}
                  register={register}
                  setGameState={setGameState}
                  // setMenuState={setMenuState}
                  // items={items}
                  handlePurchase={handlePurchase}
                />
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
});