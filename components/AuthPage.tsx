import ConnectButton from "./ConnectButton";

type AuthPageProps = {
    address?: string;
    isRegistered: boolean;
    register: () => void;
    isLoading: boolean;
    isConnected: boolean;
};

const AuthPage = ({
    address,
    isRegistered,
    register,
    isLoading,
    isConnected,
}: AuthPageProps) => {

    return (
        <div
            className="h-full w-full flex flex-col items-center justify-between relative"
            style={{ backgroundImage: "url('/bg.webp')" }}
        >
            <img src="/top.svg" alt="top" className="w-full" />

            <div className="flex flex-col items-center justify-center gap-4 mx-12">
                <img src="/nooter.webp" alt="nooter" />
                <img src="/hero.webp" alt="hero" />

                {!isConnected ? (
                    <ConnectButton />
                ) : !isRegistered ? (
                    <>
                        {address && <div className="absolute top-[20px] right-[10px]">
                            <div className="relative flex items-center justify-center gap-[1px] py-[2px] px-[6px]"
                                style={{ background: 'url(/wallet-badge-bg.svg)' }}>
                                {address.slice(0, 4) + '...' + address.slice(-3)}
                                <img src="/wallet-icon.png" className="" />
                            </div>
                        </div>
                        }
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-[24px]">Create your nooter for</p>
                                <div className="flex items-center text-[32px]">
                                    <img src="/eth-icon.webp" className="h-[47px]" alt="eth" />
                                    <p>0.0028</p>
                                </div>
                                <button
                                    className="rounded bg-green-500 px-4 py-2 text-white uppercase"
                                    onClick={() => register()}
                                >
                                    Create nooter
                                </button>
                            </div>
                        )}
                    </>
                ) : null}
            </div>

            <img src="/bottom.svg" alt="bottom" className="w-full" />
        </div>
    )
}

export default AuthPage