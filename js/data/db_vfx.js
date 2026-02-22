// js/data/db_vfx.js

export const VFX_DB = {
    // 1. 龍形氣功 (直線、巨大化、高延遲)
    "dragon_strike": { count: 25, duration: 40, behavior: "projectile", speed: 15, spread: 30, chars: ["龍", "🐉", "爪", "痕", "///", "."], colors: ["#FFD700", "#FF4500", "#8B0000", "#330000"], scaleCurve: { 0.0: 1.0, 0.4: 2.5, 1.0: 0.5 }, shadow: true },
    // 2. 劍雨天降 (從天落下、冷色系)
    "sword_rain": { count: 30, duration: 30, behavior: "rain", speed: 20, spread: 100, chars: ["|", "｜", "↓", "V", "."], colors: ["#FFFFFF", "#AADDFF", "#55AAFF", "#0055AA"], scaleCurve: { 0.0: 0.5, 0.2: 1.5, 1.0: 0.2 }, shadow: true },
    // 3. 羅漢拳風 (直線、短促、鈍擊感)
    "fist_strike": { count: 15, duration: 20, behavior: "projectile", speed: 25, spread: 15, chars: ["拳", "👊", "震", "💥", "。"], colors: ["#FFAA55", "#FF8800", "#553311"], scaleCurve: { 0.0: 1.5, 0.3: 2.5, 1.0: 0.5 }, shadow: false },
    // 4. 快劍連刺 (直線、極速、殘影)
    "wind_sword": { count: 12, duration: 15, behavior: "projectile", speed: 30, spread: 5, chars: ["—", "＞", "刺", "✧"], colors: ["#ffffff", "#eebbff", "#aa55ff"], scaleCurve: { 0.0: 1.0, 0.5: 2.0, 1.0: 0.5 }, shadow: true },
    // 5. 力劈重斬 (直線、擴散廣、血紅色)
    "heavy_slash": { count: 20, duration: 25, behavior: "projectile", speed: 12, spread: 45, chars: ["/", "／", "斬", "血", "裂"], colors: ["#ff0000", "#880000", "#330000"], scaleCurve: { 0.0: 2.0, 0.5: 3.5, 1.0: 1.0 }, shadow: true },
    // 6. 萬毒鑽心 (向上漂浮、詭異綠紫、慢性)
    "poison_cloud": { count: 35, duration: 50, behavior: "float_up", speed: 3, spread: 60, chars: ["毒", "♨", "☠", "腐", "."], colors: ["#55ff55", "#aa00ff", "#338833"], scaleCurve: { 0.0: 0.5, 0.5: 2.0, 1.0: 0.1 }, shadow: false },
    // 7. 純陽火爆 (原地爆炸、360度擴散)
    "fire_blast": { count: 40, duration: 30, behavior: "explode", speed: 18, spread: 360, chars: ["火", "炎", "爆", "💥", "煙"], colors: ["#ffff00", "#ff5500", "#ff0000", "#444444"], scaleCurve: { 0.0: 1.0, 0.3: 3.0, 1.0: 0.2 }, shadow: true },
    // 8. 寒冰碎裂 (直線、碎裂感、冰藍色)
    "ice_shatter": { count: 25, duration: 35, behavior: "projectile", speed: 16, spread: 25, chars: ["冰", "❄", "寒", "碎", "・"], colors: ["#ffffff", "#aaddff", "#0088ff"], scaleCurve: { 0.0: 0.8, 0.6: 1.5, 1.0: 0.2 }, shadow: true },
    // 9. 太極劍圈 (慢速漂浮、黑白相間)
    "taiji_circle": { count: 20, duration: 60, behavior: "float_up", speed: 1, spread: 40, chars: ["☯", "柔", "化", "轉", "〇"], colors: ["#ffffff", "#cccccc", "#555555", "#000000"], scaleCurve: { 0.0: 1.0, 0.5: 2.0, 1.0: 0.5 }, shadow: true },
    // 10. 暴雨飛針 (天降、極密集、細小)
    "needle_rain": { count: 60, duration: 25, behavior: "rain", speed: 28, spread: 120, chars: ["|", "針", "刺", "."], colors: ["#dddddd", "#aaaaaa", "#555555"], scaleCurve: { 0.0: 0.3, 0.5: 0.8, 1.0: 0.1 }, shadow: false }
};