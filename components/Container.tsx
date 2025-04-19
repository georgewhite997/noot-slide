"use client";
import { AbstractWalletProvider } from "@abstract-foundation/agw-react";
import { chain } from "@/utils";

export const Container = ({ children }: { children: React.ReactNode }) => {
  return (
    <AbstractWalletProvider chain={chain}>{children}</AbstractWalletProvider>
  );
};
