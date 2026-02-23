// js/systems/combat.js
import { GameState, StatEngine } from './state.js';
import { DB_ENEMIES } from '../data/db_enemies.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from '../ui/avatar.js';

// 匯入新分離的模組
import { DB_REACTIONS } from '../data/db_reactions.js';
import { CombatUI } from '../ui/combat_ui.js';

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

            // 委託 UI 模組建立戰鬥視窗
            this.win = CombatUI.createWindow(eData);
            
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

    log(msg, cls="sys-msg") {
        if (this.battleEnded) return; 
        if (this.logger) this.logger.add(`[戰鬥] ${msg.replace(/<[^>]*>?/gm, '')}`, cls);
    },

    createContext(attackerRef, targetRef) {
        return {
            attacker: attackerRef, target: targetRef, env: GameState.env, log: (m, c) => this.log(m, c),
            addTag: (t, tag, amt) => { 
                if (this.battleEnded) return; 
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
                    if (!this.battleEnded) CombatUI.showFloatingDamage(cId, 300, 300 / t.maxHp);
                    if(this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }
            },
            addAura: (p, type, amt) => { if(this.battleEnded) return; if(!p.aura[type]) p.aura[type]=0; p.aura[type]+=amt; this.log(`✨ 獲得氣場：${type}`, "story-msg"); },
            addEnv: (type, amt) => { if(this.battleEnded) return; let limit = Math.floor(StatEngine.getDerived(GameState.player).qiCap / 10); GameState.env[type] += amt; if(GameState.env[type] > limit) GameState.env[type] = limit; }
        };
    },

    updateCombatUI() {
        if (!this.battleEnded) {
            // 委託 UI 模組更新畫面
            CombatUI.update(this.win, this.playerRef, this.enemyRef, this.ui);
        }
    },

    triggerEnvDamage() {
        if (this.battleEnded) return;
        let dmgOccurred = false;
        if (this.enemyRef.tags.fire > 0) { 
            let b = this.enemyRef.tags.fire*30; this.enemyRef.hp-=b; this.log(`🔥 灼燒造成 ${b} 傷害。`, "dmg-msg"); 
            CombatUI.showFloatingDamage('bat-target-enemy', b, b / this.enemyRef.maxHp);
            dmgOccurred = true;
        }
        if (GameState.env.turret > 0) { 
            let t = GameState.env.turret*50; this.enemyRef.hp-=t; this.log(`🏹 連弩塔射擊造成 ${t} 傷害！`, "dmg-msg"); 
            CombatUI.showFloatingDamage('bat-target-enemy', t, t / this.enemyRef.maxHp);
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
                this.battleEnded = true;
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
                
                if (this.battleEnded) break; 

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
                CombatUI.showFloatingDamage('bat-target-enemy', 300, 300 / this.enemyRef.maxHp);
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
            if (this.battleEnded || targetRef.hp <= 0) break;

            let mult = 1;
            let skillTags = skill.tags || [];
            
            // 使用新模組的資料庫進行反應判定
            for (let rule of DB_REACTIONS) {
                if (rule.condition(skillTags, targetRef, GameState.env)) {
                    let bonusMult = rule.execute(targetRef, attackerRef, GameState.env, (m, c) => this.log(m, c));
                    if (typeof bonusMult === 'number') mult *= bonusMult; 
                }
            }

            if (this.battleEnded || targetRef.hp <= 0) {
                 this.endBattle(isPlayer);
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
            
            if (!this.battleEnded) CombatUI.showFloatingDamage(containerId, finalDmg, pctMaxHp);
            
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
        if (this.battleEnded) return; 
        this.battleEnded = true;      
        clearInterval(this.interval);
        
        if (isWin) {
            let exp = this.enemyRef.stats.dropExp || 100;
            if (this.logger) this.logger.add(`[戰鬥] 戰鬥勝利！獲得 ${exp} 點經驗。`, "sys-msg"); 
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