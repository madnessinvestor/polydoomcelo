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
    <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none select-none" onPointerDown={(e) => e.stopPropagation()}>
      {/* 
        This component is styled to look like it's part of the Phaser canvas.
        It uses a pixelated border, specific fonts, and is contained within the same relative space.
      */}
      <div 
        className="relative pointer-events-auto bg-[#2c3e50] border-[6px] border-[#34495e] shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden" 
        style={{ 
          width: '800px',
          height: '500px',
          maxWidth: '90vw',
          maxHeight: '80vh',
          imageRendering: 'pixelated',
          fontFamily: '"Press Start 2P", system-ui, sans-serif'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-[#34495e] p-4 flex items-center justify-between border-b-[4px] border-[#2c3e50]">
          <div className="flex items-center gap-3 text-yellow-400">
            <Trophy className="w-6 h-6" />
            <span className="text-lg uppercase tracking-wider font-bold">Leaderboard</span>
          </div>
          <Button 
            onClick={closeModal}
            variant="ghost" 
            className="text-red-400 hover:text-red-300 hover:bg-transparent p-0 h-auto"
          >
            [X]
          </Button>
        </div>

        <div className="flex-1 overflow-hidden relative bg-[#1a252f]">
          {sortedScores.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#95a5a6] text-xs">
              NO RECORDS FOUND
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-2">
                {sortedScores.map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center gap-4 p-3 bg-[#2c3e50] border-2 border-[#34495e] hover:border-yellow-500 transition-colors"
                    data-testid={`leaderboard-entry-${score.id}`}
                  >
                    <div className={`w-8 text-center font-bold ${index < 3 ? 'text-yellow-400' : 'text-[#7f8c8d]'}`}>
                      #{index + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-white text-sm truncate uppercase">{score.playerName}</span>
                      {index < 3 && <PixelCrown rank={index + 1} />}
                    </div>
                    <div className="flex gap-4 text-[10px] text-[#bdc3c7] uppercase">
                      <div className="text-center">
                        <div className="text-[#7f8c8d]">ENEMIES</div>
                        <div className="text-white">{score.enemiesDefeated}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#7f8c8d]">WAVE</div>
                        <div className="text-white">{score.wave}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#7f8c8d]">SCORE</div>
                        <div className="text-yellow-400 font-bold">{score.score.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <div className="p-4 bg-[#34495e] flex justify-center">
          <Button 
            onClick={closeModal}
            className="bg-red-500 hover:bg-red-600 text-white border-b-4 border-red-800 rounded-none h-10 px-8 font-bold active:border-b-0 active:translate-y-1 transition-all"
          >
            RETURN TO GAME
          </Button>
        </div>
      </div>
    </div>
  );
}
