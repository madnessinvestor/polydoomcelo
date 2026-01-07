import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Keyboard } from "lucide-react";
import { useUI } from "@/hooks/use-ui";

export default function Controls() {
  const { openModal, closeModal } = useUI();

  useEffect(() => {
    openModal("controls");
    return () => closeModal();
  }, []);

  const controlGroups = [
    {
      title: "Movement & Navigation",
      items: [
        { label: "Move Left", key: "← Arrow" },
        { label: "Move Right", key: "→ Arrow" },
        { label: "Jump", key: "↑ Arrow / Space" },
        { label: "Crouch", key: "↓ Arrow" },
        { label: "Dash Left", key: "Double Tap ←" },
        { label: "Dash Right", key: "Double Tap →" },
        { label: "Pause / Menu", key: "ESC" },
      ]
    },
    {
      title: "Combat & Potions",
      items: [
        { label: "Punch Attack", key: "Z" },
        { label: "Charge Kiarc", key: "X (Hold)" },
        { label: "Magic Attack", key: "C" },
        { label: "Special Attack", key: "V" },
        { label: "Heal HP", key: "Q" },
        { label: "Restore Ki", key: "W" },
        { label: "Immunity", key: "E" },
        { label: "Double Score", key: "R" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-lg bg-slate-900 border-violet-500 pointer-events-auto rounded-none">
        <CardHeader className="border-b border-violet-500">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-violet-500 hover:text-violet-400">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-violet-500 text-2xl uppercase font-bold tracking-tighter flex items-center gap-2">
              <Keyboard className="w-6 h-6" />
              Controls
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {controlGroups.map((group) => (
                <div key={group.title} className="space-y-4">
                  <h3 className="text-violet-500 font-black uppercase text-xs tracking-[0.2em] border-b border-violet-500/20 pb-2">
                    {group.title}
                  </h3>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.label} className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 uppercase font-bold tracking-tight">{item.label}</span>
                        <span className="text-white font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 min-w-[60px] text-center text-[10px]">
                          {item.key}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={closeModal}
              className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-black"
            >
              CLOSE
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
