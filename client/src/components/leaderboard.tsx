import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Score } from "@shared/schema";
import { useUI } from "@/hooks/use-ui";
import { useEffect } from "react";

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
    <Card className="w-full bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedScores.length === 0 ? (
          <div className="text-slate-400 text-center py-8">
            Nenhum score registrado ainda
          </div>
        ) : (
          <ScrollArea className="h-[400px] w-full border border-slate-700 rounded-lg">
            <div className="w-full">
              {/* Header */}
              <div className="flex items-center gap-4 px-4 py-3 bg-slate-800 sticky top-0 z-10 border-b border-slate-700">
                <div className="flex-shrink-0 w-12 text-center font-bold text-yellow-400 text-sm">
                  #
                </div>
                <div className="flex-1 font-bold text-white">
                  ArcUser
                </div>
                <div className="w-20 text-center font-bold text-yellow-400">
                  Wave
                </div>
                <div className="w-24 text-right font-bold text-yellow-400">
                  Score
                </div>
              </div>

              {/* Rows */}
              <div>
                {sortedScores.map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center gap-4 px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    data-testid={`leaderboard-entry-${score.id}`}
                  >
                    <div className="flex-shrink-0 w-12 text-center font-bold text-slate-400 text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 text-white">
                      {score.playerName}
                    </div>
                    <div className="w-20 text-center text-slate-300">
                      {score.wave}
                    </div>
                    <div className="w-24 text-right font-bold text-yellow-400 text-lg">
                      {score.score.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
