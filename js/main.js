import { MapEngine } from './engine/map.js';
import { SemanticFireEngine } from './engine/fire.js';
import { GameState } from './system/state.js';
import { Log, updatePlayerStats } from './system/ui.js';
import { AASpriteRenderer, getPlayerAA } from './engine/render.js';
import { AsyncBattleEngine, Battler } from './system/combat.js';
import { DialogueSystem } from './system/interaction.js';
import { DB, AAAssets, Inventory, PlayerData } from './data/db.js';

let playerRenderer, currentBattle;

function init() {
    playerRenderer = new AASpriteRenderer('player-canvas', getPlayerAA(), getPlayerAA(true), '#AADDFF');
    playerRenderer.renderLoop();
    
    MapEngine.init('bg-canvas');
    MapEngine.draw();
    new SemanticFireEngine('fire-canvas').updateAndDraw();
    
    updatePlayerStats(playerRenderer);
    GameState.set('EXPLORE');
}

// 綁定鍵盤
window.addEventListener("keydown", (e) => {
    const moves = { w: [0,-1], s: [0,1], a: [-1,0], d: [1,0] };
    const move = moves[e.key.toLowerCase()] || (e.key.startsWith('Arrow') ? /* 映射箭頭 */ [0,0] : null);
    if(move) MapEngine.movePlayer(...move, startBattle, () => DialogueSystem.start('merchant_intro'), playerRenderer);
});

// 戰鬥觸發函數
function startBattle() {
    GameState.set('BATTLE');
    // ...建立敵人視窗與 AsyncBattleEngine 的邏輯...
}

window.onload = init;