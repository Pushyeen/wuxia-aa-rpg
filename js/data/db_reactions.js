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
      execute: (t, p, e, log) => { t.hp -= t.tags.ice * 50; log(`❄️ 【冰刃刺骨】銳器挾帶寒氣入體！`, "dmg-msg"); return 1.2; } },

     { 
        id: "hexagram_res", 
        name: "八卦生生", 
        condition: (tags) => tags.includes("佈局"), 
        execute: (t, p, e, log) => { 
            // 注意：p 在這裡是 attacker (攻擊者，即 Boss 本身)
            if(p.aura && p.aura['卦象'] > 0) {
                p.aura['卦象']--; 
                let heal = Math.floor(p.maxHp * 0.05); // 恢復 5% 最大生命
                p.hp = Math.min(p.maxHp, p.hp + heal);
                t.wait = Math.max(0, t.wait - 20); // 擊退玩家 ATB
                log(`☯️ 【八卦生生】陣法流轉，莫測消耗卦象恢復 ${heal} 氣血，並使你的行動倒退！`, "warn-msg"); 
                return 1.2; // 招式威力小幅提升
            }
            return 1.0;
        } 
    },

    // 連鎖 2：【天機看破】 (無解的斬殺)
    // 說明：一旦玩家身上累積了 3 層以上的死穴，且 Boss 抽到了帶有 [識破] 的終結技，將引發毀滅性打擊。
    { 
        id: "fatal_insight", 
        name: "天機看破", 
        condition: (tags, t) => tags.includes("識破") && (t.tags['死穴'] || 0) >= 3, 
        execute: (t, p, e, log) => { 
            let stacks = t.tags['死穴'];
            t.tags['死穴'] = 0; // 清空印記
            
            // 真實傷害計算：每層 400 + 玩家最大生命值的 10%
            let trueDmg = (stacks * 400) + Math.floor(t.maxHp * 0.1); 
            t.hp -= trueDmg; 
            
            log(`👁️ 【天命難違】莫測看破了你的死穴！造成 ${trueDmg} 點真實傷害！`, "dmg-msg"); 
            return 2.5; // 此招本身的基礎傷害還會再暴漲 2.5 倍
        } 
    },

    // 連鎖 1：【霓裳羽衣】 (極致的身法反擊)
    // 說明：玩家攻擊幽蘭時，若她有霓裳氣場，會迴避並反向疊加餘音。
    { 
        id: "neon_dance", 
        name: "霓裳羽衣", 
        // 條件：攻擊者(玩家)試圖擊中擁有 [霓裳] 氣場的幽蘭
        condition: (tags, t) => t.aura && t.aura['霓裳'] > 0, 
        execute: (t, p, e, log) => { 
            t.aura['霓裳']--; 
            // 為攻擊者(玩家)附加 1 層餘音
            if(!p.tags) p.tags = {};
            p.tags['餘音'] = (p.tags['餘音'] || 0) + 1;
            
            log(`💃 【霓裳羽衣】幽蘭隨風起舞閃過了攻擊，並在你耳邊留下了一聲輕笑。(餘音+1)`, "warn-msg"); 
            return 0; // 傷害倍率歸零，等同於絕對迴避
        } 
    },

    // 連鎖 2：【餘音繞樑】 (高頻真實傷害引爆)
    // 說明：幽蘭使用 [共振] 招式時引爆玩家身上的 [餘音]。
    { 
        id: "echoing_res", 
        name: "餘音繞樑", 
        condition: (tags, t) => tags.includes("共振") && (t.tags['餘音'] || 0) > 0, 
        execute: (t, p, e, log) => { 
            let stacks = t.tags['餘音'];
            // 餘音繞樑，層數減半而不是清空
            t.tags['餘音'] = Math.floor(stacks / 2); 
            
            // 每層引爆 80 點真實傷害
            let trueDmg = stacks * 80; 
            t.hp -= trueDmg; 
            
            log(`🎶 【餘音繞樑】琴音與你體內的真氣產生共鳴，引發連鎖音爆！追加 ${trueDmg} 傷害！`, "dmg-msg"); 
            return 1.3; // 額外提升本次共振招式的基礎威力
        } 
    },
// 連鎖 1：【千機連發】 (每發暗器獨立判定與消耗)
    { 
        id: "tang_ammo_burst", 
        name: "千機連發", 
        // 條件：攻擊帶有 [連動]，且攻擊者身上還有至少 1 發 [千機匣] 彈藥
        condition: (tags, t, env, attacker) => tags.includes("連動") && (attacker.aura && attacker.aura['千機匣'] >= 1), 
        execute: (t, p, e, log) => { 
            p.aura['千機匣'] -= 1; // 每次打擊(Hit)精準消耗 1 發彈藥
            log(`⚙️ 【千機連動】消耗 1 發彈藥，本發暗器威力暴增！(剩餘: ${p.aura['千機匣']})`, "warn-msg"); 
            return 3.0; // 有彈藥時，該次打擊威力乘以 3 倍！
        } 
    },

    // 連鎖 2：【見血封喉】 (引爆毒素也必須有實體毒針彈藥加持)
    { 
        id: "tang_toxic_catalyst", 
        name: "見血封喉", 
        // 條件：銳器攻擊，玩家有 [破甲毒]，且唐翎必須有至少 1 發彈藥才能刺破護甲
        condition: (tags, t, env, attacker) => tags.includes("銳") && (t.tags && t.tags['破甲毒'] > 0) && (attacker.aura && attacker.aura['千機匣'] >= 1), 
        execute: (t, p, e, log) => { 
            // 如果是絕殺技(帶有催化標籤)，獨立消耗 1 發彈藥。若是連動技，彈藥已在上方扣除。
            if (tags.includes("催化")) {
                p.aura['千機匣'] -= 1;
            }
            
            let stacks = t.tags['破甲毒'];
            t.tags['破甲毒'] = 0; // 引爆後清空
            
            // 真實傷害：每層造成玩家最大生命值的 8%
            let trueDmg = Math.floor(t.maxHp * 0.08 * stacks); 
            t.hp -= trueDmg; 
            
            log(`☠️ 【見血封喉】毒針刺破護甲！毒素瞬間腐蝕心脈，造成 ${trueDmg} 點真實傷害！`, "dmg-msg"); 
            return 1.5; // 銳器本身的傷害也獲得加成
        } 
    }
];