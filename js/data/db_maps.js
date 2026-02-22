// js/data/db_maps.js

export const MapDB = {
    width: 25, 
    height: 25,
    
    // 地貌圖塊字典
    dict: { 
        0: { char: "草", color: "#2d5a27" }, 
        1: { char: "樹", color: "#3a5f0b" }, 
        4: { char: "惡", color: "#ff5555" },
        9: { char: "？", color: "#ffdd55" }
    },
    
    // 座標觸發事件 (x,y)
    events: { 
        "12,12": "meet_master", 
        "10,5": "battle_bandit" 
    },
    
    layout: []
};

// 為了展示方便，我們用程式自動生成一個 25x25 被樹木包圍的草地
for (let y = 0; y < MapDB.height; y++) { 
    let row = []; 
    for (let x = 0; x < MapDB.width; x++) {
        row.push((x === 0 || y === 0 || x === MapDB.width - 1 || y === MapDB.height - 1) ? 1 : 0); 
    }
    MapDB.layout.push(row); 
}

// 在特定座標放上 NPC 和敵人
MapDB.layout[12][12] = 9; // 中間放一個問號 (?)
MapDB.layout[10][5] = 4;  // 放一隻惡徒 (惡)