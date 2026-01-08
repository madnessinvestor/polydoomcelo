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
        { wave: 1, total: 100, enemies: { ground_biter: 1.0 } },
        { wave: 2, total: 140, enemies: { ground_biter: 0.65, charger_ram: 0.2, pouncer: 0.15 } },
        { wave: 3, total: 190, enemies: { ground_biter: 0.5, charger_ram: 0.2, arc_shooter: 0.15, pouncer: 0.15 } },
        { wave: 4, total: 250, enemies: { ground_biter: 0.3, charger_ram: 0.15, arc_shooter: 0.15, hover_mage: 0.15, pouncer: 0.1, spin_star: 0.15 } },
        { wave: 5, total: 320, enemies: { ground_biter: 0.25, charger_ram: 0.15, arc_shooter: 0.1, hover_mage: 0.15, knockback_brute: 0.15, phase_heptar: 0.2 } },
        { wave: 6, total: 400, enemies: { ground_biter: 0.2, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, knockback_brute: 0.1, split_core: 0.2, crescent_reaver: 0.2 } },
        { wave: 7, total: 500, enemies: { ground_biter: 0.15, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, split_core: 0.15, shield_sentinel: 0.2, spiral_warden: 0.2 } },
        { wave: 8, total: 650, enemies: { ground_biter: 0.1, charger_ram: 0.1, arc_shooter: 0.1, hover_mage: 0.1, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.1, prism_drifter: 0.3 } },
        { wave: 9, total: 850, enemies: { ground_biter: 0.1, charger_ram: 0.05, arc_shooter: 0.05, hover_mage: 0.05, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.15, arc_phantom: 0.1, prism_drifter: 0.3 } },
        { wave: 10, total: 1100, enemies: { ground_biter: 0.1, charger_ram: 0.05, arc_shooter: 0.05, hover_mage: 0.05, pouncer: 0.05, knockback_brute: 0.1, split_core: 0.1, shield_sentinel: 0.1, blink_stalker: 0.1, arc_phantom: 0.1, prism_drifter: 0.2 } }
    ];

    // Boss polygon graphics map
    private bossGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    private isGameOver: boolean = false;
    private level: number = 1;
    private levelTitle: string = 'Arc Initiate';
    private enemiesDefeated: number = 0;
    private isSubmittingScore: boolean = false;

    private isDefending: boolean = false;
    private shieldGraphics: Phaser.GameObjects.Graphics | null = null;
    
    private async submitScoreOnChain() {
        if (this.isSubmittingScore || this.score <= 0) return;
        
        try {
            this.isSubmittingScore = true;
            console.log("📡 Iniciando registro de score on-chain...");

            if (!(window as any).ethereum) {
                console.warn("Wallet não conectada para registro on-chain");
                return;
            }

            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            
            const contractAddress = "0x9b673bDBA9ed06989b1846d4C63468BCE86cf006";
            const abi = ["function addScore(string name, uint256 score) public"];
            const contract = new ethers.Contract(contractAddress, abi, signer);

            // Nome padrão caso não tenhamos um nome customizado
            const playerName = "Arc Player " + userAddress.substring(0, 6);
            
            console.log(`Submetendo: ${playerName} - ${this.score}`);
            const tx = await contract.addScore(playerName, BigInt(Math.floor(this.score)));
            console.log("Transação enviada:", tx.hash);
            
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
        { lvl: 4, hp: 850, ki: 280, mult: 2.2, punch: 40, magic: 25, kame: 80, res: 0.10, score: 500 },
        { lvl: 5, hp: 1200, ki: 380, mult: 3.0, punch: 50, magic: 30, kame: 100, res: 0.15, score: 1000 },
        { lvl: 6, hp: 1700, ki: 520, mult: 3.4, punch: 60, magic: 40, kame: 120, res: 0.20, score: 2000 },
        { lvl: 7, hp: 2300, ki: 700, mult: 4.0, punch: 70, magic: 45, kame: 140, res: 0.25, score: 4000 },
        { lvl: 8, hp: 3100, ki: 950, mult: 4.5, punch: 80, magic: 50, kame: 160, res: 0.30, score: 8000 },
        { lvl: 9, hp: 4000, ki: 1300, mult: 5.0, punch: 100, magic: 100, kame: 200, res: 0.35, score: 20000 },
        { lvl: 10, hp: 8000, ki: 3000, mult: 6.0, punch: 200, magic: 200, kame: 400, res: 0.40, score: 1000000000 }
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
        '/attached_assets/0_1767069690246.mp3',
        '/attached_assets/1_1767069690246.mp3',
        '/attached_assets/2_1767069690245.mp3',
        '/attached_assets/3_1767069690247.mp3'
    ];
    private deathSoundKey = 'death_sound';
    private deathSoundPath = '/attached_assets/Death_(Player)_1767820208727.mp3';
    private defenseSoundKey = 'defense_sound';
    private defenseSoundPath = '/attached_assets/Som_Defesa_(player)_1767820303726.mp3';
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
                    fontFamily: 'monospace',
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
                    fontFamily: 'monospace',
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
        this.load.image('start_bg', '/attached_assets/Background_Tela_Principal_1767815377331.png');

        // Logo
        this.load.image('game_logo', '/attached_assets/8a5b21d5-fa8e-404c-b7a1-4d7acfe803ef_1767786400336.png');

        // Opening Music
        this.load.audio('opening_music', [
            '/attached_assets/Open_1767879401695.ogg',
            '/attached_assets/Open_1767879213418.mp3'
        ]);

        // Social Media Icons
        this.load.image('x_icon', '/attached_assets/social/x.png');
        this.load.image('github_icon', '/attached_assets/social/github.png');
        this.load.image('youtube_icon', '/attached_assets/social/youtube.png');
        this.load.image('farcaster_icon', '/attached_assets/social/farcaster.png');
        this.load.image('instagram_icon', '/attached_assets/social/instagram.png');
        this.load.image('telegram_icon', '/attached_assets/social/telegram.png');
        this.load.image('discord_icon', '/attached_assets/social/discord.png');
    }

    private async connectWallet() {
        if (this.isWalletConnecting) return;
        this.isWalletConnecting = true;

        try {
            // Arc Testnet Config
            const arcTestnet = {
                chainId: '0x4cef52',
                chainName: 'Arc Testnet',
                nativeCurrency: {
                    name: 'ARC',
                    symbol: 'ARC',
                    decimals: 18
                },
                rpcUrls: ['https://rpc.testnet.arc.io'],
                blockExplorerUrls: ['https://explorer.testnet.arc.io']
            };

            if (!(window as any).ethereum) {
                alert("Please install Rabby or MetaMask!");
                this.isWalletConnecting = false;
                return;
            }

            console.log('Requesting account connection...');
            const accounts = await (window as any).ethereum.request({
                method: 'eth_requestAccounts',
                params: [],
            });
            this.walletAddress = accounts[0];
            (window as any).walletAddress = this.walletAddress;
            
            console.log(`Attempting to switch to Arc Testnet (${arcTestnet.chainId})...`);
            try {
                await (window as any).ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: arcTestnet.chainId }],
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
            
            // Success - reload to refresh state and ensure data is synced
            window.location.reload();
            
        } catch (error: any) {
            console.error('Connection failed:', error);
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
}

