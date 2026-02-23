// js/data/db_enemies.js

export const DB_ENEMIES = {
    "bandit": { 
        name: "黑風武神 (測試沙包)", 
        hp: 15000, maxHp: 15000, poise: 300, maxPoise: 300,
        // 敵人的九大屬性
        stats: { brawn: 90, physique: 100, qiCap: 30, qiPot: 20, agi: 50, dex: 40, per: 50, comp: 30, luck: 20 },
        skills: ["s_enemy_slash"], 
        dropExp: 5000,
        aa: "　　/´￣￣｀ヽ\n　 /　 ‵　　′　 ',\n　 l　/ヽ　 /ヽ l\n　 l　l 0 l　l 0 l l\n　 l　ヽ 皿　ヽ ノ l\n　 ヽ　 　 _　　 /" 
    }
};