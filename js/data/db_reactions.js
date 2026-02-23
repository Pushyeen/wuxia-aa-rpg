// js/data/db_reactions.js

export const DB_REACTIONS = [
    { id: "overload", name: "陰陽相激", condition: (tags, t) => (tags.includes("寒") && t.tags.fire > 0) || (tags.includes("炎") && t.tags.ice > 0), 
      execute: (t, p, e, log) => { t.tags.fire=0; t.tags.ice=0; t.hp-=300; log("♨️ 【陰陽相激】冰火交加引發真氣殉爆！", "dmg-msg"); return 1.5; } },

    { id: "shatter", name: "冰封碎裂", condition: (tags, t) => tags.includes("鈍") && t.tags.frozen, 
      execute: (t, p, e, log) => { t.tags.frozen=false; t.hp-= (t.maxHp*0.15 + 500); log("💥 【冰封碎裂】重擊擊碎冰塊，造成巨量真實傷害！", "dmg-msg"); return 2.0; } },

    { id: "melt", name: "冰火蒸發", condition: (tags, t) => tags.includes("炎") && t.tags.frozen, 
      execute: (t, p, e, log) => { t.tags.frozen=false; log("💨 【高溫蒸發】烈焰融化冰封，產生高溫破甲傷害！", "story-msg"); return 1.5; } },

    { id: "inferno", name: "風火燎原", condition: (tags, t, e) => tags.includes("風") && (t.tags.fire > 0 || e.fire > 0), 
      execute: (t, p, e, log) => { let dmg = (t.tags.fire||0)*50 + e.fire*100; t.hp-=dmg; t.tags.fire=0; e.fire=0; log(`🌪️ 【風火燎原】狂風捲起火海，追加 ${dmg} 傷害！`, "dmg-msg"); return 1.5; } },

    { id: "magnetize", name: "萬物歸宗", condition: (tags, t, e) => tags.includes("牽引") && e.needles > 0, 
      execute: (t, p, e, log) => { let dmg = e.needles * 60; t.hp-=dmg; e.needles=0; log(`🧲 【萬物歸宗】暗器貫穿敵人，追加 ${dmg} 傷害！`, "dmg-msg"); return 1.2; } },

    { id: "mech_boom", name: "機關殉爆", condition: (tags, t, e) => (tags.includes("炎") || tags.includes("鈍")) && e.gears > 0, 
      execute: (t, p, e, log) => { let dmg = e.gears * 100; t.hp-=dmg; e.gears=0; log(`⚙️ 【機關殉爆】齒輪引發連鎖炸裂！`, "dmg-msg"); return 1.5; } },

    { id: "wind_silk", name: "風中殘絲", condition: (tags, t) => tags.includes("風") && t.tags.silk > 0, 
      execute: (t, p, e, log) => { t.tags.silk += 2; log(`🕸️ 【風中殘絲】狂風讓絲線纏繞更緊！(絲線+2)`, "warn-msg"); return 1.0; } },

    { id: "sharp_ice", name: "冰刃刺骨", condition: (tags, t) => tags.includes("銳") && t.tags.ice > 0, 
      execute: (t, p, e, log) => { t.hp -= t.tags.ice * 50; log(`❄️ 【冰刃刺骨】銳器挾帶寒氣入體！`, "dmg-msg"); return 1.2; } }
];