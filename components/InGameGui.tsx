import { currentFishesAtom, magnetCollectedAtAtom, isGamePausedAtom, magnetDurationAtom, multiplierCollectedAtAtom, multiplierDurationAtom, scoreAtom, apiUserAtom } from "@/atoms";
import { useAtom, useSetAtom } from "jotai";
import { HTMLAttributes, useEffect, useState } from "react"
import { LightingIcon } from "./Icons";
import Settings from "./Settings";
import Pause from "./Pause";
import { formatScore, getRemainingTime, hasPowerup } from "@/utils";
import { useAccount } from "wagmi";

type ActiveModalType = 'none' | 'settings' | 'pause'

export const InGameGui = ({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement> & {
    className?: string
}) => {
    const [magnetCollectedAt] = useAtom(magnetCollectedAtAtom);
    const [magnetDuration] = useAtom(magnetDurationAtom);
    const [multiplierCollectedAt] = useAtom(multiplierCollectedAtAtom);
    const [multiplierDuration] = useAtom(multiplierDurationAtom);
    const [score] = useAtom(scoreAtom);
    const [currentFishes] = useAtom(currentFishesAtom);
    const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
    const setIsGamePaused = useSetAtom(isGamePausedAtom);
    const [countdown, setCountdown] = useState<number | null>(0);
    const { address } = useAccount();
    const [apiUser, setApiUser] = useAtom(apiUserAtom);

    // Update onModalClose function
    const onModalClose = () => {
        setActiveModal('none');
        setCountdown(3); // Start countdown
    };

    //  useEffect to handle countdown logic
    useEffect(() => {
        if (countdown === null) return;

        if (countdown === 0) {
            setIsGamePaused(false);
            setCountdown(null);
            return;
        }

        const timer = setTimeout(() => {
            setCountdown((prev) => (prev ?? 0) - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);


    return (
        <>
            <div {...props} className={`absolute left-1/2 -translate-x-1/2 p-5 top-1/2 -translate-y-1/2 z-10 text-md text-white justify-between flex font-bold text-shadow-md ${className || ''}`}>
                <div>
                    <button
                        className="text-white relative w-[40px] h-[40px]"
                        onClick={() => {
                            setCountdown(null);
                            setActiveModal('pause');
                            setIsGamePaused(true);
                        }}
                    >
                        <img src="/small-button.png" alt="bg" className="" />
                        <img src="/pause-icon.png" alt="settings" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
                    </button>

                    <div className="mt-3 bg-[rgba(0,0,0,0.2)] px-[8px] py-[4px] rounded-md flex items-center justify-center w-fit">
                        <img width={40} height={41} src="/penguin-icon.png" alt="" />

                        <div className="ml-2 flex flex-col justify-center">
                            <span className="text-[14px] text-[#A5F0FF]">
                                TOP RUN
                            </span>
                            <span className="my-[2px]"></span>
                            <span className="text-[16px] mt-[-9px]">{formatScore(apiUser.highestScore)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex h-fit flex-col items-end">
                    <button
                        className="text-white relative w-[40px] h-[40px]"
                        onClick={() => {
                            setCountdown(null);
                            setActiveModal('settings')
                            setIsGamePaused(true);
                        }}
                    >
                        <img src="/small-button.png" alt="bg" className="" />
                        <img src="/cog.png" alt="settings" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
                    </button>

                    <div className="mt-3 bg-[rgba(0,0,0,0.2)] px-[8px] py-[4px] rounded-md flex items-center justify-center w-fit">
                        <img width={24} height={24} src="/fish-icon-shadow.png" alt="" />
                        <div className="ml-1">{currentFishes}</div>
                    </div>
                    <div className="mt-2 bg-[rgba(0,0,0,0.2)] px-[8px] py-[4px] rounded-md flex items-center justify-center w-fit">
                        <LightingIcon className="w-[13px] h-[20px]" />
                        <div className="ml-1">{formatScore(score)}</div>
                    </div>
                    <div className="flex mt-2 justify-center">
                        {hasPowerup(magnetCollectedAt, magnetDuration) && (
                            <div className="bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">
                                <span>N</span>
                                <span className="ml-1 text-xs">{getRemainingTime(magnetCollectedAt, magnetDuration)}s</span>
                            </div>
                        )}
                        {hasPowerup(multiplierCollectedAt, multiplierDuration) && (
                            <div className="ml-2 bg-[rgba(0,0,0,0.35)] w-fit p-2 rounded-lg flex items-center justify-center">
                                <span>M</span>
                                <span className="ml-1 text-xs">{getRemainingTime(multiplierCollectedAt, multiplierDuration)}s</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeModal === 'settings' && (
                <Settings
                    onClose={onModalClose}
                    inGame={true}
                    address={address}
                />
            )}
            {activeModal === 'pause' && (
                <Pause
                    onContinue={onModalClose}
                />
            )}
            {(countdown !== null && countdown > 0) && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-6xl font-bold z-50">
                    {countdown}
                </div>
            )}
        </>
    )
}