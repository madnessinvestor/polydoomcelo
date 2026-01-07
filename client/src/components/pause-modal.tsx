import { Button } from "@/components/ui/button";
import { useUI } from "@/hooks/use-ui";

interface PauseModalProps {
  onContinue: () => void;
  onExit: () => void;
}

export function PauseModal({ onContinue, onExit }: PauseModalProps) {
  const { isLocked } = useUI();
  
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
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
            className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold text-xl py-8 rounded-none uppercase tracking-widest"
            data-testid="button-continue"
          >
            CONTINUE
          </Button>
          <Button
            onClick={onExit}
            className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold text-xl py-8 rounded-none uppercase tracking-widest"
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
