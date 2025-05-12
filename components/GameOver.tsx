import { apiUserAtom, GameState } from "@/atoms";
import PrimaryButton from "./buttons/PrimaryButton";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { apiClient, emptyUser, UserWithUpgrades } from "@/utils/auth-utils";
import axios from "axios";
import toast from "react-hot-toast";
import { formatScore } from "@/utils";

type GameOverProps = {
    score: number;
    currentFishes: number;
    setGameState: (gs: GameState) => void;
    setCurrentFishes: (n: number) => void;
    setScore: (n: number) => void;
};

const GameOver = ({
    score,
    currentFishes,
    setGameState,
    setCurrentFishes,
    setScore,
}: GameOverProps) => {
    const [apiUser, setApiUser] = useAtom(apiUserAtom);

    useEffect(() => {
        const sendRunResults = async () => {
            try {
                const response = await apiClient.post('send-run-results', {
                    fishes: currentFishes,
                    score
                });
                const data: Partial<UserWithUpgrades> = response.data;
                setApiUser({
                    ...apiUser,
                    ...data
                });
            } catch (error: unknown) {
                if (axios.isAxiosError(error)) {
                    if (error.response?.status === 403) {
                        setApiUser(emptyUser);
                        toast.error('Unauthorized, sign in again!')
                    } else {
                        toast.error(error.response?.data.error || error.message || 'Unexpected error occurred')
                    }
                } else {
                    toast.error("An unexpected error occurred:" + error);
                }
            }
        }
        sendRunResults();
    }, [])

    return (
        <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full">
            <div className={`flex flex-col items-center bg-[#C7F4FE] w-[350px] p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                <h1 className="text-center text-[32px]">Game Over</h1>

                <div className="mt-[20px]"></div>

                <div className="flex w-full justify-between">
                    <div className={`flex flex-col items-center bg-[#A5DEEB] w-[49%] h-fit p-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                        <img src="/fish-collected.png" alt="fish collected" />

                        <div className="mt-[8px] text-[14px] text-[#7EFFFF]">FISH COLLECTED</div>
                        <div className="text-[32px] mt-[-8px]">{currentFishes}</div>
                    </div>
                    <div className={`flex flex-col items-center bg-[#A5DEEB] w-[49%] h-fit p-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                        <img src="/meters-ran.png" alt="fish collected" />

                        <div className="mt-[8px] text-[14px] text-[#7EFFFF]">METERS RAN</div>
                        <div className="text-[32px] mt-[-8px]">{formatScore(score)}</div>
                    </div>
                </div>

                <PrimaryButton onClick={() => {
                    setCurrentFishes(0);
                    setScore(0);
                    setGameState("playing");
                }} className="mt-[24px] w-full h-[44px]" color="green">TRY AGAIN</PrimaryButton>

                <PrimaryButton onClick={() => {
                    setGameState('in-menu');
                }} className="mt-[10px] w-full h-[44px]" color="blue">GO HOME</PrimaryButton>

            </div>
        </div>
    )
};

export default GameOver;