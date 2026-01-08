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

  // Optimized 8-bit crown design (5x4 pixel grid for better clarity)
  const grid = [
    1, 0, 1, 0, 1, // Points
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1, // Mid
    1, 1, 1, 1, 1  // Base
  ];

  return (
    <div 
      className="inline-grid grid-cols-5 align-middle flex-shrink-0 relative" 
      style={{ 
        pointerEvents: 'none',
        gap: '0.0625rem',
        width: '1.25em',
        height: '1em',
        marginLeft: '0.5em'
      }}
    >
      {grid.map((pixel, i) => (
        <div
          key={i}
          className="w-full h-full relative"
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
      <Card className="relative w-full bg-slate-900 border-slate-700 overflow-hidden" style={{ boxSizing: 'border-box' }}>
        <CardHeader className="relative">
          <CardTitle className="flex items-center text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" style={{ gap: '0.5rem', fontSize: '1.25rem' }}>
            <Trophy style={{ width: '1.25em', height: '1.25em' }} />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <div className="text-slate-400" style={{ fontSize: '1rem' }}>Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  // Sort by score descending to get rankings
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="fixed inset-0 z-[160] bg-black/20 backdrop-blur-none flex items-center justify-center pointer-events-auto" style={{ padding: '0.5rem' }} onPointerDown={(e) => e.stopPropagation()}>
      <Card 
        className="relative w-full bg-slate-900 border-slate-700 pointer-events-auto flex flex-col overflow-hidden origin-center transition-transform" 
        style={{ 
          maxWidth: '80rem',
          maxHeight: '90vh',
          height: '85vh',
          boxSizing: 'border-box',
          transform: 'scale(0.9)'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0 relative" style={{ padding: '0.75rem' }}>
          <CardTitle className="flex items-center text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" style={{ gap: '0.5rem', fontSize: 'clamp(1rem, 2vw, 1.5rem)' }}>
            <Trophy style={{ width: '1.25em', height: '1.25em' }} />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 relative" style={{ overflow: 'hidden', padding: 0 }}>
          {sortedScores.length === 0 ? (
            <div className="text-slate-400 text-center" style={{ padding: '2rem 0', fontSize: 'clamp(0.875rem, 1.5vw, 1rem)' }}>
              Nenhum score registrado ainda
            </div>
          ) : (
            <ScrollArea className="h-full w-full relative" style={{ overflow: 'hidden' }}>
              <div className="w-full relative" style={{ minWidth: '37.5rem', boxSizing: 'border-box' }}>
                {/* Header */}
                <div 
                  className="grid items-center bg-slate-800 sticky top-0 z-10 border-b border-slate-700 relative"
                  style={{
                    gridTemplateColumns: 'minmax(2.5rem, 4rem) minmax(8rem, 1fr) minmax(4rem, 6rem) minmax(4rem, 6rem) minmax(4rem, 6rem) minmax(5rem, 8rem)',
                    gap: 'clamp(0.5rem, 1vw, 1rem)',
                    padding: 'clamp(0.5rem, 1vw, 1rem) clamp(0.75rem, 1.5vw, 1.5rem)',
                    fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div className="text-center font-bold text-yellow-400 relative">
                    #
                  </div>
                  <div className="font-bold text-white relative">
                    ArcUser
                  </div>
                  <div className="text-center font-bold text-yellow-400 relative">
                    Enemies
                  </div>
                  <div className="text-center font-bold text-yellow-400 relative">
                    Wave
                  </div>
                  <div className="text-center font-bold text-yellow-400 relative">
                    Time
                  </div>
                  <div className="text-right font-bold text-yellow-400 relative">
                    Score
                  </div>
                </div>

                {/* Rows */}
                <div className="relative" style={{ padding: '0 clamp(0.25rem, 0.5vw, 0.5rem)' }}>
                  {sortedScores.map((score, index) => (
                    <div
                      key={score.id}
                      className="grid items-center border-b border-slate-800 hover:bg-slate-800/50 transition-colors relative"
                      style={{
                        gridTemplateColumns: 'minmax(2.5rem, 4rem) minmax(8rem, 1fr) minmax(4rem, 6rem) minmax(4rem, 6rem) minmax(4rem, 6rem) minmax(5rem, 8rem)',
                        gap: 'clamp(0.5rem, 1vw, 1rem)',
                        padding: 'clamp(0.5rem, 1vw, 1rem) clamp(0.5rem, 1vw, 1rem)',
                        fontSize: 'clamp(0.75rem, 1vw, 0.875rem)',
                        boxSizing: 'border-box'
                      }}
                      data-testid={`leaderboard-entry-${score.id}`}
                    >
                      <div className="text-center font-bold text-slate-400 relative">
                        {index + 1}
                      </div>
                      <div className="text-white truncate font-medium flex items-center relative">
                        <span className="truncate">{score.playerName}</span>
                        <PixelCrown rank={index + 1} />
                      </div>
                      <div className="text-center text-slate-300 relative">
                        {score.enemiesDefeated}
                      </div>
                      <div className="text-center text-slate-300 relative">
                        {score.wave}
                      </div>
                      <div className="text-center text-slate-300 tabular-nums relative">
                        {Math.floor(score.playTime / 60)}:{(score.playTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-right font-bold text-yellow-400 tabular-nums relative" style={{ fontSize: 'clamp(0.875rem, 1.25vw, 1.25rem)' }}>
                        {score.score.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          )}
        </CardContent>
        <div 
          className="border-t border-slate-800 flex justify-center flex-shrink-0 relative"
          style={{ padding: 'clamp(0.75rem, 1.5vw, 1.5rem)', boxSizing: 'border-box' }}
        >
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold uppercase tracking-wider rounded-none shadow-lg"
            style={{ 
              padding: '0 clamp(1.5rem, 3vw, 3rem)',
              height: 'clamp(2.5rem, 3vw, 3rem)',
              fontSize: 'clamp(0.875rem, 1vw, 1rem)'
            }}
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
