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
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = () => {
    setIsChecking(true);
    // Simular verificação da ARC Network
    setTimeout(() => {
      const connected = window.arc || window.isArcConnected === true || localStorage.getItem("arc_connected") === "true";
      setIsConnected(!!connected);
      setIsChecking(false);
    }, 800);
  };

  useEffect(() => {
    if (isConnected) {
      import("@/lib/game").then((mod) => {
        mod.initGame();
      });
    }
  }, [isConnected]);

  if (!isConnected) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 text-white p-4">
        <Card className="w-full max-w-md bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
              <ShieldCheck className="w-10 h-10 text-blue-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Gokuarc vs Criptoides</h1>
              <p className="text-slate-400">
                Conecte-se à ARC Network para jogar
              </p>
            </div>
            <Button 
              onClick={checkConnection} 
              disabled={isChecking}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
            >
              {isChecking ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar conexão"
              )}
            </Button>
            <p className="text-xs text-slate-500">
              Caso não possua o SDK, a conexão será simulada para fins de teste.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
