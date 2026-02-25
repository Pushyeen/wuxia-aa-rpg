// js/ui/combat_ui.js
import { WindowManager } from '../core/window_manager.js';
import { GameState, StatEngine } from '../systems/state.js';
import { AvatarUI } from './avatar.js';
import { DB_SKILLS } from '../data/db_skills.js';

export const CombatUI = {
    createWindow(eData) {
        let html = `
            <div style="width: 580px; max-width: 100%; position: relative;"> 
                
                <button id="bat-btn-mode" class="sys-btn" style="position:absolute; top:-35px; left:5px; border:2px outset #55ffff; color:#55ffff; padding:4px 12px; font-weight:bold;">模式: ${GameState.player.combatMode === 'auto' ? '自動' : '手動'}</button>

                <div id="combo-display-p" class="wuxia-combo-container" style="left: 10px; top: 0px; text-align: left;">
                    <div id="combo-count-p" class="wuxia-combo-count"></div>
                    <div id="combo-rank-p" class="wuxia-combo-rank"></div>
                </div>
                
                <div id="combo-display-e" class="wuxia-combo-container" style="right: 10px; top: 0px; text-align: right;">
                    <div id="combo-count-e" class="wuxia-combo-count"></div>
                    <div id="combo-rank-e" class="wuxia-combo-rank"></div>
                </div>

                <button id="bat-btn-flee" class="sys-btn" style="position:absolute; top:-35px; right:5px; background:#440000; border:2px outset #ff5555; color:#ffaaaa; padding:4px 12px; font-weight:bold;">🏃 嘗試逃跑</button>
                
                <div class="battle-ui" style="display:flex; justify-content:space-between; align-items:flex-end; padding-top: 25px;">
                    
                    <div id="bat-target-player" style="text-align:center; width:45%; position: relative;">
                        <div style="color:#ffaa55; font-weight:bold;">少俠</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-p" class="bar-fill" style="width:100%;"></div></div>
                        <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-p" class="bar-fill" style="background:#00aaff; width:0%;"></div></div>
                        <div class="bar-bg" style="margin: 4px auto 0; height:6px;"><div id="bat-combo-p" class="bar-fill" style="background:#cc55ff; width:100%; transition: width 0.2s;"></div></div>
                        <div style="font-size:11px; color:#aaa;">氣力值: <span id="bat-combo-text">0</span></div>
                        <div id="bat-aa-p" style="display:flex; justify-content:center; margin-top:10px;">${AvatarUI.getCombatHTML()}</div>
                        <div class="zone-box">
                            <div class="zone-title">【自身狀態】</div>
                            <div id="bat-aura-p" style="margin-bottom: 4px; border-bottom: 1px dashed #333; padding-bottom: 2px;">- 無氣場 -</div>
                            <div id="bat-tags-p">- 無印記 -</div>
                        </div>
                    </div>

                    <div style="font-size:24px; color:#555; font-weight:bold; margin-bottom: 40px; z-index: 10;">VS</div>

                    <div id="bat-target-enemy" style="text-align:center; width:45%; position: relative;">
                        <div style="color:#ff5555; font-weight:bold;">${eData.name}</div>
                        <div class="bar-bg" style="margin: 0 auto;"><div id="bat-hp-e" class="bar-fill" style="width:100%;"></div></div>
                        <div class="bar-bg" style="margin: 2px auto 0; height:4px; border-color:#333;"><div id="bat-atb-e" class="bar-fill" style="background:#ff8800; width:0%;"></div></div>
                        
                        <div class="bar-bg" style="margin: 4px auto 0; height:6px;"><div id="bat-combo-e" class="bar-fill" style="background:#cc55ff; width:100%; transition: width 0.2s;"></div></div>
                        <div style="font-size:11px; color:#aaa;">氣力值: <span id="bat-combo-text-e">0</span></div>

                        <pre class="aa-box" id="bat-aa-e" style="color:#ffaaaa; margin-top:22px;">${eData.aa}</pre>
                        <div class="zone-box">
                            <div class="zone-title">【敵方狀態】</div>
                            <div id="bat-aura-e" style="margin-bottom: 4px; border-bottom: 1px dashed #333; padding-bottom: 2px;">- 無氣場 -</div>
                            <div id="bat-tags-e">- 無印記 -</div>
                        </div>
                    </div>
                </div>

                <div id="manual-skill-menu" style="display:none; position:absolute; top:0; left:-245px; height:100%; width:240px; flex-direction: column; background:rgba(0,0,0,0.95); border:4px double #aaa; padding:15px 10px; z-index:100; text-align:center; box-sizing: border-box; box-shadow: -5px 0 15px rgba(0,0,0,0.8);">
                    <div style="color:#ffff55; margin-bottom:12px; font-size:15px; flex-shrink: 0; font-weight: bold; border-bottom: 1px dashed #555; padding-bottom: 8px;">
                        — 選擇招式 —
                    </div>
                    <div id="skill-list-container" style="display:flex; flex-direction: column; gap:8px; overflow-y:auto; flex: 1; padding: 2px 5px; align-items: stretch;">
                    </div>
                    <button class="sys-btn" id="btn-end-turn" style="margin-top:12px; width:100%; color:#ffaaaa; border-color:#ff5555; background:#440000; flex-shrink: 0; font-size: 14px; font-weight: bold; padding: 8px 0;">
                        結束攻勢 / 暫停
                    </button>
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

        let derE = StatEngine.getDerived(enemyRef);
        let comboEEl = document.getElementById('bat-combo-e'), comboTxtE = document.getElementById('bat-combo-text-e');
        if (comboEEl) comboEEl.style.width = `${Math.max(0, (enemyRef.currentCombo / Math.max(1, derE.comboMax)) * 100)}%`;
        if (comboTxtE) comboTxtE.innerText = `${Math.floor(enemyRef.currentCombo)} / ${derE.comboMax}`;

        const renderTags = (tags) => {
            let html = [];
            if(tags.ice) html.push(`<span class="tag ice">❄️ 寒氣 x${tags.ice}</span>`);
            if(tags.fire) html.push(`<span class="tag fire">🔥 炎勁 x${tags.fire}</span>`);
            if(tags.silk) html.push(`<span class="tag silk">🕸️ 絲線 x${tags.silk}</span>`);
            if(tags.frozen) html.push(`<span class="tag ice" style="box-shadow: 0 0 5px #aaddff;">🧊 冰封</span>`);
            if(tags['死穴']) html.push(`<span class="tag" style="color:#ff00ff; border-color:#ff00ff; box-shadow: 0 0 5px #ff00ff;">🎯 死穴 x${tags['死穴']}</span>`);
            if(tags['餘音']) html.push(`<span class="tag" style="color:#55ffff; border-color:#55ffff;">🎵 餘音 x${tags['餘音']}</span>`);
            if(tags['破甲毒']) html.push(`<span class="tag" style="color:#aaffaa; border-color:#aaffaa; box-shadow: 0 0 5px #aaffaa;">☠️ 破甲毒 x${tags['破甲毒']}</span>`);
            return html.join('') || '- 無印記 -';
        };

        const renderAuras = (auras) => {
            let html = [];
            for(let k in auras) {
                if(auras[k] > 0) html.push(`<span class="tag aura">✨ ${k} x${auras[k]}</span>`);
            }
            return html.join('') || '- 無氣場 -';
        };

        let tagsP = document.getElementById('bat-tags-p');
        if (tagsP) tagsP.innerHTML = renderTags(playerRef.tags);
        let auraP = document.getElementById('bat-aura-p');
        if (auraP) auraP.innerHTML = renderAuras(playerRef.aura);

        let tagsE = document.getElementById('bat-tags-e');
        if (tagsE) tagsE.innerHTML = renderTags(enemyRef.tags);
        let auraE = document.getElementById('bat-aura-e');
        if (auraE) auraE.innerHTML = renderAuras(enemyRef.aura);
    },

    showHitCombo(isPlayer, count) {
        let display = document.getElementById(isPlayer ? 'combo-display-p' : 'combo-display-e');
        let countEl = document.getElementById(isPlayer ? 'combo-count-p' : 'combo-count-e');
        let rankEl = document.getElementById(isPlayer ? 'combo-rank-p' : 'combo-rank-e');
        
        if (!display || !countEl || !rankEl) return;

        if (count === 0) {
            display.style.display = 'none';
            return;
        }

        display.style.display = 'block';
        countEl.innerText = `${count} 連擊`; 
        
        countEl.className = 'wuxia-combo-count';
        rankEl.className = 'wuxia-combo-rank';
        
        void countEl.offsetWidth;
        
        let rankText = "";
        let tierClass = "combo-tier-1";
        
        if (count >= 50) { rankText = "天下無雙"; tierClass = "combo-tier-5"; }
        else if (count >= 30) { rankText = "出神入化"; tierClass = "combo-tier-4"; }
        else if (count >= 20) { rankText = "勢如破竹"; tierClass = "combo-tier-3"; }
        else if (count >= 10) { rankText = "行雲流水"; tierClass = "combo-tier-2"; }
        
        rankEl.innerText = rankText;
        countEl.classList.add(tierClass);
        if (rankText) rankEl.classList.add(tierClass);
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
    },
// 【新增】：封裝手動選單的 DOM 渲染與事件綁定，並回傳 Promise
    showManualMenu(playerRef) {
        return new Promise(resolve => {
            const menu = document.getElementById('manual-skill-menu');
            const list = document.getElementById('skill-list-container');
            const endBtn = document.getElementById('btn-end-turn');

            if (!menu || !list || !endBtn) return resolve(null);

            // 清空先前的按鈕
            list.innerHTML = '';
            
            let skills = GameState.player.activeSkills;
            if (!skills || skills.length === 0) {
                // 如果沒招式可用，直接回傳 null 結束回合
                return resolve(null);
            }

            // 渲染招式按鈕
            skills.forEach(skId => {
                let sk = DB_SKILLS[skId];
                if (!sk) return;

                let failRate = Math.max(0, Math.floor((1 - (playerRef.currentCombo / 100)) * 100));
                let btn = document.createElement('button');
                btn.className = 'sys-btn';
                btn.style.width = '100%'; 
                btn.style.padding = '6px';
                btn.style.textAlign = 'left';
                
                btn.innerHTML = `
                    <div style="font-size:14px; margin-bottom:2px;">${sk.name}</div>
                    <div style="font-size:11px; color:#888; text-align:right;">氣力:${sk.comboCost} | 破綻:${failRate}%</div>
                `;
                
                // 氣力不足時反灰禁用
                if (playerRef.currentCombo < sk.comboCost) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                    btn.style.cursor = 'not-allowed';
                }

                btn.onclick = () => {
                    // 點擊後，將選擇的技能 ID 傳回給邏輯層
                    resolve(skId);
                };
                list.appendChild(btn);
            });

            endBtn.onclick = () => {
                // 點擊結束回合，傳回 null
                resolve(null);
            };

            // 顯示選單
            menu.style.display = 'flex';
        });
    },

    // 【新增】：隱藏手動選單
    hideManualMenu() {
        const menu = document.getElementById('manual-skill-menu');
        if (menu) menu.style.display = 'none';
    }
};