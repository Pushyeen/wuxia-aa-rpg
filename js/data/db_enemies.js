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
        aura: { '千機匣': 15 }, 
        stats: {
            brawn: 15, physique: 10, qiCap: 25, qiPot: 35, agi: 65, dex: 60, per: 45, comp: 40, luck: 20,
            equips: {}, 
            skills: [
                'e_tl_reload', 'e_tl_poison', 'e_tl_poison', 
                'e_tl_gatling', 'e_tl_gatling', 'e_tl_gatling', 'e_tl_execute'
            ],
            dropExp: 3500,
            dropStats: { dex: 3, agi: 3 },
            // 【新增】：唐翎專屬 AI 邏輯
            aiScript: (enemyRef, defaultSkillId, combat) => {
                let ammo = enemyRef.aura && enemyRef.aura['千機匣'] ? enemyRef.aura['千機匣'] : 0;
                if (ammo <= 0) {
                    combat.log("【千機匣空竭】唐翎被迫退守重新裝填！", "sys-msg");
                    return 'e_tl_reload'; 
                } else if (defaultSkillId === 'e_tl_reload') {
                    return 'e_tl_gatling'; 
                }
                return defaultSkillId;
            }
        }
    },

    // 階級 3.5：中高階 (念系狂人，主打境界攀升與 DPS 檢定)
    'e_elite_wunan': {
        name: "狂海霸拳·武男",
        hp: 9500, maxHp: 9500,
        aa: `
            ____
          /( oo )\\
         /  (--)  \\
        /|  |__|  |\\
       ( (  |  |  ) )
        \\ \\/    \\/ /
         \\__|__|__/
        `,
        stats: {
            brawn: 60, physique: 40, qiCap: 30, qiPot: 50, agi: 25, dex: 25, per: 20, comp: 10, luck: 5,
            equips: {}, 
            skills: [
                'e_wu_push', 'e_wu_push', 'e_wu_push', 'e_wu_push', 
                'e_wu_shark', 'e_wu_shark', 'e_wu_whale', 'e_wu_whale', 
                'e_wu_sword', 'e_wu_heal', 'e_wu_roar', 'e_wu_ult'
            ],
            dropExp: 2000,
            dropStats: { brawn: 3, qiPot: 2 },
            // 【新增】：武男專屬 AI 邏輯
            aiScript: (enemyRef, defaultSkillId, combat) => {
                let chongtian = enemyRef.aura && enemyRef.aura['重天'] ? enemyRef.aura['重天'] : 0;
                if (chongtian >= 5) {
                    combat.log("⚡ 武男狂氣突破極限！釋放終極殺招！", "warn-msg");
                    return 'e_wu_ult'; 
                } else if (defaultSkillId === 'e_wu_ult') {
                    return 'e_wu_push';
                }
                return defaultSkillId;
            }
        }
    },

 // js/data/db_enemies.js (翩若區塊片段)

    'e_boss_pianruo': {
        name: "洛神絕劍·翩若",
        hp: 20000, maxHp: 20000,
        // 【補回】：第一階段（冷靜/防守姿態）的 AA 立繪
        aa: `
      .----.
     / \\__/ \\
    (  ~ _ ~ )
      \\|  |/
      /|  |\\
     /      \\`,
        stats: {
            brawn: 40, physique: 40, qiCap: 50, qiPot: 50, agi: 65, dex: 70, per: 60, comp: 60, luck: 50,
            equips: {}, skills: [], dropExp: 10000, dropStats: { all: 5 },
            
            // 翩若專屬多階段 AI 邏輯
            aiScript: (enemyRef, defaultSkillId, combat) => {
                if (!enemyRef.stanceLevel) {
                    enemyRef.stanceLevel = 1;
                    enemyRef.stanceType = 'def'; 
                    enemyRef.isPhase2 = false;
                    if (!enemyRef.aura) enemyRef.aura = {};
                    enemyRef.aura['游雲'] = 1; 
                }

                // ==========================================
                // 【二階段觸發】：血量低於 50% 且架勢疊滿 4 層
                // ==========================================
                if (enemyRef.hp < enemyRef.maxHp * 0.5 && enemyRef.stanceLevel >= 4 && !enemyRef.isPhase2) {
                    enemyRef.isPhase2 = true;
                    
                    // 疊加「空之境界」
                    if (!enemyRef.aura) enemyRef.aura = {};
                    enemyRef.aura['空之境界'] = 1; 
                    enemyRef.currentCombo = 400; // 氣力瞬間全滿
                    
                    combat.log("「只要是活著的東西，就算是神也殺給你看。」翩若睜開了雙眼！", "warn-msg");
                    
                    if (combat.win) {
                        combat.win.classList.add('shake-effect');
                        
                        // 動態替換為二階段 (狂暴/懸浮姿態) 的 AA 演出
                        let enemyAA = combat.win.querySelector('#bat-aa-e');
                        if (enemyAA) {
                            enemyAA.style.color = '#cc55ff'; 
                            enemyAA.style.textShadow = '0 0 10px #cc55ff'; 
                            enemyAA.innerText = `
      \\   |   /
    -  .----.  -
      / \\__/ \\
     ( ✧ _ ✧ )
      \\|/\\/\\|/
       |\\/\\/|
      /      \\`;
                        }
                    }
                }

                // 技能出招選擇
                if (enemyRef.isPhase2) {
                    // 二階段：不限制氣力，讓她瘋狂連斬
                    let p2Skills = ['e_pr_void_slash', 'e_pr_void_slash', 'e_pr_void_break'];
                    if (enemyRef.currentCombo <= 120 && enemyRef.currentCombo >= 80) {
                        return 'e_pr_void_death';
                    } else {
                        return p2Skills[Math.floor(Math.random() * p2Skills.length)];
                    }
                } else {
                    // ==========================================
                    // 【一階段：強制單發機制】
                    // ==========================================
                    let chosenSkill;
                    if (enemyRef.stanceType === 'def') {
                        chosenSkill = Math.random() < 0.5 ? 'e_pr_def_step' : 'e_pr_def_wind';
                    } else {
                        chosenSkill = Math.random() < 0.5 ? 'e_pr_off_light' : 'e_pr_off_strike';
                    }

                    // 查表：對應這四招在 db_skills.js 中的 comboCost (氣力消耗)
                    const costMap = {
                        'e_pr_def_step': 20,
                        'e_pr_def_wind': 25,
                        'e_pr_off_light': 25,
                        'e_pr_off_strike': 35
                    };
                    
                    // 【核心邏輯】：將她當前的氣力值，強行降到「剛好只能放這一招」
                    // 這樣引擎在施放完畢並扣除消耗後，氣力會剛好 = 0
                    // 必定無法通過連擊判定，從而完美且自然地結束敵方回合。
                    enemyRef.currentCombo = costMap[chosenSkill];
                    
                    return chosenSkill;
                }
            }
        }
    },
};