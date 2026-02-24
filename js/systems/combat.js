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

            // 雙方皆初始化 aura 氣場、連擊值與 hitCombo 打擊數
            this.enemyRef = { 
                id: enemyId, hp: eData.hp, maxHp: eData.maxHp, 
                wait: 0, currentCombo: 0, // 新增初始化敵方連擊值
                stats: eData.stats, tags: {}, 
                aura: eData.aura ? { ...eData.aura } : {}, // 繼承開場氣場
                hitCombo: 0 
            };
            this.playerRef = { hp: GameState.player.hp, maxHp: GameState.player.maxHp, wait: 0, currentCombo: 0, aura: {}, tags: {}, hitCombo: 0 };
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

    // 讓 createContext 可以辨識對象
    createContext(attackerRef, targetRef) {
        return {
            attacker: attackerRef, target: targetRef, env: GameState.env, log: (m, c) => this.log(m, c),
            addTag: (t, tag, amt) => { 
                if (this.battleEnded) return; 
                if (!t.tags) t.tags = {};
                if (!t.tags[tag]) t.tags[tag] = 0; 
                t.tags[tag] += amt; 
                
                let targetName = t === this.playerRef ? '少俠' : '敵人';
                
                if (tag === 'ice' && t.tags.ice >= 3) { 
                    t.tags.ice = 0; 
                    t.tags.frozen = true; 
                    t.tags.frozen_timer = 0;
                    this.log(`🧊 寒氣入骨，${targetName}被凍結了！防禦力大幅下降且無法行動！`, "warn-msg"); 
                    if(this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }
                if (tag === 'silk' && t.tags.silk >= 5) { 
                    t.tags.silk = 0; 
                    t.hp -= 300; 
                    this.log(`🕸️ 天羅地網絞殺！對${targetName}造成 300 點真實傷害！`, "warn-msg"); 
                    let cId = t === this.playerRef ? 'bat-target-player' : 'bat-target-enemy';
                    if (!this.battleEnded) CombatUI.showFloatingDamage(cId, 300, 300 / t.maxHp);
                    if(this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }
            },
            addAura: (p, type, amt) => { 
                if(this.battleEnded) return; 
                if(!p.aura) p.aura={};
                if(!p.aura[type]) p.aura[type]=0; 
                p.aura[type]+=amt; 
                let pName = p === this.playerRef ? '少俠' : '敵人';
                this.log(`✨ ${pName}獲得氣場：${type}`, "story-msg"); 
            },
            addEnv: (type, amt) => { 
                if(this.battleEnded) return; 
                let limit = Math.floor(StatEngine.getDerived(GameState.player).qiCap / 10); 
                GameState.env[type] += amt; 
                if(GameState.env[type] > limit) GameState.env[type] = limit; 
            }
        };
    },

    updateCombatUI() {
        if (!this.battleEnded) {
            CombatUI.update(this.win, this.playerRef, this.enemyRef, this.ui);
        }
    },

    // 讓環境傷害對雙方都進行結算
    triggerEnvDamage() {
        if (this.battleEnded) return;
        let dmgOccurred = false;

        // 結算雙方身上的灼燒傷害
        [this.enemyRef, this.playerRef].forEach(t => {
            if (t.tags.fire > 0) {
                let b = t.tags.fire * 30;
                t.hp -= b;
                let targetName = t === this.playerRef ? "少俠" : "敵人";
                this.log(`🔥 灼燒對${targetName}造成 ${b} 傷害。`, "dmg-msg");
                let cId = t === this.playerRef ? 'bat-target-player' : 'bat-target-enemy';
                CombatUI.showFloatingDamage(cId, b, b / t.maxHp);
                dmgOccurred = true;
            }
        });

        if (GameState.env.turret > 0) { 
            let t = GameState.env.turret*50; this.enemyRef.hp-=t; this.log(`🏹 連弩塔射擊造成 ${t} 傷害！`, "dmg-msg"); 
            CombatUI.showFloatingDamage('bat-target-enemy', t, t / this.enemyRef.maxHp);
            dmgOccurred = true;
        }

        if (dmgOccurred) {
            this.updateCombatUI();
            if (this.enemyRef.hp <= 0) this.endBattle(true);
            else if (this.playerRef.hp <= 0) this.endBattle(false);
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
            // 敵人回合開始時，補滿連擊氣力值
            this.enemyRef.currentCombo = derE.comboMax;
            this.updateCombatUI();
            
            // 呼叫全新的敵方連擊函數
            this.executeEnemyComboChain(derE, derP);
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
                    this.log(`【破綻】氣力不繼，收招退守。(判定：${roll} > 剩餘 ${Math.floor(this.playerRef.currentCombo)})`, "warn-msg");
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

    // 敵方全新的連段與 AI 決策系統
    async executeEnemyComboChain(derE, derP) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        try {
            // 只要雙方還活著，且敵人連擊條還沒因為破綻而中斷，就繼續攻擊
            while (this.enemyRef.hp > 0 && this.playerRef.hp > 0 && !this.battleEnded) {
                let skills = this.enemyRef.stats.skills || ["s_enemy_slash"];
                let chosenSkillId = skills[Math.floor(Math.random() * skills.length)];

                // === 敵方 AI 動態決策覆寫 ===
                // 唐翎專屬 AI：若連段中途彈藥打光，立刻轉為裝填 (但不瞬間補滿，而是讓招式去補)
                if (this.enemyRef.id === 'e_boss_tang') {
                    let ammo = this.enemyRef.aura && this.enemyRef.aura['千機匣'] ? this.enemyRef.aura['千機匣'] : 0;
                    if (ammo <= 0) {
                        chosenSkillId = 'e_tl_reload'; 
                        this.log("【千機匣空竭】唐翎被迫退守重新裝填！", "sys-msg");
                    } else if (chosenSkillId === 'e_tl_reload') {
                        chosenSkillId = 'e_tl_gatling'; 
                    }
                } 
                // 武男專屬 AI：若連段中途境界疊滿 5 層，立刻打出大絕
                else if (this.enemyRef.id === 'e_elite_wunan') {
                    let chongtian = this.enemyRef.aura && this.enemyRef.aura['重天'] ? this.enemyRef.aura['重天'] : 0;
                    if (chongtian >= 5) {
                        chosenSkillId = 'e_wu_ult'; 
                        this.log("⚡ 武男狂氣突破極限！釋放終極殺招！", "warn-msg");
                    } else if (chosenSkillId === 'e_wu_ult') {
                        chosenSkillId = 'e_wu_push';
                    }
                }
                // 👇 新增：翩若專屬 AI (架勢切換與二階段判定)
                else if (this.enemyRef.id === 'e_boss_pianruo') {
                    // 初始化架勢與階段
                    if (!this.enemyRef.stanceLevel) {
                        this.enemyRef.stanceLevel = 1;
                        this.enemyRef.stanceType = 'def'; // 開局守勢
                        this.enemyRef.isPhase2 = false;
                        if (!this.enemyRef.aura) this.enemyRef.aura = {};
                        this.enemyRef.aura['游雲'] = 1; 
                    }

                    // 二階段判定：血量低於 50% 且架勢已達滿級 (4層)
                    if (this.enemyRef.hp < this.enemyRef.maxHp * 0.5 && this.enemyRef.stanceLevel >= 4 && !this.enemyRef.isPhase2) {
                        this.enemyRef.isPhase2 = true;
                        this.enemyRef.aura = { '空之境界': 1 }; // 清空所有架勢，進入空之境界
                        this.enemyRef.currentCombo = 400; // 賦予極高氣力以施展無限連擊
                        this.log("「只要是活著的東西，就算是神也殺給你看。」翩若睜開了雙眼！", "warn-msg");
                        if (this.win) this.win.classList.add('shake-effect');
                    }

                    if (this.enemyRef.isPhase2) {
                        // 空之境界 (連擊模式)
                        let p2Skills = ['e_pr_void_slash', 'e_pr_void_slash', 'e_pr_void_break'];
                        // 若連擊氣力快耗盡，則以直死魔眼收尾
                        if (this.enemyRef.currentCombo <= 120 && this.enemyRef.currentCombo >= 80) {
                            chosenSkillId = 'e_pr_void_death';
                        } else {
                            chosenSkillId = p2Skills[Math.floor(Math.random() * p2Skills.length)];
                        }
                    } else {
                        // 第一階段 (回合制切換模式，招式的 comboCost 會設定極高以強制斷連段)
                        if (this.enemyRef.stanceType === 'def') {
                            chosenSkillId = Math.random() < 0.5 ? 'e_pr_def_step' : 'e_pr_def_wind';
                        } else {
                            chosenSkillId = Math.random() < 0.5 ? 'e_pr_off_light' : 'e_pr_off_strike';
                        }
                    }
                }
                // 👆 翩若 AI 結束

                let skill = DB_SKILLS[chosenSkillId];
                if (!skill) break;

                this.log(`[敵方] 施展 ${skill.name}！`, "warn-msg");
                
                // 執行攻擊 (由於 performAttack 是共用的，敵人也會正確結算動畫與傷害)
                await this.performAttack(false, skill, derE, derP, this.enemyRef, this.playerRef);
                
                if (this.battleEnded) break; 

                // 扣除氣力值並更新 UI
                this.enemyRef.currentCombo -= (skill.comboCost || 20); // 預設扣 20 防止無限連段
                this.updateCombatUI();

                // 結算連擊破綻機率 (完全比照玩家邏輯)
                let roll = Math.floor(Math.random() * 100) + 1;
                if (roll > this.enemyRef.currentCombo) {
                    this.log(`【敵方破綻】氣力不繼，攻勢暫歇。(判定：${roll} > 剩餘 ${Math.floor(this.enemyRef.currentCombo)})`, "sys-msg");
                    break; 
                } else {
                    this.log(`⚡ 敵方攻勢連綿不斷！馬上接續下一招！`, "sys-msg");
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

    // 將氣場防禦機制對稱化，並加入連段 (Hit Combo) 結算
    async performAttack(isPlayer, skill, derAtk, derDef, attackerRef, targetRef) {
        if (this.battleEnded) return;   
        if(targetRef === this.enemyRef && targetRef.aura['蔽月'] > 0) {
            targetRef.hp = Math.min(targetRef.maxHp, targetRef.hp + 50); // 翩若回血
            attackerRef.hp -= 150; // 反彈傷害
            this.log(`🌙 【蔽月】翩若柔化了攻勢，並反擊了 150 點傷害！`, "warn-msg"); 
            CombatUI.showFloatingDamage('bat-target-player', 150, 150 / attackerRef.maxHp);
            if (attackerRef.hp <= 0) { this.updateCombatUI(); this.endBattle(false); return; }
        }
        // 共用防禦氣場判斷
        if(targetRef.aura['木甲'] > 0) {
            targetRef.aura['木甲'] -= 200; 
            this.log(`🛡️ 神工木甲吸收了傷害！`, "story-msg");
            if(targetRef.aura['木甲'] <= 0) { targetRef.aura['木甲']=0; this.log("💥 木甲損毀！"); } 
            return;
        }
        if(targetRef.aura['疾風'] > 0) { 
            targetRef.aura['疾風']--; 
            this.log("💨 逍遙步絕對閃避！", "story-msg"); 
            return; 
        }
        if(targetRef.aura['反擊'] > 0) { 
            targetRef.aura['反擊']--; 
            attackerRef.hp -= 300; 
            this.log(`☯ 借力打力反彈傷害！`, "dmg-msg"); 
            let cId = (attackerRef === this.enemyRef) ? 'bat-target-enemy' : 'bat-target-player';
            CombatUI.showFloatingDamage(cId, 300, 300 / attackerRef.maxHp);
            if (attackerRef.hp <= 0) { this.updateCombatUI(); this.endBattle(targetRef === this.playerRef); }
            return; 
        }

        // 補上 DB_SKILLS 提到的「冰盾」與「絲陣」受擊反傷氣場效果
        if(targetRef.aura['冰盾'] > 0) {
            targetRef.aura['冰盾']--;
            this.createContext(attackerRef, targetRef).addTag(attackerRef, 'ice', 1);
            this.log(`❄️ 冰盾破碎，寒氣反噬了攻擊者！`, "story-msg");
        }
        if(targetRef.aura['絲陣'] > 0 && skill.type === 'phys') {
            targetRef.aura['絲陣']--;
            this.createContext(attackerRef, targetRef).addTag(attackerRef, 'silk', 1);
            this.log(`🕸️ 盤絲舞動，絲線纏繞了近戰攻擊者！`, "warn-msg");
        }

        // 閃避判定：只有 power > 0 的招式（有傷害的）才會被閃避
        if (skill.power > 0) {
            let dodgeChance = 20 + (derDef.dodge - derAtk.hit) * 1;
            if (targetRef.tags && targetRef.tags.frozen) dodgeChance = 0; 
            dodgeChance = Math.max(0, Math.min(100, dodgeChance));

            if (Math.random() * 100 < dodgeChance) {
                this.log(`殘影一閃，完全閃避了攻擊！`, "sys-msg");
                // 閃避成功，攻擊者的連擊評價歸零
                attackerRef.hitCombo = 0;
                if (CombatUI.showHitCombo) CombatUI.showHitCombo(isPlayer, 0);
                return;
            }
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
            
            for (let rule of DB_REACTIONS) {
                // 傳入 attackerRef 作為第四個參數，讓連鎖反應能正確消耗攻擊者氣場
                if (rule.condition(skillTags, targetRef, GameState.env, attackerRef)) {
                    let bonusMult = rule.execute(targetRef, attackerRef, GameState.env, (m, c) => this.log(m, c));
                    if (typeof bonusMult === 'number') mult *= bonusMult; 
                }
            }

            if (this.battleEnded || targetRef.hp <= 0) {
                 this.endBattle(isPlayer);
                 break; 
            }

            let finalDmg = 0;
            
            // 只有 power > 0 的技能才計算傷害，避免裝填技顯示 0 傷害或觸發會心
            if (skill.power > 0) {
                let baseAtk = skill.type === 'phys' ? derAtk.pAtk : derAtk.qAtk;
                let rawDmg = (baseAtk + skill.power) * (0.9 + Math.random() * 0.2) * mult;
                
                if (Math.random() * 100 < derAtk.critChance) {
                    rawDmg *= derAtk.critMult;
                    this.log(`💥 會心一擊！`, "dmg-msg");
                    if (this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }

                let fixDef = (targetRef.tags && targetRef.tags.frozen) ? 0 : derDef.fixDef;
                let pctDef = (targetRef.tags && targetRef.tags.frozen) ? derDef.pctDef / 2 : derDef.pctDef;
                // 👇 新增【芙蕖】護甲穿透
                if (attackerRef.aura && attackerRef.aura['芙蕖'] > 0) {
                    fixDef = 0; pctDef = 0;
                    this.log(`🌸 【芙蕖】劍氣無視了所有防禦！`, "warn-msg");
                }
                
                finalDmg = (rawDmg - fixDef) * (1 - pctDef / 100);
                finalDmg = (rawDmg - fixDef) * (1 - pctDef / 100);
                finalDmg = Math.max(1, Math.floor(finalDmg));

                targetRef.hp -= finalDmg;
                if (!isPlayer && finalDmg > 0 && !this.battleEnded) AvatarUI.playAction('hurt', true);
            }
            
            // 連段堆疊與結算
            attackerRef.hitCombo = (attackerRef.hitCombo || 0) + 1; 
            targetRef.hitCombo = 0; 
            
            if (CombatUI.showHitCombo) {
                CombatUI.showHitCombo(isPlayer, attackerRef.hitCombo);
                CombatUI.showHitCombo(!isPlayer, 0);
            }

            if (finalDmg > 0) {
                let pctMaxHp = finalDmg / targetRef.maxHp;
                let containerId = isPlayer ? 'bat-target-enemy' : 'bat-target-player';
                if (!this.battleEnded) CombatUI.showFloatingDamage(containerId, finalDmg, pctMaxHp);
                this.log(`造成 ${finalDmg} 傷害。`, "sys-msg");
            }
            
            if (skill.onHit) skill.onHit(this.createContext(attackerRef, targetRef));

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
            let dropStats = this.enemyRef.stats.dropStats;
            let statMsg = "";
            
            GameState.player.exp += exp;
            
            if (dropStats) {
                let statsDict = { brawn:'臂力', physique:'根骨', qiCap:'內息', qiPot:'真元', agi:'身法', dex:'靈巧', per:'洞察', comp:'悟性' };
                let gains = [];
                for (let k in dropStats) {
                    GameState.player.stats[k] += dropStats[k];
                    gains.push(`${statsDict[k]}+${dropStats[k]}`);
                }
                statMsg = ` 屬性提升：${gains.join('、')}！`;
            }
            
            if (this.logger) this.logger.add(`[戰鬥] 戰鬥勝利！獲得 ${exp} 點經驗。${statMsg}`, "sys-msg"); 
            
            setTimeout(() => { 
                if (this.win) this.win.remove(); 
                GameState.current = "EXPLORE"; 
                if(this.ui) this.ui.render(); 
                if(this.resolveBattle) this.resolveBattle(true); 
            }, 1500);
        } else {
            if (this.logger) this.logger.add(`[戰鬥] 少俠敗陣...`, "warn-msg");
            if(this.resolveBattle) this.resolveBattle(false);
            
            if (this.win) {
                let content = this.win.querySelector('.drag-content');
                if (content) {
                    content.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px;">
                            <div style="font-size: 36px; color: #ff0000; text-shadow: 0 0 15px #ff0000, 2px 2px 0 #000; margin-bottom: 20px; font-weight: 900; letter-spacing: 5px;">
                                勝敗乃兵家常事
                            </div>
                            <div style="color: #aaa; margin-bottom: 40px; font-size: 16px;">
                                少俠傷重倒地，您的大俠之路就此畫下句點...
                            </div>
                            <button id="bat-btn-restart" class="sys-btn" style="font-size: 20px; padding: 12px 40px; border-color: #ff5555; color: #ffaaaa; background: #440000; cursor: pointer; box-shadow: 0 0 10px rgba(255,0,0,0.5);">
                                🔄 重新來過
                            </button>
                        </div>
                    `;
                    let btnRestart = content.querySelector('#bat-btn-restart');
                    if (btnRestart) btnRestart.onclick = () => window.location.reload(); 
                }
            }
        }
    }
}