import PrimaryButton from "./buttons/PrimaryButton"

export const Confirmation = ({
    onBack,
    onYes
}: {
    onBack: () => void,
    onYes: () => void,
}) => {
    return (
        <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full bg-[rgba(0,0,0,0.8)]">
            <div className={`flex flex-col items-center bg-[#C7F4FE] w-[350px] h-fit p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                <h1 className="text-center text-[32px]">Are You Sure?</h1>

                <div className="mt-[20px]"></div>

                <img width={227} height={250} src="/are-you-sure.png" alt="are you sure img" />

                <div className="mt-4 w-full flex justify-between">
                    <PrimaryButton className="w-[49%] h-[44px]" color="blue" onClick={onBack}>BACK</PrimaryButton>
                    <PrimaryButton className="w-[49%] h-[44px]" color="red" onClick={onYes}>YES</PrimaryButton>
                </div>

            </div>
        </div>
    )
}