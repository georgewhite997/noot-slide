import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownIcon } from "./Icons";
import PrimaryButton from "./buttons/PrimaryButton";
import { Prisma, Upgrade, User, UserUpgrade } from '@/prisma-client'
import { apiClient, emptyUser, UpgradeLevel, UserWithUpgrades } from "@/utils/auth-utils";
import { SetStateAction, useAtom, useAtomValue } from "jotai";
import { apiUserAtom, upgradesAtom } from "@/atoms";
import { userAgent } from "next/server";
import toast from "react-hot-toast";
import axios from "axios";
import { formatScore } from "@/utils";

type UpgradesProps = {
    onClose: () => void;
    address: string;
};

export const Upgrades = ({
    onClose,
    address,
}: UpgradesProps) => {
    const upgrades = useAtomValue(upgradesAtom);
    const [apiUser, setApiUser] = useAtom(apiUserAtom);

    if (apiUser?.id == 0) {
        return (
            <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">error when loading user</div>
        )
    }

    if (!upgrades) {
        return (
            <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">error when loading upgrades</div>
        )
    }

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
                    <h1 className="text-center text-[32px]">Upgrades</h1>

                    <div className="mt-[20px]"></div>

                    <div className="mt-10 relative w-full h-[88px]">
                        <img src="/button-cover.svg" className="absolute z-[9] top-[-24px] left-1/2 -translate-x-1/2  min-w-[108%]" alt="snow" />
                        <div
                            className="w-full text-[20px] py-3 pl-2 pr-4 rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)] bg-[radial-gradient(ellipse_at_center_60%,_#0CBED2_0%,_#0A94BC_100%)]"
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <img src="/fish-icon.png" alt="eth icon" width={38} height={38} />
                                    <div className="ml-2">FISH BALANCE</div>
                                </div>
                                <div>{formatScore(apiUser?.fishes)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-[16px] bg-[#E6FAFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
                        {/* upgrade 1 */}
                        {upgrades.map((upgrade: Upgrade) =>
                            <UpgradeMenu key={upgrade.id} upgrade={upgrade} />
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

const UpgradeMenu = ({
    upgrade,
}: {
    upgrade: Upgrade,
}) => {
    const [apiUser, setApiUser] = useAtom(apiUserAtom)
    const [expanded, setExpanded] = useState<boolean>(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);
    const [isUpgrading, setIsUpgrading] = useState<boolean>(false);

    const upgradeLevels: UpgradeLevel[] = upgrade.levels as UpgradeLevel[]

    const userUpgradeLevel = useMemo(() => {
        return apiUser.userUpgrades?.find((userUpgrade) => userUpgrade.upgradeId === upgrade.id)?.level || 1;
    }, [apiUser, upgrade.id]);

    const currentLevel = useMemo(() => {
        return upgradeLevels?.find(level => level.level === userUpgradeLevel);
    }, [upgradeLevels, userUpgradeLevel]);

    const nextLevel = useMemo(() => {
        return upgradeLevels?.find(level => level.level === userUpgradeLevel + 1);
    }, [upgradeLevels, userUpgradeLevel]);

    const maxLevel: number = upgradeLevels.length;

    useEffect(() => {
        if (expanded && contentRef.current) {
            setHeight(contentRef.current.scrollHeight);
        } else {
            setHeight(0);
        }
    }, [expanded]);

    if (!currentLevel) {
        return <div>error when loading upgrade</div>
    }

    const handleUpgrade = async () => {
        setIsUpgrading(true);

        try {
            const response = await apiClient.post('upgrades/buy', {
                upgradeId: upgrade.id
            })
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
        } finally {
            setIsUpgrading(false);
        }
    }

    return (
        <div className="mt-1 flex flex-col p-[12px] relative bg-[#7FCBDC] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
            <div className="text-[16px] w-full flex justify-between items-center">
                <div className="flex w-full">
                    <img width={53} height={53} src={upgrade.iconPath} alt="item icon" />
                    <div className="flex flex-col justify-center ml-2">
                        <div className="uppercase text-left">{upgrade.name.toUpperCase()}</div>
                        <div className="flex items-center">
                            <div className="w-[131px] mt-[5px] flex items-center p-[2px] relative bg-[#1A4B55] rounded-lg border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]">
                                {/* <div className="shadow-[inset_0_-1.5px_0_rgba(0,0,0,0.25)] bg-[linear-gradient(to_bottom,_#60FFB1_0%,_#1EE584_21%,_#2BDD86_50%,_#00D96F_92%)] flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg"></div>
                                <div className="flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg"></div>
                                <div className="flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg"></div>
                                <div className="flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg"></div>
                                <div className="flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg"></div> */}
                                {Array.from({ length: maxLevel }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`${userUpgradeLevel > i && 'shadow-[inset_0_-1.5px_0_rgba(0,0,0,0.25)] bg-[linear-gradient(to_bottom,_#60FFB1_0%,_#1EE584_21%,_#2BDD86_50%,_#00D96F_92%)]'} flex-grow mx-[1px] flex flex-col w-[23px] h-[10px] relative bg-[#0E2A30] rounded-lg`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col items-end justify-center">
                    <div className="flex items-center">
                        {userUpgradeLevel !== maxLevel && (
                            <>
                                <img className="mr-[4px]" src={"/fish-icon.png"} width={24} height={24} alt="" />
                                <div className="text-[14px]">{currentLevel.upgradePrice}</div>
                            </>
                        )}
                    </div>
                    <div className="my-[2px]"></div>
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex justify-center items-center w-[24px] h-[24px] p-[12px] bg-[#FFF] rounded-sm border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]"
                    >
                        <ArrowDownIcon
                            className={`flex-shrink-0 w-[12px] h-[12px] transform transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                </div>
            </div>

            <div
                ref={contentRef}
                className="flex justify-start flex-col"
                style={{
                    maxHeight: height + 'px',
                    overflow: 'hidden',
                    transition: 'max-height 0.4s ease, opacity 0.3s ease',
                }}
            >
                <div className="mt-2 text-[14px] text-left">{upgrade.description}</div>
                <div className="text-[14px] mt-2 flex justify-between text-[#C7F4FE]">
                    <div>{upgrade.upgradeLabel}</div>
                    {nextLevel ? (
                        <div>{`${currentLevel.value}${upgrade.unit} -> ${nextLevel.value}${upgrade.unit}`}</div>
                    ) : (
                        <div>{`${currentLevel.value}${upgrade.unit}`}</div>
                    )}

                </div>

                {currentLevel?.upgradePrice as number > apiUser.fishes ? (
                    <PrimaryButton
                        onClick={handleUpgrade}
                        className="py-2 mt-2 w-full"
                        color="red"
                        disabled={true}
                    >
                        NOT ENOUGH FISH
                    </PrimaryButton>
                ) : (
                    <PrimaryButton
                        onClick={handleUpgrade}
                        className="py-2 mt-2 w-full"
                        color={isUpgrading ? "green" : "green"}
                        disabled={userUpgradeLevel === maxLevel || isUpgrading}
                    >
                        {isUpgrading
                            ? "..."
                            : userUpgradeLevel === maxLevel
                                ? "MAXED OUT"
                                : "UPGRADE"}
                    </PrimaryButton>
                )}
            </div>
        </div>
    )
}