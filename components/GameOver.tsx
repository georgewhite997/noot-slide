import { GameState } from "@/atoms";

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
    <div className="w-full px-[32px] flex justify-center h-full items-center">
        <div className="w-full rounded-md bg-[#C7F4FE] p-[24px] max-h-max">

            <h2 className="text-2xl font-bold text-center mb-[24px]">Game over</h2>

            <p className="text-2xl text-white">Score: {score}</p>
            <p className="text-2xl text-white">Collected fishes: {currentFishes}</p>

            <button
                className="mt-4 rounded bg-green-500 px-4 py-2 text-white w-full"
                onClick={() => {
                    setGameState("playing");
                    setCurrentFishes(0);
                    setScore(0);
                }}
            >
                Play again
            </button>

            <button
                className="mt-2 rounded bg-blue-500 px-4 py-2 text-white block w-full"
                onClick={() => setGameState("in-menu")}
            >
                Back to menu
            </button>

        </div>
    </div>
);

export default GameOver;