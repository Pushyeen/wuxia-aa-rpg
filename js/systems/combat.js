// js/systems/combat.js
import { WindowManager } from '../core/window_manager.js';
import { GameState, StatEngine } from './state.js';
import { DB_ENEMIES } from '../data/db_enemies.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from '../ui/avatar.js';

const REACTION_RULES = [
    { id: "overload", name: "陰陽相激", condition: (tags, t) => (tags.includes("寒") && t.tags.fire > 0) || (tags.includes("炎") && t.tags.ice > 0), 
      execute: (t, p, e, log) => { t.tags.fire=0; t.tags.ice=0; t.hp-=300; log("♨️ 【陰陽相激】冰火交加引發真氣殉爆！", "dmg-msg"); return 1.5; } },

    { id: "shatter", name: "冰封碎裂", condition: (tags, t) => tags.includes("鈍") && t.tags.frozen, 
      execute: (t, p, e, log) => { t.tags.frozen=false; t.hp-= (t.maxHp*0.15 + 500); log("💥 【冰封碎裂】重擊擊碎冰塊，造成巨量真實傷害！", "dmg-msg"); return 2.0; } },

    { id: "melt", name: "冰火蒸發", condition: (tags, t) => tags.includes("炎") && t.tags.frozen, 
      execute: (t, p, e, log) => { t.tags.frozen=false; log("💨 【高溫蒸發】烈焰融化冰封，產生高溫破甲傷害！", "story-msg"); return 1.5; } },

    { id: "inferno", name: "風火燎原", condition: (tags, t, e) => tags.includes("風") && (t.tags.fire > 0 || e.fire > 0), 
      execute: (t, p, e, log) => { let dmg = (t.tags.fire||0)*50 + e.fire*100; t.hp-=dmg; t.tags.fire=0; e.fire=0; log(`🌪️ 【風火燎原】狂風捲起火海，追加 ${dmg} 傷害！`, "dmg-msg"); return 1.5; } },

    { id: "magnetize", name: "萬物歸宗", condition: (tags, t, e) => tags.includes("牽引") && e.needles > 0, 
      execute: (t, p, e, log) => { let dmg = e.needles * 60; t.hp-=dmg; e.needles=0; log(`🧲 【萬物歸宗】暗器貫穿敵人，追加 ${dmg} 傷害！`, "dmg-msg"); return 1.2; } },

    { id: "mech_boom", name: "機關殉爆", condition: (tags, t, e) => (tags.includes("炎") || tags.includes("鈍")) && e.gears > 0, 
      execute: (t, p, e, log) => { let dmg = e.gears * 100; t.hp-=dmg; e.gears=0; log(`⚙️ 【機關殉爆】齒輪引發連鎖炸裂！`, "dmg-msg"); return 1.5; } },

    { id: "wind_silk", name: "風中殘絲", condition: (tags, t) => tags.includes("風") && t.tags.silk > 0, 
      execute: (t, p, e, log) => { t.tags.silk += 2; log(`🕸️ 【風中殘絲】狂風讓絲線纏繞更緊！(絲線+2)`, "warn-msg"); return 1.0; } },

    { id: "sharp_ice", name: "冰刃刺骨", condition: (tags, t) => tags.includes("銳") && t.tags.ice > 0, 
      execute: (t, p, e, log) => { t.hp -= t.tags.ice * 50; log(`❄️ 【冰刃刺骨】銳器挾帶寒氣入體！`, "dmg-msg"); return 1.2; } }
];

