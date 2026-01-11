import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Score } from "@shared/schema";
import { useUI } from "@/hooks/use-ui";
import { useEffect } from "react";

function PixelCrown({ rank }: { rank: number }) {
  if (rank > 3) return null;

  const colors = {
    1: "#FFD700",
    2: "#C0C0C0",
    3: "#CD7F32",
  };
  const color = colors[rank as keyof typeof colors];

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
        width: "2vh",
        height: "1.6vh",
        gap: "1px",
        imageRendering: "pixelated"
      }}
    >
      {pattern.map((pixel, i) => (
        <div key={i} style={{ backgroundColor: pixel ? color : "transparent" }} />
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
          style={{ width: "min(90vw, 85vh * 0.7)", height: "85vh" }}
        >
          <div className="text-[#4ade80] font-mono animate-pulse uppercase tracking-widest text-[2vh]">
            Loading scores...
          </div>
        </div>
      </div>
    );
  }

  const sortedScores = [...scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-none select-none">
      <div
        className="relative pointer-events-auto bg-black/80 border-[2px] border-[#4ade80] shadow-[0_0_20px_rgba(74,222,128,0.3)] flex flex-col overflow-hidden"
        style={{
          width: "min(90vw, 85vh * 0.7)",
          height: "85vh",
          imageRendering: "pixelated",
          fontFamily: "monospace"
        }}
      >
        {/* Title */}
        <div className="flex-shrink-0 p-[2vh] flex items-center justify-center border-b border-[#4ade80]/30">
          <h2 className="text-[#4ade80] font-bold tracking-[0.5em] uppercase" style={{ fontSize: "3vh" }}>
            LEADERBOARD
          </h2>
        </div>

        {/* Header */}
        <div
          className="flex items-center p-[1vh] border-b border-[#4ade80]/30 text-[#4ade80]/50 font-bold uppercase bg-black/40 backdrop-blur-sm"
          style={{ fontSize: "1.2vh" }}
        >
          <div className="w-[10%] text-center">#</div>
          <div className="w-[35%]">Player</div>
          <div className="w-[15%] text-center">Wave</div>
          <div className="w-[15%] text-center">Enemies</div>
          <div className="w-[15%] text-center">Time</div>
          <div className="w-[10%] text-right">Score</div>
        </div>

        {/* Body */}
        <ScrollArea className="flex-1 w-full overflow-y-auto custom-scrollbar">
          <div className="p-[2vh] pt-0 space-y-[0.5vh]">
            {sortedScores.length === 0 ? (
              <div className="py-[10vh] text-center text-[#4ade80]/30 italic" style={{ fontSize: "1.4vh" }}>
                No records yet...
              </div>
            ) : (
              sortedScores.map((score, index) => {
                const time = score.play_time ?? 0;

                return (
                  <div
                    key={score.id}
                    className="flex items-center p-[1vh] border-b border-[#4ade80]/10 bg-[#4ade80]/5 hover:bg-[#4ade80]/10 transition-colors"
                    style={{ fontSize: "1.4vh" }}
                  >
                    <div className="w-[10%] flex items-center justify-center">
                      {index < 3 ? <PixelCrown rank={index + 1} /> : <span>{index + 1}</span>}
                    </div>

                    <div className="w-[35%] truncate pr-2">
                      <span className="text-white uppercase font-bold truncate block">
                        {score.player_name && score.player_name !== "undefined"
                          ? score.player_name
                          : "Anonymous"}
                      </span>
                    </div>

                    <div className="w-[15%] text-center text-[#4ade80]">
                      {score.wave ?? 1}
                    </div>

                    <div className="w-[15%] text-center text-[#4ade80]">
                      {score.enemies_defeated ?? 0}
                    </div>

                    <div className="w-[15%] text-center text-[#4ade80] tabular-nums">
                      {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
                    </div>

                    <div className="w-[10%] text-right text-yellow-400 font-bold">
                      {(score.score ?? 0).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-[2vh] flex justify-center border-t border-[#4ade80]/30">
          <button
            onClick={closeModal}
            className="text-[#4ade80] hover:text-white border border-[#4ade80] px-[3vw] py-[1vh] uppercase font-bold transition-all hover:bg-[#4ade80]/20"
            style={{ fontSize: "1.4vh" }}
          >
            [ Close ]
          </button>
        </div>
      </div>
    </div>
  );
}
