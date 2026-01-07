import Phaser from 'phaser';

export class ScarfComponent {
    private scene: Phaser.Scene;
    private graphics: Phaser.GameObjects.Graphics;
    private target: Phaser.Physics.Arcade.Sprite;
    private color: number = 0xffdd00; // Amarelo do player
    private anchorOffsetY: number = -8; // Posição do pescoço
    
    // Pontos de controle para a curva de Bezier
    private tipX: number = 0;
    private tipY: number = 0;
    private midX: number = 0;
    private midY: number = 0;
    
    // Velocidade suavizada da ponta
    private tipVelocityX: number = 0;
    private tipVelocityY: number = 0;
    
    private readonly length: number = 22;
    private readonly thickness: number = 4;

    constructor(scene: Phaser.Scene, target: Phaser.Physics.Arcade.Sprite) {
        this.scene = scene;
        this.target = target;
        this.graphics = scene.add.graphics();
        this.graphics.setDepth(11);
        
        // Inicializa posições
        this.tipX = target.x;
        this.tipY = target.y + this.anchorOffsetY + this.length;
        this.midX = target.x;
        this.midY = target.y + this.anchorOffsetY + this.length * 0.5;
    }

    update(playerVelocityX: number, playerVelocityY: number) {
        if (!this.target || !this.target.active || !this.target.visible) {
            this.graphics.clear();
            return;
        }

        const startX = this.target.x;
        const startY = this.target.y + this.anchorOffsetY;

        // Física simplificada para a ponta (Inércia + Gravidade + Brisa)
        const targetTipX = startX - playerVelocityX * 0.15;
        const targetTipY = startY + (playerVelocityY < 0 ? 10 : 20) - playerVelocityY * 0.1;
        
        // Brisa sutil
        const time = this.scene.time.now * 0.003;
        const breezeX = Math.sin(time) * 2;
        const breezeY = Math.cos(time * 0.5) * 1;

        // Suavização do movimento da ponta (Damping)
        this.tipX += (targetTipX + breezeX - this.tipX) * 0.15;
        this.tipY += (targetTipY + breezeY - this.tipY) * 0.15;

        // Restrição de distância (Mantém o comprimento máximo)
        const dx = this.tipX - startX;
        const dy = this.tipY - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > this.length) {
            this.tipX = startX + (dx / dist) * this.length;
            this.tipY = startY + (dy / dist) * this.length;
        }

        // Ponto intermediário semi-rígido (Fica entre o início e a ponta, mas puxado para cima)
        this.midX = startX + (this.tipX - startX) * 0.3;
        this.midY = startY + (this.tipY - startY) * 0.2;

        this.draw(startX, startY);
    }

    private draw(startX: number, startY: number) {
        this.graphics.clear();
        
        // Estilo Anime: Curva de Bezier quadrática sólida
        this.graphics.lineStyle(this.thickness, this.color, 1);
        
        const curve = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(startX, startY),
            new Phaser.Math.Vector2(this.midX, this.midY),
            new Phaser.Math.Vector2(this.tipX, this.tipY)
        );

        // Desenha a curva
        this.graphics.beginPath();
        const points = curve.getPoints(12);
        this.graphics.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.graphics.lineTo(points[i].x, points[i].y);
        }
        this.graphics.strokePath();

        // Detalhe de "base rígida" (um pequeno arco no pescoço)
        this.graphics.fillStyle(this.color, 1);
        this.graphics.fillEllipse(startX, startY, this.thickness * 1.5, this.thickness * 0.8);
    }

    destroy() {
        this.graphics.destroy();
    }
}
