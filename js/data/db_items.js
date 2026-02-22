// js/data/db_items.js

export const DB_ITEMS = {
    // === 消耗品 ===
    "i_potion": { name: "金創藥", type: "consumable", desc: "恢復 300 氣血", action: (p, l) => { p.hp = Math.min(p.maxHp, p.hp + 300); if(l) l.add("使用金創藥，恢復 300 氣血。", "sys-msg"); } },
    
    // === 武器 (影響 aaIcon) ===
    "w_wood": { name: "桃木劍", type: "weapon", atk: 15, desc: "攻+15", aaIcon: "🥢" },
    "w_iron": { name: "精鋼長劍", type: "weapon", atk: 50, desc: "攻+50", aaIcon: "🗡" },
    "w_heavy": { name: "玄鐵重劍", type: "weapon", atk: 120, agi: -20, desc: "攻+120 敏-20", aaIcon: "▐" },
    "w_fan": { name: "逍遙折扇", type: "weapon", atk: 30, agi: 30, desc: "攻+30 敏+30", aaIcon: "🪭" },
    "w_spear": { name: "霸王紅纓槍", type: "weapon", atk: 90, desc: "攻+90", aaIcon: "⤕" },

    // === 防具 (影響 aaSkin) ===
    "a_cloth": { name: "粗布麻衣", type: "armor", def: 10, desc: "防+10", aaSkin: "布" },
    "a_leather": { name: "百年獸皮甲", type: "armor", def: 35, desc: "防+35", aaSkin: "皮" },
    "a_iron": { name: "步兵鐵鎧", type: "armor", def: 70, agi: -10, desc: "防+70 敏-10", aaSkin: "鐵" },
    "a_silk": { name: "天蠶寶衣", type: "armor", def: 120, maxHp: 300, desc: "防+120 血+300", aaSkin: "蠶" },
    "a_gold": { name: "黃金鎖子甲", type: "armor", def: 200, maxHp: 800, desc: "防+200 血+800", aaSkin: "金" }
};