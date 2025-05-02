import { currentFishesAtom, magnetCollectedAtAtom, magnetDurationAtom, multiplierCollectedAtAtom, multiplierDurationAtom, scoreAtom } from "@/atoms";
import { useAtom } from "jotai";
import { HTMLAttributes, useState } from "react"
import { LightingIcon } from "./Icons";
import Settings from "./Settings";
import Pause from "./Pause";
import { getRemainingTime, hasPowerup } from "@/utils";

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

    const onModalClose = () => {
        setActiveModal('none');
    }

    return (
        <>
            <div {...props} className={`absolute left-1/2 -translate-x-1/2 p-5 top-1/2 -translate-y-1/2 z-10 text-md text-white justify-between flex font-bold text-shadow-md ${className || ''}`}>
                <div>
                    <button
                        className="text-white relative w-[40px] h-[40px]"
                        onClick={() => setActiveModal('pause')}
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
                            <span className="text-[16px] mt-[-9px]">432,432</span>
                        </div>
                    </div>
                </div>
                <div className="flex h-fit flex-col items-end">
                    <button
                        className="text-white relative w-[40px] h-[40px]"
                        onClick={() => setActiveModal('settings')}
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
                        <div className="ml-1">{score}</div>
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
                />
            )}
            {activeModal === 'pause' && (
                <Pause
                    onContinue={onModalClose}
                />
            )}
        </>
    )
}