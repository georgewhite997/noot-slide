"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";


export default function ConnectButton() {
    const { login } = useLoginWithAbstract();
    const { address, status } = useAccount();

    if (status === "connected" && address)
        return null;

    return (
        <button className="px-3 h-[48px] rounded-full text-black text-sm hover:cursor-pointer hover:text-white"
            style={{ background: "linear-gradient(130deg,#74ffde,#00de73 25%,#41f09c 51%,#03d26e 77%,#00c466)", border: "1px solid #0ee37d" }}
            onClick={login}>

            Connect with Abstract
        </button>
    );
}