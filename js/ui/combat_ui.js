// js/ui/combat_ui.js
import { WindowManager } from '../core/window_manager.js';
import { GameState, StatEngine } from '../systems/state.js';
import { AvatarUI } from './avatar.js';

export const CombatUI = {
    createWindow(eData) {
        let html = `
            <div style="width: 520px; max-width: 100%; position: relative;"> 
                <button id="bat-btn-flee" class="sys-btn" style="position:absolute; top:-35px; right:5px; background:#440000; border:2px outset #ff5555; color:#ffaaaa; padding:4px 12px; font-weight:bold;">🏃 嘗試逃跑</button>
                <div class="battle-ui" style="display:flex; justify-content:space-between; align-items:flex-end; padding-top: 15px;">
                    
                    <div id="bat-target-player" style="text-align:center; width:45%; position: relative;">
                        <div style="color:#ffaa55; font-weight:bold;">少俠</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-p" class="bar-fill" style="width:100%;"></div></div>
                        <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-p" class="bar-fill" style="background:#00aaff; width:0%;"></div></div>
                        <div class="bar-bg" style="margin: 4px auto 0; height:6px;"><div id="bat-combo-p" class="bar-fill" style="background:#cc55ff; width:100%; transition: width 0.2s;"></div></div>
                        <div style="font-size:11px; color:#aaa;">連擊值: <span id="bat-combo-text">0</span></div>
                        <div id="bat-aa-p" style="display:flex; justify-content:center; margin-top:10px;">${AvatarUI.getCombatHTML()}</div>
                        <div class="zone-box"><div class="zone-title">【自身氣場】</div><div id="bat-aura-content">- 無 -</div></div>
                    </div>

                    <div style="font-size:24px; color:#555; font-weight:bold;">VS</div>

                    <div id="bat-target-enemy" style="text-align:center; width:45%; position: relative;">
                        <div style="color:#ff5555; font-weight:bold;">${eData.name}</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-e" class="bar-fill" style="width:100%;"></div></div>
                        <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-e" class="bar-fill" style="background:#ff8800; width:0%;"></div></div>
                        <pre class="aa-box" id="bat-aa-e" style="color:#ffaaaa; margin-top:22px;">${eData.aa}</pre>
                        <div class="zone-box"><div class="zone-title">【目標印記】</div><div id="bat-target-content">- 無 -</div></div>
                    </div>
                </div>
            </div>
        `;
        return WindowManager.create(`⚔️ 戰鬥交鋒`, html, true);
    },

    update(win, playerRef, enemyRef, sysUi) {
        if (!win) return;
        
        let pEl = document.getElementById('bat-hp-p'), eEl = document.getElementById('bat-hp-e');
        if (pEl) pEl.style.width = `${Math.max(0, (playerRef.hp / playerRef.maxHp) * 100)}%`;
        if (eEl) eEl.style.width = `${Math.max(0, (enemyRef.hp / enemyRef.maxHp) * 100)}%`;
        GameState.player.hp = playerRef.hp; 
        if(sysUi) sysUi.updateStats();

        let atbPEl = document.getElementById('bat-atb-p'), atbEEl = document.getElementById('bat-atb-e');
        if (atbPEl) atbPEl.style.width = `${Math.min(100, playerRef.wait)}%`;
        if (atbEEl) atbEEl.style.width = `${Math.min(100, enemyRef.wait)}%`;

        let derP = StatEngine.getDerived(GameState.player);
        let comboPEl = document.getElementById('bat-combo-p'), comboTxt = document.getElementById('bat-combo-text');
        if (comboPEl) comboPEl.style.width = `${Math.max(0, (playerRef.currentCombo / Math.max(1, derP.comboMax)) * 100)}%`;
        if (comboTxt) comboTxt.innerText = `${playerRef.currentCombo} / ${derP.comboMax}`;

        let tHtml = [];
        if(enemyRef.tags.ice) tHtml.push(`<span class="tag ice">❄️ 寒氣 x${enemyRef.tags.ice}</span>`);
        if(enemyRef.tags.fire) tHtml.push(`<span class="tag fire">🔥 炎勁 x${enemyRef.tags.fire}</span>`);
        if(enemyRef.tags.silk) tHtml.push(`<span class="tag silk">🕸️ 絲線 x${enemyRef.tags.silk}</span>`);
        if(enemyRef.tags.frozen) tHtml.push(`<span class="tag ice" style="box-shadow: 0 0 5px #aaddff;">🧊 冰封</span>`);
        let tContent = document.getElementById('bat-target-content');
        if (tContent) tContent.innerHTML = tHtml.join('') || '- 無 -';

        let aHtml = [];
        for(let k in playerRef.aura) if(playerRef.aura[k] > 0) aHtml.push(`<span class="tag aura">✨ ${k} x${playerRef.aura[k]}</span>`);
        let aContent = document.getElementById('bat-aura-content');
        if (aContent) aContent.innerHTML = aHtml.join('') || '- 無 -';
    },

    showFloatingDamage(containerId, dmg, pctMaxHp) {
        let container = document.getElementById(containerId);
        if (!container) return;

        let el = document.createElement('div');
        el.innerText = `-${dmg}`;
        el.className = 'dmg-float-base';

        if (pctMaxHp >= 1.0) el.classList.add('dmg-tier-5');       
        else if (pctMaxHp >= 0.75) el.classList.add('dmg-tier-4'); 
        else if (pctMaxHp >= 0.50) el.classList.add('dmg-tier-3'); 
        else if (pctMaxHp >= 0.25) el.classList.add('dmg-tier-2'); 
        else el.classList.add('dmg-tier-1');                       

        let offsetX = (Math.random() - 0.5) * 60;
        let offsetY = (Math.random() - 0.5) * 20;
        el.style.left = `calc(50% + ${offsetX}px)`;
        el.style.top = `calc(35% + ${offsetY}px)`;

        container.appendChild(el);
        setTimeout(() => { if (el) el.remove(); }, 1500);
    }
};