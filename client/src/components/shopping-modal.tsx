import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Beaker, Zap, Shield, Star, Loader2 } from "lucide-react";
import { ethers } from "ethers";

const SHOP_CONTRACT_ADDRESS = "0x6b09296bb55f08FBD268C44a89B5B9a23db2af6a";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000"; // Correct USDC address for Arc Testnet 0x4cef52

const SHOP_ABI = [
  "function buyHealthPotion() external",
  "function buyKiPotion() external",
  "function buyImmunityPotion() external",
  "function buyScorePotion() external",
  "function getPotionBalances(address user) external view returns (uint256, uint256, uint256, uint256)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

interface Potion {
  id: string;
  name: string;
  type: string;
  effect: string;
  description: string;
  price: number;
  icon: any;
  color: string;
}

const POTIONS: Potion[] = [
  {
    id: "health",
    name: "Health Potion",
    type: "Consumable",
    effect: "Restores 100% HP instantly",
    description: "A basic potion that fully restores health.",
    price: 100,
    icon: Beaker,
    color: "text-red-500"
  },
  {
    id: "ki",
    name: "Ki Potion",
    type: "Consumable",
    effect: "Restores 100% Ki instantly",
    description: "Pure arcane energy condensed into liquid form.",
    price: 100,
    icon: Zap,
    color: "text-blue-500"
  },
  {
    id: "immunity",
    name: "Immunity Potion",
    type: "Consumable",
    effect: "Total immunity for 30 seconds",
    description: "Absolute protection against all threats — for a short time.",
    price: 500,
    icon: Shield,
    color: "text-yellow-500"
  },
  {
    id: "score",
    name: "Score Potion",
    type: "Consumable",
    effect: "200% score for 100 seconds",
    description: "Every enemy defeated is worth double while the effect lasts.",
    price: 100,
    icon: Star,
    color: "text-purple-500"
  }
];

export function ShoppingModal({ onClose }: { onClose: () => void }) {
  const [isBuying, setIsBuying] = useState<string | null>(null);
  const [inventory, setInventory] = useState<Record<string, number>>({
    health: 0,
    ki: 0,
    immunity: 0,
    score: 0
  });

  useEffect(() => {
    const fetchInventory = async () => {
      // Prioritize local storage for instant feedback
      const savedInventory = localStorage.getItem('player_inventory');
      if (savedInventory) {
        setInventory(JSON.parse(savedInventory));
      }

      // Sync with blockchain if wallet is connected
      if ((window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          const userAddress = await signer.getAddress();
          
          const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, SHOP_ABI, provider);
          
          // Fetch balances from contract
          console.log("Fetching on-chain balances for:", userAddress);
          // Fallback to local inventory if contract call fails
          let onChainInventory;
          try {
            const [health, ki, immunity, score] = await shopContract.getPotionBalances(userAddress);
            onChainInventory = {
              health: Number(health),
              ki: Number(ki),
              immunity: Number(immunity),
              score: Number(score)
            };
            console.log("On-chain balances fetched:", onChainInventory);
          } catch (contractErr) {
            console.warn("Contract getPotionBalances failed, using local storage truth:", contractErr);
            return; // Exit if contract call fails to avoid overwriting with zeros
          }
          
          setInventory(onChainInventory);
          localStorage.setItem('player_inventory', JSON.stringify(onChainInventory));
          
          if (window.game) {
            (window.game as any).playerInventory = onChainInventory;
            const scene = (window.game as any).scene.getScene('MainScene');
            if (scene) {
              scene.events.emit('sync_inventory', onChainInventory);
            }
          }
        } catch (error) {
          console.error("Failed to fetch blockchain inventory:", error);
        }
      }
    };
    
    fetchInventory();
  }, []);

  const handleBuy = async (potion: Potion) => {
    try {
      if (!(window as any).ethereum) {
        alert("Please connect your wallet!");
        return;
      }

      setIsBuying(potion.id);
      
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      
      const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, SHOP_ABI, signer);
      const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);

      const priceInWei = ethers.parseUnits(potion.price.toString(), 6); // USDC typically has 6 decimals
      
      // 1. Check Allowance
      const allowance = await usdcContract.allowance(userAddress, SHOP_CONTRACT_ADDRESS);
      if (allowance < priceInWei) {
        console.log("Approving USDC...");
        const approveTx = await usdcContract.approve(SHOP_CONTRACT_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
        console.log("USDC Approved!");
      }

      // 2. Call Contract Function
      let tx;
      switch (potion.id) {
        case "health":
          tx = await shopContract.buyHealthPotion();
          break;
        case "ki":
          tx = await shopContract.buyKiPotion();
          break;
        case "immunity":
          tx = await shopContract.buyImmunityPotion();
          break;
        case "score":
          tx = await shopContract.buyScorePotion();
          break;
        default:
          throw new Error("Invalid potion type");
      }

      console.log("Transaction sent:", tx.hash);
      await tx.wait();
      console.log("Transaction confirmed!");
      
      // Update local state for immediate feedback
      const newInventory = {
        ...inventory,
        [potion.id]: (inventory[potion.id] || 0) + 1
      };
      
      setInventory(newInventory);
      localStorage.setItem('player_inventory', JSON.stringify(newInventory));
      
      if (window.game) {
        (window.game as any).playerInventory = newInventory;
        // Trigger sync event if game is running a scene that listens
        const scene = (window.game as any).scene.getScene('MainScene');
        if (scene) {
          scene.events.emit('sync_inventory', newInventory);
        }
      }

      alert(`${potion.name} purchased successfully on-chain!`);
    } catch (error: any) {
      console.error("Purchase failed:", error);
      alert(`Transaction failed: ${error.reason || error.message || "Unknown error"}`);
    } finally {
      setIsBuying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-slate-900 border-2 border-blue-500 text-white max-h-[90vh] flex flex-col overflow-hidden rounded-none shadow-[0_0_20px_rgba(59,130,246,0.3)]">
        <CardHeader className="border-b border-slate-800 relative">
          <div className="flex flex-col items-center justify-center py-2">
            <CardTitle className="text-3xl font-bold text-blue-500 uppercase tracking-widest text-center">SHOPPING</CardTitle>
            <CardDescription className="text-slate-400 mt-1">Buy powerful potions to help your journey</CardDescription>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="absolute right-4 top-4 text-slate-400 hover:text-white hover:bg-slate-800 rounded-none"
            >
              <span className="text-xl">✕</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <ScrollArea className="h-full p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POTIONS.map((potion) => {
                const Icon = potion.icon;
                const isLoading = isBuying === potion.id;
                const count = inventory[potion.id] || 0;

                return (
                  <Card key={potion.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-colors rounded-none">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 bg-slate-900 rounded-none ${potion.color}`}>
                          <Icon size={32} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-xl truncate">{potion.name}</h3>
                            <Badge variant="secondary" className="bg-blue-900/30 text-blue-400 rounded-none border-blue-500/30">
                              Owned: {count}
                            </Badge>
                          </div>
                          <p className="text-blue-400 text-sm font-bold mb-1 italic">{potion.effect}</p>
                          <p className="text-sm text-slate-400 mb-4 h-10 line-clamp-2">{potion.description}</p>
                          
                          <Button 
                            onClick={() => handleBuy(potion)}
                            disabled={!!isBuying}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold h-12 text-lg uppercase tracking-wider rounded-none shadow-lg border-none"
                          >
                            {isLoading ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              `Buy - ${potion.price} USDC`
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-6 border-t border-slate-800 flex justify-center">
          <Button 
            onClick={onClose}
            className="bg-[#FF6B6B] hover:bg-[#FF5252] text-black font-bold px-12 h-12 text-lg uppercase tracking-wider rounded-none shadow-lg"
          >
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}
