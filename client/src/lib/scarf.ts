import Phaser from 'phaser';

export interface ScarfSegment {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
}

export class ScarfComponent {
    private scene: Phaser.Scene;
    private segments: ScarfSegment[] = [];
    private numSegments: number = 6;
    private segmentLength: number = 4;
    private gravity: number = 0.15;
    private friction: number = 0.95;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.Physics.Arcade.Sprite;
    private color: number = 0xffdd00; // Amarelo do player
    private anchorOffsetY: number = 6; // Torso superior

    constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        // Garantir que o desenho ocorra após o player (player depth é 10, então scarf depth 11)
        this.graphics.setDepth(11);

        console.log("ScarfComponent inicializado no player:", target.x, target.y);

        // Initialize segments
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({
                x: target.x,
                y: target.y + this.anchorOffsetY + (i * this.segmentLength),
                oldX: target.x,
                oldY: target.y + this.anchorOffsetY + (i * this.segmentLength)
            });
        }
    }

    update(playerVelocityX: number, playerVelocityY: number) {
        if (!this.target || !this.target.active || !this.target.visible) {
            this.graphics.clear();
            return;
        }

        const firstSegment = this.segments[0];
        // Ancorado ao torso superior
        firstSegment.x = this.target.x;
        firstSegment.y = this.target.y + this.anchorOffsetY;

        // Verlet integration
        for (let i = 1; i < this.numSegments; i++) {
            const seg = this.segments[i];
            const vx = (seg.x - seg.oldX) * this.friction;
            const vy = (seg.y - seg.oldY) * this.friction;

            seg.oldX = seg.x;
            seg.oldY = seg.y;
            seg.x += vx;
            seg.y += vy;
            seg.y += this.gravity;

            // Brisa / Vento procedural (Idle)
            if (Math.abs(playerVelocityX) < 1 && Math.abs(playerVelocityY) < 1) {
                const time = this.scene.time.now * 0.002;
                seg.x += Math.sin(time + i) * 0.15;
                seg.y += Math.cos(time * 0.5 + i) * 0.08;
            } else {
                // Inércia baseada no movimento do player (projeção para trás)
                // Se playerVelocityX > 0 (movendo para direita), o cachecol deve ir para esquerda (seg.x -= ...)
                seg.x -= playerVelocityX * 0.05;
                seg.y -= playerVelocityY * 0.05;
            }
        }

        // Constraints
        for (let j = 0; j < 3; j++) { // Sub-passos para estabilidade
            for (let i = 0; i < this.numSegments - 1; i++) {
                const seg1 = this.segments[i];
                const seg2 = this.segments[i + 1];

                const dx = seg2.x - seg1.x;
                const dy = seg2.y - seg1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance === 0) continue;
                
                const error = distance - this.segmentLength;
                const offsetX = (dx / distance) * error;
                const offsetY = (dy / distance) * error;

                seg2.x -= offsetX;
                seg2.y -= offsetY;
            }
        }

        this.draw();
    }

    private draw() {
        this.graphics.clear();
        
        // Desenha o cachecol
        this.graphics.lineStyle(3, this.color, 1);
        this.graphics.beginPath();
        this.graphics.moveTo(this.segments[0].x, this.segments[0].y);

        for (let i = 1; i < this.numSegments; i++) {
            this.graphics.lineTo(this.segments[i].x, this.segments[i].y);
        }
        this.graphics.strokePath();
    }

    destroy() {
        this.graphics.destroy();
    }
}
