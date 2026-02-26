// js/data/db_skills.js

// 翩若專屬：架勢切換鉤子
const switchPianruoStance = (ctx) => {
    let t = ctx.attacker;
    if (t.isPhase2) return;
    
    // 清除舊架勢
    ['游雲', '迴雪', '驚風', '蔽月', '驚鴻', '宛龍', '耀日', '芙蕖'].forEach(k => delete t.aura[k]);
    
    // 陣營反轉與數量遞增
    if (t.stanceType === 'def') {
        t.stanceType = 'off';
    } else {
        t.stanceType = 'def';
        if (t.stanceLevel < 4) t.stanceLevel++; // 每次從攻轉守時，架勢數量 +1
    }
    
    // 隨機抽取新架勢
    let pool = t.stanceType === 'def' ? ['游雲', '迴雪', '驚風', '蔽月'] : ['驚鴻', '宛龍', '耀日', '芙蕖'];
    pool.sort(() => Math.random() - 0.5);
    let selected = pool.slice(0, t.stanceLevel);
    selected.forEach(s => t.aura[s] = 1);
    
    let typeName = t.stanceType === 'def' ? '守之型' : '攻之型';
    ctx.log(`✨ 翩若舞步變換，進入【${typeName}】！獲得架勢：${selected.join('、')}`, "story-msg");
};

