"use client";
import { ThreeCanvas } from "@/components/ThreeCanvas";
import { Gui } from "@/components/Gui";

export default function Home() {
  return (
    <div className="relative h-full overflow-hidden">
      <Gui />
      <ThreeCanvas />
    </div>
  );
}
