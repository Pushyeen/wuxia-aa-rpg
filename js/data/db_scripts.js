// js/data/db_scripts.js

export const DB_SCRIPTS = {
    // 開局創角事件
    'evt_start_game': [
        { type: "dialog", speaker: "系統", text: "江湖險惡，生死難料。<br>在踏入這片武林之前，先來看看你的資質如何吧。" },
        { type: "roll_stats" },
        { type: "dialog", speaker: "系統", text: "天命已定！按 WASD 移動。尋找地圖上的【匠】領取裝備，再挑戰【惡】、【徒】、【護】。" }
    ],

    // 鐵匠給予新手裝備、傷藥與開放商店
    'evt_npc_blacksmith': [
        { type: "dialog", speaker: "好心鐵匠", text: "少俠！前方江湖險惡，讓我來助你一臂之力吧！" },
        { type: "dialog", speaker: "好心鐵匠", text: "金創藥記得帶在身上，刀劍無眼，受傷了隨時打開【行囊】使用！" },
        { type: "dialog", speaker: "好心鐵匠", text: "這裡還有我畢生打造的兵器防具，你需要什麼儘管拿去！" },
        { type: "blacksmith_shop" }
    ],
    
    // 第一戰：惡霸
    'evt_fight_thug': [
        { type: "dialog", speaker: "街頭惡霸", text: "把身上值錢的東西交出來！大爺我手中的棒子可不長眼！" },
        { type: "combat", enemyId: "e_thug" },
        { type: "dialog", speaker: "系統", text: "惡霸落荒而逃，你感覺臂力有所增長。" },
        { type: "remove_event" }
    ],
    
    // 第二戰：教徒
    'evt_fight_cultist': [
        { type: "dialog", speaker: "烈火教徒", text: "異端！接受聖火的洗禮吧！" },
        { type: "combat", enemyId: "e_cultist" },
        { type: "dialog", speaker: "系統", text: "擊敗教徒，你在烈焰中領悟了真氣的流動。" },
        { type: "remove_event" }
    ],
    
    // 第三戰：護法 (Boss)
    'evt_fight_boss': [
        { type: "dialog", speaker: "玄冰護法", text: "哼...能走到這裡算你有些本事。但你的路，到此為止了！" },
        { type: "combat", enemyId: "e_boss_ice" },
        { type: "dialog", speaker: "系統", text: "經歷了一場生死血戰，你的武學造詣得到了飛躍性的昇華！" },
        { type: "remove_event" }
    ]
};