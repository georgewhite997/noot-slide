import { apiUserAtom, gameStateAtom, settingsAtom, SettingsType } from "@/atoms";
import { useAtom, useSetAtom } from "jotai";
import PrimaryButton from "./buttons/PrimaryButton";
import { useState } from "react";
import { Confirmation } from "./Confirmation";
import { useDisconnect } from "wagmi";
import { displayAddress } from "@/utils";

const ToggleSetting = ({ label, options, selected, onChange, className }: { label: string, options: [string, string], selected: 0 | 1, onChange: () => void, className?: string }) => {
    const [first, second] = options;

    return (
        <div className={`flex justify-between items-center ${className || ''}`}>
            <div>{label}</div>
            <div className="bg-[#E6FAFF] rounded-sm border-[2px] border-[#030303] p-[2px] w-[110px]">
                {/* <button>ON</button> */}
                <button onClick={() => {
                    if (selected == 0) return;
                    onChange();
                }} className={`${selected == 0 ? 'bg-green-500 border-[#030303] border-[2px]' : null} px-[8px] py-[4px] rounded-sm text-[14px] w-[47%]`}>{first}</button>
                <button onClick={() => {
                    if (selected == 1) return;
                    onChange();
                }} className={`${selected == 1 ? 'bg-green-500 border-[#030303] border-[2px]' : null} ml-1 px-[8px] py-[4px] rounded-sm text-[14px] w-[47%]`}>{second}</button>
            </div>
        </div>
    )
}

const Settings = ({ onClose, inGame = false, address }: { onClose: () => void, inGame?: boolean, address?: string }) => {
    const [settings, setSettings] = useAtom(settingsAtom);
    const [confirmingEnding, setConfirmingEnding] = useState<boolean>(false);
    const [newSettings, setNewSettings] = useState<SettingsType>(settings);
    const [apiUser, setApiUser] = useAtom(apiUserAtom);
    const { disconnect } = useDisconnect();
    const setGameState = useSetAtom(gameStateAtom)

    const handleLogout = () => {
        disconnect();
        setApiUser(undefined);
        sessionStorage.removeItem('apiToken');
        onClose();
    };

    return (
        <>
            {!confirmingEnding ? (
                <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">
                    <div className={`bg-[#C7F4FE] w-[350px] h-fit p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                        <h1 className="text-center text-[32px]">Settings</h1>

                        <div className="mt-[20px]"></div>

                        {!inGame && (
                            <div className="mt-[8px] bg-[#E6FAFF] w-full border-[2px] border-[#030303] rounded-sm p-[8px] flex items-center justify-between shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
                                <div className="flex items-center">
                                    <img width={39} height={39} src="/wallet-icon.png" alt="" />
                                    <div className="ml-1">{displayAddress(address)}</div>
                                </div>
                                <PrimaryButton className="w-[100px]" color="red" onClick={handleLogout}>LOG OUT</PrimaryButton>
                            </div>
                        )}

                        <div className="py-[16px] pl-[16px] px-[8px] mt-[8px] bg-[#7FCBDC] rounded-sm p-[8px] border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
                            <ToggleSetting
                                label="MUSIC"
                                options={['ON', 'OFF']}
                                selected={newSettings.music ? 0 : 1}
                                onChange={() => {
                                    setNewSettings((prev) => ({
                                        ...prev,
                                        music: !prev.music,
                                    }))
                                }}
                            />

                            <ToggleSetting
                                className="mt-[6px]"
                                label="SOUNDS"
                                options={['ON', 'OFF']}
                                selected={newSettings.sounds ? 0 : 1}
                                onChange={() => {
                                    setNewSettings((prev) => ({
                                        ...prev,
                                        sounds: !prev.sounds,
                                    }))
                                }}
                            />

                            <ToggleSetting
                                className="mt-[6px]"
                                label="ANTI ALIASING"
                                options={['ON', 'OFF']}
                                selected={newSettings.antialiasing ? 0 : 1}
                                onChange={() => {
                                    setNewSettings((prev) => ({
                                        ...prev,
                                        antialiasing: !prev.antialiasing,
                                    }))
                                }}
                            />

                            <ToggleSetting
                                className="mt-[6px]"
                                label="SHADOWS"
                                options={['ON', 'OFF']}
                                selected={newSettings.shadows ? 0 : 1}
                                onChange={() => {
                                    setNewSettings((prev) => ({
                                        ...prev,
                                        shadows: !prev.shadows,
                                    }))
                                }}
                            />

                            <ToggleSetting
                                className="mt-[6px]"
                                label="PIXEL RATIO"
                                options={['1x', '2x']}
                                selected={newSettings.dpr === 1 ? 0 : 1}
                                onChange={() => {
                                    setNewSettings((prev) => {
                                        return ({
                                            ...prev,
                                            dpr: prev.dpr === 1 ? 2 : 1,
                                        })
                                    })
                                }}
                            />
                        </div>

                        <div className="flex flex-col justify-between w-full mt-[8px]">
                            <div className="flex justify-between">
                                <PrimaryButton className="w-[49%] h-[44px]" onClick={onClose} color="blue">BACK</PrimaryButton>

                                <PrimaryButton className='w-[49%] h-[44px]' color="green"
                                    onClick={() => {
                                        setSettings(newSettings)
                                        onClose()
                                    }}
                                >
                                    SAVE
                                </PrimaryButton>
                            </div>


                            {inGame && (
                                <PrimaryButton className='mt-2 w-full h-[44px]' color="red"
                                    onClick={() => {
                                        setConfirmingEnding(true);
                                    }}
                                >
                                    END GAME
                                </PrimaryButton>
                            )}
                        </div>
                    </div >
                </div>
            ) : (
                <Confirmation
                    onBack={() => setConfirmingEnding(false)}
                    onYes={() => { setGameState('game-over') }}
                />
            )}
        </>
    );
};

export default Settings;