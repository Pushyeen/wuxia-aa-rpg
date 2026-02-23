// js/data/db_items.js

export const DB_ITEMS = {
    // === 消耗品 ===
    "i_potion": { name: "金創藥", type: "consumable", desc: "恢復 1000 氣血", action: (p, l) => { p.hp = Math.min(p.maxHp, p.hp + 1000); if(l) l.add("使用金創藥，恢復 1000 氣血。", "sys-msg"); } },
    "i_pill": { name: "大還丹", type: "consumable", desc: "恢復所有氣血與連擊值", action: (p, l) => { p.hp = p.maxHp; p.currentCombo = 999; if(l) l.add("服下大還丹，真氣充盈，氣血與連擊極限全滿！", "story-msg"); } },
    "i_lotus": { name: "天山雪蓮", type: "consumable", desc: "永久提升福緣 +2", action: (p, l) => { p.stats.luck += 2; if(l) l.add("服下天山雪蓮，福至心靈，基礎福緣 +2！", "story-msg"); } },

    // === 武器 (對應全新延伸屬性) ===
    "w_wood": { name: "桃木劍", type: "weapon", pAtk: 15, hit: 10, desc: "外攻+15 命中+10", 
        aaWeapon: "   /|\n  | |\n  | |\n  | |\n =|=|=\n  | |", weaponColor: "#cd853f", weaponPos: "bottom: 40px; left: 85px; transform: rotate(15deg);" },
        
    "w_iron": { name: "精鋼長劍", type: "weapon", pAtk: 60, hit: 20, desc: "外攻+60 命中+20", 
        aaWeapon: "   /\\\n  |  |\n  |  |\n  |  |\n =]  [=\n  |__|", weaponColor: "#aaddff", weaponPos: "bottom: 40px; left: 80px; transform: rotate(20deg);" },
        
    "w_heavy": { name: "玄鐵重劍", type: "weapon", pAtk: 180, hit: -20, dodge: -20, desc: "外攻+180 閃避/命中-20", 
        aaWeapon: " .--.\n |  |\n |  |\n |  |\n=[  ]=\n |__|", weaponColor: "#777777", weaponPos: "bottom: 30px; left: 75px; transform: rotate(25deg);" },
        
    "w_fan": { name: "逍遙折扇", type: "weapon", pAtk: 20, comboMax: 50, dodge: 30, desc: "外攻+20 連擊+50 閃避+30", 
        aaWeapon: " _/\"\\_\n \\   /\n  \\ /\n   v", weaponColor: "#ffffff", weaponPos: "bottom: 70px; left: 100px; transform: rotate(-10deg);" },
        
    "w_spear": { name: "霸王紅纓槍", type: "weapon", pAtk: 110, critChance: 10, desc: "外攻+110 爆擊率+10%", 
        aaWeapon: "  /\\\n  ||\n /||\\\n \\||/\n  ||\n  ||\n  ||", weaponColor: "#ff4444", weaponPos: "bottom: 40px; left: 85px; transform: rotate(30deg);" },

    // === 防具 (區分固定減傷與%數減傷) ===
    "a_cloth": { name: "粗布麻衣", type: "armor", fixDef: 15, desc: "硬功(減傷)+15", aaSkin: "布" },
    "a_leather": { name: "百年獸皮甲", type: "armor", fixDef: 40, maxHp: 300, desc: "硬功+40 氣血+300", aaSkin: "皮" },
    "a_iron": { name: "步兵鐵鎧", type: "armor", fixDef: 120, dodge: -20, desc: "硬功+120 閃避-20", aaSkin: "鐵" },
    "a_silk": { name: "天蠶寶衣", type: "armor", fixDef: 50, pctDef: 15, dodge: 30, desc: "硬功+50 護體(減傷)+15% 閃避+30", aaSkin: "蠶" },
    "a_gold": { name: "黃金鎖子甲", type: "armor", fixDef: 180, pctDef: 10, maxHp: 1000, desc: "硬功+180 護體+10% 血+1000", aaSkin: "金" }
};