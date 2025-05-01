import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import AuthPage from "./AuthPage";
import { GameState } from "@/atoms";
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
} from "@/utils";
import { ChestIcon, LightingIcon, ShoppingCartIcon, StarIcon } from "./Icons";
import PrimaryButton from "./buttons/PrimaryButton";
import Settings from "./Settings";
import { useState } from "react";
import { ItemShop } from "./ItemShop";
import { Upgrades } from "./Upgrades";
import { div } from "three/src/nodes/TSL.js";

type Items = Array<IUserItem>;

type LandingProps = {
    address?: string;
    isRegistered: boolean;
    register: () => void;
    setGameState: (gs: GameState) => void;
    handlePurchase: (p: Items[number]) => void;
    isLoading: boolean;
    isConnected: boolean;
    balance: bigint;
};

type ActiveModalType = 'none' | 'settings' | 'upgrades' | 'item-shop'

const LandingPage = ({
    address,
    isRegistered,
    register,
    setGameState,
    isLoading,
    isConnected,
    balance,
    handlePurchase,
}: LandingProps) => {
    const [activeModal, setActiveModal] = useState<ActiveModalType>('none')

    if (!address) {
        // address = '0xmockupaddr'
        return <p>error, try to sign in again</p>
    }

    if (!isConnected || !isRegistered) {
        return (
            <AuthPage
                isRegistered={isRegistered}
                register={register}
                isLoading={isLoading}
                isConnected={isConnected}
            />
        );
    }

    const onModalClose = () => {
        setActiveModal('none');
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

                <div className="w-full mt-[12px]">
                    <img src="/hero.webp" className='px-[26px]' alt="hero" />

                    <div className="flex justify-between mt-[15px] items-center  relative z-[10]">
                        <div style={{
                            backgroundImage: "url('/landing-stats-bg.png')",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "100% 100%",
                            backgroundPosition: "center",
                            overflow: "hidden"
                        }}
                            className="w-full h-[46px] px-6 pt-1 pb-2 flex justify-center items-center"
                        >
                            <div className="mx-3 flex items-center justify-center">
                                <img src="/fish-icon.png" alt="fish icon" className="w-[30px] h-[30px]" />
                                <span className="mx-1">0</span>
                            </div>

                            <div className="mx-3 flex items-center justify-center">
                                <img src="/penguin-icon.png" alt="fish icon" className="w-[20px] h-[20px]" />
                                <span className="mx-1">0</span>
                            </div>

                            <div className="mx-3 flex items-center justify-center">
                                <img src="/eth-icon.webp" alt="fish icon" className="w-[24px] h-[24px]" />
                                <span className="">{truncateEther(balance)} ETH</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex mt-4 justify-between relative z-[10]">
                        <div>
                            <div className="flex items-center">
                                <div className="relative w-[40px] h-[40px]">
                                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                                    <LightingIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>

                                <div className="ml-4 flex flex-col justify-center">
                                    <span className="text-[14px] text-[#A5F0FF]">
                                        HIGH SCORE
                                    </span>
                                    <span className="text-[24px] mt-[-9px]">432,432</span>
                                </div>
                            </div>

                            <div className="mt-1 flex items-center">
                                <div className="relative w-[40px] h-[40px]">
                                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                                    <img width={30} height={30} src="/trophy-icon.png" alt="trophy-icon" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>

                                <div className="ml-4 flex flex-col justify-center">
                                    <span className="text-[14px] text-[#A5F0FF]">
                                        LEADERBOARD
                                    </span>
                                    <span className="text-[24px] mt-[-9px]">#542</span>
                                </div>
                            </div>

                            <div className="mt-1 flex items-center">
                                <div className="relative w-[40px] h-[40px]">
                                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                                    <ChestIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                                </div>

                                <div className="ml-4 flex flex-col justify-center">
                                    <span className="text-[14px] text-[#A5F0FF]">
                                        RAFFLE
                                    </span>
                                    <span className="text-[24px] mt-[-9px]">$NOOT</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div style={{
                                backgroundImage: "url('/addy-bg.png')",
                                backgroundRepeat: "no-repeat",
                                backgroundSize: "100% 100%",
                                backgroundPosition: "center",
                                overflow: "hidden"
                            }}
                                className="mt-1 w-full h-[46px] px-4 py-1 flex justify-center items-center"
                            >
                                <div className="mr-1">FT2...Hs1</div>
                                <img className="ml-1" src="/wallet-icon.png" alt="wallet icon" width={32} height={32} />
                            </div>
                            <div className="mt-3 flex justify-end">
                                <button
                                    className="text-white relative w-[40px] h-[40px]"
                                    onClick={() => setActiveModal('settings')}
                                >
                                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                                    <img src="/cog.png" alt="settings" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 mb-10 relative w-full">
                    <img src="/noot.webp" alt="noot" className="absolute bottom-[-4px] w-[60%] top-[-275px] mx-auto" />
                    <div className="relative w-full h-[88px] mt-[-20px]">
                        <img src="/button-cover.svg" className="absolute z-[9] top-[-14px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
                        <PrimaryButton
                            color='green'
                            className="w-full text-[40px]"
                            shineClassName="h-[70%]"
                            onClick={() => setGameState('playing')}
                        >
                            PLAY NOW
                        </PrimaryButton>
                    </div>

                    <div className="flex gap-[13px] w-full">
                        <PrimaryButton
                            color='blue'
                            className="w-[calc(33%-6.5px)]"
                            shineClassName="h-[50%]"
                            onClick={() => setActiveModal('upgrades')}
                        >
                            <div className="flex flex-col justify-center items-center">
                                {/* <StarIcon /> */}
                                <img width={44} height={44} src="/upgrade-icon.png" alt="coming soon icon" />

                                UPGRADE
                            </div>

                        </PrimaryButton>

                        <PrimaryButton
                            color='blue'
                            className="w-[calc(33%-6.5px)]"
                            shineClassName="h-[50%]"
                            // onClick={() => setMenuState(MenuStates.items)}
                            onClick={() => setActiveModal('item-shop')}
                        >
                            <div className="flex flex-col justify-center items-center">
                                {/* <ShoppingCartIcon /> */}
                                <img width={44} height={44} src="/shop-icon.png" alt="coming soon icon" />
                                SHOP
                            </div>

                        </PrimaryButton>

                        <PrimaryButton
                            color='blue'
                            className="w-[calc(33%-6.5px)]"
                            disabled
                            shineClassName="h-[50%]"
                            onClick={() => { }}
                        // onClick={() => setMenuState(MenuStates.skins)}
                        >
                            <div className="flex flex-col justify-center items-center">
                                <img width={44} height={44} src="/coming-soon-icon.png" alt="coming soon icon" />
                                SKINS
                            </div>

                        </PrimaryButton>
                    </div>
                </div>
            </div >

            {activeModal === 'settings' && (
                <Settings
                    onClose={onModalClose}
                    inGame={false}
                />
            )}
            {activeModal === 'upgrades' && (
                <Upgrades
                    onClose={onModalClose}
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

export default LandingPage