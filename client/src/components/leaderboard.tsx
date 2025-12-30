import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Zap } from "lucide-react";
import type { Score } from "@shared/schema";

export function Leaderboard() {
  const { data: scores = [], isLoading } = useQuery<Score[]>({
    queryKey: ["/api/leaderboard"],
  });

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

  return (
    <Card className="w-full bg-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-400">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {scores.length === 0 ? (
            <div className="text-slate-400 text-center py-4">
              Nenhum score registrado ainda
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  data-testid={`leaderboard-entry-${score.id}`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 font-bold">
                      <span className="text-yellow-400">#{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-white font-semibold">
                        {score.playerName}
                      </div>
                      <div className="text-slate-400 text-sm">
                        {score.enemiesDefeated} inimigos derrotados
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 font-bold text-lg">
                      {score.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
