// js/core/vfx_engine.js
import { MathUtil } from './math_utils.js';
import { VFX_DB } from '../data/db_vfx.js'; 

export class UltimateVFXEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if(!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startLoop();
    }

    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    play(effectId, startX, startY, targetX, targetY) {
        const cfg = VFX_DB[effectId]; 
        if (!cfg) { console.warn(`找不到特效: ${effectId}`); return; }
        
        let angle = Math.atan2(targetY - startY, targetX - startX);
        
        for (let i = 0; i < cfg.count; i++) {
            let p = { cfg: cfg, life: 0, maxLife: cfg.duration + Math.random() * 10, x: startX, y: startY, vx: 0, vy: 0 };
            
            // 物理行爲演算
            if (cfg.behavior === "projectile") {
                let finalAngle = angle + (Math.random() - 0.5) * (cfg.spread * Math.PI / 180);
                let spd = cfg.speed * (0.8 + Math.random() * 0.4);
                p.vx = Math.cos(finalAngle) * spd; 
                p.vy = Math.sin(finalAngle) * spd;
                p.x += (Math.random() - 0.5) * 20; p.y += (Math.random() - 0.5) * 20;
            } 
            else if (cfg.behavior === "rain") {
                p.x = targetX + (Math.random() - 0.5) * cfg.spread; 
                p.y = targetY - 200 - Math.random() * 100;
                p.vx = (Math.random() - 0.5) * 2; 
                p.vy = cfg.speed * (0.8 + Math.random() * 0.5);
            }
            else if (cfg.behavior === "explode") {
                // 360 度向外炸開
                let explodeAngle = Math.random() * Math.PI * 2;
                let spd = cfg.speed * Math.random();
                p.vx = Math.cos(explodeAngle) * spd;
                p.vy = Math.sin(explodeAngle) * spd;
            }
            else if (cfg.behavior === "float_up") {
                // 原地緩慢向上擴散漂浮
                p.x = targetX + (Math.random() - 0.5) * cfg.spread;
                p.y = targetY + (Math.random() - 0.5) * cfg.spread;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = -cfg.speed * (0.5 + Math.random() * 0.5);
            }
            this.particles.push(p);
        }
    }
    
    startLoop() {
        const update = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.textBaseline = "middle"; this.ctx.textAlign = "center";
            
            for (let i = this.particles.length - 1; i >= 0; i--) {
                let p = this.particles[i]; 
                p.life++; p.x += p.vx; p.y += p.vy;
                
                if (p.life >= p.maxLife) { this.particles.splice(i, 1); continue; }
                
                let t = p.life / p.maxLife;
                let char = MathUtil.getArrayElementByRatio(p.cfg.chars, t);
                let color = MathUtil.getArrayElementByRatio(p.cfg.colors, t);
                let scale = MathUtil.getValueFromCurve(p.cfg.scaleCurve, t);
                
                this.ctx.save(); this.ctx.translate(p.x, p.y);
                if (p.cfg.behavior === "rain") this.ctx.rotate(Math.atan2(p.vy, p.vx) + Math.PI / 2);
                this.ctx.scale(scale, scale); this.ctx.globalAlpha = 1.0 - Math.pow(t, 3);
                
                if (p.cfg.shadow) { this.ctx.shadowColor = color; this.ctx.shadowBlur = 10 * scale; }
                
                this.ctx.fillStyle = color; this.ctx.font = `20px monospace`;
                this.ctx.fillText(char, 0, 0); this.ctx.restore();
            }
            requestAnimationFrame(update);
        }; 
        update();
    }
}