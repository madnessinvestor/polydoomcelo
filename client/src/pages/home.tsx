import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ArrowUpCircle, Beaker, Zap, Shield, Star } from "lucide-react";
import { PauseModal } from "@/components/pause-modal";
import { UpgradesModal } from "@/components/upgrades-modal";
import { ShoppingModal } from "@/components/shopping-modal";
import { Leaderboard } from "@/components/leaderboard";
import { ethers } from "ethers";
import { useUI } from "@/hooks/use-ui";
import Settings from "@/pages/settings";
import Controls from "@/pages/controls";
import backgroundImage from "@assets/Background_Tela_Principal_1767815377331.png";

const POTIONS_UI = [
  { id: "health", key: "Q", icon: Beaker, color: "text-red-500", borderColor: "border-red-500/50" },
  { id: "ki", key: "W", icon: Zap, color: "text-blue-500", borderColor: "border-blue-500/50" },
  { id: "immunity", key: "E", icon: Shield, color: "text-yellow-500", borderColor: "border-yellow-500/50" },
  { id: "score", key: "R", icon: Star, color: "text-purple-500", borderColor: "border-purple-500/50" }
];

declare global {
  interface Window {
    arc?: any;
    isArcConnected?: boolean;
    game?: Phaser.Game;
    showPauseModal?: () => void;
    hidePauseModal?: () => void;
    pauseOpening?: () => void;
    openUpgradesModal?: () => void;
    showUpgradesModal?: () => void;
    openShoppingModal?: () => void;
    playerInventory?: Record<string, number>;
  }
}

