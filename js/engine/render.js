// js/engine/render.js
import { Inventory } from '../data/db.js';

export function getPlayerAA(isHurt = false) {
    let aa = [];
    if (Inventory.head) aa.push("　 ＜￣￣￣＞", " ／ 　　　 ＼"); else aa.push("　 ＿＿＿＿", " ／　　　　＼");
    aa.push(isHurt ? "/　＞　　＜　 ヽ" : "/　・　　・　 ヽ");
    if (Inventory.armor) aa.push("| ≡ [鎧] ≡ |"); else aa.push(isHurt ? "|　　 皿　　　|" : "|　　 ω　　　|");
    if (Inventory.shoes) aa.push(" ＼＿_＝_＿／"); else aa.push(" ＼＿＿＿＿／");
    if (Inventory.weapon) { aa[0]+="　 |/"; aa[1]+="　 |/"; aa[2]+="　 0"; aa[3]+="　 /"; aa[4]+="　 /"; }
    return aa;
}

export class AASpriteRenderer {
    constructor(canvasId, aaNormal, aaHurt, color, isEnemy = false) {
        this.canvas = document.getElementById(canvasId); 
        this.ctx = this.canvas.getContext('2d');
        this.aaNormal = aaNormal; this.aaHurt = aaHurt; this.color = color; this.isEnemy = isEnemy;
        this.state = 'idle'; this.stateTimer = 0; this.frame = 0;
        this.baseX = isEnemy ? 60 : 15; this.baseY = 20; this.hurtColor = isEnemy ? "#ffffff" : "#ff5555"; 
    }
    
    playAttack() { this.state = 'attacking'; this.stateTimer = 20; }
    playHit() { 
        this.state = 'hit'; this.stateTimer = 15; 
        if(!this.isEnemy) {
            this.canvas.style.backgroundColor = '#440000';
            setTimeout(() => { this.canvas.style.backgroundColor = '#000'; }, 300);
        }
    }
    playDodge() { this.state = 'dodge'; this.stateTimer = 15; }
    
    renderLoop() {
        // ... (這裡貼上原本 renderLoop 的程式碼) ...
        this.animationId = requestAnimationFrame(() => this.renderLoop());
    }
    
    destroy() { if(this.animationId) cancelAnimationFrame(this.animationId); }
}