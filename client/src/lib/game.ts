import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private playerGraphics!: Phaser.GameObjects.Graphics;
    private playerAuraGraphics!: Phaser.GameObjects.Graphics;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private kiarc: number = 0;
    private maxKiarc: number = 100;
    private health: number = 100;
    private enemies!: Phaser.Physics.Arcade.Group;
    private score: number = 0;
    private keys!: any;
    private scoreText!: Phaser.GameObjects.Text;
    private kiarcBar!: Phaser.GameObjects.Graphics;

    // Wave system variables
    private currentWave: number = 1;
    private isWaveInterval: boolean = false;
    private waveTimer: number = 60;
    private waveTimerEvent!: Phaser.Time.TimerEvent;
    private waveText!: Phaser.GameObjects.Text;
    private timerText!: Phaser.GameObjects.Text;
    private spawnEvent!: Phaser.Time.TimerEvent;

    // Boss polygon graphics map
    private bossGraphicsMap = new Map<Phaser.Physics.Arcade.Sprite, Phaser.GameObjects.Graphics>();
    
    // Level and progression tracking
    private isGameOver: boolean = false;
    private level: number = 1;
    private levelTitle: string = 'Arc Initiate';
    private enemiesDefeated: number = 0;

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
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        graphics.closePath();
        graphics.fillPath();
        graphics.lineStyle(2, 0x4ade80, 1);
        graphics.strokePath();
    }

    // Draw evolving yellow square player based on level
    private drawPlayerSquare(level: number) {
        const size = 16;
        this.playerGraphics.clear();
        this.playerAuraGraphics.clear();
        
        const yellowColor = 0xffdd00;
        
        if (level === 1) {
            // Level 1: Simple yellow square
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
        } else if (level === 2) {
            // Level 2: Thicker border
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.lineStyle(4, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
        } else if (level === 3) {
            // Level 3: Double border
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size - 4, this.player.y - size - 4, size * 2 + 8, size * 2 + 8);
            this.playerGraphics.strokeRect(this.player.x - size + 2, this.player.y - size + 2, size * 2 - 4, size * 2 - 4);
        } else if (level === 4) {
            // Level 4: Inner lines
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.lineStyle(1, 0xffdd00, 0.7);
            this.playerGraphics.lineBetween(this.player.x - size, this.player.y, this.player.x + size, this.player.y);
            this.playerGraphics.lineBetween(this.player.x, this.player.y - size, this.player.x, this.player.y + size);
        } else if (level === 5) {
            // Level 5: Inner square layer
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.fillStyle(0x222222, 1);
            this.playerGraphics.fillRect(this.player.x - (size - 4), this.player.y - (size - 4), (size - 4) * 2, (size - 4) * 2);
        } else if (level === 6) {
            // Level 6: Chamfered corners
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.beginPath();
            this.playerGraphics.moveTo(this.player.x - size + 4, this.player.y - size);
            this.playerGraphics.lineTo(this.player.x + size - 4, this.player.y - size);
            this.playerGraphics.lineTo(this.player.x + size, this.player.y - size + 4);
            this.playerGraphics.lineTo(this.player.x + size, this.player.y + size - 4);
            this.playerGraphics.lineTo(this.player.x + size - 4, this.player.y + size);
            this.playerGraphics.lineTo(this.player.x - size + 4, this.player.y + size);
            this.playerGraphics.lineTo(this.player.x - size, this.player.y + size - 4);
            this.playerGraphics.lineTo(this.player.x - size, this.player.y - size + 4);
            this.playerGraphics.closePath();
            this.playerGraphics.fillPath();
        } else if (level === 7) {
            // Level 7: Animated inner lines
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            const offset = Math.sin(this.time.now / 500) * 2;
            this.playerGraphics.lineStyle(1.5, 0xffdd00, 0.8);
            this.playerGraphics.lineBetween(this.player.x - size + offset, this.player.y, this.player.x + size + offset, this.player.y);
            this.playerGraphics.lineBetween(this.player.x, this.player.y - size + offset, this.player.x, this.player.y + size + offset);
        } else if (level === 8) {
            // Level 8: Multiple geometric layers
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            this.playerGraphics.fillStyle(0xffdd00, 0.6);
            this.playerGraphics.fillRect(this.player.x - (size - 3), this.player.y - (size - 3), (size - 3) * 2, (size - 3) * 2);
            this.playerGraphics.fillStyle(0xffdd00, 0.3);
            this.playerGraphics.fillRect(this.player.x - (size - 6), this.player.y - (size - 6), (size - 6) * 2, (size - 6) * 2);
            this.playerGraphics.lineStyle(2, yellowColor, 1);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
        } else if (level === 9) {
            // Level 9: Pulsing glow with particles
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            const pulse = Math.sin(this.time.now / 300) * 0.5 + 0.5;
            this.playerAuraGraphics.lineStyle(2, yellowColor, pulse * 0.8);
            this.playerAuraGraphics.strokeRect(this.player.x - size - 6, this.player.y - size - 6, size * 2 + 12, size * 2 + 12);
        } else if (level === 10) {
            // Level 10: Powerful energetic aura
            const auraSize = size + 12;
            this.playerAuraGraphics.fillStyle(yellowColor, 0.2);
            this.playerAuraGraphics.fillRect(this.player.x - auraSize, this.player.y - auraSize, auraSize * 2, auraSize * 2);
            this.playerAuraGraphics.lineStyle(3, yellowColor, 0.6);
            this.playerAuraGraphics.strokeRect(this.player.x - auraSize, this.player.y - auraSize, auraSize * 2, auraSize * 2);
            this.playerGraphics.fillStyle(yellowColor, 1);
            this.playerGraphics.fillRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
            const pulse = Math.sin(this.time.now / 200) * 0.5 + 0.5;
            this.playerGraphics.lineStyle(3, yellowColor, pulse);
            this.playerGraphics.strokeRect(this.player.x - size, this.player.y - size, size * 2, size * 2);
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
                    const trail = this.add.circle(this.player.x, this.player.y, 16, 0x4ade80, 0.3);
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
        this.keys = this.input.keyboard!.addKeys('Z,X,C,V');

        // Enhanced HUD
        const hudScale = Math.max(1, width / 800);
        const fontSize = Math.floor(24 * hudScale);
        const titleFontSize = Math.floor(32 * hudScale);
        
        this.scoreText = this.add.text(16, 16, `Enemies: ${this.score.toLocaleString()} | LVL: ${this.level} (${this.levelTitle})`, { 
            fontSize: `${fontSize}px`, 
            color: '#fff', 
            fontFamily: 'Pixel',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(1000);

        this.waveText = this.add.text(width - 16, 16, 'WAVE: 1', { 
            fontSize: `${fontSize}px`, 
            color: '#fbbf24', 
            fontStyle: 'bold', 
            fontFamily: 'Pixel',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);

        this.timerText = this.add.text(width - 16, 16 + fontSize + 10, '01:00', { 
            fontSize: `${fontSize}px`, 
            color: '#fff', 
            fontStyle: 'bold', 
            fontFamily: 'Pixel',
            stroke: '#000',
            strokeThickness: 4
        }).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
        
        this.kiarcBar = this.add.graphics().setScrollFactor(0).setDepth(1000);
        this.updateHUD();

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies, platforms);
        this.physics.add.collider(this.enemies, this.enemies); // Add collision between enemies
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);

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
        if (this.currentWave === 1) sides = 4;      // Square
        else if (this.currentWave === 2) sides = 5; // Pentagon
        else if (this.currentWave === 3) sides = 6; // Hexagon
        else if (this.currentWave === 4) sides = 7; // Heptagon
        else if (this.currentWave === 5) sides = 8; // Octagon
        else if (this.currentWave === 6) sides = 9; // Nonagon
        else if (this.currentWave === 7) sides = 10; // Decagon
        else if (this.currentWave === 8) sides = 12; // Dodecagon
        else if (this.currentWave === 9) sides = 15; // Complex Polygon
        else sides = 16 + Math.random() * 4; // Arcane form variation
        
        // Custom HP Progression from User
        const hpProgression: { [key: number]: number } = {
            1: 100, 2: 180, 3: 260, 4: 360, 5: 500,
            6: 700, 7: 950, 8: 1250, 9: 1600, 10: 2000
        };
        const health = hpProgression[this.currentWave] || (2000 + (this.currentWave - 10) * 500);
        
        const normalEnemyDamage = Math.pow(1.5, this.currentWave - 1) * 0.01;
        const damage = normalEnemyDamage * 4;
        
        const baseSize = 25;
        const size = (baseSize + sides * 1.5) * 3;
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
        const shapes = [
            'SQUARE', 'PENTAGON', 'HEXAGON', 'HEPTAGON', 
            'OCTAGON', 'NONAGON', 'DECAGON', 'DODECAGON', 
            'COMPLEX POLYGON', 'ARCANE FORM'
        ];
        const shapeName = this.currentWave <= 10 ? shapes[this.currentWave - 1] : 'ARCANE FORM';
        
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

    startWave() {
        this.isWaveInterval = false;
        this.waveTimer = 60;
        this.waveText.setText(`WAVE: ${this.currentWave}`);
        this.waveText.setColor('#fbbf24');

        if (this.spawnEvent) this.spawnEvent.destroy();
        
        const baseDelay = 1500;
        const currentDelay = baseDelay / Math.pow(1.5, this.currentWave - 1);
        
        this.spawnEvent = this.time.addEvent({
            delay: Math.max(150, currentDelay),
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        const hudScale = Math.max(1, this.cameras.main.width / 800);
        const countdownFontSize = Math.floor(48 * hudScale);

        // 10-second countdown before boss spawn
        const countdownText = this.add.text(this.cameras.main.width / 2, 200, 'BOSS IN: 10', {
            fontSize: `${countdownFontSize}px`,
            color: '#ff0000',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 8,
            fontFamily: 'Pixel'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

        let timeLeft = 10;
        this.time.addEvent({
            delay: 1000,
            repeat: 9,
            callback: () => {
                timeLeft--;
                countdownText.setText(`BOSS IN: ${timeLeft}`);
                if (timeLeft <= 0) {
                    countdownText.destroy();
                    this.spawnBoss();
                }
            }
        });

        this.startTimer();
    }

    startInterval() {
        this.isWaveInterval = true;
        this.waveTimer = 30;
        this.waveText.setText('INTERVAL');
        this.waveText.setColor('#60a5fa');

        if (this.spawnEvent) this.spawnEvent.destroy();
        
        this.spawnEvent = this.time.addEvent({
            delay: 4000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.startTimer();
    }

    startTimer() {
        if (this.waveTimerEvent) this.waveTimerEvent.destroy();
        
        this.waveTimerEvent = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.waveTimer--;
                const mins = Math.floor(this.waveTimer / 60);
                const secs = this.waveTimer % 60;
                this.timerText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);

                if (this.waveTimer <= 0) {
                    if (this.isWaveInterval) {
                        this.currentWave++;
                        this.startWave();
                    } else {
                        this.startInterval();
                    }
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-400);
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(400);
            this.player.flipX = false;
        } else {
            this.player.setVelocityX(0);
        }

        // Queda rápida (Fast Fall) - Só funciona se tiver Ki (pelo menos 25%)
        if (this.cursors.down.isDown && !this.player.body?.touching.down && this.kiarc >= (this.maxKiarc * 0.25)) {
            this.player.setVelocityY(1000); // Velocidade de queda extrema
            this.player.setData('isFastFalling', true);
            this.kiarc -= 0.2; // Consumo contínuo de Ki durante a queda
        }

        // Impacto no chão (Ground Slam)
        if (this.player.body?.touching.down && this.player.getData('isFastFalling')) {
            this.kiarc -= 5; // Custo extra para o impacto
            this.handleGroundImpact();
            this.player.setData('isFastFalling', false);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-700);
        }

        if (this.cursors.up.isDown && !this.player.body?.touching.down) {
            this.player.setVelocityY(-300);
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.Z)) {
            this.attack();
        }
        
        if (this.keys.X.isDown) {
            this.chargeKiarc();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.C) && this.kiarc >= 20) {
            this.shootMagic();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.V) && this.kiarc >= (this.maxKiarc * 0.5)) {
            this.shootArcamehameha();
        }

        // Redraw player square every frame
        this.drawPlayerSquare(this.level);
        
        this.updateHUD();
    }

    handleGroundImpact() {
        // Efeito visual de tremor na câmera mais forte
        this.cameras.main.shake(400, 0.04);
        
        // Círculo de impacto visual maior
        const impactCircle = this.add.circle(this.player.x, this.player.y + 16, 20, 0x4ade80, 0.6);
        this.tweens.add({
            targets: impactCircle,
            radius: 400,
            alpha: 0,
            duration: 400,
            onComplete: () => impactCircle.destroy()
        });

        // Afastar inimigos próximos com muito mais força
        const impactRadius = 400;
        this.enemies.getChildren().forEach(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            
            if (distance < impactRadius) {
                // Calcular direção da força
                const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
                
                // Multiplicador de força aumentado significativamente
                const forceMultiplier = 15;
                const force = (impactRadius - distance) * forceMultiplier;
                
                // Aplicar velocidade explosiva
                enemy.setVelocity(
                    Math.cos(angle) * force,
                    Math.sin(angle) * force - 600 // Joga MUITO para cima
                );

                // Dano massivo pelo impacto direto
                this.hitEnemy(enemy, 1);
            }
        });
    }

    chargeKiarc() {
        if (this.kiarc < this.maxKiarc) {
            this.kiarc += 0.5;
            this.player.setTint(0xffffff); // Flash white when charging
        } else {
            this.player.setTint(0x4ade80);
        }
    }

    shootArcamehameha() {
        this.kiarc -= 50;
        const beamLength = 800;
        const beamX = this.player.x + (this.player.flipX ? -(beamLength / 2) : (beamLength / 2));
        const beam = this.add.rectangle(beamX, this.player.y, beamLength, 25, 0x4ade80, 0.7);
        this.physics.add.existing(beam);
        const body = beam.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        this.cameras.main.shake(300, 0.015);

        this.physics.add.overlap(beam, this.enemies, (b, e) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            this.hitEnemy(enemy, 50); // damage is now 50
        }, undefined, this);

        this.tweens.add({
            targets: beam,
            alpha: 0,
            duration: 400,
            onComplete: () => beam.destroy()
        });
    }

    spawnEnemy() {
        const width = this.cameras.main.width;
        const x = Phaser.Math.Between(width / 2, width - 50);
        const enemy = this.enemies.create(x, 0, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        enemy.setBounce(0.2);
        enemy.setCollideWorldBounds(true);
        
        // At wave 1: size=1, damage=1
        // At wave 2: size=1.5, damage=1.5
        // At wave 3: size=2.25, damage=2.25
        const multiplier = Math.pow(1.5, this.currentWave - 1);
        enemy.setScale(multiplier);
        enemy.setData('damage', multiplier * 0.01); // Mantendo base de dano baixa

        // 10% more velocity per wave
        const difficultyMultiplier = Math.pow(1.1, this.currentWave - 1);
        enemy.setVelocityX(Phaser.Math.Between(-150, 150) * difficultyMultiplier);
        enemy.setData('health', 1);
    }

    attack() {
        const punchX = this.player.flipX ? this.player.x - 60 : this.player.x + 60;
        const targets = this.enemies.getChildren().filter(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            return Phaser.Math.Distance.Between(punchX, this.player.y, enemy.x, enemy.y) < 80;
        });
        
        targets.forEach(e => {
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, 10); // damage is now 10
        });
    }

    shootMagic() {
        this.kiarc -= 20;
        const magic = this.add.circle(this.player.x, this.player.y, 15, 0x60a5fa);
        this.physics.add.existing(magic);
        const body = magic.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(this.player.flipX ? -800 : 800);
        
        this.physics.add.overlap(magic, this.enemies, (m, e) => {
            m.destroy();
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, 10); // damage is now 10
        }, undefined, this);
    }

    hitEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number) {
        let health = enemy.getData('health') || 1;
        health -= damage;
        enemy.setData('health', health);

        // Visual feedback for hitting
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) {
                enemy.setTint(enemy.getData('isBoss') ? 0xff0000 : 0xffffff);
                if (!enemy.getData('isBoss')) enemy.clearTint();
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
            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-5, 5),
                duration: 50,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (enemy.getData('isBoss')) {
                        const bossScore = 20 * Math.pow(5, this.currentWave - 1);
                        this.score += bossScore;
                        this.cameras.main.flash(500, 255, 0, 0);
                        
                        // Boss defeat special effect - pulse from top to bottom
                        const scoreText = this.add.text(enemy.x, enemy.y - 80, `+${bossScore.toLocaleString()}`, {
                            fontSize: '48px',
                            color: '#fbbf24',
                            fontStyle: 'bold',
                            stroke: '#000',
                            strokeThickness: 6,
                            fontFamily: '"8-BIT WONDER"'
                        }).setOrigin(0.5).setScrollFactor(1);
                        
                        // Pulse animation from top to bottom
                        this.tweens.add({
                            targets: scoreText,
                            scaleY: 1.5,
                            alpha: 0,
                            y: enemy.y + 40,
                            duration: 1500,
                            ease: 'Quad.easeOut',
                            onComplete: () => scoreText.destroy()
                        });
                    } else {
                        this.score++;
                    }

                    // Check level up
                    const result = this.getLevelTitle(this.score);
                    if (result.level > this.level) {
                        this.level = result.level;
                        this.levelTitle = result.title;
                        this.cameras.main.flash(500, 0, 255, 0);
                        
                        // Level Up text above player - pulse from bottom to top
                        const levelUpText = this.add.text(this.player.x, this.player.y - 100, `Level Up\n${this.levelTitle}`, {
                            fontSize: '48px',
                            color: '#4ade80',
                            fontStyle: 'bold',
                            stroke: '#000',
                            strokeThickness: 8,
                            align: 'center',
                            fontFamily: '"8-BIT WONDER"'
                        }).setOrigin(0.5).setScrollFactor(1);
                        
                        // Pulse animation from bottom to top
                        this.tweens.add({
                            targets: levelUpText,
                            scaleY: 1.5,
                            alpha: 0,
                            y: this.player.y - 180,
                            duration: 1500,
                            ease: 'Quad.easeOut',
                            onComplete: () => levelUpText.destroy()
                        });
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
        this.cameras.main.shake(500, 0.05);

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

    handlePlayerEnemyCollision(obj1: any, obj2: any) {
        if (this.isGameOver || this.isWaveInterval) return;
        const enemy = obj2 as Phaser.Physics.Arcade.Sprite;
        const damage = enemy.getData('damage') !== undefined ? enemy.getData('damage') : 0.01;
        this.health -= damage;
        
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

    updateHUD() {
        // Character level progression logic based on enemies defeated
        const nextLevelThreshold = this.level * 10;
        if (this.enemiesDefeated >= nextLevelThreshold && this.level < 10) {
            this.level++;
            
            const titles = [
                'Arc Initiate', 'Arc Squire', 'Arc Warrior', 'Arc Knight', 
                'Arc Commander', 'Arc Master', 'Arc Grandmaster', 
                'Arc Sage', 'Arc Eternal', 'Arc Divine'
            ];
            this.levelTitle = titles[this.level - 1];
            
            this.updatePlayerVisual();
        }

        if (this.scoreText) {
            this.scoreText.setText(`Enemies: ${this.score.toLocaleString()} | LVL: ${this.level} (${this.levelTitle})`);
        }

        this.kiarcBar.clear();
        
        // ARCki Bar (Verde)
        this.kiarcBar.fillStyle(0x333333);
        this.kiarcBar.fillRect(16, 105, 300, 20);
        this.kiarcBar.fillStyle(0x4ade80);
        this.kiarcBar.fillRect(16, 105, (this.kiarc / this.maxKiarc) * 300, 20);
        
        if (!this.kiLabel) {
            this.kiLabel = this.add.text(325, 105, 'ARCki', { fontSize: '16px', color: '#4ade80', fontStyle: 'bold', fontFamily: 'Pixel' });
        }

        // ARChp Bar (Vermelho)
        this.kiarcBar.fillStyle(0x333333);
        this.kiarcBar.fillRect(16, 135, 300, 15);
        this.kiarcBar.fillStyle(0xff0000);
        this.kiarcBar.fillRect(16, 135, (this.health / 100) * 300, 15);

        if (!this.hpLabel) {
            this.hpLabel = this.add.text(325, 135, 'ARChp', { fontSize: '16px', color: '#ff0000', fontStyle: 'bold', fontFamily: 'Pixel' });
        }
    }

    private kiLabel!: Phaser.GameObjects.Text;
    private hpLabel!: Phaser.GameObjects.Text;
}

const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 1600,
    height: 1200,
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
