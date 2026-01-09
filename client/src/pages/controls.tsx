import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard as KeyboardIcon } from "lucide-react";
import { useUI } from "@/hooks/use-ui";

const Key = ({ label, action, active, className = "" }: { label: string, action: string, active?: boolean, className?: string }) => (
  <div className={`flex flex-col items-center gap-1 ${className}`}>
    <div className={`w-12 h-12 flex items-center justify-center border-2 rounded font-bold text-lg shadow-md transition-all
      ${active ? 'bg-violet-600 border-violet-400 text-white shadow-violet-500/50 scale-105' : 'bg-violet-950/40 border-violet-500/30 text-violet-200 shadow-inner'}`}>
      {label}
    </div>
    <span className="uppercase font-black tracking-tighter text-violet-400/70 text-center leading-none max-w-[120px] font-pixel-content" style={{ fontSize: '0.78rem' }}>
      {action}
    </span>
  </div>
);

const ArrowKey = ({ dir, action, active }: { dir: 'up' | 'down' | 'left' | 'right', action: string, active?: boolean }) => {
  const icons = {
    up: "↑",
    down: "↓",
    left: "←",
    right: "→"
  };
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold text-lg shadow-md
        ${active ? 'bg-violet-600 border-violet-400 text-white shadow-violet-500/50' : 'bg-violet-950/40 border-violet-500/30 text-violet-300'}`}>
        {icons[dir]}
      </div>
      <span className="uppercase font-black tracking-tighter text-violet-400/70 font-pixel-content" style={{ fontSize: '0.65rem' }}>{action}</span>
    </div>
  );
};

export default function Controls() {
  const { openModal, closeModal } = useUI();

  useEffect(() => {
    openModal("controls");
    return () => closeModal();
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[160] pointer-events-auto overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-3xl bg-slate-950 border-violet-500 border-2 pointer-events-auto rounded-none shadow-2xl shadow-violet-500/20 font-pixel">
        <CardHeader className="border-b border-violet-500/30 bg-violet-950/20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-violet-500 text-2xl uppercase font-black tracking-tighter flex items-center gap-3">
                <KeyboardIcon className="w-6 h-6" />
                Game Controls
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-6">
          {/* Main Keyboard Section */}
          <div className="space-y-6">
            {/* Category: Items */}
            <div className="flex flex-col items-center gap-3 bg-violet-950/10 p-4 rounded-lg border border-violet-500/10">
              <h3 className="text-violet-500 font-black uppercase tracking-[0.4em] font-pixel-label" style={{ fontSize: '1.17rem' }}>Items Keys</h3>
              <div className="flex gap-4">
                <Key label="Q" action="Heal HP" active />
                <Key label="W" action="Rest. Kiarc" active />
                <Key label="E" action="Immunity" active />
                <Key label="R" action="Score X2" active />
              </div>
            </div>

            {/* Category: Basic Keys */}
            <div className="flex flex-col items-center gap-3 bg-violet-950/10 p-4 rounded-lg border border-violet-500/10">
              <h3 className="text-violet-500 font-black uppercase tracking-[0.4em] font-pixel-label" style={{ fontSize: '1.17rem' }}>Basic Keys</h3>
              <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
                {/* Movement */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="flex flex-col items-center gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <div />
                      <ArrowKey dir="up" action="Jump" active />
                      <div />
                      <ArrowKey dir="left" action="Left" active />
                      <ArrowKey dir="down" action="Crouch" active />
                      <ArrowKey dir="right" action="Right" active />
                    </div>
                  </div>

                  {/* System & Extra Combat */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-wrap justify-center gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <Key label="Z" action="Punch" active />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Key label="X" action="ChargeKiArc" active />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Key label="C" action="MagicKiaArc" active />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <Key label="D" action="Defense" active />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-16 h-8 flex items-center justify-center border-2 border-violet-500/30 bg-violet-950/40 rounded font-bold text-xs text-violet-200">
                        ESC
                      </div>
                      <span className="text-[9px] uppercase font-black tracking-tighter text-violet-400/70">Pause / Menu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category: Specials */}
            <div className="flex flex-col items-center gap-4 bg-violet-950/10 p-4 rounded-lg border border-violet-500/10">
              <h3 className="text-violet-500 font-black uppercase tracking-[0.4em] font-pixel-label" style={{ fontSize: '1.17rem' }}>Specials</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                <div className="flex flex-col items-center gap-1">
                  <Key label="V" action="ArcKamehameha" active />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Key label="B" action="ArcGenkiDama" active />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Key label="F" action="ArcKiExplosion" active />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Key label="S" action="ArcMeteor" active />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-center pt-2">
            <Button 
              onClick={closeModal}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-8 h-10 text-base uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              CLOSE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
