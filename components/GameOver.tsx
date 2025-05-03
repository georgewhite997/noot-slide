import { GameState } from "@/atoms";
import PrimaryButton from "./buttons/PrimaryButton";

type GameOverProps = {
    score: number;
    currentFishes: number;
    setGameState: (gs: GameState) => void;
    setCurrentFishes: (n: number) => void;
    setScore: (n: number) => void;
    // setMenuState: (ms: MenuState) => void;
};

const GameOver = ({
    score,
    currentFishes,
    setGameState,
    setCurrentFishes,
    setScore,
    // setMenuState,
}: GameOverProps) => (
    // <div className="w-full px-[32px] flex justify-center h-full items-center">
    //     <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">

    //         <h2 className="text-2xl font-bold text-center mb-[24px]">Game over</h2>

    //         <p className="text-2xl text-white">Score: {score}</p>
    //         <p className="text-2xl text-white">Collected fish: {currentFishes}</p>

    //         <button
    //             className="mt-4 rounded bg-green-500 px-4 py-2 text-white w-full"
    //             onClick={() => {
    //                 setGameState("playing");
    //                 setCurrentFishes(0);
    //                 setScore(0);
    //             }}
    //         >
    //             Play again
    //         </button>

    //         <button
    //             className="mt-2 rounded bg-blue-500 px-4 py-2 text-white block w-full"
    //             onClick={() => setGameState("in-menu")}
    //         >
    //             Back to menu
    //         </button>

    //     </div>
    // </div>

    <div className="flex justify-center items-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-[402px] h-full">
        <div className={`flex flex-col items-center bg-[#C7F4FE] w-[350px] p-[24px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
            <h1 className="text-center text-[32px]">Game Over</h1>

            <div className="mt-[20px]"></div>

            <div className="flex w-full justify-between">
                <div className={`flex flex-col items-center bg-[#A5DEEB] w-[49%] h-fit p-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                    <img src="/fish-collected.png" alt="fish collected" />

                    <div className="mt-[8px] text-[14px] text-[#7EFFFF]">FISH COLLECTED</div>
                    <div className="text-[32px] mt-[-8px]">{currentFishes}</div>
                </div>
                <div className={`flex flex-col items-center bg-[#A5DEEB] w-[49%] h-fit p-[8px] rounded-md border-[2px] border-[#030303] shadow-[0px_2px_0px_rgba(0,0,0,0.45)]`}>
                    <img src="/meters-ran.png" alt="fish collected" />

                    <div className="mt-[8px] text-[14px] text-[#7EFFFF]">METERS RAN</div>
                    <div className="text-[32px] mt-[-8px]">{score}</div>
                </div>
            </div>

            <PrimaryButton onClick={() => {
                setCurrentFishes(0);
                setScore(0);
                setGameState("playing");
            }} className="mt-[24px] w-full h-[44px]" color="green">PLAY AGAIN</PrimaryButton>

            <PrimaryButton onClick={() => {
                setGameState('in-menu');
            }} className="mt-[10px] w-full h-[44px]" color="blue">BACK TO MENU</PrimaryButton>

        </div>
    </div>
);

export default GameOver;