export default function Home() {
  const { isLocked, openModal, closeModal, activeModal } = useUI();
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [inventory, setInventory] = useState<Record<string, number>>({
    health: 0,
    ki: 0,
    immunity: 0,
    score: 0
  });

  const ARC_TESTNET_CONFIG = {
    chainId: "0x4cef52", // Updated to 0x4cef52 based on actual network ID seen in logs
    chainName: "Arc Testnet",
    nativeCurrency: {
      name: "ARC",
      symbol: "ARC",
      decimals: 18
    },
    rpcUrls: ["https://rpc.testnet.arc.io"], // Updated RPC URL
    blockExplorerUrls: ["https://explorer.testnet.arc.io"]
  };

  const switchNetwork = async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ARC_TESTNET_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [ARC_TESTNET_CONFIG],
          });
        } catch (addError) {
          console.error("Error adding Arc Testnet:", addError);
        }
      }
      console.error("Error switching to Arc Testnet:", switchError);
    }
  };

  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      if (chainId !== ARC_TESTNET_CONFIG.chainId) {
        switchNetwork();
      }
    };

    if ((window as any).ethereum) {
      (window as any).ethereum.request({ method: 'eth_chainId' }).then(handleChainChanged);
      (window as any).ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if ((window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const fetchUpgradesAndInventory = async () => {
    if (!(window as any).ethereum) return null;
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
      const upgradeAbi = [
        "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)"
      ];
      
      let upgradesData = null;

      // Fetch Upgrades
      try {
        const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, signer);
        const data = await upgradeContract.upgrades(userAddress);
        upgradesData = {
          arc_hp: Number(data.hp),
          arc_ki: Number(data.ki),
          arc_damage: Number(data.damage),
          arc_defence: Number(data.defence),
          arc_regen: Number(data.regen),
          arc_vamp: Number(data.vamp)
        };
        console.log("React: Initial upgrades fetched:", upgradesData);
      } catch (err) {
        console.warn("Could not fetch on-chain upgrades:", err);
      }

      // Get Inventory from local storage tied to wallet
      const inventoryKey = `player_inventory_${userAddress.toLowerCase()}`;
      const saved = localStorage.getItem(inventoryKey);
      let inventoryData = saved ? JSON.parse(saved) : { health: 0, ki: 0, immunity: 0, score: 0 };
      
      if (!saved) {
        localStorage.setItem(inventoryKey, JSON.stringify(inventoryData));
      }
      
      setInventory(inventoryData);
      (window as any).walletAddress = userAddress; // Store for game scene usage

      return { upgrades: upgradesData, inventory: inventoryData };
    } catch (e) {
      console.error("Error fetching data for game start:", e);
      return null;
    }
  };

  const handleContinueGame = () => {
    closeModal();
    // Resume game through window reference
    if (window.game?.scene.isActive('MainScene')) {
      const scene = window.game.scene.getScene('MainScene') as any;
      if (scene.isPaused) {
        scene.closePauseModal?.();
      }
    }
  };

  const handleExitGame = () => {
    console.log("REACT: handleExitGame called");
    closeModal();
    if (window.game) {
      console.log("REACT: Found window.game, searching for MainScene");
      const scene = window.game.scene.getScene('MainScene') as any;
      if (scene) {
        console.log("REACT: Found MainScene, calling exitGameFromPause");
        scene.exitGameFromPause?.();
      } else {
        console.log("REACT: MainScene not found");
      }
    } else {
      console.log("REACT: window.game not found");
    }
  };

  useEffect(() => {
    if (isConnected) {
      setIsChecking(true);
      // Simulating loading of upgrades and shopping at start
      console.log("Starting mandatory data loading...");
      
      fetchUpgradesAndInventory().then(data => {
        const upgrades = data?.upgrades;
        const inventory = data?.inventory;
        
        // Ensure data is available before game initialization
        if (upgrades) (window as any).playerUpgrades = upgrades;
        if (inventory) (window as any).playerInventory = inventory;

        import("@/lib/game").then((mod) => {
          mod.initGame(upgrades || undefined);
          
          // Small delay to ensure Phaser loaded basic textures/sounds
          setTimeout(() => {
            setIsChecking(false);
            console.log("Loading complete, starting game.");
          }, 1500);
          
          // Trigger HUD updates more aggressively
          const updateHUD = () => {
            if (window.game) {
              const scene = (window.game as any).scene.getScene('MainScene') as any;
              if (scene && scene.updateInventoryHUD) {
                scene.updateInventoryHUD();
              }
              if (scene && scene.applyUpgradesFromGlobal) {
                scene.applyUpgradesFromGlobal();
              }
            }
          };

          // Update at multiple intervals to ensure it catches the scene ready state
          setTimeout(updateHUD, 100);
          setTimeout(updateHUD, 500);
          setTimeout(updateHUD, 1000);
          setTimeout(updateHUD, 2000);
        });
      }).catch(err => {
        console.error("Failed to load game data:", err);
        setIsChecking(false);
      });
    }

    // Set up window functions for pause modal
    (window as any).showPauseModal = () => {
      console.log("React: showPauseModal called");
      openModal("pause");
    };
    (window as any).hidePauseModal = () => {
      console.log("React: hidePauseModal called");
      closeModal();
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
      openModal("upgrades");
    };
    (window as any).openUpgradesModal = triggerUpgrades;
    (window as any).showUpgradesModal = triggerUpgrades;

    const triggerShopping = () => {
      console.log("React: triggerShopping called");
      openModal("shopping");
    };
    (window as any).openShoppingModal = triggerShopping;

    const triggerLeaderboard = () => {
      console.log("React: triggerLeaderboard called");
      openModal("leaderboard");
    };
    (window as any).openLeaderboardModal = triggerLeaderboard;

    const triggerSettings = () => {
      console.log("React: triggerSettings called");
      openModal("settings");
    };
    (window as any).openSettingsModal = triggerSettings;

    const triggerControls = () => {
      console.log("React: triggerControls called");
      openModal("controls");
    };
    (window as any).openControlsModal = triggerControls;

    const triggerHistory = () => {
      console.log("React: triggerHistory called");
      openModal("history");
    };
    (window as any).openHistoryModal = triggerHistory;

    return () => {
      delete (window as any).showPauseModal;
      delete (window as any).hidePauseModal;
      delete (window as any).openUpgradesModal;
      delete (window as any).showUpgradesModal;
      delete (window as any).openShoppingModal;
      delete (window as any).openLeaderboardModal;
      delete (window as any).openSettingsModal;
      delete (window as any).openControlsModal;
      delete (window as any).openHistoryModal;
    };
  }, [isConnected]);

  useEffect(() => {
    const togglePhaserInput = (enabled: boolean) => {
      if (!window.game) return;
      
      try {
        // Bloqueio PROFUNDO e ABSOLUTO: Pausa o motor completamente
        const game = window.game as any;
        
        if (enabled) {
          game.input.enabled = true;
          if (game.scene) {
            game.scene.getScenes(true).forEach((scene: any) => {
              if (scene.input) {
                scene.input.enabled = true;
                if (scene.input.keyboard) scene.input.keyboard.enabled = true;
                if (scene.input.mouse) scene.input.mouse.enabled = true;
              }
            });
          }
          game.resume();
          // Remove a classe de bloqueio de eventos CSS
          document.getElementById('game-container')?.classList.remove('pointer-events-none');
        } else {
          game.input.enabled = false;
          if (game.scene) {
            game.scene.getScenes(true).forEach((scene: any) => {
              if (scene.input) {
                scene.input.enabled = false;
                if (scene.input.keyboard) scene.input.keyboard.enabled = false;
                if (scene.input.mouse) scene.input.mouse.enabled = false;
              }
            });
          }
          game.pause();
          // Adds CSS event blocking at the browser level
          document.getElementById('game-container')?.classList.add('pointer-events-none');
        }
      } catch (err) {
        console.error("Erro ao alternar input do Phaser:", err);
      }
    };

    togglePhaserInput(!isLocked);
  }, [isLocked]);

  return (
    <div 
      className="min-h-screen w-full bg-black flex flex-col items-center overflow-auto relative"
    >
      {activeModal === "pause" && (
        <PauseModal 
          onContinue={handleContinueGame} 
          onExit={handleExitGame}
        />
      )}
      {activeModal === "upgrades" && (
        <UpgradesModal onClose={() => closeModal()} />
      )}
      {activeModal === "shopping" && (
        <ShoppingModal onClose={() => closeModal()} />
      )}
      {activeModal === "leaderboard" && (
        <Leaderboard />
      )}
      {activeModal === "settings" && (
        <Settings />
      )}
      {activeModal === "controls" && (
        <Controls />
      )}
        {activeModal === "history" && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center pointer-events-auto bg-black/80">
            <div className="bg-slate-950 border-4 border-blue-400 p-4 max-w-4xl w-full flex flex-col items-center shadow-2xl shadow-blue-500/20">
              <h2 className="text-3xl font-black text-blue-400 mb-6 uppercase tracking-tighter">Game History</h2>
              <video src="/attached_assets/gamehistory_1767067604123.mp4" controls className="w-full h-auto mb-8 border-2 border-blue-400/30 shadow-2xl" />
              <div className="flex justify-center w-full border-t border-slate-800 pt-6">
                <Button 
                  onClick={closeModal} 
                  className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none transition-all hover:scale-105 active:scale-95 shadow-lg"
                >
                  CLOSE
                </Button>
              </div>
            </div>
          </div>
        )}
      
      {/* GLOBAL BLOCKER - Higher Z-index than EVERYTHING except modals */}
      {isLocked && (
        <div 
          className="fixed inset-0 z-[155] bg-black/60 backdrop-blur-[4px] pointer-events-auto cursor-default" 
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onPointerUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          style={{ touchAction: 'none', userSelect: 'none' }}
        />
      )}

      <div className={`w-full flex flex-col items-center transition-all duration-300 ${isLocked ? "scale-[0.98] blur-[2px]" : "scale-100 blur-0"}`}>
        {/* Loading Overlay */}
        {isChecking && (
          <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center">
            <div className="relative w-64 h-64 mb-8">
              <Loader2 className="w-full h-full text-blue-500 animate-spin opacity-20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-blue-400 font-black text-4xl animate-pulse tracking-tighter italic">
                  LOADING
                </div>
              </div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-blue-400/60 font-bold uppercase tracking-[0.3em] text-sm animate-pulse">
                Synchronizing on-chain upgrades...
              </p>
              <p className="text-blue-400/40 font-bold uppercase tracking-[0.2em] text-xs">
                Verifying inventory items
              </p>
            </div>
          </div>
        )}

        {/* Game Container */}
        <div className="relative mt-8">
          {isLocked && (
            <div 
              className="absolute inset-0 z-[2000] bg-transparent cursor-not-allowed" 
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          )}
          <div id="game-container" className="shadow-2xl border-4 border-slate-800 rounded-lg overflow-hidden relative" style={{ width: '1920px', height: '1080px' }} />
        </div>
      </div>
    </div>
  );
}
