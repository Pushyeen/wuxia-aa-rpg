// js/data/db_scripts.js

export const DB_SCRIPTS = {
    "meet_master": {
        nodes: [
            { type: "dialogue", name: "神祕老人", text: "年輕人，你在這荒郊野外打轉，是在找死嗎？" },
            { type: "choice", options: [
                { label: "前輩教訓的是，晚輩知錯了。", nodes: [
                    { type: "dialogue", name: "神祕老人", text: "孺子可教！這把【精鋼劍】拿去防身吧！" },
                    // 【核心修正】：將 e_iron_sword 改為 w_iron
                    { type: "give_item", item_id: "w_iron" },
                    { type: "set_flag", flag: "has_sword", value: true },
                    { type: "dialogue", name: "神祕老人", text: "(老人化作一陣青煙消失了...)" }
                ]},
                { label: "老頭閃開，別擋大爺的路！", nodes: [
                    { type: "dialogue", name: "神祕老人", text: "找死！！看招！！" },
                    { type: "vfx", effect: "dragon_strike" },
                    { type: "battle", enemy_id: "bandit" }
                ]}
            ]}
        ]
    }
};