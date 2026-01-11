import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Trophy } from "lucide-react";
import { useUI } from "@/hooks/use-ui";
import { useQuery } from "@tanstack/react-query";

function PixelCrown({ rank }: { rank: number }) {
  if (rank > 3) return null;

  const bronze = "#CD7F32";
  const color = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : bronze;

  // Optimized 8-bit crown design (5x4 pixel grid for better clarity)
  const grid = [
    1, 0, 1, 0, 1, // Points
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1  // Base
  ];

  return (
    <div className="inline-grid grid-cols-5 gap-px w-5 h-4 ml-2 align-middle flex-shrink-0" style={{ pointerEvents: 'none' }}>
      {grid.map((pixel, i) => (
        <div
          key={i}
          className="w-full h-full"
          style={{ backgroundColor: pixel ? color : 'transparent' }}
        />
      ))}
    </div>
  );
}

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
    <div className="fixed inset-0 w-full h-full bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-[160] pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-5xl max-h-[90vh] sm:h-[85vh] bg-slate-900 border-amber-400 pointer-events-auto flex flex-col scale-[0.9] sm:scale-100 origin-center transition-transform">
        <CardHeader className="border-b border-amber-400 flex-shrink-0 p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button size="icon" variant="ghost" onClick={closeModal} className="text-amber-400 hover:text-amber-300 w-8 h-8 sm:w-10 sm:h-10">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <CardTitle className="text-yellow-400 text-lg sm:text-2xl uppercase font-bold tracking-tighter flex items-center gap-2 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
              Leaderboard
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:pt-6 flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 pr-2 sm:pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-amber-400 animate-pulse font-bold tracking-widest uppercase text-xs sm:text-base">Loading...</span>
              </div>
            ) : scores?.length === 0 ? (
              <div className="text-center text-slate-400 py-6 sm:py-10 italic text-sm sm:text-base">No scores yet. Be the first!</div>
            ) : (
              <div className="space-y-2 sm:space-y-4">
                {scores?.map((score, index) => (
                  <div key={score.id} className="flex items-center justify-between p-2 sm:p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-6">
                      <span className={`text-lg sm:text-2xl font-black min-w-[2rem] sm:min-w-[3rem] text-center ${index < 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-white text-sm sm:text-lg font-bold uppercase tracking-tight flex items-center">
                          {score.playerName}
                          <PixelCrown rank={index + 1} />
                        </div>
                        <div className="text-[10px] sm:text-sm text-slate-400 uppercase">{score.enemiesDefeated} enemies defeated</div>
                      </div>
                    </div>
                    <div className="text-amber-400 font-black text-lg sm:text-2xl tabular-nums">{score.score.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="mt-3 sm:mt-6 flex-shrink-0">
            <Button onClick={closeModal} className="w-full bg-amber-400 hover:bg-amber-500 text-black font-extrabold text-sm sm:text-xl py-4 sm:py-8 uppercase rounded-none shadow-xl h-auto">
              Back to Menu
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
