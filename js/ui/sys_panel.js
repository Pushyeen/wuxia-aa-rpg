// js/ui/sys_panel.js
import { GameState, StatEngine } from '../systems/state.js';
import { DB_ITEMS } from '../data/db_items.js';
import { DB_SKILLS } from '../data/db_skills.js';
import { AvatarUI } from './avatar.js'; 
import { DB_INTERNAL } from '../data/db_internal.js';
import { MeridianUI } from './meridian_ui.js'; 

export const SysPanel = {
    currentTab: 'status',
    el: null, vfx: null, logger: null,

    init(deps) {
        this.el = document.getElementById('sys-content');
        this.vfx = deps.vfx; this.logger = deps.logger;
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.getAttribute('data-tab');
                this.render();
            });
        });
    },

    updateStats() {
        StatEngine.updateMaxHp(GameState.player);
        const hpEl = document.getElementById('ui-hp');
        const lvEl = document.getElementById('ui-lv');
        const expEl = document.getElementById('ui-exp');
        if(hpEl) hpEl.innerText = `${GameState.player.hp}/${GameState.player.maxHp}`;
        if(lvEl) lvEl.innerText = GameState.player.lv;
        if(expEl) expEl.innerText = GameState.player.exp;
    },

    render() {
        this.updateStats();
        let html = ''; 
        let p = GameState.player;
        
        if (this.currentTab === 'status') {
            let d = StatEngine.getDerived(p);
            let s = p.stats;
            html = `<div style="line-height:1.8; font-size:14px; overflow-y:auto; height:100%;">
                <div class="color-hp" style="font-size:16px;">【氣血】 ${p.hp} / ${p.maxHp}</div>
                <hr style="border: 0; border-bottom: 1px dotted #555; margin:8px 0;">
                <div style="color:#ffff55; font-weight:bold;">＜九大基礎屬性＞</div>
                <div style="display:flex; flex-wrap:wrap; color:#aaa; margin-bottom:10px;">
                    <div style="width:50%;">臂力: <span style="color:#fff">${s.brawn}</span></div>
                    <div style="width:50%;">根骨: <span style="color:#fff">${s.physique}</span></div>
                    <div style="width:50%;">內息: <span style="color:#fff">${s.qiCap}</span></div>
                    <div style="width:50%;">真元: <span style="color:#fff">${s.qiPot}</span></div>
                    <div style="width:50%;">身法: <span style="color:#fff">${s.agi}</span></div>
                    <div style="width:50%;">靈巧: <span style="color:#fff">${s.dex}</span></div>
                    <div style="width:50%;">洞察: <span style="color:#fff">${s.per}</span></div>
                    <div style="width:50%;">悟性: <span style="color:#fff">${s.comp}</span></div>
                    <div style="width:50%;">福緣: <span style="color:#fff">${s.luck}</span></div>
                </div>
                <div style="color:#ffff55; font-weight:bold;">＜戰鬥延伸面板＞</div>
                <div style="display:flex; flex-wrap:wrap; color:#aaa;">
                    <div style="width:50%;">外功攻擊: <span style="color:#55ffff">${d.pAtk}</span></div>
                    <div style="width:50%;">內功威力: <span style="color:#55ffff">${d.qAtk}</span></div>
                    <div style="width:50%;">命中/閃避: <span style="color:#55ffff">${d.hit}/${d.dodge}</span></div>
                    <div style="width:50%;">爆擊率: <span style="color:#55ffff">${d.critChance}%</span></div>
                    <div style="width:50%;">爆傷倍率: <span style="color:#55ffff">${(d.critMult*100).toFixed(0)}%</span></div>
                    <div style="width:50%;">外門硬功: <span style="color:#55ffff">${d.fixDef}</span></div>
                    <div style="width:50%;">護體真氣: <span style="color:#55ffff">${d.pctDef}%</span></div>
                    <div style="width:100%;">極限連擊值: <span style="color:#55ffff">${d.comboMax}</span></div>
                </div>
            </div>`;
        } 
        else if (this.currentTab === 'equip') {
            html += `<div style="color:#ffff55; margin-bottom:10px; font-weight:bold;">＜目前裝備＞</div>`;
            ['weapon', 'armor'].forEach(slot => {
                let eqId = p.equips[slot];
                let item = eqId ? DB_ITEMS[eqId] : null;
                let name = item ? item.name : "空";
                let desc = item ? `<span style="font-size:12px;color:#888">(${item.desc})</span>` : "";
                html += `<div class="list-item"><span>【${slot === 'weapon' ? '武器' : '防具'}】 ${name} <br>${desc}</span>`;
                if(eqId) html += `<button class="sys-btn action-unequip" data-slot="${slot}">卸下</button>`;
                html += `</div>`;
            });

            html += `<div style="color:#aaaaaa; margin:15px 0 10px 0; font-weight:bold;">＜背包裝備＞</div>`;
            let hasEquip = false;
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && (item.type === 'weapon' || item.type === 'armor')) {
                    hasEquip = true;
                    html += `<div class="list-item"><span>${item.name} <br><span style="font-size:12px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-equip" data-idx="${idx}">裝備</button></div>`;
                }
            });
            if (!hasEquip) html += "<div style='color:#888;'>背包裡沒有可用裝備。</div>";
        }
        else if (this.currentTab === 'item') {
            let hasItem = false;
            p.inventory.forEach((itemId, idx) => {
                let item = DB_ITEMS[itemId];
                if (item && item.type === 'consumable') {
                    hasItem = true;
                    html += `<div class="list-item"><span>${item.name} <br><span style="font-size:12px;color:#888">(${item.desc})</span></span>
                             <button class="sys-btn action-use" data-idx="${idx}">使用</button></div>`;
                }
            });
            if (!hasItem) html += "<div style='color:#888;'>背包裡沒有可用道具。</div>";
        }
        else if (this.currentTab === 'skill') {
            html += `<div style="color:#ffff55; margin-bottom:5px; font-weight:bold;">＜配置參戰快捷武學＞</div>`;
            p.skills.forEach(skillId => {
                let skill = DB_SKILLS[skillId];
                if (!skill) return;
                let isActive = p.activeSkills.includes(skillId);
                let bgStyle = isActive ? 'background:#000044;' : 'transparent';
                
                let tagsHtml = skill.tags.map(t => {
                    let cls = ''; if(t==='寒')cls='ice'; else if(t==='炎')cls='fire'; else if(t==='鈍')cls='blunt'; else if(t==='風')cls='wind'; else if(t==='牽引')cls='pull'; else if(t==='佈置')cls='trap'; else if(t==='絲線')cls='silk'; else if(t==='柔')cls='soft'; else if(t==='Aura')cls='aura';
                    return `<span class="tag ${cls}">${t}</span>`;
                }).join('');

                html += `<div class="list-item" style="flex-wrap:wrap; ${bgStyle}">
                            <div style="width: 50%; color:${isActive ? '#55ffff' : '#888888'}; font-weight:bold;">
                                ${isActive ? '[參戰]' : '[待命]'} ${skill.name}
                            </div>
                            <div style="width: 50%; text-align: right;">
                                <button class="sys-btn action-toggle-skill" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}" data-id="${skillId}">${isActive ? '取消' : '配置'}</button>
                                <button class="sys-btn action-preview-vfx" style="border-color:#ffff55; color:#ffff55;" data-vfx="${skill.vfx}">展演</button>
                            </div>
                            <div style="width:100%; margin-top:4px;">${tagsHtml}</div>
                            <div style="width:100%; font-size:12px; color:#888; margin-top:2px;">連擊消耗:${skill.comboCost} | 威力:${skill.power} | ${skill.msg}</div>
                         </div>`;
            });
        }
        else if (this.currentTab === 'train') {
            let statsDict = { brawn:'臂力', physique:'根骨', qiCap:'內息', qiPot:'真元', agi:'身法', dex:'靈巧', per:'洞察', comp:'悟性', luck:'福緣' };
            html = `<div style="margin-bottom:10px; color:#aaaaaa;">消耗 100 修為提升基礎屬性 (+1)。<br>目前修為: <span class="color-exp">${p.exp}</span></div>
                    <div style="display:flex; flex-wrap:wrap; gap:5px; margin-bottom:15px;">`;
            for(let k in statsDict) {
                html += `<button class="sys-btn action-train-base" data-stat="${k}" style="width:48%;">修練 ${statsDict[k]}</button>`;
            }
            html += `</div><hr style="border: 0; border-bottom: 1px dotted #555; margin:15px 0;">
                    <div style="color:#ffff55; margin-bottom:10px; font-weight:bold;">＜內功心法修練＞</div>
                    <div style="text-align:center; margin-bottom:10px;">
                        <button class="sys-btn" id="btn-meridian" style="width:100%; padding:8px; font-weight:bold; color:#55ffff;">【周天運轉】開啟經脈圖</button>
                    </div>`;
                    
            ['art_yang', 'art_yin', 'art_taiji'].forEach(artId => {
                let art = DB_INTERNAL[artId];
                if(!art) return;
                let progress = p.internal.progress[artId] || 0;
                let max = art.path.length;
                let isActive = p.internal.active === artId;
                let bgStyle = isActive ? 'background:#000044;' : 'transparent';
                
                html += `<div class="list-item" style="${bgStyle}">
                            <div style="width: 50%;">
                                <div style="color:${art.color}; font-weight:bold;">${isActive ? '[運轉中]' : ''} ${art.name}</div>
                                <div style="font-size:12px; color:#888;">境界: ${progress} / ${max}</div>
                            </div>
                            <div style="width: 50%; text-align: right;">
                                <button class="sys-btn action-train-art" data-art="${artId}" ${progress >= max ? 'disabled' : ''}>衝穴</button>
                                <button class="sys-btn action-equip-art" data-art="${artId}" style="${isActive ? 'color:#ff5555; border-color:#ff5555;' : ''}">${isActive ? '卸下' : '運轉'}</button>
                            </div>
                         </div>`;
            });
        }

        this.el.innerHTML = html;
        this.bindEvents(); 
    },

    bindEvents() {
        this.el.querySelectorAll('.action-equip').forEach(btn => btn.onclick = () => this.equip(parseInt(btn.getAttribute('data-idx'))));
        this.el.querySelectorAll('.action-unequip').forEach(btn => btn.onclick = () => this.unequip(btn.getAttribute('data-slot')));
        this.el.querySelectorAll('.action-use').forEach(btn => btn.onclick = () => this.useItem(parseInt(btn.getAttribute('data-idx'))));
        this.el.querySelectorAll('.action-toggle-skill').forEach(btn => btn.onclick = () => this.toggleSkill(btn.getAttribute('data-id')));
        this.el.querySelectorAll('.action-preview-vfx').forEach(btn => btn.onclick = () => this.previewSkill(btn.getAttribute('data-vfx')));
        
        this.el.querySelectorAll('.action-train-base').forEach(btn => {
            btn.onclick = () => {
                let stat = btn.getAttribute('data-stat');
                if (GameState.player.exp < 100) { if(this.logger) this.logger.add("修為不足！", "warn-msg"); return; }
                GameState.player.exp -= 100;
                GameState.player.stats[stat] += 1;
                if(this.logger) this.logger.add(`基礎屬性提升！`);
                this.render();
            };
        });

        let btnMeridian = this.el.querySelector('#btn-meridian');
        if (btnMeridian) btnMeridian.onclick = () => MeridianUI.toggle();
        
        this.el.querySelectorAll('.action-train-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                if (GameState.player.exp < 100) return;
                GameState.player.exp -= 100;
                GameState.player.internal.progress[artId] = (GameState.player.internal.progress[artId] || 0) + 1;
                this.render();
            };
        });
        this.el.querySelectorAll('.action-equip-art').forEach(btn => {
            btn.onclick = () => {
                let artId = btn.getAttribute('data-art');
                GameState.player.internal.active = (GameState.player.internal.active === artId) ? null : artId;
                this.render();
            };
        });
    },

    equip(invIdx) {
        let itemId = GameState.player.inventory[invIdx];
        let item = DB_ITEMS[itemId];
        let slot = item.type; 
        if (GameState.player.equips[slot]) GameState.player.inventory.push(GameState.player.equips[slot]);
        GameState.player.equips[slot] = itemId;
        GameState.player.inventory.splice(invIdx, 1);
        if(this.logger) this.logger.add(`裝備了 ${item.name}。`);
        this.render();
        if (AvatarUI) AvatarUI.renderToDOM(); 
    },

    unequip(slot) {
        if (!GameState.player.equips[slot]) return;
        GameState.player.inventory.push(GameState.player.equips[slot]);
        if(this.logger) this.logger.add(`卸下了 ${DB_ITEMS[GameState.player.equips[slot]].name}。`);
        GameState.player.equips[slot] = null;
        this.render();
        if (AvatarUI) AvatarUI.renderToDOM();
    },

    useItem(invIdx) {
        let item = DB_ITEMS[GameState.player.inventory[invIdx]];
        if (item && item.action) item.action(GameState.player, this.logger); 
        GameState.player.inventory.splice(invIdx, 1);
        this.render();
    },

    toggleSkill(skillId) {
        let p = GameState.player;
        let idx = p.activeSkills.indexOf(skillId);
        if (idx > -1) { 
            if (p.activeSkills.length > 1) p.activeSkills.splice(idx, 1); 
        } else {
            p.activeSkills.push(skillId);
        }
        this.render();
    },

    previewSkill(vfxId) {
        if (!this.vfx) return;
        let startX = window.innerWidth / 2, startY = window.innerHeight / 2 + 100;
        let targetX = window.innerWidth / 2, targetY = window.innerHeight / 2 - 100;
        this.vfx.play(vfxId, startX, startY, targetX, targetY);
    }
};