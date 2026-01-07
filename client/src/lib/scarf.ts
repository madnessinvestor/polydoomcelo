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
    private numSegments: number = 7;
    private segmentLength: number = 7;
    private gravity: number = 0.15;
    private friction: number = 0.92;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.Physics.Arcade.Sprite;
    private color: number = 0xffdd00; // Amarelo do player
    private anchorOffsetY: number = -6; // Posição do pescoço
    private baseWidth: number = 16; // Largura da capa no pescoço
    private tipWidth: number = 30;  // Largura da capa na ponta
    private alpha: number = 0.7; // 30% mais transparente (1.0 - 0.3)

    constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        // A capa principal fica atrás (depth 9), o detalhe frontal na frente (depth 11)
        this.graphics.setDepth(9);

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

        // Primeiro segmento é a âncora absoluta
        const seg0 = this.segments[0];
        seg0.x = this.target.x;
        seg0.y = this.target.y + this.anchorOffsetY;

        // Física para os outros segmentos
        for (let i = 1; i < this.numSegments; i++) {
            const seg = this.segments[i];
            const vx = (seg.x - seg.oldX) * this.friction;
            const vy = (seg.y - seg.oldY) * this.friction;

            seg.oldX = seg.x;
            seg.oldY = seg.y;
            seg.x += vx;
            seg.y += vy;
            seg.y += this.gravity;

            // Brisa sutil
            if (Math.abs(playerVelocityX) < 1 && Math.abs(playerVelocityY) < 1) {
                const time = this.scene.time.now * 0.002;
                seg.x += Math.sin(time + i * 0.5) * 0.1;
            } else {
                // Inércia baseada no movimento (projeção para trás)
                seg.x -= playerVelocityX * 0.04;
                seg.y -= playerVelocityY * 0.02;
            }
        }

        // Constraints refinadas para evitar "quebra" visual
        // Usamos mais sub-passos para garantir que os segmentos não se separem
        for (let j = 0; j < 5; j++) {
            for (let i = 0; i < this.numSegments - 1; i++) {
                const s1 = this.segments[i];
                const s2 = this.segments[i + 1];

                const dx = s2.x - s1.x;
                const dy = s2.y - s1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance === 0) continue;
                
                const error = distance - this.segmentLength;
                const offsetX = (dx / distance) * error;
                const offsetY = (dy / distance) * error;

                // O segmento 0 nunca move. O 1 move menos que os outros para rigidez na base.
                if (i === 0) {
                    s2.x -= offsetX;
                    s2.y -= offsetY;
                } else {
                    const ratio = 0.5;
                    s1.x += offsetX * ratio;
                    s1.y += offsetY * ratio;
                    s2.x -= offsetX * (1 - ratio);
                    s2.y -= offsetY * (1 - ratio);
                }
            }
            // Re-ancorar o segmento 0 após o relaxamento das constraints
            this.segments[0].x = this.target.x;
            this.segments[0].y = this.target.y + this.anchorOffsetY;
        }

        this.draw();
    }

    private draw() {
        this.graphics.clear();
        
        const startX = this.target.x;
        const startY = this.target.y + this.anchorOffsetY;

        // 1. DESENHO DA PARTE FRONTAL (ENVOLVENDO O QUADRADO)
        // Isso dá a percepção de que está fixada AO REDOR
        this.graphics.setDepth(11); // Forçamos o desenho para frente do player
        this.graphics.lineStyle(4, this.color, this.alpha);
        this.graphics.strokeEllipse(startX, startY, this.baseWidth * 0.8, 6);
        this.graphics.fillStyle(this.color, this.alpha);
        this.graphics.fillEllipse(startX, startY, this.baseWidth * 0.7, 5);

        // 2. DESENHO DA PARTE TRASEIRA (CAPA)
        this.graphics.setDepth(9); // Voltamos para trás do player para o corpo da capa
        
        // Usamos um desenho de malha contínua para evitar buracos ou quebras
        for (let i = 0; i < this.numSegments - 1; i++) {
            const s1 = this.segments[i];
            const s2 = this.segments[i + 1];

            const dx = s2.x - s1.x;
            const dy = s2.y - s1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            const w1 = this.baseWidth + (this.tipWidth - this.baseWidth) * (i / (this.numSegments - 1));
            const w2 = this.baseWidth + (this.tipWidth - this.baseWidth) * ((i + 1) / (this.numSegments - 1));
            
            // Desenha trapézios sobrepostos para suavizar a forma
            this.graphics.fillStyle(this.color, this.alpha);
            this.graphics.fillPoints([
                new Phaser.Geom.Point(s1.x + nx * (w1/2), s1.y + ny * (w1/2)),
                new Phaser.Geom.Point(s1.x - nx * (w1/2), s1.y - ny * (w1/2)),
                new Phaser.Geom.Point(s2.x - nx * (w2/2), s2.y - ny * (w2/2)),
                new Phaser.Geom.Point(s2.x + nx * (w2/2), s2.y + ny * (w2/2))
            ], true);
        }
    }

    destroy() {
        this.graphics.destroy();
    }
}
