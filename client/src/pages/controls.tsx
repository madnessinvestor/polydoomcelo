import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Keyboard as KeyboardIcon } from "lucide-react";
import { useUI } from "@/hooks/use-ui";

const Key = ({ label, action, active, className = "" }: { label: string, action: string, active?: boolean, className?: string }) => (
  <div className={`flex flex-col items-center gap-1 ${className}`}>
    <div className={`w-12 h-12 flex items-center justify-center border-2 rounded font-bold text-lg shadow-md transition-all
      ${active ? 'bg-violet-500 border-white text-white shadow-violet-500/50 scale-105' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
      {label}
    </div>
    <span className="text-[10px] uppercase font-black tracking-tighter text-slate-500 text-center leading-none max-w-[60px]">
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
      <div className={`w-10 h-10 flex items-center justify-center border-2 rounded font-bold text-lg
        ${active ? 'bg-violet-500 border-white text-white shadow-violet-500/50' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
        {icons[dir]}
      </div>
      <span className="text-[9px] uppercase font-black tracking-tighter text-slate-500">{action}</span>
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
      <Card className="w-full max-w-4xl bg-slate-950 border-violet-500 border-2 pointer-events-auto rounded-none shadow-2xl shadow-violet-500/20">
        <CardHeader className="border-b border-violet-500/30 bg-violet-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost" onClick={closeModal} className="text-violet-500 hover:text-violet-400 hover:bg-violet-500/10">
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <CardTitle className="text-violet-500 text-3xl uppercase font-black tracking-tighter flex items-center gap-3">
                <KeyboardIcon className="w-8 h-8" />
                Battle Controls
              </CardTitle>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-8 space-y-12">
          {/* Main Keyboard Section */}
          <div className="space-y-8">
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-violet-500/50 font-black uppercase text-xs tracking-[0.3em]">Action Keys</h3>
              
              {/* Row 1: Potions */}
              <div className="flex gap-4">
                <Key label="Q" action="Heal HP" />
                <Key label="W" action="Rest. Kiarc" />
                <Key label="E" action="Immunity" />
                <Key label="R" action="Score X2" />
                <div className="w-8" /> {/* spacer */}
                <Key label="F" action="Interaction" className="opacity-50" />
              </div>

              {/* Row 2: Combat */}
              <div className="flex gap-4">
                <Key label="Z" action="Punch" active />
                <Key label="X" action="Arcki" active />
                <Key label="C" action="Kiarc" active />
                <Key label="V" action="Genkidama" active />
                <div className="w-8" /> {/* spacer */}
                <Key label="B" action="Burst" className="opacity-50" />
              </div>
            </div>
          </div>

          {/* Movement & Navigation Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-violet-500/20 pt-10">
            {/* Arrows Layout */}
            <div className="flex flex-col items-center gap-4">
              <h3 className="text-violet-500/50 font-black uppercase text-xs tracking-[0.3em] mb-2">Movement</h3>
              <div className="grid grid-cols-3 gap-2">
                <div />
                <ArrowKey dir="up" action="Jump" />
                <div />
                <ArrowKey dir="left" action="Left" />
                <ArrowKey dir="down" action="Crouch" />
                <ArrowKey dir="right" action="Right" />
              </div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2">
                Double Tap Arrows to <span className="text-violet-400">Dash</span>
              </p>
            </div>

            {/* Special Utility Keys */}
            <div className="flex flex-col items-center gap-6">
              <h3 className="text-violet-500/50 font-black uppercase text-xs tracking-[0.3em] mb-2">System</h3>
              <div className="flex gap-8">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-32 h-10 flex items-center justify-center border-2 border-slate-700 bg-slate-800 rounded font-bold text-sm text-slate-400">
                    SPACE
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-tighter text-slate-500">Jump / confirm</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-10 flex items-center justify-center border-2 border-slate-700 bg-slate-800 rounded font-bold text-sm text-slate-400">
                    ESC
                  </div>
                  <span className="text-[10px] uppercase font-black tracking-tighter text-slate-500">Pause / Menu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={closeModal}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-black px-16 h-14 text-xl uppercase tracking-[0.1em] rounded-none transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,107,107,0.3)] border-2 border-black"
            >
              Back to Battle
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
