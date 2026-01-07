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
    private numSegments: number = 4;
    private segmentLength: number = 8;
    private gravity: number = 0.15;
    private friction: number = 0.9;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.Physics.Arcade.Sprite;
    private color: number = 0xffdd00; // Amarelo do player
    private anchorOffsetY: number = -6; // Posição do pescoço
    private baseWidth: number = 16; // Largura da capa no pescoço
    private tipWidth: number = 24;  // Largura da capa na ponta

    constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        // Coloca a capa ATRÁS do player (player depth é 10, então capa depth 9)
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

        // Segmentos 0 e 1 são rígidos e seguem o player
        const seg0 = this.segments[0];
        const seg1 = this.segments[1];

        // Ancoragem rígida no pescoço
        seg0.x = this.target.x;
        seg0.y = this.target.y + this.anchorOffsetY;
        
        // Segmento 1 segue a orientação do movimento
        const dirX = playerVelocityX !== 0 ? (playerVelocityX > 0 ? -1 : 1) : 0;
        seg1.x = seg0.x + dirX * 3;
        seg1.y = seg0.y + 4;

        // Física apenas nos segmentos finais (2 e 3)
        for (let i = 2; i < this.numSegments; i++) {
            const seg = this.segments[i];
            const vx = (seg.x - seg.oldX) * this.friction;
            const vy = (seg.y - seg.oldY) * this.friction;

            seg.oldX = seg.x;
            seg.oldY = seg.y;
            seg.x += vx;
            seg.y += vy;
            seg.y += this.gravity;

            // Brisa sutil quando parado
            if (Math.abs(playerVelocityX) < 1 && Math.abs(playerVelocityY) < 1) {
                const time = this.scene.time.now * 0.002;
                seg.x += Math.sin(time + i) * 0.15;
            } else {
                // Inércia na ponta (projeção para trás)
                seg.x -= playerVelocityX * 0.05;
                seg.y -= playerVelocityY * 0.02;
            }
        }

        // Constraints para manter a forma
        for (let j = 0; j < 3; j++) {
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

                s2.x -= offsetX;
                s2.y -= offsetY;
            }
        }

        this.draw();
    }

    private draw() {
        this.graphics.clear();
        this.graphics.fillStyle(this.color, 1);
        
        // Desenha a gola (envolto no pescoço) - Desenha na frente se necessário, 
        // mas aqui mantemos o estilo da imagem onde a capa sai de trás dos ombros
        this.graphics.fillEllipse(this.target.x, this.target.y + this.anchorOffsetY, this.baseWidth, 6);

        // Desenha a capa como uma forma de trapézio pixelado que abre até a ponta
        for (let i = 0; i < this.numSegments - 1; i++) {
            const s1 = this.segments[i];
            const s2 = this.segments[i + 1];

            // Vetor normal para a largura
            const dx = s2.x - s1.x;
            const dy = s2.y - s1.y;
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const nx = -dy / len;
            const ny = dx / len;

            // Largura progride da base para a ponta (estilo leque/capa)
            const w1 = this.baseWidth + (this.tipWidth - this.baseWidth) * (i / (this.numSegments - 1));
            const w2 = this.baseWidth + (this.tipWidth - this.baseWidth) * ((i + 1) / (this.numSegments - 1));
            
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
