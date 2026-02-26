// js/data/db_auras.js
import { CombatUI } from '../ui/combat_ui.js';

export const DB_AURAS = {
// ==========================================
    // 防禦端氣場 (被攻擊前觸發，可回傳 cancel 中斷攻擊)
    // ==========================================
    '蔽月': {
        onDefend: (ctx) => {
            // 【修改】：改為消耗層數制，每次觸發扣除 1 層
            if (ctx.target.aura['蔽月'] > 0) { 
                ctx.target.aura['蔽月']--; // 消耗層數
                ctx.target.hp = Math.min(ctx.target.maxHp, ctx.target.hp + 50); 
                ctx.attacker.hp -= 150; 
                
                let remain = ctx.target.aura['蔽月'];
                ctx.combat.log(`🌙 【蔽月】翩若柔化了攻勢，反擊 150 點傷害！(剩餘 ${remain} 層)`, "warn-msg"); 
                
                let cId = (ctx.attacker === ctx.combat.enemyRef) ? 'bat-target-enemy' : 'bat-target-player';
                CombatUI.showFloatingDamage(cId, 150, 150 / ctx.attacker.maxHp);
                
                if (ctx.attacker.hp <= 0) { 
                    ctx.combat.updateCombatUI(); 
                    ctx.combat.endBattle(ctx.attacker === ctx.combat.playerRef ? false : true); 
                }
                return { cancel: true }; 
            }
        }
    },
    // ==========================================
    // 霸王玄鐵劍法 專屬氣場
    // ==========================================
    
    '霸體': {
        onDefend: (ctx) => {
            // 遭到攻擊時，若有霸體則觸發格擋
            if (ctx.target.aura['霸體'] > 0) {
                ctx.target.aura['霸體']--;
                // 每次成功挨打格擋，都會轉化為進攻用的霸意
                ctx.target.aura['霸意'] = (ctx.target.aura['霸意'] || 0) + 1;
                
                ctx.combat.log(`🛡️ 【鐵索橫江】重劍如山，完美擋下攻擊並積蓄了 1 層霸意！`, "story-msg");
                
                // 觸發畫面的微震動效果，增加厚重感
                if (ctx.combat.win) {
                    ctx.combat.win.classList.add('shake-effect');
                    setTimeout(() => { if (ctx.combat.win) ctx.combat.win.classList.remove('shake-effect'); }, 200);
                }
                
                return { cancel: true }; // 完全抵銷該次攻擊傷害
            }
        }
    },
    
    '破甲_生效': {
        onAttack: (ctx, dmgData) => {
            // 攻擊計算傷害前，若有此氣場，則強行扣減敵方防禦力
            if (ctx.attacker.aura['破甲_生效'] > 0) {
                ctx.attacker.aura['破甲_生效']--;
                dmgData.fixDef = Math.floor(dmgData.fixDef * 0.5);
                dmgData.pctDef = Math.floor(dmgData.pctDef * 0.5);
                ctx.combat.log(`⚔️ 霸意灌注，重劍撕裂了敵方 50% 的護體防禦！`, "warn-msg");
            }
        }
    },

    // ==========================================
    // 奇門遁甲 專屬氣場
    // ==========================================
    
    '絕對閃避': {
        onDefend: (ctx) => {
            // 只要身上有絕對閃避層數，必定強制 Miss，且不扣減護體真氣
            if (ctx.target.aura['絕對閃避'] > 0) {
                ctx.target.aura['絕對閃避']--;
                ctx.combat.log(`💨 【移星換斗】陣法流轉，殘影閃爍，敵人的攻擊完全落空！`, "story-msg");
                return { cancel: true }; // 取消該次傷害
            }
        }
    },
    '木甲': {
        onDefend: (ctx) => {
            ctx.target.aura['木甲'] -= 200; 
            ctx.combat.log(`🛡️ 神工木甲吸收了傷害！`, "story-msg");
            if(ctx.target.aura['木甲'] <= 0) { 
                ctx.target.aura['木甲'] = 0; 
                ctx.combat.log("💥 木甲損毀！"); 
            } 
            return { cancel: true };
        }
    },
    '疾風': {
        onDefend: (ctx) => {
            ctx.target.aura['疾風']--; 
            ctx.combat.log("💨 逍遙步絕對閃避！", "story-msg"); 
            return { cancel: true };
        }
    },
    '反擊': {
        onDefend: (ctx) => {
            ctx.target.aura['反擊']--; 
            ctx.attacker.hp -= 300; 
            ctx.combat.log(`☯ 借力打力反彈傷害！`, "dmg-msg"); 
            let cId = (ctx.attacker === ctx.combat.enemyRef) ? 'bat-target-enemy' : 'bat-target-player';
            CombatUI.showFloatingDamage(cId, 300, 300 / ctx.attacker.maxHp);
            if (ctx.attacker.hp <= 0) { 
                ctx.combat.updateCombatUI(); 
                ctx.combat.endBattle(ctx.target === ctx.combat.playerRef); 
            }
            return { cancel: true };
        }
    },
    '冰盾': {
        onDefend: (ctx) => {
            ctx.target.aura['冰盾']--;
            ctx.combat.createContext(ctx.attacker, ctx.target).addTag(ctx.attacker, 'ice', 1);
            ctx.combat.log(`❄️ 冰盾破碎，寒氣反噬了攻擊者！`, "story-msg");
            return { cancel: false }; // 僅附加 Debuff，不中斷原本的攻擊
        }
    },
    '絲陣': {
        onDefend: (ctx) => {
            if(ctx.skill.type === 'phys') {
                ctx.target.aura['絲陣']--;
                ctx.combat.createContext(ctx.attacker, ctx.target).addTag(ctx.attacker, 'silk', 1);
                ctx.combat.log(`🕸️ 盤絲舞動，絲線纏繞了近戰攻擊者！`, "warn-msg");
            }
            return { cancel: false };
        }
    },
// ==========================================
    // 達摩易筋經 專屬氣場
    // ==========================================
    
    '禪定': {
        onDefend: (ctx) => {
            // 每層禪定在受擊時提供 1% 最大生命值的微量回血（變相被動減傷），不消耗層數
            let stacks = ctx.target.aura['禪定'] || 0;
            if (stacks > 0) {
                let heal = Math.floor(ctx.target.maxHp * 0.01 * stacks);
                ctx.target.hp = Math.min(ctx.target.maxHp, ctx.target.hp + heal);
                // 不印出 log 避免洗畫面，純粹在背景發揮保護作用
            }
        }
    },

    '化勁': {
        onDefend: (ctx) => {
            // 遭到攻擊時，消耗 1 層化勁，完全抵銷傷害，並吸血 + 反震真實傷害
            if (ctx.target.aura['化勁'] > 0) {
                ctx.target.aura['化勁']--;
                
                // 恢復自身 5% 最大生命
                let heal = Math.floor(ctx.target.maxHp * 0.05);
                ctx.target.hp = Math.min(ctx.target.maxHp, ctx.target.hp + heal);
                
                // 反震敵人 5% 最大生命
                let reflectDmg = Math.floor(ctx.target.maxHp * 0.05);
                ctx.attacker.hp -= reflectDmg;
                
                let targetName = ctx.target.id ? '敵人' : '少俠';
                let attackerName = ctx.attacker.id ? '敵人' : '少俠';
                
                ctx.combat.log(`🛡️ 【化勁】以彼之道還施彼身！${targetName} 吸收傷害恢復 ${heal} 氣血，並反震 ${attackerName} ${reflectDmg} 點真實傷害！`, "story-msg");
                
                return { cancel: true }; // 完全抵銷該次攻擊的常規傷害
            }
        }
    },

    '怒意': {
        onAttack: (ctx, dmgData) => {
            // 攻擊時，消耗 1 層怒意，附加自身「已損失生命值」20% 的真實傷害
            if (ctx.attacker.aura['怒意'] > 0) {
                ctx.attacker.aura['怒意']--;
                
                let missingHp = Math.max(0, ctx.attacker.maxHp - ctx.attacker.hp);
                let extraDmg = Math.floor(missingHp * 0.2); 
                
                if (extraDmg > 0) {
                    ctx.target.hp -= extraDmg;
                    ctx.combat.log(`🔥 【明王怒意】殺氣隨傷勢暴漲！額外附加 ${extraDmg} 點鮮血真傷！`, "warn-msg");
                }
            }
        }
    },
    // ==========================================
    // 逍遙幻音訣 專屬氣場
    // ==========================================
    
    '霓裳': {
        onDefend: (ctx) => {
            // 遭到攻擊時，消耗 1 層霓裳完全閃避，並反加 1 層餘音給攻擊者
            if (ctx.target.aura['霓裳'] > 0) {
                ctx.target.aura['霓裳']--;
                
                // 強制給攻擊者加上餘音印記
                ctx.attacker.tags = ctx.attacker.tags || {};
                ctx.attacker.tags['餘音'] = (ctx.attacker.tags['餘音'] || 0) + 1;
                
                ctx.combat.log(`💨 【霓裳】幻影閃爍，完全避開了攻擊，並在敵方耳畔留下 1 層【餘音】！`, "story-msg");
                return { cancel: true }; // 取消該次傷害
            }
        }
    },

    '弦殺': {
        onAttack: (ctx, dmgData) => {
            // 玩家攻擊時觸發，消耗弦殺氣場，強制疊加 3 層餘音並回覆氣力
            if (ctx.attacker.aura['弦殺'] > 0) {
                ctx.attacker.aura['弦殺']--;
                
                ctx.target.tags = ctx.target.tags || {};
                ctx.target.tags['餘音'] = (ctx.target.tags['餘音'] || 0) + 3;
                
                // 恢復 30 點氣力值 (Combo Cost)，為後續接大招鋪路
                let derP = ctx.combat.playerRef ? 200 : 100; // 粗略的安全上限
                ctx.attacker.currentCombo = Math.min(derP, (ctx.attacker.currentCombo || 0) + 30);
                
                ctx.combat.log(`🪕 【弦殺】音波追擊！強行灌入 3 層【餘音】，並恢復了 30 點氣力！`, "story-msg");
            }
        }
    },

    '迷亂': {
        onAttack: (ctx, dmgData) => {
            // 當敵人帶有迷亂狀態攻擊時，有 50% 機率直接失誤
            if (ctx.attacker.aura['迷亂'] > 0) {
                ctx.attacker.aura['迷亂']--;
                if (Math.random() < 0.5) { 
                    ctx.combat.log(`🌀 【迷亂】敵方受魔音干擾，眼花撩亂，攻擊完全落空！`, "sys-msg");
                    return { cancel: true };
                } else {
                    ctx.combat.log(`🌀 【迷亂】敵方強忍魔音，勉力發動了攻擊！`, "sys-msg");
                }
            }
        }
    },
    // ==========================================
    // 鬼谷縱橫術 專屬氣場
    // ==========================================
    
    '空城': {
        onDefend: (ctx) => {
            // 遭到攻擊時，消耗空城，閃避攻擊並反制對手
            if (ctx.target.aura['空城'] > 0) {
                ctx.target.aura['空城']--;
                
                // 1. 打退敵方行動條 30%
                ctx.attacker.wait = Math.max(0, ctx.attacker.wait - 30);
                
                // 2. 自動疊加 1 層死穴
                ctx.attacker.tags = ctx.attacker.tags || {};
                ctx.attacker.tags['死穴'] = (ctx.attacker.tags['死穴'] || 0) + 1;
                
                // 3. 確保不超過 13 層上限
                if (ctx.attacker.tags['死穴'] > 13) {
                    ctx.attacker.tags['死穴'] = 13;
                }
                
                ctx.combat.log(`👻 【空城計】敵方驚疑不定，不僅攻擊落空，行動還大幅遲滯，且暴露出 1 處死穴！`, "story-msg");
                
                return { cancel: true }; // 完全抵銷該次攻擊傷害
            }
        }
    },
    // ==========================================
    // 攻擊端氣場 (計算傷害時觸發，可修改防禦數據)
    // ==========================================
    '芙蕖': {
        onAttack: (ctx, dmgData) => {
            dmgData.fixDef = 0; 
            dmgData.pctDef = 0;
            ctx.combat.log(`🌸 【芙蕖】劍氣無視了所有防禦！`, "warn-msg");
        }
    }
};