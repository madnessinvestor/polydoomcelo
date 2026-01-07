import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History as HistoryIcon } from "lucide-react";
import { useUI } from "@/hooks/use-ui";

export default function History() {
  const { openModal, closeModal } = useUI();

  useEffect(() => {
    openModal("history");
    return () => closeModal();
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-2xl bg-slate-900 border-amber-400 pointer-events-auto">
        <CardHeader className="border-b border-amber-500/30 bg-amber-950/20 relative">
          <div className="flex items-center gap-3">
            <CardTitle className="text-amber-400 text-3xl uppercase font-black tracking-tighter flex items-center gap-3">
              <HistoryIcon className="w-8 h-8" />
              History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="aspect-video bg-black border-2 border-amber-400 overflow-hidden relative group">
            <video 
              src="/attached_assets/gamehistory_1767067604123.mp4" 
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          </div>
        </CardContent>
        <div className="p-6 border-t border-slate-800 flex justify-center">
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg border-2 border-black"
          >
            CLOSE
          </Button>
        </div>
      </Card>
    </div>
  );
}
