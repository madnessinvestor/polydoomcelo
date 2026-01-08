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
    <div className="fixed inset-0 z-[160] bg-black/40 backdrop-blur-sm flex items-center justify-center pointer-events-auto" style={{ padding: '2vh' }} onPointerDown={(e) => e.stopPropagation()}>
      <Card 
        className="relative w-full bg-slate-900 border-slate-700 pointer-events-auto flex flex-col overflow-hidden shadow-2xl" 
        style={{ 
          maxWidth: '90vw',
          height: '85vh',
          boxSizing: 'border-box',
          borderRadius: '1rem',
          borderWidth: '2px'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex-shrink-0 relative border-b border-slate-800" style={{ padding: '1.5vh 2vw' }}>
          <CardTitle className="flex items-center text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" style={{ gap: '1vw', fontSize: 'clamp(1.2rem, 2.5vh, 2rem)' }}>
            <Trophy style={{ width: '1.5em', height: '1.5em' }} />
            <span className="font-black tracking-tighter uppercase">Leaderboard Global</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 relative" style={{ overflow: 'hidden', padding: 0 }}>
          {sortedScores.length === 0 ? (
            <div className="text-slate-400 text-center flex items-center justify-center h-full" style={{ fontSize: 'clamp(1rem, 2vh, 1.25rem)' }}>
              Nenhum score registrado ainda
            </div>
          ) : (
            <ScrollArea className="h-full w-full relative">
              <div className="w-full relative" style={{ minWidth: '600px', boxSizing: 'border-box' }}>
                {/* Header */}
                <div 
                  className="grid items-center bg-slate-800/90 sticky top-0 z-10 border-b border-slate-700 backdrop-blur-md"
                  style={{
                    gridTemplateColumns: '5% 1fr 12% 10% 12% 15%',
                    gap: '1vw',
                    padding: '1.5vh 2vw',
                    fontSize: 'clamp(0.7rem, 1.5vh, 1rem)',
                    boxSizing: 'border-box'
                  }}
                >
                  <div className="text-center font-bold text-yellow-400 uppercase tracking-widest">#</div>
                  <div className="font-bold text-white uppercase tracking-widest">Jogador</div>
                  <div className="text-center font-bold text-yellow-400 uppercase tracking-widest">Inimigos</div>
                  <div className="text-center font-bold text-yellow-400 uppercase tracking-widest">Onda</div>
                  <div className="text-center font-bold text-yellow-400 uppercase tracking-widest">Tempo</div>
                  <div className="text-right font-bold text-yellow-400 uppercase tracking-widest">Pontuação</div>
                </div>

                {/* Rows */}
                <div className="relative">
                  {sortedScores.map((score, index) => (
                    <div
                      key={score.id}
                      className="grid items-center border-b border-slate-800/50 hover:bg-slate-800/30 transition-all duration-200"
                      style={{
                        gridTemplateColumns: '5% 1fr 12% 10% 12% 15%',
                        gap: '1vw',
                        padding: '1.2vh 2vw',
                        fontSize: 'clamp(0.8rem, 1.8vh, 1.1rem)',
                        boxSizing: 'border-box'
                      }}
                      data-testid={`leaderboard-entry-${score.id}`}
                    >
                      <div className={`text-center font-black ${index < 3 ? 'text-yellow-400 scale-110' : 'text-slate-500'}`}>
                        {index + 1}
                      </div>
                      <div className="text-white truncate font-semibold flex items-center gap-2">
                        <span className="truncate">{score.playerName}</span>
                        <PixelCrown rank={index + 1} />
                      </div>
                      <div className="text-center text-slate-300 font-medium">
                        {score.enemiesDefeated}
                      </div>
                      <div className="text-center text-slate-300 font-medium">
                        {score.wave}
                      </div>
                      <div className="text-center text-slate-300 tabular-nums">
                        {Math.floor(score.playTime / 60)}:{(score.playTime % 60).toString().padStart(2, '0')}
                      </div>
                      <div className="text-right font-black text-yellow-400 tabular-nums" style={{ fontSize: 'clamp(1rem, 2.2vh, 1.4rem)' }}>
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
          className="border-t border-slate-800 flex justify-center flex-shrink-0 bg-slate-900/50 backdrop-blur-sm"
          style={{ padding: '2vh', boxSizing: 'border-box' }}
        >
          <Button 
            onClick={closeModal}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-black uppercase tracking-widest rounded-none shadow-[0_4px_0_0_#c0392b] active:translate-y-1 active:shadow-none transition-all"
            style={{ 
              padding: '0 4vw',
              height: '6vh',
              minHeight: '40px',
              fontSize: 'clamp(0.9rem, 2vh, 1.2rem)'
            }}
          >
            Fechar
          </Button>
        </div>
      </Card>
    </div>
  );
}
