import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ArrowUpCircle } from "lucide-react";
import { PauseModal } from "@/components/pause-modal";
import { UpgradesModal } from "@/components/upgrades-modal";
import { ethers } from "ethers";

declare global {
  interface Window {
    arc?: any;
    isArcConnected?: boolean;
    game?: Phaser.Game;
    showPauseModal?: () => void;
    hidePauseModal?: () => void;
    pauseOpening?: () => void;
  }
}

export default function Home() {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState(false);

  const fetchUpgrades = async () => {
    if (!(window as any).ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
      const upgradeAbi = [
        "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)"
      ];
      const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, signer);
      const data = await upgradeContract.upgrades(userAddress);
      return {
        arc_hp: Number(data.hp),
        arc_ki: Number(data.ki),
        arc_damage: Number(data.damage),
        arc_defence: Number(data.defence),
        arc_regen: Number(data.regen),
        arc_vamp: Number(data.vamp)
      };
    } catch (e) {
      console.error("Error fetching upgrades for game start:", e);
      return null;
    }
  };

  const handleContinueGame = () => {
    setIsPauseModalOpen(false);
    // Resume game through window reference
    if (window.game?.scene.isActive('MainScene')) {
      const scene = window.game.scene.getScene('MainScene') as any;
      if (scene.isPaused) {
        scene.closePauseModal?.();
      }
    }
  };

  const handleExitGame = () => {
    setIsPauseModalOpen(false);
    // Exit game through window reference
    if (window.game?.scene.isActive('MainScene')) {
      const scene = window.game.scene.getScene('MainScene') as any;
      scene?.exitGameFromPause?.();
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchUpgrades().then(upgrades => {
        import("@/lib/game").then((mod) => {
          mod.initGame(upgrades || undefined);
        });
      });
    }

    // Set up window functions for pause modal
    (window as any).showPauseModal = () => {
      console.log("React: showPauseModal called");
      setIsPauseModalOpen(true);
    };
    (window as any).hidePauseModal = () => {
      console.log("React: hidePauseModal called");
      setIsPauseModalOpen(false);
    };

    const handleOpeningMusic = () => {
      if (window.game?.scene.isActive('MainScene')) {
        const scene = window.game.scene.getScene('MainScene') as any;
        scene.stopOpeningMusic?.();
      }
    };
    (window as any).pauseOpening = handleOpeningMusic;

    const triggerUpgrades = () => {
      console.log("React: triggerUpgrades called");
      setIsPauseModalOpen(false);
      setIsUpgradesOpen(true);
    };
    (window as any).openUpgradesModal = triggerUpgrades;
    (window as any).showUpgradesModal = triggerUpgrades;

    return () => {
      delete (window as any).showPauseModal;
      delete (window as any).hidePauseModal;
      delete (window as any).openUpgradesModal;
      delete (window as any).showUpgradesModal;
    };
  }, [isConnected]);

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4 overflow-hidden">
      {isPauseModalOpen && (
        <PauseModal 
          onContinue={handleContinueGame} 
          onExit={handleExitGame}
        />
      )}
      {isUpgradesOpen && (
        <UpgradesModal onClose={() => setIsUpgradesOpen(false)} />
      )}
      <div className="w-full max-w-2xl flex flex-col h-screen">
        {/* Game Container */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0">
          <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden" />
          
          <div className="mt-4 flex flex-col items-center gap-4">
            <div className="text-slate-400 text-sm flex flex-wrap justify-center gap-x-4 gap-y-2 px-4">
              <div className="flex gap-2">
                <span className="text-white">Arrow Keys:</span>
                <span className="text-slate-400">Move / Jump</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">Double-Click Arrow:</span>
                <span className="text-slate-400">Dash</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">Z:</span>
                <span className="text-slate-400">Punch</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">X:</span>
                <span className="text-slate-400">Charge KiArc</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">C:</span>
                <span className="text-slate-400">Magic</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">V:</span>
                <span className="text-slate-400">ArcKamehameha</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">B:</span>
                <span className="text-slate-400">ArcGenkiDama</span>
              </div>
              <div className="flex gap-2">
                <span className="text-white">F:</span>
                <span className="text-slate-400">Explosion KiArc</span>
              </div>
            </div>
          </div>
          <div className="fixed bottom-4 right-4 z-50">
            <a 
              href="https://testnet.arcscan.app/address/0x9b673bDBA9ed06989b1846d4C63468BCE86cf006" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors font-mono"
            >
              0x9b673bDBA9ed06989b1846d4C63468BCE86cf006
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
