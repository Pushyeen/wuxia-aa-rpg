// js/systems/state.js

export const GameState = {
    // 當前遊戲階段：EXPLORE, EVENT, BATTLE
    current: "EXPLORE", 
    
    // 全域標籤 (用來判斷劇情分支)
    flags: {
        "met_master": false,
        "has_sword": false
    },
    
    // 玩家本體數值
    player: {
        x: 5,           // 地圖 X 座標
        y: 5,           // 地圖 Y 座標
        lv: 50,         // 測試員直升 50 級
        exp: 9999,      // 滿滿的修練點數
        hp: 2000, 
        baseMaxHp: 2000, 
        baseAtk: 100, 
        baseDef: 50, 
        baseAgi: 120,
        
        // 戰鬥用結算數值
        maxHp: 2000, 
        atk: 100, 
        def: 50, 
        agi: 120, 
        dodge: 0.1, 
        crit: 0.15,
        
        // ==========================================
        // 【測試員模式】：持有所有裝備與道具
        // ==========================================
        inventory: [
            "i_potion", "i_potion", "i_potion", 
            "w_wood", "w_iron", "w_heavy", "w_fan", "w_spear",
            "a_cloth", "a_leather", "a_iron", "a_silk", "a_gold"
        ], 
        equips: { weapon: null, armor: null },
        
        // ==========================================
        // 【測試員模式】：學會所有 9 種玩家武功
        // ==========================================
        skills: [
            "s_punch", "s_fast_sword", "s_heavy_blade", "s_poison", 
            "s_fire", "s_ice", "s_taiji", "s_needles", "s_dragon"
        ], 
        // 預設只裝備羅漢拳，讓玩家自己去面板打勾測試
        activeSkills: ["s_punch"] 
    }
};