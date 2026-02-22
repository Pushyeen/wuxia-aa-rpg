// js/data/db.js

export const PlayerData = { 
    gold: 500, hp: 1000, maxHp: 1000, atk: 80, def: 30, agi: 150, dodge: 0.15, crit: 0.2 
};

export const Inventory = { 
    head: false, armor: false, weapon: false, shoes: false 
};

export const DB = {
    skills: {
        "s_xiaoyao":  { id: "s_xiaoyao", name: "逍遙劍法", power: 60, weight: 60, msg: "身形飄忽，刺出一招" },
        "s_dugu":     { id: "s_dugu", name: "獨孤九劍", power: 180, weight: 10, msg: "看破破綻，劍氣沖霄施展", critBonus: 0.5 },
        "e_blade":    { id: "e_blade", name: "狂風刀法", power: 50, weight: 60, msg: "大喝一聲，如狂風驟雨般劈出" },
        "e_poison":   { id: "e_poison", name: "毒砂掌", power: 80, weight: 30, msg: "掌心發黑，陰毒地拍出" }
    },
    enemies: {
        "bandit": { name: "惡徒", hp: 1200, atk: 90, def: 20, agi: 70, dodge: 0.05, crit: 0.1, skills: ["e_blade", "e_poison"], drop: 300 }
    }
};

// AA 素材也可以放這裡
export const AAAssets = {
    enemyNormal: ["　　/´￣￣｀ヽ", "　 /　 ‵　　′　 ',", "　 l　/ヽ　 /ヽ l", "　 l　l 0 l　l 0 l l", "　 l　ヽ 皿　ヽ ノ l", "　 ヽ　 　 _　　 /"],
    enemyHurt:   ["　　/´￣￣｀ヽ", "　 /　 ＞　＜　 ',", "　 l　/ヽ　 /ヽ l", "　 l　l x l　l x l l", "　 l　ヽ Д　ヽ ノ l", "　 ヽ　 　 _　　 /"]
};