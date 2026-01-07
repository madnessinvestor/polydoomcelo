import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Trophy } from "lucide-react";
import { useUI } from "@/hooks/use-ui";
import { useQuery } from "@tanstack/react-query";

interface Score {
  id: number;
  playerName: string;
  score: number;
  enemiesDefeated: number;
}

export default function Leaderboard() {
  const { openModal, closeModal } = useUI();

  useEffect(() => {
    openModal("leaderboard");
    return () => closeModal();
  }, []);

  const { data: scores, isLoading } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
  });

  return (
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-md bg-slate-900 border-amber-400 pointer-events-auto">
        <CardHeader className="border-b border-amber-400">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-amber-400 hover:text-amber-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-amber-400 text-2xl uppercase font-bold tracking-tighter flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              Leaderboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-amber-400 animate-pulse font-bold tracking-widest uppercase">Loading...</span>
              </div>
            ) : scores?.length === 0 ? (
              <div className="text-center text-slate-400 py-10 italic">No scores yet. Be the first!</div>
            ) : (
              <div className="space-y-4">
                {scores?.map((score, index) => (
                  <div key={score.id} className="flex items-center justify-between p-3 border-b border-slate-800 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className={`text-xl font-black ${index < 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-white font-bold uppercase tracking-tight">{score.playerName}</div>
                        <div className="text-xs text-slate-400 uppercase">{score.enemiesDefeated} enemies defeated</div>
                      </div>
                    </div>
                    <div className="text-amber-400 font-black text-xl tabular-nums">{score.score}</div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <Button onClick={closeModal} className="w-full mt-6 bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-lg py-6 uppercase rounded-none">
            Back to Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
