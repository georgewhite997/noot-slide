"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";


export default function ConnectButton() {
    const { login } = useLoginWithAbstract();
    const { status } = useAccount();

    if (status === "connected")
        return null;


    if (status === "connecting" || status === "reconnecting") {
        return (
            <div className="flex items-center justify-center w-10 h-10">
                loading...
            </div>
        );
    }

    return (
        <button className="px-3 h-[48px] rounded-full text-black text-sm hover:text-white"
            style={{ background: "linear-gradient(130deg,#74ffde,#00de73 25%,#41f09c 51%,#03d26e 77%,#00c466)", border: "1px solid #0ee37d" }}
            onClick={login}>

            Connect with Abstract
        </button>
    );
}