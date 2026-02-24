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
    ],

    // 隱藏 Boss：天機居士·莫測
    'evt_fight_moce': [
        { type: "dialog", speaker: "天機居士·莫測", text: "你的腳步虛浮，真氣散亂。在老夫的卦象中，你已是個死人。" },
        { type: "dialog", speaker: "天機居士·莫測", text: "也罷，就讓老夫親自為你送行，免得你弄髒了這片江湖。" },
        { type: "combat", enemyId: "e_boss_moce" }, // 呼叫之前設計好的敵人 ID
        { type: "dialog", speaker: "系統", text: "你以力破巧，打破了必死的命局！在生死之間，你對「策」與「勢」的理解達到了全新的境界。" },
        { type: "remove_event" } // 戰勝後將他從地圖上移除
    ],
    // 中階強敵：絕代名伶·幽蘭
    'evt_fight_youlan': [
        { type: "dialog", speaker: "絕代名伶·幽蘭", text: "公子請留步。良辰美景，何不聽奴家彈奏一曲《琵琶行》？" },
        { type: "dialog", speaker: "絕代名伶·幽蘭", text: "只是奴家的琴音，歷來只獻給死人...公子，請品鑑。" },
        { type: "combat", enemyId: "e_elite_youlan" }, // 觸發戰鬥
        { type: "dialog", speaker: "系統", text: "一曲肝腸斷，天涯何處覓知音。你抵擋住了致命的連環魔音，對【音】系武學有了防備。" },
        { type: "remove_event" } // 戰勝後將她從地圖上移除
    ],
    // 隱藏強敵：蜀中詭客·唐翎
    'evt_fight_tang': [
        { type: "dialog", speaker: "蜀中詭客·唐翎", text: "嘻嘻...又有新的實驗體送上門來了。" },
        { type: "dialog", speaker: "蜀中詭客·唐翎", text: "放心，我的毒發作很快，你連痛苦都來不及感受就會化為血水。" },
        { type: "combat", enemyId: "e_boss_tang" }, // 觸發戰鬥
        { type: "dialog", speaker: "系統", text: "你在狂風驟雨般的暗器彈幕中尋得一絲破綻，成功擊破了千機匣！" },
        { type: "remove_event" }
    ]
};