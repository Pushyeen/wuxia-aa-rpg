// js/data/db_enemies.js
export const DB_ENEMIES = {
    // 階級 1：弱 (純物理，以臂力與根骨為主)
    'e_thug': {
        name: "街頭惡霸",
        hp: 1500, maxHp: 1500,
        aa: `
  (ꐦ°᷄д°᷅)
  / █ ＼
   | |`,
        stats: {
            brawn: 15, physique: 15, qiCap: 5, qiPot: 5, agi: 10, dex: 10, per: 5, comp: 5, luck: 5,
            equips: {}, // 防呆，給予空的裝備欄位供 StatEngine 讀取
            skills: ['s_enemy_blunt'],
            dropExp: 150,
            dropStats: { brawn: 1 } // 戰勝獎勵：臂力 +1
        }
    },
    
    // 階級 2：中 (風火雙修，會觸發風火燎原)
    'e_cultist': {
        name: "烈火教徒",
        hp: 3500, maxHp: 3500,
        aa: `
   (🔥_🔥)
  / 炎 ＼
   | |`,
        stats: {
            brawn: 10, physique: 20, qiCap: 25, qiPot: 20, agi: 20, dex: 15, per: 15, comp: 15, luck: 5,
            equips: {}, 
            skills: ['s_enemy_fire', 's_enemy_wind'],
            dropExp: 400,
            dropStats: { qiCap: 1, agi: 1 } // 戰勝獎勵：內息+1、身法+1
        }
    },

    // 階級 3：強 (冰銳雙修護法，會嘗試凍結主角並觸發冰刃刺骨)
    'e_boss_ice': {
        name: "玄冰護法",
        hp: 8000, maxHp: 8000,
        aa: `
   [❄️_❄️]
  / 冰 ＼
  /   ＼`,
        stats: {
            brawn: 30, physique: 30, qiCap: 40, qiPot: 35, agi: 25, dex: 30, per: 25, comp: 20, luck: 10,
            equips: {}, 
            skills: ['s_enemy_ice', 's_enemy_pull'],
            dropExp: 1000,
            dropStats: { physique: 2, qiPot: 2, dex: 1 } // 戰勝獎勵：大幅提升多項屬性
        }
    }
};