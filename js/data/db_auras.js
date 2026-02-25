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