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

    useEffect(() => {
        const handleBlur = () => {
            setCountdown(null);
            setActiveModal('pause');
            setIsGamePaused(true);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key === 'escape') {
                setCountdown(null);
                setActiveModal('pause');
                setIsGamePaused(true);
            }
        }

        window.addEventListener("blur", handleBlur);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("blur", handleBlur);
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [])

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
                        <img width={34} height={32} src="/star-icon.png" alt="" />

                        <div className="ml-2 flex flex-col justify-center">
                            <span className="text-[14px] text-[#A5F0FF]">
                                TOP RUN
                            </span>
                            <span className="my-[2px]"></span>
                            <span className="text-[16px] mt-[-9px]">{formatScore(apiUser.highestScore)}</span>
                        </div>
                    </div>

                    <div className="flex mt-2 items-center justify-left">
                        {hasPowerup(magnetCollectedAt, magnetDuration) && (
                            <PowerupIcon
                                icon="/fishing-rod-icon-shadow.png"
                                remaining={getRemainingTime(magnetCollectedAt, magnetDuration) / 100}
                                duration={magnetDuration}
                            />
                        )}

                        {hasPowerup(multiplierCollectedAt, multiplierDuration) && (
                            <PowerupIcon
                                icon="/fish-icon-shadow.png"
                                remaining={getRemainingTime(multiplierCollectedAt, multiplierDuration) / 100}
                                duration={multiplierDuration}
                            />
                        )}
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
                        <div className="ml-1">{formatScore(currentFishes)}</div>
                    </div>
                    <div className="mt-2 bg-[rgba(0,0,0,0.2)] px-[8px] py-[4px] rounded-md flex items-center justify-center w-fit">
                        {/* <LightingIcon className="w-[13px] h-[20px]" /> */}
                        <img src="/meters-icon.png" alt="meters icon" width={24} height={24} />
                        <div className="ml-1">{formatScore(score)}</div>
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

const PowerupIcon = ({
    icon,
    remaining,
    duration,
}: {
    icon: string;
    remaining: number;
    duration: number;
}) => {
    let percentage = Math.max(0, Math.min(100, remaining / (duration / 100)) * 100);

    const interpolate = (start: number, end: number, factor: number) =>
        Math.round(start + (end - start) * factor);

    const getColorFromPercentage = (percent: number) => {
        let r, g, b;

        if (percent > 50) {
            // Mint Green → Yellow
            const ratio = (percent - 50) / 50; // from 0 at 50% to 1 at 100%
            r = interpolate(255, 63, ratio);   // 255 ➝ 63
            g = 255;
            b = interpolate(0, 160, ratio);    // 0 ➝ 160
        } else {
            // Yellow → Custom Red (#FF2F2F)
            const ratio = percent / 50; // from 0 at 0% to 1 at 50%
            r = 255;
            g = interpolate(47, 255, ratio); // 47 ➝ 255
            b = interpolate(47, 0, ratio);   // 47 ➝ 0
        }

        return `rgb(${r}, ${g}, ${b})`;
    };

    const progressColor = getColorFromPercentage(percentage);

    return (
        <div className={`${icon === '/fishing-rod-icon-shadow.png' && 'mr-2'} relative w-[50px] h-[50px] flex items-center justify-center`}>
            {/* Border wrapper with conic gradient */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `conic-gradient(${progressColor} ${percentage}%, rgba(0,0,0,0.02) ${percentage}%)`,
                    WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px), black 100%)',
                    mask: 'radial-gradient(farthest-side, transparent calc(100% - 6px), black calc(100% - 5px), black 100%)',
                    willChange: 'transform',
                    transition: 'background 0.5s ease',
                }}
            />
            {/* Icon wrapper */}
            <div className="bg-[rgba(0,0,0,0.2)] rounded-full p-2">
                <img src={icon} alt="icon" width={32} height={32} />
            </div>
        </div>
    );
};