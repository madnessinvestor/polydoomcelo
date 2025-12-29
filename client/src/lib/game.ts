import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
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

    constructor() {
        super('MainScene');
    }

    preload() {
        this.load.spritesheet('gokuarc', '/attached_assets/generated_images/pixel_art_gokuarc_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('criptoide_basic', '/attached_assets/generated_images/pixel_art_criptoide_basic_sprite_sheet.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('jungle_tiles', '/attached_assets/generated_images/pixel_art_jungle_tileset.png', { frameWidth: 32, frameHeight: 32 });
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.add.rectangle(0, 0, width * 2, height * 2, 0x0a0a20).setOrigin(0);
        
        const platforms = this.physics.add.staticGroup();
        for (let i = 0; i < 50; i++) {
            platforms.create(i * 32, height - 16, 'jungle_tiles', 0).refreshBody();
        }

        this.player = this.physics.add.sprite(100, height - 100, 'gokuarc');
        this.player.setCollideWorldBounds(true);
        this.player.setTint(0x4ade80); // Green triangle
        this.player.setScale(1.5);
        this.physics.add.collider(this.player, platforms);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('Z,X,C,V');

        // Enhanced HUD
        this.scoreText = this.add.text(16, 16, 'Inimigos: 0', { fontSize: '24px', color: '#fff' });
        this.waveText = this.add.text(16, 50, 'WAVE: 1', { fontSize: '32px', color: '#fbbf24', fontStyle: 'bold' });
        this.timerText = this.add.text(width - 150, 16, '01:00', { fontSize: '32px', color: '#fff', fontStyle: 'bold' });
        
        this.kiarcBar = this.add.graphics();
        this.updateHUD();

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies, platforms);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);

        this.startWave();

        this.add.text(width / 2, 30, 'GOKUARC VS CRIPTOIDES', { 
            fontSize: '32px', 
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    private spawnBoss() {
        const width = this.cameras.main.width;
        const x = width / 2;
        const boss = this.enemies.create(x, 100, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        boss.setBounce(0.5);
        boss.setCollideWorldBounds(true);
        boss.setTint(0xff0000); // Bosses are solid red
        boss.setAlpha(1); // Ensure full opacity
        
        // Geometric Boss Progression
        const sides = this.currentWave + 3;
        const health = sides * 15; 
        
        // At wave 1: normal enemy damage = 0.01
        // Boss damage must be 4x normal enemy
        // Normal enemy damage also scales by wave (multiplier = 1.5^(wave-1))
        const normalEnemyDamage = Math.pow(1.5, this.currentWave - 1) * 0.01;
        const damage = normalEnemyDamage * 4; 
        
        const size = 3 + (sides * 0.3); 

        boss.setScale(size);
        boss.setData('health', health);
        boss.setData('maxHealth', health);
        boss.setData('damage', damage);
        boss.setData('isBoss', true);
        boss.setData('sides', sides);

        // Visual name or shape representation
        const shapes = [
            'QUADRADO', 'PENTÁGONO', 'HEXÁGONO', 'HEPTÁGONO', 
            'OCTÓGONO', 'NONÁGONO', 'DECÁGONO', 'ENNEÁGONO', 
            'DODECÁGONO', 'POLÍGONO COMPLEXO'
        ];
        const shapeName = this.currentWave <= 10 ? shapes[this.currentWave - 1] : 'FORMA ARCANA';
        
        const bossText = this.add.text(x, 50, `CHEFE: ${shapeName}`, { 
            fontSize: '36px', // Larger text
            color: '#ff0000', 
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0);

        // Simple boss health bar
        const healthBar = this.add.graphics();
        this.events.on('update', () => {
            if (boss.active) {
                healthBar.clear();
                // Bar background
                healthBar.fillStyle(0x000000, 1);
                healthBar.fillRect(boss.x - 75, boss.y - 80, 150, 15);
                // Health fill
                healthBar.fillStyle(0xff0000, 1);
                const healthRatio = boss.getData('health') / health;
                healthBar.fillRect(boss.x - 75, boss.y - 80, healthRatio * 150, 15);
                // Outline
                healthBar.lineStyle(2, 0xffffff, 1);
                healthBar.strokeRect(boss.x - 75, boss.y - 80, 150, 15);
            } else {
                healthBar.destroy();
                bossText.destroy();
            }
        });
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

        // Spawn Boss at the start of each wave
        this.spawnBoss();

        this.startTimer();
    }

    startInterval() {
        this.isWaveInterval = true;
        this.waveTimer = 30;
        this.waveText.setText('INTERVALO');
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
            this.hitEnemy(enemy, 100);
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
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, 1);
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
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, 1);
        }, undefined, this);
    }

    hitEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number) {
        let health = enemy.getData('health') || 1;
        health -= damage;
        enemy.setData('health', health);

        if (health <= 0) {
            this.tweens.add({
                targets: enemy,
                x: enemy.x + Phaser.Math.Between(-5, 5),
                duration: 50,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    if (enemy.getData('isBoss')) {
                        this.score += 50; // Extra points for boss
                        this.cameras.main.flash(500, 255, 0, 0);
                    } else {
                        this.score++;
                    }
                    enemy.destroy();
                    this.scoreText.setText('Inimigos: ' + this.score);
                }
            });
        } else {
            // Flash white when hit but not dead
            enemy.setTint(0xffffff);
            this.time.delayedCall(100, () => {
                if (enemy.active) {
                    enemy.setTint(enemy.getData('isBoss') ? 0xff0000 : 0xffffff);
                    if (!enemy.getData('isBoss')) enemy.clearTint();
                }
            });
        }
    }

    handlePlayerEnemyCollision(obj1: any, obj2: any) {
        if (this.isWaveInterval) return;
        const enemy = obj2 as Phaser.Physics.Arcade.Sprite;
        const damage = enemy.getData('damage') !== undefined ? enemy.getData('damage') : 0.01;
        this.health -= damage;
        if (this.health < 0) this.health = 0;
    }

    updateHUD() {
        this.kiarcBar.clear();
        
        // ARCki Bar (Verde)
        this.kiarcBar.fillStyle(0x333333);
        this.kiarcBar.fillRect(16, 105, 300, 20);
        this.kiarcBar.fillStyle(0x4ade80);
        this.kiarcBar.fillRect(16, 105, (this.kiarc / this.maxKiarc) * 300, 20);
        
        if (!this.kiLabel) {
            this.kiLabel = this.add.text(325, 105, 'ARCki', { fontSize: '16px', color: '#4ade80', fontStyle: 'bold' });
        }

        // ARChp Bar (Vermelho)
        this.kiarcBar.fillStyle(0x333333);
        this.kiarcBar.fillRect(16, 135, 300, 15);
        this.kiarcBar.fillStyle(0xff0000);
        this.kiarcBar.fillRect(16, 135, (this.health / 100) * 300, 15);

        if (!this.hpLabel) {
            this.hpLabel = this.add.text(325, 135, 'ARChp', { fontSize: '16px', color: '#ff0000', fontStyle: 'bold' });
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
        powerPreference: 'high-performance'
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
