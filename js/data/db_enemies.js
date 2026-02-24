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
    },

    'e_boss_moce': {
        name: "天機居士·莫測",
        hp: 15000, maxHp: 15000,
        aa: `
     .----.
    / ☰  ☱ \\
   (  -  -  )
   /||  ☯  ||\\
    \\ ☲  ☳ /
     '----'`,
        stats: {
            // 臂力極低，但身法、洞察與悟性極高
            brawn: 5, physique: 15, qiCap: 45, qiPot: 35, agi: 45, dex: 45, per: 50, comp: 55, luck: 25,
            equips: {}, 
            // AI 抽招權重：高機率使用疊層技與干擾技，低機率使用終結技
            skills: [
                'e_ce_ask', 'e_ce_ask', 
                'e_ce_point', 'e_ce_point', 'e_ce_point', 
                'e_ce_chain', 'e_ce_delay', 
                'e_ce_finish'
            ],
            dropExp: 3000,
            dropStats: { per: 2, comp: 2, agi: 2 } // 戰勝獎勵
        }
    },

    // 階級 3.5：中高階 (音系名伶，主打多段削血與華麗連段)
    'e_elite_youlan': {
        name: "絕代名伶·幽蘭",
        hp: 6500, maxHp: 6500,
        aa: `
      . 🎵 .
     ( ˘ ▽ ˘ ) 
    / 琵 琶 \\
   (  🎶   )
   / \\   / \\`,
        stats: {
            // 極高的身法(Agi)與靈巧(Dex)，保證高頻率出手與閃避
            brawn: 10, physique: 20, qiCap: 35, qiPot: 30, agi: 40, dex: 45, per: 35, comp: 30, luck: 15,
            equips: {}, 
            // 🎼 樂曲播放清單 (AI 抽招權重)
            skills: [
                // 前奏與鋪墊 (疊加餘音與霓裳)
                'e_yl_tune', 'e_yl_hide', 
                'e_yl_heavy', 'e_yl_light', 'e_yl_light',
                'e_yl_pearls', 'e_yl_pearls', 
                // 休止符 (強控場)
                'e_yl_silence', 
                // 高潮引爆 (共振)
                'e_yl_burst', 'e_yl_finish'
            ],
            dropExp: 1500,
            dropStats: { agi: 2, dex: 1 } // 戰勝獎勵：身法+2、靈巧+1
        }
    },
    // 階級 4：極強 (道系機關首領，主打彈藥管理與即時真傷)
    'e_boss_tang': {
        name: "蜀中詭客·唐翎",
        hp: 12000, maxHp: 12000,
        aa: `
      .----.
     / \\__/ \\
    ( ◓ _ ◓ )
    /| [匣] |\\
     |__|__|__|`,
        // 🌟 關鍵機制：開戰即滿狀態，自帶 15 層千機匣彈藥！
        aura: { '千機匣': 15 }, 
        stats: {
            // 極高的身法與靈巧
            brawn: 15, physique: 10, qiCap: 25, qiPot: 35, agi: 65, dex: 60, per: 45, comp: 40, luck: 20,
            equips: {}, 
            skills: [
                'e_tl_reload', // 裝填 (空檔期)
                'e_tl_poison', 'e_tl_poison', // 上毒
                'e_tl_gatling', 'e_tl_gatling', 'e_tl_gatling', // 主要輸出
                'e_tl_execute' // 終極引爆
            ],
            dropExp: 3500,
            dropStats: { dex: 3, agi: 3 }
        }
    }
};
