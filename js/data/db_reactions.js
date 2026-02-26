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
    },
    // 連鎖 1：【力量推動】 (武男專屬被動，隨境界增傷)
    { 
        id: "wu_power_push", 
        name: "力量推動", 
        // 條件：攻擊者擁有 [重天] 氣場，且招式不是終極爆破技 ([心震])
        condition: (tags, t, env, attacker) => attacker && attacker.aura && attacker.aura['重天'] > 0 && !tags.includes("心震"), 
        execute: (t, p, e, log) => { 
            let stacks = p.aura['重天'];
            let mult = 1.0 + (stacks * 0.3); // 每層增加 30% 最終傷害
            
            let msg = `⚡ 【力量推動】在 ${stacks} 重天的元磁轉動加持下，武男的威力暴增！`;
            
            // 如果達到 3 重天以上，額外附帶破甲真實傷害
            if (stacks >= 3) {
                let armorPenDmg = 150; 
                t.hp -= armorPenDmg;
                msg += `並造成了 ${armorPenDmg} 點無情的真實傷害！`;
            }
            
            log(msg, "warn-msg"); 
            return mult; 
        } 
    },

    // 連鎖 2：【境界爆破】 (武男終極殺招)
    { 
        id: "wu_ultimate", 
        name: "境界爆破", 
        // 條件：招式帶有 [心震] 標籤，且重天 >= 5
        condition: (tags, t, env, attacker) => tags.includes("心震") && attacker && attacker.aura && attacker.aura['重天'] >= 5, 
        execute: (t, p, e, log) => { 
            p.aura['重天'] = 0; // 消耗所有境界
            
            // 造成玩家最大生命值 50% 的真實傷害
            let trueDmg = Math.floor(t.maxHp * 0.5); 
            t.hp -= trueDmg; 
            
            log(`💥 【境界爆破】五十萬匹力量完全爆發！狂暴真氣瞬間造成 ${trueDmg} 點毀滅性真實傷害！`, "dmg-msg"); 
            return 2.5; // 本身的招式威力再乘以 2.5 倍
        } 
    },
    { 
        id: "pr_void_break", 
        name: "伽藍之洞", 
        condition: (tags) => tags.includes("破勢"), 
        execute: (t, p, e, log) => { 
            // 擊碎玩家的所有正面氣場
            ['木甲', '冰盾', '反擊', '疾風', '氣旋', '絲陣'].forEach(k => delete t.aura[k]);
            log(`👁️ 【伽藍之洞】看破了萬物的死線！你身上的所有護體氣場被瞬間擊碎！`, "warn-msg"); 
            return 1.2; 
        } 
    },
    { 
        id: "pr_void_death", 
        name: "直死魔眼", 
        condition: (tags) => tags.includes("直死"), 
        execute: (t, p, e, log) => { 
            // 造成最大生命值 40% 的絕對真實傷害
            let trueDmg = Math.floor(t.maxHp * 0.4); 
            t.hp -= trueDmg; 
            log(`💀 【直死魔眼】這就是，事物的死。造成 ${trueDmg} 點真實傷害！`, "dmg-msg"); 
            return 2.0; 
        } 
    },
    // ==========================================
    // 【勢】系連鎖：霸王卸甲 (大招倍率爆發)
    // ==========================================
    { 
        id: "overlord_ult", 
        name: "霸王卸甲", 
        // 條件：招式帶有 [卸甲] 標籤，且施放時有成功暫存到層數
        condition: (tags, t, env, attacker) => tags.includes("卸甲") && (attacker.tempUltStacks || 0) > 0, 
        execute: (t, p, e, log) => { 
            let stacks = p.tempUltStacks;
            p.tempUltStacks = 0; // 讀取後清空暫存
            
            // 核心公式：每 1 層霸意/霸體，增加 80% 最終傷害
            let mult = 1.0 + (stacks * 0.8); 
            let msg = `💥 【霸王萬鈞】重劍爆發出 ${mult.toFixed(1)} 倍的毀滅性力量！`;
            
            // 境界突破：若消耗超過 3 層，附帶空間震盪的真實傷害
            if (stacks >= 3) {
                let trueDmg = Math.floor(t.maxHp * 0.15); // 敵方最大生命值 15% 的真傷
                t.hp -= trueDmg;
                msg += `\n🩸 極致的力量引發空間震盪，額外造成 ${trueDmg} 點真實傷害！`;
            }
            
            log(msg, "dmg-msg"); 
            return mult; // 將計算出的超高倍率回傳給戰鬥引擎
        } 
    },
    // ==========================================
    // 【道】系連鎖：機關殉爆與兩儀核爆
    // ==========================================
    
    { 
        id: "mech_explode", 
        name: "萬機殉爆", 
        // 觸發條件：招式有 [爆破] 標籤，且場上還有殘餘的機關暗器
        condition: (tags, t, env) => tags.includes("爆破") && (env.needles > 0), 
        execute: (t, p, e, log) => { 
            let count = e.needles;
            let dmg = count * 150; // 每根暗器轉化為 150 真實傷害
            e.needles = 0; // 清空暗器
            t.hp -= dmg;
            log(`💥 【萬機殉爆】天雷引爆了場上 ${count} 個暗器，造成 ${dmg} 點真實機關傷害！`, "dmg-msg"); 
            return 1.0; 
        } 
    },

    { 
        id: "ice_fire_blast", 
        name: "冰火兩儀爆", 
        // 觸發條件：招式有 [爆破] 標籤，且目標/場上同時存在 冰 與 火
        condition: (tags, t, env) => tags.includes("爆破") && 
                                   (t.tags['fire'] > 0 || env.fire > 0) && 
                                   (t.tags['ice'] > 0 || env.ice_cone > 0), 
        execute: (t, p, e, log) => { 
            // 結算所有的冰火層數
            let fireStacks = (t.tags['fire'] || 0) + (e.fire || 0);
            let iceStacks = (t.tags['ice'] || 0) + (e.ice_cone || 0);
            
            t.tags['fire'] = 0; t.tags['ice'] = 0;
            e.fire = 0; e.ice_cone = 0;
            
            // 毀滅性公式：敵方最大生命值 30% + 層數加成的真實傷害
            let baseDmg = Math.floor(t.maxHp * 0.3); 
            let extraDmg = (fireStacks + iceStacks) * 50;
            let totalDmg = baseDmg + extraDmg;
            
            t.hp -= totalDmg;
            log(`☢️ 【冰火兩儀爆】極寒與極熱劇烈衝突！瞬間蒸發了目標 ${totalDmg} 點生命值！`, "warn-msg"); 
            
            // 可以加入震動效果
            if (document.getElementById('combat-window')) {
                document.getElementById('combat-window').classList.add('shake-effect');
                setTimeout(() => document.getElementById('combat-window').classList.remove('shake-effect'), 400);
            }
            return 1.5; // 大招本身的基礎傷害再乘以 1.5 倍
        } 
    },
    // ==========================================
    // 【念】系連鎖：萬佛朝宗 與 怒火焚城
    // ==========================================
    
    { 
        id: "dharma_zen_ult", 
        name: "萬佛朝宗", 
        // 條件：招式有 [超渡] 標籤，且施放時暫存了【禪定】層數
        condition: (tags, t, env, attacker) => tags.includes("超渡") && (attacker.tempZen || 0) > 0, 
        execute: (t, p, e, log) => { 
            let stacks = p.tempZen;
            p.tempZen = 0; 
            
            // 基礎效果：清空敵方行動條與氣力值 (徹底打斷敵方節奏)
            t.wait = 0;
            t.currentCombo = 0;
            
            // 傷害公式：每層禪定附加 10% 自身最大生命值的真實傷害
            let trueDmg = Math.floor(p.maxHp * 0.1 * stacks);
            t.hp -= trueDmg;
            
            log(`📿 【萬佛朝宗】佛光普照，強行渡化！清空敵方所有行動力，並造成 ${trueDmg} 點真實傷害！`, "dmg-msg"); 
            return 1.5; // 基礎招式傷害乘以 1.5 倍
        } 
    },

    { 
        id: "dharma_wrath_ult", 
        name: "怒火焚城", 
        // 條件：招式有 [超渡] 標籤，且施放時暫存了【怒意】層數
        condition: (tags, t, env, attacker) => tags.includes("超渡") && (attacker.tempWrath || 0) > 0, 
        execute: (t, p, e, log) => { 
            let stacks = p.tempWrath;
            p.tempWrath = 0; 
            
            // 狂戰士效果：將自身「已損失生命值」直接按比例轉化為真實傷害
            // 層數越高，轉化率越高。1層=50%，2層=100%，3層=150%...
            let missingHp = Math.max(0, p.maxHp - p.hp);
            let mult = stacks * 0.5;
            let trueDmg = Math.floor(missingHp * mult);
            
            if (trueDmg > 0) {
                t.hp -= trueDmg;
                log(`🌋 【怒火焚城】我不入地獄誰入地獄！燃燒鮮血化為 ${trueDmg} 點毀滅性的真實傷害！`, "warn-msg"); 
            } else {
                log(`🌋 【怒火焚城】滿血狀態無法發揮怒火的最大威力...`, "sys-msg"); 
            }
            
            // 畫面劇烈震動
            let combatWin = document.querySelector('.battle-ui');
            if (combatWin) {
                combatWin.classList.add('shake-effect');
                setTimeout(() => combatWin.classList.remove('shake-effect'), 500);
            }
            
            return 2.0; // 大招本身物理/法術傷害翻倍
        } 
    },
    // ==========================================
    // 【音】系連鎖：餘音繞樑 (指數爆發)
    // ==========================================
    
    { 
        id: "echo_resonance_ult", 
        name: "餘音繞樑", 
        // 條件：招式有 [共振] 標籤，且目標身上有 [餘音]
        condition: (tags, t, env, attacker) => tags.includes("共振") && (t.tags['餘音'] > 0), 
        execute: (t, p, e, log) => { 
            let echoes = t.tags['餘音'];
            t.tags['餘音'] = 0; // 引爆後清空
            
            // 指數型倍率公式：1.3 的 餘音層數 次方
            // (例如：5層=3.7倍, 10層=13.7倍, 15層=51倍)
            let mult = Math.pow(1.3, echoes);
            
            // 設置一個安全上限，避免疊太多層導致傷害突破天際 (最高 50 倍)
            mult = Math.min(50, mult);
            
            log(`💥 【餘音繞樑】樂曲達到高潮！${echoes} 層餘音引發了 ${mult.toFixed(1)} 倍的毀滅性音爆！`, "dmg-msg"); 
            
            // 畫面劇烈震動特效
            let combatWin = document.querySelector('.battle-ui');
            if (combatWin) {
                combatWin.classList.add('shake-effect');
                setTimeout(() => combatWin.classList.remove('shake-effect'), 500);
            }
            
            return mult; // 將計算出的極高倍率回傳給戰鬥引擎
        } 
    },
    // ==========================================
    // 【策】系連鎖：天機看破 (破綻絕對斬殺)
    // ==========================================
    
    { 
        id: "guigu_execute_ult", 
        name: "天機看破", 
        // 條件：招式有 [識破] 標籤，且目標身上有 [死穴]
        condition: (tags, t, env, attacker) => tags.includes("識破") && (t.tags['死穴'] > 0), 
        execute: (t, p, e, log) => { 
            let stacks = t.tags['死穴'];
            t.tags['死穴'] = 0; // 引爆後清空所有破綻
            
            // 計算斬殺線：基礎 15% + (每層 5%)。17層剛好是 100%
            let thresholdPct = 15 + (stacks * 5); 
            // 取得敵方目前的血量百分比
            let currentHpPct = (t.hp / t.maxHp) * 100;
            
            if (currentHpPct <= thresholdPct) {
                // 斬殺成功！
                t.hp -= 99999;
                log(`♟️ 【天機看破】斬殺線已達 ${thresholdPct}%！敵方命數已盡，觸發絕對斬殺！`, "warn-msg"); 
                
                // 強烈畫面震動演出
                let combatWin = document.querySelector('.battle-ui');
                if (combatWin) {
                    combatWin.classList.add('shake-effect');
                    setTimeout(() => combatWin.classList.remove('shake-effect'), 600);
                }
                return 1.0; 
                
            } else {
                // 斬殺失敗：血量還太多，僅造成懲罰性真實傷害
                let trueDmg = stacks * 50; // 每層補償 50 點真傷
                t.hp -= trueDmg;
                log(`♟️ 【天機看破】斬殺線為 ${thresholdPct}%，但敵方氣血尚旺 (${currentHpPct.toFixed(1)}%)，斬殺失敗！僅造成 ${trueDmg} 點真實傷害。`, "sys-msg"); 
                
                return 1.5; // 大招基礎傷害仍可造成 1.5 倍傷害
            }
        } 
    },
];