export const CombatSystem = {
    win: null, playerRef: null, enemyRef: null, interval: null, resolveBattle: null,
    isExecuting: false, 
    isAttemptingFlee: false, 
    envTick: 0,
    battleEnded: false,

    init(deps) {
        this.vfx = deps.vfx; this.logger = deps.logger; this.ui = deps.ui;
    },

    start(enemyId) {
        return new Promise(resolve => {
            GameState.current = "BATTLE";
            this.resolveBattle = resolve;
            let eData = DB_ENEMIES[enemyId];
            if (!eData) return resolve();

            this.enemyRef = { id: enemyId, hp: eData.hp, maxHp: eData.maxHp, wait: 0, stats: eData.stats, tags: {} };
            this.playerRef = { hp: GameState.player.hp, maxHp: GameState.player.maxHp, wait: 0, currentCombo: 0, aura: {}, tags: {} };
            GameState.env = { needles: 0, fire: 0, gears: 0, taichi: 0, turret: 0 };
            
            this.isExecuting = false;
            this.isAttemptingFlee = false;
            this.envTick = 0;
            this.battleEnded = false;

            let html = `
                <div style="width: 520px; max-width: 100%; position: relative;"> 
                    <button id="bat-btn-flee" class="sys-btn" style="position:absolute; top:-35px; right:5px; background:#440000; border:2px outset #ff5555; color:#ffaaaa; padding:4px 12px; font-weight:bold;">🏃 嘗試逃跑</button>
                    <div class="battle-ui" style="display:flex; justify-content:space-between; align-items:flex-end; padding-top: 15px;">
                        
                        <div id="bat-target-player" style="text-align:center; width:45%; position: relative;">
                            <div style="color:#ffaa55; font-weight:bold;">少俠</div>
                            <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-p" class="bar-fill" style="width:100%;"></div></div>
                            <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-p" class="bar-fill" style="background:#00aaff; width:0%;"></div></div>
                            <div class="bar-bg" style="margin: 4px auto 0; height:6px;"><div id="bat-combo-p" class="bar-fill" style="background:#cc55ff; width:100%; transition: width 0.2s;"></div></div>
                            <div style="font-size:11px; color:#aaa;">連擊值: <span id="bat-combo-text">0</span></div>
                            <div id="bat-aa-p" style="display:flex; justify-content:center; margin-top:10px;">${AvatarUI.getCombatHTML()}</div>
                            <div class="zone-box"><div class="zone-title">【自身氣場】</div><div id="bat-aura-content">- 無 -</div></div>
                        </div>

                        <div style="font-size:24px; color:#555; font-weight:bold;">VS</div>

                        <div id="bat-target-enemy" style="text-align:center; width:45%; position: relative;">
                            <div style="color:#ff5555; font-weight:bold;">${eData.name}</div>
                            <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-e" class="bar-fill" style="width:100%;"></div></div>
                            <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-e" class="bar-fill" style="background:#ff8800; width:0%;"></div></div>
                            <pre class="aa-box" id="bat-aa-e" style="color:#ffaaaa; margin-top:22px;">${eData.aa}</pre>
                            <div class="zone-box"><div class="zone-title">【目標印記】</div><div id="bat-target-content">- 無 -</div></div>
                        </div>
                    </div>
                </div>
            `;
            
            this.win = WindowManager.create(`⚔️ 戰鬥交鋒`, html, true);
            
            // 系統初始日誌，不被攔截
            if (this.logger) this.logger.add(`[戰鬥] 戰鬥開始！雙方進入自動交鋒狀態。`, "sys-msg");

            setTimeout(() => {
                let btnFlee = this.win.querySelector('#bat-btn-flee');
                if (btnFlee) {
                    btnFlee.onclick = () => {
                        if (this.isAttemptingFlee || this.battleEnded) return;
                        this.isAttemptingFlee = true;
                        btnFlee.innerText = "💨 尋找破綻中...";
                        btnFlee.style.background = "#555500";
                        this.log("少俠改變架勢，準備在下次行動時尋找破綻逃跑！", "warn-msg");
                    };
                }
            }, 100);

            if(this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 50);
        });
    },

    // 【修復核心】：戰鬥一旦宣告結束，絕對禁止任何新的 Log 輸出
    log(msg, cls="sys-msg") {
        if (this.battleEnded) return; 
        if (this.logger) this.logger.add(`[戰鬥] ${msg.replace(/<[^>]*>?/gm, '')}`, cls);
    },

    createContext(attackerRef, targetRef) {
        return {
            attacker: attackerRef, target: targetRef, env: GameState.env, log: (m, c) => this.log(m, c),
            addTag: (t, tag, amt) => { 
                if (this.battleEnded) return; // 戰鬥結束禁止附加印記
                if (!t.tags) t.tags = {};
                if (!t.tags[tag]) t.tags[tag] = 0; 
                t.tags[tag] += amt; 
                
                if (tag === 'ice' && t.tags.ice >= 3) { 
                    t.tags.ice = 0; 
                    t.tags.frozen = true; 
                    t.tags.frozen_timer = 0;
                    this.log(`🧊 寒氣入骨，${t === this.playerRef ? '少俠' : '敵人'}被凍結了！防禦力大幅下降且無法行動！`, "warn-msg"); 
                    if(this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }
                if (tag === 'silk' && t.tags.silk >= 5) { 
                    t.tags.silk = 0; 
                    t.hp -= 300; 
                    this.log(`🕸️ 天羅地網絞殺！造成 300 點真實傷害！`, "warn-msg"); 
                    let cId = t === this.playerRef ? 'bat-target-player' : 'bat-target-enemy';
                    this.showFloatingDamage(cId, 300, 300 / t.maxHp);
                    if(this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }
            },
            addAura: (p, type, amt) => { if(this.battleEnded) return; if(!p.aura[type]) p.aura[type]=0; p.aura[type]+=amt; this.log(`✨ 獲得氣場：${type}`, "story-msg"); },
            addEnv: (type, amt) => { if(this.battleEnded) return; let limit = Math.floor(StatEngine.getDerived(GameState.player).qiCap / 10); GameState.env[type] += amt; if(GameState.env[type] > limit) GameState.env[type] = limit; }
        };
    },

    updateCombatUI() {
        if (!this.win || this.battleEnded) return;
        
        let pEl = document.getElementById('bat-hp-p'), eEl = document.getElementById('bat-hp-e');
        if (pEl) pEl.style.width = `${Math.max(0, (this.playerRef.hp / this.playerRef.maxHp) * 100)}%`;
        if (eEl) eEl.style.width = `${Math.max(0, (this.enemyRef.hp / this.enemyRef.maxHp) * 100)}%`;
        GameState.player.hp = this.playerRef.hp; 
        if(this.ui) this.ui.updateStats();

        let atbPEl = document.getElementById('bat-atb-p'), atbEEl = document.getElementById('bat-atb-e');
        if (atbPEl) atbPEl.style.width = `${Math.min(100, this.playerRef.wait)}%`;
        if (atbEEl) atbEEl.style.width = `${Math.min(100, this.enemyRef.wait)}%`;

        let derP = StatEngine.getDerived(GameState.player);
        let comboPEl = document.getElementById('bat-combo-p'), comboTxt = document.getElementById('bat-combo-text');
        if (comboPEl) comboPEl.style.width = `${Math.max(0, (this.playerRef.currentCombo / Math.max(1, derP.comboMax)) * 100)}%`;
        if (comboTxt) comboTxt.innerText = `${this.playerRef.currentCombo} / ${derP.comboMax}`;

        let tHtml = [];
        if(this.enemyRef.tags.ice) tHtml.push(`<span class="tag ice">❄️ 寒氣 x${this.enemyRef.tags.ice}</span>`);
        if(this.enemyRef.tags.fire) tHtml.push(`<span class="tag fire">🔥 炎勁 x${this.enemyRef.tags.fire}</span>`);
        if(this.enemyRef.tags.silk) tHtml.push(`<span class="tag silk">🕸️ 絲線 x${this.enemyRef.tags.silk}</span>`);
        if(this.enemyRef.tags.frozen) tHtml.push(`<span class="tag ice" style="box-shadow: 0 0 5px #aaddff;">🧊 冰封</span>`);
        let tContent = document.getElementById('bat-target-content');
        if (tContent) tContent.innerHTML = tHtml.join('') || '- 無 -';

        let aHtml = [];
        for(let k in this.playerRef.aura) if(this.playerRef.aura[k] > 0) aHtml.push(`<span class="tag aura">✨ ${k} x${this.playerRef.aura[k]}</span>`);
        let aContent = document.getElementById('bat-aura-content');
        if (aContent) aContent.innerHTML = aHtml.join('') || '- 無 -';
    },

    showFloatingDamage(containerId, dmg, pctMaxHp) {
        if (this.battleEnded) return; // 戰鬥結束禁止飄字
        let container = document.getElementById(containerId);
        if (!container) return;

        let el = document.createElement('div');
        el.innerText = `-${dmg}`;
        el.className = 'dmg-float-base';

        if (pctMaxHp >= 1.0) el.classList.add('dmg-tier-5');       
        else if (pctMaxHp >= 0.75) el.classList.add('dmg-tier-4'); 
        else if (pctMaxHp >= 0.50) el.classList.add('dmg-tier-3'); 
        else if (pctMaxHp >= 0.25) el.classList.add('dmg-tier-2'); 
        else el.classList.add('dmg-tier-1');                       

        let offsetX = (Math.random() - 0.5) * 60;
        let offsetY = (Math.random() - 0.5) * 20;
        el.style.left = `calc(50% + ${offsetX}px)`;
        el.style.top = `calc(35% + ${offsetY}px)`;

        container.appendChild(el);
        setTimeout(() => { if (el) el.remove(); }, 1500);
    },

    triggerEnvDamage() {
        if (this.battleEnded) return;
        let dmgOccurred = false;
        if (this.enemyRef.tags.fire > 0) { 
            let b = this.enemyRef.tags.fire*30; this.enemyRef.hp-=b; this.log(`🔥 灼燒造成 ${b} 傷害。`, "dmg-msg"); 
            this.showFloatingDamage('bat-target-enemy', b, b / this.enemyRef.maxHp);
            dmgOccurred = true;
        }
        if (GameState.env.turret > 0) { 
            let t = GameState.env.turret*50; this.enemyRef.hp-=t; this.log(`🏹 連弩塔射擊造成 ${t} 傷害！`, "dmg-msg"); 
            this.showFloatingDamage('bat-target-enemy', t, t / this.enemyRef.maxHp);
            dmgOccurred = true;
        }
        if (dmgOccurred) {
            this.updateCombatUI();
            if (this.enemyRef.hp <= 0) this.endBattle(true);
        }
    },

    tick() {
        if (this.isExecuting || this.battleEnded) return; 

        let derP = StatEngine.getDerived(GameState.player);
        let derE = StatEngine.getDerived(this.enemyRef);

        this.envTick++;
        if (this.envTick >= 40) {
            this.envTick = 0;
            this.triggerEnvDamage();
            if (this.battleEnded) return;
        }

        if (this.enemyRef.tags.frozen) {
            this.enemyRef.tags.frozen_timer = (this.enemyRef.tags.frozen_timer || 0) + 1;
            if (this.enemyRef.tags.frozen_timer > 60) {
                this.enemyRef.tags.frozen = false;
                this.enemyRef.tags.frozen_timer = 0;
                this.log(`🧊 敵人身上的冰塊自然碎裂，解除凍結了！`, "story-msg");
            }
        } else {
            this.enemyRef.wait += (derE.atbSpd / 20);
        }

        if (this.playerRef.tags.frozen) {
            this.playerRef.tags.frozen_timer = (this.playerRef.tags.frozen_timer || 0) + 1;
            if (this.playerRef.tags.frozen_timer > 60) {
                this.playerRef.tags.frozen = false;
                this.playerRef.tags.frozen_timer = 0;
                this.log(`🧊 少俠震碎冰塊，解除凍結了！`, "story-msg");
            }
        } else {
            this.playerRef.wait += (derP.atbSpd / 20);
        }

        this.updateCombatUI();

        if (this.playerRef.wait >= 100) {
            this.playerRef.wait = 0; 
            this.playerRef.currentCombo = derP.comboMax; 
            this.updateCombatUI();
            
            if (this.isAttemptingFlee) {
                this.executeFlee(derP, derE);
                return;
            }

            this.executePlayerComboChain(derP, derE);
            return; 
        }
        
        if (this.enemyRef.wait >= 100) {
            this.enemyRef.wait = 0;
            let skills = this.enemyRef.stats.skills || ["s_enemy_slash"];
            this.executeEnemyAction(DB_SKILLS[skills[Math.floor(Math.random() * skills.length)]]);
            return;
        }
    },

    async executeFlee(derP, derE) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        try {
            this.isAttemptingFlee = false;
            let btnFlee = this.win.querySelector('#bat-btn-flee');
            if (btnFlee) { btnFlee.innerText = "🏃 嘗試逃跑"; btnFlee.style.background = "#440000"; }

            let fleeChance = 80 + (derP.dodge - derE.hit);
            fleeChance = Math.max(5, Math.min(95, fleeChance)); 

            this.log(`少俠試圖脫離戰場... (成功率: ${fleeChance}%)`, "sys-msg");
            await new Promise(r => setTimeout(r, 600)); 

            if (this.battleEnded) return;

            if (Math.random() * 100 < fleeChance) {
                this.log(`💨 殘影一閃，少俠成功逃離了戰鬥！`, "story-msg");
                this.battleEnded = true; // 視為戰鬥結束
                setTimeout(() => {
                    if (this.win) this.win.remove();
                    GameState.current = "EXPLORE";
                    if(this.ui) this.ui.render();
                    if(this.resolveBattle) this.resolveBattle(false); 
                }, 1000);
            } else {
                this.log(`❌ 逃跑失敗！被敵人封死了退路！`, "warn-msg");
                if(this.win) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
            }
        } finally {
            this.isExecuting = false;
            if (!this.battleEnded) {
                clearInterval(this.interval);
                this.interval = setInterval(() => this.tick(), 50); 
            }
        }
    },

    async executePlayerComboChain(derP, derE) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 
        
        try {
            while (this.playerRef.hp > 0 && this.enemyRef.hp > 0 && !this.battleEnded) {
                let skills = GameState.player.activeSkills;
                if (!skills || skills.length === 0) break;
                
                let skId = skills[Math.floor(Math.random() * skills.length)];
                let skill = DB_SKILLS[skId];
                if (!skill) break;
                
                this.log(`[少俠] 施展 ${skill.name}！`, "story-msg");
                await this.performAttack(true, skill, derP, derE, this.playerRef, this.enemyRef);
                
                if (this.battleEnded) break; // 攻擊結束後立刻確認是否已經打死對方

                this.playerRef.currentCombo -= skill.comboCost;
                this.updateCombatUI();

                let roll = Math.floor(Math.random() * 100) + 1;
                if (roll > this.playerRef.currentCombo) {
                    this.log(`【破綻】氣力不繼，收招退守。(判定：${roll} > 剩餘 ${this.playerRef.currentCombo})`, "warn-msg");
                    break; 
                } else {
                    this.log(`⚡ 攻勢連綿不斷！馬上接續下一招！`, "sys-msg");
                    await new Promise(r => setTimeout(r, 200)); 
                }
            }
        } catch (e) {
            console.error("Combat Error: ", e);
        } finally {
            this.isExecuting = false; 
            if (!this.battleEnded) {
                clearInterval(this.interval);
                this.interval = setInterval(() => this.tick(), 50);
            }
        }
    },

    async executeEnemyAction(skill) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        try {
            let derE = StatEngine.getDerived(this.enemyRef), derP = StatEngine.getDerived(GameState.player);
            this.log(`[護法] 施展 ${skill.name}！`, "warn-msg");
            await this.performAttack(false, skill, derE, derP, this.enemyRef, this.playerRef);
        } finally {
            this.isExecuting = false;
            if (!this.battleEnded) {
                clearInterval(this.interval);
                this.interval = setInterval(() => this.tick(), 50);
            }
        }
    },

    // 【修復核心】：每一次動畫延遲等待前後，皆嚴格檢查戰鬥是否已結束
    async performAttack(isPlayer, skill, derAtk, derDef, attackerRef, targetRef) {
        if (this.battleEnded) return;

        if (!isPlayer) {
            if(this.playerRef.aura['木甲'] > 0) {
                this.playerRef.aura['木甲'] -= 200; this.log(`🛡️ 神工木甲吸收了傷害！`, "story-msg");
                if(this.playerRef.aura['木甲'] <= 0) { this.playerRef.aura['木甲']=0; this.log("💥 木甲損毀！"); } return;
            }
            if(this.playerRef.aura['疾風'] > 0) { this.playerRef.aura['疾風']--; this.log("💨 逍遙步絕對閃避！", "story-msg"); return; }
            if(this.playerRef.aura['反擊'] > 0) { 
                this.playerRef.aura['反擊']--; 
                this.enemyRef.hp -= 300; 
                this.log(`☯ 借力打力反彈傷害！`, "dmg-msg"); 
                this.showFloatingDamage('bat-target-enemy', 300, 300 / this.enemyRef.maxHp);
                if (this.enemyRef.hp <= 0) { this.updateCombatUI(); this.endBattle(true); }
                return; 
            }
        }

        let dodgeChance = 20 + (derDef.dodge - derAtk.hit) * 1;
        if (targetRef.tags && targetRef.tags.frozen) dodgeChance = 0; 
        dodgeChance = Math.max(0, Math.min(100, dodgeChance));

        if (Math.random() * 100 < dodgeChance) {
            this.log(`殘影一閃，完全閃避了攻擊！`, "sys-msg");
            return;
        }

        let hitCount = skill.hits || 1;
        if (hitCount > 1 && Math.random() < (derAtk.dex / 200)) { hitCount++; this.log(`追加連擊！`, "story-msg"); }

        for (let i = 0; i < hitCount; i++) {
            // 每次連擊或執行前，強制確認戰鬥與血量狀態
            if (this.battleEnded || targetRef.hp <= 0) break;

            if (isPlayer) {
                let actionType = (skill.vfx && (skill.vfx.includes('slash') || skill.vfx.includes('strike'))) ? 'slash' : 'thrust';
                AvatarUI.playAction(actionType, true);
            }

            if (this.vfx && this.win) {
                let sEl = isPlayer ? document.getElementById('bat-aa-p') : document.getElementById('bat-aa-e');
                let tEl = isPlayer ? document.getElementById('bat-aa-e') : document.getElementById('bat-aa-p');
                let canvas = document.getElementById('vfx-layer');
                if (sEl && tEl && canvas) {
                    let sRect = sEl.getBoundingClientRect(), tRect = tEl.getBoundingClientRect(), cRect = canvas.getBoundingClientRect();
                    let sX = (sRect.left - cRect.left) + sRect.width/2, sY = (sRect.top - cRect.top) + sRect.height/2;
                    let tX = (tRect.left - cRect.left) + tRect.width/2, tY = (tRect.top - cRect.top) + tRect.height/2;
                    if(skill.vfx === 'sword_rain' || skill.vfx === 'needle_rain') sY -= 100;
                    this.vfx.play(skill.vfx, sX, sY, tX, tY);
                }
            }
            
            await new Promise(r => setTimeout(r, 400));
            // 從特效等待回來後，如果對方已死或戰鬥宣告結束，直接斬斷
            if (this.battleEnded || targetRef.hp <= 0) break;

            let mult = 1;
            let skillTags = skill.tags || [];
            for (let rule of REACTION_RULES) {
                if (rule.condition(skillTags, targetRef, GameState.env)) {
                    let bonusMult = rule.execute(targetRef, attackerRef, GameState.env, (m, c) => this.log(m, c));
                    if (typeof bonusMult === 'number') mult *= bonusMult; 
                }
            }

            // 反應可能在瞬間把對方燒死，再次確認
            if (this.battleEnded || targetRef.hp <= 0) {
                 this.endBattle(isPlayer); // 保險結算
                 break; 
            }

            let baseAtk = skill.type === 'phys' ? derAtk.pAtk : derAtk.qAtk;
            let rawDmg = (baseAtk + skill.power) * (0.9 + Math.random() * 0.2) * mult;
            
            if (Math.random() * 100 < derAtk.critChance) {
                rawDmg *= derAtk.critMult;
                this.log(`💥 會心一擊！`, "dmg-msg");
                if (this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
            }

            let fixDef = (targetRef.tags && targetRef.tags.frozen) ? 0 : derDef.fixDef;
            let pctDef = (targetRef.tags && targetRef.tags.frozen) ? derDef.pctDef / 2 : derDef.pctDef;

            let finalDmg = (rawDmg - fixDef) * (1 - pctDef / 100);
            finalDmg = Math.max(1, Math.floor(finalDmg));

            targetRef.hp -= finalDmg;
            if (!isPlayer && finalDmg > 0 && !this.battleEnded) AvatarUI.playAction('hurt', true);
            
            let pctMaxHp = finalDmg / targetRef.maxHp;
            let containerId = isPlayer ? 'bat-target-enemy' : 'bat-target-player';
            this.showFloatingDamage(containerId, finalDmg, pctMaxHp);
            
            if (skill.onHit) skill.onHit(this.createContext(attackerRef, targetRef));

            this.log(`造成 ${finalDmg} 傷害。`, "sys-msg");
            this.updateCombatUI();

            if (targetRef.hp <= 0) {
                this.endBattle(isPlayer);
                break;
            }

            await new Promise(r => setTimeout(r, 200));
        }
    },

    endBattle(isWin) {
        if (this.battleEnded) return; // 確保只會執行一次
        this.battleEnded = true;      // 絕對鎖死，阻擋一切後續 Log 輸出與運算
        clearInterval(this.interval);
        
        if (isWin) {
            let exp = this.enemyRef.stats.dropExp || 100;
            if (this.logger) this.logger.add(`[戰鬥] 戰鬥勝利！獲得 ${exp} 點經驗。`, "sys-msg"); // 手動呼叫，不受攔截
            GameState.player.exp += exp;
            
            setTimeout(() => { 
                if (this.win) this.win.remove(); 
                GameState.current = "EXPLORE"; 
                if(this.ui) this.ui.render(); 
                if(this.resolveBattle) this.resolveBattle(true); 
            }, 1500);
        } else {
            if (this.logger) this.logger.add(`[戰鬥] 少俠敗陣...`, "warn-msg");
            if(this.resolveBattle) this.resolveBattle(false);
        }
    }
};