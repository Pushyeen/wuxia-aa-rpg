// js/systems/state.js
import { DB_ITEMS } from '../data/db_items.js';
import { DB_INTERNAL } from '../data/db_internal.js';

export const GameState = {
    current: "EXPLORE", 
    flags: { "met_master": false, "has_sword": false },
    player: {
        x: 5, y: 5, lv: 1, exp: 9999, hp: 3000, maxHp: 3000, 
        poise: 100, maxPoise: 100, atb: 0,
        combatMode: "auto", 
        stats: { brawn: 10, physique: 10, qiCap: 10, qiPot: 10, agi: 10, dex: 10, per: 10, comp: 10, luck: 10 },
        equips: { weapon: null, armor: null, accessory: null },
        
        // 【修改】：初始武學只有野球拳
        skills: ["s_yq_punch"],
        activeSkills: ["s_yq_punch"],
        
        // 【修改】：預設不包含任何內功，等吃到道具才解鎖
        internal: {
            active: null,
            progress: {} 
        },
        
        // 【修改】：在背包塞入兩本天書
        inventory: ["potion_hp", "book_all_skills", "book_all_internal"],
        aura: {}, tags: {}
    },
    env: { needles: 0, fire: 0, gears: 0, taichi: 0, turret: 0 }
};

export const StatEngine = {
    updateMaxHp(entity) {
        if(!entity.stats) return;
        let hpBonus = 0;
        if (entity.equips && entity.equips.armor) {
            let a = DB_ITEMS[entity.equips.armor];
            if (a && a.maxHp) hpBonus += a.maxHp;
        }
        if (entity.internal && entity.internal.active) {
            let art = DB_INTERNAL[entity.internal.active];
            let prog = entity.internal.progress[entity.internal.active] || 0;
            if (art && art.buff && art.buff.hp) hpBonus += art.buff.hp * prog;
        }
        entity.maxHp = 100 + (entity.stats.physique * 25) + hpBonus;
        if(entity.hp > entity.maxHp) entity.hp = entity.maxHp;
    },

    getDerived(entity) {
        let s = entity.stats;
        if (!s) return {};
        
        let brawn = s.brawn, physique = s.physique, qiCap = s.qiCap, qiPot = s.qiPot;
        let agi = s.agi, dex = s.dex, per = s.per, comp = s.comp, luck = s.luck;
        
        // 裝備與內功附加的額外屬性暫存
        let ext = { pAtk: 0, qAtk: 0, hit: 0, dodge: 0, critChance: 0, fixDef: 0, pctDef: 0, comboMax: 0 };
        
        if (entity.equips) {
            let w = DB_ITEMS[entity.equips.weapon], a = DB_ITEMS[entity.equips.armor];
            if (w) {
                ext.pAtk += w.pAtk||0; ext.hit += w.hit||0; ext.dodge += w.dodge||0;
                ext.critChance += w.critChance||0; ext.comboMax += w.comboMax||0;
            }
            if (a) {
                ext.fixDef += a.fixDef||0; ext.pctDef += a.pctDef||0; ext.dodge += a.dodge||0;
            }
        }

        if (entity.internal && entity.internal.active) {
            let art = DB_INTERNAL[entity.internal.active], prog = entity.internal.progress[entity.internal.active] || 0;
            if (art && art.buff) {
                if(art.buff.atk) ext.pAtk += art.buff.atk * prog;
                if(art.buff.def) ext.fixDef += art.buff.def * prog;
                if(art.buff.agi) ext.dodge += art.buff.agi * prog;
            }
        }

        if (entity.internal && entity.internal.status) {
            if (entity.internal.status.poisoned) { ext.pAtk -= 20; ext.fixDef -= 20; }
            if (entity.internal.status.injured) { ext.dodge -= 30; }
        }
    // 👇 新增：讀取動態氣場 (Aura) 並轉化為基礎屬性加成
        if (entity.aura) {
            // 守之型
            if (entity.aura['游雲']) ext.fixDef += 150;
            if (entity.aura['迴雪']) ext.pctDef += 30; // 額外增加 30% 減傷
            if (entity.aura['驚風']) ext.dodge += 80;
            // 攻之型
            if (entity.aura['驚鴻']) { ext.atbSpd += 30; ext.dex += 50; }
            if (entity.aura['宛龍']) { ext.hit += 80; ext.pAtk += 150; }
            if (entity.aura['耀日']) ext.critChance += 50;
            // 空之境界 (二階段終極狀態)
            if (entity.aura['空之境界']) { ext.comboMax += 500; ext.hit += 200; ext.pAtk += 100; ext.atbSpd += 50; }
        }
        return {
            pAtk: Math.max(0, Math.floor(brawn * 2 + agi * 0.75 + dex * 0.75) + ext.pAtk),
            qAtk: Math.max(0, Math.floor(qiPot * 2 + qiCap * 1.5) + ext.qAtk),
            hit: Math.max(0, Math.floor(per * 2 + dex * 1.5) + ext.hit),
            critChance: Math.max(0, Math.floor((per * 2 + luck * 1.5) / 10) + ext.critChance),
            critMult: 1.5 + (luck * 2 + brawn * 1.5) / 100,
            dodge: Math.max(0, Math.floor(agi * 2 + per * 1.5) + ext.dodge),
            fixDef: Math.max(0, Math.floor(physique * 2 + brawn * 1.5) + ext.fixDef),
            pctDef: Math.min(80, Math.max(0, Math.floor((qiCap * 2 + physique * 1.5) / 10) + ext.pctDef)), // 最高減傷 80%
            comboMax: Math.max(0, Math.floor(dex * 2 + agi * 1.5) + ext.comboMax),
            atbSpd: Math.max(5, Math.floor(agi * 2 + qiCap * 1.5))
        };
    }
};