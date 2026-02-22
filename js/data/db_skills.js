// js/data/db_skills.js

export const DB_SKILLS = {
    // 1. 拳法 (1擊，鈍擊)
    "s_punch": { name: "羅漢拳", power: 20, weight: 50, vfx: "fist_strike", msg: "馬步一扎，揮出剛猛一拳", hits: 1 },
    // 2. 快劍 (3擊，極速)
    "s_fast_sword": { name: "狂風快劍", power: 15, weight: 60, vfx: "wind_sword", msg: "劍如狂風，瞬間連刺數下", hits: 3 },
    // 3. 重劍 (1擊，高爆擊率)
    "s_heavy_blade": { name: "力劈華山", power: 80, weight: 30, vfx: "heavy_slash", msg: "高高躍起，以開山之勢重劈", hits: 1, critBonus: 0.4 },
    // 4. 毒功 (隨機1~3擊)
    "s_poison": { name: "萬毒鑽心", power: 25, weight: 40, vfx: "poison_cloud", msg: "大袖一揮，散出詭異毒氣", hits: null }, // null 代表隨機 1~3
    // 5. 火系 (1擊，毀滅性)
    "s_fire": { name: "純陽無極功", power: 100, weight: 20, vfx: "fire_blast", msg: "掌心凝聚純陽之火，轟然爆發", hits: 1 },
    // 6. 冰系 (2擊)
    "s_ice": { name: "寒冰真氣", power: 35, weight: 45, vfx: "ice_shatter", msg: "寒氣逼人，凝水成冰激射而出", hits: 2 },
    // 7. 太極 (2擊，以柔克剛)
    "s_taiji": { name: "太極劍法", power: 40, weight: 50, vfx: "taiji_circle", msg: "劍意綿綿不絕，畫出太極氣旋", hits: 2 },
    // 8. 暗器 (3擊，低傷高頻)
    "s_needles": { name: "暴雨梨花針", power: 10, weight: 55, vfx: "needle_rain", msg: "扣動機關，無數毒針傾瀉而下", hits: 3 },
    // 9. 降龍 (隨機 1~3 擊)
    "s_dragon": { name: "降龍十八掌", power: 60, weight: 30, vfx: "dragon_strike", msg: "龍吟聲起，浩然掌氣排山倒海", hits: null },
    // 10. 敵方專用
    "s_enemy_slash": { name: "狂劈", power: 20, weight: 50, vfx: "heavy_slash", msg: "大喝一聲，瘋狂劈砍", hits: null }
};