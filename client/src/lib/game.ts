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
        for (let i = 0; i < 25; i++) {
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
            fontSize: '24px', 
            color: '#4ade80',
            fontStyle: 'bold'
        }).setOrigin(0.5);
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-250);
            this.player.flipX = true;
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(250);
            this.player.flipX = false;
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-500);
        }

        if (this.cursors.up.isDown && !this.player.body?.touching.down) {
            this.player.setVelocityY(-200);
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

        this.updateHUD();
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(400, 750);
        const enemy = this.enemies.create(x, 0, 'criptoide_basic') as Phaser.Physics.Arcade.Sprite;
        enemy.setBounce(0.2);
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(Phaser.Math.Between(-100, 100));
    }

    attack() {
        const punchX = this.player.flipX ? this.player.x - 40 : this.player.x + 40;
        const targets = this.enemies.getChildren().filter(e => {
            const enemy = e as Phaser.Physics.Arcade.Sprite;
            return Phaser.Math.Distance.Between(punchX, this.player.y, enemy.x, enemy.y) < 50;
        });
        
        targets.forEach(e => {
            e.destroy();
            this.score++;
            this.scoreText.setText('Inimigos: ' + this.score);
        });
    }

    chargeKiarc() {
        if (this.kiarc < this.maxKiarc) {
            this.kiarc += 0.5;
            this.player.setTint(0x4ade80);
        } else {
            this.player.clearTint();
        }
    }

    shootMagic() {
        this.kiarc -= 20;
        const magic = this.add.circle(this.player.x, this.player.y, 10, 0x60a5fa);
        this.physics.add.existing(magic);
        const body = magic.body as Phaser.Physics.Arcade.Body;
        body.setAllowGravity(false);
        body.setVelocityX(this.player.flipX ? -600 : 600);
        
        this.physics.add.overlap(magic, this.enemies, (m, e) => {
            m.destroy();
            e.destroy();
            this.score++;
            this.scoreText.setText('Inimigos: ' + this.score);
        }, undefined, this);
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
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 1000 },
            debug: false
        }
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
