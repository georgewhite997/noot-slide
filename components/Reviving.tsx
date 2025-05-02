import { currentFishesAtom, GameState, reviveCountAtom, scoreAtom } from "@/atoms";
import { nootTreasury } from "@/utils";
import { AbstractClient } from "@abstract-foundation/agw-client";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { parseAbi, parseEther, PublicClient } from "viem";
import NootToken from "../addresses/Noot.json";
import { LightingIcon } from "./Icons";
import PrimaryButton from "./buttons/PrimaryButton";

type RevivingProps = {
    setGameState: (gs: GameState) => void;
    abstractClient: AbstractClient | undefined;
    address: `0x${string}`;
    publicClient: PublicClient | null;
};

const revivePrices = [50, 169, 420];

const Reviving = ({ setGameState, address, publicClient, abstractClient }: RevivingProps) => {
    const currentFishes = useAtomValue(currentFishesAtom);
    const score = useAtomValue(scoreAtom)
    const [reviveCount, setReviveCount] = useAtom(reviveCountAtom);

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

    const endGame = () => {
        setGameState("game-over");
        setReviveCount(0);
    };

    return (
        <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full">
            <div className={`flex flex-col items-center bg-[#C7F4FE] w-[350px] h-fit p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                <h1 className="text-center text-[32px]">Continue?</h1>

                <div className="mt-[20px]"></div>

                <div className="flex w-full justify-between">
                    <div
                        className="flex w-[49%] text-[20px] p-[8px] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[#A5DEEB]"
                    >
                        <img width={40} height={40} src="/fish-icon-shadow.png" alt="" />

                        <div className="ml-2 flex flex-col justify-center">
                            <span className="text-[16px] text-[#A5F0FF]">
                                FISH
                            </span>
                            <span className="my-[2px]"></span>
                            <span className="text-[18px] mt-[-9px]">{currentFishes}</span>
                        </div>
                    </div>
                    <div
                        className="flex w-[49%] text-[20px] p-[8px] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[#A5DEEB]"
                    >
                        <LightingIcon className="w-[40px] h-[40px]" />

                        <div className="ml-2 flex flex-col justify-center">
                            <span className="text-[16px] text-[#A5F0FF]">
                                METERS
                            </span>
                            <span className="my-[2px]"></span>
                            <span className="text-[18px] mt-[-9px]">{score}</span>
                        </div>
                        {/* <div className="flex justify-between items-center">
                        
                    </div> */}
                    </div>
                </div>

                <div className="relative mt-2">
                    <img width={290} height={280} src="/revive.png" alt="revive img" />
                    <div className="text-[20px] absolute top-8 left-1/2 -translate-x-1/2 w-full text-center"><span className="text-[#A5F0FF]">{3 - reviveCount + 1}/3</span> REVIVES LEFT</div>
                </div>

                <PrimaryButton color="green" className="mt-2 w-full h-[66px] text-[20px]" onClick={handleRevive}>REVIVE FOR {currentPrice} $NOOT</PrimaryButton>
                <PrimaryButton color="red" className="mt-2 w-full h-[44px]" onClick={endGame}>END RUN</PrimaryButton>
            </div>
        </div>
    )
}

// const Reviving = ({ setGameState, address, publicClient, abstractClient }: RevivingProps) => {
//     const [timer, setTimer] = useState(0);
//     const [reviveCount, setReviveCount] = useAtom(reviveCountAtom);

//     useEffect(() => {
//         const i = setInterval(() => {
//             setTimer((t) => {
//                 const newTime = t + 1;
//                 if (newTime === 60) {
//                     setGameState("game-over");
//                 }
//                 return newTime;
//             });
//         }, 1000);

//         return () => {
//             clearInterval(i);
//         };
//     }, []);

//     const currentPrice = revivePrices[reviveCount - 1];

//     const handleRevive = async () => {
//         try {
//             const balance = await publicClient!.readContract({
//                 abi: parseAbi([
//                     "function balanceOf(address account) view returns (uint256)",
//                 ]),
//                 address: NootToken.address as `0x${string}`,
//                 functionName: "balanceOf",
//                 args: [address],
//             });

//             const toSend = parseEther(currentPrice + "");

//             if (balance < toSend) {
//                 toast.error("Not enough $NOOT balance");
//                 return;
//             }

//             const tx = await abstractClient!.writeContract({
//                 abi: parseAbi([
//                     "function transfer(address to, uint256 value) external returns (bool)",
//                 ]),
//                 address: NootToken.address as `0x${string}`,
//                 functionName: "transfer",
//                 args: [nootTreasury, toSend],
//             });

//             setGameState("playing");
//         } catch (e) {
//             console.log(e);
//             setGameState("game-over");
//         }
//     };

//     const handleSkip = () => {
//         setGameState("game-over");
//         setReviveCount(0);
//     };

//     return (
//         <div className="w-full px-[32px] flex justify-center h-full items-center">
//             <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">

//                 <h2 className="text-2xl font-bold text-center mb-[24px]">Continue?</h2>
//                 <p className="text-center mb-[8px]">Time left: {60 - timer}</p>
//                 <div style={{ background: 'radial-gradient(circle, #A6F6FF 0%, #1594B9 100%)' }} className="rounded-md border-2 border-black">
//                     <img src="/revive.png" alt="revive" className="" />

//                     <p className="text-center mb-[8px] text-[20px] uppercase"><span className="font-bold text-[#A5F0FF]">{3 - reviveCount + 1}/3</span>  Revives left</p>

//                 </div>


//                 <div className="flex gap-[8px] flex-col mt-[10px]">
//                     <button
//                         onClick={handleRevive}
//                         className="bg-green-500 rounded-md px-4 py-2 rounded-md text-[20px] uppercase"
//                     >
//                         Revive for  {currentPrice} $NOOT
//                     </button>

//                     <button
//                         className="rounded bg-red-500 py-2 text-white"
//                         onClick={handleSkip}
//                     >
//                         END RUN
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

export default Reviving