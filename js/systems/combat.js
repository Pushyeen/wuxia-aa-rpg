// js/systems/combat.js
import { GameState, StatEngine } from './state.js';
import { DB_ENEMIES } from '../data/db_enemies.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from '../ui/avatar.js';
import { DB_REACTIONS } from '../data/db_reactions.js';
import { CombatUI } from '../ui/combat_ui.js';
import { DB_AURAS } from '../data/db_auras.js';

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

            this.enemyRef = { 
                id: enemyId, hp: eData.hp, maxHp: eData.maxHp, 
                wait: 0, currentCombo: 0, turnSkillCount: 0, _exhaustLogged: false, // 新增追蹤變數
                stats: eData.stats, tags: {}, 
                aura: eData.aura ? { ...eData.aura } : {}, 
                hitCombo: 0 
            };
            this.playerRef = { 
                hp: GameState.player.hp, maxHp: GameState.player.maxHp, wait: 0, currentCombo: 0, 
                turnSkillCount: 0, _exhaustLogged: false, aura: {}, tags: {}, hitCombo: 0 
            };
            
            GameState.env = { needles: 0, fire: 0, gears: 0, taichi: 0, turret: 0, ice_cone: 0 };
            
            this.isExecuting = false;
            this.isAttemptingFlee = false;
            this.envTick = 0;
            this.battleEnded = false;

            this.win = CombatUI.createWindow(eData);
            
            if (this.logger) this.logger.add(`[戰鬥] 戰鬥開始！雙方進入交鋒狀態。`, "sys-msg");

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

                let btnMode = this.win.querySelector('#bat-btn-mode');
                if (btnMode) {
                    const modeNames = { 'manual': '手動', 'auto_rand': '自動(隨機)', 'auto_safe': '自動(穩健)', 'auto_aggro': '自動(狂攻)' };
                    btnMode.onclick = () => {
                        const modes = ['manual', 'auto_rand', 'auto_safe', 'auto_aggro'];
                        let idx = modes.indexOf(GameState.player.combatMode);
                        GameState.player.combatMode = modes[(idx + 1) % modes.length]; // 循環切換
                        btnMode.innerText = `模式: ${modeNames[GameState.player.combatMode]}`;
                        this.log(`戰鬥模式切換為：${modeNames[GameState.player.combatMode]}`, "sys-msg");
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
                
                let maxCaps = { '霓裳': 2, '空城': 1 };
                let current = p.aura[type];
                let cap = maxCaps[type] || 999; 
                let actualAmt = amt;
                if (current + amt > cap) actualAmt = cap - current; 
                
                if (actualAmt > 0) {
                    p.aura[type] += actualAmt; 
                    let pName = p === this.playerRef ? '少俠' : '敵人';
                    this.log(`✨ ${pName}獲得氣場：${type} (目前 ${p.aura[type]} 層)`, "story-msg"); 
                }
            },
            
            addEnv: (type, amt) => { 
                if(this.battleEnded) return; 
                let limit = Math.floor(StatEngine.getDerived(GameState.player).qiCap / 10); 
                GameState.env[type] = (GameState.env[type] || 0) + amt; 
                if(GameState.env[type] > limit) GameState.env[type] = limit; 
            }
        };
    },

    updateCombatUI() {
        if (!this.battleEnded) {
            CombatUI.update(this.win, this.playerRef, this.enemyRef, this.ui);
        }
    },

    triggerEnvDamage() {
        if (this.battleEnded) return;
        let dmgOccurred = false;

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

        // 【回合重置邏輯】：補滿氣力，清空破綻
        if (this.playerRef.wait >= 100) {
            this.playerRef.wait = 0; 
            this.playerRef.currentCombo = derP.comboMax; 
            this.playerRef.turnSkillCount = 0;
            this.playerRef._exhaustLogged = false;
            this.playerRef.tags['破綻'] = 0; // 新回合清空破綻
            this.updateCombatUI();
            
            if (this.isAttemptingFlee) {
                this.executeFlee(derP, derE);
                return;
            }

            if (GameState.player.combatMode === "manual") {
                this.executePlayerManualTurn(derP, derE); 
            } else {
                this.executePlayerComboChain(derP, derE); 
            }
            return; 
        }
        
        if (this.enemyRef.wait >= 100) {
            this.enemyRef.wait = 0;
            this.enemyRef.currentCombo = derE.comboMax;
            this.enemyRef.turnSkillCount = 0;
            this.enemyRef._exhaustLogged = false;
            this.enemyRef.tags['破綻'] = 0;
            this.updateCombatUI();
            this.executeEnemyComboChain(derE, derP);
            return;
        }
    },

    async executePlayerManualTurn(derP, derE) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        const menu = document.getElementById('manual-skill-menu');
        const list = document.getElementById('skill-list-container');
        const endBtn = document.getElementById('btn-end-turn');

        const refreshMenu = () => {
            list.innerHTML = '';
            let skills = GameState.player.activeSkills;
            if (!skills || skills.length === 0) {
                this.finishManualTurn();
                return;
            }

            skills.forEach(skId => {
                let sk = DB_SKILLS[skId];
                if (!sk) return;

                let simulatedCombo = this.playerRef.currentCombo - sk.comboCost;
                let failRate = 0;
                if (simulatedCombo < 50) {
                    failRate = Math.max(0, Math.min(75, Math.floor(((50 - simulatedCombo) / 50) * 75)));
                }

                let btn = document.createElement('button');
                btn.className = 'sys-btn';
                btn.style.width = '100%'; 
                btn.style.padding = '6px';
                btn.style.textAlign = 'left';
                btn.style.transition = 'all 0.3s';
                
                btn.innerHTML = `
                    <div style="font-size:14px; margin-bottom:2px;">${sk.name}</div>
                    <div style="font-size:11px; color:#888; text-align:right;">氣力:${sk.comboCost} | <span style="color:${failRate > 0 ? '#ff5555' : '#55ff55'};">破綻:${failRate}%</span></div>
                `;
                
                if (simulatedCombo < 0) {
                    btn.style.borderColor = '#ff0000';
                    btn.style.backgroundColor = 'rgba(100,0,0,0.6)';
                    btn.innerHTML += `<div style="font-size:10px; color:#ffaaaa; text-align:center; margin-top:2px;">⚠️ 透支警告</div>`;
                }

                btn.onclick = async () => {
                    this.log(`[少俠] 手動施展 ${sk.name}！`, "story-msg");
                    menu.style.display = 'none'; 
                    
                    this.playerRef.turnSkillCount++;
                    await this.performAttack(true, sk, derP, derE, this.playerRef, this.enemyRef);
                    
                    if (this.battleEnded) return;

                    this.playerRef.currentCombo -= sk.comboCost;
                    this.updateCombatUI();

                    // 【修改】：新的漸進式失敗判定
                    let currentAfter = this.playerRef.currentCombo;
                    let actualFailRate = currentAfter >= 50 ? 0 : Math.max(0, Math.min(75, Math.floor(((50 - currentAfter) / 50) * 75)));
                    let roll = Math.floor(Math.random() * 100);
                    
                    if (roll < actualFailRate) {
                        this.playerRef.tags['破綻'] = (this.playerRef.tags['破綻'] || 0) + this.playerRef.turnSkillCount;
                        this.log(`【破綻】招式銜接失敗！露出 ${this.playerRef.turnSkillCount} 處破綻！`, "warn-msg");
                        this.finishManualTurn();
                    } else {
                        if (currentAfter < 0) {
                            this.log(`⚠️ 強行透支氣力，但成功穩住了身形！`, "warn-msg");
                        } else {
                            this.log(`⚡ 連段成功！請繼續追擊！`, "sys-msg");
                        }
                        menu.style.display = 'flex'; 
                        refreshMenu();
                    }
                };
                list.appendChild(btn);
            });
        };

        menu.style.display = 'flex';
        refreshMenu();

        endBtn.onclick = () => {
            this.log(`[少俠] 結束攻勢，轉為守備姿態。`, "sys-msg");
            this.finishManualTurn();
        };
    },

    finishManualTurn() {
        const menu = document.getElementById('manual-skill-menu');
        if (menu) menu.style.display = 'none';
        this.isExecuting = false;
        if (!this.battleEnded) {
            clearInterval(this.interval);
            this.interval = setInterval(() => this.tick(), 50); 
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
                let skills = GameState.player.activeSkills.filter(id => DB_SKILLS[id]);
                if (skills.length === 0) break;
                
                let skId;
                let mode = GameState.player.combatMode;
                
                if (mode === 'auto_safe') {
                    // 穩健型：只挑選施放後剩餘氣力 >= 50 (0% 破綻率) 的招式
                    let safeSkills = skills.filter(id => (this.playerRef.currentCombo - DB_SKILLS[id].comboCost >= 50));
                    if (safeSkills.length > 0) {
                        skId = safeSkills[Math.floor(Math.random() * safeSkills.length)];
                    } else {
                        this.log(`[少俠] 氣力降至警戒線，主動收招轉為守備。`, "sys-msg");
                        break; // 強制結束連段
                    }
                } else if (mode === 'auto_aggro') {
                    // ==========================================
                    // 狂攻型 (Aggro)：動態權重評估與隨機暴走
                    // ==========================================
                    let scoredSkills = skills.map(id => {
                        let sk = DB_SKILLS[id];
                        // 1. 基礎暴力值：威力 + (Hit數權重) + 消耗(高消耗通常較強)
                        let score = (sk.power || 0) + ((sk.hits || 1) * 20) + (sk.comboCost || 0);
                        
                        // 2. 終結技檢定：模擬是否能觸發 DB_REACTIONS (如引爆、斬殺)
                        let canTrigger = DB_REACTIONS.some(rule => 
                            rule.condition(sk.tags || [], this.enemyRef, GameState.env, this.playerRef)
                        );
                        if (canTrigger) score += 500; // 有大放大！絕對優先！

                        // 3. 疊加印記與佈局檢定：鼓勵 AI 狂上狀態
                        if (sk.tags && (sk.tags.includes('佈置') || sk.tags.includes('歌') || sk.tags.includes('謀') || sk.tags.includes('術'))) {
                            score += 80; 
                        }

                        // 4. 隨機狂暴因子：讓出招不那麼死板 (0~50的浮動值)
                        score += Math.random() * 50;

                        return { id: id, score: score };
                    });

                    // 依分數由高至低排序
                    scoredSkills.sort((a, b) => b.score - a.score);
                    
                    // 從最高分的前 2 招中隨機挑選 1 招 (保留瘋狗般的不可預測性)
                    let topChoices = scoredSkills.slice(0, Math.min(2, scoredSkills.length));
                    skId = topChoices[Math.floor(Math.random() * topChoices.length)].id;
                    
                } else {
                    // 隨機型
                    skId = skills[Math.floor(Math.random() * skills.length)];
                }
                
                let skill = DB_SKILLS[skId];
                
                this.log(`[少俠] 施展 ${skill.name}！`, "story-msg");
                this.playerRef.turnSkillCount++;
                await this.performAttack(true, skill, derP, derE, this.playerRef, this.enemyRef);
                
                if (this.battleEnded) break; 

                this.playerRef.currentCombo -= skill.comboCost;
                this.updateCombatUI();

                let currentAfter = this.playerRef.currentCombo;
                let actualFailRate = currentAfter >= 50 ? 0 : Math.max(0, Math.min(75, Math.floor(((50 - currentAfter) / 50) * 75)));
                let roll = Math.floor(Math.random() * 100);
                
                if (roll < actualFailRate) {
                    this.playerRef.tags['破綻'] = (this.playerRef.tags['破綻'] || 0) + this.playerRef.turnSkillCount;
                    this.log(`【破綻】招式銜接失敗！露出 ${this.playerRef.turnSkillCount} 處破綻！`, "warn-msg");
                    break; 
                } else {
                    if (currentAfter < 0) this.log(`⚠️ 強行透支氣力，發動狂暴猛攻！`, "warn-msg");
                    else this.log(`⚡ 攻勢連綿不斷！馬上接續下一招！`, "sys-msg");
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

// js/systems/combat.js (片段替換)

    async executeEnemyComboChain(derE, derP) {
        if (this.isExecuting || this.battleEnded) return;
        this.isExecuting = true;
        clearInterval(this.interval); 

        try {
            while (this.enemyRef.hp > 0 && this.playerRef.hp > 0 && !this.battleEnded) {
                let skills = this.enemyRef.stats.skills || ["s_enemy_slash"];
                let chosenSkillId = skills[Math.floor(Math.random() * skills.length)];

                if (this.enemyRef.stats.aiScript) {
                    chosenSkillId = this.enemyRef.stats.aiScript(this.enemyRef, chosenSkillId, this);
                }

                let skill = DB_SKILLS[chosenSkillId];
                if (!skill) break;

                // ==========================================
                // 【新增】：敵方 AI 風險評估機制 (AI Risk Assessment)
                // ==========================================
                
                // 取得敵方性格，預設為常規型 (balanced)
                let aiTrait = this.enemyRef.stats.aiTrait || 'balanced'; 
                
                // 模擬出招後的氣力與破綻機率
                let simulatedCombo = this.enemyRef.currentCombo - (skill.comboCost || 20);
                let simulatedFailRate = simulatedCombo >= 50 ? 0 : Math.max(0, Math.min(75, Math.floor(((50 - simulatedCombo) / 50) * 75)));
                
                let shouldStop = false;

                if (aiTrait === 'cautious') {
                    // 謹慎型：只要有破綻機率就停手
                    if (simulatedCombo < 50) shouldStop = true;
                } 
                else if (aiTrait === 'balanced') {
                    // 常規型：絕不透支，且根據破綻機率進行「主動退守檢定」
                    if (simulatedCombo < 0) {
                        shouldStop = true; 
                    } else if (simulatedFailRate > 0) {
                        // 破綻機率越高，AI 越可能選擇主動停手不貪刀
                        if (Math.random() * 100 < simulatedFailRate) {
                            shouldStop = true;
                        }
                    }
                }
                else if (aiTrait === 'berserk') {
                    // 狂暴型：無視破綻，甚至願意透支，但設定一個極限防呆(-50)
                    if (simulatedCombo < -50) shouldStop = true;
                }

                // AI 決定主動收招 (不會掛上破綻標籤)
                if (shouldStop) {
                    // 如果一招都還沒放就停了，可以不用印 Log；如果有連段才印出主動收招
                    if (this.enemyRef.turnSkillCount > 0) {
                        this.log(`[敵方] 攻勢漸緩，主動收招轉為守備姿態。`, "sys-msg");
                    }
                    break; 
                }

                // ==========================================

                this.log(`[敵方] 施展 ${skill.name}！`, "warn-msg");
                this.enemyRef.turnSkillCount++;
                
                await this.performAttack(false, skill, derE, derP, this.enemyRef, this.playerRef);
                
                if (this.battleEnded) break; 

                this.enemyRef.currentCombo -= (skill.comboCost || 20); 
                this.updateCombatUI();

                let currentAfter = this.enemyRef.currentCombo;
                let actualFailRate = currentAfter >= 50 ? 0 : Math.max(0, Math.min(75, Math.floor(((50 - currentAfter) / 50) * 75)));
                let roll = Math.floor(Math.random() * 100);
                
                if (roll < actualFailRate) {
                    this.enemyRef.tags['破綻'] = (this.enemyRef.tags['破綻'] || 0) + this.enemyRef.turnSkillCount;
                    this.log(`【敵方破綻】招式銜接失敗，露出 ${this.enemyRef.turnSkillCount} 處破綻！`, "warn-msg");
                    break; 
                } else {
                    if (currentAfter < 0) {
                        this.log(`⚠️ 敵方強行透支氣力，發動狂暴猛攻！`, "warn-msg");
                    } else {
                        this.log(`⚡ 敵方攻勢連綿不斷！馬上接續下一招！`, "sys-msg");
                    }
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

    async performAttack(isPlayer, skill, derAtk, derDef, attackerRef, targetRef) {
        if (this.battleEnded) return;   
        
        if (skill.onCast) {
            skill.onCast(this.createContext(attackerRef, targetRef));
            this.updateCombatUI();
        }

        let auraCtx = { combat: this, attacker: attackerRef, target: targetRef, skill: skill };
        let cancelAttack = false;

        for (let auraName in targetRef.aura) {
            if (targetRef.aura[auraName] > 0 && DB_AURAS[auraName] && DB_AURAS[auraName].onDefend) {
                let result = DB_AURAS[auraName].onDefend(auraCtx);
                if (result && result.cancel) cancelAttack = true;
                if (this.battleEnded) return; 
            }
        }
        
        if (cancelAttack) return;

        if (skill.power > 0) {
            let dodgeChance = 20 + (derDef.dodge - derAtk.hit) * 1;
            if (targetRef.tags && targetRef.tags.frozen) dodgeChance = 0; 
            dodgeChance = Math.max(0, Math.min(100, dodgeChance));

            if (Math.random() * 100 < dodgeChance) {
                this.log(`殘影一閃，完全閃避了攻擊！`, "sys-msg");
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
            
            if (skill.power > 0) {
                let baseAtk = skill.type === 'phys' ? derAtk.pAtk : derAtk.qAtk;
                let rawDmg = (baseAtk + skill.power) * (0.9 + Math.random() * 0.2) * mult;
                
                if (Math.random() * 100 < derAtk.critChance) {
                    rawDmg *= derAtk.critMult;
                    this.log(`💥 會心一擊！`, "dmg-msg");
                    if (this.win && !this.battleEnded) { this.win.classList.add('shake-effect'); setTimeout(() => {if(this.win) this.win.classList.remove('shake-effect');}, 200); }
                }

                let dmgData = {
                    fixDef: (targetRef.tags && targetRef.tags.frozen) ? 0 : derDef.fixDef,
                    pctDef: (targetRef.tags && targetRef.tags.frozen) ? derDef.pctDef / 2 : derDef.pctDef
                };

                // 【修改】：力竭狀態 (氣力負數) 防禦崩潰
                if (targetRef.currentCombo < 0) {
                    dmgData.fixDef = 0;
                    dmgData.pctDef = Math.floor(dmgData.pctDef / 2);
                    if (!targetRef._exhaustLogged) {
                        this.log(`⚠️ ${targetRef.id ? '敵方' : '少俠'}氣力透支，真氣渙散，無法有效防禦！`, "warn-msg");
                        targetRef._exhaustLogged = true; // 每回合只提示一次
                    }
                }

                for (let auraName in attackerRef.aura) {
                    if (attackerRef.aura[auraName] > 0 && DB_AURAS[auraName] && DB_AURAS[auraName].onAttack) {
                        DB_AURAS[auraName].onAttack(auraCtx, dmgData);
                    }
                }
                
                finalDmg = (rawDmg - dmgData.fixDef) * (1 - dmgData.pctDef / 100);
                finalDmg = Math.max(1, Math.floor(finalDmg));

                // 【修改】：擊中破綻，造成 1.5 倍傷害並消耗 1 層標籤
                if (targetRef.tags && targetRef.tags['破綻'] > 0) {
                    finalDmg = Math.floor(finalDmg * 1.5);
                    targetRef.tags['破綻']--;
                    this.log(`💥 擊破門戶！順著破綻造成了 1.5 倍的致命傷害！`, "dmg-msg");
                }

                targetRef.hp -= finalDmg;
                if (!isPlayer && finalDmg > 0 && !this.battleEnded) AvatarUI.playAction('hurt', true);
            }
            
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