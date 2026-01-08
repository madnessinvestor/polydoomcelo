import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Score } from "@shared/schema";
import { useUI } from "@/hooks/use-ui";
import { useEffect } from "react";

function PixelCrown({ rank }: { rank: number }) {
  if (rank > 3) return null;

  const bronze = "#CD7F32";
  const color = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : bronze;

  // Optimized 8-bit crown design (7x5 pixel grid for better clarity)
  const grid = [
    1, 0, 1, 0, 1, // Points
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1  // Base
  ];

  return (
    <div className="inline-grid grid-cols-5 gap-px w-5 h-4 ml-2 align-middle flex-shrink-0">
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

export function Leaderboard() {
  const { openModal, closeModal } = useUI();
  const { data: scores = [], isLoading } = useQuery<Score[]>({
    queryKey: ["/api/leaderboard"],
  });

  useEffect(() => {
    openModal("leaderboard");
    return () => closeModal();
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full bg-slate-900 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-400">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-slate-400">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  // Sort by score descending to get rankings
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-[160] bg-black/20 backdrop-blur-none flex items-center justify-center p-4 pointer-events-auto" onPointerDown={(e) => e.stopPropagation()}>
      <Card className="w-full max-w-5xl h-[85vh] bg-slate-900 border-slate-700 pointer-events-auto flex flex-col" onPointerDown={(e) => e.stopPropagation()}>
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          {sortedScores.length === 0 ? (
            <div className="text-slate-400 text-center py-8">
              Nenhum score registrado ainda
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="w-full min-w-[800px]">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-4 bg-slate-800 sticky top-0 z-10 border-b border-slate-700">
                  <div className="flex-shrink-0 w-16 text-center font-bold text-yellow-400 text-base">
                    #
                  </div>
                  <div className="flex-1 font-bold text-white text-base">
                    ArcUser
                  </div>
                  <div className="w-24 text-center font-bold text-yellow-400 text-base">
                    Enemies
                  </div>
                  <div className="w-24 text-center font-bold text-yellow-400 text-base">
                    Wave
                  </div>
                  <div className="w-24 text-center font-bold text-yellow-400 text-base">
                    Time
                  </div>
                  <div className="w-32 text-right font-bold text-yellow-400 text-base">
                    Score
                  </div>
                </div>

                {/* Rows */}
                <div className="px-2">
                  {sortedScores.map((score, index) => (
                    <div
                      key={score.id}
                      className="flex items-center gap-4 px-4 py-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                      data-testid={`leaderboard-entry-${score.id}`}
                    >
                      <div className="flex-shrink-0 w-16 text-center font-bold text-slate-400 text-base">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-white truncate text-base font-medium flex items-center">
                        {score.playerName}
                        <PixelCrown rank={index + 1} />
                      </div>
                      <div className="w-24 text-center text-slate-300 text-base">
                        {score.enemiesDefeated}
                      </div>
                      <div className="w-24 text-center text-slate-300 text-base">
                        {score.wave}
                      </div>
                      <div className="w-24 text-center text-slate-300 text-base tabular-nums">
                        {Math.floor(score.playTime / 60)}:{(score.playTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="w-32 text-right font-bold text-yellow-400 text-xl tabular-nums">
                        {score.score.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <div className="p-6 border-t border-slate-800 flex justify-center flex-shrink-0">
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none shadow-lg"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
