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
      title: "Basic Movement",
      items: [
        { label: "Movement", key: "Arrow Keys" },
        { label: "Jump", key: "Up / Space" },
        { label: "Dash / Evade", key: "Double Tap Arrows" },
        { label: "Pause / Menu", key: "ESC" },
      ]
    },
    {
      title: "Combat & Specials",
      items: [
        { label: "Punch", key: "Z" },
        { label: "Charge Arcki", key: "X (Hold)" },
        { label: "Magic Kiarc", key: "C" },
        { label: "Special Attack", key: "V" },
        { label: "HP Potion", key: "Q" },
        { label: "Ki Potion", key: "W" },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-lg bg-slate-900 border-amber-400 pointer-events-auto">
        <CardHeader className="border-b border-amber-400">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-amber-400 hover:text-amber-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-amber-400 text-2xl uppercase font-bold tracking-tighter flex items-center gap-2">
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
                  <h3 className="text-amber-400 font-black uppercase text-xs tracking-[0.2em] border-b border-amber-400/20 pb-2">
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
          <Button onClick={closeModal} className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-lg py-6 uppercase rounded-none">
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
