import Phaser from 'phaser';
import { ethers } from 'ethers';
import { ScarfComponent } from './scarf';

class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private playerScarf!: ScarfComponent;
    private playerGraphics!: Phaser.GameObjects.Graphics;
    private playerAuraGraphics!: Phaser.GameObjects.Graphics;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private kiarc: number = 0;
    private maxKiarc: number = 100;
    private health: number = 300;
    private maxHealth: number = 300;
    private enemies!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private keys!: any;
    private scoreText!: Phaser.GameObjects.Text;
    private enemyCounterText!: Phaser.GameObjects.Text;
    private kiarcBar!: Phaser.GameObjects.Graphics;
    private genkidama: Phaser.GameObjects.Arc | null = null;
    private isChargingGenkidama: boolean = false;
    private genkidamaChargeAmount: number = 0;
    private genkidamaText: Phaser.GameObjects.Text | null = null;
    private genkidamaPercentText: Phaser.GameObjects.Text | null = null;
    private isChargingKamehameha: boolean = false;
    private kamehamehaChargeTime: number = 0;
    private kamehamehaText: Phaser.GameObjects.Text | null = null;
    private kamehamehaChargeBar: Phaser.GameObjects.Graphics | null = null;
    
    // Cooldown system
    private specialsCooldowns: Record<string, { duration: number, startTime: number }> = {
        'V': { duration: 5000, startTime: 0 },
        'F': { duration: 0, startTime: 0 },
        'S': { duration: 5000, startTime: 0 },
        'B': { duration: 30000, startTime: 0 }
    };
    private specialsHUDGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private specialsHUDTimers: Map<string, Phaser.GameObjects.Text> = new Map();

    // Wave system variables
    private currentWave: number = 1;
    private isWaveInterval: boolean = false;
    private waveTimer: number = 0;
    private waveTimerEvent!: Phaser.Time.TimerEvent;
    private waveText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private spawnEvent!: Phaser.Time.TimerEvent;
    private enemiesSpawnedInWave: number = 0;
    private totalEnemiesInWave: number = 100;
    private totalEnemiesBeforeWave: number = 0;
    private maxSimultaneousEnemies: number = 200;
    private waveStartTime: number = 0;
    private gameStartTime: number = 0; // Timer global da partida
    private bossSpawned: boolean = false;
    private intervalTimerEvent: Phaser.Time.TimerEvent | null = null;

    // Enemy Type Definitions
    private enemyTypes = [
        { id: 'ground_biter', name: 'Ground Biter', sides: 4, color: 0x4ade80, behavior: 'melee', scale: 1.0 },
        { id: 'charger_ram', name: 'Charger Ram', sides: 5, color: 0x4ade80, behavior: 'charge', scale: 1.2 },
        { id: 'arc_shooter', name: 'Arc Shooter', sides: 3, color: 0x4ade80, behavior: 'ranged', scale: 1.0 },
        { id: 'hover_mage', name: 'Hover Mage', sides: 6, color: 0x4ade80, behavior: 'fly', scale: 1.1 },
        { id: 'pouncer', name: 'Pouncer', sides: 3, color: 0x4ade80, behavior: 'jump', scale: 0.8, inverted: true },
        { id: 'knockback_brute', name: 'Knockback Brute', sides: 4, color: 0x4ade80, behavior: 'knockback', scale: 1.5, ratio: 1.5 },
        { id: 'blink_stalker', name: 'Blink Stalker', sides: 8, color: 0x4ade80, behavior: 'teleport_bomb', scale: 0.8 },
        { id: 'split_core', name: 'Split Core', sides: 8, color: 0x4ade80, behavior: 'split_hybrid', scale: 1.2 },
        { id: 'shield_sentinel', name: 'Shield Sentinel', sides: 4, color: 0x4ade80, behavior: 'shield', scale: 1.3, doubleBorder: true },
        { id: 'arc_phantom', name: 'Arc Phantom', sides: 10, color: 0x4ade80, behavior: 'elite_hybrid', scale: 1.8 },
        { id: 'spin_star', name: 'Spin Star', sides: 10, isStar: true, color: 0x4ade80, behavior: 'spin', scale: 1.0 },
        { id: 'phase_heptar', name: 'Phase Heptar', sides: 7, color: 0x4ade80, behavior: 'phase', scale: 1.2 },
        { id: 'crescent_reaver', name: 'Crescent Reaver', sides: 30, isCrescent: true, color: 0x4ade80, behavior: 'arc_dash', scale: 1.2 },
        { id: 'spiral_warden', name: 'Spiral Warden', isSpiral: true, color: 0x4ade80, behavior: 'spiral', scale: 1.3 },
        { id: 'prism_drifter', name: 'Prism Drifter', sides: 4, ratio: 0.6, color: 0x4ade80, behavior: 'prism', scale: 1.1 }
    ];

    private waveConfigs = [
        { wave: 1, total: 100, duration: 45000, enemies: { ground_biter: 1.0 } },
        { wave: 2, total: 140, duration: 50000, enemies: { ground_biter: 0.65, charger_ram: 0.2, pouncer: 0.15 } },
        { wave: 3, total: 190, duration: 50000, enemies: { ground_biter: 0.5, charger_ram: 0.2, arc_shooter: 0.15, pouncer: 0.15 } },
        { wave: 4, total: 250, duration: 55000, enemies: { ground_biter: 0.3, charger_ram: 0.15, arc_shooter: 0.15, hover_mage: 0.15, pouncer: 0.1, spin_star: 0.15 } },
        { wave: 5, total: 320, duration: 60000, enemies: { ground_biter: 0.25, charger_ram: 0.15, arc_shooter: 0.1, hover_mage: 0.15, knockback_brute: 0.15, phase_heptar: 0.2 } },
        { wave: 6, total: 400, duration: 60000, enemies: { ground_biter: 0.2, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, knockback_brute: 0.1, split_core: 0.2, crescent_reaver: 0.2 } },
        { wave: 7, total: 500, duration: 70000, enemies: { ground_biter: 0.15, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, split_core: 0.15, shield_sentinel: 0.2, spiral_warden: 0.2 } },
        { wave: 8, total: 650, duration: 70000, enemies: { ground_biter: 0.1, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.1, prism_drifter: 0.3 } },
        { wave: 9, total: 850, duration: 70000, enemies: { ground_biter: 0.1, charger_ram: 0.05, arc_shooter: 0.05, hover_mage: 0.05, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.15, arc_phantom: 0.1, prism_drifter: 0.3 } },
        { wave: 10, total: 1100, duration: 70000, enemies: { ground_biter: 0.1, charger_ram: 0.05, arc_shooter: 0.05, hover_mage: 0.05, pouncer: 0.05, knockback_brute: 0.1, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.1, arc_phantom: 0.1, prism_drifter: 0.2 } }
    ];

    // Boss polygon graphics map
    private bossGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    private isGameOver: boolean = false;
    private level: number = 1;
    private levelTitle: string = 'Arc Initiate';
    private enemiesDefeated: number = 0;
    private isSubmittingScore: boolean = false;
    private finalScore: number = 0;
    private finalWave: number = 1;
    private finalEnemiesDefeated: number = 0;
    private finalPlayTime: number = 0;

    private isDefending: boolean = false;
    private shieldGraphics: Phaser.GameObjects.Graphics | null = null;
    
    private async updateLeaderboard() {
        try {
            const { fetchOnChainLeaderboard } = await import('./leaderboard');
            const scores = await fetchOnChainLeaderboard();
            console.log("✅ Leaderboard atualizado após fim de jogo:", scores.length, "itens");
            // Se houver uma forma de atualizar o componente Leaderboard do React, faríamos aqui.
            // O componente Leaderboard usa useQuery, então invalidar a query /api/leaderboard
            // no frontend deve ser suficiente.
        } catch (e) {
            console.warn("Erro ao atualizar leaderboard:", e);
        }
    }

    private async submitScoreOnChain() {
        if (this.isSubmittingScore || this.score <= 0) return;
        
        try {
            this.isSubmittingScore = true;
            console.log("📡 Iniciando registro de score on-chain...");

            if (!(window as any).ethereum) {
                console.warn("Wallet não conectada para registro on-chain");
                return;
            }

            const ARC_TESTNET_CONFIG = {
                chainId: "0x4cef52",
                chainName: "Arc Testnet",
                nativeCurrency: {
                    name: "ARC",
                    symbol: "ARC",
                    decimals: 18
                },
                rpcUrls: ["https://rpc.testnet.arc.network"],
                blockExplorerUrls: ["https://explorer.testnet.arc.network"]
            };

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            
            // Check network before submitting
            const network = await provider.getNetwork();
            if (network.chainId !== BigInt(parseInt(ARC_TESTNET_CONFIG.chainId, 16))) {
                try {
                    await (window as any).ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: ARC_TESTNET_CONFIG.chainId }],
                    });
                } catch (switchError: any) {
                    if (switchError.code === 4902) {
                        await (window as any).ethereum.request({
                            method: "wallet_addEthereumChain",
                            params: [ARC_TESTNET_CONFIG],
                        });
                    } else {
                        throw switchError;
                    }
                }
            }

            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            
            const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";
            const abi = ["function addScore(string name, uint256 score) public"];
            const contract = new ethers.Contract(contractAddress, abi, signer);

            // Nome do jogador vindo do Supabase ou da Wallet
            const playerName = (window as any).playerName || 
                ((window as any).walletAddress 
                    ? "Arc Player " + (window as any).walletAddress.substring(0, 6)
                    : "Arc Player");
            
            const totalPlayTime = Math.floor((this.time.now - this.gameStartTime - (this.totalPausedTime || 0)) / 1000);

            console.log(`Submetendo: ${playerName} - ${this.score}, Tempo: ${totalPlayTime}s`);
            const tx = await contract.addScore(playerName, BigInt(Math.floor(this.score)));
            console.log("Transação enviada:", tx.hash);
            
            // Also save to backend leaderboard
            try {
                await fetch('/api/saveScore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        playerName,
                        score: Math.floor(this.score),
                        wave: this.currentWave,
                        enemiesDefeated: this.enemiesDefeated,
                        playTime: totalPlayTime
                    })
                });
            } catch (apiErr) {
                console.warn("Failed to sync score with backend:", apiErr);
            }

            this.showPickupNotification("Submitting score to Blockchain...");
            await tx.wait();
            console.log("Score registrado com sucesso!");
            this.showPickupNotification("Score registered on-chain!");
            
        } catch (error) {
            console.error("Erro ao registrar score on-chain:", error);
        } finally {
            this.isSubmittingScore = false;
        }
    }
    
    // Power-up states and timers
    private activeBuffs: Map<string, { title: string, description: string, duration?: number, startTime?: number }> = new Map();
    
    // Power-up states
    private hasPowerBoost: boolean = false;
    private hasScoreBoost: boolean = false;
    private hasDamageBoost: boolean = false;
    private damageBoostTimer: number = 0;
    private isInvincible: boolean = false;
    private invincibilityTimer: number = 0;
    private items!: Phaser.Physics.Arcade.Group;
    private itemGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    // Level stats configuration
    private levelStats = [
        { lvl: 1, hp: 300, ki: 100, mult: 1.0, punch: 10, magic: 10, kame: 30, res: 0.00, score: 0 },
        { lvl: 2, hp: 420, ki: 140, mult: 1.4, punch: 20, magic: 15, kame: 50, res: 0.03, score: 50 },
        { lvl: 3, hp: 600, ki: 200, mult: 1.8, punch: 30, magic: 20, kame: 60, res: 0.06, score: 200 },
        { lvl: 4, hp: 850, ki: 280, mult: 2.2, punch: 40, magic: 25, kame: 80, res: 0.10, score: 1000 },
        { lvl: 5, hp: 1200, ki: 380, mult: 3.0, punch: 50, magic: 30, kame: 100, res: 0.15, score: 2000 },
        { lvl: 6, hp: 1700, ki: 520, mult: 3.4, punch: 60, magic: 40, kame: 120, res: 0.20, score: 5000 },
        { lvl: 7, hp: 2300, ki: 700, mult: 4.0, punch: 70, magic: 45, kame: 140, res: 0.25, score: 10000 },
        { lvl: 8, hp: 3100, ki: 950, mult: 4.5, punch: 80, magic: 50, kame: 160, res: 0.30, score: 50000 },
        { lvl: 9, hp: 4000, ki: 1300, mult: 5.0, punch: 100, magic: 100, kame: 200, res: 0.35, score: 200000 },
        { lvl: 10, hp: 8000, ki: 3000, mult: 6.0, punch: 200, magic: 200, kame: 400, res: 0.40, score: 2000000 }
    ];

    private levelTitles = [
        'Arc Initiate', 'Arc Novice', 'Arc Apprentice', 'Arc Adept', 'Arc Mage',
        'Arc Master', 'Arc Grandmaster', 'Arc Sage', 'Arc Archon', 'Arc Divine'
    ];

    // Public method to trigger a re-application of upgrades from the global game object
    public applyUpgradesFromGlobal() {
        if ((this.game as any).playerUpgrades) {
            this.playerUpgrades = (this.game as any).playerUpgrades;
            this.applyUpgrade();
            this.updateHUD();
        } else if ((window as any).playerUpgrades) {
            this.playerUpgrades = (window as any).playerUpgrades;
            (this.game as any).playerUpgrades = this.playerUpgrades;
            this.applyUpgrade();
            this.updateHUD();
        }
    }


    // Double-click dash system
    private lastKeyPressTime: { left: number, right: number, up: number, down: number } = { left: 0, right: 0, up: 0, down: 0 };
    private punchTimer: number = 0;
    private punchInterval: number = 200; // ms between punches when held
    private doubleClickWindow: number = 300; // milliseconds
    private dashSpeed: number = 800;
    private dashDuration: number = 150;
    private isDashing: boolean = false;
    private dashDirection: { x: number, y: number } = { x: 0, y: 0 };
    private dashEndTime: number = 0;

    // Music system
    private musicTracks = [
        '/0_1767069690246.mp3',
        '/1_1767069690246.mp3',
        '/2_1767069690245.mp3',
        '/3_1767069690247.mp3'
    ];
    private deathSoundKey = 'death_sound';
    private deathSoundPath = '/Death_(Player)_1767820208727.mp3';
    private defenseSoundKey = 'defense_sound';
    private defenseSoundPath = '/Som_Defesa_(player)_1767820303726.mp3';
    private currentMusicIndex: number = 0;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private openingMusic: Phaser.Sound.BaseSound | null = null;
    private isInGamemode: boolean = false;
    
    // Volume control
    private masterVolume: number = 1.0;
    private musicVolume: number = 1.0;
    private sfxVolume: number = 1.0;

    // Pause system
    private kiLabel: Phaser.GameObjects.Text | null = null;
    private upgradeIconsContainer: Phaser.GameObjects.Container | null = null;
    private purchasedUpgrades: Record<string, number> = {};
    private playerInventory: Record<string, number> = {
        health: 0,
        ki: 0,
        immunity: 0,
        score: 0
    };
    private inventoryHUD: Phaser.GameObjects.Container | null = null;
    private inventoryIcons: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private inventoryCounts: Map<string, Phaser.GameObjects.Text> = new Map();

    private useInventoryItem(type: string) {
        if (!this.playerInventory || (this.playerInventory[type] || 0) <= 0) return;

        let used = false;
        switch (type) {
            case 'health':
                if (this.health < this.maxHealth) {
                    this.health = this.maxHealth;
                    used = true;
                    this.showPickupNotification("HP Fully Restored!");
                }
                break;
            case 'ki':
                if (this.kiarc < this.maxKiarc) {
                    this.kiarc = this.maxKiarc;
                    used = true;
                    this.showPickupNotification("Ki Fully Restored!");
                }
                break;
            case 'immunity':
                this.isInvincible = true;
                this.invincibilityTimer = 30000;
                used = true;
                this.showPickupNotification("Invincibility Active (30s)!");
                break;
            case 'score':
                this.hasScoreBoost = true;
                this.activeBuffs.set('score_potion', {
                    title: 'Score Potion',
                    description: '2x Score Multiplier',
                    duration: 100000,
                    startTime: this.time.now - this.totalPausedTime
                });
                used = true;
                this.showPickupNotification("2x Score Active (100s)!");
                this.time.delayedCall(100000, () => {
                    this.hasScoreBoost = false;
                    this.activeBuffs.delete('score_potion');
                    this.updateHUD();
                });
                break;
        }

        if (used) {
            this.playerInventory[type]--;
            
            // Persist to wallet-specific local storage
            const walletAddress = (window as any).walletAddress;
            const inventoryKey = walletAddress 
                ? `player_inventory_${walletAddress.toLowerCase()}` 
                : 'player_inventory';
            
            localStorage.setItem(inventoryKey, JSON.stringify(this.playerInventory));
            (this.game as any).playerInventory = this.playerInventory;
            this.updateInventoryHUD();
            this.updateHUD();

            if (this.sfx['item_pickup']) {
                this.sfx['item_pickup'].play({ volume: this.sfxVolume });
            }
        }
    }

    private usePotion(type: string) {
        this.useInventoryItem(type);
    }

    private updateInventoryHUD() {
        // Ensure inventoryHUD container exists
        if (!this.inventoryHUD) {
            this.inventoryHUD = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
        }
        
        // Load inventory directly from localStorage using the connected wallet address
        const walletAddress = (window as any).walletAddress;
        const inventoryKey = walletAddress 
            ? `player_inventory_${walletAddress.toLowerCase()}` 
            : 'player_inventory';
        
        const saved = localStorage.getItem(inventoryKey);
        if (saved) {
            try {
                this.playerInventory = JSON.parse(saved);
                // Also update the global game object for consistency
                (this.game as any).playerInventory = this.playerInventory;
            } catch (e) {
                console.error("Error parsing inventory from localStorage:", e);
            }
        } else if ((this.game as any).playerInventory) {
            // Fallback to global if localStorage is empty but global has data
            this.playerInventory = (this.game as any).playerInventory;
        }

        // Ensure playerInventory is at least an empty object to prevent errors
        if (!this.playerInventory) {
            this.playerInventory = { health: 0, ki: 0, immunity: 0, score: 0 };
        }

        const items = [
            { id: 'health', key: 'Q', color: 0xff0000 },
            { id: 'ki', key: 'W', color: 0x0000ff },
            { id: 'immunity', key: 'E', color: 0xffff00 },
            { id: 'score', key: 'R', color: 0xa020f0 }
        ];
        
        // Match Upgrade HUD pattern: Left side, vertical
        const START_X = 20;
        // Position fixed at y=450 to avoid moving when upgrades change
        const fixedStartY = 450;
        
        const SPACING = 60;
        const SQUARE_SIZE = 50;

        items.forEach((item, index) => {
            const x = START_X;
            const y = fixedStartY + (index * SPACING);
            const count = this.playerInventory[item.id] || 0;
            
            let graphics = this.inventoryIcons.get(item.id);
            if (!graphics) {
                graphics = this.add.graphics();
                this.inventoryHUD!.add(graphics);
                this.inventoryIcons.set(item.id, graphics);
            }
            
            graphics.clear();
            graphics.lineStyle(2, item.color, count > 0 ? 1 : 0.3);
            graphics.strokeRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
            graphics.fillStyle(0x000000, 0.5);
            graphics.fillRect(x, y, SQUARE_SIZE, SQUARE_SIZE);
            
            graphics.fillStyle(item.color, count > 0 ? 0.8 : 0.2);
            if (item.id === 'health') {
                graphics.fillRect(x + 20, y + 10, 10, 30);
                graphics.fillRect(x + 10, y + 20, 30, 10);
            } else if (item.id === 'ki') {
                graphics.beginPath();
                graphics.moveTo(x + 30, y + 10);
                graphics.lineTo(x + 15, y + 30);
                graphics.lineTo(x + 25, y + 30);
                graphics.lineTo(x + 20, y + 45);
                graphics.lineTo(x + 40, y + 20);
                graphics.lineTo(x + 30, y + 20);
                graphics.closePath();
                graphics.fillPath();
            } else if (item.id === 'immunity') {
                graphics.beginPath();
                graphics.moveTo(x + 10, y + 10);
                graphics.lineTo(x + 40, y + 10);
                graphics.lineTo(x + 40, y + 35);
                graphics.lineTo(x + 25, y + 45);
                graphics.lineTo(x + 10, y + 35);
                graphics.closePath();
                graphics.fillPath();
            } else if (item.id === 'score') {
                const centerX = x + 25;
                const centerY = y + 25;
                const innerRadius = 8;
                const outerRadius = 18;
                const points = 5;
                graphics.beginPath();
                for (let i = 0; i < points * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / points) * i - Math.PI / 2;
                    const px = centerX + Math.cos(angle) * radius;
                    const py = centerY + Math.sin(angle) * radius;
                    if (i === 0) graphics.moveTo(px, py);
                    else graphics.lineTo(px, py);
                }
                graphics.closePath();
                graphics.fillPath();
            }

            let keyText = this.inventoryCounts.get(item.id + '_key');
            if (!keyText) {
                keyText = this.add.text(x + 4, y + 2, item.key, {
                    fontSize: '12px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 2,
                    fontStyle: 'bold'
                });
                this.inventoryHUD!.add(keyText);
                this.inventoryCounts.set(item.id + '_key', keyText);
            }
            keyText.setPosition(x + 4, y + 2);

            let qtyText = this.inventoryCounts.get(item.id + '_qty');
            if (!qtyText) {
                qtyText = this.add.text(x + SQUARE_SIZE - 4, y + SQUARE_SIZE - 4, `x${count}`, {
                    fontSize: '14px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#00ff00',
                    stroke: '#000000',
                    strokeThickness: 2,
                    fontStyle: 'bold'
                }).setOrigin(1, 1);
                this.inventoryHUD!.add(qtyText);
                this.inventoryCounts.set(item.id + '_qty', qtyText);
            }
            qtyText.setPosition(x + SQUARE_SIZE - 4, y + SQUARE_SIZE - 4);
            qtyText.setText(`x${count}`);
            qtyText.setColor(count > 0 ? '#00ff00' : '#666666');
        });
    }

    private buffIconsContainer: Phaser.GameObjects.Container | null = null;
    private tooltipContainer: Phaser.GameObjects.Container | null = null;
    private tooltipBg: Phaser.GameObjects.Graphics | null = null;
    private tooltipTitle: Phaser.GameObjects.Text | null = null;
    private tooltipText: Phaser.GameObjects.Text | null = null;
    private pickupNotification: Phaser.GameObjects.Text | null = null;
    private pickupNotificationBg: Phaser.GameObjects.Graphics | null = null;
    private pickupTimer: Phaser.Time.TimerEvent | null = null;
    private walletHUDText: Phaser.GameObjects.Text | null = null;
    private tooltipHideTimer: Phaser.Time.TimerEvent | null = null;
    private playerUpgrades: Record<string, number> = {
        arc_hp: 0,
        arc_ki: 0,
        arc_damage: 0,
        arc_defence: 0,
        arc_regen: 0,
        arc_vamp: 0
    };

    // 🔒 SISTEMA DE PAUSA - Variáveis obrigatórias
    private isGamePaused: boolean = false;
    private isPaused: boolean = false;
    private pauseModalOpen: boolean = false;
    private pausedTime: number = 0;
    private totalPausedTime: number = 0;
    private hpLabel: Phaser.GameObjects.Text | null = null;

    private sfx: { [key: string]: Phaser.Sound.BaseSound } = {};

    constructor() {
        super('MainScene');
    }

    // Draw a regular polygon and return the vertices
    private createPolygonGeometry(sides: number, radius: number): Phaser.Geom.Point[] {
        const points: Phaser.Geom.Point[] = [];
        const angleSlice = (Math.PI * 2) / sides;
        for (let i = 0; i < sides; i++) {
            const angle = i * angleSlice - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            points.push(new Phaser.Geom.Point(x, y));
        }
        return points;
    }

    // Draw a polygon with graphics
    private drawPolygon(graphics: Phaser.GameObjects.Graphics, sides: number, size: number, color: number) {
        graphics.clear();
        const points = this.createPolygonGeometry(sides, size);
        graphics.lineStyle(2, 0x4ade80, 1); // Verde fixo
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        // Sem preenchimento (vazado)
        graphics.strokePath();
    }

        // Draw evolving yellow square player based on level
    private drawPlayerSquare(level: number) {
        // Base size grows progressiveley
        const baseSize = 16;
        const scaleFactor = 1 + (level - 1) * 0.08; // ~8% growth per level
        const size = baseSize * scaleFactor;
        
        this.playerGraphics.clear();
        this.playerAuraGraphics.clear();
        
        const yellowColor = 0xffdd00;

        // Visual for Invincibility
        if (this.isInvincible) {
            this.playerAuraGraphics.lineStyle(2, 0x800080, 0.6);
            this.playerAuraGraphics.strokeCircle(this.player.x, this.player.y, size + 15);
        }

        // Visual for Power Boost
        const drawColor = this.hasPowerBoost ? 0xff0000 : yellowColor;
        
        // Rules: Hollow square, thickness/complexity grows with level
        if (level === 1) {
            // Lvl 1: Small, hollow, thin line, yellow, static
            this.playerGraphics.lineStyle(1.5, drawColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
        } else if (level === 2) {
            // Lvl 2: Slightly larger, thicker contour
            this.playerGraphics.lineStyle(4, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
        } else if (level === 3) {
            // Lvl 3: Larger + double border, robust
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.strokeRect(this.player.x - size - 4, this.player.y - size - 4, size * 2 + 8, size * 2 + 8);
        } else if (level === 4) {
            // Lvl 4: Larger + symmetric internal lines
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.lineStyle(1.5, yellowColor, 0.7);
            this.playerGraphics.lineBetween(this.player.x - size, this.player.y, this.player.x + size, this.player.y);
            this.playerGraphics.lineBetween(this.player.x, this.player.y - size, this.player.x, this.player.y + size);
        } else if (level === 5) {
            // Lvl 5: Inner hollow square, multiple layers
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.strokeRect(this.player.x - size/2, this.player.y - size/2, size, size);
        } else if (level === 6) {
            // Lvl 6: Chamfered corners (soft octagon)
            this.playerGraphics.lineStyle(3, yellowColor, 1);
            const chamfer = size * 0.25;
            this.playerGraphics.beginPath();
            this.playerGraphics.moveTo(this.player.x - size + chamfer, this.player.y - size);
            this.playerGraphics.lineTo(this.player.x + size - chamfer, this.player.y - size);
            this.playerGraphics.lineTo(this.player.x + size, this.player.y - size + chamfer);
            this.playerGraphics.lineTo(this.player.x + size, this.player.y + size - chamfer);
            this.playerGraphics.lineTo(this.player.x + size - chamfer, this.player.y + size);
            this.playerGraphics.lineTo(this.player.x - size + chamfer, this.player.y + size);
            this.playerGraphics.lineTo(this.player.x - size, this.player.y + size - chamfer);
            this.playerGraphics.lineTo(this.player.x - size, this.player.y - size + chamfer);
            this.playerGraphics.closePath();
            this.playerGraphics.strokePath();
        } else if (level === 7) {
            // Lvl 7: Animated internal lines, flow feeling
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            const flowOffset = (this.time.now / 10) % (size * 2);
            this.playerGraphics.lineStyle(1, yellowColor, 0.5);
            this.playerGraphics.lineBetween(this.player.x - size + flowOffset, this.player.y - size, this.player.x - size + flowOffset, this.player.y + size);
            this.playerGraphics.lineBetween(this.player.x - size, this.player.y - size + flowOffset, this.player.x + size, this.player.y - size + flowOffset);
        } else if (level === 8) {
            // Lvl 8: Concentric squares, different opacities
            for (let i = 0; i < 4; i++) {
                const layerSize = size - (i * (size / 4));
                this.playerGraphics.lineStyle(2, yellowColor, 1 - (i * 0.2));
                this.playerGraphics.strokeRect(this.player.x - layerSize, this.player.y - layerSize, layerSize * 2, layerSize * 2);
            }
        } else if (level === 9) {
            // Lvl 9: Pulsing aura, dominant square
            this.playerGraphics.lineStyle(4, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            const pulse = Math.sin(this.time.now / 200) * 0.5 + 0.5;
            this.playerAuraGraphics.lineStyle(4, yellowColor, pulse * 0.6);
            this.playerAuraGraphics.strokeRect(this.player.x - size - 10, this.player.y - size - 10, size * 2 + 20, size * 2 + 20);
        } else if (level === 10) {
            // Lvl 10: Max power, multi-layer aura, particles, orbital mana
            const auraPulse = Math.sin(this.time.now / 150) * 5;
            this.playerGraphics.lineStyle(5, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            
            // Multilayer aura
            for (let i = 1; i <= 3; i++) {
                const auraSize = size + (i * 8) + auraPulse;
                this.playerAuraGraphics.lineStyle(2, yellowColor, 0.4 / i);
                this.playerAuraGraphics.strokeRect(this.player.x - auraSize, this.player.y - auraSize, auraSize * 2, auraSize * 2);
            }

            // Orbital mana particles (visual only here, damage in update)
            const particleCount = 6;
            for (let i = 0; i < particleCount; i++) {
                const angle = (this.time.now / 500) + (i * (Math.PI * 2 / particleCount));
                const orbitRadius = size + 25;
                const px = this.player.x + Math.cos(angle) * orbitRadius;
                const py = this.player.y + Math.sin(angle) * orbitRadius;
                this.playerGraphics.fillStyle(0x00ffff, 0.8);
                this.playerGraphics.fillCircle(px, py, 4);
            }
        }
    }

    init(data: any) {
        // Reset basic game state
        this.level = data.level || 1;
        this.currentWave = 1;
        this.score = 0;
        this.enemiesDefeated = 0;
        this.totalEnemiesBeforeWave = 0;
        this.isGameOver = false;
        this.isWaveInterval = false; // Ensure we are not in interval state
        this.waveTimer = 0;

        // Reset timer tracking specifically
        // We will set this in create() using this.time.now
        this.waveStartTime = 0;
        this.gameStartTime = 0; // Reset global game timer 

        // Apply permanent upgrades if provided via scene data or global game object
        if (data?.upgrades) {
            this.playerUpgrades = data.upgrades;
        } else if ((this.game as any).playerUpgrades) {
            this.playerUpgrades = (this.game as any).playerUpgrades;
        }

        // Set initial stats based on level
        const stats = this.levelStats[this.level - 1] || this.levelStats[0];
        
        // Load inventory from localStorage
        const savedInv = localStorage.getItem('player_inventory');
        if (savedInv) {
            this.playerInventory = JSON.parse(savedInv);
            (this.game as any).playerInventory = this.playerInventory;
        }

        // Add event listener to sync inventory from external sources (like ShoppingModal)
        this.events.on('sync_inventory', (newInventory: any) => {
            this.playerInventory = newInventory;
            (this.game as any).playerInventory = newInventory;
            this.updateHUD();
        });

        this.health = stats.hp;
        this.maxHealth = stats.hp;
        this.kiarc = 0;
        this.maxKiarc = stats.ki;
        this.levelTitle = this.levelTitles[this.level - 1] || 'Arc Divine';

        // Sync inventory on-chain and with backend
        this.syncInventoryOnChain();
        this.syncWithBackendOnStart();

        // CRITICAL: Re-apply on-chain upgrade bonuses to the current level's base stats
        this.applyUpgrade();

        // Doom Mode specific adjustments
        if (data?.doomMode) {
            this.isInGamemode = true;
            this.stopOpeningMusic();
            this.playNextMusic();
        }

        // Reset other states
        this.hasPowerBoost = false;
        this.hasScoreBoost = false;
        this.isInvincible = false;
        this.activeBuffs.clear();
        
        // Load volume settings from localStorage
        this.masterVolume = (parseInt(localStorage.getItem('masterVolume') || '100')) / 100;
        this.musicVolume = (parseInt(localStorage.getItem('musicVolume') || '100')) / 100;
        this.sfxVolume = (parseInt(localStorage.getItem('sfxVolume') || '100')) / 100;
    }

    // Sound assets
    preload() {
        this.load.spritesheet('criptoide_basic', '/pixel_art_criptoide_basic_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('jungle_tiles', '/pixel_art_jungle_tileset.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('gokuarc', '/pixel_art_gokuarc_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('criptoide_jumper', '/pixel_art_criptoide_jumper_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('criptoide_shooter', '/pixel_art_criptoide_shooter_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('boss_criptoide', '/pixel_art_boss_criptoide_arcano_sprite_sheet.png', { frameWidth: 64, frameHeight: 64 });
        
        // Load music tracks
        this.load.audio('music_0', this.musicTracks[0]);
        this.load.audio('music_1', this.musicTracks[1]);
        this.load.audio('music_2', this.musicTracks[2]);
        this.load.audio('music_3', this.musicTracks[3]);

        // Load Opening Music - Tentar carregar como MP3 e OGG
        this.load.audio('opening_music', [
            '/Open_1767879401695.ogg',
            '/Open_1767879213418.mp3'
        ]);

        // Load SFX
        this.load.audio('genkidama_charge', '/ArcGenkiDama_(Carregando)_1767105766842.mp3');
        this.load.audio('genkidama_launch', '/ArcGenkiDama_(Lançando)_1767105766844.mp3');
        this.load.audio('kamehameha_charge', '/ArcKamehameha_(Carregando)_1767105836583.mp3');
        this.load.audio('kamehameha_launch', '/ArcKamehameha_(Lançando)_1767105839121.mp3');
        this.load.audio('charge_ki_new', '/Charge-KiArc_1767881300691.ogg');
        this.load.audio('charge_ki', '/Charge_KiArc_1767105879554.mp3');
        this.load.audio('dash', '/Dash_1767105889490.mp3');
        this.load.audio('explosion_ki', '/Explosion_KiArc_1767105910641.mp3');
        this.load.audio('item_pickup', '/Pegando_Item_1767106047757.mp3');
        this.load.audio('punch', '/Punch_1767106076988.mp3');
        this.load.audio('magic', '/Magic_1767122074232.mp3');
        this.load.audio('menu_button', '/Som_do_Botão_Start_Game_Leaderboard_e_History_1767106107861.ogg');
        this.load.audio('close_button', '/Close_1767118231095.ogg');
        this.load.audio('meteor_1', '/Meteor_1_1767808998910.ogg');
        this.load.audio('meteor_2', '/Meteor_2_1767809001052.ogg');
        this.load.audio(this.deathSoundKey, this.deathSoundPath);
        this.load.audio(this.defenseSoundKey, this.defenseSoundPath);

        // Load Special Icons
        this.load.image('icon_V', '/image_1767828341470.png');
        this.load.image('icon_B', '/image_1767828364520.png');
        this.load.image('icon_F', '/image_1767828377671.png');
        this.load.image('icon_S', '/image_1767828391361.png');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Handle wallet auto-connect if already connected in browser
        const autoConnectWallet = async () => {
            if ((window as any).ethereum) {
                try {
                    const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        (window as any).walletAddress = accounts[0];
                        console.log("Wallet auto-connected:", accounts[0]);
                    }
                } catch (err) {
                    console.error("Error auto-connecting wallet:", err);
                }
            }
        };
        autoConnectWallet();

        // Initialize and apply upgrades before starting
        const baseStats = this.levelStats[this.level - 1] || this.levelStats[0];
        this.maxHealth = baseStats.hp;
        this.health = this.maxHealth;
        this.maxKiarc = baseStats.ki;
        this.kiarc = 0;

        // SINCRONIZAÇÃO CRÍTICA: Carrega upgrades e inventário ANTES de qualquer lógica de jogo
        const globalUpgrades = (this.game as any).playerUpgrades || (window as any).playerUpgrades;
        if (globalUpgrades) {
            this.playerUpgrades = globalUpgrades;
            (this.game as any).playerUpgrades = globalUpgrades;
        }

        const globalInventory = (this.game as any).playerInventory || (window as any).playerInventory;
        if (globalInventory) {
            this.playerInventory = globalInventory;
            (this.game as any).playerInventory = globalInventory;
        }

        this.applyUpgradesFromGlobal();
        this.updateInventoryHUD();

        // Setup Inventory Hotkeys
        if (this.input && this.input.keyboard) {
            this.input.keyboard.on('keydown-Q', () => this.useInventoryItem('health'));
            this.input.keyboard.on('keydown-W', () => this.useInventoryItem('ki'));
            this.input.keyboard.on('keydown-E', () => this.useInventoryItem('immunity'));
            this.input.keyboard.on('keydown-R', () => this.useInventoryItem('score'));
        }

        // Enhanced background with depth
        this.add.rectangle(0, 0, width, height, 0x0a0a20).setOrigin(0).setScrollFactor(0);
        
        // Add starfield effect with twinkle
        for (let i = 0; i < 150; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.circle(x, y, Phaser.Math.FloatBetween(0.5, 2), 0xffffff, Phaser.Math.FloatBetween(0.2, 0.8));
            star.setScrollFactor(Phaser.Math.FloatBetween(0.05, 0.2));
            
            this.tweens.add({
                targets: star,
                alpha: 0.2,
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        const platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 100; i++) {
            const platform = platforms.create(i * 32, height - 16, 'jungle_tiles', 0).refreshBody();
            platform.setTint(0x1a472a);
        }

        this.player = this.physics.add.sprite(100, height - 100, 'jungle_tiles', 0);
        this.playerScarf = new ScarfComponent(this, this.player);
        this.player.setCollideWorldBounds(true);
        this.player.setAlpha(0);
        this.player.setDepth(10);
        this.player.setDisplaySize(32, 32);
        
        // Create graphics for player visual
        this.playerGraphics = this.add.graphics().setDepth(11);
        this.playerAuraGraphics = this.add.graphics().setDepth(9);
        
        // Character trail effect
        this.time.addEvent({
            delay: 50,
            callback: () => {
                if (this.player.active && this.player.body && (this.player.body.velocity.length() > 100 || this.isDashing)) {
                    const trailAlpha = this.isDashing ? 0.12 : 0.16;
                    const trailRadius = this.isDashing ? 9.6 : 16;
                    const trail = this.add.circle(this.player.x, this.player.y, trailRadius, 0xffd700, trailAlpha);
                    trail.setDepth(5);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
                        duration: this.isDashing ? 200 : 300,
                        onComplete: () => trail.destroy()
                    });
                }
            },
            loop: true
        });

        this.physics.add.collider(this.player, platforms);

        // Inicializar level se foi passado via data (Doom Mode)
        const data = this.scene.settings.data as any;
        if (data?.doomMode) {
            this.isInGamemode = true;
            this.stopOpeningMusic();
            this.level = data.level || 1;
            const stats = (this as any).levelStats[this.level - 1] || (this as any).levelStats[0];
            this.health = stats.hp;
            this.maxHealth = stats.hp;
            this.maxKiarc = stats.ki;
            this.levelTitle = (this as any).levelTitles[this.level - 1] || 'Arc Divine';
            // Start game music when in doom mode
            this.playNextMusic();
        } else {
            // Play game music (tracks 0-3) when starting normal game
            this.isInGamemode = true;
            this.stopOpeningMusic();
            // Pause opening music from React context
            if ((window as any).pauseOpening) {
                (window as any).pauseOpening();
            }
            this.playNextMusic();
        }

        this.keys = this.input.keyboard?.addKeys('Z,X,C,V,B,F,D,S,ONE,TWO,THREE,FOUR');

        // Initialize SFX
        const sfxKeys = [
            'genkidama_charge', 'genkidama_launch', 'kamehameha_charge', 'kamehameha_launch',
            'charge_ki', 'charge_ki_new', 'dash', 'explosion_ki', 'item_pickup', 'punch', 'magic',
            'menu_button', 'close_button', 'meteor_1', 'meteor_2',
            this.deathSoundKey, this.defenseSoundKey
        ];
        sfxKeys.forEach(key => {
            if (!this.sound.get(key)) {
                this.sfx[key] = this.sound.add(key);
            } else {
                this.sfx[key] = this.sound.get(key) as Phaser.Sound.BaseSound;
            }
            
            const volume = this.masterVolume * this.sfxVolume;
            if (this.sfx[key] && (this.sfx[key] as any).setVolume) {
                (this.sfx[key] as any).setVolume(volume);
            }
        });
        this.cursors = this.input.keyboard!.createCursorKeys();

        // ESC key for pause
        this.input.keyboard!.on('keydown-ESC', () => {
            // Cancel defense before pausing
            if (this.isDefending) {
                this.isDefending = false;
                if (this.shieldGraphics) {
                    this.shieldGraphics.destroy();
                    this.shieldGraphics = null;
                }
            }
            
            if (!this.isGameOver && !this.pauseModalOpen) {
                this.openPauseModal();
            } else if (this.pauseModalOpen && this.isPaused) {
                this.closePauseModal();
            }
        });

        // Enhanced HUD
        const hudScale = Math.max(1, width / 800);
        const fontSize = Math.floor(24 * hudScale);
        const titleFontSize = Math.floor(32 * hudScale);
        
        const fontStyle = { 
            fontSize: `${fontSize}px`, 
            color: '#ffffff', 
            fontFamily: '"PixelPurl", "Pixel", monospace',
            stroke: '#000000',
            strokeThickness: 3
        };
        this.scoreText = this.add.text(16, 16, `Score: ${this.score.toLocaleString()} | LEVEL: ${this.level} (${this.levelTitle})`, fontStyle).setScrollFactor(0).setDepth(1000);

        this.enemyCounterText = this.add.text(width - 16, 16 + fontSize * 2 + 20, `0/${this.totalEnemiesInWave}`, {
            fontSize: `${fontSize}px`,
            color: '#ff4444',
            fontFamily: '"PixelPurl", "Pixel", monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.waveText = this.add.text(width - 16, 16, 'WAVE: 1', { 
            fontSize: `${fontSize}px`, 
            color: '#fbbf24', 
            fontFamily: '"PixelPurl", "Pixel", monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.timerText = this.add.text(width - 16, 16 + fontSize + 10, '00:00', { 
            fontSize: `${fontSize}px`, 
            color: '#fff', 
            fontFamily: '"PixelPurl", "Pixel", monospace',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
        
        this.kiarcBar = this.add.graphics().setScrollFactor(0).setDepth(1000);
        
        // Permanent Upgrade Icons Container
        this.upgradeIconsContainer = this.add.container(16, 120).setScrollFactor(0).setDepth(1001);
        
        // Load initial upgrades
        this.loadPermanentUpgrades();
        
        // Buff Icons Container
        this.buffIconsContainer = this.add.container(16, 160).setScrollFactor(0).setDepth(1001);
        
        // Tooltip System
        this.tooltipContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(2000).setVisible(false);
        this.tooltipBg = this.add.graphics();
        this.tooltipTitle = this.add.text(10, 10, '', { fontSize: '18px', color: '#fbbf24', fontStyle: 'bold', fontFamily: '"Courier New", Courier, monospace' });
        this.tooltipText = this.add.text(10, 35, '', { fontSize: '14px', color: '#ffffff', fontFamily: '"Courier New", Courier, monospace', wordWrap: { width: 200 } });
        this.tooltipContainer.add([this.tooltipBg, this.tooltipTitle, this.tooltipText]);

        // Pickup Notification System
        this.pickupNotificationBg = this.add.graphics().setScrollFactor(0).setDepth(2001).setVisible(false);
        this.pickupNotification = this.add.text(16, 160, '', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: '"PixelPurl", monospace',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 }
        }).setScrollFactor(0).setDepth(2002).setVisible(false);

        // Event listener for scene shutdown - clean up labels
        this.events.once('shutdown', () => {
            if (this.hpLabel && this.hpLabel.active) {
                this.hpLabel.destroy();
            }
            if (this.kiLabel && this.kiLabel.active) {
                this.kiLabel.destroy();
            }
            this.hpLabel = null as any;
            this.kiLabel = null as any;
        });

        this.updateHUD();

        // Update buff icons in real-time
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                let changed = false;
                this.activeBuffs.forEach((buff, type) => {
                    if (buff.duration && buff.startTime) {
                        const now = (this.isGamePaused || this.isPaused) ? this.pausedTime - this.totalPausedTime : this.time.now - this.totalPausedTime;
                        const elapsed = (now - buff.startTime) / 1000;
                        if (elapsed >= buff.duration) {
                            this.activeBuffs.delete(type);
                            changed = true;
                        }
                    }
                });
                if (changed) this.updateBuffIcons();
            },
            loop: true
        });

        this.enemies = this.physics.add.group();
        this.items = this.physics.add.group();
        this.physics.add.collider(this.enemies, platforms);
        this.physics.add.collider(this.items, platforms);
        this.physics.add.collider(this.enemies, this.enemies); // Add collision between enemies
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);
        this.physics.add.overlap(this.player, this.items, this.handlePlayerItemCollision, undefined, this);

        // Item spawn timer (every 15 seconds)
        this.time.addEvent({
            delay: 15000,
            callback: this.spawnRandomItem,
            callbackScope: this,
            loop: true
        });

        // Inicializar timer global da partida
        this.gameStartTime = this.time.now;
        
        this.startWave();
    }

    private spawnBoss() {
        const width = this.cameras.main.width;
        const x = width / 2;
        const boss = this.enemies.create(x, 100, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        boss.setBounce(0.5);
        boss.setCollideWorldBounds(true);
        boss.setAlpha(0); // Hide sprite, use graphics instead
        
        // Determine sides based on wave
        let sides = 4; // Default to square
        const waveToUse = Math.min(this.currentWave, 10);
        if (waveToUse === 1) sides = 4;      // Square
        else if (waveToUse === 2) sides = 5; // Pentagon
        else if (waveToUse === 3) sides = 6; // Hexagon
        else if (waveToUse === 4) sides = 7; // Heptagon
        else if (waveToUse === 5) sides = 8; // Octagon
        else if (waveToUse === 6) sides = 9; // Nonagon
        else if (waveToUse === 7) sides = 10; // Decagon
        else if (waveToUse === 8) sides = 12; // Dodecagon
        else if (waveToUse === 9) sides = 15; // Complex Polygon
        else sides = 16 + Math.random() * 4; // Arcane form variation

        // Custom HP Progression from User
        const hpProgression: { [key: number]: number } = {
            1: 100, 2: 180, 3: 260, 4: 360, 5: 500,
            6: 700, 7: 950, 8: 1250, 9: 1600, 10: 2000
        };
        
        let health = hpProgression[waveToUse] || (2000 + (waveToUse - 10) * 500);
        const normalEnemyDamage = Math.pow(1.5, waveToUse - 1) * 0.01;
        let damage = normalEnemyDamage * 4;

        // Validation for boss stats
        if (isNaN(health) || !isFinite(health) || health <= 0) health = 1000;
        if (isNaN(damage) || !isFinite(damage) || damage <= 0) damage = 0.5;

        let sizeMultiplier = 1.0;

        if (this.currentWave > 10) {
            const infinityLevel = this.currentWave - 10;
            // Dano do boss vai aumentar em 200% e o HP também em 200% a cada wave infinita
            health *= Math.pow(3.0, infinityLevel);
            damage *= Math.pow(3.0, infinityLevel);
            sizeMultiplier = 2.0; // Dobro do tamanho
        }
        
        const baseSize = 25;
        const size = (baseSize + sides * 1.5) * 3 * sizeMultiplier;
        const hitAreaSize = size * 2; // Approximate diameter

        boss.setData('health', health);
        boss.setData('maxHealth', health);
        boss.setData('damage', damage);
        boss.setData('isBoss', true);
        boss.setData('sides', sides);
        boss.setData('size', size);
        
        const bossBody = boss.body as Phaser.Physics.Arcade.Body;
        bossBody.setSize(hitAreaSize, hitAreaSize);
        bossBody.setOffset(-hitAreaSize/2 + 16, -hitAreaSize/2 + 16);
        bossBody.setCollideWorldBounds(true);
        bossBody.setBounce(0.5, 0.5);
        
        // Create graphics for polygon rendering
        const bossGraphics = this.add.graphics();
        this.bossGraphicsMap.set(boss, bossGraphics);

        // Update Boss rendering to be hollow and green
        const renderBoss = () => {
            if (!boss.active) return;
            bossGraphics.clear();
            const bSize = boss.getData('size');
            const bSides = boss.getData('sides');
            const points = this.createPolygonGeometry(bSides, bSize);
            
            bossGraphics.lineStyle(4, 0x4ade80, 1); // Border green
            bossGraphics.beginPath();
            bossGraphics.moveTo(boss.x + points[0].x, boss.y + points[0].y);
            for (let i = 1; i < points.length; i++) {
                bossGraphics.lineTo(boss.x + points[i].x, boss.y + points[i].y);
            }
            bossGraphics.closePath();
            bossGraphics.strokePath();
        };
        this.events.on('update', renderBoss);
        boss.on('destroy', () => {
            this.events.off('update', renderBoss);
            bossGraphics.destroy();
        });
        
        // Boss Movement & Attack Logic
        let lastAttackTime = 0;
        let lastMovementTime = 0;
        let orbitAngle = 0;
        let isTeleporting = false;
        let polygonRotation = 0;

        const updateMovement = () => {
            if (!boss.active || !this.player.active) return;
            
            const time = this.time.now;
            const wave = this.currentWave;
            const isDashing = boss.getData('isDashing');

            if (isTeleporting) return;

            // Attack Logic (All waves have dash but with different patterns)
            const attackInterval = wave >= 6 ? 2000 : 3000;
            if (time - lastAttackTime > attackInterval && !isDashing) {
                lastAttackTime = time;
                
                // Special Attack: Teleport for Wave 9+
                if (wave >= 9 && Math.random() > 0.5) {
                    isTeleporting = true;
                    bossGraphics.setAlpha(0);
                    this.time.delayedCall(300, () => {
                        if (!boss.active) return;
                        boss.setPosition(this.player.x + Phaser.Math.Between(-100, 100), this.player.y - 200);
                        bossGraphics.setAlpha(1);
                        isTeleporting = false;
                        this.cameras.main.flash(200, 255, 0, 0, true);
                    });
                    return;
                }

                boss.setData('isDashing', true);
                
                const dashDelay = wave >= 5 ? 300 : 500;
                this.time.delayedCall(dashDelay, () => {
                    if (!boss.active) return;
                    
                    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                    const dashSpeed = wave >= 6 ? 1000 : 800;
                    boss.setVelocity(Math.cos(angle) * dashSpeed, Math.sin(angle) * dashSpeed);
                    
                    this.time.delayedCall(1000, () => {
                        if (boss.active) boss.setData('isDashing', false);
                    });
                });
                return;
            }

            if (isDashing) return;

            // Progressive Movement Patterns
            if (wave === 1) { // Square: Slow, straight, 4 directions, pauses
                if (time - lastMovementTime > 2000) {
                    lastMovementTime = time;
                    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
                    const dir = dirs[Math.floor(Math.random() * dirs.length)];
                    boss.setVelocity(dir[0] * 100, dir[1] * 100);
                }
            } 
            else if (wave === 2) { // Pentagon: Straight, more frequent, less pause
                if (time - lastMovementTime > 1200) {
                    lastMovementTime = time;
                    const angle = Math.floor(Math.random() * 5) * (Math.PI * 2 / 5);
                    boss.setVelocity(Math.cos(angle) * 150, Math.sin(angle) * 150);
                }
            }
            else if (wave === 3) { // Hexagon: Continuous, orbit player
                orbitAngle += 0.02;
                const targetX = this.player.x + Math.cos(orbitAngle) * 300;
                const targetY = this.player.y + Math.sin(orbitAngle) * 300;
                boss.setVelocity((targetX - boss.x) * 2, (targetY - boss.y) * 2);
            }
            else if (wave === 4) { // Heptagon: Short dashes/retreats, irregular
                if (time - lastMovementTime > 800) {
                    lastMovementTime = time;
                    const dist = Phaser.Math.Distance.Between(boss.x, boss.y, this.player.x, this.player.y);
                    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                    const speed = dist > 400 ? 400 : -300;
                    boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                }
            }
            else if (wave === 5) { // Octagon: Constant circulation, reactive
                const angle = Phaser.Math.Angle.Between(width/2, 600, boss.x, boss.y) + 0.03;
                const targetX = width/2 + Math.cos(angle) * 500;
                const targetY = 600 + Math.sin(angle) * 400;
                boss.setVelocity((targetX - boss.x) * 3, (targetY - boss.y) * 3);
            }
            else if (wave === 6) { // Nonagon: Short dash sequence, unpredictable
                if (time - lastMovementTime > 500) {
                    lastMovementTime = time;
                    const angle = Math.random() * Math.PI * 2;
                    boss.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
                }
            }
            else if (wave >= 7 && wave <= 8) { // Decagon/Dodecagon: Active chase + patterns
                const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                const speed = wave === 8 ? 400 : 300;
                boss.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                
                if (wave === 8) { // Add some rotation to the chase
                    boss.x += Math.cos(time/500) * 5;
                    boss.y += Math.sin(time/500) * 5;
                }
            }
            else if (wave >= 9) { // Complex/Arcane: Fluid, unstable, reactive
                const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
                const jitterX = Math.sin(time/100) * 20;
                const jitterY = Math.cos(time/100) * 20;
                boss.setVelocity(Math.cos(angle) * 450 + jitterX, Math.sin(angle) * 450 + jitterY);
            }
            
            // Update polygon rotation
            polygonRotation += 0.01;
        };
        
        this.events.on('update', updateMovement);
        boss.on('destroy', () => {
            this.events.off('update', updateMovement);
            bossGraphics.destroy();
            this.bossGraphicsMap.delete(boss);
        });

        // Visual name or shape representation
        const waveForShape = Math.min(this.currentWave, 10);
        const shapes = [
            'SQUARE', 'PENTAGON', 'HEXAGON', 'HEPTAGON', 
            'OCTAGON', 'NONAGON', 'DECAGON', 'DODECAGON', 
            'COMPLEX POLYGON', 'ARCANE FORM'
        ];
        const shapeName = shapes[waveForShape - 1] || 'ARCANE FORM';
        
        const hudScale = Math.max(1, this.cameras.main.width / 800);
        const bossFontSize = Math.floor(36 * hudScale);

        const bossText = this.add.text(x, 140, `BOSS: ${shapeName}`, { 
            fontSize: `${bossFontSize}px`,
            color: '#ff0000', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6,
            fontFamily: 'PixelPurl'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        const healthBar = this.add.graphics();
        
        const updateHUD = () => {
            if (boss.active) {
                // Draw polygon boss using container positioning
                bossGraphics.clear();
                bossGraphics.x = boss.x;
                bossGraphics.y = boss.y;
                bossGraphics.rotation = polygonRotation;
                this.drawPolygon(bossGraphics, Math.floor(sides), size, 0xff0000);
                
                // Update Health Bar
                healthBar.clear();
                healthBar.fillStyle(0x000000, 1);
                healthBar.fillRect(boss.x - 75, boss.y - (size + 20), 150, 15);
                healthBar.fillStyle(0xff0000, 1);
                const healthRatio = boss.getData('health') / health;
                healthBar.fillRect(boss.x - 75, boss.y - (size + 20), healthRatio * 150, 15);
                healthBar.lineStyle(2, 0xffffff, 1);
                healthBar.strokeRect(boss.x - 75, boss.y - (size + 20), 150, 15);
            } else {
                healthBar.destroy();
                bossText.destroy();
                this.events.off('update', updateHUD);
            }
        };
        this.events.on('update', updateHUD);
    }

    private getWaveConfig(wave: number) {
        return this.waveConfigs[Math.min(wave - 1, this.waveConfigs.length - 1)];
    }

    startWave() {
        this.isWaveInterval = false;
        this.enemiesSpawnedInWave = 0;
        this.totalEnemiesBeforeWave = this.enemiesDefeated;
        this.bossSpawned = false;
        this.waveStartTime = this.time.now;
        
        const config = this.getWaveConfig(this.currentWave) as any;
        if (this.currentWave > 10) {
            this.totalEnemiesInWave = 1200;
        } else {
            this.totalEnemiesInWave = config?.total || (100 + (this.currentWave - 1) * 50);
        }

        const waveName = this.currentWave > 10 ? `INFINITY WAVE ${this.currentWave}` : `WAVE: ${this.currentWave}`;
        this.waveText.setText(waveName);
        this.waveText.setColor('#fbbf24');

        if (this.spawnEvent) this.spawnEvent.destroy();
        
        // Spawn as fast as possible, spawnBatch handles the limit and timing
        const calculatedDelay = 200; 
        
        console.log(`Wave ${this.currentWave}: Spawning ${this.totalEnemiesInWave} enemies in ${config?.duration || 60000}ms (Max 200 on screen)`);

        this.spawnEvent = this.time.addEvent({
            delay: calculatedDelay,
            callback: this.spawnBatch,
            callbackScope: this,
            loop: true
        });

        // Use time.addEvent instead of delayedCall for boss spawn
        this.time.addEvent({
            delay: 10000,
            callback: () => {
                if (!this.isWaveInterval && !this.isGameOver && !this.bossSpawned) {
                    this.spawnBoss();
                    if (this.currentWave > 10) {
                        this.time.delayedCall(2000, () => this.spawnBoss());
                        this.time.delayedCall(4000, () => this.spawnBoss());
                    }
                    this.bossSpawned = true;
                }
            }
        });

        if (this.currentWave >= 9) {
            const delay = this.currentWave === 9 ? 90000 : 45000;
            this.time.addEvent({
                delay: delay,
                callback: () => {
                    if (!this.isWaveInterval && !this.isGameOver) {
                        this.spawnEnemyOfType('arc_phantom');
                    }
                }
            });
        }
    }

    private spawnBatch() {
        if (this.isWaveInterval || this.isGameOver) return;
        if (!this.enemies) return;

        const activeEnemies = this.enemies.countActive(true);
        if (activeEnemies >= this.maxSimultaneousEnemies) return;

        if (this.enemiesSpawnedInWave >= this.totalEnemiesInWave) {
            if (this.spawnEvent) {
                this.spawnEvent.destroy();
                this.spawnEvent = undefined as any;
            }
            return;
        }

        const config = this.getWaveConfig(this.currentWave) as any;
        const calculatedDelay = 200; // Deve ser o mesmo valor usado em startWave

        // Spawn logic: Respeitar a duração definida na configuração da onda
        const spawnDuration = config?.duration || (this.currentWave >= 7 ? 70000 : 60000);
        const enemiesPerSecond = this.totalEnemiesInWave / (spawnDuration / 1000);
        
        // Spawn a small batch or single enemy to keep it steady
        const batchSize = Math.max(1, Math.min(
            Math.ceil(enemiesPerSecond * (calculatedDelay / 1000)), 
            this.totalEnemiesInWave - this.enemiesSpawnedInWave,
            this.maxSimultaneousEnemies - activeEnemies
        ));

        for (let i = 0; i < batchSize; i++) {
            this.spawnEnemy();
        }
    }

    private spawnEnemy(specificType?: string): Phaser.Physics.Arcade.Sprite | null {
        if (this.isGameOver || this.isWaveInterval) return null;
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        let x, y;
        const spawnSide = Phaser.Math.Between(0, 2); // 0: Esquerda, 1: Direita, 2: Topo

        if (spawnSide === 0) {
            // Lateral Esquerda
            x = -50;
            y = Phaser.Math.Between(50, height - 200); // Evita o chão
        } else if (spawnSide === 1) {
            // Lateral Direita
            x = width + 50;
            y = Phaser.Math.Between(50, height - 200); // Evita o chão
        } else {
            // Topo
            x = Phaser.Math.Between(50, width - 50);
            y = -50;
        }

        let selectedTypeId = specificType || 'ground_biter';
        
        if (!specificType) {
            const config = this.getWaveConfig(this.currentWave);
            const rand = Math.random();
            let cumulative = 0;
            
            if (!config || !config.enemies) {
                // Infinity mode or fallback
                const fallbackConfig = this.waveConfigs[this.waveConfigs.length - 1];
                for (const [typeId, chance] of Object.entries(fallbackConfig.enemies)) {
                    cumulative += (chance as number);
                    if (rand <= cumulative) {
                        selectedTypeId = typeId;
                        break;
                    }
                }
            } else {
                for (const [typeId, chance] of Object.entries(config.enemies)) {
                    cumulative += (chance as number);
                    if (rand <= cumulative) {
                        selectedTypeId = typeId;
                        break;
                    }
                }
            }
        }

        const typeInfo = this.enemyTypes.find(t => t.id === selectedTypeId) || this.enemyTypes[0];
        
        let scaleModifier = 1.0;
        let damageModifier = 1.0;
        let hpModifier = 1.0;

        if (this.currentWave > 10) {
            const infinityLevel = this.currentWave - 10;
            scaleModifier = Math.min(3.0, Math.pow(1.2, infinityLevel));
            damageModifier = Math.pow(1.2, infinityLevel);
        } else if (this.currentWave >= 2) {
            scaleModifier = Math.min(3.0, Math.pow(1.4, this.currentWave - 1));
        }

        const enemy = this.createEnemyObject(x, y, { ...typeInfo, scale: (typeInfo.scale || 1) * scaleModifier }, damageModifier, hpModifier);
        if (enemy) this.enemiesSpawnedInWave++;
        return enemy;
    }

    private spawnEnemyOfType(typeId: string) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        let x, y;
        const spawnSide = Phaser.Math.Between(0, 2);

        if (spawnSide === 0) {
            x = -50;
            y = Phaser.Math.Between(50, height - 200);
        } else if (spawnSide === 1) {
            x = width + 50;
            y = Phaser.Math.Between(50, height - 200);
        } else {
            x = Phaser.Math.Between(50, width - 50);
            y = -50;
        }

        const typeInfo = this.enemyTypes.find(t => t.id === typeId) || this.enemyTypes[0];
        
        // Size and damage scaling for Infinity Wave or Waves 2-10
        let scaleModifier = 1.0;
        let damageModifier = 1.0;
        let hpModifier = 1.0;

        if (this.currentWave > 10) {
            const infinityLevel = this.currentWave - 10;
            scaleModifier = Math.min(3.0, Math.pow(1.2, infinityLevel));
            damageModifier = Math.pow(1.2, infinityLevel);
        } else if (this.currentWave >= 2) {
            scaleModifier = Math.min(3.0, Math.pow(1.4, this.currentWave - 1));
        }

        this.createEnemyObject(x, y, { ...typeInfo, scale: (typeInfo.scale || 1) * scaleModifier }, damageModifier, hpModifier);
    }

    private createEnemyObject(x: number, y: number, typeInfo: any, extraDamageMult: number = 1, extraHpMult: number = 1): Phaser.Physics.Arcade.Sprite | null {
        const enemy = this.enemies.create(x, y, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        if (!enemy) return null;
        enemy.setBounce(0.5);
        enemy.setCollideWorldBounds(true);
        enemy.setData('typeId', typeInfo.id);
        enemy.setData('behavior', typeInfo.behavior);
        
        const waveMultiplier = 1 + (this.currentWave - 1) * 0.2;
        const isElite = typeInfo.behavior === 'elite';
        
        const baseHealth = (isElite ? 200 : 20) * waveMultiplier * extraHpMult;
        const baseDamage = (isElite ? 0.2 : 0.05) * waveMultiplier * extraDamageMult;

        enemy.setData('health', isNaN(baseHealth) ? 20 : baseHealth);
        enemy.setData('damage', isNaN(baseDamage) ? 0.05 : baseDamage);
        enemy.setData('sides', typeInfo.sides);
        enemy.setData('color', typeInfo.color);
        
        enemy.setAlpha(0);
        const graphics = this.add.graphics();
        graphics.setDepth(8);

        const size = (isElite ? 32 : 16) * (typeInfo.scale || 1);
        enemy.setData('size', size);
        
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        body.setSize(size * 2, size * 2);
        
        const updateGraphics = () => {
            if (enemy.active) {
                graphics.clear();
                graphics.x = enemy.x;
                graphics.y = enemy.y;
                this.drawEnemyShape(graphics, typeInfo, size);
            } else {
                graphics.destroy();
                this.events.off('update', updateGraphics);
            }
        };
        this.events.on('update', updateGraphics);
        
        if (typeInfo.behavior === 'fly' || isElite) {
            body.setAllowGravity(false);
            enemy.y = Phaser.Math.Between(100, 400);
        }

        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const speed = 150 * waveMultiplier;
        enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        return enemy;
    }

    private drawEnemyShape(graphics: Phaser.GameObjects.Graphics, type: any, size: number) {
        graphics.clear();
        graphics.lineStyle(2, 0x4ade80, 1); // Fixed green outline

        if (type.doubleBorder) {
            graphics.lineStyle(2, 0x4ade80, 0.5); // Fixed green outline
        }

        if (type.isStar) {
            const innerRadius = size * 0.5;
            const outerRadius = size;
            const points: Phaser.Geom.Point[] = [];
            for (let i = 0; i < 10; i++) {
                const angle = (i * Math.PI) / 5 - Math.PI / 2;
                const r = i % 2 === 0 ? outerRadius : innerRadius;
                points.push(new Phaser.Geom.Point(Math.cos(angle) * r, Math.sin(angle) * r));
            }
            graphics.beginPath();
            graphics.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) graphics.lineTo(points[i].x, points[i].y);
            graphics.closePath();
            graphics.strokePath();
            return;
        }

        if (type.isCrescent) {
            graphics.beginPath();
            graphics.arc(0, 0, size, Math.PI * 0.2, Math.PI * 1.8);
            graphics.arc(size * 0.4, 0, size * 0.8, Math.PI * 1.7, Math.PI * 0.3, true);
            graphics.closePath();
            graphics.strokePath();
            return;
        }

        if (type.isSpiral) {
            graphics.beginPath();
            let r = 0;
            for (let a = 0; a < Math.PI * 6; a += 0.2) {
                r = (a / (Math.PI * 6)) * size;
                const px = Math.cos(a) * r;
                const py = Math.sin(a) * r;
                if (a === 0) graphics.moveTo(px, py);
                else graphics.lineTo(px, py);
            }
            graphics.strokePath();
            return;
        }

        const sides = type.sides;
        const points: Phaser.Geom.Point[] = [];
        const angleSlice = (Math.PI * 2) / sides;
        const offset = type.inverted ? Math.PI : -Math.PI / 2;

        for (let i = 0; i < sides; i++) {
            const angle = i * angleSlice + offset;
            const rx = Math.cos(angle) * size * (type.ratio || 1);
            const ry = Math.sin(angle) * size;
            points.push(new Phaser.Geom.Point(rx, ry));
        }

        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        // No fillPath() - Wireframe only
        graphics.strokePath();
    }

    startInterval() {
        this.isWaveInterval = true;
        this.waveText.setText('INTERVAL');
        this.waveText.setColor('#60a5fa');
        this.waveStartTime = this.time.now;

        if (this.spawnEvent) this.spawnEvent.destroy();
        
        // 30-second interval - use time.addEvent to respect pause
        this.waveTimerEvent = this.time.addEvent({
            delay: 30000,
            callback: () => {
                if (this.isGameOver) return;
                this.currentWave++;
                this.startWave();
            }
        });
    }

    private getDamageMultiplier(level: number): number {
        const multipliers: { [key: number]: number } = {
            1: 1.0,
            2: 1.5,
            3: 2.2,
            4: 3.2,
            5: 4.5,
            6: 6.0,
            7: 7.5,
            8: 9.0,
            9: 11.0,
            10: 15.0
        };
        return multipliers[level] || (level > 10 ? 15.0 : 1.0);
    }

    private getPlayerSpeed(level: number): number {
        const baseSpeed = 300;
        let bonus = 0;
        
        for (let i = 1; i < level; i++) {
            const currentLvl = i;
            if (currentLvl >= 9) {
                bonus += 0.20;
            } else if (currentLvl >= 4) {
                bonus += 0.15;
            } else {
                bonus += 0.10;
            }
        }
        
        return baseSpeed * (1 + bonus);
    }

    private checkDoubleClickDash(time: number) {
        const checkKey = (key: Phaser.Input.Keyboard.Key, direction: string, x: number, y: number) => {
            if (Phaser.Input.Keyboard.JustDown(key) && !this.keys.B.isDown) {
                const timeSinceLastPress = time - this.lastKeyPressTime[direction as keyof typeof this.lastKeyPressTime];
                
                if (timeSinceLastPress < this.doubleClickWindow) {
                    // Double-click detected!
                    this.startDash(x, y);
                }
                
                this.lastKeyPressTime[direction as keyof typeof this.lastKeyPressTime] = time;
            }
        };

        checkKey(this.cursors.left, 'left', -this.dashSpeed, 0);
        checkKey(this.cursors.right, 'right', this.dashSpeed, 0);
        checkKey(this.cursors.up, 'up', 0, -this.dashSpeed);
        checkKey(this.cursors.down, 'down', 0, this.dashSpeed);
    }

    private startDash(dirX: number, dirY: number) {
        if (this.isDashing) return; // Can't dash while already dashing
        
        this.isDashing = true;
        this.dashDirection = { x: dirX, y: dirY };
        this.dashEndTime = this.time.now + this.dashDuration;
        this.sfx['dash']?.play();
        
        // Visual effect: flash the player
        const flash = this.add.circle(this.player.x, this.player.y, 18, 0xffdd00, 0.48);
        this.tweens.add({
            targets: flash,
            scale: 1.2,
            alpha: 0,
            duration: this.dashDuration,
            onComplete: () => flash.destroy()
        });
    }

    private isMeteorFalling = false;
    private meteorEffect: Phaser.GameObjects.Graphics | null = null;

    private startArcMeteor() {
        if (this.player.body?.touching.down || this.isMeteorFalling) return;
        
        // Consumo de 100 de ki
        if (this.kiarc < 100) return;
        this.kiarc = Math.max(0, this.kiarc - 100);
        this.updateHUD();

        this.isMeteorFalling = true;
        this.specialsCooldowns['S'].startTime = this.time.now;
        this.player.setVelocity(0, 0);
        this.sfx['meteor_1']?.play();

        // Carregamento de 0.5 segundos (500ms)
        this.time.delayedCall(500, () => {
            if (this.player.active) {
                this.player.setVelocityY(4000); // Queda meteórica ainda mais rápida
                this.player.setData('isFastFalling', true); 
            }
        });
    }

    private showDamage(x: number, y: number, amount: number) {
        const damageText = this.add.text(x, y - 20, amount.toString(), {
            fontSize: '24px',
            color: '#ffff00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 4,
            fontFamily: '"PixelPurl", monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: damageText,
            y: y - 80,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.out',
            onComplete: () => damageText.destroy()
        });
    }

    private handleMeteorImpact() {
        if (!this.isMeteorFalling) return;
        this.isMeteorFalling = false;
        this.specialsCooldowns['S'].startTime = this.time.now;

        this.sfx['meteor_1']?.stop();
        this.sfx['meteor_2']?.play();
        this.cameras.main.shake(500, 0.04);

        // Explosão visual amarela
        const explosion = this.add.circle(this.player.x, this.player.y, 10, 0xffff00, 0.8);
        explosion.setDepth(this.player.depth + 1);
        this.tweens.add({
            targets: explosion,
            radius: 500,
            alpha: 0,
            duration: 600,
            onComplete: () => explosion.destroy()
        });

        // Dano em área e Knockback
        const impactRadius = 500;
        const impactX = this.player.x;
        const impactY = this.player.y;

        this.enemies.getChildren().forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (enemy && enemy.active && enemy.body) {
                const dist = Phaser.Math.Distance.Between(impactX, impactY, enemy.x, enemy.y);
                
                // Debug log para verificar distância e raio
                // console.log(`Inimigo a ${dist}px. Raio: ${impactRadius}`);

                if (dist <= impactRadius) {
                    // Knockback: inimigos voam longe
                    const angle = Phaser.Math.Angle.Between(impactX, impactY, enemy.x, enemy.y);
                    const force = (impactRadius - dist) * 15;
                    
                    enemy.setVelocity(
                        Math.cos(angle) * force,
                        Math.sin(angle) * force - 1000
                    );

                    // Dano de impacto (base 10 + 10 por nível)
                    const damage = 10 + (this.level * 10);
                    const currentHealth = enemy.getData('health') || 0;
                    const newHealth = Math.max(0, currentHealth - damage);
                    
                    enemy.setData('health', newHealth);
                    enemy.setTint(0xff0000);
                    
                    // Mostra o número de dano
                    this.showDamage(enemy.x, enemy.y, Math.round(damage));
                    
                    if (newHealth <= 0) {
                        this.time.delayedCall(50, () => {
                            if (enemy.active) {
                                // @ts-ignore
                                if (typeof this.onEnemyDefeated === 'function') {
                                    // @ts-ignore
                                    this.onEnemyDefeated(enemy);
                                } else {
                                    enemy.destroy();
                                }
                            }
                        });
                    } else {
                        this.time.delayedCall(200, () => {
                            if (enemy.active) enemy.clearTint();
                        });
                    }
                }
            }
        });
    }

    update(time: number, delta: number) {
        // ⚠️ BLOQUEIA waves, intervalos, spawn e HUD durante pausa
        if (this.isGamePaused || this.isPaused) {
            return;
        }
        
        if (this.isGameOver) return;

        // ⏱️ Timer Global da Partida (subtraindo tempo total pausado)
        const nowForTimer = this.isPaused ? this.pausedTime : this.time.now;
        const gameElapsed = Math.max(0, Math.floor((nowForTimer - this.gameStartTime - this.totalPausedTime) / 1000));
        
        // Atualização visual do timer no HUD (sempre crescente)
        const mins = Math.floor(gameElapsed / 60);
        const secs = gameElapsed % 60;
        this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

        // Update scarf
        if (this.playerScarf) {
            this.playerScarf.update(this.player.body?.velocity.x || 0, this.player.body?.velocity.y || 0);
        }

        // Se estiver defendendo, força a velocidade a zero para ficar parado
        if (this.isDefending && this.player && this.player.body) {
            this.player.setVelocity(0, 0);
        }

        // Defense mechanism (Key D)
        if (Phaser.Input.Keyboard.JustDown(this.keys.D) && !this.isGameOver && !this.isChargingGenkidama && !this.isChargingKamehameha) {
            this.isDefending = true;
            if (this.sfx[this.defenseSoundKey]) {
                this.sfx[this.defenseSoundKey].play({ volume: this.sfxVolume });
            }
        }
        
        if (this.keys.D.isDown && !this.isChargingGenkidama && !this.isChargingKamehameha) {
            this.isDefending = true;
            if (!this.shieldGraphics) {
                this.shieldGraphics = this.add.graphics().setDepth(this.player.depth + 1);
            }
            this.shieldGraphics.clear();
            this.shieldGraphics.lineStyle(4, 0x4ade80, 0.5);
            this.shieldGraphics.fillStyle(0x4ade80, 0.2);
            const shieldRadius = 40;
            this.shieldGraphics.fillCircle(this.player.x, this.player.y, shieldRadius);
            this.shieldGraphics.strokeCircle(this.player.x, this.player.y, shieldRadius);
        } else {
            this.isDefending = false;
            if (this.shieldGraphics) {
                this.shieldGraphics.destroy();
                this.shieldGraphics = null;
            }
        }

        if (this.isInvincible) {
            this.invincibilityTimer -= delta;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        const currentSpeed = this.getPlayerSpeed(this.level);

        // Wave conclusion check
        if (!this.isWaveInterval && this.enemiesSpawnedInWave >= this.totalEnemiesInWave && this.enemies.countActive(true) === 0) {
            this.startInterval();
        }

        // Handle dash
        if (this.isDashing && time > this.dashEndTime) {
            this.isDashing = false;
        }

        // Check for double-click dash on arrow keys
        this.checkDoubleClickDash(time);

        // KiArc Explosion (Key F)
        if (Phaser.Input.Keyboard.JustDown(this.keys.F) && !this.isDefending) {
            if (this.kiarc >= 100) {
                this.kiarc = Math.max(0, this.kiarc - 100);
                this.useKiArcExplosion();
                this.updateHUD();
            }
        }

        // Potion Hotkeys (1, 2, 3, 4)
        if (Phaser.Input.Keyboard.JustDown(this.keys.ONE)) this.usePotion('health');
        if (Phaser.Input.Keyboard.JustDown(this.keys.TWO)) this.usePotion('ki');
        if (Phaser.Input.Keyboard.JustDown(this.keys.THREE)) this.usePotion('immunity');
        if (Phaser.Input.Keyboard.JustDown(this.keys.FOUR)) this.usePotion('score');

        // Horizontal movement
        if (!this.isDashing && !this.isDefending) {
            if (this.cursors.left.isDown && !this.keys.B.isDown) {
                this.player.setVelocityX(-currentSpeed);
                this.player.flipX = true;
            } else if (this.cursors.right.isDown && !this.keys.B.isDown) {
                this.player.setVelocityX(currentSpeed);
                this.player.flipX = false;
            } else {
                this.player.setVelocityX(0);
            }

            // Vertical movement (Flying/Jumping)
            if (this.cursors.up.isDown && !this.keys.B.isDown) {
                this.player.setVelocityY(-currentSpeed);
            } else if (this.cursors.down.isDown && !this.keys.B.isDown) {
                this.player.setVelocityY(currentSpeed);
                this.player.setData('isFastFalling', true);
            } else if (!this.player.body?.touching.down && !this.keys.B.isDown) {
                // Optional: Slight gravity or hover effect if needed, 
                // but the prompt implies direct control "voando para cima ou para baixo"
                // If we want it to feel like flying, we might want to disable gravity or just let velocity work
            }
        } else if (this.isDashing) {
            // Apply dash velocity
            this.player.setVelocity(this.dashDirection.x, this.dashDirection.y);
        } else if (this.isDefending) {
            // Force zero velocity while defending to override any pending input
            this.player.setVelocity(0, 0);
        }

        // Enemy Pursuit Logic
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (enemy.active && this.player.active) {
                const behavior = enemy.getData('behavior');
                const enemySpeed = enemy.getData('speed') || 100;
                const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

                // Common Melee logic: All enemies attack melee if close
                if (dist < 40) {
                    this.enemyMeleeAttack(enemy);
                }

                switch (behavior) {
                    case 'spin':
                        enemy.setAngularVelocity(360);
                        enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        if (dist < 200 && Math.random() < 0.02) {
                            const dashAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                            enemy.setVelocity(Math.cos(dashAngle) * 600, Math.sin(dashAngle) * 600);
                        }
                        break;
                    case 'phase':
                        if (time % 2000 < 1000) {
                            enemy.setAlpha(0.3);
                            enemy.setData('isPhased', true);
                        } else {
                            if (enemy.getData('isPhased')) {
                                this.useEnemyHexPulse(enemy);
                                enemy.setData('isPhased', false);
                            }
                            enemy.setAlpha(1.0);
                        }
                        enemy.setVelocity(Math.cos(angle) * enemySpeed * 0.5, Math.sin(angle) * enemySpeed * 0.5);
                        break;
                    case 'arc_dash':
                        const orbitX = this.player.x + Math.cos(time/500) * 200;
                        const orbitY = this.player.y + Math.sin(time/500) * 200;
                        enemy.setVelocity((orbitX - enemy.x) * 2, (orbitY - enemy.y) * 2);
                        if (Math.random() < 0.01) {
                            this.enemyCrescentSlash(enemy);
                        }
                        break;
                    case 'spiral':
                        const spiralTargetX = this.player.x + Math.cos(time/1000) * 300;
                        const spiralTargetY = this.player.y + Math.sin(time/1000) * 300;
                        enemy.setVelocity((spiralTargetX - enemy.x) * 1, (spiralTargetY - enemy.y) * 1);
                        if (Math.random() < 0.02) {
                            this.enemySpiralCast(enemy);
                        }
                        // Mana Pull
                        if (dist < 400) {
                            this.player.x += (enemy.x - this.player.x) * 0.005;
                            this.player.y += (enemy.y - this.player.y) * 0.005;
                        }
                        break;
                    case 'prism':
                        const zigZagX = Math.sin(time/200) * 100;
                        enemy.setVelocity(Math.cos(angle) * enemySpeed + zigZagX, Math.sin(angle) * enemySpeed);
                        if (Math.random() < 0.01) {
                            this.enemyTriArcSpell(enemy);
                        }
                        break;
                    case 'charge':
                        if (!enemy.getData('isDashing') && dist < 300) {
                            this.enemyDashAttack(enemy);
                        } else if (!enemy.getData('isDashing')) {
                            enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        }
                        break;
                    case 'ranged':
                        if (dist > 250) {
                            enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        } else {
                            enemy.setVelocity(0, 0);
                            this.enemyShootMagic(enemy);
                        }
                        break;
                    case 'fly':
                        // Hover Mage: Shoots continuous beam and dodges
                        this.enemyContinuousBeam(enemy);
                        this.enemyDodgeBehavior(enemy);
                        enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        break;
                    case 'jump':
                        if (!enemy.getData('isJumping') && dist < 200) {
                            this.enemyJumpAttack(enemy);
                        } else if (!enemy.getData('isJumping')) {
                            enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        }
                        break;
                    case 'teleport_bomb':
                        if (dist < 50) {
                            this.enemyExplode(enemy);
                        } else {
                            enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        }
                        break;
                    case 'split_hybrid':
                        if (dist < 200) {
                            this.enemyShootArrow(enemy);
                        }
                        enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        break;
                    case 'elite_hybrid':
                        this.enemyEliteBehavior(enemy);
                        enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        break;
                    default:
                        if (behavior === 'fly' || behavior === 'teleport' || behavior === 'elite') {
                            enemy.setVelocity(Math.cos(angle) * enemySpeed, Math.sin(angle) * enemySpeed);
                        } else {
                            if (enemy.x < this.player.x) {
                                enemy.setVelocityX(enemySpeed);
                            } else {
                                enemy.setVelocityX(-enemySpeed);
                            }
                        }
                }
            }
        });

        // ArcMeteor (Key S)
        const canUseS = this.kiarc >= 100 && (this.time.now - this.specialsCooldowns['S'].startTime >= this.specialsCooldowns['S'].duration);
        if (Phaser.Input.Keyboard.JustDown(this.keys.S) && !this.isMeteorFalling && !this.isDefending && canUseS) {
            this.specialsCooldowns['S'].startTime = this.time.now;
            this.startArcMeteor();
        }

        // Handle ArcKiExplosion (Key F)
        const canUseF = this.kiarc >= 100;
        if (Phaser.Input.Keyboard.JustDown(this.keys.F) && !this.keys.B.isDown && !this.isDefending && canUseF) {
            this.specialsCooldowns['F'].startTime = this.time.now;
            this.updateHUD();
            this.arcKiExplosion(); 
        }

        if (this.isMeteorFalling) {
            this.player.setVelocityX(0);
            if (this.player.body) {
                this.player.setVelocityY(4000);
            }
            
            // Verifica impacto com o solo
            if (this.player.body?.touching.down) {
                this.handleMeteorImpact();
            }
            // Efeito visual de rastro (Meteor 1)
            if (this.time.now % 50 < 20) {
                const trail = this.add.circle(this.player.x, this.player.y, 15, 0xffa500, 0.6);
                this.tweens.add({
                    targets: trail,
                    alpha: 0,
                    scale: 0.5,
                    duration: 200,
                    onComplete: () => trail.destroy()
                });
            }
        }

        // Ground Impact logic
        if (this.player.body?.touching.down) {
            if (this.isMeteorFalling) {
                this.handleMeteorImpact();
            } else if (this.player.getData('isFastFalling')) {
                this.handleGroundImpact();
                this.player.setData('isFastFalling', false);
            }
        }

        // Handle punching
        if (this.keys.Z.isDown && !this.keys.B.isDown && !this.isDefending) {
            if (time > this.punchTimer) {
                // Can attack while dashing for extra damage
                this.attack(this.isDashing ? 1.5 : 1.0);
                this.punchTimer = time + this.punchInterval;
            }
        }
        
        if (this.keys.X.isDown && !this.keys.B.isDown && !this.isChargingKamehameha && !this.isDefending) {
            this.chargeKiarc();
        } else {
            // Stop charging sound if X is released
            if (this.sfx['charge_ki_new']?.isPlaying) {
                this.sfx['charge_ki_new'].stop();
            }
        }

        // MagicKiArc (Key C) - No cooldown
        if (Phaser.Input.Keyboard.JustDown(this.keys.C) && this.kiarc >= 5 && !this.keys.B.isDown && !this.isDefending) {
            this.shootMagic();
        }

        if (this.keys.V.isDown && this.kiarc >= 100 && !this.keys.B.isDown && !this.isChargingKamehameha && !this.isDefending) {
            this.startKamehamehaCharge();
        }

        if (this.isChargingKamehameha) {
            this.updateKamehamehaCharge();
        }

        // Handle ArcGenkiDama (B Key)
        if (this.keys.B.isDown && !this.isDefending) {
            // Check if cooldown is active
            const now = this.time.now;
            const cooldown = this.specialsCooldowns['B'];
            const timeElapsed = now - cooldown.startTime;
            
            if (timeElapsed >= cooldown.duration) {
                if (this.kiarc > 0) {
                    this.player.setVelocity(0, 0);
                    if (this.player.body) {
                        (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
                    }
                    this.chargeGenkidama();
                }
            } else {
                // Optional: visual feedback that it's on cooldown
                if (!this.isChargingGenkidama && this.time.now % 1000 < 20) {
                    const remaining = Math.ceil((cooldown.duration - timeElapsed) / 1000);
                    this.showPickupNotification(`Genkidama Cooldown: ${remaining}s`);
                }
            }
        } else if (Phaser.Input.Keyboard.JustUp(this.keys.B) && this.isChargingGenkidama) {
            if (this.player.body) {
                (this.player.body as Phaser.Physics.Arcade.Body).setAllowGravity(true);
            }
            if (this.genkidamaChargeAmount >= 200) {
                this.shootGenkidama();
            } else {
                // Fail to launch if threshold not met
                const failText = this.add.text(this.player.x, this.player.y - 50, 'FAIL', {
                    fontSize: '32px',
                    color: '#ff0000',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 6,
                    fontFamily: '"PixelPurl", monospace'
                }).setOrigin(0.5);

                this.tweens.add({
                    targets: failText,
                    y: failText.y - 50,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => failText.destroy()
                });

                if (this.genkidama) {
                    this.sfx['genkidama_charge']?.stop();
                    this.genkidama.destroy();
                    this.genkidama = null;
                }
                if (this.genkidamaText) {
                    this.genkidamaText.destroy();
                    this.genkidamaText = null;
                }
                if (this.genkidamaPercentText) {
                    this.genkidamaPercentText.destroy();
                    this.genkidamaPercentText = null;
                }
                this.genkidamaChargeAmount = 0;
                this.isChargingGenkidama = false;
            }
        }

        // Handle Level 10 AOE Damage
        if (this.level >= 10) {
            const scaleFactor = 1 + (this.level - 1) * 0.08;
            const size = 16 * scaleFactor;
            const auraRadius = size + 30;
            this.enemies.getChildren().forEach((enemy: any) => {
                if (enemy.active) {
                    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    if (dist < auraRadius) {
                        const currentHealth = enemy.getData('health');
                        enemy.setData('health', Math.max(0, (currentHealth || 0) - 1));
                        
                        // Visual feedback for aura damage
                        if (this.time.now % 500 < 20) {
                            enemy.setTint(0x00ffff);
                            this.time.delayedCall(100, () => {
                                if (enemy.active) enemy.clearTint();
                            });
                        }

                        if (enemy.getData('health') <= 0) {
                            if (enemy.getData('isDefeated')) return;
                            enemy.setData('isDefeated', true);

                            if (enemy.getData('isBoss')) {
                                const waveNum = this.currentWave || 1;
                                let bossScore = 20 * Math.pow(5, waveNum - 1);
                                if (this.hasScoreBoost) bossScore *= 2;
                                this.score += Math.min(bossScore, 100);
                            } else {
                                let auraScore = 1;
                                if (this.hasScoreBoost) auraScore *= 2;
                                this.score += Math.min(auraScore, 100);
                            }
                            this.enemiesDefeated++;
                            this.createExplosion(enemy.x, enemy.y);
                            enemy.destroy();
                        }
                    }
                }
            });
        }

        this.drawPlayerSquare(this.level);
        this.drawItems();
        
        this.updateHUD();
    }

    private handleGroundImpact() {
        // Multiplicador de level baseado na solicitação do usuário
        const levelMultipliers: { [key: number]: number } = {
            1: 0.05,
            2: 0.08,
            3: 0.10,
            4: 0.15,
            5: 0.20,
            6: 0.25,
            7: 0.30,
            8: 0.40,
            9: 0.50,
            10: 1.00
        };
        
        const multiplier = levelMultipliers[this.level] || (this.level > 10 ? 1.0 : 0.05);

        // Efeito visual de tremor na câmera proporcional ao level
        this.cameras.main.shake(400, 0.04 * multiplier);
        
        // Círculo de impacto visual proporcional ao level
        const baseRadius = 400;
        const currentRadius = baseRadius * multiplier;
        const impactCircle = this.add.circle(this.player.x, this.player.y + 16, 20, 0xffdd00, 0.24);
        this.tweens.add({
            targets: impactCircle,
            radius: currentRadius,
            alpha: 0,
            duration: 400,
            onComplete: () => impactCircle.destroy()
        });

        // Afastar inimigos próximos com força proporcional ao level
        const impactRadius = currentRadius;
        this.enemies.getChildren().forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (!enemy || !enemy.active || !enemy.body) return;

            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            
            if (distance < impactRadius) {
                // Calcular direção da força
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                
                // Multiplicador de força proporcional ao level
                const baseForceMultiplier = 15;
                const force = (impactRadius - distance) * baseForceMultiplier;
                
                // Aplicar velocidade explosiva (Knockback proporcional)
                enemy.setVelocity(
                    Math.cos(angle) * force,
                    Math.sin(angle) * force - (600 * multiplier) // Joga para cima proporcionalmente
                );

                // Apenas knockback, sem dano conforme solicitado
                // this.hitEnemy(enemy, 1);
            }
        });
    }

    private renderBasicsControls() {
        const { width, height } = this.cameras.main;
        const basics = [
            { key: 'Z', label: 'Z', action: 'Punch' },
            { key: 'X', label: 'X', action: 'Charge Ki' },
            { key: 'C', label: 'C', action: 'Magic Ki' },
            { key: 'D', label: 'D', action: 'Defense' }
        ];

        const size = 64;
        const spacing = 12;
        const specialsCount = 4;
        const totalItemsCount = basics.length + specialsCount;
        const totalHeight = (size + spacing) * totalItemsCount - spacing;
        
        // Centraliza verticalmente o conjunto total (Basics + Specials) e move um pouco para baixo
        const startYAll = (height - totalHeight) / 2 + 30;
        const x = width - 50;

        basics.forEach((basic, index) => {
            const y = startYAll + index * (size + spacing);
            
            // Background/Border
            let graphics = this.specialsHUDGraphics.get('basic_' + basic.key);
            if (!graphics) {
                graphics = this.add.graphics().setScrollFactor(0).setDepth(1002);
                this.specialsHUDGraphics.set('basic_' + basic.key, graphics);
            }
            graphics.clear();
            graphics.lineStyle(2, 0x4ade80, 0.64); // 20% more transparent (0.8 * 0.8)
            graphics.fillStyle(0x000000, 0.32); // 20% more transparent (0.4 * 0.8)
            graphics.strokeRect(x - size/2, y - size/2, size, size);
            graphics.fillRect(x - size/2, y - size/2, size, size);

            // Key Label (Center)
            let keyText = this.specialsHUDTimers.get('basic_key_' + basic.key);
            if (!keyText) {
                keyText = this.add.text(x, y, basic.key, {
                    fontSize: '36px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 8
                }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
                this.specialsHUDTimers.set('basic_key_' + basic.key, keyText);
            }
            keyText.setAlpha(1.0);
            keyText.setPosition(x, y);

            // Action Label (Bottom)
            let actionText = this.specialsHUDTimers.get('basic_action_' + basic.key);
            if (!actionText) {
                actionText = this.add.text(x, y + size/2 - 6, basic.action, {
                    fontSize: '12px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1004);
                this.specialsHUDTimers.set('basic_action_' + basic.key, actionText);
            }
            actionText.setAlpha(1.0);
            actionText.setPosition(x, y + size/2 - 6);
        });
    }

    private renderSpecialsCooldowns() {
        const { width, height } = this.cameras.main;
        const specials = [
            { key: 'S', label: 'S', ki: 100 },
            { key: 'F', label: 'F', ki: 100 },
            { key: 'V', label: 'V', ki: 100 },
            { key: 'B', label: 'B', ki: 200 }
        ];

        // ⏱️ Calcula cooldowns subtraindo tempo pausado
        const now = this.isPaused ? this.pausedTime - this.totalPausedTime : this.time.now - this.totalPausedTime;

        const size = 64; // Uniform size for vertical bar
        const spacing = 12;
        const basicsCount = 4;
        const totalItemsCount = basicsCount + specials.length;
        const totalHeightAll = (size + spacing) * totalItemsCount - spacing;
        
        // Centraliza verticalmente o conjunto total (Basics + Specials) e move um pouco para baixo
        const startYAll = (height - totalHeightAll) / 2 + 30;
        // Specials começam depois dos Basics
        const startYSpecials = startYAll + basicsCount * (size + spacing);
        const x = width - 50; // Lateral direita

        specials.forEach((special, index) => {
            const y = startYSpecials + index * (size + spacing);
            const cdInfo = this.specialsCooldowns[special.key];
            const elapsed = now - cdInfo.startTime;
            const remaining = Math.max(0, cdInfo.duration - elapsed);
            const progress = remaining / cdInfo.duration;

            // Graphics for border and cooldown overlay
            let graphics = this.specialsHUDGraphics.get(special.key);
            if (!graphics) {
                graphics = this.add.graphics().setScrollFactor(0).setDepth(1002);
                this.specialsHUDGraphics.set(special.key, graphics);
            }

            graphics.clear();
            
            // Icon Image (Always clear/vibrant as requested)
            let iconImage = this.specialsHUDTimers.get(special.key + '_icon') as any;
            if (!iconImage) {
                iconImage = this.add.image(x, y, 'icon_' + special.key)
                    .setDisplaySize(size, size)
                    .setScrollFactor(0)
                    .setDepth(1001);
                this.specialsHUDTimers.set(special.key + '_icon', iconImage as any);
            }
            iconImage.setAlpha(0.8); // 20% more transparent
            iconImage.setPosition(x, y);

            // Vibrant Border
            graphics.lineStyle(2, 0xffdd00, 0.8); // 20% more transparent (1.0 * 0.8)
            graphics.strokeRect(x - size/2, y - size/2, size, size);

            if (remaining > 0) {
                // Circular "clock" overlay (filling during cooldown)
                graphics.fillStyle(0x000000, 0.56); // 20% more transparent (0.7 * 0.8)
                graphics.beginPath();
                graphics.moveTo(x, y);
                // Start at top (-90 deg), sweep based on progress
                graphics.arc(x, y, size/2, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + 360 * progress), false);
                graphics.lineTo(x, y);
                graphics.closePath();
                graphics.fillPath();

                // Timer Text (Center)
                let timerText = this.specialsHUDTimers.get(special.key);
                if (!timerText) {
                    timerText = this.add.text(x, y, '', {
                        fontSize: '32px',
                        fontFamily: '"PixelPurl", monospace',
                        color: '#ffffff',
                        fontStyle: 'bold',
                        stroke: '#000000',
                        strokeThickness: 8
                    }).setOrigin(0.5).setScrollFactor(0).setDepth(1003);
                    this.specialsHUDTimers.set(special.key, timerText);
                }
                timerText.setText(Math.ceil(remaining / 1000).toString());
                timerText.setAlpha(1.0);
                timerText.setVisible(true);
                timerText.setPosition(x, y);
            } else {
                const timerText = this.specialsHUDTimers.get(special.key);
                if (timerText) timerText.setVisible(false);
            }

            // Key Label (Top Left)
            const labelKey = special.key + '_label';
            let label = this.specialsHUDTimers.get(labelKey);
            if (!label) {
                label = this.add.text(x - size/2 + 4, y - size/2 + 4, special.label, {
                    fontSize: '18px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 5
                }).setScrollFactor(0).setDepth(1004);
                this.specialsHUDTimers.set(labelKey, label);
            }
            label.setAlpha(1.0);
            label.setPosition(x - size/2 + 4, y - size/2 + 4);

            // KI Cost (Bottom Right)
            const costKey = special.key + '_cost';
            let costText = this.specialsHUDTimers.get(costKey);
            if (!costText) {
                costText = this.add.text(x + size/2 - 4, y + size/2 - 4, special.ki.toString(), {
                    fontSize: '16px',
                    fontFamily: '"PixelPurl", monospace',
                    color: '#4ade80',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(1, 1).setScrollFactor(0).setDepth(1004);
                this.specialsHUDTimers.set(costKey, costText);
            }
            costText.setAlpha(1.0);
            costText.setPosition(x + size/2 - 4, y + size/2 - 4);
        });
    }

    private chargeKiarc() {
        if (this.kiarc < this.maxKiarc) {
            if (!this.sfx['charge_ki_new']?.isPlaying) {
                this.sfx['charge_ki_new']?.play({ loop: true, volume: this.sfxVolume });
            }
            this.kiarc = Math.min(this.maxKiarc, this.kiarc + 0.5);
            this.player.setTint(0xffffff); // Flash white when charging

            // Yellow energy particles effect
            const particleCount = 2;
            for (let i = 0; i < particleCount; i++) {
                const px = this.player.x + Phaser.Math.Between(-20, 20);
                const py = this.player.y + 16;
                const particle = this.add.circle(px, py, Phaser.Math.Between(2, 4), 0xffd700, 0.8);
                this.physics.add.existing(particle);
                const body = particle.body as Phaser.Physics.Arcade.Body;
                body.setAllowGravity(false);
                body.setVelocityY(Phaser.Math.Between(-100, -300));
                body.setVelocityX(Phaser.Math.Between(-30, 30));

                this.tweens.add({
                    targets: particle,
                    alpha: 0,
                    scale: 0.2,
                    duration: 800,
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        } else {
            this.player.setTint(0x4ade80);
        }
    }

    private startKamehamehaCharge() {
        if (this.time.now - this.specialsCooldowns['V'].startTime < this.specialsCooldowns['V'].duration) return;
        this.isChargingKamehameha = true;
        this.kamehamehaChargeTime = 0;
        this.player.setVelocity(0, 0);
        this.sfx['kamehameha_charge']?.play({ loop: true });
        
        this.kamehamehaText = this.add.text(this.player.x, this.player.y - 40, 'Arc.....', {
            fontSize: '18px',
            color: '#add8e6',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: '"PixelPurl", monospace'
        }).setOrigin(0.5);

        this.kamehamehaChargeBar = this.add.graphics();
    }

    private updateKamehamehaCharge() {
        if (!this.keys.V.isDown) {
            this.cancelKamehameha();
            return;
        }

        this.kamehamehaChargeTime += this.game.loop.delta;
        this.player.setVelocity(0, 0);
        
        const progress = Math.min(this.kamehamehaChargeTime / 2000, 1);
        
        if (this.kamehamehaText) {
            this.kamehamehaText.setPosition(this.player.x, this.player.y - 40);
        }

        if (this.kamehamehaChargeBar) {
            this.kamehamehaChargeBar.clear();
            const barWidth = 60;
            const barHeight = 6;
            this.kamehamehaChargeBar.fillStyle(0x000000, 0.5);
            this.kamehamehaChargeBar.fillRect(this.player.x - barWidth/2, this.player.y - 60, barWidth, barHeight);
            this.kamehamehaChargeBar.fillStyle(0x00ffff, 1);
            this.kamehamehaChargeBar.fillRect(this.player.x - barWidth/2, this.player.y - 60, barWidth * progress, barHeight);
        }

        // Visual charging effect
        if (this.time.now % 100 < 20) {
            const particle = this.add.circle(this.player.x + Phaser.Math.Between(-30, 30), this.player.y + Phaser.Math.Between(-30, 30), 3, 0x00ffff, 0.8);
            this.tweens.add({
                targets: particle,
                x: this.player.x,
                y: this.player.y,
                scale: 0.1,
                alpha: 0,
                duration: 300,
                onComplete: () => particle.destroy()
            });
        }

        if (progress >= 1) {
            this.finishKamehameha();
        }
    }

    private cancelKamehameha() {
        this.isChargingKamehameha = false;
        this.sfx['kamehameha_charge']?.stop();
        if (this.kamehamehaText) this.kamehamehaText.destroy();
        if (this.kamehamehaChargeBar) this.kamehamehaChargeBar.clear();
        this.kamehamehaText = null;
        this.kamehamehaChargeBar = null;
    }

    private finishKamehameha() {
        if (!this.isChargingKamehameha) return;
        this.isChargingKamehameha = false;
        this.sfx['kamehameha_charge']?.stop();
        this.sfx['kamehameha_launch']?.play();
        
        if (this.kamehamehaText && this.kamehamehaText.active) {
            try {
                this.kamehamehaText.setText('Arc...... Kamehamehaaaaa!!!!');
                this.kamehamehaText.setColor('#ffffff');
                this.kamehamehaText.setFontSize(24);
                
                this.tweens.add({
                    targets: this.kamehamehaText,
                    y: this.kamehamehaText.y - 50,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                        if (this.kamehamehaText && this.kamehamehaText.active) {
                            this.kamehamehaText.destroy();
                            this.kamehamehaText = null;
                        }
                    }
                });
            } catch (e) {
                console.error('Error updating kamehameha text:', e);
                if (this.kamehamehaText) {
                    this.kamehamehaText.destroy();
                    this.kamehamehaText = null;
                }
            }
        }
        
        if (this.kamehamehaChargeBar) {
            this.kamehamehaChargeBar.clear();
            this.kamehamehaChargeBar = null;
        }
        
        this.shootArcamehameha();
    }

    shootArcamehameha() {
        const stats = this.levelStats[this.level - 1];
        const damageMultiplier = stats.mult;
        const kameDamage = stats.kame;
        
        // Ensure 100 KI consumption
        this.kiarc = Math.max(0, this.kiarc - 100);
        this.specialsCooldowns['V'].startTime = this.time.now;
        const beamLength = 2400;
        const beamX = this.player.x + (this.player.flipX ? -(beamLength / 2) : (beamLength / 2));
        
        // Efeito visual de "carregamento" instantâneo (brilho rápido)
        const chargeFlash = this.add.circle(this.player.x, this.player.y, 40, 0xffffff, 0.8);
        this.tweens.add({
            targets: chargeFlash,
            scale: 0.1,
            alpha: 0,
            duration: 150,
            onComplete: () => chargeFlash.destroy()
        });

        const beam = this.add.rectangle(beamX, this.player.y, beamLength, 25, 0xffdd00, 0.7);
        this.physics.add.existing(beam);
        const body = beam.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        this.cameras.main.shake(300, 0.015);

        this.physics.add.overlap(beam, this.enemies, (b, e) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            this.hitEnemy(enemy, kameDamage * damageMultiplier);
        }, undefined, this);

        this.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 400,
            onComplete: () => beam.destroy()
        });
    }

    attack(damageMultiplier: number = 1.0) {
        const stats = this.levelStats[this.level - 1];
        const baseMultiplier = stats.mult;
        const punchDamage = stats.punch;
        const boostMultiplier = this.hasDamageBoost ? 2.0 : 1.0;
        
        const punchX = this.player.flipX ? this.player.x - 20 : this.player.x + 20;
        const targets = this.enemies.getChildren().filter(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            // Aumentando a área do dano do punch (Z) (Ajustado: 80 * 0.7 = 56)
            return Phaser.Math.Distance.Between(punchX, this.player.y, enemy.x, enemy.y) < 56;
        });
        
        targets.forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            this.hitEnemy(enemy, punchDamage * baseMultiplier * damageMultiplier * boostMultiplier);
            
            // Efeito visual de soco tipo RPG (pequeno, amarelo, impacto com brilho)
            const flash = this.add.circle(enemy.x, enemy.y, 10, 0xffdd00, 0.4);
            const sparkCount = 4;
            for (let i = 0; i < sparkCount; i++) {
                const angle = (Math.PI * 2 / sparkCount) * i;
                const spark = this.add.rectangle(
                    enemy.x, 
                    enemy.y, 
                    10, 2, 0xffffff, 0.9
                );
                spark.setRotation(angle);
                this.tweens.add({
                    targets: spark,
                    x: enemy.x + Math.cos(angle) * 35,
                    y: enemy.y + Math.sin(angle) * 35,
                    alpha: 0,
                    scaleX: 0.05,
                    duration: 180,
                    ease: 'Power2',
                    onComplete: () => spark.destroy()
                });
            }

            // Adiciona um brilho central rápido em cruz
            const hLine = this.add.rectangle(enemy.x, enemy.y, 25, 2, 0xffffff, 0.8);
            const vLine = this.add.rectangle(enemy.x, enemy.y, 2, 25, 0xffffff, 0.8);
            this.tweens.add({
                targets: [hLine, vLine],
                alpha: 0,
                scale: 0.1,
                duration: 120,
                onComplete: () => {
                    hLine.destroy();
                    vLine.destroy();
                }
            });

            this.tweens.add({
                targets: flash,
                scale: 2.5,
                alpha: 0,
                duration: 150,
                onComplete: () => flash.destroy()
            });
        });
    }

    shootMagic() {
        const stats = this.levelStats[this.level - 1];
        const damageMultiplier = stats.mult;
        const magicDamage = stats.magic;
        const boostMultiplier = this.hasDamageBoost ? 2.0 : 1.0;
        
        // MagicKiArc (Key C) uses 5 KI in any level
        this.kiarc = Math.max(0, this.kiarc - 5);
        
        // Play magic sound effect with proper volume
        const sound = this.sfx['magic'];
        if (sound) {
            sound.play();
        }
        
        const magic = this.add.circle(this.player.x, this.player.y, 15, 0xffdd00, 0.8);
        this.physics.add.existing(magic);
        const body = magic.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(this.player.flipX ? -800 : 800);
        
        this.physics.add.overlap(magic, this.enemies, (m, e) => {
            m.destroy();
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, magicDamage * damageMultiplier * boostMultiplier);
        }, undefined, this);
    }

    arcKiExplosion() {
        // Prevent usage while charging Genkidama or Kamehameha
        if (this.isChargingGenkidama || this.isChargingKamehameha) {
            return;
        }
        
        const stats = this.levelStats[this.level - 1];
        
        // O soco (Z) no hitEnemy é: damage * stats.mult * boostMultiplier
        // Para a explosão ser exatamente 20% do Z, o dano passado para hitEnemy
        // deve ser (stats.punch * 0.2) porque o hitEnemy já vai multiplicar por stats.mult e boostMultiplier
        // ATENÇÃO: Verificamos se há algum multiplicador oculto. 
        // O stats.punch no lvl 1 é 10. stats.mult é 1.0. 
        // explosionDamage = 10 * 0.2 = 2.
        // hitEnemy(enemy, 2) resultará em finalDamage = 2 (ou 4 com boost).
        // 2 é exatamente 20% de 10.
        const explosionDamage = stats.punch * 0.2;
        
        this.kiarc = Math.max(0, this.kiarc - 100);
        
        // Play explosion sound if available or reuse magic
        this.sfx['magic']?.play();
        
        // Visual effect for explosion
        const explosion = this.add.circle(this.player.x, this.player.y, 150, 0xffdd00, 0.4);
        this.tweens.add({
            targets: explosion,
            scale: 2,
            alpha: 0,
            duration: 300,
            onComplete: () => explosion.destroy()
        });

        this.cameras.main.shake(200, 0.02);

        // Damage enemies in range
        this.enemies.getChildren().forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 200) {
                // Passamos o valor que, ao entrar no hitEnemy, manterá a proporção de 20% do Punch (Z)
                this.hitEnemy(enemy, explosionDamage);
            }
        });
    }

    chargeGenkidama() {
        this.isChargingGenkidama = true;
        // Consome KI do personagem continuamente
        const kiToConsume = 0.5; // 2x mais lento (antes era 2.0 ou 1.0 dependendo da versão)
        if (this.kiarc >= kiToConsume) {
            this.kiarc = Math.max(0, this.kiarc - kiToConsume);
            this.genkidamaChargeAmount += kiToConsume;
            
            if (!this.genkidama) {
                this.sfx['genkidama_charge']?.play({ loop: true });
                this.genkidama = this.add.circle(this.player.x, this.player.y - 100, 10, 0xadd8e6, 0.6);
                
                this.genkidamaText = this.add.text(this.player.x, this.player.y - 30, 'All Arcs, share your power', {
                    fontSize: '14px',
                    color: '#add8e6',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 3,
                    fontFamily: '"PixelPurl", monospace'
                }).setOrigin(0.5);

                this.genkidamaPercentText = this.add.text(this.player.x, this.player.y - 50, '0%', {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 4,
                    fontFamily: '"PixelPurl", monospace'
                }).setOrigin(0.5);
            }
            
            // Percentage: 200 KI = 100% (Agora pode passar de 100%)
            const percent = Math.floor((this.genkidamaChargeAmount / 200) * 100);
            if (this.genkidamaPercentText) {
                this.genkidamaPercentText.setText(`${percent}%`);
                this.genkidamaPercentText.setPosition(this.player.x, this.player.y - 60);
                // Change color if ready
                if (percent >= 100) {
                    this.genkidamaPercentText.setColor('#4ade80');
                }
            }

            if (this.genkidamaText) {
                this.genkidamaText.setPosition(this.player.x, this.player.y - 40);
            }
            
            // Size is proportional to charge
            const size = 10 + (this.genkidamaChargeAmount * 1.5);
            this.genkidama.setRadius(size);
            this.genkidama.setPosition(this.player.x, this.player.y - size - 80);
            
            // Charging visual effect
            if (this.time.now % 100 < 20) {
                const particle = this.add.circle(this.player.x + Phaser.Math.Between(-50, 50), this.player.y + Phaser.Math.Between(-50, 50), 4, 0xadd8e6, 0.8);
                this.tweens.add({
                    targets: particle,
                    x: this.genkidama.x,
                    y: this.genkidama.y,
                    scale: 0.1,
                    duration: 400,
                    onComplete: () => particle.destroy()
                });
            }
        }
    }

    shootGenkidama() {
        if (!this.genkidama) return;
        this.sfx['genkidama_charge']?.stop();
        this.sfx['genkidama_launch']?.play();
        this.specialsCooldowns['B'].startTime = this.time.now;
        
        // Clean up texts
        if (this.genkidamaText) {
            this.genkidamaText.destroy();
            this.genkidamaText = null;
        }
        if (this.genkidamaPercentText) {
            this.genkidamaPercentText.destroy();
            this.genkidamaPercentText = null;
        }

        const genki = this.genkidama;
        this.genkidama = null;
        // Damage logic: 10 KI = 2 Damage
        const boostMultiplier = this.hasDamageBoost ? 2.0 : 1.0;
        const damage = (this.genkidamaChargeAmount / 10) * 2 * boostMultiplier;
        const chargeUsed = this.genkidamaChargeAmount;
        this.genkidamaChargeAmount = 0;
        this.isChargingGenkidama = false;
        
        this.physics.add.existing(genki);
        const body = genki.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        const centerX = this.cameras.main.width / 2;
        const floorY = this.cameras.main.height - 32;
        
        this.physics.moveTo(genki, centerX, floorY, 400);

        // Helper to trigger explosion
        const triggerExplosion = () => {
            if (!genki.active) return;

            // AOE explosion on impact
            const explosion = this.add.circle(genki.x, genki.y, genki.radius * 4, 0xadd8e6, 0.3);
            this.tweens.add({
                targets: explosion,
                scale: 3,
                alpha: 0,
                duration: 600,
                onComplete: () => explosion.destroy()
            });

            this.cameras.main.shake(800, 0.04);
            this.cameras.main.flash(1500, 255, 255, 255);

            // Extra durable glow effect
            const glow = this.add.circle(genki.x, genki.y, genki.radius * 6, 0xffffff, 0.8);
            this.tweens.add({
                targets: glow,
                alpha: 0,
                scale: 2,
                duration: 1500,
                ease: 'Quad.easeOut',
                onComplete: () => glow.destroy()
            });

            // Damage and Knockback ALL enemies on screen
            this.enemies.getChildren().forEach((e) => {
                const enemy = e as Phaser.Physics.Arcade.Sprite;
                if (enemy.active && enemy.body) {
                    this.hitEnemy(enemy, damage * this.levelStats[this.level - 1].mult);
                    
                    // Massive knockback away from center
                    const angle = Phaser.Math.Angle.Between(centerX, floorY, enemy.x, enemy.y);
                    const force = 3000; // Even faster!
                    enemy.setVelocity(
                        Math.cos(angle) * force,
                        Math.sin(angle) * force - 1200 // More height
                    );
                }
            });

            genki.destroy();
        };
        
        // Timer for independent explosion after 3 seconds
        const explosionTimer = this.time.delayedCall(3000, triggerExplosion);

        // Impact check for floor
        const checkImpact = this.time.addEvent({
            delay: 50,
            callback: () => {
                if (genki.active && genki.y >= floorY - 20) {
                    triggerExplosion();
                    explosionTimer.remove();
                    checkImpact.remove();
                }
            },
            loop: true
        });

        // Cleanup if destroyed otherwise
        genki.on('destroy', () => {
            checkImpact.remove();
            explosionTimer.remove();
        });
    }

    hitEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number) {
        let health = enemy.getData('health') || 1;
        const typeId = enemy.getData('typeId');
        
        // Apply arc_damage upgrade multiplier
        const damageMultiplier = (this as any).damageMultiplier || 1.0;
        let finalDamage = damage * damageMultiplier;

        // Apply PowerBoost or DamageBoost (temporary items)
        if (this.hasPowerBoost || this.hasDamageBoost) {
            finalDamage *= 2;
        }

        if (finalDamage > 0 && Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) < 60) {
            this.sfx['punch']?.play();
        }

        // 9. Shield Sentinel - Reduz dano frontal
        if (typeId === 'shield_sentinel' && enemy.body) {
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const velocityAngle = Math.atan2((enemy.body as Phaser.Physics.Arcade.Body).velocity.y, (enemy.body as Phaser.Physics.Arcade.Body).velocity.x);
            // If player is roughly in front of where enemy is moving/facing
            if (Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - velocityAngle)) < Math.PI / 3) {
                finalDamage *= 0.3; // 70% reduction
            }
        }

        health -= finalDamage;
        enemy.setData('health', health);

        // ArcVamp: Regenerates HP based on damage dealt
        const vampBonus = (this as any).vampBonus || 0;
        if (vampBonus > 0 && finalDamage > 0) {
            const healAmount = finalDamage * vampBonus;
            this.health = Math.min(this.maxHealth, this.health + healAmount);
            this.updateHUD(); // Ensure HP bar updates immediately
        }

        // Mostra o dano causado
        this.showDamage(enemy.x, enemy.y, Math.round(finalDamage));

        // Visual feedback for hitting
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                if (enemy.getData('isBoss')) {
                    enemy.setTint(0xff0000);
                } else {
                    enemy.clearTint();
                }
            }
        });
        
        // Hit particles
        const hitParticle = this.add.circle(enemy.x, enemy.y, 4, 0xffffff);
        this.tweens.add({
            targets: hitParticle,
            x: enemy.x + Phaser.Math.Between(-50, 50),
            y: enemy.y + Phaser.Math.Between(-50, 50),
            alpha: 0,
            scale: 0.1,
            duration: 400,
            onComplete: () => hitParticle.destroy()
        });

        if (health <= 0) {
            // Ensure each enemy defeat counts as exactly one
            if (enemy.getData('isDefeated')) return;
            enemy.setData('isDefeated', true);

            // 8. Split Core - Divide em 10 menores
            if (typeId === 'split_core' && enemy.getData('canSplit') !== false) {
                for (let i = 0; i < 10; i++) {
                    const smallType = { 
                        ...this.enemyTypes.find(t => t.id === 'split_core'), 
                        scale: 0.5, 
                        behavior: 'melee' 
                    };
                    const fragment = this.createEnemyObject(
                        enemy.x + Phaser.Math.Between(-40, 40), 
                        enemy.y + Phaser.Math.Between(-40, 40), 
                        smallType
                    );
                    if (fragment) {
                        fragment.setData('canSplit', false);
                        fragment.setData('health', 5); // Fragmentos mais frágeis
                    }
                }
            }

            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-5, 5),
                duration: 50,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    const oldLevel = this.level;
                    if (enemy.getData('isBoss')) {
                        let bossScore = 20 * Math.pow(5, this.currentWave - 1);
                        if (this.hasScoreBoost) bossScore *= 2;
                        this.score += Math.min(bossScore, 100);
                    } else {
                        // Standard score increase by 1 per enemy
                        let gainedScore = 1;
                        if (this.hasScoreBoost) gainedScore *= 2;
                        this.score += Math.min(gainedScore, 100);
                    }

                    // Level progression logic based on score threshold
                    let targetLevel = 1;
                    for (let i = 0; i < this.levelStats.length; i++) {
                        if (this.score >= this.levelStats[i].score) {
                            targetLevel = this.levelStats[i].lvl;
                        } else {
                            break;
                        }
                    }

                    if (targetLevel !== this.level && targetLevel < 10) {
                        this.level = targetLevel;
                        
                        // Update max stats for new level and restore to 100%
                        const newLevelStats = this.levelStats[this.level - 1];
                        this.maxHealth = newLevelStats.hp;
                        this.maxKiarc = newLevelStats.ki;
                        this.health = this.maxHealth;
                        this.kiarc = this.maxKiarc;
                        
                        this.levelTitle = this.levelTitles[this.level - 1] || 'Arc Divine';

                        // CRITICAL: Re-apply permanent upgrades on top of new level base stats
                        this.applyUpgrade();
                        
                        // Powerful camera effects
                        this.cameras.main.flash(800, 0, 255, 100);
                        this.cameras.main.shake(600, 0.1);
                        
                        // Knockback all nearby enemies
                        const knockbackRadius = 400;
                        const knockbackForce = 1500;
                        this.enemies.getChildren().forEach((e) => {
                            const enemy = e as Phaser.Physics.Arcade.Sprite;
                            if (enemy.active && enemy.body) {
                                const dx = enemy.x - this.player.x;
                                const dy = enemy.y - this.player.y;
                                const distance = Math.sqrt(dx * dx + dy * dy);
                                
                                if (distance < knockbackRadius) {
                                    const angle = Math.atan2(dy, dx);
                                    const force = knockbackForce * (1 - (distance / knockbackRadius)); // Force decreases with distance
                                    enemy.setVelocity(
                                        Math.cos(angle) * force,
                                        Math.sin(angle) * force - 500 // Extra upward force
                                    );
                                    
                                    // Visual hit effect on enemy
                                    enemy.setTint(0xffff00);
                                    this.time.delayedCall(150, () => {
                                        if (enemy.active) {
                                            if (enemy.getData('isBoss')) {
                                                enemy.setTint(0xff0000);
                                            } else {
                                                enemy.clearTint();
                                            }
                                        }
                                    });
                                }
                            }
                        });
                        
                        // Create expanding shockwave effect (Yellow)
                        const shockwave = this.add.circle(this.player.x, this.player.y, 20, 0xffdd00, 0.6);
                        shockwave.setDepth(5);
                        this.tweens.add({
                            targets: shockwave,
                            radius: knockbackRadius,
                            alpha: 0,
                            duration: 500,
                            ease: 'Quad.easeOut',
                            onComplete: () => shockwave.destroy()
                        });
                        
                        // Show Level Up animation if stats improved
                        if (oldLevel !== this.level) {
                            this.updateHUD();
                            this.updatePlayerVisual();
                        }
                    }

                    this.enemiesDefeated++;
                    this.cameras.main.shake(100, 0.005);
                    this.createExplosion(enemy.x, enemy.y, enemy.getData('isBoss'));
                    enemy.destroy();
                    this.scoreText.setText(`Enemies: ${this.score.toLocaleString()} | LVL: ${this.level} (${this.levelTitle})`);
                }
            });
        }
    }

    private getLevelTitle(score: number): { level: number, title: string } {
        const levels = [
            { threshold: 15000000, title: 'Arc Prime', level: 10 },
            { threshold: 3000000, title: 'Arc Ascendant', level: 9 },
            { threshold: 600000, title: 'Arc Architect', level: 8 },
            { threshold: 125000, title: 'Arc Spartan', level: 7 },
            { threshold: 25000, title: 'Arc Vanguard', level: 6 },
            { threshold: 5000, title: 'Arc Sentinel', level: 5 },
            { threshold: 1000, title: 'Arc Forged', level: 4 },
            { threshold: 200, title: 'Arc Adept', level: 3 },
            { threshold: 50, title: 'Arc Seeker', level: 2 },
            { threshold: 0, title: 'Arc Initiate', level: 1 }
        ];
        return levels.find(l => score >= l.threshold) || levels[levels.length - 1];
    }

    // Mega Man style explosion effect
    private createExplosion(x: number, y: number, isBoss: boolean = false) {
        const colors = [0xffffff, 0xffdd00, 0x60a5fa];
        const particles = 12;

        for (let i = 0; i < particles; i++) {
            const angle = (i / particles) * Math.PI * 2;
            const velocityX = Math.cos(angle) * 200;
            const velocityY = Math.sin(angle) * 200;

            const particle = this.add.circle(x, y, 8, colors[i % colors.length]);
            this.physics.add.existing(particle);
            const body = particle.body as Phaser.Physics.Arcade.Body;
            body.setAllowGravity(false);
            body.setVelocity(velocityX, velocityY);

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.2,
                duration: 1000,
                onComplete: () => particle.destroy()
            });
        }

        // Screen flash logic: Green for Bosses, None for Normal Enemies, White for Game Over
        if (isBoss) {
            this.cameras.main.flash(500, 0, 255, 0); // Green for Boss
        } else if (this.isGameOver) {
            this.cameras.main.flash(500, 255, 255, 255); // White for Game Over
        }
        
        const shakeIntensity = this.level >= 10 ? 0.025 : 0.05;
        this.cameras.main.shake(500, shakeIntensity);

        // ONLY restart if it's the player exploding (Game Over)
        if (this.isGameOver) {
            this.time.delayedCall(2000, () => {
                this.scene.restart();
                this.health = 100;
                this.kiarc = 0;
                this.score = 0;
                this.currentWave = 1;
                this.isGameOver = false;
            });
        }
    }

    private spawnRandomItem() {
        if (this.isGameOver) return;
        
        // Limit to 1 item on screen
        if (this.items.countActive(true) >= 1) return;

        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(50, width - 50);
        const y = -50;

        const itemTypes = ['ArcHP', 'ArcKI', 'ArcPower', 'ArcScore', 'ArcBarrier'];
        const type = Phaser.Utils.Array.GetRandom(itemTypes);

        const item = this.items.create(x, y, 'jungle_tiles', 0) as Phaser.Physics.Arcade.Sprite;
        item.setAlpha(0); // Use graphics for items
        item.setData('type', type);
        item.setBounce(0.5);
        item.setCollideWorldBounds(true);

        const itemGraphics = this.add.graphics();
        this.itemGraphicsMap.set(item, itemGraphics);

        // Item disappearance timer
        this.time.delayedCall(10000, () => {
            if (item.active) {
                this.tweens.add({
                    targets: itemGraphics,
                    alpha: 0,
                    duration: 500,
                    onComplete: () => {
                        this.itemGraphicsMap.delete(item);
                        itemGraphics.destroy();
                        item.destroy();
                    }
                });
            }
        });
    }

    private showPickupNotification(title: string, description: string = "") {
        if (this.pickupTimer) this.pickupTimer.remove();
        
        const message = description ? `${title}: ${description}` : title;
        if (this.pickupNotification) {
            this.pickupNotification.setText(message);
            this.pickupNotification.setVisible(true);
        }
        
        // Background for the notification
        if (this.pickupNotification && this.pickupNotificationBg) {
            const bounds = this.pickupNotification.getBounds();
            this.pickupNotificationBg.clear();
            this.pickupNotificationBg.fillStyle(0x000000, 0.8);
            this.pickupNotificationBg.lineStyle(1, 0xffdd00, 1);
            this.pickupNotificationBg.fillRoundedRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4, 4);
            this.pickupNotificationBg.strokeRoundedRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4, 4);
            this.pickupNotificationBg.setVisible(true);
        }

        this.pickupTimer = this.time.delayedCall(3000, () => {
            if (this.pickupNotification) this.pickupNotification.setVisible(false);
            if (this.pickupNotificationBg) this.pickupNotificationBg.setVisible(false);
        });
    }

    private handlePlayerItemCollision(player: any, item: any) {
        const type = item.getData('type');
        const stats = this.levelStats[this.level - 1];
        this.sfx['item_pickup']?.play();

        // Efeito de texto subindo na cabeça do personagem
        const pickupText = this.add.text(this.player.x, this.player.y - 30, type, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: '"PixelPurl", monospace'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: pickupText,
            y: pickupText.y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Cubic.easeOut',
            onComplete: () => pickupText.destroy()
        });

        switch (type) {
            case 'ArcHP':
                // Recupera 50% do HP, sem aumentar o limite máximo
                this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.5);
                this.cameras.main.flash(200, 0, 255, 0, true);
                this.showPickupNotification('ArcHP', 'Restores 50% Health.');
                break;
            case 'ArcKI':
                // Recupera 100% do KI, sem aumentar o limite máximo
                this.kiarc = this.maxKiarc;
                this.cameras.main.flash(200, 0, 0, 255, true);
                this.showPickupNotification('ArcKI', 'Restores 100% Energy (KI).');
                break;
            case 'ArcPower':
                this.hasDamageBoost = true;
                this.addBuff('ArcPower', 'Damage Boost', 'Doubles all character damage (Z, C, V, B, F and S).', 20);
                this.cameras.main.flash(500, 255, 0, 0, true);
                this.showPickupNotification('ArcPower', 'Double Damage for 20 seconds!');
                this.time.delayedCall(20000, () => {
                    this.hasDamageBoost = false;
                    this.removeBuff('ArcPower');
                });
                break;
            case 'ArcScore':
                this.hasScoreBoost = true;
                this.addBuff('ArcScore', 'Score Boost', 'Doubles all score gained from enemies and bosses.', 20);
                this.cameras.main.flash(500, 255, 215, 0, true);
                this.showPickupNotification('ArcScore', 'Double Score for 20 seconds!');
                this.time.delayedCall(20000, () => {
                    this.hasScoreBoost = false;
                    this.removeBuff('ArcScore');
                });
                break;
            case 'ArcBarrier':
                this.isInvincible = true;
                this.invincibilityTimer = 20000; // 20 seconds
                this.addBuff('ArcBarrier', 'Invincibility', 'Character becomes invincible and takes no damage.', 20);
                this.cameras.main.flash(300, 255, 0, 255, true);
                this.showPickupNotification('ArcBarrier', 'Invincibility for 20 seconds!');
                this.time.delayedCall(20000, () => {
                    this.isInvincible = false;
                    this.removeBuff('ArcBarrier');
                });
                break;
        }

        const graphics = this.itemGraphicsMap.get(item);
        if (graphics) {
            this.itemGraphicsMap.delete(item);
            graphics.destroy();
        }
        item.destroy();
    }

    private updateBuffIcons() {
        if (!this.buffIconsContainer) return;
        this.buffIconsContainer.removeAll(true);
        let xOffset = 0;

        this.activeBuffs.forEach((buff, type) => {
            const iconSize = 24;
            const bg = this.add.graphics();
            const color = this.getItemColor(type);
            
            bg.fillStyle(color, 0.8);
            bg.lineStyle(1, 0xffffff, 1);
            bg.fillRoundedRect(0, 0, iconSize, iconSize, 4);
            bg.strokeRoundedRect(0, 0, iconSize, iconSize, 4);
            
            const icon = this.add.container(xOffset, 0, [bg]);
            icon.setSize(iconSize, iconSize);
            icon.setInteractive(new Phaser.Geom.Rectangle(0, 0, iconSize, iconSize), Phaser.Geom.Rectangle.Contains);

            icon.on('pointerover', (pointer: Phaser.Input.Pointer) => {
                let durationText = '';
                if (buff.duration && buff.startTime) {
                    const now = (this.isGamePaused || this.isPaused) ? this.pausedTime - this.totalPausedTime : this.time.now - this.totalPausedTime;
                    const elapsed = (now - buff.startTime) / 1000;
                    const remaining = Math.max(0, buff.duration - elapsed);
                    durationText = remaining > 0 ? `${Math.ceil(remaining)}s` : 'Match';
                }
                this.showTooltip(pointer.x, pointer.y, buff.title, buff.description, durationText);
            });

            icon.on('pointerout', () => {
                this.tooltipContainer.setVisible(false);
            });

            this.buffIconsContainer.add(icon);
            xOffset += iconSize + 8;
        });
    }

    private addBuff(type: string, title: string, description: string, duration?: number) {
        this.activeBuffs.set(type, {
            title,
            description,
            duration,
            startTime: duration ? (this.time.now - this.totalPausedTime) : undefined
        });
        this.updateBuffIcons();
    }

    private removeBuff(type: string) {
        if (this.activeBuffs.has(type)) {
            this.activeBuffs.delete(type);
            this.updateBuffIcons();
        }
    }

    private getItemColor(type: string): number {
        switch (type) {
            case 'ArcPower': return 0xff0000;
            case 'ArcScore': return 0xffd700;
            case 'ArcBarrier': return 0x800080;
            default: return 0xffffff;
        }
    }

    private drawItems() {
        this.items.getChildren().forEach((item: any) => {
            const graphics = this.itemGraphicsMap.get(item);
            if (!graphics) return;

            graphics.clear();
            const type = item.getData('type');
            const pulse = (Math.sin(this.time.now / 200) * 0.2) + 1;
            const size = 15 * pulse;

            switch (type) {
                case 'ArcHP': // Circle, Green, + icon
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.fillStyle(0x00ff00, 0.8);
                    graphics.fillCircle(item.x, item.y, size);
                    graphics.strokeCircle(item.x, item.y, size);
                    graphics.lineStyle(3, 0xffffff, 1);
                    graphics.lineBetween(item.x - 5, item.y, item.x + 5, item.y);
                    graphics.lineBetween(item.x, item.y - 5, item.x, item.y + 5);
                    break;
                case 'ArcKI': // Hexagon, Blue, lightning
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.fillStyle(0x0000ff, 0.8);
                    const points = this.createPolygonGeometry(6, size);
                    graphics.beginPath();
                    graphics.moveTo(item.x + points[0].x, item.y + points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        graphics.lineTo(item.x + points[i].x, item.y + points[i].y);
                    }
                    graphics.closePath();
                    graphics.fillPath();
                    graphics.strokePath();
                    // Simple lightning bolt
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.beginPath();
                    graphics.moveTo(item.x + 2, item.y - 7);
                    graphics.lineTo(item.x - 4, item.y + 1);
                    graphics.lineTo(item.x + 4, item.y - 1);
                    graphics.lineTo(item.x - 2, item.y + 7);
                    graphics.strokePath();
                    break;
                case 'ArcPower': // Triangle, Red, Up arrow
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.fillStyle(0xff0000, 0.8);
                    const tPoints = this.createPolygonGeometry(3, size);
                    graphics.beginPath();
                    graphics.moveTo(item.x + tPoints[0].x, item.y + tPoints[0].y);
                    for (let i = 1; i < tPoints.length; i++) {
                        graphics.lineTo(item.x + tPoints[i].x, item.y + tPoints[i].y);
                    }
                    graphics.closePath();
                    graphics.fillPath();
                    graphics.strokePath();
                    break;
                case 'ArcScore': // Star, Gold, particles
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.fillStyle(0xffd700, 0.8);
                    // Draw simple star
                    const starPoints = 5;
                    graphics.beginPath();
                    for (let i = 0; i < starPoints * 2; i++) {
                        const r = i % 2 === 0 ? size : size / 2;
                        const angle = (i * Math.PI) / starPoints;
                        const px = Math.cos(angle - Math.PI/2) * r;
                        const py = Math.sin(angle - Math.PI/2) * r;
                        if (i === 0) graphics.moveTo(item.x + px, item.y + py);
                        else graphics.lineTo(item.x + px, item.y + py);
                    }
                    graphics.closePath();
                    graphics.fillPath();
                    graphics.strokePath();
                    break;
                case 'ArcBarrier': // Square, Purple, shield icon
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.fillStyle(0x800080, 0.8);
                    graphics.fillRect(item.x - size, item.y - size, size * 2, size * 2);
                    graphics.strokeRect(item.x - size, item.y - size, size * 2, size * 2);
                    // Shield symbol
                    graphics.lineStyle(2, 0xffffff, 1);
                    graphics.beginPath();
                    graphics.moveTo(item.x - 6, item.y - 6);
                    graphics.lineTo(item.x + 6, item.y - 6);
                    graphics.lineTo(item.x + 6, item.y + 2);
                    graphics.lineTo(item.x, item.y + 8);
                    graphics.lineTo(item.x - 6, item.y + 2);
                    graphics.closePath();
                    graphics.strokePath();
                    break;
            }
        });
    }

    private useKiArcExplosion() {
        const explosionRadius = 500; // Aumentado de 300 para 500 para maior área de impacto
        this.sfx['explosion_ki']?.play();
        
        // Efeito visual da explosão - Amarelo
        const circle = this.add.circle(this.player.x, this.player.y, 10, 0xffdd00, 0.5);
        this.tweens.add({
            targets: circle,
            radius: explosionRadius,
            alpha: 0,
            duration: 500,
            onComplete: () => circle.destroy()
        });

        // Flash de luz - Amarelo claro
        const flash = this.add.graphics();
        flash.fillStyle(0xffffcc, 0.8);
        flash.fillCircle(this.player.x, this.player.y, explosionRadius);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => flash.destroy()
        });

        // Aplicar dano e knockback em todos os inimigos próximos
        const stats = this.levelStats[this.level - 1];
        const punchDamage = stats.punch;
        const damageMultiplier = stats.mult;
        const boostMultiplier = this.hasDamageBoost ? 2.0 : 1.0;
        
        // FORÇANDO DANO DE 20% DO Z (PUNCH)
        // O dano do Z é (stats.punch * stats.mult * boostMultiplier)
        const zDamage = punchDamage * damageMultiplier * boostMultiplier;
        const explosionDamage = zDamage * 0.2;

        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (enemy.active) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                if (dist <= explosionRadius) {
                    // Dano de 20% de um Punch
                    this.hitEnemy(enemy, explosionDamage / (damageMultiplier * boostMultiplier));

                    // Jogar para longe - Super Knockback (Aumentado em 200% do que estava: 8000 * 3 = 24000)
                    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                    const knockbackForce = 24000; 
                    enemy.setVelocity(Math.cos(angle) * knockbackForce, Math.sin(angle) * knockbackForce);
                    
                    // Marcar como sendo repelido para não causar dano ao colidir com o player durante o trajeto
                    enemy.setData('isBeingKnockedBack', true);
                    this.time.delayedCall(1000, () => {
                        if (enemy.active) {
                            enemy.setData('isBeingKnockedBack', false);
                        }
                    });
                }
            }
        });
    }

    private killEnemy(enemy: Phaser.Physics.Arcade.Sprite) {
        if (!enemy.active) return;
        
        const behavior = enemy.getData('behavior');
        const points = enemy.getData('scorePoints') || 10;
        
        this.score += Math.floor(points * (this.hasScoreBoost ? 2 : 1));
        this.enemiesDefeated++;
        this.updateHUD();

        // Split Core explosion behavior
        if (behavior === 'split_hybrid' && !enemy.getData('isChild')) {
            for (let i = 0; i < 10; i++) {
                const angle = (i / 10) * Math.PI * 2;
                const speed = 200;
                const child = this.spawnEnemy('split_core');
                if (child) {
                    child.setPosition(enemy.x, enemy.y);
                    child.setData('isChild', true);
                    child.setData('health', 5); // Children are weaker
                    child.setScale(0.6); // Children are smaller
                    child.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
                    // Prevent immediate collision damage if necessary, or just let them fly
                }
            }
        }

        // Efeito de explosão
        this.createExplosion(enemy.x, enemy.y);
        
        // Remover da memória
        if (behavior === 'shield' || behavior === 'knockback' || behavior === 'elite_hybrid') {
            const graphics = this.bossGraphicsMap.get(enemy);
            if (graphics) {
                graphics.destroy();
                this.bossGraphicsMap.delete(enemy);
            }
        }
        
        enemy.destroy();
    }

    private loadPermanentUpgrades() {
        try {
            const saved = localStorage.getItem('purchasedUpgrades');
            if (saved) {
                this.purchasedUpgrades = JSON.parse(saved);
                this.updateUpgradeIcons();
            }
        } catch (e) {
            console.error("Failed to load upgrades", e);
        }
    }

    public saveUpgrade(id: string, level: number) {
        this.purchasedUpgrades[id] = level;
        localStorage.setItem('purchasedUpgrades', JSON.stringify(this.purchasedUpgrades));
        this.updateUpgradeIcons();
        
        // Apply stats immediately
        const stats = this.levelStats[this.level - 1] || this.levelStats[0];
        if (id === 'arc_hp') {
            const bonus = 1 + (level * 0.1); // Simple 10% per level for display logic
            this.maxHealth = stats.hp * bonus;
            this.updateHUD();
        } else if (id === 'arc_ki') {
            const bonus = 1 + (level * 0.1);
            this.maxKiarc = stats.ki * bonus;
            this.updateHUD();
        }
    }

    // Load inventory from blockchain
    private async syncWithBackendOnStart() {
        const walletAddress = (window as any).walletAddress;
        if (!walletAddress) return;

        try {
            const response = await fetch(`/api/inventory/${walletAddress}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data.potions) {
                    this.playerInventory = data.potions;
                    localStorage.setItem('player_inventory', JSON.stringify(this.playerInventory));
                    (this.game as any).playerInventory = this.playerInventory;
                    this.updateInventoryHUD();
                    this.updateHUD();
                }
            }
        } catch (err) {
            console.error("Failed to sync inventory with backend on start:", err);
        }
    }

    private async syncInventoryOnChain() {
        if (!(window as any).ethereum) return;
        
        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const accounts = await provider.listAccounts();
            if (accounts.length === 0) return;
            
            const userAddress = accounts[0].address;
            const SHOP_CONTRACT_ADDRESS = "0x6b09296bb55f08FBD268C44a89B5B9a23db2af6a";
            const SHOP_ABI = ["function getPotionBalances(address user) external view returns (uint256, uint256, uint256, uint256)"];
            
            const shopContract = new ethers.Contract(SHOP_CONTRACT_ADDRESS, SHOP_ABI, provider);
            
            let onChainInventory;
            try {
                const [health, ki, immunity, score] = await shopContract.getPotionBalances(userAddress);
                onChainInventory = {
                    health: Number(health),
                    ki: Number(ki),
                    immunity: Number(immunity),
                    score: Number(score)
                };
            } catch (contractErr) {
                console.warn("Game: getPotionBalances failed, staying with local data", contractErr);
                return;
            }
            
            this.playerInventory = onChainInventory;
            (this.game as any).playerInventory = onChainInventory;
            localStorage.setItem('player_inventory', JSON.stringify(onChainInventory));
            this.updateHUD();
            console.log("Game inventory synced on-chain:", onChainInventory);
        } catch (error) {
            console.error("Failed to sync game inventory on-chain:", error);
        }
    }

    private updateUpgradeIcons() {
        this.upgradeIconsContainer.removeAll(true);
        
        const upgradeTypes: Record<string, { icon: string, color: number }> = {
            'arc_hp': { icon: '❤', color: 0xff4444 },
            'arc_ki': { icon: '⚡', color: 0x44ccff },
            'arc_damage': { icon: '⚔', color: 0xffcc44 },
            'arc_defence': { icon: '🛡', color: 0x44ff44 },
            'arc_regen': { icon: '✚', color: 0x44ffaa },
            'arc_vamp': { icon: '💧', color: 0xaa44ff }
        };

        let xOffset = 0;
        const iconSize = 32;
        const spacing = 10;

        Object.entries(this.purchasedUpgrades).forEach(([id, level]) => {
            if (level <= 0) return;

            const type = upgradeTypes[id];
            if (!type) return;

            const bg = this.add.graphics();
            bg.fillStyle(0x000000, 0.6);
            bg.lineStyle(2, type.color, 1);
            bg.strokeRect(xOffset, 0, iconSize, iconSize);
            bg.fillRect(xOffset, 0, iconSize, iconSize);

            const iconText = this.add.text(xOffset + iconSize/2, iconSize/2, type.icon, {
                fontSize: '20px',
                color: Phaser.Display.Color.IntegerToColor(type.color).rgba,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            const levelText = this.add.text(xOffset + iconSize - 2, iconSize - 2, level.toString(), {
                fontSize: '12px',
                color: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }).setOrigin(1, 1);

            this.upgradeIconsContainer.add([bg, iconText, levelText]);
            xOffset += iconSize + spacing;
        });
    }

    private handlePlayerEnemyCollision(obj1: any, obj2: any) {
        const enemy = obj2 as Phaser.Physics.Arcade.Sprite;
        if (!enemy || !enemy.active) return;

        const levelIndex = Math.max(0, Math.min(this.level - 1, this.levelStats.length - 1));
        const stats = this.levelStats[levelIndex];

        // If player is dashing and pressing Z, deal damage
        if (this.isDashing && this.keys.Z.isDown) {
            this.hitEnemy(enemy, (stats.punch * 0.5)); // 0.5x base punch damage multiplier for Dash + Z
        }

        if (this.isGameOver || this.isWaveInterval || this.isInvincible) return;

        // Se estiver defendendo, o escudo bloqueia o dano e treme levemente
        if (this.isDefending) {
            this.cameras.main.shake(100, 0.003); // Treme a tela levemente
            if (this.shieldGraphics) {
                // Treme o escudo
                this.tweens.add({
                    targets: this.shieldGraphics,
                    x: Phaser.Math.Between(-3, 3),
                    y: Phaser.Math.Between(-3, 3),
                    duration: 50,
                    yoyo: true,
                    repeat: 1,
                    onComplete: () => {
                        if (this.shieldGraphics) {
                            this.shieldGraphics.x = 0;
                            this.shieldGraphics.y = 0;
                        }
                    }
                });
            }
            return;
        }

        // Se o inimigo estiver sendo repelido (knockback), não dá dano no player
        if (enemy.getData('isBeingKnockedBack')) return;

        const behavior = enemy.getData('behavior');
        
        // Shield Sentinel: 90% resistance to punch, vulnerable to magic
        let incomingDamageMult = 1;
        if (behavior === 'shield' && !this.isUsingMagic()) {
            incomingDamageMult = 0.1;
        }

        // Arc Phantom (Elite): 80% magic resistance
        if (behavior === 'elite_hybrid' && this.isUsingMagic()) {
            incomingDamageMult = 0.2;
        }

        const resMultiplier = 1 - (stats.res || 0);
        
        let baseDamage = enemy.getData('damage');
        if (baseDamage === undefined || isNaN(baseDamage) || !isFinite(baseDamage)) {
            baseDamage = 0.05; // Fallback to a safe small value
        }
        
        // Charger Ram: Dash damage = 10% of player damage
        if (behavior === 'charge' && enemy.getData('isDashing')) {
            baseDamage = (stats.punch || 10) * 0.1;
        }

        // Knockback Brute: Punch x4 if it hits
        if (behavior === 'knockback') {
            baseDamage *= 4;
            this.applyKnockbackToPlayer(enemy);
        }

        let finalDamage = baseDamage * resMultiplier * incomingDamageMult;
        
        // Reduce damage by 20% (take 80%) if player is dashing
        if (this.isDashing) {
            finalDamage *= 0.8;
        }

        if (!isNaN(finalDamage) && isFinite(finalDamage)) {
            this.health = Math.max(0, this.health - finalDamage);
        } else {
            console.warn('Detected NaN or Infinite damage, ignoring. Details:', {
                baseDamage,
                resMultiplier,
                incomingDamageMult,
                finalDamage,
                enemyType: behavior,
                wave: this.currentWave
            });
        }
        
        // Efeito de piscar em vermelho semi-transparente no gráfico
        let flashColor = 0xff4444;
        this.playerGraphics.fillStyle(flashColor, 0.8);
        this.playerGraphics.fillRect(this.player.x - 16, this.player.y - 16, 32, 32);
        
        this.time.delayedCall(150, () => {
            if (!this.isGameOver && this.player.active) {
                this.drawPlayerSquare(this.level);
            }
        });

        if (this.health <= 0) {
            this.isGameOver = true;
            // Disable Phaser keyboard input immediately upon death to allow name entry
            if (this.input.keyboard) {
                this.input.keyboard.enabled = false;
            }
            this.cameras.main.flash(1000, 255, 0, 0);
            if (this.sfx[this.deathSoundKey]) {
                this.sfx[this.deathSoundKey].play({ volume: this.sfxVolume });
            }
            this.health = 0;
            this.playerGraphics.clear();
            this.playerAuraGraphics.clear();
            this.player.setActive(false);
            if (this.player.body) {
                this.player.body.enable = false;
            }
            this.createExplosion(this.player.x, this.player.y);
            
            // Ir para tela de morte
            this.time.delayedCall(1000, () => {
                const totalTime = Math.floor((this.time.now - this.gameStartTime - this.totalPausedTime) / 1000);
                const playerName = (window as any).walletAddress 
                    ? "Arc Player " + (window as any).walletAddress.substring(0, 6)
                    : "Arc Player";

                this.scene.stop('MainScene');
                this.scene.start('DeathScene', { 
                    level: this.level,
                    wave: this.currentWave,
                    score: this.score,
                    enemiesDefeated: this.enemiesDefeated,
                    playTime: totalTime,
                    playerName: playerName
                });
            });
        }
    }

    private applyKnockbackToPlayer(enemy: Phaser.Physics.Arcade.Sprite) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const force = 500;
        this.player.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
    }

    private isUsingMagic(): boolean {
        return this.keys.C.isDown || this.keys.V.isDown || this.keys.B.isDown;
    }

    private useEnemyHexPulse(enemy: Phaser.Physics.Arcade.Sprite) {
        const pulse = this.add.circle(enemy.x, enemy.y, 10, 0x4ade80, 0.5);
        this.tweens.add({
            targets: pulse,
            radius: 100,
            alpha: 0,
            duration: 500,
            onComplete: () => pulse.destroy()
        });
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < 100 && !this.isInvincible && !this.isDefending) {
            this.takeDamage(enemy.getData('damage') * 2);
        }
    }

    private enemyCrescentSlash(enemy: Phaser.Physics.Arcade.Sprite) {
        const slash = this.add.graphics();
        slash.lineStyle(2, 0x4ade80, 0.8);
        slash.beginPath();
        slash.arc(enemy.x, enemy.y, 150, Math.PI * 0.2, Math.PI * 1.8);
        slash.strokePath();
        this.time.delayedCall(200, () => slash.destroy());
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < 150 && !this.isInvincible && !this.isDefending) {
            this.takeDamage(enemy.getData('damage'));
        }
    }

    private enemySpiralCast(enemy: Phaser.Physics.Arcade.Sprite) {
        for (let i = 0; i < 3; i++) {
            const angle = (this.time.now / 500) + (i * Math.PI * 2 / 3);
            const magic = this.add.circle(enemy.x, enemy.y, 8, 0x4ade80, 1);
            this.physics.add.existing(magic);
            const body = magic.body as Phaser.Physics.Arcade.Body;
            body.setVelocity(Math.cos(angle) * 300, Math.sin(angle) * 300);
            this.physics.add.overlap(this.player, magic, () => {
                magic.destroy();
                this.takeDamage(enemy.getData('damage'));
            });
            this.time.delayedCall(3000, () => {
                if (magic.active) magic.destroy();
            });
        }
    }

    private enemyTriArcSpell(enemy: Phaser.Physics.Arcade.Sprite) {
        const triangle = this.add.polygon(enemy.x, enemy.y, [0, -20, 15, 10, -15, 10], 0x00ffff, 0.5);
        this.physics.add.existing(triangle);
        const body = triangle.body as Phaser.Physics.Arcade.Body;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        body.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
        this.physics.add.overlap(this.player, triangle, () => {
            triangle.destroy();
            this.takeDamage(enemy.getData('damage') * 1.5);
        });
        this.time.delayedCall(2000, () => triangle.destroy());
    }

    private takeDamage(damage: number) {
        if (this.isInvincible || this.isGameOver || this.isDefending) return;
        
        if (isNaN(damage) || !isFinite(damage)) {
            console.warn('Blocked NaN damage in takeDamage');
            return;
        }

        const finalDamage = damage;
        this.health -= finalDamage;
        this.updateHUD();
        
        this.isInvincible = true;
        this.invincibilityTimer = 1000;
        
        this.cameras.main.shake(100, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.player.active) this.player.clearTint();
        });
        
        if (this.health <= 0) {
            this.isGameOver = true;
            // Disable Phaser keyboard input immediately upon death to allow name entry
            if (this.input.keyboard) {
                this.input.keyboard.enabled = false;
            }
            this.cameras.main.flash(1000, 255, 0, 0);
            if (this.sound.get(this.deathSoundKey)) {
                this.sound.play(this.deathSoundKey, { volume: this.sfxVolume });
            }
            this.submitScoreOnChain(); // Chamada on-chain ao morrer
            this.health = 0;
            this.playerGraphics.clear();
            this.playerAuraGraphics.clear();
            this.player.setActive(false);
            if (this.player.body) {
                this.player.body.enable = false;
            }
            this.createExplosion(this.player.x, this.player.y);
            
            this.time.delayedCall(1000, () => {
                this.scene.switch('DeathScene');
                this.scene.start('DeathScene', { 
                    level: this.level,
                    wave: this.currentWave,
                    score: this.score,
                    enemiesDefeated: this.enemiesDefeated,
                    levelTitle: this.levelTitle
                });
            });
        }
    }

    private enemyMeleeAttack(enemy: Phaser.Physics.Arcade.Sprite) {
        if (this.time.now < (enemy.getData('lastMeleeTime') || 0) + 1000) return;
        enemy.setData('lastMeleeTime', this.time.now);
        // Visual feedback for melee attack
        this.tweens.add({
            targets: enemy,
            scale: 1.2,
            duration: 100,
            yoyo: true
        });
    }

    private enemyDashAttack(enemy: Phaser.Physics.Arcade.Sprite) {
        enemy.setData('isDashing', true);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.setVelocity(Math.cos(angle) * 600, Math.sin(angle) * 600);
        this.time.delayedCall(500, () => {
            if (enemy.active) {
                enemy.setData('isDashing', false);
                enemy.setVelocity(0, 0);
            }
        });
    }

    private enemyShootMagic(enemy: Phaser.Physics.Arcade.Sprite) {
        if (this.time.now < (enemy.getData('lastShotTime') || 0) + 2000) return;
        enemy.setData('lastShotTime', this.time.now);
        const projectile = this.add.circle(enemy.x, enemy.y, 8, 0x4ade80);
        this.physics.add.existing(projectile);
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        if (body) body.setAllowGravity(false);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        body.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
        this.physics.add.overlap(this.player, projectile, () => {
            if (!this.isInvincible && !this.isDefending) {
                const damage = enemy.getData('damage');
                if (damage !== undefined && !isNaN(damage) && isFinite(damage)) {
                    this.health = Math.max(0, this.health - damage);
                }
            }
            projectile.destroy();
        });
        this.time.delayedCall(3000, () => projectile.destroy());
    }

    private enemyContinuousBeam(enemy: Phaser.Physics.Arcade.Sprite) {
        const graphics = this.add.graphics();
        graphics.lineStyle(2, 0x4ade80, 0.5);
        graphics.lineBetween(enemy.x, enemy.y, this.player.x, this.player.y);
        this.time.delayedCall(100, () => graphics.destroy());
    }

    private enemyDodgeBehavior(enemy: Phaser.Physics.Arcade.Sprite) {
        if (Math.random() < 0.05) {
            enemy.setVelocity(Phaser.Math.Between(-200, 200), Phaser.Math.Between(-200, 200));
        }
    }

    private enemyJumpAttack(enemy: Phaser.Physics.Arcade.Sprite) {
        enemy.setData('isJumping', true);
        enemy.setVelocityY(-400);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        enemy.setVelocityX(Math.cos(angle) * 300);
        this.time.delayedCall(1000, () => enemy.setData('isJumping', false));
    }

    private enemyExplode(enemy: Phaser.Physics.Arcade.Sprite) {
        this.createExplosion(enemy.x, enemy.y);
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist < 100 && !this.isInvincible && !this.isDefending) {
            const damage = enemy.getData('damage');
            if (!isNaN(damage)) {
                this.health = Math.max(0, this.health - damage * 5);
            }
            // Teleport player
            this.player.setPosition(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 500));
        }
        enemy.destroy();
    }

    private enemyShootArrow(enemy: Phaser.Physics.Arcade.Sprite) {
        if (this.time.now < (enemy.getData('lastArrowTime') || 0) + 3000) return;
        enemy.setData('lastArrowTime', this.time.now);
        // Simple arrow projectile
    }

    private enemyEliteBehavior(enemy: Phaser.Physics.Arcade.Sprite) {
        // Combination of attacks
        if (Math.random() < 0.01) this.enemyShootMagic(enemy);
        if (Math.random() < 0.01) this.enemyContinuousBeam(enemy);
    }

    updatePlayerVisual() {
        if (!this.player.active) return;
        
        this.cameras.main.flash(200, 255, 255, 255);

        // Show single Level Up text above player
        const levelUpText = this.add.text(this.player.x, this.player.y - 60, 'LEVEL UP!', {
            fontSize: '28px',
            color: '#fbbf24',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6,
            fontFamily: '"PixelPurl", monospace'
        }).setOrigin(0.5).setDepth(2000);

        this.tweens.add({
            targets: levelUpText,
            y: levelUpText.y - 100,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => levelUpText.destroy()
        });
    }

    private checkLevelUp() {
        if (this.level >= 10) return;
        
        const oldLevel = this.level;
        let targetLevel = 1;
        for (let i = 0; i < this.levelStats.length; i++) {
            if (this.score >= this.levelStats[i].score) {
                targetLevel = this.levelStats[i].lvl;
            } else {
                break;
            }
        }

        if (targetLevel !== this.level) {
            this.level = targetLevel;
            const stats = this.levelStats[this.level - 1];
            
            // Update current max stats from table
            this.maxHealth = stats.hp || 300;
            this.maxKiarc = stats.ki || 100;
            
            // CRITICAL: Re-apply upgrades to new level base stats
            this.applyUpgrade();
            
            // Visual feedback
            this.cameras.main.flash(500, 255, 255, 0);
            this.drawPlayerSquare(this.level);
            
            this.levelTitle = this.levelTitles[this.level - 1] || 'Arc Divine';

            this.updateHUD();
            this.updatePlayerVisual();
        }
    }

    private createInventoryHUD() {
        if (this.inventoryHUD) {
            this.inventoryHUD.destroy();
        }
        
        const { width, height } = this.cameras.main;
        // Posicionado no canto esquerdo, quase centralizado verticalmente
        this.inventoryHUD = this.add.container(20, height / 2 - 120);
        this.inventoryHUD.setScrollFactor(0);
        this.inventoryHUD.setDepth(100);

        const potionTypes = [
            { id: 'health', key: '1', color: 0xff4d4d },
            { id: 'ki', key: '2', color: 0x4d4dff },
            { id: 'immunity', key: '3', color: 0xffff4d },
            { id: 'score', key: '4', color: 0xff4dff }
        ];

        potionTypes.forEach((potion, index) => {
            const y = index * 60;
            
            // Quadrado base
            const bg = this.add.rectangle(0, y, 50, 50, 0x1e293b, 0.8)
                .setStrokeStyle(2, 0x3b82f6)
                .setOrigin(0, 0);
            
            // Número para usar (Canto Superior Esquerdo)
            this.add.text(4, y + 2, potion.key, {
                fontSize: '12px',
                fontFamily: '"PixelPurl", monospace',
                color: '#60a5fa',
                fontStyle: 'bold'
            }).setOrigin(0, 0);

            // Quantidade (Canto Inferior Direito)
            const count = this.playerInventory[potion.id] || 0;
            this.add.text(46, y + 46, count.toString(), {
                fontSize: '14px',
                fontFamily: '"PixelPurl", monospace',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(1, 1);
            
            // Ícone do Item (Círculo colorido no centro)
            const icon = this.add.circle(25, y + 25, 12, potion.color);
            
            this.inventoryHUD?.add([bg, icon]);
        });
    }

    private updateHUD() {
        if (!this.kiarcBar || !this.cameras?.main) {
            return;
        }

        // ⏱️ Timer Global da Partida (subtraindo tempo total pausado)
        const nowForTimer = this.isPaused ? this.pausedTime : this.time.now;
        const gameElapsed = Math.max(0, Math.floor((nowForTimer - this.gameStartTime - this.totalPausedTime) / 1000));
        if (this.timerText) {
            const mins = Math.floor(gameElapsed / 60);
            const secs = gameElapsed % 60;
            this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }

        this.renderBasicsControls();
        this.renderSpecialsCooldowns();

        const width = this.cameras.main.width;
        const hudScale = Math.max(1, width / 800);
        const fontSize = Math.floor(24 * hudScale);
        
        // Update labels
        this.scoreText.setText(`Score: ${this.score.toLocaleString()} | LEVEL: ${this.level} (${this.levelTitle})`);
        this.enemyCounterText.setText(`${this.enemiesDefeated}`);

        // Health and Ki arc rendering
        this.kiarcBar.clear();
        
        // Health Bar (Left side)
        const hbWidth = 200 * hudScale;
        const hbHeight = 20 * hudScale;
        const hbX = 16;
        const hbY = 16 + fontSize + 10;

        // BG
        this.kiarcBar.fillStyle(0x000000, 0.7);
        this.kiarcBar.fillRect(hbX, hbY, hbWidth, hbHeight);
        
        // Health Fill
        const healthRatio = Math.min(1, Math.max(0, this.health / this.maxHealth));
        const isLowHealth = healthRatio < 0.1;
        const hpAlpha = isLowHealth ? (0.6 + Math.sin(this.time.now / 150) * 0.4) : 1;
        
        this.kiarcBar.fillStyle(0xff4444, hpAlpha);
        this.kiarcBar.fillRect(hbX, hbY, hbWidth * healthRatio, hbHeight);
        
        // Border
        const borderColor = isLowHealth ? 0xff0000 : 0xffffff;
        const borderAlpha = isLowHealth ? (0.5 + Math.sin(this.time.now / 150) * 0.5) : 1;
        this.kiarcBar.lineStyle(2, borderColor, borderAlpha);
        this.kiarcBar.strokeRect(hbX, hbY, hbWidth, hbHeight);

        // HP Text
        if (!this.hpLabel) {
            this.hpLabel = this.add.text(hbX + 10, hbY + 1, '', { 
                fontSize: `${Math.floor(12 * hudScale)}px`, 
                color: '#fff', 
                fontFamily: '"PixelPurl", "Pixel", monospace',
                stroke: '#000',
                strokeThickness: 2
            }).setScrollFactor(0).setDepth(1001);
        }
        if (this.hpLabel && this.hpLabel.active && this.hpLabel.scene) {
            try {
                this.hpLabel.setText(`HP: ${Math.ceil(this.health)}/${this.maxHealth}`);
                this.hpLabel.setPosition(hbX + 10, hbY + 1);
            } catch (e) {
                console.warn('Error updating hpLabel:', e);
            }
        }

        // Ki Bar (Right side or below)
        const kiWidth = 200 * hudScale;
        const kiHeight = 16 * hudScale;
        const kiX = 16;
        const kiY = hbY + hbHeight + 8;

        // BG
        this.kiarcBar.fillStyle(0x000000, 0.7);
        this.kiarcBar.fillRect(kiX, kiY, kiWidth, kiHeight);
        
        // Ki Fill
        const kiRatio = Math.min(1, Math.max(0, this.kiarc / this.maxKiarc));
        this.kiarcBar.fillStyle(0xffd700, 1);
        this.kiarcBar.fillRect(kiX, kiY, kiWidth * kiRatio, kiHeight);
        
        // Border
        this.kiarcBar.lineStyle(2, 0xffffff, 1);
        this.kiarcBar.strokeRect(kiX, kiY, kiWidth, kiHeight);

        // Tooltip container
        if (!this.tooltipContainer) {
            this.tooltipContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(2000).setVisible(false);
            
            this.tooltipBg = this.add.graphics();
            this.tooltipTitle = this.add.text(10, 10, '', {
                fontSize: '14px',
                color: '#fbbf24',
                fontStyle: 'bold',
                fontFamily: 'monospace'
            });
            this.tooltipText = this.add.text(10, 30, '', {
                fontSize: '12px',
                color: '#ffffff',
                fontFamily: '"PixelPurl", monospace',
                wordWrap: { width: 200 }
            });
            
            this.tooltipContainer.add([this.tooltipBg, this.tooltipTitle, this.tooltipText]);
        }

        // KI Text
        if (!this.kiLabel) {
            this.kiLabel = this.add.text(kiX + 10, kiY + 0, '', { 
                fontSize: `${Math.floor(10 * hudScale)}px`, 
                color: '#fff', 
                fontFamily: '"PixelPurl", "Pixel", monospace',
                stroke: '#000',
                strokeThickness: 2
            }).setScrollFactor(0).setDepth(1001);
        }
        if (this.kiLabel && this.kiLabel.active && this.kiLabel.scene) {
            try {
                this.kiLabel.setText(`KI: ${Math.ceil(this.kiarc)}/${this.maxKiarc}`);
                this.kiLabel.setPosition(kiX + 10, kiY + 0);
            } catch (e) {
                console.warn('Error updating kiLabel:', e);
            }
        }

        // Update permanent upgrades UI
        if (this.upgradeIconsContainer) {
            // Position exactly below the KI bar (kiX) and slightly below (kiY + kiHeight + 20)
            this.upgradeIconsContainer.setPosition(kiX + 20, kiY + kiHeight + 20);
        }
        this.updateUpgradeIconsUI();

        // Update buff icons position below upgrades
        if (this.buffIconsContainer) {
            const upgradeRowHeight = 40; // Height of the upgrade icons row
            this.buffIconsContainer.setPosition(16, kiY + kiHeight + 20 + upgradeRowHeight + 10);
        }

        // Update notification position to be below buff icons
        const buffY = kiY + kiHeight + 20 + 40 + 10;
        const notifyY = buffY + (this.buffIconsContainer && this.buffIconsContainer.list.length > 0 ? 50 : 0);
        if (this.pickupNotification) {
            this.pickupNotification.setPosition(16, notifyY);
            if (this.pickupNotification.visible) {
                const bounds = this.pickupNotification.getBounds();
                this.pickupNotificationBg.clear();
                this.pickupNotificationBg.fillStyle(0x000000, 0.8);
                this.pickupNotificationBg.lineStyle(2, 0xffdd00, 1);
                this.pickupNotificationBg.fillRoundedRect(bounds.x - 8, bounds.y - 4, bounds.width + 16, bounds.height + 8, 6);
                this.pickupNotificationBg.strokeRoundedRect(bounds.x - 8, bounds.y - 4, bounds.width + 16, bounds.height + 8, 6);
            }
        }
    }

    private updateUpgradeIconsUI() {
        if (!this.upgradeIconsContainer) return;
        this.upgradeIconsContainer.removeAll(true);
        this.upgradeIconsContainer.setAlpha(0.8); // 20% more transparent

        const upgradeOrder = ['arc_hp', 'arc_ki', 'arc_damage', 'arc_defence', 'arc_regen', 'arc_vamp'];

        const upgradeNames: Record<string, string> = {
            arc_hp: 'HP',
            arc_ki: 'KI',
            arc_damage: 'DMG',
            arc_defence: 'DEF',
            arc_regen: 'REG',
            arc_vamp: 'VMP'
        };

        const upgradeColors: Record<string, number> = {
            arc_hp: 0xff4444,
            arc_ki: 0xffd700,
            arc_damage: 0xff8800,
            arc_defence: 0x4444ff,
            arc_regen: 0x44ff44,
            arc_vamp: 0xff00ff
        };

        let index = 0;
        upgradeOrder.forEach((id) => {
            const level = this.playerUpgrades[id] || 0;
            if (level > 0) {
                const x = index * 40;
                const container = this.add.container(x, 0);

                // Icon Background (Square for upgrades)
                const bg = this.add.graphics();
                bg.lineStyle(2, 0xffffff, 0.8);
                bg.fillStyle(upgradeColors[id] || 0x888888, 0.6);
                bg.strokeRect(-15, -15, 30, 30);
                bg.fillRect(-15, -15, 30, 30);

                // Text for the upgrade type (abbreviated)
                const nameText = this.add.text(0, -2, upgradeNames[id] || 'UPG', {
                    fontSize: '10px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    fontFamily: 'monospace'
                }).setOrigin(0.5);

                // Level text in bottom right
                const levelText = this.add.text(12, 12, level.toString(), {
                    fontSize: '12px',
                    color: '#ffff00',
                    fontStyle: 'bold',
                    fontFamily: '"PixelPurl", monospace',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);

                container.add([bg, nameText, levelText]);
                
                // Add interactive events for tooltip
                const hitArea = new Phaser.Geom.Rectangle(-15, -15, 30, 30);
                container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
                
                const descriptions: Record<string, string> = {
                    arc_hp: 'Permanently increases your maximum health.',
                    arc_ki: 'Permanently increases your KI capacity.',
                    arc_damage: 'Increases the damage of your attacks.',
                    arc_defence: 'Reduces damage received from enemies.',
                    arc_regen: 'Increases passive health regeneration.',
                    arc_vamp: 'Heals a portion of damage dealt.'
                };

                container.on('pointerover', () => {
                    this.showTooltip(container.x + this.upgradeIconsContainer!.x, container.y + this.upgradeIconsContainer!.y - 40, upgradeNames[id], descriptions[id]);
                });
                container.on('pointerout', () => {
                    this.hideTooltip();
                });

                this.upgradeIconsContainer.add(container);
                index++;
            }
        });
    }

    private updateBuffsUI() {
        if (!this.buffIconsContainer) return;
        this.buffIconsContainer.removeAll(true);
        this.buffIconsContainer.setAlpha(0.8); // 20% more transparent
        
        const activeBuffs = [];
        if (this.hasPowerBoost) activeBuffs.push({ type: 'ArcPower', title: 'Arc Power Boost', text: 'Doubles all character damage (Punch, Magic and Arcamehameha).', duration: 'Match' });
        if (this.hasScoreBoost) activeBuffs.push({ type: 'ArcScore', title: 'Arc Score Boost', text: 'Doubles all score gained from enemies and bosses.', duration: 'Match' });
        if (this.isInvincible) activeBuffs.push({ type: 'ArcBarrier', title: 'Arc Barrier', text: 'Character becomes invincible and takes no damage.', duration: `${Math.ceil(this.invincibilityTimer / 1000)}s` });

        activeBuffs.forEach((buff, index) => {
            const x = index * 45;
            const iconBg = this.add.graphics();
            iconBg.lineStyle(2, 0xffffff, 1);
            iconBg.fillStyle(this.getBuffColor(buff.type), 0.8);
            
            const size = 15;
            if (buff.type === 'ArcPower') {
                const points = this.createPolygonGeometry(3, size);
                iconBg.beginPath();
                iconBg.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) iconBg.lineTo(points[i].x, points[i].y);
                iconBg.closePath();
                iconBg.fillPath();
                iconBg.strokePath();
            } else if (buff.type === 'ArcScore') {
                const starPoints = 5;
                iconBg.beginPath();
                for (let i = 0; i < starPoints * 2; i++) {
                    const r = i % 2 === 0 ? size : size / 2;
                    const angle = (i * Math.PI) / starPoints;
                    const px = Math.cos(angle - Math.PI/2) * r;
                    const py = Math.sin(angle - Math.PI/2) * r;
                    if (i === 0) iconBg.moveTo(px, py);
                    else iconBg.lineTo(px, py);
                }
                iconBg.closePath();
                iconBg.fillPath();
                iconBg.strokePath();
            } else if (buff.type === 'ArcBarrier') {
                iconBg.fillRect(-size, -size, size * 2, size * 2);
                iconBg.strokeRect(-size, -size, size * 2, size * 2);
            }

            const hitArea = this.add.rectangle(0, 0, 40, 40).setInteractive();
            hitArea.on('pointerover', (pointer: Phaser.Input.Pointer) => {
                this.showTooltip(pointer.x, pointer.y, buff.title, buff.text, buff.duration);
            });
            hitArea.on('pointerout', () => {
                this.tooltipContainer.setVisible(false);
            });

            const buffContainer = this.add.container(x + 20, 20, [iconBg, hitArea]);
            this.buffIconsContainer.add(buffContainer);
        });
    }

    private playOpeningMusic() {
        console.log("Tentando reproduzir música de abertura...");
        // Verifica se a música já está tocando para não sobrepor
        if (this.openingMusic && this.openingMusic.isPlaying) {
            console.log("Música já está tocando.");
            return;
        }
        
        // Se já existe mas está pausada, apenas resuma
        if (this.openingMusic && this.openingMusic.isPaused) {
            console.log("Resumindo música pausada.");
            this.openingMusic.resume();
            return;
        }

        try {
            this.openingMusic = this.sound.add('opening_music', { loop: true });
            const vol = 0.7 * (this.masterVolume || 1.0) * (this.musicVolume || 1.0);
            (this.openingMusic as any).setVolume(vol);
            this.openingMusic.play();
            console.log("Música de abertura iniciada com volume:", vol);
        } catch (err) {
            console.error("Erro ao reproduzir música de abertura:", err);
        }
    }

    public stopOpeningMusic() {
        if (this.openingMusic) {
            this.openingMusic.stop();
            this.openingMusic = null;
        }
    }

    public pauseOpeningMusic() {
        if (this.openingMusic && this.openingMusic.isPlaying) {
            this.openingMusic.pause();
        }
    }

    public resumeOpeningMusic() {
        if (this.openingMusic && this.openingMusic.isPaused) {
            this.openingMusic.resume();
        }
    }

    private playNextMusic() {
        // Stop current music if playing
        if (this.currentMusic) {
            this.currentMusic.stop();
        }

        // Play current track
        const trackKey = `music_${this.currentMusicIndex}`;
        this.currentMusic = this.sound.add(trackKey);
        // Apply base volume (0.7) multiplied by music volume setting
        (this.currentMusic as any).setVolume(0.7 * this.musicVolume);
        
        // When music ends, play next track
        this.currentMusic.once('complete', () => {
            this.currentMusicIndex = (this.currentMusicIndex + 1) % this.musicTracks.length;
            this.playNextMusic();
        });

        this.currentMusic.play();
    }

    private getBuffColor(type: string): number {
        switch (type) {
            case 'ArcPower': return 0xff0000;
            case 'ArcScore': return 0xffd700;
            case 'ArcBarrier': return 0x800080;
            default: return 0xffffff;
        }
    }

    private showTooltip(x: number, y: number, title: string, text: string, duration?: string) {
        if (!this.tooltipContainer) return;
        
        if (this.tooltipHideTimer) {
            this.tooltipHideTimer.remove();
            this.tooltipHideTimer = null;
        }

        const textObj = this.tooltipContainer.list[1] as Phaser.GameObjects.Text;
        textObj.setText(`${title}\n${text}${duration ? `\nDuration: ${duration}` : ''}`);
        
        this.tooltipContainer.setPosition(x, y);
        this.tooltipContainer.setVisible(true);
    }

    private hideTooltip() {
        if (this.tooltipHideTimer) return;

        this.tooltipHideTimer = this.time.delayedCall(5000, () => {
            if (this.tooltipContainer) {
                this.tooltipContainer.setVisible(false);
            }
            this.tooltipHideTimer = null;
        });
    }

    // Public volume control methods
    public setMasterVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.masterVolume = Math.max(0, Math.min(1, val / 100));
        // Apply to all sounds
        Object.values(this.sfx).forEach(sound => {
            if (sound && (sound as any).setVolume) {
                const sfxVol = Number(this.sfxVolume) || 0;
                (sound as any).setVolume(this.masterVolume * sfxVol);
            }
        });
        const musicVol = Number(this.musicVolume) || 0;
        if (this.currentMusic && (this.currentMusic as any).setVolume) {
            (this.currentMusic as any).setVolume(0.7 * this.masterVolume * musicVol);
        }
        if (this.openingMusic && (this.openingMusic as any).setVolume) {
            (this.openingMusic as any).setVolume(0.7 * this.masterVolume * musicVol);
        }
    }

    public setMusicVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.musicVolume = Math.max(0, Math.min(1, val / 100));
        if (this.currentMusic && (this.currentMusic as any).setVolume) {
            (this.currentMusic as any).setVolume(0.7 * this.masterVolume * this.musicVolume);
        }
        if (this.openingMusic && (this.openingMusic as any).setVolume) {
            (this.openingMusic as any).setVolume(0.7 * this.masterVolume * this.musicVolume);
        }
    }

    public setSfxVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.sfxVolume = val / 100;
        
        const targetVol = this.masterVolume * this.sfxVolume;
        
        // 1. Update the pre-loaded SFX map
        Object.values(this.sfx).forEach(sound => {
            if (sound) {
                try {
                    // Phaser 3 WebAudio sounds have both volume property and setVolume method
                    if (typeof (sound as any).setVolume === 'function') {
                        (sound as any).setVolume(targetVol);
                    }
                    (sound as any).volume = targetVol;
                } catch(e) {}
            }
        });
        
        // 2. Update all sound instances currently managed by Phaser
        if (this.sound && this.sound.getAll) {
            this.sound.getAll('').forEach(sound => {
                const soundKey = (sound as any).key;
                if (soundKey !== 'opening_music' && !soundKey.startsWith('music_')) {
                    try {
                        if (typeof (sound as any).setVolume === 'function') {
                            (sound as any).setVolume(targetVol);
                        }
                        (sound as any).volume = targetVol;
                    } catch(e) {}
                }
            });
        }
        
        // 3. For any future sounds, we ensure the volume is applied immediately upon play
        // We do this by overriding the play method of our SFX objects
        Object.keys(this.sfx).forEach(key => {
            const originalSound = this.sfx[key];
            if (originalSound && !(originalSound as any)._volumeOverridden) {
                const originalPlay = originalSound.play.bind(originalSound);
                originalSound.play = (markerOrConfig?: string | Phaser.Types.Sound.SoundConfig, config?: Phaser.Types.Sound.SoundConfig) => {
                    const currentTargetVol = this.masterVolume * this.sfxVolume;
                    if (typeof (originalSound as any).setVolume === 'function') {
                        (originalSound as any).setVolume(currentTargetVol);
                    }
                    (originalSound as any).volume = currentTargetVol;
                    return originalPlay(markerOrConfig, config);
                };
                (originalSound as any)._volumeOverridden = true;
            }
        });
    }

    public applyUpgrade(id?: string, level?: number) {
        // If no arguments, apply all upgrades from playerUpgrades
        if (id === undefined || level === undefined) {
            Object.entries(this.playerUpgrades).forEach(([upgradeId, upgradeLevel]) => {
                if (upgradeLevel > 0) {
                    this.applySingleUpgrade(upgradeId, upgradeLevel);
                }
            });
            return;
        }
        this.applySingleUpgrade(id, level);
    }

    private applySingleUpgrade(id: string, level: number) {
        // Updated bonus values to match the exact percentages requested for ArcVamp
        // hp/ki/damage use the standard scale, vamp uses the specific 0.0001 to 0.001 scale
        const standardBonuses = [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.55, 0.7, 0.85, 1.0, 2.0];
        const vampBonuses = [0, 0.0001, 0.0002, 0.0003, 0.0004, 0.0005, 0.0006, 0.0007, 0.0008, 0.0009, 0.001];
        
        const bonus = id === 'arc_vamp' ? (vampBonuses[level] || 0) : (standardBonuses[level] || 0);
        
        // Get base stats for current level
        const baseStats = this.levelStats[this.level - 1] || this.levelStats[0];

        switch (id) {
            case 'arc_hp':
                const oldMaxHp = this.maxHealth || 300;
                this.maxHealth = (baseStats.hp || 300) * (1 + bonus);
                if (isNaN(this.maxHealth)) this.maxHealth = oldMaxHp;
                this.health += (this.maxHealth - oldMaxHp); 
                break;
            case 'arc_ki':
                this.maxKiarc = (baseStats.ki || 100) * (1 + bonus);
                if (isNaN(this.maxKiarc)) this.maxKiarc = (baseStats.ki || 100);
                break;
            case 'arc_damage':
                // We'll use a property to multiply damage
                (this as any).damageMultiplier = 1 + bonus;
                break;
            case 'arc_defence':
                (this as any).defenceBonus = bonus;
                break;
            case 'arc_regen':
                if (!(this as any).regenTimer) {
                    (this as any).regenTimer = this.time.addEvent({
                        delay: 10000,
                        callback: () => {
                            const regenAmount = this.maxHealth * bonus;
                            this.health = Math.min(this.maxHealth, this.health + regenAmount);
                        },
                        loop: true
                    });
                }
                break;
            case 'arc_vamp':
                (this as any).vampBonus = bonus;
                break;
        }
    }

    public updateWalletHUD() {
        if (this.walletHUDText) {
            const walletAddr = (window as any).walletAddress;
            const walletDisplay = walletAddr ? `${walletAddr.substring(0, 6)}...${walletAddr.substring(walletAddr.length - 4)}` : 'Not Connected';
            const networkDisplay = (window as any).networkName || 'Unknown';
            this.walletHUDText.setText(`Wallet: ${walletDisplay} | Network: ${networkDisplay}`);
        }
    }

    private openPauseModal() {
        if (this.isGamePaused) return;
        
        console.log("PAUSING GAME...");
        this.isGamePaused = true;
        this.isPaused = true;
        this.pauseModalOpen = true;
        
        // Marca o momento exato do pause
        this.pausedTime = this.time.now;
        
        // Pausar eventos de timer específicos
        if (this.waveTimerEvent) this.waveTimerEvent.paused = true;
        if (this.spawnEvent) this.spawnEvent.paused = true;
        
        // Notify React to show pause modal
        if ((window as any).showPauseModal) {
            (window as any).showPauseModal();
        }
        
        // 🔑 Pausa TODOS os TimerEvents do Phaser
        this.time.timeScale = 0;
        
        // Pausa física e animações
        this.physics.pause();
        this.tweens.pauseAll();
        this.sound.pauseAll();
        
        // Freeze the visual timers at this exact moment BEFORE pausing scene
        this.updateHUD();
        
        // Pause the scene completely (Must be last)
        this.scene.pause();
    }

    private openUpgradesModal() {
        if (this.sfx && this.sfx['menu_button']) {
            this.sfx['menu_button'].play();
        }
        const win = window as any;
        // Tente as duas possíveis nomenclaturas para garantir compatibilidade
        const upgradeFunc = win.openUpgradesModal || win.showUpgradesModal;
        if (typeof upgradeFunc === 'function') {
            upgradeFunc();
        } else {
            console.error("Upgrade function not found on window object");
        }
    }

    private closePauseModal() {
        if (!this.isGamePaused) return;
        
        console.log("RESUMING GAME...");
        this.isGamePaused = false;
        this.isPaused = false;
        this.pauseModalOpen = false;
        
        // Resume the entire scene processing (Must be first to allow time.now to update)
        this.scene.resume();
        
        // 🔑 Retoma o tempo do Phaser
        this.time.timeScale = 1;
        
        // Calcula quanto tempo o jogo ficou pausado
        const pauseDuration = this.time.now - this.pausedTime;
        this.totalPausedTime += pauseDuration;
        
        // Ajustar waveStartTime para compensar a pausa (O SEGREDO)
        this.waveStartTime += pauseDuration;
        
        // Retomar eventos de timer específicos
        if (this.waveTimerEvent) this.waveTimerEvent.paused = false;
        if (this.spawnEvent) this.spawnEvent.paused = false;
        
        console.log(`Paused for ${pauseDuration}ms, total paused: ${this.totalPausedTime}ms`);
        
        // Retoma física e animações
        this.physics.resume();
        this.tweens.resumeAll();
        this.sound.resumeAll();
        
        this.updateHUD();
        
        if ((window as any).hidePauseModal) {
            (window as any).hidePauseModal();
        }
    }

    public exitGameFromPause() {
        console.log("GAME: exitGameFromPause called");
        
        // Finalize player state safely
        if (this.player) {
            this.player.setActive(false);
            if (this.player.body) {
                this.player.body.enable = false;
            }
        }
        
        // Stop all timers and systems to prevent updates while switching
        this.physics.pause();
        this.tweens.pauseAll();
        
        if (this.spawnEvent) this.spawnEvent.remove();
        if (this.waveTimerEvent) this.waveTimerEvent.remove();
        
        // Notify React to hide pause modal
        if ((window as any).hidePauseModal) {
            (window as any).hidePauseModal();
        }
        
        const totalTime = Math.floor((this.time.now - this.gameStartTime - this.totalPausedTime) / 1000);
        const playerName = (window as any).walletAddress 
            ? "Arc Player " + (window as any).walletAddress.substring(0, 6)
            : "Arc Player";

        const stats = { 
            level: this.level,
            wave: this.currentWave,
            score: this.score,
            enemiesDefeated: this.enemiesDefeated,
            playTime: totalTime,
            playerName: playerName,
            fromPause: true
        };

        console.log("GAME: Transitioning to DeathScene with stats", stats);
        
        // Wake the loop and resume scene so transition can occur, but move to next scene immediately
        this.game.loop.wake();
        this.scene.resume();
        
        this.scene.stop('MainScene');
        this.scene.start('DeathScene', stats);
    }
}

class StartScene extends Phaser.Scene {
    private sfx: { [key: string]: Phaser.Sound.BaseSound } = {};
    private openingMusic: Phaser.Sound.BaseSound | null = null;
    private walletAddress: string | null = null;
    private isWalletConnecting: boolean = false;
    private walletBtn: Phaser.GameObjects.Rectangle | null = null;
    private walletText: Phaser.GameObjects.Text | null = null;
    private networkInfoText: Phaser.GameObjects.Text | null = null;
    private usdcBalanceText: Phaser.GameObjects.Text | null = null;
    private startBtn: Phaser.GameObjects.Rectangle | null = null;
    private startText: Phaser.GameObjects.Text | null = null;
    private upgradesBtn: Phaser.GameObjects.Rectangle | null = null;
    private upgradesText: Phaser.GameObjects.Text | null = null;
    private masterVolume: number = 1.0;
    private musicVolume: number = 1.0;
    private sfxVolume: number = 1.0;
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private maxHealth: number = 300;
    private health: number = 300;
    private maxKiarc: number = 100;
    private intervalTimerEvent: Phaser.Time.TimerEvent | null = null;

    constructor() {
        super('StartScene');
    }

    preload() {
        // Background Image
        this.load.image('start_bg', '/Background_Tela_Principal_1767815377331.png');

        // Logo
        this.load.image('game_logo', '/8a5b21d5-fa8e-404c-b7a1-4d7acfe803ef_1767786400336.png');

        // Opening Music
        this.load.audio('opening_music', [
            '/Open_1767879401695.ogg',
            '/Open_1767879213418.mp3'
        ]);

        // Social Media Icons
        this.load.image('x_icon', '/x.png');
        this.load.image('github_icon', '/github.png');
        this.load.image('youtube_icon', '/youtube.png');
        this.load.image('farcaster_icon', '/farcaster.png');
        this.load.image('instagram_icon', '/instagram.png');
        this.load.image('telegram_icon', '/telegram.png');
        this.load.image('discord_icon', '/discord.png');
    }

    private async connectWallet() {
        if (this.isWalletConnecting) return;
        this.isWalletConnecting = true;

        try {
            // Arc Testnet Config
            const arcTestnet = {
                chainId: '0x4cef52', // 5042002 decimal em hexadecimal
                chainName: 'Arc Testnet',
                nativeCurrency: {
                    name: 'USDC',
                    symbol: 'USDC',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.testnet.arc.network', 'https://rpc.blockdaemon.testnet.arc.network', 'https://rpc.drpc.testnet.arc.network', 'https://rpc.quicknode.testnet.arc.network'],
                blockExplorerUrls: ['https://testnet.arcscan.app']
            };

            try {
                console.log('Requesting account connection...');
                const accounts = await (window as any).ethereum.request({
                    method: 'eth_requestAccounts',
                    params: [],
                });
                this.walletAddress = accounts[0];
                (window as any).walletAddress = this.walletAddress;
                
                const provider = new ethers.BrowserProvider((window as any).ethereum);

                console.log('Attempting to switch to Arc Testnet (0x4cef52)...');
                try {
                    await (window as any).ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0x4cef52' }],
                    });
                } catch (switchError: any) {
                    console.log('Network switch failed, error:', switchError.code || switchError.message);
                    
                    // Robust check for chain not found error
                    const isMissing = switchError.code === 4902 || 
                                    (switchError.data && switchError.data.originalError && switchError.data.originalError.code === 4902) ||
                                    (switchError.message && (switchError.message.toLowerCase().includes('unrecognized') || switchError.message.toLowerCase().includes('not been added')));

                    if (isMissing) {
                        console.log('Adding Arc Testnet to wallet...');
                        await (window as any).ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [arcTestnet],
                        });
                    } else {
                        throw switchError;
                    }
                }

                this.updateWalletButtonText(`CONNECTED: ${this.walletAddress?.substring(0, 6)}...`);
                this.updateNetworkDisplay('Arc Testnet');
                (window as any).networkName = 'Arc Testnet';
                
                // Update START GAME button state
                if ((window as any).updateStartButtonState) {
                    (window as any).updateStartButtonState();
                }
                
                if (this.scene.isActive('MainScene')) {
                    const mainScene = this.scene.get('MainScene') as any;
                    mainScene.updateWalletHUD?.();
                }
            } catch (error: any) {
                console.error('Outer connection error:', error);
                this.isWalletConnecting = false;
                this.updateWalletButtonText('CONNECT WALLET');
            }
        } catch (error: any) {
            console.error('Outer connection error:', error);
            this.isWalletConnecting = false;
            this.updateWalletButtonText('CONNECT WALLET');
        }
    }

    private updateWalletButtonText(text: string) {
        if (this.walletText) {
            this.walletText.setText(text);
        }
    }

    private updateNetworkDisplay(network: string) {
        if (this.networkInfoText) {
            this.networkInfoText.setText(network ? `Network: ${network}` : '');
        }
    }

    private async updateUSDCBalance() {
        const isWalletConnected = !!(window as any).walletAddress;
        const isStartSceneActive = this.scene.isActive('StartScene');

        if (!isWalletConnected || !isStartSceneActive) {
            if (this.usdcBalanceText) {
                this.usdcBalanceText.setVisible(false);
            }
            return;
        }

        const address = (window as any).walletAddress;
        if (!address) return;

        try {
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const usdcAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";
            const usdcAbi = [
                "function balanceOf(address owner) view returns (uint256)",
                "function decimals() view returns (uint8)"
            ];
            
            const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, provider);
            
            let formattedBalance = "0.00";
            try {
                const [balance, decimals] = await Promise.all([
                    usdcContract.balanceOf(address),
                    usdcContract.decimals().catch(() => 18)
                ]);
                formattedBalance = ethers.formatUnits(balance, decimals);
            } catch (contractErr) {
                const balance = await provider.getBalance(address);
                formattedBalance = ethers.formatEther(balance);
            }
            
            if (this.usdcBalanceText && (window as any).walletAddress && this.scene.isActive('StartScene')) {
                this.usdcBalanceText.setText(`MY WALLET USDC: ${parseFloat(formattedBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                this.usdcBalanceText.setVisible(true);
                this.usdcBalanceText.setDepth(10000);
            } else if (this.usdcBalanceText) {
                this.usdcBalanceText.setVisible(false);
            }
        } catch (err) {
            if (this.usdcBalanceText) this.usdcBalanceText.setVisible(false);
        }
    }

    private playOpeningMusic() {
        console.log("Tentando reproduzir música de abertura na StartScene...");
        
        // Load volume settings from localStorage
        this.masterVolume = (parseInt(localStorage.getItem('masterVolume') || '100')) / 100;
        this.musicVolume = (parseInt(localStorage.getItem('musicVolume') || '100')) / 100;
        
        if (this.openingMusic && this.openingMusic.isPlaying) {
            return;
        }
        
        if (this.openingMusic && this.openingMusic.isPaused) {
            this.openingMusic.resume();
            return;
        }

        try {
            let sound = this.sound.get('opening_music');
            if (!sound) {
                sound = this.sound.add('opening_music', { loop: true });
            }
            this.openingMusic = sound;
            const vol = 0.7 * this.masterVolume * this.musicVolume;
            (this.openingMusic as any).setVolume(vol);
            this.openingMusic.play();
            console.log("Música de abertura iniciada na StartScene com volume:", vol);
        } catch (err) {
            console.error("Erro ao reproduzir música de abertura na StartScene:", err);
        }
    }

    public stopOpeningMusic() {
        if (this.openingMusic) {
            this.openingMusic.stop();
            this.openingMusic = null;
        }
    }

    public pauseOpeningMusic() {
        if (this.openingMusic && this.openingMusic.isPlaying) {
            this.openingMusic.pause();
        }
    }

    public resumeOpeningMusic() {
        if (this.openingMusic && this.openingMusic.isPaused) {
            this.openingMusic.resume();
        }
    }

    private create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.playOpeningMusic();

        // Add input listener to resume audio context if suspended (browser requirement)
        this.input.on('pointerdown', () => {
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            this.playOpeningMusic();
        });

        // New Background Image
        const bg = this.add.image(width / 2, height / 2, 'start_bg').setOrigin(0.5, 0.5).setScrollFactor(0);
        const scaleX = width / bg.width;
        const scaleY = height / bg.height;
        const scale = Math.max(scaleX, scaleY);
        bg.setScale(scale);
        
        // Add a subtle dark overlay to ensure readability
        this.add.rectangle(0, 0, width, height, 0x000000, 0.3).setOrigin(0).setScrollFactor(0);

        // Title
        const logo = this.add.image(width / 2, height / 3, 'game_logo').setOrigin(0.5, 0.5).setDepth(10);
        const titleScale = (width * 0.4) / logo.width;
        logo.setScale(titleScale);

        // Pulsing effect
        this.tweens.add({
            targets: logo,
            scale: titleScale * 1.05,
            duration: 3000,
            yoyo: true,
            loop: -1,
            ease: 'Sine.easeInOut'
        });

        // Particle effect around the logo
        const particles = this.add.particles(0, 0, 'flare', {
            speed: { min: 20, max: 50 },
            scale: { start: 0.1, end: 0 },
            alpha: { start: 0.5, end: 0 },
            lifespan: 1500,
            blendMode: 'ADD',
            frequency: 50,
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Rectangle(-logo.displayWidth / 2, -logo.displayHeight / 2, logo.displayWidth, logo.displayHeight),
                quantity: 40
            }
        });
        
        const logoContainer = this.add.container(logo.x, logo.y);
        logoContainer.add(particles);
        logoContainer.setDepth(9);
        
        // Sync particles position with pulsing logo
        this.events.on('update', () => {
            if (logo.active) {
                logoContainer.setScale(logo.scale);
            }
        });

        // Helper to create neon buttons
        const createNeonButton = (x: number, y: number, w: number, h: number, color: number, text: string, fontSize: string, textColor: string, callback: () => void) => {
            const container = this.add.container(x, y);
            const glow = this.add.graphics();
            const drawGlow = (thickness: number, alpha: number) => {
                glow.lineStyle(thickness, color, alpha);
                glow.strokeRoundedRect(-w/2 - thickness/2, -h/2 - thickness/2, w + thickness, h + thickness, 12 + thickness/2);
            };
            drawGlow(16, 0.1);
            drawGlow(12, 0.2);
            drawGlow(8, 0.3);
            drawGlow(4, 0.5);
            const btnRect = this.add.rectangle(0, 0, w, h, 0x000000, 0.8);
            btnRect.setStrokeStyle(2, color, 1);
            const btnText = this.add.text(0, 0, text, {
                fontSize: fontSize,
                fontFamily: '"PixelPurl", monospace',
                color: textColor,
                fontStyle: 'bold',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5, 0.5);
            container.add([glow, btnRect, btnText]);
            btnRect.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this.tweens.add({ targets: container, scale: 0.95, duration: 50, yoyo: true });
                    if (this.sfx['button_click']) this.sfx['button_click'].play({ volume: this.sfxVolume });
                    callback();
                })
                .on('pointerover', () => {
                    this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
                    btnRect.setFillStyle(color, 0.2);
                })
                .on('pointerout', () => {
                    this.tweens.add({ targets: container, scale: 1, duration: 100 });
                    btnRect.setFillStyle(0x000000, 0.8);
                });
            return { container, btn: btnRect, btnText };
        };

        const isWalletConnected = !!(window as any).walletAddress;
        
        // Connect Wallet Button
        const walletBtnObj = createNeonButton(width / 2, height / 2 - 30, 320, 60, 0x3b82f6, isWalletConnected ? `CONNECTED: ${(window as any).walletAddress.substring(0, 6)}...` : 'CONNECT WALLET', '24px', '#ffffff', () => {
            this.connectWallet();
        });
        this.walletBtn = walletBtnObj.btn as any;
        this.walletText = walletBtnObj.btnText;

        // Start Button
        const startBtnColor = isWalletConnected ? 0x4ade80 : 0x6b7280;
        const startBtnObj = createNeonButton(width / 2, height / 2 + 50, 240, 60, startBtnColor, 'START GAME', '28px', '#ffffff', async () => {
            const currentWallet = (window as any).walletAddress;
            if (!currentWallet) {
                alert('Wallet connection is required!');
                return;
            }

            try {
                // Show loading state
                startBtnObj.btnText.setText('LOADING...');
                
                // Fetch Character State from Backend (Inventory)
                let data;
                try {
                    const response = await fetch(`/api/character-state/${currentWallet}`);
                    if (response.ok) {
                        data = await response.json();
                    } else {
                        throw new Error('API not available');
                    }
                } catch (apiErr) {
                    console.warn('API not available, using defaults:', apiErr);
                    data = {
                        inventory: { walletAddress: currentWallet, potions: { health: 0, ki: 0, immunity: 0, score: 0 } },
                        upgrades: { walletAddress: currentWallet, stats: { health: 0, damage: 0, speed: 0, ki: 0 } }
                    };
                }
                
                // Store inventory in global for MainScene access
                (window as any).characterState = data;

                // 📡 ON-CHAIN SYNC: Fetch Upgrades exactly like the UPGRADES button does
                console.log("📡 Start Game: Sincronizando upgrades on-chain...");
                
                let upgradesData;
                try {
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    const signer = await provider.getSigner();
                    const userAddress = await signer.getAddress();
                    
                    const upgradeContractAddress = "0x6101d4D79C6573c570eAA0eeabff13e663c17c08";
                    const upgradeAbi = [
                        "function upgrades(address) public view returns (uint256 hp, uint256 ki, uint256 damage, uint256 defence, uint256 regen, uint256 vamp)"
                    ];
                    
                    const upgradeContract = new ethers.Contract(upgradeContractAddress, upgradeAbi, signer);
                    const onChainData = await upgradeContract.upgrades(userAddress);
                    
                    upgradesData = {
                        arc_hp: Number(onChainData.hp),
                        arc_ki: Number(onChainData.ki),
                        arc_damage: Number(onChainData.damage),
                        arc_defence: Number(onChainData.defence),
                        arc_regen: Number(onChainData.regen),
                        arc_vamp: Number(onChainData.vamp)
                    };
                    
                    console.log("✅ Start Game: Upgrades sincronizados:", upgradesData);
                } catch (onChainErr) {
                    console.warn("On-chain sync failed, using defaults:", onChainErr);
                    upgradesData = {
                        arc_hp: 0,
                        arc_ki: 0,
                        arc_damage: 0,
                        arc_defence: 0,
                        arc_regen: 0,
                        arc_vamp: 0
                    };
                }
                
                (window as any).playerUpgrades = upgradesData;
                
                this.stopOpeningMusic();
                this.scene.start('MainScene');
            } catch (err) {
                console.error('Error starting game:', err);
                // Use defaults if everything fails
                (window as any).characterState = {
                    inventory: { walletAddress: currentWallet, potions: { health: 0, ki: 0, immunity: 0, score: 0 } },
                    upgrades: { walletAddress: currentWallet, stats: { health: 0, damage: 0, speed: 0, ki: 0 } }
                };
                (window as any).playerUpgrades = {
                    arc_hp: 0,
                    arc_ki: 0,
                    arc_damage: 0,
                    arc_defence: 0,
                    arc_regen: 0,
                    arc_vamp: 0
                };
                this.stopOpeningMusic();
                this.scene.start('MainScene');
            }
        });
        this.startBtn = startBtnObj.btn as any;
        this.startText = startBtnObj.btnText;

        // Menu Buttons Grid
        const menuY = height / 2 + 130;
        createNeonButton(width / 2, menuY, 220, 46, 0x6b7280, 'UPGRADES', '20px', '#ffffff', () => (window as any).openUpgradesModal?.());
        createNeonButton(width / 2, menuY + 60, 220, 46, 0x6b7280, 'SHOPPING', '20px', '#ffffff', () => (window as any).openShoppingModal?.());
        createNeonButton(width / 2, menuY + 120, 220, 46, 0x6b7280, 'HISTORY', '20px', '#ffffff', () => (window as any).openHistoryModal?.());
        createNeonButton(width / 2, menuY + 180, 220, 46, 0x6b7280, 'CONTROLS', '20px', '#ffffff', () => (window as any).openControlsModal?.());
        createNeonButton(width / 2, menuY + 240, 220, 46, 0x6b7280, 'SETTINGS', '20px', '#ffffff', () => (window as any).openSettingsModal?.());

        // Embedded Leaderboard in StartScene
        const lbWidth = 600; // Increased width
        const lbHeight = 850; // Increased height
        const lbX = width - lbWidth / 2 - 50; 
        const lbY = height / 2 - 60; // Move up to avoid contracts

        const lbBg = this.add.rectangle(lbX, lbY, lbWidth, lbHeight, 0x000000, 0.4).setDepth(5); // More transparent
        lbBg.setStrokeStyle(3, 0x4ade80);

        this.add.text(lbX, lbY - lbHeight/2 + 40, 'LEADERBOARD', {
            fontSize: '36px',
            fontFamily: '"PixelPurl", monospace',
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        // Leaderboard Content Container
        const lbContentContainer = document.createElement('div');
        lbContentContainer.id = 'embedded-leaderboard';
        lbContentContainer.style.position = 'absolute';
        
        // Calculate position relative to game canvas
        const updateLBPosition = () => {
            const canvasObj = this.game.canvas;
            const canvasRect = canvasObj.getBoundingClientRect();
            
            // The game is 1920x1080. We need to scale lbWidth/lbHeight accordingly
            const scaleX = canvasRect.width / 1920;
            const scaleY = canvasRect.height / 1080;
            
            const divWidth = (lbWidth - 40) * scaleX;
            const divHeight = (lbHeight - 120) * scaleY;
            const divX = canvasRect.left + (lbX - lbWidth/2 + 20) * scaleX;
            const divY = canvasRect.top + (lbY - lbHeight/2 + 100) * scaleY;

            lbContentContainer.style.left = divX + 'px';
            lbContentContainer.style.top = divY + 'px';
            lbContentContainer.style.width = divWidth + 'px';
            lbContentContainer.style.height = divHeight + 'px';
            
            // Scale content based on zoom/resize
            lbContentContainer.style.fontSize = (14 * scaleY) + 'px';
        };

        updateLBPosition();
        window.addEventListener('resize', updateLBPosition);
        
        lbContentContainer.style.backgroundColor = 'transparent';
        lbContentContainer.style.overflowY = 'auto'; 
        lbContentContainer.style.overflowX = 'hidden';
        lbContentContainer.style.zIndex = '100';
        lbContentContainer.style.color = '#fff';
        lbContentContainer.style.fontFamily = 'monospace';
        lbContentContainer.style.pointerEvents = 'auto';

        // Add a visible scrollbar style for better UX
        const lbStyle = document.createElement('style');
        lbStyle.textContent = `
            #embedded-leaderboard::-webkit-scrollbar {
                width: 6px !important;
                display: block !important;
            }
            #embedded-leaderboard::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.2) !important;
            }
            #embedded-leaderboard::-webkit-scrollbar-thumb {
                background: #4ade80 !important;
                border-radius: 3px;
            }
            .lb-table { width: 100%; border-collapse: collapse; font-family: monospace; }
            .lb-table th { 
                color: #4ade80; 
                text-align: center; 
                padding: 10px 5px; 
                font-size: 1.1em; 
                text-transform: uppercase; 
                position: sticky; 
                top: 0; 
                background: rgba(0, 0, 0, 0.8);
                z-index: 10;
                border-bottom: 2px solid rgba(74, 222, 128, 0.3);
            }
            .lb-table td { padding: 12px 5px; font-size: 1em; text-align: center; vertical-align: middle; }
            .lb-row { border-bottom: 1px solid rgba(74, 222, 128, 0.1); }
            .pixel-crown {
                display: inline-grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 1px;
                width: 1.5em;
                height: 1.2em;
                image-rendering: pixelated;
                margin-left: 5px;
                vertical-align: middle;
            }
        `;
        document.head.appendChild(lbStyle);

        document.body.appendChild(lbContentContainer);

        const renderEmbeddedLB = (scores: any[]) => {
            let content = `
                <div style="font-family: monospace;">
                    <table class="lb-table">
                        <thead>
                            <tr>
                                <th style="text-align: left; width: 30px;">#</th>
                                <th style="text-align: left;">PLAYER</th>
                                <th>WAVE</th>
                                <th>ENEMIES</th>
                                <th>TIME</th>
                                <th style="text-align: right;">SCORE</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            if (!scores || scores.length === 0) {
                content += '<tr><td colspan="6" style="text-align:center; padding: 40px; color: #4ade80;">Searching scores...</td></tr>';
            } else {
                scores.forEach((score, index) => {
                    const formatTime = (s: number) => {
                        const mins = Math.floor(s / 60);
                        const secs = s % 60;
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                    };

                    const getCrownHtml = (rank: number) => {
                        if (rank > 3) return '';
                        const colors = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };
                        const color = colors[rank as keyof typeof colors];
                        const pattern = [
                            1, 0, 1, 0, 1,
                            1, 1, 1, 1, 1,
                            1, 1, 1, 1, 1,
                            1, 1, 1, 1, 1
                        ];
                        let crownDivs = '';
                        pattern.forEach(p => {
                            crownDivs += `<div style="background-color: ${p ? color : 'transparent'};"></div>`;
                        });
                        return `<div class="pixel-crown">${crownDivs}</div>`;
                    };
                    
                    content += `
                        <tr class="lb-row">
                            <td style="color: #94a3b8; text-align: left;">${index + 1}</td>
                            <td style="color: #fff; font-weight: bold; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px;" title="${score.playerName}">
                                ${score.playerName}${getCrownHtml(index + 1)}
                            </td>
                            <td style="color: #60a5fa;">${score.wave || 1}</td>
                            <td style="color: #f87171;">${score.enemiesDefeated || 0}</td>
                            <td style="color: #fbbf24;">${formatTime(score.playTime || 0)}</td>
                            <td style="text-align: right; color: #4ade80; font-weight: bold; font-size: 1.1em;">${Math.floor(score.score).toLocaleString()}</td>
                        </tr>
                    `;
                });
            }
            content += '</tbody></table></div>';
            lbContentContainer.innerHTML = content;
        };

        lbContentContainer.innerHTML = '<p style="text-align: center; color: #4ade80; padding-top: 20px;">Loading scores...</p>';
        
        const updateLB = () => {
            import('./leaderboard').then(({ fetchOnChainLeaderboard }) => {
                fetchOnChainLeaderboard().then(scores => {
                    if (scores && scores.length > 0) {
                        renderEmbeddedLB(scores);
                    } else {
                        // Se falhar ou estiver vazio, tentar novamente em breve ou mostrar erro
                        console.warn("Leaderboard retornado vazio, tentando carregar novamente...");
                    }
                });
            });
        };

        updateLB();
        // Refresh every 30 seconds
        const lbRefreshInterval = setInterval(updateLB, 30000);

        // Cleanup div and style when scene is destroyed or stopped
        this.events.once('shutdown', () => {
            clearInterval(lbRefreshInterval);
            window.removeEventListener('resize', updateLBPosition);
            lbContentContainer.remove();
            lbStyle.remove();
        });
        this.events.once('destroy', () => {
            clearInterval(lbRefreshInterval);
            window.removeEventListener('resize', updateLBPosition);
            lbContentContainer.remove();
            lbStyle.remove();
        });

        // Contracts List
        const contractsX = width - 40;
        const contractsY = height - 120; // Move back to bottom right area
        const contractFontSize = '14px';

        // Wallet Display Logic
        this.networkInfoText = this.add.text(width / 2, height / 2 - 70, isWalletConnected ? 'Arc Testnet' : '', {
            fontSize: '18px', color: '#4ade80', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.usdcBalanceText = this.add.text(contractsX, contractsY - 10, '', {
            fontSize: '22px', color: '#4ade80', fontFamily: 'monospace'
        }).setOrigin(1, 1).setVisible(isWalletConnected);

        if (isWalletConnected) this.updateUSDCBalance();

        // Footer and Social
        const footerY = height - 60;
        this.add.text(width / 2, footerY - 20, '2026 PolyDoom Arc — Built on Arc Network. All rights reserved.', {
            fontSize: '14px', color: '#ffffff'
        }).setOrigin(0.5);

        const socials = [
            { icon: 'x_icon', url: 'https://x.com/madnessinvestor' },
            { icon: 'github_icon', url: 'https://github.com/madnessinvestor' },
            { icon: 'youtube_icon', url: 'https://www.youtube.com/@madnessinvestor' },
            { icon: 'farcaster_icon', url: 'https://farcaster.xyz/madnessinvestor' },
            { icon: 'instagram_icon', url: 'https://www.instagram.com/madnessinvestor' },
            { icon: 'telegram_icon', url: 'https://web.telegram.org/k/#@madnessinvestor' },
            { icon: 'discord_icon', url: 'https://discord.com/users/madnessinvestor' }
        ];

        socials.forEach((s, i) => {
            const spacing = 50;
            const totalWidth = (socials.length - 1) * spacing;
            const sx = (width / 2 - totalWidth / 2) + (i * spacing);
            const sbtn = this.add.circle(sx, footerY + 20, 18, 0x1e293b).setInteractive({ useHandCursor: true });
            this.add.image(sx, footerY + 20, s.icon).setDisplaySize(24, 24);
            sbtn.on('pointerdown', () => window.open(s.url, '_blank'));
        });

        this.add.text(contractsX, contractsY, 'CONTRACTS', {
            fontSize: '18px',
            color: '#fbbf24',
            fontStyle: 'bold',
            fontFamily: 'monospace'
        }).setOrigin(1, 0);

        const contracts = [
            { addr: '0x6101d4D79C6573c570eAA0eeabff13e663c17c08', label: 'Upgrades' },
            { addr: '0x9b673bDBA9ed06989b1846d4C63468BCE86cf006', label: 'Leaderboard' },
            { addr: '0x6b09296bb55f08FBD268C44a89B5B9a23db2af6a', label: 'Items' }
        ];

        contracts.forEach((c, idx) => {
            const yPos = contractsY + 30 + (idx * 25);
            const text = this.add.text(contractsX, yPos, `${c.label}: ${c.addr.substring(0, 6)}...${c.addr.substring(c.addr.length - 4)}`, {
                fontSize: contractFontSize,
                color: '#4ade80',
                fontFamily: 'monospace'
            }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

            text.on('pointerdown', () => window.open(`https://testnet.arcscan.app/address/${c.addr}`, '_blank'));
            text.on('pointerover', () => text.setColor('#ffffff'));
            text.on('pointerout', () => text.setColor('#4ade80'));
        });

        // Set up wallet event listeners
        if ((window as any).ethereum) {
            (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
                if (accounts.length === 0) {
                    (window as any).walletAddress = null;
                    this.updateWalletButtonText('CONNECT WALLET');
                } else {
                    (window as any).walletAddress = accounts[0];
                    this.updateWalletButtonText(`CONNECTED: ${accounts[0].substring(0, 6)}...`);
                }
                this.updateUSDCBalance();
            });
        }
    }

    public setMasterVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.masterVolume = Math.max(0, Math.min(1, val / 100));
        // Apply to all sounds
        Object.values(this.sfx).forEach(sound => {
            if (sound && (sound as any).setVolume) {
                const sfxVol = Number(this.sfxVolume) || 0;
                (sound as any).setVolume(this.masterVolume * sfxVol);
            }
        });
        const musicVol = Number(this.musicVolume) || 0;
        if (this.currentMusic && (this.currentMusic as any).setVolume) {
            (this.currentMusic as any).setVolume(0.7 * this.masterVolume * musicVol);
        }
        if (this.openingMusic && (this.openingMusic as any).setVolume) {
            (this.openingMusic as any).setVolume(0.7 * this.masterVolume * musicVol);
        }
    }

    public setMusicVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.musicVolume = Math.max(0, Math.min(1, val / 100));
        if (this.currentMusic && (this.currentMusic as any).setVolume) {
            (this.currentMusic as any).setVolume(0.7 * this.masterVolume * this.musicVolume);
        }
        if (this.openingMusic && (this.openingMusic as any).setVolume) {
            (this.openingMusic as any).setVolume(0.7 * this.masterVolume * this.musicVolume);
        }
    }

    public setSfxVolume(value: number) {
        const val = Number(value);
        if (isNaN(val)) return;
        this.sfxVolume = val / 100;
        
        const targetVol = this.masterVolume * this.sfxVolume;
        
        // 1. Update the pre-loaded SFX map
        Object.values(this.sfx).forEach(sound => {
            if (sound) {
                try {
                    // Phaser 3 WebAudio sounds have both volume property and setVolume method
                    if (typeof (sound as any).setVolume === 'function') {
                        (sound as any).setVolume(targetVol);
                    }
                    (sound as any).volume = targetVol;
                } catch(e) {}
            }
        });
        
        // 2. Update all sound instances currently managed by Phaser
        if (this.sound && this.sound.getAll) {
            this.sound.getAll('').forEach(sound => {
                const soundKey = (sound as any).key;
                if (soundKey !== 'opening_music' && !soundKey.startsWith('music_')) {
                    try {
                        if (typeof (sound as any).setVolume === 'function') {
                            (sound as any).setVolume(targetVol);
                        }
                        (sound as any).volume = targetVol;
                    } catch(e) {}
                }
            });
        }
        
        // 3. For any future sounds, we ensure the volume is applied immediately upon play
        // We do this by overriding the play method of our SFX objects
        Object.keys(this.sfx).forEach(key => {
            const originalSound = this.sfx[key];
            if (originalSound && !(originalSound as any)._volumeOverridden) {
                const originalPlay = originalSound.play.bind(originalSound);
                originalSound.play = (markerOrConfig?: string | Phaser.Types.Sound.SoundConfig, config?: Phaser.Types.Sound.SoundConfig) => {
                    const currentTargetVol = this.masterVolume * this.sfxVolume;
                    if (typeof (originalSound as any).setVolume === 'function') {
                        (originalSound as any).setVolume(currentTargetVol);
                    }
                    (originalSound as any).volume = currentTargetVol;
                    return originalPlay(markerOrConfig, config);
                };
                (originalSound as any)._volumeOverridden = true;
            }
        });
    }

    private openControlsModal() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dark overlay background
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setDepth(200);

        // Modal background
        const modalBg = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8, 0x0f172a, 1).setScrollFactor(0).setDepth(201);
        
        // Border
        const border = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8);
        border.setStrokeStyle(3, 0xa855f7).setFillStyle(0x0f172a, 0).setScrollFactor(0).setDepth(202);

        // Title
        const title = this.add.text(width / 2, height * 0.18, 'GAME CONTROLS', {
            fontSize: '32px',
            fontFamily: '"PixelPurl", monospace',
            color: '#fbbf24',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(203);

        // Create HTML content for controls
        const containerWidth = width * 0.7;
        const containerHeight = height * 0.6;

        const controlsContainer = document.createElement('div');
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.left = '50%';
        controlsContainer.style.top = '50%';
        controlsContainer.style.transform = 'translate(-50%, -50%)';
        controlsContainer.style.width = Math.floor(containerWidth) + 'px';
        controlsContainer.style.height = Math.floor(containerHeight) + 'px';
        controlsContainer.style.backgroundColor = 'transparent';
        controlsContainer.style.zIndex = '204';
        controlsContainer.style.color = '#fff';
        controlsContainer.style.fontFamily = 'monospace';
        controlsContainer.style.overflow = 'auto';
        controlsContainer.style.padding = '10px';

        controlsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
                <div>
                    <h3 style="color: #fbbf24; border-bottom: 2px solid #fbbf24; padding-bottom: 5px; margin-bottom: 15px;">BASIC CONTROLS</h3>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>MOVEMENT</span>
                        <span style="color: #fbbf24;">ARROW KEYS</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>JUMP</span>
                        <span style="color: #fbbf24;">UP ARROW</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>DASH / EVADE</span>
                        <span style="color: #fbbf24;">DOUBLE TAP ARROWS</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>PUNCH (RPG STYLE)</span>
                        <span style="color: #fbbf24;">Z KEY (HOLD)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>MAGIC KIARC</span>
                        <span style="color: #fbbf24;">C KEY (PRESS)</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>PAUSE / MENU</span>
                        <span style="color: #fbbf24;">ESC</span>
                    </div>
                </div>
                <div>
                    <h3 style="color: #fbbf24; border-bottom: 2px solid #fbbf24; padding-bottom: 5px; margin-bottom: 15px;">SPECIAL ABILITIES</h3>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>CHARGE ARCKI</span>
                        <div style="text-align: right;">
                            <span style="color: #fbbf24;">X KEY (HOLD)</span><br/>
                            <small style="color: #60a5fa;">KI: +REC | CD: 0s</small>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>ARCKAMEHAMEHA</span>
                        <div style="text-align: right;">
                            <span style="color: #fbbf24;">V KEY (HOLD/RELEASE)</span><br/>
                            <small style="color: #60a5fa;">KI: 100 | CD: 5s</small>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>ARCGENKIDAMA</span>
                        <div style="text-align: right;">
                            <span style="color: #fbbf24;">B KEY (HOLD/RELEASE)</span><br/>
                            <small style="color: #60a5fa;">KI: 50 | CD: 30s</small>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>EXPLOSION KIARC</span>
                        <div style="text-align: right;">
                            <span style="color: #fbbf24;">F KEY (PRESS)</span><br/>
                            <small style="color: #60a5fa;">KI: 100 | CD: 5s</small>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>MAGIC KIARC</span>
                        <div style="text-align: right;">
                            <span style="color: #fbbf24;">C KEY (PRESS)</span><br/>
                            <small style="color: #60a5fa;">KI: 5 | CD: 0s</small>
                        </div>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>HP POTION</span>
                        <span style="color: #fbbf24;">Q KEY</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>KI POTION</span>
                        <span style="color: #fbbf24;">W KEY</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>INVINCIBILITY</span>
                        <span style="color: #fbbf24;">E KEY</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #1e293b; padding: 5px 0;">
                        <span>2X SCORE</span>
                        <span style="color: #fbbf24;">R KEY</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(controlsContainer);

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height * 0.85, 150, 50, 0xef4444).setScrollFactor(0).setDepth(205);
        const closeText = this.add.text(width / 2, height * 0.85, 'CLOSE', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(206);

        closeBtn.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.sfx['menu_close']?.play();
            controlsContainer.remove();
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            title.destroy();
            closeBtn.destroy();
            closeText.destroy();
        }).on('pointerover', () => closeBtn.setFillStyle(0xdc2626))
          .on('pointerout', () => closeBtn.setFillStyle(0xef4444));
    }

    private openLeaderboardModal() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Overlay background
        const overlay = this.add.zone(width / 2, height / 2, width, height).setScrollFactor(0);

        // Modal background
        const modalBg = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8, 0x000000, 0.9).setScrollFactor(0);
        
        // Border
        const border = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8);
        border.setStrokeStyle(3, 0xfbbf24).setFillStyle(0x000000, 0).setScrollFactor(0);

        // Title
        const leaderboardTitle = this.add.text(width / 2, height * 0.15, 'LEADERBOARD', {
            fontSize: '32px',
            fontFamily: '"PixelPurl", monospace',
            color: '#fbbf24',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);

        // Create HTML div for leaderboard content
        const containerWidth = width * 0.7;
        const containerHeight = height * 0.5;
        const containerX = width / 2 - containerWidth / 2;
        const containerY = height / 2 - containerHeight / 2;

        const leaderboardContainer = document.createElement('div');
        leaderboardContainer.style.position = 'absolute';
        leaderboardContainer.style.left = '50%';
        leaderboardContainer.style.top = '50%';
        leaderboardContainer.style.transform = 'translate(-50%, -50%)';
        leaderboardContainer.style.width = Math.floor(containerWidth) + 'px';
        leaderboardContainer.style.height = Math.floor(containerHeight) + 'px';
        leaderboardContainer.style.backgroundColor = '#1a1a2e';
        leaderboardContainer.style.border = '2px solid #fbbf24';
        leaderboardContainer.style.overflow = 'auto';
        leaderboardContainer.style.zIndex = '101';
        leaderboardContainer.style.color = '#fff';
        leaderboardContainer.style.fontFamily = 'Arial, sans-serif';
        leaderboardContainer.style.padding = '20px';

        // Fetch and display leaderboard data
        const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";
        
        const renderLeaderboard = (scores: any[]) => {
            let content = '<div style="text-align: center;">';
            if (scores.length === 0) {
                content += '<p>Nenhum score registrado ainda</p>';
            } else {
                scores.forEach((score, index) => {
                    content += `
                        <div style="border-bottom: 1px solid #4ade80; padding: 10px 0; text-align: left;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>#${index + 1} ${score.playerName}</strong>
                                    ${score.enemiesDefeated > 0 ? `<div style="font-size: 12px; color: #aaa;">${score.enemiesDefeated} inimigos derrotados</div>` : ''}
                                </div>
                                <div style="color: #fbbf24; font-weight: bold; font-size: 18px;">${score.score}</div>
                            </div>
                        </div>
                    `;
                });
            }
            content += '</div>';
            leaderboardContainer.innerHTML = content;
        };

        leaderboardContainer.innerHTML = '<p style="text-align: center; color: #fbbf24;">Carregando dados on-chain...</p>';
        
        import('./leaderboard').then(({ fetchOnChainLeaderboard }) => {
            fetchOnChainLeaderboard().then(onChainScores => {
                if (onChainScores) {
                    renderLeaderboard(onChainScores);
                } else {
                    leaderboardContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Erro ao carregar leaderboard on-chain. Verifique sua conexão de carteira.</p>';
                }
            }).catch(err => {
                console.error('Erro crítico ao buscar leaderboard on-chain:', err);
                leaderboardContainer.innerHTML = '<p style="text-align: center; color: #ff6b6b;">Erro ao buscar dados on-chain: ' + err.message + '</p>';
            });
        });

        document.body.appendChild(leaderboardContainer);

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height * 0.85, 150, 50, 0xff6b6b).setScrollFactor(0).setDepth(101);
        const closeText = this.add.text(width / 2, height * 0.85, 'CLOSE', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(102);

        const closeModal = () => {
            leaderboardContainer.remove();
            leaderboardTitle.destroy();
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            closeBtn.destroy();
            closeText.destroy();
        };

        closeBtn.setInteractive().on('pointerdown', () => {
            closeModal();
        }).on('pointerover', () => {
            closeBtn.setFillStyle(0xff5252);
        }).on('pointerout', () => {
            closeBtn.setFillStyle(0xff6b6b);
        });
    }

    private openSettingsModal() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Load saved settings
        const masterVolume = parseInt(localStorage.getItem('masterVolume') || '100');
        const musicVolume = parseInt(localStorage.getItem('musicVolume') || '100');
        const sfxVolume = parseInt(localStorage.getItem('sfxVolume') || '100');

        // Dark overlay background
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setDepth(100);

        // Modal background
        const modalBg = this.add.rectangle(width / 2, height / 2, width * 0.6, height * 0.75, 0x0f172a, 1).setScrollFactor(0).setDepth(101);
        
        // Border
        const border = this.add.rectangle(width / 2, height / 2, width * 0.6, height * 0.75);
        border.setStrokeStyle(3, 0x8b5cf6).setFillStyle(0x0f172a, 0).setScrollFactor(0).setDepth(102);

        // Title
        const settingsTitle = this.add.text(width / 2, height * 0.18, 'SETTINGS', {
            fontSize: '32px',
            fontFamily: '"PixelPurl", monospace',
            color: '#a78bfa',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);

        // Create HTML settings container with better styling
        const containerWidth = width * 0.5;
        const containerHeight = height * 0.55;

        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'settings-container';
        settingsContainer.style.position = 'absolute';
        settingsContainer.style.left = '50%';
        settingsContainer.style.top = '50%';
        settingsContainer.style.transform = 'translate(-50%, -50%)';
        settingsContainer.style.width = Math.floor(containerWidth) + 'px';
        settingsContainer.style.height = Math.floor(containerHeight) + 'px';
        settingsContainer.style.backgroundColor = 'transparent';
        settingsContainer.style.overflow = 'visible';
        settingsContainer.style.zIndex = '104';
        settingsContainer.style.pointerEvents = 'auto';

        // Add CSS for range inputs
        const style = document.createElement('style');
        style.textContent = `
            #settings-container input[type="range"] {
                width: 100%;
                height: 8px;
                -webkit-appearance: none;
                appearance: none;
                background: #334155;
                border-radius: 5px;
                outline: none;
                cursor: pointer;
            }
            
            #settings-container input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #a78bfa;
                cursor: pointer;
                transition: background 0.2s;
            }
            
            #settings-container input[type="range"]::-webkit-slider-thumb:hover {
                background: #c4b5fd;
            }
            
            #settings-container input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #a78bfa;
                cursor: pointer;
                border: none;
                transition: background 0.2s;
            }
            
            #settings-container input[type="range"]::-moz-range-thumb:hover {
                background: #c4b5fd;
            }
        `;
        document.head.appendChild(style);

        settingsContainer.innerHTML = `
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="color: #e2e8f0; font-weight: bold; font-size: 14px;">Master Volume</label>
                    <span id="master-value" style="color: #a78bfa; font-weight: bold; font-size: 16px;">${masterVolume}%</span>
                </div>
                <input type="range" id="master-slider" min="0" max="100" value="${masterVolume}" style="pointer-events: auto;">
            </div>
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="color: #e2e8f0; font-weight: bold; font-size: 14px;">Background Music</label>
                    <span id="music-value" style="color: #a78bfa; font-weight: bold; font-size: 16px;">${musicVolume}%</span>
                </div>
                <input type="range" id="music-slider" min="0" max="100" value="${musicVolume}" style="pointer-events: auto;">
            </div>
            <div style="margin-bottom: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <label style="color: #e2e8f0; font-weight: bold; font-size: 14px;">Effects Volume</label>
                    <span id="sfx-value" style="color: #a78bfa; font-weight: bold; font-size: 16px;">${sfxVolume}%</span>
                </div>
                <input type="range" id="sfx-slider" min="0" max="100" value="${sfxVolume}" style="pointer-events: auto;">
            </div>
        `;

        document.body.appendChild(settingsContainer);

        // Add event listeners with proper scoping - save reference to scene context
        const scene = this;
        const masterSlider = document.getElementById('master-slider') as HTMLInputElement;
        const musicSlider = document.getElementById('music-slider') as HTMLInputElement;
        const sfxSlider = document.getElementById('sfx-slider') as HTMLInputElement;

        const updateMaster = () => {
            const value = parseInt(masterSlider.value);
            localStorage.setItem('masterVolume', value.toString());
            document.getElementById('master-value')!.textContent = value + '%';
            scene.setMasterVolume(value);
        };

        const updateMusic = () => {
            const value = parseInt(musicSlider.value);
            localStorage.setItem('musicVolume', value.toString());
            document.getElementById('music-value')!.textContent = value + '%';
            scene.setMusicVolume(value);
        };

        const updateSfx = () => {
            const value = parseInt(sfxSlider.value);
            localStorage.setItem('sfxVolume', value.toString());
            document.getElementById('sfx-value')!.textContent = value + '%';
            scene.setSfxVolume(value);
        };

        if (masterSlider) {
            masterSlider.addEventListener('input', updateMaster);
            masterSlider.addEventListener('change', updateMaster);
        }

        if (musicSlider) {
            musicSlider.addEventListener('input', updateMusic);
            musicSlider.addEventListener('change', updateMusic);
        }

        if (sfxSlider) {
            sfxSlider.addEventListener('input', updateSfx);
            sfxSlider.addEventListener('change', updateSfx);
        }

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height * 0.82, 150, 50, 0xff0000).setScrollFactor(0).setDepth(103);
        const closeText = this.add.text(width / 2, height * 0.82, 'CLOSE', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(104);

        const closeModal = () => {
            if (settingsContainer && settingsContainer.parentElement) {
                settingsContainer.remove();
            }
            if (style && style.parentElement) {
                style.remove();
            }
            settingsTitle.destroy();
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            closeBtn.destroy();
            closeText.destroy();
        };

        closeBtn.setInteractive().on('pointerdown', () => {
            closeModal();
        }).on('pointerover', () => {
            closeBtn.setFillStyle(0xcc0000);
        }).on('pointerout', () => {
            closeBtn.setFillStyle(0xff0000);
        });
    }

    private openHistoryModal() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Overlay background
        const overlay = this.add.zone(width / 2, height / 2, width, height).setScrollFactor(0);

        // Modal background
        const modalBg = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8, 0x000000, 0.9).setScrollFactor(0);
        
        // Border
        const border = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.8);
        border.setStrokeStyle(3, 0x60a5fa).setFillStyle(0x000000, 0).setScrollFactor(0);

        // Title
        const historyTitle = this.add.text(width / 2, height * 0.15, 'GAME HISTORY', {
            fontSize: '32px',
            fontFamily: '"PixelPurl", monospace',
            color: '#60a5fa',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(101);

        // Create HTML video element
        const videoWidth = width * 0.7 * 0.75 * 1.1;
        const videoHeight = height * 0.5 * 0.75 * 1.1;
        const videoX = width / 2 - videoWidth / 2;
        const videoY = height / 2 - videoHeight / 2;

        const videoElement = document.createElement('video');
        videoElement.src = '/gamehistory_1767067604123.mp4';
        videoElement.width = Math.floor(videoWidth);
        videoElement.height = Math.floor(videoHeight);
        videoElement.controls = true;
        videoElement.autoplay = true;
        videoElement.style.position = 'absolute';
        videoElement.style.left = '50%';
        videoElement.style.top = '50%';
        videoElement.style.transform = 'translate(-50%, -50%)';
        videoElement.style.zIndex = '101';
        videoElement.style.backgroundColor = '#1a1a2e';
        videoElement.style.border = '2px solid #60a5fa';

        document.body.appendChild(videoElement);

        // Close button
        const closeBtn = this.add.rectangle(width / 2, height * 0.85, 150, 50, 0xff6b6b).setScrollFactor(0).setDepth(101);
        const closeText = this.add.text(width / 2, height * 0.85, 'CLOSE', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(102);

        const closeModal = () => {
            videoElement.pause();
            videoElement.remove();
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            closeBtn.destroy();
            closeText.destroy();
            historyTitle.destroy();
        };

        closeBtn.setInteractive().on('pointerdown', () => {
            closeModal();
        }).on('pointerover', () => {
            closeBtn.setFillStyle(0xff5252);
        }).on('pointerout', () => {
            closeBtn.setFillStyle(0xff6b6b);
        });
    }
}

class DeathScene extends Phaser.Scene {
    private finalScore: number = 0;
    private finalLevel: number = 1;
    private finalWave: number = 1;
    private enemiesDefeated: number = 0;
    private playTime: number = 0;
    private playerName: string = "";

    constructor() {
        super('DeathScene');
    }

    init(data: any) {
        this.finalScore = data.score || 0;
        this.finalLevel = data.level || 1;
        this.finalWave = data.wave || 1;
        this.enemiesDefeated = data.enemiesDefeated || 0;
        this.playTime = data.playTime || 0;
        this.playerName = data.playerName || ((window as any).walletAddress 
            ? "Arc Player " + (window as any).walletAddress.substring(0, 6)
            : "Arc Player");
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a20).setOrigin(0).setScrollFactor(0);

        // Game Over Title
        this.add.text(width / 2, height / 5, 'GAME OVER', {
            fontSize: '84px',
            fontFamily: 'Arial Black',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5, 0.5);

        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };

        // Stats Container
        const statsBox = this.add.rectangle(width / 2, height / 2, 600, 400, 0x1e293b, 0.8);
        statsBox.setStrokeStyle(4, 0x3b82f6);

        const statsText = this.add.text(width / 2, height / 2, 
            `PLAYER: ${this.playerName}\n\n` +
            `SCORE: ${Math.floor(this.finalScore)}\n` +
            `WAVE: ${this.finalWave}\n` +
            `ENEMIES: ${this.enemiesDefeated}\n` +
            `TIME: ${formatTime(this.playTime)}`, {
            fontSize: '32px',
            fontFamily: '"PixelPurl", monospace',
            color: '#4ade80',
            align: 'center',
            lineSpacing: 10
        }).setOrigin(0.5);

        // Register Score Button
        const registerBtn = this.add.rectangle(width / 2, height / 2 + 250, 300, 70, 0x4ade80);
        const registerText = this.add.text(width / 2, height / 2 + 250, 'REGISTER SCORE', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#000000'
        }).setOrigin(0.5);

        // Validar se o score é válido antes de permitir registro
        const isScoreValid = this.finalScore && this.finalScore > 0;
        
        if (isScoreValid) {
            registerBtn.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.openNameModal())
                .on('pointerover', () => registerBtn.setFillStyle(0x22c55e))
                .on('pointerout', () => registerBtn.setFillStyle(0x4ade80));
        } else {
            registerBtn.setFillStyle(0x6b7280);
            registerText.setColor(0x9ca3af);
            registerText.setText(`SCORE: ${Math.floor(this.finalScore)}`);
        }

        // Main Menu Button
        const menuBtn = this.add.rectangle(width / 2, height / 2 + 340, 300, 70, 0x3b82f6);
        const menuText = this.add.text(width / 2, height / 2 + 340, 'MAIN MENU', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);

        menuBtn.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => window.location.reload())
            .on('pointerover', () => menuBtn.setFillStyle(0x2563eb))
            .on('pointerout', () => menuBtn.setFillStyle(0x3b82f6));
    }

    private openNameModal() {
        // 🔴 VALIDAÇÃO CRÍTICA: Bloquear se score for inválido
        if (!this.finalScore || this.finalScore <= 0) {
            alert(`❌ Erro: Score inválido (${this.finalScore}). Não é possível registrar.\nRequer reiniciar o jogo.`);
            return;
        }
        
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Dark overlay background (Matching Settings/Upgrades)
        const overlay = this.add.rectangle(0, 0, width * 2, height * 2, 0x000000, 0.7).setOrigin(0).setScrollFactor(0).setDepth(100);

        // Modal background (Matching Settings/Upgrades: 0x0f172a)
        const modalBg = this.add.rectangle(width / 2, height / 2, 400, 300, 0x0f172a, 1).setScrollFactor(0).setDepth(101);
        
        // Border
        const border = this.add.rectangle(width / 2, height / 2, 400, 300);
        border.setStrokeStyle(3, 0x4ade80).setFillStyle(0x0f172a, 0).setScrollFactor(0).setDepth(102);

        // Title
        const title = this.add.text(width / 2, height / 2 - 110, 'REGISTER SCORE', {
            fontSize: '28px',
            fontFamily: '"PixelPurl", monospace',
            color: '#4ade80',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);

        // HTML Input container (Only for the name input)
        const inputContainer = document.createElement('div');
        inputContainer.id = 'score-register-container';
        inputContainer.style.position = 'absolute';
        inputContainer.style.left = '50%';
        inputContainer.style.top = '46%';
        inputContainer.style.transform = 'translate(-50%, -50%)';
        inputContainer.style.width = '300px';
        inputContainer.style.zIndex = '104';
        inputContainer.style.pointerEvents = 'auto';

        const style = document.createElement('style');
        style.textContent = `
            #score-register-container input {
                width: 100%;
                padding: 12px;
                font-size: 18px;
                border: 2px solid #4ade80;
                border-radius: 4px;
                background: #1a1a2e;
                color: #fff;
                box-sizing: border-box;
                text-align: center;
            }
            #score-register-container input:focus {
                outline: none;
                border-color: #22c55e;
                box-shadow: 0 0 8px rgba(74, 222, 128, 0.3);
            }
        `;
        document.head.appendChild(style);

        inputContainer.innerHTML = `<input type="text" id="player-name-input" placeholder="Enter your name" maxlength="30">`;
        document.body.appendChild(inputContainer);

        const nameInput = document.getElementById('player-name-input') as HTMLInputElement;

        // Force capture of keyboard events to bypass Phaser's event prevention
        const stopPropagation = (e: KeyboardEvent) => {
            e.stopPropagation();
        };
        nameInput.addEventListener('keydown', stopPropagation, true); // Use capture phase
        nameInput.addEventListener('keyup', stopPropagation, true);
        nameInput.addEventListener('keypress', stopPropagation, true);

        // Explicitly handle keys that Phaser might be blocking
        nameInput.addEventListener('keydown', (e) => {
            if (['s', 'd', 'f', 'x', 'c', 'v', 'b'].includes(e.key.toLowerCase())) {
                e.stopPropagation();
            }
        }, true);

        setTimeout(() => nameInput?.focus(), 100);

        // Phaser CONFIRM Button
        const confirmBtn = this.add.rectangle(width / 2, height / 2 + 40, 200, 50, 0x4ade80).setScrollFactor(0).setDepth(103);
        const confirmText = this.add.text(width / 2, height / 2 + 40, 'CONFIRM', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(104);

        // Phaser CANCEL Button
        const cancelBtn = this.add.rectangle(width / 2, height / 2 + 105, 200, 50, 0xff6b6b).setScrollFactor(0).setDepth(103);
        const cancelText = this.add.text(width / 2, height / 2 + 105, 'CANCEL', {
            fontSize: '20px',
            fontFamily: '"PixelPurl", monospace',
            color: '#000000',
            fontStyle: 'bold'
        }).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(104);

        const closeModal = () => {
            // Re-enable Phaser keyboard input
            if (this.input.keyboard) {
                this.input.keyboard.enabled = true;
            }

            if (inputContainer && inputContainer.parentElement) {
                inputContainer.remove();
            }
            if (style && style.parentElement) {
                style.remove();
            }
            overlay.destroy();
            modalBg.destroy();
            border.destroy();
            title.destroy();
            confirmBtn.destroy();
            confirmText.destroy();
            cancelBtn.destroy();
            cancelText.destroy();
        };

        // Disable Phaser keyboard input while typing in the HTML field
        if (this.input.keyboard) {
            this.input.keyboard.enabled = false;
        }

        const submitWithName = async () => {
            if (confirmBtn.getData('processing')) return;

            const playerName = nameInput.value.trim();
            if (playerName.length < 2) {
                alert('❌ Name must be at least 2 characters long!');
                nameInput.focus();
                return;
            }
            
            confirmBtn.setData('processing', true);
            confirmBtn.setFillStyle(0x666666);
            confirmText.setText('SENDING...');
            
            try {
                await this.submitScore(playerName);
            } catch (err) {
                console.error('Erro no submit:', err);
                confirmBtn.setData('processing', false);
                confirmBtn.setFillStyle(0x4ade80);
                confirmText.setText('CONFIRM');
            }
        };

        confirmBtn.setInteractive().on('pointerdown', submitWithName).on('pointerover', () => confirmBtn.setFillStyle(0x22c55e)).on('pointerout', () => {
            if (!confirmBtn.getData('processing')) confirmBtn.setFillStyle(0x4ade80);
        });
        
        cancelBtn.setInteractive().on('pointerdown', () => closeModal()).on('pointerover', () => cancelBtn.setFillStyle(0xff5252)).on('pointerout', () => cancelBtn.setFillStyle(0xff6b6b));

        nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') submitWithName();
        });
    }

    private async submitScore(playerName: string) {
        try {
            // ===== VALIDAÇÕES CRÍTICAS =====
            console.log('');
            console.log('═══════════════════════════════════════════════════════');
            console.log('📋 INICIANDO SUBMISSÃO DE SCORE');
            console.log('═══════════════════════════════════════════════════════');
            console.log('🎮 Jogador:', playerName);
            console.log('📊 Score Final (this.finalScore):', this.finalScore);
            console.log('📈 Wave Final (this.currentWave):', this.currentWave);
            console.log('⏰ Tempo Final (this.time.now - this.gameStartTime):', Math.floor((this.time.now - this.gameStartTime) / 1000));
            console.log('⚔️ Inimigos Mortos:', this.enemiesDefeated);
            
            // 🛑 CRÍTICO: Validação OBRIGATÓRIA - Bloquear se score for 0
            if (!this.finalScore || this.finalScore <= 0 || isNaN(this.finalScore)) {
                console.error('');
                console.error('❌ ❌ ❌ BLOQUEADO: SCORE INVÁLIDO ❌ ❌ ❌');
                console.error('Detalhes do erro:');
                console.error('  - Score:', this.finalScore);
                console.error('  - Tipo:', typeof this.finalScore);
                console.error('  - É um número?', typeof this.finalScore === 'number');
                console.error('  - É maior que 0?', this.finalScore > 0);
                console.error('═══════════════════════════════════════════════════════');
                alert('❌ ERRO CRÍTICO: Score inválido (zero, nulo ou NaN).\nNão é possível registrar na blockchain.\nReque reiniciar o jogo.');
                return; // 🛑 PARAR AQUI - Não enviar transação
            }
            
            console.log('✅ ✅ Score VALIDADO COM SUCESSO! Valor:', this.finalScore);
            console.log('🔓 Prosseguindo com registro...');
            
            // Se o usuário estiver conectado na carteira, registrar no contrato
            if ((window as any).ethereum) {
                try {
                    console.log('=== INICIANDO REGISTRO ON-CHAIN ===');
                    
                    const provider = new ethers.BrowserProvider((window as any).ethereum);
                    const signer = await provider.getSigner();
                    const userAddress = await signer.getAddress();
                    
                    console.log('Wallet conectada:', userAddress);
                    
                    // ABI simplificado - suportando addScore (visto antes) e submitScore (visto agora)
                    const abi = [
                        "function addScore(string name, uint256 score) public",
                        "function submitScore(string name, uint256 score) public"
                    ];
                    
                    const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";
                    const contract = new ethers.Contract(contractAddress, abi, signer);

                    // Tentar chamar a função correta
                    console.log('🔧 Enviando transação ao contrato...');
                    let tx;
                    try {
                        console.log('Tentando addScore...');
                        tx = await contract.addScore(playerName, BigInt(Math.floor(this.finalScore)));
                    } catch (e) {
                        console.log('addScore falhou ou não existe, tentando submitScore...');
                        tx = await contract.submitScore(playerName, BigInt(Math.floor(this.finalScore)));
                    }
                    
                    console.log('✓ Transação enviada com hash:', tx.hash);
                    
                    // Armazenar para histórico
                    (window as any).lastScoreTxHash = tx.hash;
                    (window as any).lastScoreName = playerName;
                    (window as any).lastScoreValue = this.finalScore;
                    
                    // Aguardar confirmação
                    console.log('⏳ Aguardando confirmação da transação...');
                    const receipt = await tx.wait(1); 
                    
                    if (receipt && receipt.status === 1) {
                        console.log('✓ Transação confirmada!');
                        alert('Score registered on-chain successfully!');
                    } else {
                        console.error('❌ Transação REVERTIDA pelo contrato');
                        alert('Transaction failed (reverted).');
                    }
                } catch (contractError: any) {
                    console.error('❌ ERRO no processo on-chain:', contractError);
                    if (contractError.code === 'ACTION_REJECTED' || contractError.code === 4001) {
                        alert('Transaction rejected by user.');
                    } else {
                        alert('Error submitting score: ' + (contractError.message || 'Unknown error'));
                    }
                }
            } else {
                console.warn('⚠️ Wallet não conectada ou provider ausente.');
                alert('No wallet connected. Score will be saved locally only.');
            }

            // Registrar na API local SEMPRE
            console.log('📤 Registrando score na API local...');
            try {
                const savePayload = {
                    playerName: playerName,
                    score: Math.floor(this.finalScore || this.score),
                    wave: this.finalWave || this.currentWave || 1,
                    enemiesDefeated: this.finalEnemiesDefeated || this.enemiesDefeated || 0,
                    playTime: this.playTime || 0
                };
                console.log("Enviando para /api/saveScore:", savePayload);
                const response = await fetch("/api/saveScore", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(savePayload)
                });

                if (response.ok) {
                    console.log("✓ Score registrado na API local com sucesso!");
                } else {
                    const errorText = await response.text();
                    console.error("❌ Erro ao registrar na API local:", response.status, errorText);
                }
            } catch (apiErr) {
                console.error("❌ Falha na requisição local:", apiErr);
            }

            // Independentemente de on-chain ou local, resetar o jogo após sucesso local
            this.sound.stopAll();
            window.location.reload();
        } catch (error) {
            console.error('❌ ERRO CRÍTICO ao submeter score:', error);
            alert('Erro ao submeter score: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
            // Retornar ao menu mesmo com erro
            this.sound.stopAll();
            this.scene.start('StartScene');
        }
    }
}

export function initGame(upgrades?: Record<string, number>) {
    const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        parent: 'game-container',
        width: 1920,
        height: 1080,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        antialias: false,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { x: 0, y: 1000 },
                debug: false
            }
        },
        render: {
            pixelArt: true,
            antialias: false,
            powerPreference: 'high-performance',
            roundPixels: true
        },
        fps: {
            target: 60,
            forceSetTimeOut: true
        },
        scene: [StartScene, MainScene, DeathScene]
    };

    const game = new Phaser.Game(config);
    window.game = game;

    // Start with StartScene (Main Menu) instead of MainScene directly
    // Pass the upgrades as global data that can be accessed by all scenes
    (game as any).playerUpgrades = upgrades;
    
    // Note: StartScene is already included in the scene array and will be the first one started by Phaser
    // if it's the first element in the array. Let's ensure StartScene is first.
    
    return game;
}
