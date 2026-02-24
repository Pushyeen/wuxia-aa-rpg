// js/data/db_skills.js
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

    // 【新增】：傳說中的野球拳
    's_yq_punch': {
        name: "野球拳", type: "phys", power: 25, comboCost: 20, tags: ["鈍"], vfx: "strike",
        msg: "無招勝有招，看似瞎比劃實則威力無窮！",
        hits: 1
    },
    // --- 敵方專屬武學 ---
    's_enemy_blunt': {
        name: "碎岩棒法", type: "phys", power: 40, comboCost: 30, tags: ["鈍"], vfx: "strike",
        msg: "沉重的一擊，專破堅冰！"
    },
    's_enemy_fire': {
        name: "烈焰掌", type: "qi", power: 50, comboCost: 35, tags: ["炎"], vfx: "fireball",
        msg: "掌風熾熱，能引發灼燒與殉爆！"
    },
    's_enemy_wind': {
        name: "狂風掃落葉", type: "qi", power: 30, comboCost: 20, tags: ["風"], vfx: "slash",
        msg: "狂風呼嘯，若遇火勢將引發【風火燎原】！"
    },
    's_enemy_ice': {
        name: "玄冰刺", type: "qi", power: 45, comboCost: 25, tags: ["寒", "銳"], vfx: "sword_rain",
        msg: "尖銳的冰柱，寒氣逼人！"
    },
    's_enemy_pull': {
        name: "擒龍控鶴", type: "qi", power: 10, comboCost: 15, tags: ["牽引"], vfx: "strike",
        msg: "強大的吸力，能引動周遭暗器！"
    },
    // ❄️ 凜冬霸劍流
    "ice_1": { name: "寒霜劍氣", tags: ["寒", "銳"], type: "qi", power: 60, comboCost: 45, vfx: "wind_sword", msg: "賦予 1 層寒氣。", onHit: (ctx) => ctx.addTag(ctx.target, 'ice', 1) },
    "ice_2": { name: "傲雪凌霜", tags: ["Aura"], type: "qi", power: 0, comboCost: 50, vfx: "ice_shatter", msg: "獲得冰盾(受擊反傷寒氣)。", onHit: (ctx) => ctx.addAura(ctx.attacker, '冰盾', 2) },
    "ice_3": { name: "風雪交加", tags: ["風", "寒"], type: "qi", power: 40, comboCost: 60, vfx: "ice_shatter", msg: "賦予 2 層寒氣。", onHit: (ctx) => ctx.addTag(ctx.target, 'ice', 2) },
    "ice_4": { name: "泰山壓頂", tags: ["鈍"], type: "phys", power: 150, comboCost: 100, vfx: "heavy_slash", msg: "重擊破壞架勢。", poiseDmg: 50 },
    "ice_5": { name: "千鈞一髮", tags: ["Aura", "鈍"], type: "phys", power: 0, comboCost: 40, vfx: "fist_strike", msg: "格擋反擊姿態。", onHit: (ctx) => ctx.addAura(ctx.attacker, '格擋', 1) },
    "ice_6": { name: "破冰拔刀斬", tags: ["銳", "鈍"], type: "phys", power: 200, comboCost: 150, vfx: "heavy_slash", msg: "完美觸發碎冰。", poiseDmg: 80 },

    // 🔥 焚天御風流
    "fire_1": { name: "烈焰掌", tags: ["炎", "柔"], type: "qi", power: 70, comboCost: 40, vfx: "fist_strike", msg: "賦予 1 層炎勁。", onHit: (ctx) => ctx.addTag(ctx.target, 'fire', 1) },
    "fire_2": { name: "星火燎原", tags: ["佈置"], type: "qi", power: 10, comboCost: 30, vfx: "fire_blast", msg: "場上留 3 團火種。", onHit: (ctx) => ctx.addEnv('fire', 3) },
    "fire_3": { name: "逍遙步", tags: ["Aura"], type: "qi", power: 0, comboCost: 50, vfx: "wind_sword", msg: "2 次絕對閃避。", onHit: (ctx) => ctx.addAura(ctx.attacker, '疾風', 2) },
    "fire_4": { name: "流風扇", tags: ["風", "銳"], type: "qi", power: 50, comboCost: 35, vfx: "wind_sword", msg: "揮出凌厲風刃。" },
    "fire_5": { name: "煽風點火", tags: ["風", "牽引"], type: "qi", power: 30, comboCost: 60, vfx: "dragon_strike", msg: "吸附火種至敵身。", onHit: (ctx) => { if(ctx.env.fire>0) { ctx.addTag(ctx.target,'fire',ctx.env.fire); ctx.env.fire=0; } } },
    "fire_6": { name: "焚天陣", tags: ["風", "炎"], type: "qi", power: 100, comboCost: 120, vfx: "fire_blast", msg: "引爆火種連鎖反應。" },

    // 🕸️ 幽影千絲流
    "silk_1": { name: "吐絲訣", tags: ["柔", "絲線"], type: "qi", power: 30, comboCost: 20, vfx: "poison_cloud", msg: "無聲賦予 1 層絲線。", onHit: (ctx) => ctx.addTag(ctx.target, 'silk', 1) },
    "silk_2": { name: "穿心飛鏢", tags: ["銳", "佈置"], type: "phys", power: 50, comboCost: 30, vfx: "needle_rain", msg: "留下 1 根暗器。", onHit: (ctx) => ctx.addEnv('needles', 1) },
    "silk_3": { name: "盤絲舞", tags: ["Aura"], type: "qi", power: 0, comboCost: 60, vfx: "taiji_circle", msg: "近戰反傷絲線。", onHit: (ctx) => ctx.addAura(ctx.attacker, '絲陣', 3) },
    "silk_4": { name: "暴雨梨花", tags: ["銳", "佈置"], type: "phys", power: 30, comboCost: 60, vfx: "needle_rain", msg: "多段連擊留暗器。", hits: 3, onHit: (ctx) => ctx.addEnv('needles', 1) },
    "silk_5": { name: "擒龍控鶴", tags: ["牽引", "柔"], type: "qi", power: 20, comboCost: 50, vfx: "taiji_circle", msg: "萬物歸宗引爆暗器。" },
    "silk_6": { name: "天衣無縫", tags: ["柔", "絲線"], type: "qi", power: 80, comboCost: 100, vfx: "poison_cloud", msg: "強加 3 層絲線。", onHit: (ctx) => ctx.addTag(ctx.target, 'silk', 3) },

    // ☯️ 兩儀太極流
    "taiji_1": { name: "太極起手式", tags: ["柔", "Aura"], type: "qi", power: 0, comboCost: 40, vfx: "taiji_circle", msg: "獲 1 層太極氣旋。", onHit: (ctx) => ctx.addAura(ctx.attacker, '氣旋', 1) },
    "taiji_2": { name: "雲手", tags: ["柔", "牽引"], type: "phys", power: 40, comboCost: 45, vfx: "fist_strike", msg: "降低敵方架勢。", poiseDmg: 30 },
    "taiji_3": { name: "畫地為牢", tags: ["佈置", "柔"], type: "qi", power: 10, comboCost: 50, vfx: "taiji_circle", msg: "佈置太極陣地。", onHit: (ctx) => ctx.addEnv('taichi', 1) },
    "taiji_4": { name: "野馬分鬃", tags: ["鈍", "柔"], type: "phys", power: 90, comboCost: 70, vfx: "heavy_slash", msg: "剛柔並濟重擊。" },
    "taiji_5": { name: "借力打力", tags: ["Aura"], type: "qi", power: 0, comboCost: 80, vfx: "taiji_circle", msg: "絕對反擊姿態。", onHit: (ctx) => ctx.addAura(ctx.attacker, '反擊', 2) },
    "taiji_6": { name: "萬法歸一", tags: ["柔"], type: "qi", power: 50, comboCost: 120, vfx: "sword_rain", msg: "氣旋化劍射出。", hits: 1, onHit: (ctx) => { 
        let cnt = ctx.attacker.aura['氣旋'] || 0; 
        if(cnt>0) { ctx.target.hp -= cnt*100; ctx.attacker.aura['氣旋']=0; ctx.log(`☯ 氣旋化為 ${cnt} 道劍氣貫穿敵人！`,'story-msg'); }
    }},

    // ⚙️ 天工墨甲流
    "mech_1": { name: "撒菱", tags: ["佈置"], type: "phys", power: 20, comboCost: 30, vfx: "needle_rain", msg: "留下 2 個齒輪。", onHit: (ctx) => ctx.addEnv('gears', 2) },
    "mech_2": { name: "組裝：連弩塔", tags: ["佈置"], type: "phys", power: 0, comboCost: 60, vfx: "fist_strike", msg: "消耗齒輪建塔。", onHit: (ctx) => { if(ctx.env.gears>=2){ ctx.env.gears-=2; ctx.addEnv('turret', 1); ctx.log("🏗️ 連弩塔組裝完成！", "story-msg");} } },
    "mech_3": { name: "飛輪刃", tags: ["銳", "風"], type: "phys", power: 80, comboCost: 55, vfx: "wind_sword", msg: "迴旋齒輪切割。" },
    "mech_4": { name: "霹靂雷", tags: ["炎", "鈍"], type: "phys", power: 120, comboCost: 90, vfx: "fire_blast", msg: "引發機關殉爆。" },
    "mech_5": { name: "磁石牽引", tags: ["牽引"], type: "qi", power: 30, comboCost: 45, vfx: "taiji_circle", msg: "迫敵踩踏機關。" },
    "mech_6": { name: "神工木甲", tags: ["Aura"], type: "qi", power: 0, comboCost: 150, vfx: "dragon_strike", msg: "召喚護體巨木人。", onHit: (ctx) => ctx.attacker.aura['木甲'] = 1000 },

    "s_enemy_slash": { name: "狂劈", tags: ["鈍"], type: "phys", power: 40, comboCost: 50, vfx: "heavy_slash", msg: "瘋狂劈砍", hits: 1 },

    // 🔮 【策】系 Boss：天機居士·莫測 專屬武學
    "e_ce_ask": { 
        name: "起卦·問路", tags: ["策", "佈局"], type: "qi", power: 30, comboCost: 20, vfx: "taiji_circle", 
        msg: "拋出銅錢卜卦，暗中佈下陣局。", 
        // 命中後為自己附加 1 層 [卦象]
        onHit: (ctx) => ctx.addAura(ctx.attacker, '卦象', 1) 
    },
    "e_ce_point": { 
        name: "點穴·截脈", tags: ["策", "銳"], type: "phys", power: 50, comboCost: 30, vfx: "wind_sword", 
        msg: "快如閃電的點穴，尋找死穴破綻。", 
        // 必定在玩家身上附加 1 層 [死穴]
        onHit: (ctx) => {
            ctx.addTag(ctx.target, '死穴', 1);
            ctx.log(`🎯 你的破綻被看穿了！(死穴 +1)`, 'warn-msg');
        } 
    },
    "e_ce_chain": { 
        name: "連環·抽絲", tags: ["策", "柔"], type: "phys", power: 20, comboCost: 40, vfx: "needle_rain", hits: 3, 
        msg: "手中的絲線連續抽打，擾亂心神。", 
        // 3段攻擊，每次都有 40% 機率附加 [死穴]
        onHit: (ctx) => { 
            if(Math.random() < 0.4) {
                ctx.addTag(ctx.target, '死穴', 1); 
                ctx.log(`🎯 防不勝防！(死穴 +1)`, 'warn-msg');
            }
        } 
    },
    "e_ce_delay": { 
        name: "偷梁換柱", tags: ["策", "謀"], type: "qi", power: 10, comboCost: 50, vfx: "poison_cloud", 
        msg: "身法變幻莫測，大幅干擾你的攻勢。", 
        onHit: (ctx) => { 
            ctx.target.wait = Math.max(0, ctx.target.wait - 35); 
            ctx.log("🌀 幻象干擾，少俠的行動條倒退了！", "warn-msg"); 
            ctx.addAura(ctx.attacker, '卦象', 1); 
        } 
    },
    "e_ce_finish": { 
        name: "天命·無常", tags: ["策", "識破", "銳"], type: "qi", power: 120, comboCost: 80, vfx: "dragon_strike", 
        msg: "折扇化為利刃，直指必定死亡的命門！" 
    },

    // 🎶 【音】系 中階敵人：絕代名伶·幽蘭 專屬武學
    "e_yl_tune": { 
        name: "【調音】轉軸撥弦三兩聲", tags: ["音", "曲"], type: "qi", power: 10, comboCost: 15, vfx: "taiji_circle", 
        msg: "未成曲調先有情。指尖輕撥，音波已然入耳。", 
        onHit: (ctx) => {
            ctx.addTag(ctx.target, '餘音', 1);
            // 提速：為自己增加少許 ATB
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 20); 
        } 
    },
    "e_yl_hide": { 
        name: "【起手】猶抱琵琶半遮面", tags: ["音", "幻"], type: "qi", power: 0, comboCost: 20, vfx: "wind_sword", 
        msg: "千呼萬喚始出來。幽蘭蓮步輕移，身形化為幻影。", 
        onHit: (ctx) => {
            ctx.addAura(ctx.attacker, '霓裳', 2); // 獲得兩次絕對閃避
        } 
    },
    "e_yl_heavy": { 
        name: "【急雨】大弦嘈嘈如急雨", tags: ["音", "鈍"], type: "qi", power: 60, comboCost: 30, vfx: "heavy_slash", hits: 1,
        msg: "沉重的低音宛如悶雷，震盪少俠的五臟六腑！" 
    },
    "e_yl_light": { 
        name: "【私語】小弦切切如私語", tags: ["音", "銳"], type: "qi", power: 25, comboCost: 30, vfx: "needle_rain", hits: 2,
        msg: "尖銳的高音宛如利刃，切割著周遭的空氣。", 
        onHit: (ctx) => ctx.addTag(ctx.target, '餘音', 1) 
    },
    "e_yl_pearls": { 
        name: "【交錯】大珠小珠落玉盤", tags: ["音", "曲"], type: "qi", power: 15, comboCost: 40, vfx: "sword_rain", hits: 4,
        msg: "嘈嘈切切錯雜彈！密集的音波如暴雨般傾瀉而下！", 
        onHit: (ctx) => {
            // 每一下都有 50% 機率疊加餘音
            if(Math.random() < 0.5) ctx.addTag(ctx.target, '餘音', 1);
        } 
    },
    "e_yl_silence": { 
        name: "【幽恨】此時無聲勝有聲", tags: ["音", "迷亂"], type: "qi", power: 0, comboCost: 50, vfx: "poison_cloud", 
        msg: "冰泉冷澀弦凝絕。曲聲驟停，令人感到窒息的壓抑感...", 
        onHit: (ctx) => {
            // 強制清空玩家的 ATB，為接下來的高潮做準備
            ctx.target.wait = 0; 
            ctx.log("🎵 萬籟俱寂，少俠的動作完全停滯了！", "warn-msg");
        } 
    },
    "e_yl_burst": { 
        name: "【破陣】銀瓶乍破水漿迸", tags: ["音", "歌", "共振"], type: "qi", power: 50, comboCost: 60, vfx: "fire_blast", hits: 3,
        msg: "鐵騎突出碎紅纓！殺伐之音如同千軍萬馬奔騰而出！" 
    },
    "e_yl_finish": { 
        name: "【裂帛】四弦一聲如裂帛", tags: ["音", "歌", "共振"], type: "qi", power: 150, comboCost: 80, vfx: "dragon_strike", hits: 1,
        msg: "曲終收撥當心畫！幽蘭劃破琴弦，發出淒厲的致命音爆！" 
    },
    // ⚙️ 【道】系 首領：蜀中詭客·唐翎 專屬武學
    "e_tl_reload": { 
        name: "機關·森羅萬象", tags: ["道", "機"], type: "qi", power: 0, comboCost: 30, vfx: "taiji_circle", 
        msg: "令人牙酸的機括聲響起，千機匣再次裝填完畢！", 
        onHit: (ctx) => {
            ctx.attacker.aura = ctx.attacker.aura || {};
            ctx.attacker.aura['千機匣'] = 15; // 重新補滿 15 發彈藥
        } 
    },
    "e_tl_poison": { 
        name: "化學·幽藍毒霧", tags: ["道", "術"], type: "qi", power: 5, comboCost: 30, vfx: "poison_cloud", 
        msg: "袖口噴出幽藍色的粉末，沾染在你的護甲上發出危險的滋滋聲。", 
        onHit: (ctx) => ctx.addTag(ctx.target, '破甲毒', 1) 
    },
    "e_tl_gatling": { 
        name: "暗器·追星趕月", tags: ["道", "機", "銳", "連動"], type: "phys", power: 10, comboCost: 40, vfx: "needle_rain", hits: 3, 
        msg: "唐翎雙手化為殘影，無數閃爍著寒芒的暗器向你射來！" 
    },
    "e_tl_execute": { 
        name: "絕殺·閻王三點手", tags: ["道", "銳", "催化"], type: "phys", power: 30, comboCost: 60, vfx: "wind_sword", hits: 1, 
        msg: "唐翎如鬼魅般欺身向前，指尖夾著漆黑的毒針，直刺死穴！" 
    },
    // ⚡ 【念】系 中階敵人：狂海霸拳·武男 專屬武學
    "e_wu_push": { 
        name: "【元磁轉動】", tags: ["念", "運氣"], type: "qi", power: 0, comboCost: 20, vfx: "taiji_circle", 
        msg: "武男瘋狂催動心臟，體內的元磁真氣發出震耳欲聾的轟鳴！", 
        onHit: (ctx) => {
            let current = ctx.attacker.aura['重天'] || 0;
            if (current < 5) {
                ctx.addAura(ctx.attacker, '重天', 1);
            } else {
                ctx.log("⚡ 武男的力量已經達到頂峰！", "warn-msg");
            }
            // 提速：額外增加 30 點 ATB，讓他越轉越快
            ctx.attacker.wait = Math.min(100, ctx.attacker.wait + 30); 
        } 
    },
    // ⚡ 【念】系 中階敵人：狂海霸拳·武男 專屬武學
    "e_wu_shark": { 
        name: "【狂鯊撕裂】", tags: ["勢", "銳", "狂"], type: "phys", power: 20, comboCost: 40, vfx: "wind_sword", hits: 3,
        msg: "掌刀如狂鯊的利齒般瘋狂撕咬，斬出無數殘影！" 
    },
    "e_wu_whale": { 
        name: "【殺鯨霸拳】", tags: ["勢", "鈍", "剛"], type: "phys", power: 80, comboCost: 50, vfx: "heavy_slash", hits: 1, poiseDmg: 80,
        msg: "如同巨鯨擺尾般的狂暴重拳，誓要將你的骨頭一起踢碎！" 
    },
    "e_wu_sword": { 
        name: "【地獄之劍】", tags: ["念", "銳"], type: "qi", power: 120, comboCost: 60, vfx: "sword_rain", hits: 1,
        msg: "武男並指成劍，高度壓縮的元磁真氣化為熾熱利刃！" 
    },
    "e_wu_heal": { 
        name: "【細胞重組】", tags: ["念", "化"], type: "qi", power: 0, comboCost: 40, vfx: "taiji_circle", 
        msg: "「這種程度的傷，我的細胞瞬間就能重組啊！」",
        onHit: (ctx) => {
            let stacks = ctx.attacker.aura['重天'] || 0;
            // 根據境界回血，每層恢復 5% 最大 HP
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
        name: "【霸王戰吼】", tags: ["音", "歌", "狂"], type: "qi", power: 0, comboCost: 50, vfx: "strike", 
        msg: "武男發出狂妄的咆哮：「給我跪下！！」",
        onHit: (ctx) => {
            // 強制擊退玩家 30 點行動條
            ctx.target.wait = Math.max(0, ctx.target.wait - 30);
            ctx.log("📢 強大的磁場音波震得少俠氣血翻湧，行動倒退！", "warn-msg");
        }
    },
    "e_wu_ult": { 
        name: "【五十萬匹·海嘯爆破拳】", tags: ["念", "心震", "重天"], type: "qi", power: 200, comboCost: 100, vfx: "dragon_strike", hits: 1,
        msg: "「感受這五十萬匹的磁場轉動吧！給我碎！！」" 
    },
    // 🌸 終極首領：洛神絕劍·翩若 專屬武學
    // 第一階段 (comboCost 設為 999，確保一回合只打一招)
    "e_pr_def_step": { 
        name: "【洛水·微步】", tags: ["勢"], type: "qi", power: 10, comboCost: 999, vfx: "taiji_circle", 
        msg: "翩若輕踏罡步，身形若隱若現。", onHit: switchPianruoStance 
    },
    "e_pr_def_wind": { 
        name: "【洛水·流風】", tags: ["勢"], type: "qi", power: 0, comboCost: 999, vfx: "wind_sword", 
        msg: "劍氣如迴風般流轉，大幅打亂了你的節奏！", 
        onHit: (ctx) => { ctx.target.wait = Math.max(0, ctx.target.wait - 50); switchPianruoStance(ctx); } 
    },
    "e_pr_off_light": { 
        name: "【神光·離合】", tags: ["勢", "銳"], type: "phys", power: 40, comboCost: 999, vfx: "sword_rain", hits: 3,
        msg: "如神光乍現的連環刺擊！", onHit: switchPianruoStance 
    },
    "e_pr_off_strike": { 
        name: "【神光·飛鳧】", tags: ["勢", "銳", "鈍"], type: "phys", power: 120, comboCost: 999, vfx: "heavy_slash", hits: 1, poiseDmg: 80,
        msg: "長劍夾帶驚人的威勢當頭劈下！", onHit: switchPianruoStance 
    },

    // 第二階段 (空之境界，極限連擊)
    "e_pr_void_slash": { 
        name: "【無明·閃】", tags: ["勢", "銳", "空"], type: "phys", power: 50, comboCost: 35, vfx: "wind_sword", hits: 1,
        msg: "毫無軌跡可言的死之斬擊！" 
    },
    "e_pr_void_break": { 
        name: "【伽藍·碎】", tags: ["破勢", "空"], type: "qi", power: 60, comboCost: 45, vfx: "strike", hits: 1,
        msg: "刀刃準確地切開了防禦的接縫處！" 
    },
    "e_pr_void_death": { 
        name: "【直死·境界式】", tags: ["直死", "空"], type: "phys", power: 150, comboCost: 100, vfx: "dragon_strike", hits: 1,
        msg: "雙眸閃爍出幽藍色的光芒，劍鋒直指萬物的死線！" 
    },
};
