// js/data/db_internal.js

export const DB_INTERNAL = {
    "art_yang": {
        name: "純陽無極功",
        color: "#ff5555",
        desc: "至剛至陽，主攻氣血與攻擊。修練路線：由丹田直衝天靈百會。",
        path: ["dan", "hai", "que", "shan", "tu", "yin", "baihui"],
        buff: { hp: 100, atk: 10 },
        // 展演設定：高速、上衝、火系文字
        flowConf: { chars: ["火", "炎", "陽", "↑", "▲"], speed: 800, size: 14 }
    },
    "art_yin": {
        name: "玄冥真氣",
        color: "#55aaff",
        desc: "陰寒無比，護體輕身。修練路線：由丹田下沉至足底湧泉。",
        path: ["dan", "huan", "li", "quan"],
        buff: { def: 15, agi: 5 },
        // 展演設定：慢速、下沉、冰系文字
        flowConf: { chars: ["冰", "寒", "陰", "↓", "▼"], speed: 1400, size: 14 }
    },
    "art_taiji": {
        name: "先天功",
        color: "#ffff55",
        desc: "玄門正宗，陰陽調和。修練路線：引導真氣貫通雙臂勞宮。",
        path: ["dan", "hai", "que", "shan", "jian", "qu", "lao"],
        buff: { hp: 50, atk: 5, def: 5, agi: 2 },
        // 展演設定：中速、柔和、波浪型文字
        flowConf: { chars: ["氣", "柔", "宗", "≈", "☯"], speed: 1100, size: 15 }
    }
};