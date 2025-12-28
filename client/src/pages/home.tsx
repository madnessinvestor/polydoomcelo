import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2 } from "lucide-react";

declare global {
  interface Window {
    arc?: any;
    isArcConnected?: boolean;
    game?: Phaser.Game;
  }
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = () => {
    setIsConnected(true);
  };

  useEffect(() => {
    if (isConnected) {
      import("@/lib/game").then((mod) => {
        mod.initGame();
      });
    }
  }, [isConnected]);

  // Remover a verificação visual e ir direto para o container do jogo
  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center overflow-hidden">
      <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden" />
      <div className="mt-4 text-slate-400 text-sm flex gap-4">
        <span>Setas: Mover/Pular</span>
        <span>Z: Soco</span>
        <span>X: Carregar Kiarc</span>
        <span>C: Magia</span>
        <span>V: Arcamehameha</span>
      </div>
    </div>
  );
}
