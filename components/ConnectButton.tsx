"use client";

import { useLoginWithAbstract } from "@abstract-foundation/agw-react";
import { useAccount } from "wagmi";
import PrimaryButton from "./buttons/PrimaryButton";


export default function ConnectButton() {
    const { login } = useLoginWithAbstract();
    const { status } = useAccount();

    if (status === "connecting" || status === "reconnecting") {
        return (
            <div className="flex items-center justify-center w-10 h-10">
                loading...
            </div>
        );
    }

    return (
        <PrimaryButton
            color="green"
            className="mt-8"
            onClick={login}
        >
            CONNECT WITH ABSTRACT
        </PrimaryButton>
    );
}