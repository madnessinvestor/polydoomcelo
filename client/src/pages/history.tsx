import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, PlayCircle } from "lucide-react";
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
        <CardHeader className="border-b border-amber-400">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-amber-400 hover:text-amber-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-amber-400 text-2xl uppercase font-bold tracking-tighter flex items-center gap-2">
              <PlayCircle className="w-6 h-6" />
              Game History
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
          <Button onClick={closeModal} className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-lg py-6 uppercase rounded-none">
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
