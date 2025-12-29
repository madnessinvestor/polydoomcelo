import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
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
    private bossSpawned: boolean = false;

    // Enemy Type Definitions
    private enemyTypes = [
        { id: 'ground_biter', name: 'Ground Biter', sides: 4, color: 0x4ade80, behavior: 'melee', scale: 1.0 },
        { id: 'charger_ram', name: 'Charger Ram', sides: 5, color: 0x4ade80, behavior: 'charge', scale: 1.2 },
        { id: 'arc_shooter', name: 'Arc Shooter', sides: 3, color: 0x4ade80, behavior: 'ranged', scale: 1.0 },
        { id: 'hover_mage', name: 'Hover Mage', sides: 6, color: 0x4ade80, behavior: 'fly', scale: 1.1 },
        { id: 'pouncer', name: 'Pouncer', sides: 3, color: 0x4ade80, behavior: 'jump', scale: 0.8, inverted: true },
        { id: 'knockback_brute', name: 'Knockback Brute', sides: 4, color: 0x4ade80, behavior: 'knockback', scale: 1.5, ratio: 1.5 },
        { id: 'blink_stalker', name: 'Blink Stalker', sides: 8, color: 0x4ade80, behavior: 'teleport', scale: 0.8 },
        { id: 'split_core', name: 'Split Core', sides: 8, color: 0x4ade80, behavior: 'split', scale: 1.2 },
        { id: 'shield_sentinel', name: 'Shield Sentinel', sides: 4, color: 0x4ade80, behavior: 'shield', scale: 1.3, doubleBorder: true },
        { id: 'arc_phantom', name: 'Arc Phantom', sides: 10, color: 0x4ade80, behavior: 'elite', scale: 1.8 }
    ];

    private waveConfigs = [
        { wave: 1, enemies: { ground_biter: 1.0 } },
        { wave: 2, enemies: { ground_biter: 0.7, pouncer: 0.3 } },
        { wave: 3, enemies: { ground_biter: 0.5, arc_shooter: 0.3, pouncer: 0.2 } },
        { wave: 4, enemies: { ground_biter: 0.4, arc_shooter: 0.25, hover_mage: 0.2, pouncer: 0.15 } },
        { wave: 5, enemies: { ground_biter: 0.35, charger_ram: 0.25, arc_shooter: 0.2, hover_mage: 0.2 } },
        { wave: 6, enemies: { ground_biter: 0.3, charger_ram: 0.2, knockback_brute: 0.2, arc_shooter: 0.15, hover_mage: 0.15 } },
        { wave: 7, enemies: { ground_biter: 0.25, split_core: 0.2, charger_ram: 0.15, knockback_brute: 0.15, arc_shooter: 0.15, hover_mage: 0.1 } },
        { wave: 8, enemies: { ground_biter: 0.2, split_core: 0.2, blink_stalker: 0.2, arc_shooter: 0.15, hover_mage: 0.15, knockback_brute: 0.1 } },
        { wave: 9, enemies: { ground_biter: 0.15, shield_sentinel: 0.2, split_core: 0.2, blink_stalker: 0.15, arc_shooter: 0.15, hover_mage: 0.15, arc_phantom: 0.05 } },
        { wave: 10, enemies: { ground_biter: 0.1, charger_ram: 0.15, knockback_brute: 0.15, split_core: 0.15, blink_stalker: 0.15, shield_sentinel: 0.1, arc_shooter: 0.1, hover_mage: 0.1, arc_phantom: 0.1 } }
    ];

    // Boss polygon graphics map
    private bossGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    private isGameOver: boolean = false;
    private level: number = 1;
    private levelTitle: string = 'Arc Initiate';
    private enemiesDefeated: number = 0;
    
    // Power-up states and timers
    private activeBuffs: Map<string, { title: string, description: string, duration?: number, startTime?: number }> = new Map();
    
    // Power-up states
    private hasPowerBoost: boolean = false;
    private hasScoreBoost: boolean = false;
    private isInvincible: boolean = false;
    private invincibilityTimer: number = 0;
    private items!: Phaser.Physics.Arcade.Group;
    private itemGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    // Level stats configuration
    private levelStats = [
        { lvl: 1, hp: 300, ki: 100, mult: 1.0, punch: 10, magic: 10, kame: 50, res: 0.00, score: 0 },
        { lvl: 2, hp: 420, ki: 140, mult: 1.5, punch: 15, magic: 15, kame: 75, res: 0.03, score: 50 },
        { lvl: 3, hp: 600, ki: 200, mult: 2.2, punch: 22, magic: 22, kame: 110, res: 0.06, score: 200 },
        { lvl: 4, hp: 850, ki: 280, mult: 3.2, punch: 32, magic: 32, kame: 160, res: 0.10, score: 1000 },
        { lvl: 5, hp: 1200, ki: 380, mult: 4.5, punch: 45, magic: 45, kame: 225, res: 0.15, score: 5000 },
        { lvl: 6, hp: 1700, ki: 520, mult: 6.0, punch: 60, magic: 60, kame: 300, res: 0.20, score: 25000 },
        { lvl: 7, hp: 2300, ki: 700, mult: 7.5, punch: 75, magic: 75, kame: 375, res: 0.25, score: 125000 },
        { lvl: 8, hp: 3100, ki: 950, mult: 9.0, punch: 90, magic: 90, kame: 450, res: 0.30, score: 600000 },
        { lvl: 9, hp: 4000, ki: 1300, mult: 11.0, punch: 110, magic: 110, kame: 550, res: 0.35, score: 3000000 },
        { lvl: 10, hp: 5200, ki: 1800, mult: 15.0, punch: 150, magic: 150, kame: 750, res: 0.40, score: 15000000 }
    ];

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

    preload() {
        this.load.spritesheet('criptoide_basic', '/attached_assets/generated_images/pixel_art_criptoide_basic_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('jungle_tiles', '/attached_assets/generated_images/pixel_art_jungle_tileset.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

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
                if (this.player.active && this.player.body && this.player.body.velocity.length() > 100) {
                    const trail = this.add.circle(this.player.x, this.player.y, 16, 0xffd700, 0.3);
                    trail.setDepth(5);
                    this.tweens.add({
                        targets: trail,
                        alpha: 0,
                        scale: 0.5,
                        duration: 300,
                        onComplete: () => trail.destroy()
                    });
                }
            },
            loop: true
        });

        this.physics.add.collider(this.player, platforms);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('Z,X,C,V,B');

        // Enhanced HUD
        const hudScale = Math.max(1, width / 800);
        const fontSize = Math.floor(24 * hudScale);
        const titleFontSize = Math.floor(32 * hudScale);
        
        this.scoreText = this.add.text(16, 16, `Score: ${this.score.toLocaleString()} | LVL: ${this.level} (${this.levelTitle})`, { 
            fontSize: `${fontSize}px`, 
            color: '#fff', 
            fontFamily: '"Courier New", Courier, monospace',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setScrollFactor(0).setDepth(1000);

        this.enemyCounterText = this.add.text(width - 16, 16 + fontSize * 2 + 20, `0/${this.totalEnemiesInWave}`, {
            fontSize: `${fontSize}px`,
            color: '#ff4444',
            fontFamily: '"Courier New", Courier, monospace',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.waveText = this.add.text(width - 16, 16, 'WAVE: 1', { 
            fontSize: `${fontSize}px`, 
            color: '#fbbf24', 
            fontStyle: 'bold', 
            fontFamily: '"Courier New", Courier, monospace',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.timerText = this.add.text(width - 16, 16 + fontSize + 10, '01:00', { 
            fontSize: `${fontSize}px`, 
            color: '#fff', 
            fontStyle: 'bold', 
            fontFamily: '"Courier New", Courier, monospace',
            stroke: '#000',
            strokeThickness: 6
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
        
        this.kiarcBar = this.add.graphics().setScrollFactor(0).setDepth(1000);
        
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
            fontFamily: '"Courier New", Courier, monospace',
            backgroundColor: '#000000',
            padding: { x: 12, y: 6 }
        }).setScrollFactor(0).setDepth(2002).setVisible(false);

        this.updateHUD();

        // Update buff icons in real-time
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                let changed = false;
                this.activeBuffs.forEach((buff, type) => {
                    if (buff.duration && buff.startTime) {
                        const elapsed = (this.time.now - buff.startTime) / 1000;
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
            fontFamily: 'Pixel'
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
        
        // Waves increase total enemies: 60, 90, 130... 100 base
        this.totalEnemiesInWave = 60 + (Math.min(this.currentWave, 10) - 1) * 40;
        if (this.currentWave > 10) {
            this.totalEnemiesInWave += (this.currentWave - 10) * 100;
        }

        const waveName = this.currentWave > 10 ? `INFINITY WAVE ${this.currentWave}` : `WAVE: ${this.currentWave}`;
        this.waveText.setText(waveName);
        this.waveText.setColor('#fbbf24');

        if (this.spawnEvent) this.spawnEvent.destroy();
        
        this.spawnEvent = this.time.addEvent({
            delay: this.currentWave > 10 ? 500 : 1000,
            callback: this.spawnBatch,
            callbackScope: this,
            loop: true
        });

        // Spawn boss after 10 seconds
        this.time.delayedCall(10000, () => {
            if (!this.isWaveInterval && !this.isGameOver && !this.bossSpawned) {
                this.spawnBoss();
                if (this.currentWave > 10) {
                    // Spawn 2 more bosses for Infinity Wave (total 3)
                    this.time.delayedCall(2000, () => this.spawnBoss());
                    this.time.delayedCall(4000, () => this.spawnBoss());
                }
                this.bossSpawned = true;
            }
        });

        // Elite Arc Phantom logic
        if (this.currentWave >= 9) {
            const delay = this.currentWave === 9 ? 90000 : 45000;
            this.time.delayedCall(delay, () => {
                if (!this.isWaveInterval && !this.isGameOver) {
                    this.spawnEnemyOfType('arc_phantom');
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

        const batchSize = Math.min(
            Math.ceil(this.totalEnemiesInWave / 60), 
            this.totalEnemiesInWave - this.enemiesSpawnedInWave,
            this.maxSimultaneousEnemies - activeEnemies
        );

        for (let i = 0; i < batchSize; i++) {
            this.spawnEnemy();
        }
    }

    private spawnEnemy() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(0, 1) === 0 ? -50 : width + 50;
        const y = this.cameras.main.height - 100;

        const config = this.getWaveConfig(this.currentWave);
        let selectedTypeId = 'ground_biter';

        if (!config || !config.enemies) {
            // Use Wave 10 config for Infinity Wave
            const infinityConfig = this.waveConfigs[9];
            const rand = Math.random();
            let cumulative = 0;
            for (const [typeId, chance] of Object.entries(infinityConfig.enemies)) {
                cumulative += (chance as number);
                if (rand <= cumulative) {
                    selectedTypeId = typeId;
                    break;
                }
            }
        } else {
            const rand = Math.random();
            let cumulative = 0;
            for (const [typeId, chance] of Object.entries(config.enemies)) {
                cumulative += (chance as number);
                if (rand <= cumulative) {
                    selectedTypeId = typeId;
                    break;
                }
            }
        }

        const typeInfo = this.enemyTypes.find(t => t.id === selectedTypeId) || this.enemyTypes[0];
        
        let scaleModifier = 1.0;
        let damageModifier = 1.0;
        let hpModifier = 1.0;

        if (this.currentWave > 10) {
            const infinityLevel = this.currentWave - 10;
            scaleModifier = Math.pow(1.2, infinityLevel);
            damageModifier = Math.pow(1.2, infinityLevel);
        } else if (this.currentWave >= 2) {
            scaleModifier = Math.pow(1.4, this.currentWave - 1);
        }

        this.createEnemyObject(x, y, { ...typeInfo, scale: (typeInfo.scale || 1) * scaleModifier }, damageModifier, hpModifier);
        this.enemiesSpawnedInWave++;
    }

    private spawnEnemyOfType(typeId: string) {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(0, 1) === 0 ? -50 : width + 50;
        const y = this.cameras.main.height - 100;
        const typeInfo = this.enemyTypes.find(t => t.id === typeId) || this.enemyTypes[0];
        
        // Size and damage scaling for Infinity Wave or Waves 2-10
        let scaleModifier = 1.0;
        let damageModifier = 1.0;
        let hpModifier = 1.0;

        if (this.currentWave > 10) {
            const infinityLevel = this.currentWave - 10;
            scaleModifier = Math.pow(1.2, infinityLevel);
            damageModifier = Math.pow(1.2, infinityLevel);
        } else if (this.currentWave >= 2) {
            scaleModifier = Math.pow(1.4, this.currentWave - 1);
        }

        this.createEnemyObject(x, y, { ...typeInfo, scale: (typeInfo.scale || 1) * scaleModifier }, damageModifier, hpModifier);
    }

    private createEnemyObject(x: number, y: number, typeInfo: any, extraDamageMult: number = 1, extraHpMult: number = 1) {
        const enemy = this.enemies.create(x, y, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        enemy.setBounce(0.5);
        enemy.setCollideWorldBounds(true);
        enemy.setData('typeId', typeInfo.id);
        enemy.setData('behavior', typeInfo.behavior);
        
        const waveMultiplier = 1 + (this.currentWave - 1) * 0.2;
        const isElite = typeInfo.behavior === 'elite';
        
        enemy.setData('health', (isElite ? 200 : 20) * waveMultiplier * extraHpMult);
        enemy.setData('damage', (isElite ? 0.2 : 0.05) * waveMultiplier * extraDamageMult);
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
    }

    private drawEnemyShape(graphics: Phaser.GameObjects.Graphics, type: any, size: number) {
        graphics.clear();
        graphics.lineStyle(2, 0x4ade80, 1); // Fixed green outline

        if (type.doubleBorder) {
            graphics.lineStyle(2, 0x4ade80, 0.5); // Fixed green outline
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
        
        // 30-second interval
        this.time.delayedCall(30000, () => {
            if (this.isGameOver) return;
            this.currentWave++;
            this.startWave();
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
        const baseSpeed = 400;
        // Each level increases speed by 20%
        return baseSpeed * (1 + (level - 1) * 0.2);
    }

    update(time: number, delta: number) {
        if (this.isGameOver) return;

        // Handle power-up timers
        if (this.isInvincible) {
            this.invincibilityTimer -= delta;
            if (this.invincibilityTimer <= 0) {
                this.isInvincible = false;
            }
        }
        
        const currentSpeed = this.getPlayerSpeed(this.level);

        // Update timer display
        const elapsed = Math.floor((time - this.waveStartTime) / 1000);
        if (!this.isWaveInterval) {
            const mins = Math.floor(elapsed / 60);
            const secs = elapsed % 60;
            this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

            // Wave conclusion: No duration limit, just check if all enemies are defeated
            // Spawning should have ended (handled in spawnBatch)
            if (this.enemiesSpawnedInWave >= this.totalEnemiesInWave && this.enemies.countActive(true) === 0 && !this.isWaveInterval) {
                this.startInterval();
            }
        } else {
            // Countdown for the interval
            const timeLeft = Math.max(0, 30 - elapsed);
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
        }

        // Horizontal movement
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

        // Enemy Pursuit Logic
        this.enemies.getChildren().forEach((e: any) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (enemy.active && this.player.active) {
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
                const enemySpeed = enemy.getData('speed') || 100;
                
                const behavior = enemy.getData('behavior');
                if (behavior === 'fly' || behavior === 'teleport' || behavior === 'elite') {
                    enemy.setVelocity(
                        Math.cos(angle) * enemySpeed,
                        Math.sin(angle) * enemySpeed
                    );
                } else {
                    // Standard ground pursuit
                    if (enemy.x < this.player.x) {
                        enemy.setVelocityX(enemySpeed);
                    } else {
                        enemy.setVelocityX(-enemySpeed);
                    }
                }
            }
        });

        // Ground Impact logic (keep existing functionality but adapt to new movement)
        if (this.player.body?.touching.down && this.player.getData('isFastFalling')) {
            this.handleGroundImpact();
            this.player.setData('isFastFalling', false);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.Z) && !this.keys.B.isDown) {
            this.attack();
        }
        
        if (this.keys.X.isDown && !this.keys.B.isDown) {
            this.chargeKiarc();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.C) && this.kiarc >= 20 && !this.keys.B.isDown) {
            this.shootMagic();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.V) && this.kiarc >= (this.maxKiarc * 0.5) && !this.keys.B.isDown) {
            this.shootArcamehameha();
        }

        // Handle ArcGenkiDama (B Key)
        if (this.keys.B.isDown) {
            if (this.kiarc > 0) {
                this.player.setVelocity(0, 0);
                if (this.player.body) {
                    this.player.body.allowGravity = false;
                }
                this.chargeGenkidama();
            } else if (this.isChargingGenkidama) {
                // If ki reaches zero, stop charging
                // Growth stops because kiarc is 0 in chargeGenkidama check, 
                // but we keep the current dama until released
            }
        } else if (Phaser.Input.Keyboard.JustUp(this.keys.B) && this.isChargingGenkidama) {
            if (this.player.body) {
                this.player.body.allowGravity = true;
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
                    fontFamily: '"Courier New", Courier, monospace'
                }).setOrigin(0.5);

                this.tweens.add({
                    targets: failText,
                    y: failText.y - 50,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => failText.destroy()
                });

                if (this.genkidama) {
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
                        // Aura damage also scales? The prompt didn't specify, keeping it 10 or scaling with multi?
                        // User said "Poder ao redor do personagem que dá dano nos inimigos 10 de dano" in previous prompt.
                        // I'll keep it at 10 as specified or scale it if it feels right. User didn't ask to scale aura damage here.
                        enemy.setData('health', (currentHealth || 0) - 10);
                        
                        // Visual feedback for aura damage
                        if (this.time.now % 500 < 20) {
                            enemy.setTint(0x00ffff);
                            this.time.delayedCall(100, () => {
                                if (enemy.active) enemy.clearTint();
                            });
                        }

                        if (enemy.getData('health') <= 0) {
                            if (enemy.getData('isBoss')) {
                                const bossScore = 20 * Math.pow(5, this.currentWave - 1);
                                this.score += bossScore;
                            } else {
                                this.score++;
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

    handleGroundImpact() {
        // Multiplicador de nível baseado na solicitação do usuário
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

        // Efeito visual de tremor na câmera proporcional ao nível
        this.cameras.main.shake(400, 0.04 * multiplier);
        
        // Círculo de impacto visual proporcional ao nível
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

        // Afastar inimigos próximos com força proporcional ao nível
        const impactRadius = currentRadius;
        this.enemies.getChildren().forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            if (!enemy || !enemy.active || !enemy.body) return;

            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            
            if (distance < impactRadius) {
                // Calcular direção da força
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                
                // Multiplicador de força proporcional ao nível
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

    chargeKiarc() {
        if (this.kiarc < this.maxKiarc) {
            this.kiarc += 0.5;
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

    shootArcamehameha() {
        const stats = this.levelStats[this.level - 1];
        const damageMultiplier = stats.mult;
        const kameDamage = stats.kame;
        
        this.kiarc -= 50;
        const beamLength = 2400;
        const beamX = this.player.x + (this.player.flipX ? -(beamLength / 2) : (beamLength / 2));
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

    attack() {
        const stats = this.levelStats[this.level - 1];
        const damageMultiplier = stats.mult;
        const punchDamage = stats.punch;
        
        const punchX = this.player.flipX ? this.player.x - 60 : this.player.x + 60;
        const targets = this.enemies.getChildren().filter(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            return Phaser.Math.Distance.Between(punchX, this.player.y, enemy.x, enemy.y) < 80;
        });
        
        targets.forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            this.hitEnemy(enemy, punchDamage * damageMultiplier);
            
            // Efeito visual simples de soco
            const flash = this.add.circle(enemy.x, enemy.y, 30, 0xffffff, 0.5);
            this.tweens.add({
                targets: flash,
                scale: 1.5,
                alpha: 0,
                duration: 100,
                onComplete: () => flash.destroy()
            });
        });
    }

    shootMagic() {
        const stats = this.levelStats[this.level - 1];
        const damageMultiplier = stats.mult;
        const magicDamage = stats.magic;
        
        this.kiarc -= 20;
        const magic = this.add.circle(this.player.x, this.player.y, 15, 0xffdd00);
        this.physics.add.existing(magic);
        const body = magic.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(this.player.flipX ? -800 : 800);
        
        this.physics.add.overlap(magic, this.enemies, (m, e) => {
            m.destroy();
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, magicDamage * damageMultiplier);
        }, undefined, this);
    }

    chargeGenkidama() {
        this.isChargingGenkidama = true;
        const kiToConsume = 0.5;
        if (this.kiarc >= kiToConsume) {
            this.kiarc -= kiToConsume;
            this.genkidamaChargeAmount += kiToConsume;
            
            if (!this.genkidama) {
                this.genkidama = this.add.circle(this.player.x, this.player.y - 100, 10, 0xadd8e6, 0.6);
                
                this.genkidamaText = this.add.text(this.player.x, this.player.y - 30, 'All Arcs, share your power', {
                    fontSize: '14px',
                    color: '#add8e6',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 3,
                    fontFamily: '"Courier New", Courier, monospace'
                }).setOrigin(0.5);

                this.genkidamaPercentText = this.add.text(this.player.x, this.player.y - 50, '0%', {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontStyle: 'bold',
                    stroke: '#000',
                    strokeThickness: 4,
                    fontFamily: '"Courier New", Courier, monospace'
                }).setOrigin(0.5);
            }
            
            // Percentage: 200 KI = 100%
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
        const damage = (this.genkidamaChargeAmount / 10) * 2;
        const chargeUsed = this.genkidamaChargeAmount;
        this.genkidamaChargeAmount = 0;
        this.isChargingGenkidama = false;
        
        this.physics.add.existing(genki);
        const body = genki.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        const centerX = this.cameras.main.width / 2;
        const floorY = this.cameras.main.height - 32;
        
        this.physics.moveTo(genki, centerX, floorY, 400);
        
        // Use a timer to check for floor impact since we want it to hit the center floor
        const checkImpact = this.time.addEvent({
            delay: 50,
            callback: () => {
                if (genki.active && genki.y >= floorY - 20) {
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
                    checkImpact.remove();
                }
            },
            loop: true
        });

        // Auto destroy if it takes too long
        this.time.delayedCall(5000, () => {
            if (genki.active) {
                genki.destroy();
                checkImpact.remove();
            }
        });
    }

    hitEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number) {
        let health = enemy.getData('health') || 1;
        const typeId = enemy.getData('typeId');
        let finalDamage = this.hasPowerBoost ? damage * 2 : damage;

        // 9. Shield Sentinel - Reduz dano frontal
        if (typeId === 'shield_sentinel') {
            const angleToPlayer = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            const velocityAngle = Math.atan2(enemy.body.velocity.y, enemy.body.velocity.x);
            // If player is roughly in front of where enemy is moving/facing
            if (Math.abs(Phaser.Math.Angle.Wrap(angleToPlayer - velocityAngle)) < Math.PI / 3) {
                finalDamage *= 0.3; // 70% reduction
            }
        }

        health -= finalDamage;
        enemy.setData('health', health);

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

            // 8. Split Core - Divide em 2 menores
            if (typeId === 'split_core') {
                for (let i = 0; i < 2; i++) {
                    const smallType = { ...this.enemyTypes.find(t => t.id === 'split_core'), scale: 0.6, behavior: 'melee' };
                    this.createEnemyObject(enemy.x + Phaser.Math.Between(-20, 20), enemy.y, smallType);
                }
            }

            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-5, 5),
                duration: 50,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (enemy.getData('isBoss')) {
                        let bossScore = 20 * Math.pow(5, this.currentWave - 1);
                        if (this.hasScoreBoost) bossScore *= 2;
                        this.score += bossScore;
                        this.checkLevelUp();
                    } else {
                        // Standard score increase by 1 per enemy
                        let gainedScore = 1;
                        if (this.hasScoreBoost) gainedScore *= 2;
                        this.score += gainedScore;
                        this.checkLevelUp();
                    }

                    // Level progression logic based on standard threshold
                    const nextLevelThreshold = this.level * 10;
                    if (this.enemiesDefeated + 1 >= nextLevelThreshold && this.level < 10) {
                        this.level++;
                        
                        // Update max stats for new level and restore to 100%
                        const newLevelStats = this.levelStats[this.level - 1];
                        this.maxHealth = newLevelStats.hp;
                        this.maxKiarc = newLevelStats.ki;
                        this.health = this.maxHealth;
                        this.kiarc = this.maxKiarc;
                        
                        const titles = [
                            'Arc Initiate', 'Arc Squire', 'Arc Warrior', 'Arc Knight', 
                            'Arc Commander', 'Arc Master', 'Arc Grandmaster', 
                            'Arc Sage', 'Arc Eternal', 'Arc Divine'
                        ];
                        this.levelTitle = titles[this.level - 1];
                        this.cameras.main.flash(500, 0, 255, 0);
                        
        const levelUpText = this.add.text(this.player.x, this.player.y - 100, `Level Up\n${this.levelTitle}`, {
            fontSize: '48px',
            color: '#4ade80',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 8,
            align: 'center',
            fontFamily: '"Courier New", Courier, monospace'
        }).setOrigin(0.5).setScrollFactor(1);

                        // Update to follow player
                        const updateFollow = () => {
                            if (levelUpText.active && this.player.active) {
                                levelUpText.x = this.player.x;
                            } else {
                                this.events.off('update', updateFollow);
                            }
                        };
                        this.events.on('update', updateFollow);
                        
                        // Pulse animation relative to current position
                        this.tweens.add({
                            targets: levelUpText,
                            scaleY: 1.5,
                            alpha: 0,
                            y: '-=80',
                            duration: 1500,
                            ease: 'Quad.easeOut',
                            onComplete: () => {
                                levelUpText.destroy();
                                this.events.off('update', updateFollow);
                            }
                        });
                        
                        this.updatePlayerVisual();
                    }

                    this.enemiesDefeated++;
                    this.cameras.main.shake(100, 0.005);
                    this.createExplosion(enemy.x, enemy.y);
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
    private createExplosion(x: number, y: number) {
        const colors = [0xffffff, 0x4ade80, 0x60a5fa];
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

        // Screen flash
        this.cameras.main.flash(500, 255, 255, 255);
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

    private showPickupNotification(title: string, description: string) {
        if (this.pickupTimer) this.pickupTimer.remove();
        
        this.pickupNotification.setText(`${title}: ${description}`);
        this.pickupNotification.setVisible(true);
        
        // Background for the notification
        const bounds = this.pickupNotification.getBounds();
        this.pickupNotificationBg.clear();
        this.pickupNotificationBg.fillStyle(0x000000, 0.8);
        this.pickupNotificationBg.lineStyle(1, 0x4ade80, 1);
        this.pickupNotificationBg.fillRoundedRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4, 4);
        this.pickupNotificationBg.strokeRoundedRect(bounds.x - 4, bounds.y - 2, bounds.width + 8, bounds.height + 4, 4);
        this.pickupNotificationBg.setVisible(true);

        this.pickupTimer = this.time.delayedCall(3000, () => {
            this.pickupNotification.setVisible(false);
            this.pickupNotificationBg.setVisible(false);
        });
    }

    private handlePlayerItemCollision(player: any, item: any) {
        const type = item.getData('type');
        const stats = this.levelStats[this.level - 1];

        // Efeito de texto subindo na cabeça do personagem
        const pickupText = this.add.text(this.player.x, this.player.y - 30, type, {
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: 'Arial, sans-serif'
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
                this.health = Math.min(this.maxHealth, this.health + this.maxHealth * 0.3);
                this.cameras.main.flash(200, 0, 255, 0, true);
                this.showPickupNotification('ArcHP', 'Recupera 30% de Vida.');
                break;
            case 'ArcKI':
                this.kiarc = Math.min(this.maxKiarc, this.kiarc + this.maxKiarc * 0.4);
                this.cameras.main.flash(200, 0, 0, 255, true);
                this.showPickupNotification('ArcKI', 'Recupera 40% de Energia (KI).');
                break;
            case 'ArcPower':
                this.hasPowerBoost = true;
                this.addBuff('ArcPower', 'Power Boost', 'Dobra todo o dano do personagem (Soco, Magia e Arcamehameha).', 20);
                this.cameras.main.flash(500, 255, 0, 0, true);
                this.showPickupNotification('ArcPower', 'Dano Dobrado por 20 segundos!');
                this.time.delayedCall(20000, () => {
                    this.hasPowerBoost = false;
                    this.removeBuff('ArcPower');
                });
                break;
            case 'ArcScore':
                this.hasScoreBoost = true;
                this.addBuff('ArcScore', 'Score Boost', 'Dobra todo o score ganho de inimigos e chefes.', 20);
                this.cameras.main.flash(500, 255, 215, 0, true);
                this.showPickupNotification('ArcScore', 'Pontuação Dobrada por 20 segundos!');
                this.time.delayedCall(20000, () => {
                    this.hasScoreBoost = false;
                    this.removeBuff('ArcScore');
                });
                break;
            case 'ArcBarrier':
                this.isInvincible = true;
                this.invincibilityTimer = 20000; // 20 seconds
                this.addBuff('ArcBarrier', 'Invencibilidade', 'Personagem fica invencível e não recebe dano.', 20);
                this.cameras.main.flash(300, 255, 0, 255, true);
                this.showPickupNotification('ArcBarrier', 'Invencibilidade por 20 segundos!');
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
                    const elapsed = (this.time.now - buff.startTime) / 1000;
                    const remaining = Math.max(0, buff.duration - elapsed);
                    durationText = remaining > 0 ? `${Math.ceil(remaining)}s` : 'Partida';
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
            startTime: duration ? this.time.now : undefined
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

    private handlePlayerEnemyCollision(obj1: any, obj2: any) {
        if (this.isGameOver || this.isWaveInterval || this.isInvincible) return;
        const enemy = obj2 as Phaser.Physics.Arcade.Sprite;
        
        // Get resistance from current level stats
        const stats = this.levelStats[this.level - 1];
        const resMultiplier = 1 - (stats.res || 0);
        
        const baseDamage = enemy.getData('damage') !== undefined ? enemy.getData('damage') : 0.01;
        const finalDamage = baseDamage * resMultiplier;
        
        this.health -= finalDamage;
        
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
            this.health = 0;
            this.playerGraphics.clear();
            this.playerAuraGraphics.clear();
            this.player.setActive(false);
            if (this.player.body) {
                this.player.body.enable = false;
            }
            this.createExplosion(this.player.x, this.player.y);
            
            // Reset game after explosion
            this.time.delayedCall(1000, () => {
                this.scene.restart();
            });
        }
    }

    updatePlayerVisual() {
        if (!this.player.active) return;
        
        this.cameras.main.flash(200, 255, 255, 255);
        
        const levelUpText = this.add.text(this.player.x, this.player.y - 50, 'LEVEL UP!', {
            fontSize: '24px',
            fontFamily: 'Pixel',
            color: '#4ade80',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        this.tweens.add({
            targets: levelUpText,
            y: levelUpText.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => levelUpText.destroy()
        });
    }

    private checkLevelUp() {
        if (this.level >= 10) return;
        
        const nextLevelData = this.levelStats[this.level]; 
        if (this.score >= nextLevelData.score) {
            this.level++;
            const stats = this.levelStats[this.level - 1];
            
            // Update stats
            this.maxHealth = stats.hp;
            this.health = this.maxHealth;
            this.maxKiarc = stats.ki;
            this.kiarc = this.maxKiarc;
            
            // Visual feedback
            this.cameras.main.flash(500, 255, 255, 0);
            this.drawPlayerSquare(this.level);
            
            const levelTitles = [
                'Arc Initiate', 'Arc Novice', 'Arc Apprentice', 'Arc Adept', 'Arc Mage',
                'Arc Master', 'Arc Grandmaster', 'Arc Sage', 'Arc Archon', 'Arc Legend'
            ];
            this.levelTitle = levelTitles[this.level - 1] || 'Arc Legend';
            
            this.updateHUD();
            this.updatePlayerVisual();
        }
    }

    updateHUD() {
        const width = this.cameras.main.width;
        const hudScale = Math.max(1, width / 800);
        const fontSize = Math.floor(24 * hudScale);
        
        // Update labels
        this.scoreText.setText(`Score: ${this.score.toLocaleString()} | LVL: ${this.level} (${this.levelTitle})`);
        this.enemyCounterText.setText(`${this.enemiesDefeated - this.totalEnemiesBeforeWave}`);

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
        const healthRatio = Math.max(0, this.health / this.maxHealth);
        this.kiarcBar.fillStyle(0xff4444, 1);
        this.kiarcBar.fillRect(hbX, hbY, hbWidth * healthRatio, hbHeight);
        
        // Border
        this.kiarcBar.lineStyle(2, 0xffffff, 1);
        this.kiarcBar.strokeRect(hbX, hbY, hbWidth, hbHeight);

        // HP Text
        if (!this.hpLabel) {
            this.hpLabel = this.add.text(hbX + 10, hbY + 1, '', { 
                fontSize: `${Math.floor(14 * hudScale)}px`, 
                color: '#fff', 
                fontFamily: '"Courier New", Courier, monospace',
                fontStyle: 'bold'
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
        const kiRatio = Math.max(0, this.kiarc / this.maxKiarc);
        this.kiarcBar.fillStyle(0xffd700, 1);
        this.kiarcBar.fillRect(kiX, kiY, kiWidth * kiRatio, kiHeight);
        
        // Border
        this.kiarcBar.lineStyle(2, 0xffffff, 1);
        this.kiarcBar.strokeRect(kiX, kiY, kiWidth, kiHeight);

        // KI Text
        if (!this.kiLabel) {
            this.kiLabel = this.add.text(kiX + 10, kiY + 0, '', { 
                fontSize: `${Math.floor(12 * hudScale)}px`, 
                color: '#fff', 
                fontFamily: '"Courier New", Courier, monospace',
                fontStyle: 'bold'
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

        // Update buff icons position
        if (this.buffIconsContainer) {
            this.buffIconsContainer.setPosition(16, 160);
        }

        // Update notification position to be below buff icons
        const notifyY = 160 + (this.buffIconsContainer ? 50 : 0);
        if (this.pickupNotification) {
            this.pickupNotification.setPosition(16, notifyY);
            if (this.pickupNotification.visible) {
                const bounds = this.pickupNotification.getBounds();
                this.pickupNotificationBg.clear();
                this.pickupNotificationBg.fillStyle(0x000000, 0.8);
                this.pickupNotificationBg.lineStyle(2, 0x4ade80, 1);
                this.pickupNotificationBg.fillRoundedRect(bounds.x - 8, bounds.y - 4, bounds.width + 16, bounds.height + 8, 6);
                this.pickupNotificationBg.strokeRoundedRect(bounds.x - 8, bounds.y - 4, bounds.width + 16, bounds.height + 8, 6);
            }
        }
    }

    private updateBuffsUI() {
        if (!this.buffIconsContainer) return;
        this.buffIconsContainer.removeAll(true);
        
        const activeBuffs = [];
        if (this.hasPowerBoost) activeBuffs.push({ type: 'ArcPower', title: 'Arc Power Boost', text: 'Dobra todo o dano do personagem (Soco, Magia e Arcamehameha).', duration: 'Partida' });
        if (this.hasScoreBoost) activeBuffs.push({ type: 'ArcScore', title: 'Arc Score Boost', text: 'Dobra todo o score ganho de inimigos e chefes.', duration: 'Partida' });
        if (this.isInvincible) activeBuffs.push({ type: 'ArcBarrier', title: 'Arc Barrier', text: 'Personagem fica invencível e não recebe dano.', duration: `${Math.ceil(this.invincibilityTimer / 1000)}s` });

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

    private getBuffColor(type: string): number {
        switch (type) {
            case 'ArcPower': return 0xff0000;
            case 'ArcScore': return 0xffd700;
            case 'ArcBarrier': return 0x800080;
            default: return 0xffffff;
        }
    }

    private showTooltip(x: number, y: number, title: string, text: string, duration?: string) {
        this.tooltipTitle.setText(title);
        const fullText = duration ? `${text}\nDuração: ${duration}` : text;
        this.tooltipText.setText(fullText);

        const bounds = this.tooltipText.getBounds();
        const width = Math.max(bounds.width + 20, 220);
        const height = bounds.height + 50;

        this.tooltipBg.clear();
        this.tooltipBg.fillStyle(0x000000, 0.9);
        this.tooltipBg.lineStyle(2, 0xfbbf24, 1);
        this.tooltipBg.fillRoundedRect(0, 0, width, height, 8);
        this.tooltipBg.strokeRoundedRect(0, 0, width, height, 8);

        this.tooltipContainer.setPosition(x + 20, y + 25);
        if (this.tooltipContainer.x + width > this.cameras.main.width) {
            this.tooltipContainer.x = x - width - 20;
        }
        this.tooltipContainer.setVisible(true);
    }

    private kiLabel!: Phaser.GameObjects.Text;
    private hpLabel!: Phaser.GameObjects.Text;
    private buffIconsContainer!: Phaser.GameObjects.Container;
    private tooltipContainer!: Phaser.GameObjects.Container;
    private tooltipBg!: Phaser.GameObjects.Graphics;
    private tooltipTitle!: Phaser.GameObjects.Text;
    private tooltipText!: Phaser.GameObjects.Text;
    private pickupNotification!: Phaser.GameObjects.Text;
    private pickupNotificationBg!: Phaser.GameObjects.Graphics;
    private pickupTimer!: Phaser.Time.TimerEvent;
}

    const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1600,
    height: 1200,
    resolution: window.devicePixelRatio || 1,
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
    scene: MainScene
};

export function initGame() {
    if (window.game) {
        window.game.destroy(true);
    }
    window.game = new Phaser.Game(config);
    return window.game;
}