export const DB_SKILLS = {

    // ==========================================
    // 玩家武學區塊：五大行系統 (The Hexagon System)
    // 標籤堆疊：[五行, 關鍵字, 次要標籤, 舊有相容標籤/UI分類標籤]
    // ==========================================

    // 👊 【勢】系 (發勁) - 強調肉體極限、兵器與拳腳功夫
    's_yq_punch': {
        name: "野球拳", type: "phys", power: 25, comboCost: 20, 
        tags: ["勢", "發勁", "鈍", "拳"], vfx: "strike",
        msg: "無招勝有招，看似瞎比劃實則威力無窮！", hits: 1
    },
    
// ==========================================
    // ⚔️ 【勢】系：霸王玄鐵劍法 (大開大闔、蓄力爆發流)
    // ==========================================

    's_iron_light': {
        name: "舉重若輕", type: "phys", power: 50, comboCost: 30, 
        tags: ["勢", "發勁", "鈍", "劍"], vfx: "heavy_slash",
        msg: "看似緩慢的平揮，實則暗藏萬鈞之力。獲得1層【霸意】。", 
        onHit: (ctx) => {
            // 命中後獲得 1 層霸意
            ctx.addAura(ctx.attacker, '霸意', 1);
            // 沉重的劍風打退敵方行動條
            ctx.target.wait = Math.max(0, ctx.target.wait - 15);
            ctx.log("🛡️ 沉重的劍風壓制了對手，敵方行動微幅倒退！", "sys-msg");
        }
    },

    's_iron_defend': {
        name: "鐵索橫江", type: "phys", power: 0, comboCost: 40, 
        tags: ["勢", "發勁", "鈍", "Aura", "劍"], vfx: "taiji_circle",
        msg: "將重劍橫於胸前。放棄攻擊，獲得2層【霸體】進行絕對格擋。", 
        onCast: (ctx) => {
            // 發動時直接獲得霸體氣場
            ctx.addAura(ctx.attacker, '霸體', 2);
        }
    },

    's_iron_heavy': {
        name: "破軍沉劈", type: "phys", power: 120, comboCost: 60, 
        tags: ["勢", "發勁", "鈍", "剛", "劍"], vfx: "dragon_strike",
        msg: "力劈華山。若有【霸意】則消耗1層，本次攻擊無視50%防禦。", 
        onCast: (ctx) => {
            // 出招前檢測，若有霸意則消耗之，並換取 1 層「破甲_生效」的攻擊端氣場
            if (ctx.attacker.aura && ctx.attacker.aura['霸意'] > 0) {
                ctx.attacker.aura['霸意']--;
                ctx.addAura(ctx.attacker, '破甲_生效', 1);
            }
        }
    },

    's_iron_ult': {
        name: "霸王卸甲·萬鈞", type: "phys", power: 80, comboCost: 100, 
        tags: ["勢", "發勁", "銳", "剛", "卸甲", "劍"], vfx: "sword_rain",
        msg: "搏命一擊。消耗所有【霸意】與【霸體】，轉化為極致傷害！", 
        onCast: (ctx) => {
            // 結算身上所有的霸意與霸體
            let stacks = (ctx.attacker.aura['霸意'] || 0) + (ctx.attacker.aura['霸體'] || 0);
            // 將層數暫存起來，供 db_reactions.js 讀取進行倍率放大
            ctx.attacker.tempUltStacks = stacks; 
            
            // 清空氣場
            ctx.attacker.aura['霸意'] = 0;
            ctx.attacker.aura['霸體'] = 0;
            
            if (stacks > 0) {
                ctx.log(`💥 卸下所有防備，將 ${stacks} 層霸念全數灌注於重劍之上！`, "warn-msg");
            }
        }
    },

    // ==========================================
    // 🔮 【道】系：奇門五行術 (佈局、催化、引爆流)
    // ==========================================

    'd_qimen_scatter': {
        name: "天女散花", type: "phys", power: 10, comboCost: 20, 
        tags: ["道", "激發", "機", "佈置", "針"], vfx: "needle_rain",
        msg: "在戰場灑下大量暗器。留下3個【機關暗器】。", 
        onHit: (ctx) => {
            ctx.addEnv('needles', 3);
        }
    },

    'd_qimen_fire': {
        name: "三昧真火符", type: "qi", power: 40, comboCost: 25, 
        tags: ["道", "激發", "術", "炎"], vfx: "fire_blast",
        msg: "疊加2層【炎】。若場上有暗器，將1個轉化為【火種】。", 
        onHit: (ctx) => {
            ctx.addTag(ctx.target, 'fire', 2);
            if (ctx.env.needles > 0) {
                ctx.env.needles--;
                ctx.addEnv('fire', 1);
                ctx.log("🔥 符籙點燃了地上的暗器，形成 1 個【火種】！", "sys-msg");
            }
        }
    },

    'd_qimen_ice': {
        name: "玄冰符", type: "qi", power: 40, comboCost: 25, 
        tags: ["道", "激發", "術", "寒"], vfx: "sword_rain",
        msg: "疊加2層【寒】。若場上有暗器，將1個轉化為【冰錐】。", 
        onHit: (ctx) => {
            ctx.addTag(ctx.target, 'ice', 2);
            if (ctx.env.needles > 0) {
                ctx.env.needles--;
                ctx.addEnv('ice_cone', 1);
                ctx.log("❄️ 符籙凍結了地上的暗器，形成 1 個【冰錐】！", "sys-msg");
            }
        }
    },

    'd_qimen_wind': {
        name: "八卦·巽風震", type: "qi", power: 50, comboCost: 45, 
        tags: ["道", "激發", "術", "風", "牽引"], vfx: "dragon_strike", hits: 1,
        msg: "狂風捲起場上所有物件砸向敵人！每捲起1個物件增加1次連擊。", 
        onCast: (ctx) => {
            let bonusHits = 0;
            // 掃描並清空場上所有可被狂風捲起的物件
            ['needles', 'fire', 'ice_cone'].forEach(k => {
                if (ctx.env[k] > 0) {
                    bonusHits += ctx.env[k];
                    ctx.env[k] = 0;
                }
            });
            // 動態疊加多段連擊
            if (bonusHits > 0) {
                ctx.skill.hits = 1 + bonusHits;
                ctx.log(`🌪️ 狂風肆虐！捲起了 ${bonusHits} 個環境物件化為暴風連擊！`, "warn-msg");
            } else {
                ctx.skill.hits = 1; // 沒物件時只有基礎 1 hit
            }
        }
    },

    'd_qimen_defend': {
        name: "奇門·移星換斗", type: "qi", power: 0, comboCost: 50, 
        tags: ["道", "激發", "機", "Aura"], vfx: "taiji_circle",
        msg: "消耗所有【機關暗器】構築防禦，每個換取 1 次【絕對閃避】。", 
        onCast: (ctx) => {
            if (ctx.env.needles > 0) {
                let dodgeCount = ctx.env.needles;
                ctx.addAura(ctx.attacker, '絕對閃避', dodgeCount);
                ctx.env.needles = 0;
                ctx.log(`✨ 消耗場上暗器佈陣，獲得 ${dodgeCount} 次絕對閃避！`, "story-msg");
            } else {
                ctx.log("⚠️ 場上沒有機關暗器，佈陣失敗！", "warn-msg");
            }
        }
    },

    'd_qimen_ult': {
        name: "五雷天罡陣", type: "qi", power: 100, comboCost: 90, 
        tags: ["道", "激發", "術", "雷", "爆破"], vfx: "strike",
        msg: "引動九天玄雷！強行結算場上印記與機關，引發驚天連鎖爆炸！", 
        // 實際的核彈結算寫在 db_reactions.js 裡，藉由 [爆破] 標籤觸發
        onCast: (ctx) => {
            ctx.log("⚡ 「九天玄剎，化為神雷。煌煌天威，以劍引之！」", "warn-msg");
        }
    },
// ==========================================
    // 📿 【念】系：達摩易筋經 (內家境界、防反鎖血流)
    // ==========================================

    'n_dharma_meditate': {
        name: "菩提無樹", type: "qi", power: 0, comboCost: 20, 
        tags: ["念", "運氣", "空", "Aura"], vfx: "taiji_circle",
        msg: "摒除雜念，內息流轉。獲得 2 層【禪定】，並微幅恢復氣血。", 
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '禪定', 2);
            let heal = Math.floor(ctx.attacker.maxHp * 0.05);
            ctx.attacker.hp = Math.min(ctx.attacker.maxHp, ctx.attacker.hp + heal);
            ctx.log(`🧘 佛光護體，少俠恢復了 ${heal} 點氣血！`, "story-msg");
        }
    },

    'n_dharma_flower': {
        name: "迦葉拈花指", type: "qi", power: 30, comboCost: 35, 
        tags: ["念", "運氣", "柔", "牽引"], vfx: "wind_sword",
        msg: "以柔克剛。吸收敵方行動條，若有【禪定】則額外吸血。", 
        onHit: (ctx) => {
            // 吸收行動條 (ATB)
            ctx.target.wait = Math.max(0, ctx.target.wait - 20);
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 20);
            
            let zen = ctx.attacker.aura['禪定'] || 0;
            if (zen > 0) {
                let heal = Math.floor(ctx.attacker.maxHp * 0.03 * zen);
                ctx.attacker.hp = Math.min(ctx.attacker.maxHp, ctx.attacker.hp + heal);
                ctx.log(`🌸 拈花一笑，從敵方攻勢中汲取了 ${heal} 點氣血！`, "story-msg");
            }
        }
    },

    'n_dharma_shield': {
        name: "大悲金剛罩", type: "qi", power: 0, comboCost: 50, 
        tags: ["念", "運氣", "空", "Aura"], vfx: "dragon_strike",
        msg: "消耗 1 層【禪定】，獲得 2 層【化勁】(挨打免傷、吸血並反彈)。", 
        onCast: (ctx) => {
            if (ctx.attacker.aura && ctx.attacker.aura['禪定'] > 0) {
                ctx.attacker.aura['禪定']--;
                ctx.addAura(ctx.attacker, '化勁', 2);
                ctx.log("🛡️ 凝結禪意，化為堅不可摧的金剛罩！", "sys-msg");
            } else {
                ctx.log("⚠️ 境界不足，無法施展大悲金剛罩！", "warn-msg");
            }
        }
    },

    'n_dharma_wrath': {
        name: "明王怒目", type: "qi", power: 0, comboCost: 40, 
        tags: ["念", "運氣", "狂", "Aura"], vfx: "fire_blast",
        msg: "清空【禪定】與【化勁】，等比轉化為【怒意】(攻擊附帶損血真傷)。", 
        onCast: (ctx) => {
            let zen = ctx.attacker.aura['禪定'] || 0;
            let hua = ctx.attacker.aura['化勁'] || 0;
            let total = zen + hua;
            
            ctx.attacker.aura['禪定'] = 0;
            ctx.attacker.aura['化勁'] = 0;
            
            if (total > 0) {
                ctx.addAura(ctx.attacker, '怒意', total);
                ctx.log(`🔥 慈悲盡散，殺意已決！將 ${total} 層境界化為純粹的怒火！`, "warn-msg");
            } else {
                ctx.log("⚠️ 毫無境界積累，無法引動明王之怒！", "warn-msg");
            }
        }
    },

    'n_dharma_ult': {
        name: "大日如來·萬佛朝宗", type: "qi", power: 80, comboCost: 100, 
        tags: ["念", "運氣", "佛光", "超渡", "掌"], vfx: "strike",
        msg: "釋放畢生修為！根據【禪定】或【怒意】觸發不同的毀滅性連鎖！", 
        onCast: (ctx) => {
            // 暫存當前的境界層數供 db_reactions.js 讀取
            ctx.attacker.tempZen = ctx.attacker.aura['禪定'] || 0;
            ctx.attacker.tempWrath = ctx.attacker.aura['怒意'] || 0;
            
            // 清空境界
            ctx.attacker.aura['禪定'] = 0;
            ctx.attacker.aura['怒意'] = 0;
            
            ctx.log("📿 「南無阿彌陀佛...」", "warn-msg");
        }
    },

