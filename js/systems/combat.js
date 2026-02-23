// js/systems/combat.js
import { WindowManager } from '../core/window_manager.js';
import { GameState, StatEngine } from './state.js';
import { DB_ENEMIES } from '../data/db_enemies.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from '../ui/avatar.js';

const REACTION_RULES = [
    { id: "overload", name: "陰陽相激", condition: (tags, t) => tags.includes("寒") && t.tags.fire > 0 || tags.includes("炎") && t.tags.ice > 0, execute: (t, p, e, log) => { t.tags.fire=0; t.tags.ice=0; t.hp-=300; log("♨️ 【陰陽相激】冰火交加引發真氣殉爆！", "dmg-msg"); return { consumed: ["炎","寒"] }; } },
    { id: "shatter", name: "冰封碎裂", condition: (tags, t) => tags.includes("鈍") && t.tags.frozen, execute: (t, p, e, log) => { t.tags.frozen=false; t.hp-= (t.maxHp*0.15 + p.stats.brawn*2); log("💥 【冰封碎裂】重擊擊碎冰塊，造成巨量真實傷害！", "dmg-msg"); return { consumed: ["鈍"] }; } },
    { id: "inferno", name: "風火燎原", condition: (tags, t, e) => tags.includes("風") && t.tags.fire > 0 && e.fire > 0, execute: (t, p, e, log) => { let dmg = t.tags.fire*50 + e.fire*100; t.hp-=dmg; t.tags.fire=0; e.fire=0; log(`🌪️ 【風火燎原】狂風捲起火海，造成 ${dmg} 傷害！`, "dmg-msg"); return {}; } },
    { id: "magnetize", name: "萬物歸宗", condition: (tags, t, e) => tags.includes("牽引") && e.needles > 0, execute: (t, p, e, log) => { let dmg = e.needles * 60; t.hp-=dmg; e.needles=0; log(`🧲 【萬物歸宗】暗器全數貫穿敵人，追加 ${dmg} 傷害！`, "dmg-msg"); return {}; } },
    { id: "mech_boom", name: "機關殉爆", condition: (tags, t, e) => (tags.includes("炎") || tags.includes("鈍")) && e.gears > 0, execute: (t, p, e, log) => { let dmg = e.gears * 80; t.hp-=dmg; e.gears=0; log(`⚙️ 【機關殉爆】齒輪引發連鎖炸裂！`, "dmg-msg"); return {}; } }
];

