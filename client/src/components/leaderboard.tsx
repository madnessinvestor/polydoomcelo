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

  const colors = {
    1: "#FFD700", // Gold
    2: "#C0C0C0", // Silver
    3: "#CD7F32", // Bronze
  };
  const color = colors[rank as keyof typeof colors];

  // 8-bit crown pattern (5x4)
  const pattern = [
    1, 0, 1, 0, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1,
    1, 1, 1, 1, 1
  ];

  return (
    <div 
      className="grid grid-cols-5" 
      style={{ 
        width: '2vh', 
        height: '1.6vh', 
        gap: '1px',
        imageRendering: 'pixelated'
      }}
    >
      {pattern.map((pixel, i) => (
        <div
          key={i}
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
      <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none select-none">
        <div 
          className="relative pointer-events-auto bg-black/80 border-[2px] border-[#4ade80] flex flex-col items-center justify-center" 
          style={{ width: 'min(90vw, 85vh * 0.7)', height: '85vh' }}
        >
          <div className="text-[#4ade80] font-mono animate-pulse uppercase tracking-widest text-[2vh]">
            Loading scores...
          </div>
        </div>
      </div>
    );
  }

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
          <ScrollArea className="h-full w-full">
            <div className="p-[2vh] space-y-[1vh]">
              {sortedScores.map((score, index) => (
                <div
                  key={score.id}
                  className="flex items-center justify-between p-[1.5vh] border border-[#4ade80]/20 bg-[#4ade80]/5 hover:bg-[#4ade80]/10 transition-colors"
                  style={{ fontSize: '1.6vh' }}
                >
                  <div className="flex items-center gap-[1.5vw] min-w-0">
                    <div className="flex items-center justify-center w-[3.5vh] shrink-0">
                      {index < 3 ? (
                        <PixelCrown rank={index + 1} />
                      ) : (
                        <span className="text-[#4ade80]/60 font-mono">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>
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