// ==========================================
    // 🎶 【音】系：逍遙幻音訣 (極致連段、指數爆發流)
    // ==========================================

    'y_sound_dodge': {
        name: "凌波微步", type: "qi", power: 0, comboCost: 25, 
        tags: ["音", "共鳴", "幻", "Aura"], vfx: "taiji_circle",
        msg: "身形化為幻影。獲得【霓裳】(絕對閃避並反加餘音，最多2層)。", 
        onCast: (ctx) => {
            // 嚴格限制霓裳最高只能有 2 層
            let current = ctx.attacker.aura['霓裳'] || 0;
            if (current < 2) {
                let addAmount = Math.min(2 - current, 2); // 計算實際能增加的層數
                ctx.attacker.aura['霓裳'] = current + addAmount;
                ctx.log(`💨 身法如鬼魅，獲得了 ${addAmount} 層【霓裳】殘影！`, "story-msg");
            } else {
                ctx.log(`💨 身法已達極致，無法產生更多【霓裳】殘影！`, "sys-msg");
            }
            // 幻音流特色：大幅推進自身行動條 (ATB)，為連段爭取時間
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 30);
        }
    },

    'y_sound_strike': {
        name: "陽春白雪", type: "phys", power: 15, comboCost: 30, hits: 4,
        tags: ["音", "共鳴", "歌", "銳", "劍"], vfx: "sword_rain",
        msg: "極速四連刺。每一擊有 50% 機率為目標疊加 1 層【餘音】。", 
        onHit: (ctx) => {
            if (Math.random() < 0.5) {
                ctx.addTag(ctx.target, '餘音', 1);
                ctx.log(`🎵 劍鳴入耳，敵方被植入 1 層【餘音】！`, "sys-msg");
            }
        }
    },

    'y_sound_control': {
        name: "碧海潮生曲", type: "qi", power: 10, comboCost: 45, 
        tags: ["音", "共鳴", "迷亂"], vfx: "poison_cloud",
        msg: "魔音穿腦。大幅打退敵方行動條，並賦予【迷亂】狀態。", 
        onHit: (ctx) => {
            // 扣減敵方行動條，確保連段安全
            ctx.target.wait = Math.max(0, ctx.target.wait - 40);
            ctx.addAura(ctx.target, '迷亂', 2);
            ctx.log(`🌀 碧海潮生，魔音嚴重干擾了敵方心智！`, "warn-msg");
        }
    },

    'y_sound_counter': {
        name: "十面埋伏", type: "qi", power: 0, comboCost: 40, 
        tags: ["音", "共鳴", "曲", "Aura"], vfx: "wind_sword",
        msg: "肅殺之音。獲得【弦殺】(下次攻擊附加3層餘音並回氣)。", 
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '弦殺', 1);
            ctx.log(`🪕 琴音轉為肅殺，四面楚歌！`, "warn-msg");
        }
    },

    'y_sound_ult': {
        name: "廣陵絕響", type: "qi", power: 50, comboCost: 80, 
        tags: ["音", "共鳴", "曲", "共振"], vfx: "dragon_strike", hits: 1,
        msg: "曲終收撥！引爆目標所有【餘音】，造成指數型毀滅爆發！", 
        onCast: (ctx) => {
            // 僅作演出提示，實際爆發邏輯寫在 db_reactions.js
            let echoes = ctx.target.tags && ctx.target.tags['餘音'] ? ctx.target.tags['餘音'] : 0;
            ctx.log(`🎶 「四弦一聲如裂帛！」準備引爆 ${echoes} 層餘音！`, "warn-msg");
        }
    },
