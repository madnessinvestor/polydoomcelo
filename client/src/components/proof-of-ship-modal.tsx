import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckSquare, ExternalLink } from "lucide-react";

const TASKS = [
  {
    id: "minipay",
    title: "Build For MiniPay",
    description: "Add one hook and make your app compatible with MiniPay",
    timeframe: "Jun 1–22",
    url: "https://docs.celo.org/developer/build-on-minipay",
  },
  {
    id: "deploy",
    title: "Deploy On Celo",
    description: "Deploy a smart contract on Celo mainnet",
    timeframe: "Jun 1–22",
    url: "https://celoscan.io",
  },
  {
    id: "submit",
    title: "Submit Your Project",
    description: "Submit your project to the campaign",
    timeframe: "Jun 1–22",
    url: "https://celo.org/proof-of-ship",
  },
];

export function ProofOfShipModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[160] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Card
        className="w-full max-w-2xl bg-[#0a0a0a] border-2 border-[#FCFF52] text-white flex flex-col overflow-hidden rounded-none shadow-[0_0_30px_rgba(252,255,82,0.25)] font-pixel"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b border-[#FCFF52]/30 bg-[#FCFF52]/5 pb-4">
          <CardTitle className="text-[#FCFF52] text-2xl uppercase font-black tracking-tight flex items-center gap-3">
            <CheckSquare className="w-7 h-7" />
            Proof of Ship
          </CardTitle>
          <p className="text-white/80 text-sm mt-1 font-pixel-content">
            Get on the leaderboard
          </p>
          <p className="text-white/50 text-xs mt-1 font-pixel-content leading-relaxed">
            Complete the required steps below to participate in Proof of Ship.
            Submit your project and make sure it meets the eligibility criteria
            to be scored.
          </p>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {TASKS.map((task) => (
            <div
              key={task.id}
              className="bg-[#111] border border-white/10 p-4 flex items-start gap-4 hover:border-[#FCFF52]/40 transition-colors"
            >
              <div className="mt-0.5 w-8 h-8 rounded-sm bg-[#FCFF52]/10 border border-[#FCFF52]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[#FCFF52] text-xs font-black">C</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-white font-bold uppercase font-pixel-label" style={{ fontSize: "1rem" }}>
                    {task.title}
                  </h3>
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FCFF52]/60 hover:text-[#FCFF52] transition-colors ml-2"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <p className="text-white/60 font-pixel-content" style={{ fontSize: "0.72rem" }}>
                  {task.description}
                </p>
                <p className="text-[#FCFF52]/70 font-pixel-content mt-1" style={{ fontSize: "0.65rem" }}>
                  Timeframe: {task.timeframe}
                </p>
              </div>
            </div>
          ))}
        </CardContent>

        <div className="p-5 border-t border-[#FCFF52]/20 flex gap-3 justify-between items-center">
          <a
            href="https://celo.org/proof-of-ship"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#FCFF52] text-xs font-bold uppercase hover:underline font-pixel-content"
          >
            <ExternalLink size={12} />
            celo.org/proof-of-ship
          </a>
          <Button
            onClick={onClose}
            className="bg-[#FCFF52] hover:bg-yellow-300 text-black font-bold px-10 h-10 text-sm uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
