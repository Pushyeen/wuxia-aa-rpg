// js/main.js

import { UltimateVFXEngine } from './core/vfx_engine.js';
import { MapEngine } from './core/map_engine.js';
import { WindowManager } from './core/window_manager.js';
import { GameState } from './systems/state.js';
import { EventEngine } from './systems/events.js';
import { CombatSystem } from './systems/combat.js';
import { Logger } from './ui/logger.js';
import { SysPanel } from './ui/sys_panel.js';
import { MapDB } from './data/db_maps.js';
import { AvatarUI } from './ui/avatar.js';

let mapEngine, vfxEngine;

function initGame() {
    WindowManager.init();
    Logger.init();
    AvatarUI.init(); // <--- 啟動動態頭像與紙娃娃系統
    vfxEngine = new UltimateVFXEngine('vfx-layer');
    mapEngine = new MapEngine('map-canvas');

    const deps = {
        vfx: vfxEngine,
        logger: Logger,
        combat: CombatSystem,
        ui: SysPanel
    };

    EventEngine.init(deps);
    CombatSystem.init(deps);
    SysPanel.init(deps);

    SysPanel.render();
    
    // 修正點 1：改用 updatePlayerPosition
    mapEngine.updatePlayerPosition(GameState.player.x, GameState.player.y);
    
    Logger.add("系統初始化完成。歡迎來到 AA 武俠世界！", "sys-msg");
    Logger.add("按 WASD 移動。尋找地圖上的【？】或【惡】。", "story-msg");
}

window.addEventListener("keydown", (e) => {
    if (GameState.current !== "EXPLORE") return;

    let p = GameState.player;
    let dx = 0, dy = 0;
    if(["w","ArrowUp"].includes(e.key.toLowerCase())) dy = -1;
    if(["s","ArrowDown"].includes(e.key.toLowerCase())) dy = 1;
    if(["a","ArrowLeft"].includes(e.key.toLowerCase())) dx = -1;
    if(["d","ArrowRight"].includes(e.key.toLowerCase())) dx = 1;

    if (dx !== 0 || dy !== 0) {
        let nx = p.x + dx, ny = p.y + dy;
        let tileId = MapDB.layout[ny] ? MapDB.layout[ny][nx] : null;
        
        if (tileId !== null && tileId !== 1) { 
            if (tileId === 4) { 
                MapDB.layout[ny][nx] = 0; 
                CombatSystem.start("bandit"); 
            } 
            
            p.x = nx; 
            p.y = ny; 
            
            // 修正點 2：改用 updatePlayerPosition
            mapEngine.updatePlayerPosition(p.x, p.y);
            
            let evtId = MapDB.events[`${nx},${ny}`];
            if (evtId) {
                if (evtId === "battle_bandit") {
                    CombatSystem.start("bandit");
                } else {
                    EventEngine.play(evtId);
                }
            }
        }
    }
});

window.addEventListener('load', initGame);