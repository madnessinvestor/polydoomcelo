import { Button } from "@/components/ui/button";

interface PauseModalProps {
  onContinue: () => void;
  onExit: () => void;
}

export function PauseModal({ onContinue, onExit }: PauseModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />
      
      {/* Modal */}
      <div className="relative bg-slate-950 border-4 border-slate-700 rounded-lg p-8 max-w-sm mx-4 shadow-2xl">
        {/* Title */}
        <h2 className="text-center text-2xl font-bold text-white mb-6">
          Game Paused
        </h2>
        
        {/* Message */}
        <p className="text-center text-slate-300 mb-8">
          Do you want to continue or exit the game?
        </p>
        
        {/* Buttons */}
        <div className="flex gap-4 flex-col">
          <Button
            onClick={onContinue}
            variant="default"
            className="w-full bg-green-500 hover:bg-green-600 text-black font-bold"
            data-testid="button-continue"
          >
            Continue
          </Button>
          <Button
            onClick={onExit}
            variant="destructive"
            className="w-full"
            data-testid="button-exit-game"
          >
            Exit Game
          </Button>
        </div>
        
        {/* Help text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          Press ESC to resume • Exit Game to return to menu
        </p>
      </div>
    </div>
  );
}
