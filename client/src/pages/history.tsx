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
    <div className="fixed inset-0 w-full h-full bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[160] pointer-events-auto overflow-y-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-4xl bg-slate-950 border-blue-500 border-2 pointer-events-auto rounded-none shadow-2xl shadow-blue-500/20 font-pixel">
        <CardHeader className="border-b border-blue-500/30 bg-blue-950/20 relative">
          <div className="flex items-center gap-3">
            <CardTitle className="text-blue-500 text-3xl uppercase font-black tracking-tighter flex items-center gap-3">
              <HistoryIcon className="w-8 h-8" />
              Game History
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6 font-pixel-content">
          <div className="aspect-video bg-black border-2 border-blue-500/30 overflow-hidden relative group shadow-2xl">
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
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            CLOSE
          </Button>
        </div>
      </Card>
    </div>
  );
}
