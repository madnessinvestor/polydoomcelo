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
        // Aumentar número de plataformas para cobrir a largura maior
        for (let i = 0; i < 50; i++) {
            platforms.create(i * 32, height - 16, 'jungle_tiles', 0).refreshBody();
        }

        this.player = this.physics.add.sprite(100, height - 100, 'gokuarc');
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, platforms);

        this.cursors = this.input.keyboard!.createCursorKeys();
        this.keys = this.input.keyboard!.addKeys('Z,X,C,V');

        this.scoreText = this.add.text(16, 16, 'Inimigos: 0', { fontSize: '20px', color: '#fff' });
        this.kiarcBar = this.add.graphics();
        this.updateHUD();

        this.enemies = this.physics.add.group();
        this.physics.add.collider(this.enemies, platforms);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerEnemyCollision, undefined, this);

        this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        this.add.text(width / 2, 30, 'GOKUARC VS CRIPTOIDES', { 
            fontSize: '32px', 
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-400); // Velocidade maior para tela maior
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(400);
            this.player.flipX = false;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-700); // Pulo maior
        }

        if (this.cursors.up.isDown && !this.player.body?.touching.down) {
            this.player.setVelocityY(-300); // Voo mais potente
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

        if (Phaser.Input.Keyboard.JustDown(this.keys.V) && this.kiarc >= 50) {
            this.shootArcamehameha();
        }

        this.updateHUD();
    }

    chargeKiarc() {
        if (this.kiarc < this.maxKiarc) {
            this.kiarc += 0.5;
            this.player.setTint(0x4ade80);
        } else {
            this.player.clearTint();
        }
    }

    shootArcamehameha() {
        this.kiarc -= 50;
        // Aumentando o comprimento do raio de 400 para 800 e ajustando o offset
        const beamLength = 800;
        const beamX = this.player.x + (this.player.flipX ? -(beamLength / 2) : (beamLength / 2));
        const beam = this.add.rectangle(beamX, this.player.y, beamLength, 25, 0x4ade80, 0.7);
        this.physics.add.existing(beam);
        const body = beam.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        
        // Efeito visual de tremor na câmera ao disparar
        this.cameras.main.shake(300, 0.015);

        this.physics.add.overlap(beam, this.enemies, (b, e) => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            this.hitEnemy(enemy, 100); // Dano massivo
        }, undefined, this);

        // Adicionar um efeito de brilho ou partículas se possível, mas mantendo simples
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
        enemy.setVelocityX(Phaser.Math.Between(-150, 150));
        enemy.setData('health', 1);
    }

    attack() {
        const punchX = this.player.flipX ? this.player.x - 60 : this.player.x + 60; // Alcance soco maior
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
        const magic = this.add.circle(this.player.x, this.player.y, 15, 0x60a5fa); // Magia maior
        this.physics.add.existing(magic);
        const body = magic.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(this.player.flipX ? -800 : 800); // Magia mais rápida
        
        this.physics.add.overlap(magic, this.enemies, (m, e) => {
            m.destroy();
            this.hitEnemy(e as Phaser.Physics.Arcade.Sprite, 1);
        }, undefined, this);
    }

    hitEnemy(enemy: Phaser.Physics.Arcade.Sprite, damage: number) {
        // Efeito de trepidação (impacto)
        this.tweens.add({
            targets: enemy,
            x: enemy.x + Phaser.Math.Between(-5, 5),
            duration: 50,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                enemy.destroy();
                this.score++;
                this.scoreText.setText('Inimigos: ' + this.score);
            }
        });
    }

    handlePlayerEnemyCollision() {
        this.health -= 0.01;
        if (this.health < 0) this.health = 0;
    }

    updateHUD() {
        this.kiarcBar.clear();
        this.kiarcBar.fillStyle(0x333333);
        this.kiarcBar.fillRect(16, 45, 200, 15);
        this.kiarcBar.fillStyle(0x4ade80);
        this.kiarcBar.fillRect(16, 45, (this.kiarc / this.maxKiarc) * 200, 15);
        this.kiarcBar.fillStyle(0xff0000);
        this.kiarcBar.fillRect(16, 65, (this.health / 100) * 200, 10);
    }
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