class DeathScene extends Phaser.Scene {
    private finalScore: number = 0;
    private finalLevel: number = 1;
    private finalWave: number = 1;

    constructor() {
        super('DeathScene');
    }

    init(data: any) {
        this.finalScore = data.score || 0;
        this.finalLevel = data.level || 1;
        this.finalWave = data.wave || 1;
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Background
        this.add.rectangle(0, 0, width, height, 0x0a0a20).setOrigin(0).setScrollFactor(0);

        // Game Over Title
        this.add.text(width / 2, height / 4, 'GAME OVER', {
            fontSize: '64px',
            fontFamily: 'Arial, sans-serif',
            color: '#ff6b6b',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5, 0.5);

        // Stats
        const statsY = height / 3;
        this.add.text(width / 2, statsY, `Final Score: ${this.finalScore}`, {
            fontSize: '28px',
            fontFamily: 'Arial, sans-serif',
            color: '#fbbf24',
            align: 'center'
        }).setOrigin(0.5, 0.5);

        this.add.text(width / 2, statsY + 50, `Level: ${this.finalLevel} | Wave: ${this.finalWave}`, {
            fontSize: '24px',
            fontFamily: 'Arial, sans-serif',
            color: '#60a5fa',
            align: 'center'
        }).setOrigin(0.5, 0.5);
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
    (game as any).playerUpgrades = upgrades;
    return game;
}