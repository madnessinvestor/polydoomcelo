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
      <div 
        className="relative pointer-events-auto bg-black/80 border-[2px] border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.3)] flex flex-col overflow-hidden" 
        style={{ 
          width: 'min(90vw, 85vh * 0.7)',
          height: '85vh',
          imageRendering: 'pixelated',
          fontFamily: 'monospace'
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-[2vh] flex items-center justify-center border-b border-[#4ade80]/30">
          <h2 className="text-[#4ade80] font-bold tracking-[0.5em] uppercase" style={{ fontSize: '3vh' }}>
            LEADERBOARD
          </h2>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {sortedScores.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#4ade80]/50 text-[1.5vh] animate-pulse">
              Loading scores...
            </div>
          ) : (
            <ScrollArea className="h-full w-full">
              <div className="p-[2vh] space-y-[1vh]">
                {sortedScores.map((score, index) => (
                  <div
                    key={score.id}
                    className="flex items-center justify-between p-[1.5vh] border border-[#4ade80]/20 bg-[#4ade80]/5 hover:bg-[#4ade80]/10 transition-colors"
                    style={{ fontSize: '1.6vh' }}
                  >
                    <div className="flex items-center gap-[1.5vw] min-w-0">
                      <span className="text-[#4ade80]/60 font-mono w-[3vh]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-white truncate uppercase font-bold tracking-tight">
                        {score.playerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-[2vw] text-[#4ade80]">
                      <div className="flex flex-col items-end">
                        <span className="text-[1vh] text-[#4ade80]/50 uppercase">Score</span>
                        <span className="font-mono font-bold">{score.score.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        
        <div className="p-[2vh] flex justify-center border-t border-[#4ade80]/30">
          <button 
            onClick={closeModal}
            className="text-[#4ade80] hover:text-white border border-[#4ade80] px-[3vw] py-[1vh] uppercase font-bold transition-all hover:bg-[#4ade80]/20"
            style={{ fontSize: '1.4vh' }}
          >
            [ Close ]
          </button>
        </div>
      </div>
    </div>
  );
}
