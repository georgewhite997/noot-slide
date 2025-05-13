import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import AuthPage from "./AuthPage";
import { apiUserAtom, GameState } from "@/atoms";
import {
    registryContractAddress,
    registryAbi,
    powerupsContractAddress,
    powerupsAbi,
    // skinsContractAddress,
    // skinsAbi,
    usePublicClient,
    items as itemsMeta,
    IItem,
    chain,
    nootTreasury,
    MAX_MOBILE_WIDTH,
    MAX_MOBILE_HEIGHT,
    IUserItem,
    truncateEther,
    displayAddress,
    formatNootBalance,
    formatScore,
} from "@/utils";
import { ChestIcon, LightingIcon, ShoppingCartIcon, StarIcon } from "./Icons";
import PrimaryButton from "./buttons/PrimaryButton";
import Settings from "./Settings";
import { useState } from "react";
import { ItemShop } from "./ItemShop";
import { Upgrades } from "./Upgrades";
import { div } from "three/src/nodes/TSL.js";
import { useAtom } from "jotai";
import { Leaderboard } from './Leaderboard'

type Items = Array<IUserItem>;

type ChoosingPowerUpsProps = {
    address?: string;
    isRegistered: boolean;
    register: () => void;
    setGameState: (gs: GameState) => void;
    handlePurchase: (p: Items[number]) => void;
    isLoading: boolean;
    isConnected: boolean;
    balance: bigint;
    nootBalance: bigint;
    setCurrentFishes: (n: number) => void;
    setScore: (n: number) => void;
};

type ActiveModalType = 'none' | 'settings' | 'upgrades' | 'item-shop' | 'leaderboard'

const ChoosingPowerUps = ({
    address,
    isRegistered,
    register,
    setGameState,
    isLoading,
    isConnected,
    balance,
    handlePurchase,
    nootBalance,
    setCurrentFishes,
    setScore
}: ChoosingPowerUpsProps) => {
    const [activeModal, setActiveModal] = useState<ActiveModalType>('none')
    const [apiUser, setApiUser] = useAtom(apiUserAtom);


    if (!isConnected || !isRegistered || apiUser.id == 0) {
        return (
            <AuthPage
                isRegistered={isRegistered}
                register={register}
                isLoading={isLoading}
                isConnected={isConnected}
            />
        );
    }

    if (!address || apiUser.id == 0) {
        // address = '0xmockupaddr'
        return <p>error, try to sign in again</p>
    }



    const onModalClose = () => {
        setActiveModal('none');
    }

    const onClose = () => {
        setGameState('in-menu')
    }

    return (
        <>
            <div className="h-full w-full flex flex-col justify-between items-center px-[16px] w-[500px] max-h-screen"
                style={{
                    backgroundImage: "url('/hero2.svg')",
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat'
                }}>

                <div className="w-full mt-[24px] flex justify-between">
                    <button
                        className="relative w-[40px] h-[40px]"
                        onClick={onClose}
                    >
                        <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                        <img
                            src="/arrow.png"
                            alt="back"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]"
                        />
                    </button>

                    <button
                        className="relative w-[40px] h-[40px]"
                        onClick={() => setActiveModal('settings')}
                    >
                        <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                        <img
                            src="/cog.png"
                            alt="back"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]"
                        />
                    </button>
                </div>

                <div className="mt-[-70px]">
                    <div className="text-[40px] text-center mb-[34px]">Take these items with you!</div>

                    <div className="flex flex-col p-[12px] relative bg-[#7FCBDC] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] w-full">
                        <div className="text-[16px] w-full flex justify-between items-center">
                            <div className="flex w-full">
                                <div className="relative w-[114px] h-[114px]">
                                    <img width={114} height={114} src={'/halo-bg.png'} alt="item icon" />
                                    <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 text-nowrap">5 LEFT</div>
                                    <div
                                        className="absolute text-[#FF8C00] top-[-5px] right-[-40px] text-[20px]"
                                        style={{ transform: 'rotate(-15deg)' }}
                                    >
                                        EQUIPED
                                    </div>
                                </div>

                                <div className="ml-2 flex flex-col justify-center">
                                    <div className="uppercase text-[24px]">HALO</div>
                                    <div className="text-[#C7F4FE] text-[16px]">LONG DESCRIPTION</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-[8px] flex flex-col p-[12px] relative bg-[#7FCBDC] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] w-full">
                        <div className="text-[16px] w-full flex justify-between items-center">
                            <div className="flex w-full">
                                <div className="relative w-[114px] h-[114px]">
                                    <img width={114} height={114} src={'/cape-bg.png'} alt="item icon" />
                                    <div className="text-nowrap absolute bottom-[5px] left-1/2 -translate-x-1/2">10 LEFT</div>
                                </div>

                                <div className="ml-2 flex flex-col justify-center">
                                    <div className="uppercase text-[24px]">CAPE</div>
                                    <div className="text-[#C7F4FE] text-[16px]">LONG DESCRIPTION</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="flex flex-col items-center mb-23 relative w-full">
                    <div className="relative w-full h-[88px] mt-[-20px]">
                        <img src="/button-cover.svg" className="absolute z-[9] top-[-14px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
                        <PrimaryButton
                            color='green'
                            className="w-full text-[40px]"
                            shineClassName="h-[70%]"
                            onClick={() => {
                                setScore(0);
                                setCurrentFishes(0);
                                setGameState('playing');
                            }}
                        >
                            START GAME
                        </PrimaryButton>
                    </div>

                    <PrimaryButton
                        color='orange'
                        className="w-full text-[18px] h-[47px]"
                        onClick={() => {
                            setActiveModal('item-shop')
                        }}
                    >
                        BUY ITEMS
                    </PrimaryButton>
                </div>
            </div >

            {activeModal === 'settings' && (
                <Settings
                    onClose={onModalClose}
                    inGame={false}
                    address={address}
                />
            )}
            {activeModal === 'item-shop' && (
                <ItemShop
                    balance={balance}
                    onClose={onModalClose}
                    address={address}
                    handlePurchase={handlePurchase}
                />
            )}
        </>
    );
};

export default ChoosingPowerUps