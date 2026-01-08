import { Button } from "@/components/ui/button";
import { useUI } from "@/hooks/use-ui";

interface PauseModalProps {
  onContinue: () => void;
  onExit: () => void;
}

export function PauseModal({ onContinue, onExit }: PauseModalProps) {
  const { isLocked } = useUI();
  
  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onPointerDown={(e) => e.stopPropagation()} />
      
      {/* Modal */}
      <div className="relative bg-[#0a0a20] border-2 border-slate-700 rounded-lg p-8 w-full max-w-[400px] mx-4 shadow-2xl">
        {/* Title */}
        <h2 className="text-center text-3xl font-bold text-white mb-8 tracking-wider uppercase">
          Game Paused
        </h2>
        
        {/* Message */}
        <p className="text-center text-slate-300 mb-10 text-lg">
          Do you want to continue or exit the game?
        </p>
        
        {/* Buttons */}
        <div className="flex gap-6 flex-col">
          <Button
            onClick={onContinue}
            className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.5)] border-2 border-[#10b981]"
            data-testid="button-continue"
          >
            CONTINUE
          </Button>
          <Button
            onClick={() => (window as any).openUpgradesModal?.()}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(34,197,94,0.5)] border-2 border-green-500"
            data-testid="button-upgrades"
          >
            UPGRADES
          </Button>
          <Button
            onClick={() => (window as any).openShoppingModal?.()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(37,99,235,0.5)] border-2 border-blue-500"
            data-testid="button-shopping"
          >
            SHOPPING
          </Button>
          <Button
            onClick={() => (window as any).openLeaderboardModal?.()}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(202,138,4,0.5)] border-2 border-yellow-500"
            data-testid="button-leaderboard"
          >
            LEADERBOARD
          </Button>
          <Button
            onClick={() => (window as any).openHistoryModal?.()}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(8,145,178,0.5)] border-2 border-cyan-500"
            data-testid="button-history"
          >
            HISTORY
          </Button>
          <Button
            onClick={() => (window as any).openControlsModal?.()}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(234,88,12,0.5)] border-2 border-orange-500"
            data-testid="button-controls"
          >
            CONTROLS
          </Button>
          <Button
            onClick={() => (window as any).openSettingsModal?.()}
            className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(124,58,237,0.5)] border-2 border-violet-500"
            data-testid="button-settings"
          >
            SETTINGS
          </Button>
          <Button
            onClick={onExit}
            className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest shadow-[0_0_15px_rgba(239,68,68,0.5)] border-2 border-[#ef4444]"
            data-testid="button-exit-game"
          >
            EXIT GAME
          </Button>
        </div>
        
        {/* Help text */}
        <p className="text-center text-slate-500 text-sm mt-8">
          Press ESC to resume • Exit Game to return to menu
        </p>
      </div>
    </div>
  );
}
