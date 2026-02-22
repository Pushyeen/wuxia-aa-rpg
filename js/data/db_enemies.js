// js/data/db_enemies.js

export const DB_ENEMIES = {
    "bandit": { 
        name: "黑風武神 (測試沙包)", 
        hp: 99999,      // 血量大幅提升，讓你打個痛快！
        maxHp: 99999, 
        atk: 30,        // 稍微降低攻擊力，避免測試時少俠被打死
        def: 100,       // 增加一點防禦，讓數字跳得更真實
        agi: 80,        // 保持一定的敏捷，讓他偶爾能還手
        dodge: 0.05, 
        crit: 0.05, 
        skills: ["s_enemy_slash"], 
        dropExp: 5000,  // 打贏給予巨量經驗
        aa: "　　/´￣￣｀ヽ\n　 /　 ‵　　′　 ',\n　 l　/ヽ　 /ヽ l\n　 l　l 0 l　l 0 l l\n　 l　ヽ 皿　ヽ ノ l\n　 ヽ　 　 _　　 /" 
    }
};