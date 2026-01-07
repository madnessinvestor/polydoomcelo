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
    private numSegments: number = 8;
    private segmentLength: number = 4;
    private gravity: number = 0.15;
    private friction: number = 0.95;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible;
    private color: number = 0xffdd00; // Amarelo do player

    constructor(scene: Phaser.Scene, target: Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.Visible) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(target instanceof Phaser.GameObjects.GameObject ? (target as any).depth - 1 : 5);

        // Initialize segments
        for (let i = 0; i < this.numSegments; i++) {
            this.segments.push({
                x: target.x,
                y: target.y,
                oldX: target.x,
                oldY: target.y
            });
        }
    }

    update(playerVelocityX: number, playerVelocityY: number) {
        if (!this.target.visible) {
            this.graphics.clear();
            return;
        }

        const firstSegment = this.segments[0];
        // Ancorado ao torso superior/pescoço
        firstSegment.x = this.target.x;
        firstSegment.y = this.target.y - 5;

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
            if (playerVelocityX === 0 && playerVelocityY === 0) {
                const time = this.scene.time.now * 0.002;
                seg.x += Math.sin(time + i) * 0.1;
                seg.y += Math.cos(time * 0.5 + i) * 0.05;
            } else {
                // Inércia baseada no movimento do player
                seg.x -= playerVelocityX * 0.02;
                seg.y -= playerVelocityY * 0.02;
            }
        }

        // Constraints
        for (let i = 0; i < this.numSegments - 1; i++) {
            const seg1 = this.segments[i];
            const seg2 = this.segments[i + 1];

            const dx = seg2.x - seg1.x;
            const dy = seg2.y - seg1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const error = distance - this.segmentLength;
            const offsetX = (dx / distance) * error;
            const offsetY = (dy / distance) * error;

            seg2.x -= offsetX;
            seg2.y -= offsetY;
        }

        this.draw();
    }

    private draw() {
        this.graphics.clear();
        this.graphics.lineStyle(4, this.color, 1);
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
