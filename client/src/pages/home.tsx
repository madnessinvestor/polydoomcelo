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
      <div className="mt-4 text-slate-400 text-2xl flex flex-wrap justify-center gap-x-6 gap-y-2 px-4">
        <div className="flex gap-2">
          <span className="text-white">Arrow Keys:</span>
          <span className="text-slate-400">Move / Jump</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">Double-Click Arrow:</span>
          <span className="text-slate-400">Dash</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">Z:</span>
          <span className="text-slate-400">Punch</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">X:</span>
          <span className="text-slate-400">Charge KiArc</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">C:</span>
          <span className="text-slate-400">Magic</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">V:</span>
          <span className="text-slate-400">ArcKamehameha</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">B:</span>
          <span className="text-slate-400">ArcGenkiDama</span>
        </div>
        <div className="flex gap-2">
          <span className="text-white">F:</span>
          <span className="text-slate-400">Explosion KiArc</span>
        </div>
      </div>
    </div>
  );
}
