import Phaser from 'phaser';

export interface ScarfSegment {
    x: number;
    y: number;
    oldX: number;
    oldY: number;
    width: number;
}

export class ScarfComponent {
    private scene: Phaser.Scene;
    private segments: ScarfSegment[] = [];
    private numSegments: number = 10;
    private segmentLength: number = 7;
    private gravity: number = 0.15;
    private friction: number = 0.95;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.Physics.Arcade.Sprite;
    private color: number = 0xffdd00; // Amarelo do player
    private anchorOffsetY: number = -8; // Posição do pescoço
    private baseWidth: number = 12;

    constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(11);

        // Initialize segments with tapering width
        for (let i = 0; i < this.numSegments; i++) {
            // Tapering: 100% width at neck, down to 30% at the tip
            const widthScale = 1 - (i / (this.numSegments - 1)) * 0.7;
            this.segments.push({
                x: target.x,
                y: target.y + this.anchorOffsetY + (i * this.segmentLength),
                oldX: target.x,
                oldY: target.y + this.anchorOffsetY + (i * this.segmentLength),
                width: this.baseWidth * widthScale
            });
        }
    }

    update(playerVelocityX: number, playerVelocityY: number) {
        if (!this.target || !this.target.active || !this.target.visible) {
            this.graphics.clear();
            return;
        }

        const firstSegment = this.segments[0];
        // Ancorado ao pescoço
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
                seg.x += Math.sin(time + i * 0.5) * 0.2;
                seg.y += Math.cos(time * 0.5 + i * 0.3) * 0.1;
            } else {
                // Inércia baseada no movimento do player
                seg.x -= playerVelocityX * 0.06;
                seg.y -= playerVelocityY * 0.04;
            }
        }

        // Constraints
        for (let j = 0; j < 3; j++) {
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
        
        // Efeito tramado: desenhamos polígonos preenchidos entre os segmentos
        // para criar uma fita que afunila, em vez de apenas uma linha
        for (let i = 0; i < this.numSegments - 1; i++) {
            const s1 = this.segments[i];
            const s2 = this.segments[i + 1];

            // Vetor normal para a largura (perpendicular à direção do segmento)
            const dx = s2.x - s1.x;
            const dy = s2.y - s1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            // Pontos do trapézio para este segmento
            const p1x = s1.x + nx * (s1.width / 2);
            const p1y = s1.y + ny * (s1.width / 2);
            const p2x = s1.x - nx * (s1.width / 2);
            const p2y = s1.y - ny * (s1.width / 2);
            
            const p3x = s2.x - nx * (s2.width / 2);
            const p3y = s2.y - ny * (s2.width / 2);
            const p4x = s2.x + nx * (s2.width / 2);
            const p4y = s2.y + ny * (s2.width / 2);

            // Preenchimento sólido
            this.graphics.fillStyle(this.color, 1);
            this.graphics.fillPoints([
                new Phaser.Geom.Point(p1x, p1y),
                new Phaser.Geom.Point(p2x, p2y),
                new Phaser.Geom.Point(p3x, p3y),
                new Phaser.Geom.Point(p4x, p4y)
            ], true);

            // "Tramado" sutil - linhas de textura diagonais
            if (i % 2 === 0) {
                this.graphics.lineStyle(1, 0x000000, 0.1);
                this.graphics.lineBetween(p1x, p1y, p3x, p3y);
                this.graphics.lineBetween(p2x, p2y, p4x, p4y);
            }
        }
        
        // Detalhe do "nó" no pescoço (primeiro segmento)
        this.graphics.lineStyle(2, this.color, 1);
        this.graphics.strokeCircle(this.segments[0].x, this.segments[0].y, this.baseWidth * 0.6);
        this.graphics.fillStyle(this.color, 0.8);
        this.graphics.fillCircle(this.segments[0].x, this.segments[0].y, this.baseWidth * 0.5);
    }

    destroy() {
        this.graphics.destroy();
    }
}
