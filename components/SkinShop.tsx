import { useEffect, useRef, useState } from "react";
import { formatNootBalance, skins, ISkin } from "../utils";
import PrimaryButton from "./buttons/PrimaryButton";
import { ArrowDownIcon, MinusIcon, PlusIcon } from "./Icons";

type SkinsProps = {
    onClose: () => void;
    address: string;
    handlePurchase: (p: any) => void;
    nootBalance: bigint;
};

const isEnabled = process.env.NODE_ENV === "development"

export const SkinShop = ({
    onClose,
    address,
    handlePurchase,
    nootBalance,
}: SkinsProps) => {
    return (
        <div style={{ background: "radial-gradient(circle, #0CBED2 0%, #0A94BC 100%)" }} className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-[402px] z-10 p-5 max-h-screen overflow-y-auto">
            <div className="relative flex Skins-center justify-center">
                <button
                    className="absolute left-0 w-[40px] h-[40px]"
                    onClick={onClose}
                >
                    <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                    <img
                        src="/arrow.png"
                        alt="back"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]"
                    />
                </button>
                <h1 className="text-[32px] text-white text-center">Skin Shop</h1>
            </div>
            {isEnabled ? (
                <>
                    <div className="mt-10 relative w-full h-[88px]">
                        <img src="/button-cover.svg" className="absolute z-[9] top-[-24px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
                        <div
                            className="w-full text-[20px] py-3 pl-2 pr-4 rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[radial-gradient(ellipse_at_center_60%,_#9E54FF_0%,_#6A00FF_100%)]"
                        >
                            <div className="flex justify-between Skins-center">
                                <div className="flex Skins-center">
                                    <div className="ml-1">NOOT BALANCE</div>
                                </div>
                                <div>{formatNootBalance(nootBalance)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-[16px] bg-[#E6FAFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
                        {skins.map((skin) => (
                            <Skin key={skin.id} skin={skin} handlePurchase={handlePurchase} />
                        ))}

                    </div>
                </>
            ) : (
                <div className="flex justify-center items-center h-[80vh]">
                    <p>Coming soon</p>
                </div>
            )}
        </div>
    );
};

const Skin = ({
    skin,
    handlePurchase,
}: {
    skin: ISkin;
    handlePurchase: (p: ISkin) => void;
}) => {
    const [expanded, setExpanded] = useState<boolean>(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (expanded && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [expanded]);

    return (
        <div className="mt-1 flex flex-col p-[12px] relative bg-[#7FCBDC] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
            <div className="text-[16px] w-full flex justify-between Skins-center">
                <div className="flex w-full">
                    <img width={53} height={53} src={`/skins/${skin.id}.png`} alt="Skin icon" />
                    <div className="ml-2">
                        <div className="uppercase">{skin.name}</div>
                        <div className="flex items-center">
                            <img src="/penguin-icon.png" alt="noot icon" className="w-[15px] h-[15px]" />
                            <div className="ml-1">{skin.price}</div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex justify-center items-center w-[24px] h-[24px] p-[12px] bg-[#FFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]"
                >
                    <ArrowDownIcon
                        className={`flex-shrink-0 w-[12px] h-[12px] transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''
                            }`}
                    />
                </button>
            </div>

            <div
                ref={contentRef}
                style={{
                    maxHeight: height + 'px',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease',
                }}
            >
                <div className="flex items-center space-x-[2px]">
                    <PrimaryButton onClick={() => handlePurchase(skin)} className="flex-grow mt-2 h-[44px]" color="green">
                        BUY
                    </PrimaryButton>
                </div>
            </div>
        </div>
    );
}