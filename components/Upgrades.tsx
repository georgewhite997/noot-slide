type UpgradesProps = {
    onClose: () => void;
    address: string;
};

export const Upgrades = ({
    onClose,
    address,
}: UpgradesProps) => {
    return (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <button
                className="text-white relative w-[40px] h-[40px] mx-[24px] mb-[16px]"
                onClick={onClose}
            >
                <img src="/small-button.png" alt="bg" className="absolute top-0 left-0" />
                <img src="/arrow.png" alt="back" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10]" />
            </button>

            <div className="w-full px-[24px] flex justify-center h-full items-center">
                <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">
                    <h2 className="text-2xl font-bold">Upgrades</h2>

                    <p>Coming soon..</p>

                </div>
            </div>
        </div>
    );
};