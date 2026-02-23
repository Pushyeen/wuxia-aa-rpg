// js/systems/state.js

export const GameState = {
    current: "EXPLORE", 
    flags: { "met_master": false, "has_sword": false },
    player: {
        x: 5, y: 5, lv: 50, exp: 9999, hp: 2000, baseMaxHp: 2000, 
        baseAtk: 100, baseDef: 50, baseAgi: 120,
        maxHp: 2000, atk: 100, def: 50, agi: 120, dodge: 0.1, crit: 0.15,
        inventory: [
            "i_potion", "i_potion", "i_potion", 
            "w_wood", "w_iron", "w_heavy", "w_fan", "w_spear",
            "a_cloth", "a_leather", "a_iron", "a_silk", "a_gold"
        ], 
        equips: { weapon: null, armor: null },
        skills: [
            "s_punch", "s_fast_sword", "s_heavy_blade", "s_poison", 
            "s_fire", "s_ice", "s_taiji", "s_needles", "s_dragon"
        ], 
        activeSkills: ["s_punch"],
        
        // ==========================================
        // 全新：內功經脈系統記憶體
        // ==========================================
        internal: {
            active: "art_yang", 
            progress: { 
                "art_yang": 1, // 預設打通一穴位
                "art_yin": 0,
                "art_taiji": 0
            },
            status: {
                poisoned: false,
                injured: false
            }
        }
    }
};