// js/system/ui.js
import { PlayerData, Inventory } from '../data/db.js';
import { getPlayerAA } from '../engine/render.js';

export const Log = {
    panel: document.getElementById('log-panel'),
    add: function(htmlStr) {
        if (!this.panel) return;
        const entry = document.createElement('div'); 
        entry.className = 'log-entry'; 
        entry.innerHTML = htmlStr;
        this.panel.appendChild(entry);
        if (this.panel.children.length > 50) this.panel.removeChild(this.panel.firstChild);
        this.panel.scrollTop = this.panel.scrollHeight;
    }
};

export function updatePlayerStats(playerRenderer) {
    let baseHp = 1000; let baseAtk = 80; let baseDef = 30; let baseAgi = 100;
    if (Inventory.head) baseDef += 20;
    if (Inventory.armor) { baseHp += 500; baseDef += 100; }
    if (Inventory.weapon) { baseAtk += 100; }
    if (Inventory.shoes) { baseAgi += 100; } 

    let hpRatio = PlayerData.hp / PlayerData.maxHp;
    PlayerData.maxHp = baseHp; PlayerData.hp = Math.floor(baseHp * hpRatio);
    PlayerData.atk = baseAtk; PlayerData.def = baseDef; PlayerData.agi = baseAgi;

    document.getElementById('ui-gold').innerText = PlayerData.gold;
    document.getElementById('ui-hp').innerText = PlayerData.hp; 
    document.getElementById('ui-maxhp').innerText = PlayerData.maxHp;
    document.getElementById('bar-hp').style.width = `${(PlayerData.hp / PlayerData.maxHp) * 100}%`;

    // 裝備文字更新... (省略部分重複代碼)

    // 即時更新紙娃娃
    if(playerRenderer) {
        playerRenderer.aaNormal = getPlayerAA(false);
        playerRenderer.aaHurt = getPlayerAA(true);
    }
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));