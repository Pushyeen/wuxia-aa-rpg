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
        map: mapEngine 
    };

    EventEngine.init(deps);
    CombatSystem.init(deps);
    SysPanel.init(deps);

    SysPanel.render();
    
    mapEngine.updatePlayerPosition(GameState.player.x, GameState.player.y);
    
    EventEngine.play('evt_start_game');
}

// ==========================================
// 共用移動邏輯
// ==========================================
function movePlayer(dx, dy) {
    if (GameState.current !== "EXPLORE") return;
    if (dx === 0 && dy === 0) return;

    let p = GameState.player;
    let nx = p.x + dx, ny = p.y + dy;
    
    let currentMapId = mapEngine.currentMapId || 'map_start';
    let mapData = DB_MAPS[currentMapId];
    
    if (!mapData || !mapData.matrix[ny] || !mapData.matrix[ny][nx]) return;
    
    let symbolChar = mapData.matrix[ny][nx];
    let tileData = mapData.symbols[symbolChar];
    
    if (tileData && tileData.type === 'wall') return;
    
    p.x = nx; 
    p.y = ny; 
    mapEngine.updatePlayerPosition(p.x, p.y);
    
    let evtId = mapData.events[`${nx},${ny}`];
    if (evtId) {
        GameState.currentEventX = nx;
        GameState.currentEventY = ny;
        EventEngine.play(evtId);
    }
}

// ==========================================
// 實體鍵盤綁定
// ==========================================
window.addEventListener("keydown", (e) => {
    let dx = 0, dy = 0;
    if(["w","ArrowUp"].includes(e.key.toLowerCase())) dy = -1;
    if(["s","ArrowDown"].includes(e.key.toLowerCase())) dy = 1;
    if(["a","ArrowLeft"].includes(e.key.toLowerCase())) dx = -1;
    if(["d","ArrowRight"].includes(e.key.toLowerCase())) dx = 1;

    movePlayer(dx, dy);
});

// ==========================================
// 虛擬方向鍵綁定 (強制觸控最高優先級)
// ==========================================
function setupVirtualDPad() {
    const btnUp = document.getElementById('dpad-up');
    const btnDown = document.getElementById('dpad-down');
    const btnLeft = document.getElementById('dpad-left');
    const btnRight = document.getElementById('dpad-right');

    if(!btnUp) return;

    const bindMove = (btn, dx, dy) => {
        // 手機端專用：touchstart 能實現 0 延遲觸發
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 阻擋手機瀏覽器預設的雙擊放大、滑動
            movePlayer(dx, dy);
        }, { passive: false });
        
        // 電腦端/滑鼠測試用：mousedown
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault();
            movePlayer(dx, dy);
        });
    };

    bindMove(btnUp, 0, -1);
    bindMove(btnDown, 0, 1);
    bindMove(btnLeft, -1, 0);
    bindMove(btnRight, 1, 0);
}

// 唯一啟動點
window.addEventListener('load', () => {
    initGame();
    setupVirtualDPad();
});