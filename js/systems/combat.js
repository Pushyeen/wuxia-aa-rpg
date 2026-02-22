// js/systems/combat.js
import { WindowManager } from '../core/window_manager.js';
import { GameState } from './state.js';
import { DB_ENEMIES } from '../data/db_enemies.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from '../ui/avatar.js';

export const CombatSystem = {
    win: null, playerRef: null, enemyRef: null, interval: null, resolveBattle: null,

    init(deps) {
        this.vfx = deps.vfx;
        this.logger = deps.logger;
        this.ui = deps.ui;
    },

    start(enemyId) {
        return new Promise(resolve => {
            GameState.current = "BATTLE";
            this.resolveBattle = resolve;
            
            let eData = DB_ENEMIES[enemyId];
            if (!eData) { console.error("找不到敵人 ID:", enemyId); return resolve(); }

            this.enemyRef = { id: enemyId, hp: eData.hp, maxHp: eData.maxHp, wait: 0, stats: eData };
            this.playerRef = { hp: GameState.player.hp, maxHp: GameState.player.maxHp, wait: 0 };
            
            let html = `
                <div class="battle-ui" style="display:flex; justify-content:space-between; align-items:center;">
                    <div id="bat-target-player" style="text-align:center; width:45%;">
                        <div style="color:#ffaa55; font-weight:bold;">少俠</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-p" class="bar-fill" style="width:100%;"></div></div>
                        <pre class="aa-box" id="bat-aa-p" style="color:#aaddff;">${AvatarUI.getAA()}</pre>
                    </div>
                    <div style="font-size:24px; color:#555; font-weight:bold;">VS</div>
                    <div id="bat-target-enemy" style="text-align:center; width:45%;">
                        <div style="color:#ff5555; font-weight:bold;">${eData.name}</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-e" class="bar-fill" style="width:100%;"></div></div>
                        <pre class="aa-box" id="bat-aa-e" style="color:#ffaaaa;">${eData.aa}</pre>
                    </div>
                </div>
                <div id="bat-log" class="bat-log-container"></div>
            `;
            
            this.win = WindowManager.create(`⚔️ 戰鬥爆發：遭遇 ${eData.name}`, html, true);
            this.log("戰鬥開始！", "sys-msg");
            this.interval = setInterval(() => this.tick(), 50);
        });
    },

    log(msg, cls="sys-msg") {
        let el = document.getElementById('bat-log');
        if (el) { el.innerHTML += `<div class="${cls}">${msg}</div>`; el.scrollTop = el.scrollHeight; }
        if (this.logger) this.logger.add(`[戰鬥] ${msg.replace(/<[^>]*>?/gm, '')}`, cls);
    },

    updateBars() {
        let pEl = document.getElementById('bat-hp-p'); 
        let eEl = document.getElementById('bat-hp-e');
        if (pEl) pEl.style.width = `${(this.playerRef.hp / this.playerRef.maxHp) * 100}%`;
        if (eEl) eEl.style.width = `${(this.enemyRef.hp / this.enemyRef.maxHp) * 100}%`;
        
        GameState.player.hp = this.playerRef.hp; 
        if(this.ui) this.ui.updateStats(); 
    },

    async tick() {
        this.playerRef.wait += (GameState.player.agi / 10);
        this.enemyRef.wait += (this.enemyRef.stats.agi / 10);

        if (this.playerRef.wait >= 100) {
            this.playerRef.wait = 0;
            let skills = GameState.player.activeSkills;
            await this.executeAction(true, DB_SKILLS[skills[Math.floor(Math.random() * skills.length)]]);
        }
        else if (this.enemyRef.wait >= 100) {
            this.enemyRef.wait = 0;
            let skills = this.enemyRef.stats.skills;
            await this.executeAction(false, DB_SKILLS[skills[Math.floor(Math.random() * skills.length)]]);
        }
    },

    // 核心升級：連擊系統 (Combo System)
    async executeAction(isPlayer, skill) {
        clearInterval(this.interval); 
        
        let attacker = isPlayer ? "少俠" : this.enemyRef.stats.name;
        let atkStat = isPlayer ? GameState.player.atk : this.enemyRef.stats.atk;
        let defStat = isPlayer ? this.enemyRef.stats.def : GameState.player.def;
        let targetHpRef = isPlayer ? this.enemyRef : this.playerRef;

        // 決定連擊次數：讀取技能設定，如果沒設就隨機 1~3 次
        let hitCount = skill.hits || (Math.floor(Math.random() * 3) + 1);
        
        this.log(`[${attacker}] 施展 <span style="color:#55aaff">${skill.name}</span>！`, "story-msg");
        
        // 進入連擊迴圈
        for (let i = 0; i < hitCount; i++) {
            if (targetHpRef.hp <= 0) break; // 如果目標已死，中斷鞭屍

            if (this.vfx && this.win) {
                let sourceEl = isPlayer ? document.getElementById('bat-aa-p') : document.getElementById('bat-aa-e');
                let targetEl = isPlayer ? document.getElementById('bat-aa-e') : document.getElementById('bat-aa-p');
                let vfxCanvas = document.getElementById('vfx-layer');
                
                if (sourceEl && targetEl && vfxCanvas) {
                    let sRect = sourceEl.getBoundingClientRect();
                    let tRect = targetEl.getBoundingClientRect();
                    let canvasRect = vfxCanvas.getBoundingClientRect();
                    
                    let sX = (sRect.left - canvasRect.left) + sRect.width / 2;
                    let sY = (sRect.top - canvasRect.top) + sRect.height / 2;
                    let tX = (tRect.left - canvasRect.left) + tRect.width / 2;
                    let tY = (tRect.top - canvasRect.top) + tRect.height / 2;
                    
                    if(skill.vfx === 'sword_rain' || skill.vfx === 'needle_rain') sY -= 100;
                    this.vfx.play(skill.vfx, sX, sY, tX, tY);
                }
            }
            
            // 等待特效飛越的時間
            await new Promise(r => setTimeout(r, 400)); 

            // 單次傷害計算
            let dmg = Math.max(1, (atkStat + skill.power) - defStat);
            dmg = Math.floor(dmg * (0.9 + Math.random() * 0.2)); 
            
            if (Math.random() < (isPlayer ? GameState.player.crit : this.enemyRef.stats.crit) + (skill.critBonus || 0)) {
                dmg = Math.floor(dmg * 1.5);
                this.log(`會心一擊！！`, "dmg-msg");
                // 每一下爆擊都震動
                if(this.win) {
                    this.win.classList.add('shake-effect');
                    setTimeout(() => this.win.classList.remove('shake-effect'), 200);
                }
            }

            targetHpRef.hp -= dmg;
            let comboText = hitCount > 1 ? ` (${i+1}連擊)` : '';
            this.log(`造成 <span class="dmg-msg">${dmg}</span> 傷害${comboText}。`, "dmg-msg");
            this.updateBars();
            
            // 連擊之間的短暫停頓
            await new Promise(r => setTimeout(r, 250)); 
        }

        // 該回合動作結束後的收招停頓
        await new Promise(r => setTimeout(r, 400)); 

        if (this.enemyRef.hp <= 0) this.endBattle(true);
        else if (this.playerRef.hp <= 0) this.endBattle(false);
        else this.interval = setInterval(() => this.tick(), 50); 
    },

    endBattle(isWin) {
        clearInterval(this.interval);
        if (isWin) {
            let exp = this.enemyRef.stats.dropExp;
            this.log(`戰鬥勝利！獲得 ${exp} 點經驗。`, "sys-msg");
            GameState.player.exp += exp;
            
            setTimeout(() => { 
                this.win.remove(); 
                GameState.current = "EXPLORE"; 
                if(this.ui) this.ui.render(); 
                if(this.resolveBattle) this.resolveBattle(true); 
            }, 1500);
        } else {
            this.log(`少俠敗陣...眼前一黑。`, "warn-msg");
            if(this.resolveBattle) this.resolveBattle(false);
        }
    }
};