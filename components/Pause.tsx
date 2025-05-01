import { settingsAtom } from "@/atoms";
import { useAtom } from "jotai";
import PrimaryButton from "./buttons/PrimaryButton";
import { useEffect, useState } from "react";
import { Confirmation } from "./Confirmation";


const Pause = ({ onContinue }: { onContinue: () => void }) => {
    // useEffect(() => {
    //     alert('Finna add pause functionality');
    // }, [])

    const [confirming, setConfirming] = useState<boolean>(false);

    return (
        <>
            {confirming ? (
                <Confirmation
                    onYes={() => { alert('no end game functionality') }}
                    onBack={() => setConfirming(false)}
                />
            ) : (
                <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">
                    <div className={`flex flex-col items-center bg-[#C7F4FE] w-[350px] h-fit p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`} >
                        <h1 className="text-center text-[32px]">Game Paused</h1>

                        <div className="mt-[20px]"></div>

                        <img width={227} height={250} src="/game-paused.png" alt="game paused img" />

                        <PrimaryButton className="mt-4 w-full h-[44px]" color="green" onClick={onContinue}>CONTINUE</PrimaryButton>
                        <PrimaryButton className="mt-2 w-full h-[44px]" color="red" onClick={() => { setConfirming(true) }}>END RUN</PrimaryButton>
                    </div >
                </div >
            )}
        </>
    );
};

export default Pause;