// ==========================================
    // ♟️ 【策】系：鬼谷縱橫術 (控場、ATB操弄、絕對斬殺)
    // ==========================================

    'c_guigu_ask': {
        name: "投石問路", type: "qi", power: 10, comboCost: 20, 
        tags: ["策", "謀定", "籌"], vfx: "taiji_circle",
        msg: "拋出銅錢卜卦。威力微弱，但能看穿戰局，必定獲得 1 層【卦象】。", 
        onHit: (ctx) => {
            ctx.addAura(ctx.attacker, '卦象', 1);
            ctx.log(`🔮 卦象顯現，少俠已暗中完成佈局。`, "story-msg");
        }
    },

    'c_guigu_needle': {
        name: "截脈神針", type: "phys", power: 20, comboCost: 30, 
        tags: ["策", "謀定", "謀", "銳", "針"], vfx: "needle_rain",
        msg: "射出暗器封鎖穴道，附加 1 層【死穴】。若有【卦象】則消耗並額外附加 1 層。", 
        onHit: (ctx) => {
            let stacksToAdd = 1;
            // 檢查並消耗卦象來強化
            if (ctx.attacker.aura && ctx.attacker.aura['卦象'] > 0) {
                ctx.attacker.aura['卦象']--;
                stacksToAdd++;
                ctx.log(`🎯 卦象指引，精準命中！額外暴露了 1 處死穴！`, "story-msg");
            }
            
            ctx.addTag(ctx.target, '死穴', stacksToAdd);
            
            // 【重要】防呆機制：嚴格限制死穴最高 17 層
            if (ctx.target.tags['死穴'] > 17) {
                ctx.target.tags['死穴'] = 17;
                ctx.log(`⚠️ 敵方命門大開，死穴已達極限 (17層)！滿血亦可斬殺！`, "warn-msg");
            }
        }
    },

    'c_guigu_steal': {
        name: "偷天換日", type: "qi", power: 0, comboCost: 45, 
        tags: ["策", "謀定", "謀", "牽引"], vfx: "poison_cloud",
        msg: "鬼谷秘術。不造成傷害，但強行奪取敵方最高 40% 的行動條 (ATB)。", 
        onCast: (ctx) => {
            let stealAmount = 40;
            // 確保不會扣到負數
            let actualSteal = Math.min(stealAmount, ctx.target.wait); 
            ctx.target.wait -= actualSteal;
            
            // 將偷來的行動條加給自己
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + actualSteal);
            ctx.log(`⏳ 【偷天換日】乾坤顛倒！少俠強行奪取了敵方 ${actualSteal.toFixed(0)}% 的時間！`, "warn-msg");
        }
    },

    'c_guigu_bluff': {
        name: "空城計", type: "qi", power: 0, comboCost: 35, 
        tags: ["策", "謀定", "籌", "Aura"], vfx: "wind_sword",
        msg: "故弄玄虛。獲得【空城】(閃避下次攻擊，並讓敵方倒退行動條、增加 1 層死穴)。", 
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '空城', 1);
            ctx.log(`🪕 少俠收招佇立，門戶大開，卻散發著深不可測的氣場...`, "sys-msg");
        }
    },

    'c_guigu_ult': {
        name: "一子解雙徵", type: "phys", power: 50, comboCost: 80, 
        tags: ["策", "謀定", "謀", "識破", "劍"], vfx: "dragon_strike", hits: 1,
        msg: "終局收官！根據【死穴】層數判定斬殺線，低於該血量直接秒殺！", 
        onCast: (ctx) => {
            ctx.log(`♟️ 「將軍。你的死期，我早已算盡。」`, "warn-msg");
        }
    },

    // ==========================================
    // 敵方專屬武學區塊 (Enemy/Boss Specific Skills)
    // 嚴格對齊 Boss 流派特性，修補標籤漏洞
    // ==========================================

    // --- 泛用小怪技能 ---
    's_enemy_blunt': { name: "碎岩棒法", type: "phys", power: 40, comboCost: 30, tags: ["勢", "發勁", "鈍", "棍"], vfx: "strike", msg: "沉重的一擊，專破堅冰！" },
    's_enemy_fire': { name: "烈焰掌", type: "qi", power: 50, comboCost: 35, tags: ["道", "激發", "術", "炎", "掌"], vfx: "fireball", msg: "掌風熾熱，能引發灼燒與殉爆！" },
    's_enemy_wind': { name: "狂風掃落葉", type: "qi", power: 30, comboCost: 20, tags: ["道", "激發", "術", "風"], vfx: "slash", msg: "狂風呼嘯，若遇火勢將引發【風火燎原】！" },
    's_enemy_ice': { name: "玄冰刺", type: "qi", power: 45, comboCost: 25, tags: ["道", "激發", "術", "寒", "銳", "劍"], vfx: "sword_rain", msg: "尖銳的冰柱，寒氣逼人！" },
    's_enemy_pull': { name: "擒龍控鶴", type: "qi", power: 10, comboCost: 15, tags: ["念", "運氣", "空", "牽引", "掌"], vfx: "strike", msg: "強大的吸力，能引動周遭暗器！" },
    's_enemy_slash': { name: "狂劈", type: "phys", power: 40, comboCost: 50, tags: ["勢", "發勁", "鈍", "劍"], vfx: "heavy_slash", msg: "瘋狂劈砍", hits: 1 },

    // 🔮 【策】系 Boss：天機居士·莫測
    "e_ce_ask": { 
        name: "起卦·問路", tags: ["策", "謀定", "籌", "佈局"], type: "qi", power: 30, comboCost: 20, vfx: "taiji_circle", 
        msg: "拋出銅錢卜卦，暗中佈下陣局。", 
        onHit: (ctx) => ctx.addAura(ctx.attacker, '卦象', 1) 
    },
    "e_ce_point": { 
        name: "點穴·截脈", tags: ["策", "謀定", "謀", "銳", "針"], type: "phys", power: 50, comboCost: 30, vfx: "wind_sword", 
        msg: "快如閃電的點穴，尋找死穴破綻。", 
        onHit: (ctx) => {
            ctx.addTag(ctx.target, '死穴', 1);
            ctx.log(`🎯 你的破綻被看穿了！(死穴 +1)`, 'warn-msg');
        } 
    },
    "e_ce_chain": { 
        name: "連環·抽絲", tags: ["策", "謀定", "謀", "柔"], type: "phys", power: 20, comboCost: 40, vfx: "needle_rain", hits: 3, 
        msg: "手中的絲線連續抽打，擾亂心神。", 
        onHit: (ctx) => { 
            if(Math.random() < 0.4) {
                ctx.addTag(ctx.target, '死穴', 1); 
                ctx.log(`🎯 防不勝防！(死穴 +1)`, 'warn-msg');
            }
        } 
    },
    "e_ce_delay": { 
        name: "偷梁換柱", tags: ["策", "謀定", "謀"], type: "qi", power: 10, comboCost: 50, vfx: "poison_cloud", 
        msg: "身法變幻莫測，大幅干擾你的攻勢。", 
        onHit: (ctx) => { 
            ctx.target.wait = Math.max(0, ctx.target.wait - 35); 
            ctx.log("🌀 幻象干擾，少俠的行動條倒退了！", "warn-msg"); 
            ctx.addAura(ctx.attacker, '卦象', 1); 
        } 
    },
    "e_ce_finish": { 
        name: "天命·無常", tags: ["策", "謀定", "謀", "識破", "銳", "劍"], type: "qi", power: 120, comboCost: 80, vfx: "dragon_strike", 
        msg: "折扇化為利刃，直指必定死亡的命門！" 
    },

    // 🎶 【音】系 中階敵人：絕代名伶·幽蘭
    "e_yl_tune": { 
        name: "【調音】轉軸撥弦三兩聲", tags: ["音", "共鳴", "曲"], type: "qi", power: 10, comboCost: 15, vfx: "taiji_circle", 
        msg: "未成曲調先有情。指尖輕撥，音波已然入耳。", 
        onHit: (ctx) => {
            ctx.addTag(ctx.target, '餘音', 1);
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 20); 
        } 
    },
    "e_yl_hide": { 
        name: "【起手】猶抱琵琶半遮面", tags: ["音", "共鳴", "幻"], type: "qi", power: 0, comboCost: 20, vfx: "wind_sword", 
        msg: "千呼萬喚始出來。幽蘭蓮步輕移，身形化為幻影。", 
        onHit: (ctx) => { 
            let current = ctx.attacker.aura['霓裳'] || 0;
            if (current < 2) {
                let addAmount = Math.min(2 - current, 2);
                ctx.attacker.aura['霓裳'] = current + addAmount;
            } else {
                ctx.log(`💨 幽蘭身法已達極致，無法產生更多【霓裳】殘影！`, "sys-msg");
            }
        } 
    },
    "e_yl_heavy": { 
        name: "【急雨】大弦嘈嘈如急雨", tags: ["音", "共鳴", "曲", "鈍"], type: "qi", power: 60, comboCost: 30, vfx: "heavy_slash", hits: 1,
        msg: "沉重的低音宛如悶雷，震盪少俠的五臟六腑！" 
    },
    "e_yl_light": { 
        name: "【私語】小弦切切如私語", tags: ["音", "共鳴", "曲", "銳"], type: "qi", power: 25, comboCost: 30, vfx: "needle_rain", hits: 2,
        msg: "尖銳的高音宛如利刃，切割著周遭的空氣。", 
        onHit: (ctx) => ctx.addTag(ctx.target, '餘音', 1) 
    },
    "e_yl_pearls": { 
        name: "【交錯】大珠小珠落玉盤", tags: ["音", "共鳴", "曲"], type: "qi", power: 15, comboCost: 40, vfx: "sword_rain", hits: 4,
        msg: "嘈嘈切切錯雜彈！密集的音波如暴雨般傾瀉而下！", 
        onHit: (ctx) => { if(Math.random() < 0.5) ctx.addTag(ctx.target, '餘音', 1); } 
    },
    "e_yl_silence": { 
        name: "【幽恨】此時無聲勝有聲", tags: ["音", "共鳴", "迷亂"], type: "qi", power: 0, comboCost: 50, vfx: "poison_cloud", 
        msg: "冰泉冷澀弦凝絕。曲聲驟停，令人感到窒息的壓抑感...", 
        onHit: (ctx) => {
            ctx.target.wait = 0; 
            ctx.log("🎵 萬籟俱寂，少俠的動作完全停滯了！", "warn-msg");
        } 
    },
    "e_yl_burst": { 
        name: "【破陣】銀瓶乍破水漿迸", tags: ["音", "共鳴", "歌", "共振"], type: "qi", power: 50, comboCost: 60, vfx: "fire_blast", hits: 3,
        msg: "鐵騎突出碎紅纓！殺伐之音如同千軍萬馬奔騰而出！" 
    },
    "e_yl_finish": { 
        name: "【裂帛】四弦一聲如裂帛", tags: ["音", "共鳴", "歌", "共振"], type: "qi", power: 150, comboCost: 80, vfx: "dragon_strike", hits: 1,
        msg: "曲終收撥當心畫！幽蘭劃破琴弦，發出淒厲的致命音爆！" 
    },

    // ⚙️ 【道】系 首領：蜀中詭客·唐翎
    "e_tl_reload": { 
        name: "機關·森羅萬象", tags: ["道", "激發", "機"], type: "qi", power: 0, comboCost: 30, vfx: "taiji_circle", 
        msg: "令人牙酸的機括聲響起，千機匣再次裝填完畢！", 
        onHit: (ctx) => {
            ctx.attacker.aura = ctx.attacker.aura || {};
            ctx.attacker.aura['千機匣'] = 15; 
        } 
    },
    "e_tl_poison": { 
        name: "化學·幽藍毒霧", tags: ["道", "激發", "術"], type: "qi", power: 5, comboCost: 30, vfx: "poison_cloud", 
        msg: "袖口噴出幽藍色的粉末，沾染在你的護甲上發出危險的滋滋聲。", 
        onHit: (ctx) => ctx.addTag(ctx.target, '破甲毒', 1) 
    },
    "e_tl_gatling": { 
        name: "暗器·追星趕月", tags: ["道", "激發", "機", "銳", "連動", "針"], type: "phys", power: 10, comboCost: 40, vfx: "needle_rain", hits: 3, 
        msg: "唐翎雙手化為殘影，無數閃爍著寒芒的暗器向你射來！" 
    },
    "e_tl_execute": { 
        name: "絕殺·閻王三點手", tags: ["道", "激發", "機", "銳", "催化", "針"], type: "phys", power: 30, comboCost: 60, vfx: "wind_sword", hits: 1, 
        msg: "唐翎如鬼魅般欺身向前，指尖夾著漆黑的毒針，直刺死穴！" 
    },

    // ⚡ 【念】系 中階敵人：狂海霸拳·武男
    "e_wu_push": { 
        name: "【元磁轉動】", tags: ["念", "運氣", "狂"], type: "qi", power: 0, comboCost: 20, vfx: "taiji_circle", 
        msg: "武男瘋狂催動心臟，體內的元磁真氣發出震耳欲聾的轟鳴！", 
        onHit: (ctx) => {
            let current = ctx.attacker.aura['重天'] || 0;
            if (current < 5) ctx.addAura(ctx.attacker, '重天', 1);
            else ctx.log("⚡ 武男的力量已經達到頂峰！", "warn-msg");
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 30); 
        } 
    },
    "e_wu_shark": { 
        name: "【狂鯊撕裂】", tags: ["念", "運氣", "狂", "銳", "掌"], type: "phys", power: 20, comboCost: 40, vfx: "wind_sword", hits: 3,
        msg: "掌刀如狂鯊的利齒般瘋狂撕咬，斬出無數殘影！" 
    },
    "e_wu_whale": { 
        name: "【殺鯨霸拳】", tags: ["念", "運氣", "狂", "鈍", "拳"], type: "phys", power: 80, comboCost: 50, vfx: "heavy_slash", hits: 1, poiseDmg: 80,
        msg: "如同巨鯨擺尾般的狂暴重拳，誓要將你的骨頭一起踢碎！" 
    },
    "e_wu_sword": { 
        name: "【地獄之劍】", tags: ["念", "運氣", "狂", "銳", "劍"], type: "qi", power: 120, comboCost: 60, vfx: "sword_rain", hits: 1,
        msg: "武男並指成劍，高度壓縮的元磁真氣化為熾熱利刃！" 
    },
    "e_wu_heal": { 
        name: "【細胞重組】", tags: ["念", "運氣", "化"], type: "qi", power: 0, comboCost: 40, vfx: "taiji_circle", 
        msg: "「這種程度的傷，我的細胞瞬間就能重組啊！」",
        onHit: (ctx) => {
            let stacks = ctx.attacker.aura['重天'] || 0;
            let heal = Math.floor(ctx.attacker.maxHp * 0.05 * stacks);
            if (heal > 0) {
                ctx.attacker.hp = Math.min(ctx.attacker.maxHp, ctx.attacker.hp + heal);
                ctx.log(`🩸 肌肉飛速癒合，武男恢復了 ${heal} 點氣血！`, "story-msg");
            } else {
                ctx.log("境界不足，細胞重組效果微弱。", "sys-msg");
            }
        }
    },
    "e_wu_roar": { 
        name: "【霸王戰吼】", tags: ["念", "運氣", "狂", "音", "歌"], type: "qi", power: 0, comboCost: 50, vfx: "strike", 
        msg: "武男發出狂妄的咆哮：「給我跪下！！」",
        onHit: (ctx) => {
            ctx.target.wait = Math.max(0, ctx.target.wait - 30);
            ctx.log("📢 強大的磁場音波震得少俠氣血翻湧，行動倒退！", "warn-msg");
        }
    },
    "e_wu_ult": { 
        name: "【五十萬匹·海嘯爆破拳】", tags: ["念", "運氣", "狂", "心震", "重天"], type: "qi", power: 200, comboCost: 100, vfx: "dragon_strike", hits: 1,
        msg: "「感受這五十萬匹的磁場轉動吧！給我碎！！」" 
    },

    // ==========================================
    // 翩若 - 洛神絕劍 (架勢切換機制，comboCost 不可更改以相容 AI)
    // ==========================================
    'e_pr_def_step': {
        name: '游雲步', type: 'phys', comboCost: 20, power: 0, 
        tags: ["勢", "發勁"], vfx: 'pr_bagua',
        desc: "【洛神劍法】步伐輕靈如游雲。施展後獲得「游雲」狀態，疊滿可轉換架勢並獲得「蔽月」反擊。",
        onCast: (ctx) => {
            ctx.log("翩若步法輕靈，身形如游雲般難以捉摸。");
            ctx.addAura(ctx.attacker, '游雲', 1);
            if (ctx.attacker.aura['游雲'] >= 3) {
                ctx.attacker.aura['游雲'] = 0;
                ctx.addAura(ctx.attacker, '蔽月', 2);
                ctx.attacker.stanceType = 'off';
                ctx.attacker.stanceLevel = Math.min(4, (ctx.attacker.stanceLevel || 0) + 1);
                ctx.log(`【架勢切換】翩若轉守為攻！目前境界：${ctx.attacker.stanceLevel}/4`, "warn-msg");
            }
        }
    },
    'e_pr_def_wind': {
        name: '驚鴻劍圍', type: 'phys', comboCost: 25, power: 30, hits: 2, 
        tags: ["勢", "發勁", "銳", "劍"], vfx: 'pr_bagua',
        desc: "【洛神劍法】以劍氣護體並進行二段反擊。施展後獲得「游雲」狀態。",
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '游雲', 1);
            if (ctx.attacker.aura['游雲'] >= 3) {
                ctx.attacker.aura['游雲'] = 0;
                ctx.addAura(ctx.attacker, '蔽月', 2);
                ctx.attacker.stanceType = 'off';
                ctx.attacker.stanceLevel = Math.min(4, (ctx.attacker.stanceLevel || 0) + 1);
                ctx.log(`【架勢切換】翩若轉守為攻！目前境界：${ctx.attacker.stanceLevel}/4`, "warn-msg");
            }
        }
    },
    'e_pr_off_light': {
        name: '流風回雪', type: 'phys', comboCost: 25, power: 80, 
        tags: ["勢", "發勁", "銳", "劍"], vfx: 'pr_sword_dance',
        desc: "【洛神劍法】劍勢如流風回雪，銳不可當。施展後獲得「驚鴻」狀態，疊滿可轉換架勢並獲得「芙蕖」破甲。",
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '驚鴻', 1);
            if (ctx.attacker.aura['驚鴻'] >= 3) {
                ctx.attacker.aura['驚鴻'] = 0;
                ctx.addAura(ctx.attacker, '芙蕖', 1);
                ctx.attacker.stanceType = 'def';
                ctx.attacker.stanceLevel = Math.min(4, (ctx.attacker.stanceLevel || 0) + 1);
                ctx.log(`【架勢切換】翩若收劍回防！目前境界：${ctx.attacker.stanceLevel}/4`, "warn-msg");
            }
        }
    },
    'e_pr_off_strike': {
        name: '洛神一劍', type: 'qigong', comboCost: 35, power: 120, 
        tags: ["勢", "發勁", "銳", "劍"], vfx: 'pr_sword_dance',
        desc: "【洛神劍法】凝聚內力的一擊。施展後獲得「驚鴻」狀態。",
        onCast: (ctx) => {
            ctx.addAura(ctx.attacker, '驚鴻', 1);
            if (ctx.attacker.aura['驚鴻'] >= 3) {
                ctx.attacker.aura['驚鴻'] = 0;
                ctx.addAura(ctx.attacker, '芙蕖', 1);
                ctx.attacker.stanceType = 'def';
                ctx.attacker.stanceLevel = Math.min(4, (ctx.attacker.stanceLevel || 0) + 1);
                ctx.log(`【架勢切換】翩若收劍回防！目前境界：${ctx.attacker.stanceLevel}/4`, "warn-msg");
            }
        }
    },
    'e_pr_void_slash': {
        name: '空·碎', type: 'qigong', comboCost: 8, power: 25, hits: 1, 
        tags: ["念", "運氣", "空", "銳", "劍"], vfx: 'pr_void_shatter',
        desc: "【空之境界】耗損極低的狂暴連斬。無視物理常規，撕裂空間。",
        onCast: (ctx) => {}
    },
    'e_pr_void_break': {
        name: '空·裂', type: 'qigong', comboCost: 15, power: 45, hits: 2, 
        tags: ["念", "運氣", "空", "破勢", "銳", "劍"], vfx: 'pr_void_shatter',
        desc: "【空之境界】伴隨空間碎裂的二連擊。",
        onCast: (ctx) => {}
    },
    'e_pr_void_death': {
        name: '空之境界·直死', type: 'qigong', comboCost: 80, power: 250, 
        tags: ["念", "運氣", "空", "直死", "銳", "劍"], vfx: 'pr_death_line',
        desc: "【空之境界】看破萬物死線的終極一擊，威力絕倫。",
        onCast: (ctx) => {
            ctx.log("「看見了……你的死線！」", "warn-msg");
        }
    }
};