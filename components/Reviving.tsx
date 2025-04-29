import { GameState, reviveCountAtom } from "@/atoms";
import { nootTreasury } from "@/utils";
import { AbstractClient } from "@abstract-foundation/agw-client";
import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { parseAbi, parseEther, PublicClient } from "viem";
import NootToken from "../addresses/Noot.json";

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

export default Reviving