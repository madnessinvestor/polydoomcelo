import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Keyboard as KeyboardIcon } from "lucide-react";
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
      <Card className="w-full max-w-4xl bg-slate-900 border-2 border-green-500 text-white max-h-[90vh] flex flex-col overflow-hidden rounded-none shadow-[0_0_20px_rgba(34,197,94,0.3)] font-pixel" onPointerDown={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-green-500/30 bg-green-950/20 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="text-green-500 text-3xl uppercase font-black tracking-tighter flex items-center gap-3">
                <KeyboardIcon className="w-8 h-8" />
                Controls
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Category: Items */}
              <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors rounded-none">
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <h3 className="text-green-500 font-bold uppercase font-pixel-label" style={{ fontSize: '1.43rem' }}>Items Keys</h3>
                  <div className="flex flex-wrap justify-center gap-6">
                    <Key label="Q" action="Heal HP" active />
                    <Key label="W" action="Rest. Kiarc" active />
                    <Key label="E" action="Immunity" active />
                    <Key label="R" action="Score X2" active />
                  </div>
                </CardContent>
              </Card>

              {/* Category: Basic Keys */}
              <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors rounded-none">
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <h3 className="text-green-500 font-bold uppercase font-pixel-label" style={{ fontSize: '1.43rem' }}>Basic Keys</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="flex flex-col items-center gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div />
                        <ArrowKey dir="up" action="Jump" active />
                        <div />
                        <ArrowKey dir="left" action="Left" active />
                        <ArrowKey dir="down" action="Crouch" active />
                        <ArrowKey dir="right" action="Right" active />
                      </div>
                      <div className="text-center mt-2 px-2 py-1 bg-green-500/10 rounded border border-green-500/20">
                        <p className="text-[10px] text-green-300 font-bold uppercase tracking-wider font-pixel-content" style={{ fontSize: '0.65rem' }}>
                          Quick Dash: Double Tap Arrows
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center content-center gap-6">
                      <Key label="Z" action="Punch (Melee)" active />
                      <Key label="X" action="Charge KiArc (Hold)" active />
                      <Key label="C" action="Magic KiArc" active />
                      <Key label="D" action="Defend (Hold)" active />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-16 h-8 flex items-center justify-center border-2 border-green-500/30 bg-green-950/40 rounded font-bold text-xs text-white">
                          ESC
                        </div>
                        <span className="uppercase font-black tracking-tighter text-green-500/70 font-pixel-content" style={{ fontSize: '0.65rem' }}>Pause / Game Menu</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Category: Specials */}
              <Card className="bg-slate-800/50 border-slate-700 hover:border-green-500/50 transition-colors rounded-none">
                <CardContent className="p-4 flex flex-col items-center gap-4">
                  <h3 className="text-green-500 font-bold uppercase font-pixel-label" style={{ fontSize: '1.43rem' }}>Special Abilities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <Key label="V" action="Arc-Kamehameha" active />
                    <Key label="B" action="Arc-GenkiDama" active />
                    <Key label="F" action="Arc-Ki Explosion" active />
                    <Key label="S" action="Arc-Meteor" active />
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </CardContent>

        <div className="p-6 border-t border-slate-800 flex justify-center">
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            CLOSE
          </Button>
        </div>
      </Card>
    </div>
  );
}
