import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Loader2, ArrowUpCircle, Beaker, Zap, Shield, Star } from "lucide-react";
import { PauseModal } from "@/components/pause-modal";
import { ProofOfShipModal } from "@/components/proof-of-ship-modal";
import { Leaderboard } from "@/components/leaderboard";
import { ethers } from "ethers";
import { useUI } from "@/hooks/use-ui";
import Settings from "@/pages/settings";
import Controls from "@/pages/controls";
import backgroundImage from "/Background_Tela_Principal_1767815377331.png";

const POTIONS_UI = [
  { id: "health", key: "Q", icon: Beaker, color: "text-red-500", borderColor: "border-red-500/50" },
  { id: "ki", key: "W", icon: Zap, color: "text-blue-500", borderColor: "border-blue-500/50" },
  { id: "immunity", key: "E", icon: Shield, color: "text-yellow-500", borderColor: "border-yellow-500/50" },
  { id: "score", key: "R", icon: Star, color: "text-purple-500", borderColor: "border-purple-500/50" }
];

declare global {
  interface Window {
    arc?: any;
    isCeloConnected?: boolean;
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

const GAME_W = 1920;
const GAME_H = 1080;

function useGameScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => {
      const scaleX = window.innerWidth / GAME_W;
      const scaleY = window.innerHeight / GAME_H;
      setScale(Math.min(scaleX, scaleY));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);
  return scale;
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
  const scale = useGameScale();

  // Wallet selector modal state
  const [showWalletModal, setShowWalletModal] = useState(false);
  const walletCallbackRef = useRef<((provider: any, name: string) => void) | null>(null);

  const isMiniPay = !!(window as any).ethereum?.isMiniPay;
  const allProviders: any[] = (window as any).ethereum?.providers ?? [];
  const findP = (pred: (p: any) => boolean) => allProviders.find(pred) ?? null;
  const metaMaskProvider = findP(p => p.isMetaMask && !p.isRabby && !p.isBraveWallet)
    ?? ((window as any).ethereum?.isMetaMask && !(window as any).ethereum?.isRabby ? (window as any).ethereum : null);
  const rabbyProvider = findP(p => p.isRabby)
    ?? ((window as any).ethereum?.isRabby ? (window as any).ethereum : null);
  const genericProvider = allProviders.length > 0 ? allProviders[0] : ((window as any).ethereum ?? null);
  const browserProvider = rabbyProvider ?? metaMaskProvider ?? genericProvider;
  const walletName = rabbyProvider ? 'Rabby' : metaMaskProvider ? 'MetaMask' : browserProvider ? 'Browser Wallet' : '';
  const hasBrowserWallet = !!browserProvider;

  const CELO_NETWORK_CONFIG = {
    chainId: "0xa4ec", // Celo Mainnet Chain ID: 42220
    chainName: "Celo Mainnet",
    nativeCurrency: {
      name: "CELO",
      symbol: "CELO",
      decimals: 18
    },
    rpcUrls: ["https://forno.celo.org"],
    blockExplorerUrls: ["https://celoscan.io"]
  };

  const switchNetwork = async () => {
    if (!(window as any).ethereum) return;
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CELO_NETWORK_CONFIG],
          });
        } catch (addError) {
          console.error("Error adding Celo Mainnet:", addError);
        }
      }
      console.error("Error switching to Celo Mainnet:", switchError);
    }
  };

  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      if (chainId !== CELO_NETWORK_CONFIG.chainId) {
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
    if (!(window as any).ethereum) {
      console.warn("React: No ethereum provider found");
      return null;
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Timeout fetching Web3 data")), 8000)
    );

    try {
      const fetchDataPromise = (async () => {
        // Create a timeout for the entire fetch process to avoid hanging
        const fetchTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Internal fetch timeout")), 5000)
        );

        const actualFetch = (async () => {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          
          // Silent check — only use already-connected accounts, never show popup on load
          let existingAccounts: string[] = [];
          try {
            existingAccounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          } catch (_) {}
          if (!existingAccounts || existingAccounts.length === 0) {
            // Wallet not connected yet — skip, game will connect on button click
            return null;
          }

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
              celo_hp: Number(data.hp),
              celo_ki: Number(data.ki),
              celo_damage: Number(data.damage),
              celo_defence: Number(data.defence),
              celo_regen: Number(data.regen),
              celo_vamp: Number(data.vamp)
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

          // Fetch user profile from backend to get player_name
          try {
            const profileResponse = await fetch(`/api/character-state/${userAddress}`);
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.playerName) {
                (window as any).playerName = profileData.playerName;
              }
            }
          } catch (err) {
            console.warn("Failed to fetch player name from backend:", err);
          }

          return { upgrades: upgradesData, inventory: inventoryData };
        })();

        return await Promise.race([actualFetch, fetchTimeout]);
      })();

      // Race against global timeout
      return await Promise.race([fetchDataPromise, timeoutPromise]) as { upgrades: any, inventory: any };
    } catch (e) {
      console.warn("No wallet connected or data load timed out, using local fallback:", e);
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
        console.error("Failed to load game data (graceful fallback):", err);
        // Still try to init the game with local data or defaults
        import("@/lib/game").then((mod) => {
          mod.initGame();
          setTimeout(() => {
            setIsChecking(false);
            console.log("Loading complete (fallback mode).");
          }, 1500);
        });
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

    const triggerProofOfShip = () => {
      console.log("React: triggerProofOfShip called");
      openModal("proofofship");
    };
    (window as any).openProofOfShipModal = triggerProofOfShip;

    // Global wallet connect bridge — called by Phaser game.ts
    (window as any).__connectWallet = (cb: (provider: any, name: string) => void) => {
      walletCallbackRef.current = cb;
      setShowWalletModal(true);
    };

    return () => {
      delete (window as any).showPauseModal;
      delete (window as any).hidePauseModal;
      delete (window as any).openLeaderboardModal;
      delete (window as any).openSettingsModal;
      delete (window as any).openControlsModal;
      delete (window as any).openHistoryModal;
      delete (window as any).openProofOfShipModal;
      delete (window as any).__connectWallet;
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
      {activeModal === "proofofship" && (
        <ProofOfShipModal onClose={() => closeModal()} />
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
              <video src="/gamehistory_1767067604123.mp4" controls className="w-full h-auto mb-8 border-2 border-blue-400/30 shadow-2xl" />
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

      {/* Loading Overlay */}
      {isChecking && (
        <div className="fixed inset-0 z-[3000] bg-black flex flex-col items-center justify-center">
          <div className="relative w-64 h-64 mb-8">
            <Loader2 className="w-full h-full text-[#4ade80] animate-spin opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-[#4ade80] font-black text-4xl animate-pulse tracking-tighter italic">
                LOADING
              </div>
            </div>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-[#4ade80]/60 font-bold uppercase tracking-[0.3em] text-sm animate-pulse">
              Reading on-chain data...
            </p>
          </div>
        </div>
      )}

      {/* Game Viewport — sizes to exactly the scaled canvas */}
      <div
        style={{
          width: `${GAME_W * scale}px`,
          height: `${GAME_H * scale}px`,
          position: "relative",
          overflow: "hidden",
          margin: "0 auto",
        }}
      >
        {/* Scaled canvas wrapper */}
        <div
          style={{
            width: `${GAME_W}px`,
            height: `${GAME_H}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          {isLocked && (
            <div
              className="absolute inset-0 z-[2000] bg-transparent cursor-not-allowed"
              style={{ width: GAME_W, height: GAME_H }}
              onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            />
          )}
          <div
            id="game-container"
            className="shadow-2xl overflow-hidden relative"
            style={{ width: `${GAME_W}px`, height: `${GAME_H}px` }}
          />
        </div>
      </div>

      {/* React Wallet Selector Modal — triggered by Phaser via window.__connectWallet */}
      {showWalletModal && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.8)' }}
        onClick={() => setShowWalletModal(false)}
      >
        <div
          className="relative"
          style={{
            background: '#0a0f1e', border: '2px solid #3b82f6',
            boxShadow: '0 0 40px rgba(59,130,246,.5)', padding: '32px 28px',
            minWidth: '300px', maxWidth: '420px', width: '90%', fontFamily: 'monospace',
            borderRadius: '4px'
          }}
          onClick={e => e.stopPropagation()}
        >
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '2px' }}>
            Connect Wallet
          </h2>
          <p style={{ color: '#6b7280', fontSize: '12px', textAlign: 'center', margin: '0 0 22px' }}>
            Choose how to connect to Celo Mainnet
          </p>

          {/* MiniPay */}
          <button
            onClick={() => {
              if (isMiniPay) {
                setShowWalletModal(false);
                walletCallbackRef.current?.((window as any).ethereum, 'MiniPay');
              } else {
                window.open('https://www.opera.com/mobile/minipay', '_blank');
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: isMiniPay ? '#0d2010' : '#111827',
              border: `1.5px solid ${isMiniPay ? '#4ade80' : '#1f2937'}`,
              padding: '14px 16px', marginBottom: '10px', cursor: 'pointer',
              borderRadius: '4px', width: '100%', boxSizing: 'border-box'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a2f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🥭</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>MiniPay</div>
              <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{isMiniPay ? 'Detected — tap to connect' : 'Open inside Opera MiniPay app'}</div>
            </div>
            {isMiniPay && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: '#4ade80', color: '#000', fontWeight: 'bold' }}>DETECTED</span>}
          </button>

          {/* Browser Wallet (MetaMask / Rabby) */}
          <button
            disabled={!hasBrowserWallet}
            onClick={() => {
              if (!hasBrowserWallet || !browserProvider) return;
              setShowWalletModal(false);
              walletCallbackRef.current?.(browserProvider, walletName || 'Wallet');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              background: hasBrowserWallet ? '#1a2540' : '#111827',
              border: `1.5px solid ${hasBrowserWallet ? '#4ade80' : '#1f2937'}`,
              padding: '14px 16px', marginBottom: '10px',
              cursor: hasBrowserWallet ? 'pointer' : 'not-allowed',
              opacity: hasBrowserWallet ? 1 : 0.4,
              borderRadius: '4px', width: '100%', boxSizing: 'border-box'
            }}
          >
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1c1a00', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🦊</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>{hasBrowserWallet ? walletName : 'MetaMask / Rabby'}</div>
              <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>{hasBrowserWallet ? `${walletName} detected — click to connect` : 'No browser wallet extension detected'}</div>
            </div>
            {hasBrowserWallet
              ? <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: '#4ade80', color: '#000', fontWeight: 'bold' }}>DETECTED</span>
              : <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: '#374151', color: '#9ca3af', fontWeight: 'bold' }}>NOT FOUND</span>
            }
          </button>

          {/* WalletConnect (coming soon) */}
          <button disabled style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#111827', border: '1.5px solid #1f2937', padding: '14px 16px', marginBottom: '10px', cursor: 'not-allowed', opacity: 0.4, borderRadius: '4px', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#0d1f3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🔗</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ color: '#fff', fontSize: '15px', fontWeight: 'bold' }}>WalletConnect</div>
              <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '2px' }}>Coming soon</div>
            </div>
            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '99px', background: '#374151', color: '#9ca3af', fontWeight: 'bold' }}>SOON</span>
          </button>

          <button
            onClick={() => setShowWalletModal(false)}
            style={{ display: 'block', width: '100%', marginTop: '6px', padding: '10px', background: 'transparent', border: '1px solid #374151', color: '#6b7280', cursor: 'pointer', fontSize: '13px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '1px', borderRadius: '4px' }}
          >
            Cancel
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
