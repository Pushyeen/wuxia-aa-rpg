// js/main.js

import { UltimateVFXEngine } from './core/vfx_engine.js';
import { MapEngine } from './core/map_engine.js';
import { WindowManager } from './core/window_manager.js';
import { GameState } from './systems/state.js';
import { EventEngine } from './systems/events.js';
import { CombatSystem } from './systems/combat.js';
import { Logger } from './ui/logger.js';
import { SysPanel } from './ui/sys_panel.js';
import { AvatarUI } from './ui/avatar.js'; 
// 【修正 1】：引入新版的地圖資料庫 DB_MAPS
import { DB_MAPS } from './data/db_maps.js';

let mapEngine, vfxEngine;

function initGame() {
    WindowManager.init();
    Logger.init();
    AvatarUI.init(); 
    vfxEngine = new UltimateVFXEngine('vfx-layer');
    mapEngine = new MapEngine('map-canvas');

    const deps = {
        vfx: vfxEngine,
        logger: Logger,
        combat: CombatSystem,
        ui: SysPanel,
        // 【修正 2】：將 mapEngine 注入依賴中，讓事件系統可以呼叫它來移除地圖上的 NPC
        map: mapEngine 
    };

    EventEngine.init(deps);
    CombatSystem.init(deps);
    SysPanel.init(deps);

    SysPanel.render();
    
    mapEngine.updatePlayerPosition(GameState.player.x, GameState.player.y);
    
 // 在 js/main.js 中找到 initGame 函式的最後面

    // ... 前面的初始化程式碼保留 ...
    SysPanel.render();
    
    mapEngine.updatePlayerPosition(GameState.player.x, GameState.player.y);
    
    // 【修改】：移除原本直接印 Log 的程式碼，改由事件引擎呼叫開局腳本
    EventEngine.play('evt_start_game');
}

window.addEventListener("keydown", (e) => {
    // 只有在探索模式下才能移動
    if (GameState.current !== "EXPLORE") return;

    let p = GameState.player;
    let dx = 0, dy = 0;
    if(["w","ArrowUp"].includes(e.key.toLowerCase())) dy = -1;
    if(["s","ArrowDown"].includes(e.key.toLowerCase())) dy = 1;
    if(["a","ArrowLeft"].includes(e.key.toLowerCase())) dx = -1;
    if(["d","ArrowRight"].includes(e.key.toLowerCase())) dx = 1;

    if (dx !== 0 || dy !== 0) {
        let nx = p.x + dx, ny = p.y + dy;
        
        // 取得當前地圖資料
        let currentMapId = mapEngine.currentMapId || 'map_start';
        let mapData = DB_MAPS[currentMapId];
        
        // 防呆：防止走出陣列範圍
        if (!mapData || !mapData.matrix[ny] || !mapData.matrix[ny][nx]) return;
        
        // 【修正 3】：讀取字串矩陣中的字元，並判斷是否為牆壁(樹木)
        let symbolChar = mapData.matrix[ny][nx];
        let tileData = mapData.symbols[symbolChar];
        
        // 如果是牆壁，直接 return 阻擋移動
        if (tileData && tileData.type === 'wall') return;
        
        // 允許移動：更新玩家座標與地圖渲染
        p.x = nx; 
        p.y = ny; 
        mapEngine.updatePlayerPosition(p.x, p.y);
        
        // 【修正 4】：檢查新座標點上是否有事件
        let evtId = mapData.events[`${nx},${ny}`];
        if (evtId) {
            // 將觸發事件的座標記錄下來 (為了讓腳本知道要移除哪個座標的 NPC)
            GameState.currentEventX = nx;
            GameState.currentEventY = ny;
            
            // 統一交給 EventEngine 處理 (包含戰鬥、對話、給道具等，因為我們已將戰鬥寫入 db_scripts.js 中)
            EventEngine.play(evtId);
        }
    }
});

window.addEventListener('load', initGame);