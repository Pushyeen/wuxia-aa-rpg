// js/data/db_skills.js

export const DB_SKILLS = {

    // 【新增】：傳說中的野球拳
    's_yq_punch': {
        name: "野球拳", type: "phys", power: 25, comboCost: 20, tags: ["鈍"], vfx: "strike",
        msg: "無招勝有招，看似瞎比劃實則威力無窮！",
        hits: 1
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

    "s_enemy_slash": { name: "狂劈", tags: ["鈍"], type: "phys", power: 40, comboCost: 50, vfx: "heavy_slash", msg: "瘋狂劈砍", hits: 1 }
};