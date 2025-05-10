import { displayAddress } from "@/utils";
import { apiClient } from "@/utils/auth-utils";
import { useEffect, useState } from "react";

type LeaderboardProps = {
    onClose: () => void;
};

type LeaderboardPosition = {
    wallet: string,
    position: number,
    highestScore: number,
}

export const Leaderboard = ({
    onClose,
}: LeaderboardProps) => {
    const [leaderboard, setLeaderboard] = useState<LeaderboardPosition[]>();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            const response = await apiClient.get('leaderboard');
            setLeaderboard(response.data);
        }

        fetchLeaderboard();
    }, [])

    return (
        <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">
            <div className="w-[380px]">
                <button
                    className="text-white relative w-[40px] h-[40px] mb-[16px]"
                    onClick={onClose}
                >
                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                    <img src="/arrow.png" alt="back" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
                </button>

                <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] text-center">
                    <h1 className="text-center text-[32px]">Leaderboard</h1>

                    <div className="mt-[20px]"></div>

                    {leaderboard ? (
                        <>
                            <div className="flex justify-between">
                                <div className="flex flex-col items-center justify-center px-[10px] pt-[6px] pb-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-gradient-to-b from-[#FEED88] to-[#FFAB2B]">
                                    <div className="text-[16px]">{leaderboard[0] ? displayAddress(leaderboard[0].wallet) : 'none'}</div>
                                    <img className="mt-[8px]" width={74} height={74} src="/1stplace.png" alt="1stplaceimg" />
                                    <div className="mt-[8px] text-[14px]">{leaderboard[0] ? leaderboard[0].highestScore + 'm' : 'none'}</div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-[10px] pt-[6px] pb-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-gradient-to-b from-[#FDF4FB] to-[#A8B5BD]">
                                    <div className="text-[16px]">{leaderboard[1] ? displayAddress(leaderboard[1].wallet) : 'none'}</div>
                                    <img className="mt-[8px]" width={74} height={74} src="/2ndplace.png" alt="1stplaceimg" />
                                    <div className="mt-[8px] text-[14px]">{leaderboard[1] ? leaderboard[1].highestScore + 'm' : 'none'}</div>
                                </div>

                                <div className="flex flex-col items-center justify-center px-[10px] pt-[6px] pb-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-gradient-to-b from-[#FFC790] to-[#CB6326]">
                                    <div className="text-[16px]">{leaderboard[2] ? displayAddress(leaderboard[2].wallet) : 'none'}</div>
                                    <img className="mt-[8px]" width={74} height={74} src="/3rdplace.png" alt="1stplaceimg" />
                                    <div className="mt-[8px] text-[14px]">{leaderboard[2] ? leaderboard[2].highestScore + 'm' : 'none'}</div>
                                </div>
                            </div>

                            <div className="mt-10 relative w-full">
                                <img src="/button-cover.svg" className="absolute z-[9] top-[-24px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
                                <div
                                    className="w-full text-[20px] p-[16px] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[#7FCBDC]"
                                >
                                    {[...leaderboard.slice(3), ...Array.from({ length: Math.max(0, 12) }, (_, i) => ({
                                        wallet: 'none',
                                        position: i + 4 + leaderboard.slice(3).length,
                                        highestScore: 0,
                                    }))].map((leaderboardPosition, index) => (
                                        <Position key={index} leaderboardPosition={leaderboardPosition} />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div>Loading data...</div>
                    )}
                </div>
            </div>
        </div >
    );
};

export const Position = (
    { leaderboardPosition }: { leaderboardPosition: LeaderboardPosition }
) => {
    return (
        <div className={`${leaderboardPosition.position > 4 ? 'mt-[4px]' : ''} flex justify-between`}>
            <div className="flex items-center justify-center ">
                <div className={`flex items-center justify-center ${leaderboardPosition.position > 10 ? 'bg-blue-500' : 'bg-green-500'} w-[33px] h-[33px] rounded-md border-[1px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] text-[14px]`}>{leaderboardPosition.position}</div>
                <div className="ml-[8px]">{leaderboardPosition.wallet === 'none' ? 'none' : displayAddress(leaderboardPosition.wallet)}</div>
            </div>
            <div>{leaderboardPosition.wallet === 'none' ? 'none' : leaderboardPosition.highestScore + 'm'}</div>
        </div>
    )
}