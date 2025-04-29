type SkinsProps = {
    onClose: () => void;
    address: string;
};

const Skins = ({ onClose, address }: SkinsProps) => {
    if (!address) return null;

    return (
        <div className="mx-auto mt-10 flex w-full flex-col items-center gap-4 md:max-w-[500px] h-[80vh]">
            <div className="relative w-full w-[80%]">
                <button
                    className="mt-4 rounded bg-blue-500 px-4 py-2 text-white absolute top-0 right-0"
                    onClick={onClose}
                >
                    Back
                </button>
            </div>

            <h2 className="text-2xl font-bold">Your skins</h2>

            <p>Coming soon</p>
        </div>
    );
};

export default Skins