export const CombatSystem = {
    win: null, playerRef: null, enemyRef: null, interval: null, resolveBattle: null,
    isPlayerTurnStarted: false, 
    isExecuting: false, // 【關鍵修正】：動畫與結算互斥鎖

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
            this.playerRef = { hp: GameState.player.hp, maxHp: GameState.player.maxHp, wait: 0, currentCombo: 0, aura: {} };
            GameState.env = { needles: 0, fire: 0, gears: 0, taichi: 0, turret: 0 };
            
            this.isPlayerTurnStarted = false;
            this.isExecuting = false;

            let skillHtml = GameState.player.activeSkills.map((skId) => {
                let sk = DB_SKILLS[skId];
                return `<button class="sys-btn bat-skill-btn" data-id="${skId}" style="width:48%; margin-bottom:4px;" disabled>${sk.name} (-${sk.comboCost})</button>`;
            }).join('');

 let html = `
                <div style="width: 520px; max-width: 100%;"> <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <button id="bat-mode-toggle" class="sys-btn" style="background:#0000aa; width:100%; border-color:#aaa;">當前模式：${GameState.player.combatMode === 'auto' ? '全自動' : '半自動手動'} (點擊切換)</button>
                    </div>
                    <div class="battle-ui" style="display:flex; justify-content:space-between; align-items:flex-end;">
                        <div id="bat-target-player" style="text-align:center; width:45%;">
                            <div style="color:#ffaa55; font-weight:bold;">少俠</div>
                            <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-p" class="bar-fill" style="width:100%;"></div></div>
                            <div id="bat-aa-p" style="display:flex; justify-content:center; margin-top:10px;">${AvatarUI.getCombatHTML()}</div>
                            <div class="zone-box"><div class="zone-title">【自身氣場 Aura】</div><div id="bat-aura-content">- 無 -</div></div>
                        </div>
                        <div style="font-size:24px; color:#555; font-weight:bold;">VS</div>
                        <div id="bat-target-enemy" style="text-align:center; width:45%;">
                            <div style="color:#ff5555; font-weight:bold;">${eData.name}</div>
                            <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-e" class="bar-fill" style="width:100%;"></div></div>
                            <pre class="aa-box" id="bat-aa-e" style="color:#ffaaaa; margin-top:10px;">${eData.aa}</pre>
                            <div class="zone-box"><div class="zone-title">【目標印記 Target】</div><div id="bat-target-content">- 無 -</div></div>
                        </div>
                    </div>
                    
                    <div class="zone-box env-zone" style="margin-bottom:10px;">
                        <div class="zone-title" style="text-align:left;">【環境滯留區 Environment】</div>
                        <div id="bat-env-content">- 戰場乾淨無物 -</div>
                    </div>

                    <div style="margin: 5px 0;">
                        <div style="font-size:12px; color:#aaa; display:flex; justify-content:space-between;">
                            <span>連擊檢定率 (出招消耗)</span><span id="bat-combo-text">0 / 0</span>
                        </div>
                        <div class="bar-bg" style="width:100%; height:8px; margin-top:2px;">
                            <div id="bat-combo-bar" class="bar-fill" style="background:#cc55ff; width:0%; transition: width 0.2s;"></div>
                        </div>
                    </div>

                    <div id="bat-controls" style="display:flex; gap:5px; margin-bottom:10px; flex-wrap:wrap;">
                        ${skillHtml}
                        <button class="sys-btn" id="bat-end-turn" style="background:#550000; width:100%; font-weight:bold;" disabled>收招 (結束回合)</button>
                    </div>
                    <div id="bat-log" class="bat-log-container" style="height:100px; border:2px inset #555; background:#000; padding:8px; overflow-y:auto; font-size:14px;"></div>
                </div>
            `;
            
            this.win = WindowManager.create(`⚔️ 戰鬥爆發`, html, true);
            this.log("戰鬥開始！", "sys-msg");
            
            setTimeout(() => {
                this.win.querySelector('#bat-mode-toggle').onclick = (e) => {
                    GameState.player.combatMode = GameState.player.combatMode === 'auto' ? 'manual' : 'auto';
                    e.target.innerText = `當前模式：${GameState.player.combatMode === 'auto' ? '全自動' : '半自動手動'} (點擊切換)`;
                    this.updateCombatUI();
                    if (GameState.player.combatMode === 'auto' && this.playerRef.wait >= 100 && !this.isExecuting) {
                        this.tick();
                    }
                };
                this.win.querySelectorAll('.bat-skill-btn').forEach(btn => {
                    btn.onclick = () => this.executePlayerAction(DB_SKILLS[btn.getAttribute('data-id')]);
                });
                this.win.querySelector('#bat-end-turn').onclick = () => this.endPlayerTurn();
            }, 100);

            if(this.interval) clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 50);
        });
    },

    log(msg, cls="sys-msg") {
        let el = document.getElementById('bat-log');
        if (el) { el.innerHTML += `<div class="${cls}">${msg}</div>`; el.scrollTop = el.scrollHeight; }
        if (this.logger) this.logger.add(`[戰鬥] ${msg.replace(/<[^>]*>?/gm, '')}`, cls);
    },

    createContext(attackerRef, targetRef) {
        return {
            attacker: attackerRef, target: targetRef, env: GameState.env, log: (m, c) => this.log(m, c),
            addTag: (t, tag, amt) => { 
                if(!t.tags[tag]) t.tags[tag]=0; t.tags[tag]+=amt; 
                if(tag==='ice' && t.tags.ice>=3) { t.tags.ice=0; t.tags.frozen=true; this.log(`🧊 寒氣入骨，凍結了！`, "story-msg"); }
                if(tag==='silk' && t.tags.silk>=5) { t.tags.silk=0; t.hp-=300; this.log(`🕸️ 天羅地網絞殺！`, "warn-msg"); if(this.win) this.win.classList.add('shake-effect'); }
            },
            addAura: (p, type, amt) => { if(!p.aura[type]) p.aura[type]=0; p.aura[type]+=amt; this.log(`✨ 獲得氣場：${type}`, "story-msg"); },
            addEnv: (type, amt) => { let limit = Math.floor(StatEngine.getDerived(GameState.player).qiCap / 10); GameState.env[type] += amt; if(GameState.env[type] > limit) GameState.env[type] = limit; }
        };
    },

    updateCombatUI() {
        if (!this.win) return;
        let pEl = document.getElementById('bat-hp-p'), eEl = document.getElementById('bat-hp-e');
        if (pEl) pEl.style.width = `${Math.max(0, (this.playerRef.hp / this.playerRef.maxHp) * 100)}%`;
        if (eEl) eEl.style.width = `${Math.max(0, (this.enemyRef.hp / this.enemyRef.maxHp) * 100)}%`;
        GameState.player.hp = this.playerRef.hp; 
        if(this.ui) this.ui.updateStats();

        let tHtml = [];
        if(this.enemyRef.tags.ice) tHtml.push(`<span class="tag ice">❄️ 寒氣 x${this.enemyRef.tags.ice}</span>`);
        if(this.enemyRef.tags.fire) tHtml.push(`<span class="tag fire">🔥 炎勁 x${this.enemyRef.tags.fire}</span>`);
        if(this.enemyRef.tags.silk) tHtml.push(`<span class="tag silk">🕸️ 絲線 x${this.enemyRef.tags.silk}</span>`);
        if(this.enemyRef.tags.frozen) tHtml.push(`<span class="tag ice">🧊 冰封</span>`);
        document.getElementById('bat-target-content').innerHTML = tHtml.join('') || '- 無 -';

        let aHtml = [];
        for(let k in this.playerRef.aura) if(this.playerRef.aura[k] > 0) aHtml.push(`<span class="tag aura">✨ ${k} x${this.playerRef.aura[k]}</span>`);
        document.getElementById('bat-aura-content').innerHTML = aHtml.join('') || '- 無 -';

        let eHtml = [];
        if(GameState.env.needles) eHtml.push(`<span class="tag blunt">📌 暗器 x${GameState.env.needles}</span>`);
        if(GameState.env.fire) eHtml.push(`<span class="tag fire">♨️ 火種 x${GameState.env.fire}</span>`);
        if(GameState.env.gears) eHtml.push(`<span class="tag trap">⚙️ 齒輪 x${GameState.env.gears}</span>`);
        if(GameState.env.taichi) eHtml.push(`<span class="tag soft">☯ 太極陣 x${GameState.env.taichi}</span>`);
        if(GameState.env.turret) eHtml.push(`<span class="tag blunt">🏹 連弩塔 x${GameState.env.turret}</span>`);
        document.getElementById('bat-env-content').innerHTML = eHtml.join('') || '- 戰場乾淨無物 -';

        let isMyTurn = this.playerRef.wait >= 100 && GameState.player.combatMode === 'manual' && !this.isExecuting;
        this.win.querySelectorAll('.bat-skill-btn, #bat-end-turn').forEach(btn => btn.disabled = !isMyTurn);
        
        let derP = StatEngine.getDerived(GameState.player);
        let comboPct = Math.max(0, this.playerRef.currentCombo / derP.comboMax * 100);
        let bar = this.win.querySelector('#bat-combo-bar'), txt = this.win.querySelector('#bat-combo-text');
        if (bar) bar.style.width = comboPct + '%';
        if (txt) txt.innerText = `${this.playerRef.currentCombo} / ${derP.comboMax}`;
    },

    tick() {
        if (this.isExecuting) return; // 【關鍵修正】：如果動畫正在播放，絕對禁止推演時間軸

        let derP = StatEngine.getDerived(GameState.player);
        let derE = StatEngine.getDerived(this.enemyRef);

        if (!this.enemyRef.tags.frozen) this.enemyRef.wait += (derE.atbSpd / 20);
        
        if (this.playerRef.wait < 100) {
            this.playerRef.wait += (derP.atbSpd / 20);
            if (this.playerRef.wait >= 100) {
                this.playerRef.wait = 100;
                if (!this.isPlayerTurnStarted) {
                    this.playerRef.currentCombo = derP.comboMax;
                    this.isPlayerTurnStarted = true;
                    this.log(`【你的回合】準備出招！極限連擊率：${derP.comboMax}`, "story-msg");
                }
            }
        }

        // 全自動 AI 邏輯
        if (this.playerRef.wait >= 100 && GameState.player.combatMode === 'auto') {
            let affordableSkills = GameState.player.activeSkills.filter(id => DB_SKILLS[id].comboCost <= this.playerRef.currentCombo);
            if (affordableSkills.length > 0) {
                let sk = DB_SKILLS[affordableSkills[Math.floor(Math.random() * affordableSkills.length)]];
                this.executePlayerAction(sk);
            } else {
                this.endPlayerTurn();
            }
            return; 
        }

        // 半自動手動等待邏輯
        if (this.playerRef.wait >= 100 && GameState.player.combatMode === 'manual') {
            clearInterval(this.interval); 
            this.updateCombatUI();
            return;
        }
        
        if (this.enemyRef.wait >= 100) {
            this.enemyRef.wait = 0;
            let skills = this.enemyRef.stats.skills || ["s_enemy_slash"];
            this.executeEnemyAction(DB_SKILLS[skills[Math.floor(Math.random() * skills.length)]]);
            return;
        }

        this.updateCombatUI();
    },

    async executePlayerAction(skill) {
        if (this.isExecuting) return;
        this.isExecuting = true; // 鎖定系統
        clearInterval(this.interval); 
        this.win.querySelectorAll('.bat-skill-btn, #bat-end-turn').forEach(b => b.disabled = true);
        
        let derP = StatEngine.getDerived(GameState.player), derE = StatEngine.getDerived(this.enemyRef);

        let roll = Math.floor(Math.random() * 100) + 1;
        if (roll > this.playerRef.currentCombo) {
            this.log(`【破綻】檢定失敗 (骰出 ${roll} > 剩餘 ${this.playerRef.currentCombo})！`, "warn-msg");
            if(this.win) { this.win.classList.add('shake-effect'); setTimeout(() => this.win.classList.remove('shake-effect'), 200); }
            this.endPlayerTurn(); 
            this.isExecuting = false;
            return;
        }

        this.playerRef.currentCombo -= skill.comboCost;
        this.updateCombatUI(); 
        this.log(`[少俠] 施展 <span style="color:#55aaff">${skill.name}</span>！`, "story-msg");

        await this.performAttack(true, skill, derP, derE, this.playerRef, this.enemyRef);

        this.isExecuting = false; // 解除鎖定

        if (this.enemyRef.hp <= 0 || this.playerRef.hp <= 0) return;

        if (this.playerRef.currentCombo <= 0) {
            this.log(`氣力耗盡，收招退守。`, "sys-msg");
            this.endPlayerTurn();
        } else {
            if (GameState.player.combatMode === 'auto') {
                // 自動模式下，給予 0.5 秒的視覺緩衝節奏，然後再觸發下一招
                setTimeout(() => { if (this.playerRef.hp > 0 && this.enemyRef.hp > 0) this.tick(); }, 500);
            } else {
                this.win.querySelectorAll('.bat-skill-btn, #bat-end-turn').forEach(b => b.disabled = false);
            }
        }
    },

    async executeEnemyAction(skill) {
        if (this.isExecuting) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        let derE = StatEngine.getDerived(this.enemyRef), derP = StatEngine.getDerived(GameState.player);
        this.log(`[護法] 施展 <span style="color:#ff5555">${skill.name}</span>！`, "warn-msg");
        await this.performAttack(false, skill, derE, derP, this.enemyRef, this.playerRef);
        
        this.isExecuting = false;

        if (this.playerRef.hp > 0 && this.enemyRef.hp > 0) {
            clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 50);
        }
    },

    endPlayerTurn() {
        clearInterval(this.interval); // 確保呼叫時先清除殘留計時器
        this.playerRef.wait = 0;
        this.isPlayerTurnStarted = false;
        
        if (this.enemyRef.tags.fire > 0) { let b = this.enemyRef.tags.fire*30; this.enemyRef.hp-=b; this.log(`🔥 灼燒造成 ${b} 傷害。`, "dmg-msg"); }
        if (GameState.env.turret > 0) { let t = GameState.env.turret*50; this.enemyRef.hp-=t; this.log(`🏹 連弩塔射擊造成 ${t} 傷害！`, "dmg-msg"); }

        this.updateCombatUI();
        if (this.enemyRef.hp <= 0) this.endBattle(true);
        else if (this.playerRef.hp <= 0) this.endBattle(false);
        else {
            clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 50); // 安全重啟時間軸
        }
    },

    async performAttack(isPlayer, skill, derAtk, derDef, attackerRef, targetRef) {
        let dodgeChance = 20 + (derDef.dodge - derAtk.hit) * 1;
        dodgeChance = Math.max(0, Math.min(100, dodgeChance));
        
        if (!isPlayer) {
            if(this.playerRef.aura['木甲'] > 0) {
                this.playerRef.aura['木甲'] -= 200; this.log(`🛡️ 神工木甲吸收了傷害！`, "story-msg");
                if(this.playerRef.aura['木甲'] <= 0) { this.playerRef.aura['木甲']=0; this.log("💥 木甲損毀！"); } return;
            }
            if(this.playerRef.aura['疾風'] > 0) { this.playerRef.aura['疾風']--; this.log("💨 逍遙步絕對閃避！", "story-msg"); return; }
            if(this.playerRef.aura['反擊'] > 0) { this.playerRef.aura['反擊']--; this.enemyRef.hp -= 300; this.log(`☯ 借力打力反彈傷害！`, "dmg-msg"); return; }
        }

        if (Math.random() * 100 < dodgeChance) {
            this.log(`殘影一閃，${isPlayer ? '敵人' : '少俠'}完全閃避了攻擊！(${dodgeChance}%)`, "sys-msg");
            return;
        }

        let hitCount = skill.hits || 1;
        if (hitCount > 1 && Math.random() < (derAtk.dex / 200)) { hitCount++; this.log(`追加連擊！`, "story-msg"); }

        for (let i = 0; i < hitCount; i++) {
            if (targetRef.hp <= 0) break;

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

            let mult = 1;
            for (let rule of REACTION_RULES) {
                if (rule.condition(skill.tags, targetRef, GameState.env)) {
                    let res = rule.execute(targetRef, attackerRef, GameState.env, (m, c) => this.log(m, c));
                    mult += 0.5;
                }
            }

            let baseAtk = skill.type === 'phys' ? derAtk.pAtk : derAtk.qAtk;
            let rawDmg = (baseAtk + skill.power) * (0.9 + Math.random() * 0.2) * mult;
            
            if (Math.random() * 100 < derAtk.critChance) {
                rawDmg *= derAtk.critMult;
                this.log(`💥 會心一擊！`, "dmg-msg");
                if (this.win) { this.win.classList.add('shake-effect'); setTimeout(() => this.win.classList.remove('shake-effect'), 200); }
            }

            let finalDmg = (rawDmg - derDef.fixDef) * (1 - derDef.pctDef / 100);
            finalDmg = Math.max(1, Math.floor(finalDmg));

            targetRef.hp -= finalDmg;
            if (!isPlayer && finalDmg > 0) AvatarUI.playAction('hurt', true);
            
            if (skill.onHit) skill.onHit(this.createContext(attackerRef, targetRef));

            this.log(`造成 <span class="dmg-msg">${finalDmg}</span> 傷害。`, "sys-msg");
            this.updateCombatUI();

            await new Promise(r => setTimeout(r, 200));
        }

        if (this.enemyRef.hp <= 0) this.endBattle(true);
        else if (this.playerRef.hp <= 0) this.endBattle(false);
    },

    endBattle(isWin) {
        clearInterval(this.interval);
        if (isWin) {
            let exp = this.enemyRef.stats.dropExp || 100;
            this.log(`戰鬥勝利！獲得 ${exp} 點經驗。`, "sys-msg");
            GameState.player.exp += exp;
            
            setTimeout(() => { 
                this.win.remove(); 
                GameState.current = "EXPLORE"; 
                if(this.ui) this.ui.render(); 
                if(this.resolveBattle) this.resolveBattle(true); 
            }, 1500);
        } else {
            this.log(`少俠敗陣...`, "warn-msg");
            if(this.resolveBattle) this.resolveBattle(false);
        }
    }
};