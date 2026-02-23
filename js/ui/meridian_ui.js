// js/ui/meridian_ui.js
import { WindowManager } from '../core/window_manager.js';
import { GameState } from '../systems/state.js';
import { DB_INTERNAL } from '../data/db_internal.js';

const MAP_AA = `
　　　　　　<span class="acu-node" data-acu="baihui">[百會]</span>
　　　　　　／　＼
　　　　　｜<span class="acu-node" data-acu="yin">[印堂]</span>｜
　　　　　　＼　／
　　　　　　<span class="acu-node" data-acu="tu">[天突]</span>
　　<span class="acu-node" data-acu="jian">[肩井]</span>－－┴－－<span class="acu-node" data-acu="jian">[肩井]</span>
　　　｜　　<span class="acu-node" data-acu="shan">[膻中]</span>　　｜
　　<span class="acu-node" data-acu="qu">[曲池]</span>　　｜　　<span class="acu-node" data-acu="qu">[曲池]</span>
　　　｜　　<span class="acu-node" data-acu="que">[神闕]</span>　　｜
　　<span class="acu-node" data-acu="lao">[勞宮]</span>　　｜　　<span class="acu-node" data-acu="lao">[勞宮]</span>
　　　　　　<span class="acu-node" data-acu="hai">[氣海]</span>
　　　　　　<span class="acu-node" data-acu="dan">[丹田]</span>
　　　　　／　　　＼
　　　<span class="acu-node" data-acu="huan">[環跳]</span>　　　<span class="acu-node" data-acu="huan">[環跳]</span>
　　　　｜　　　　　｜
　　　<span class="acu-node" data-acu="li">[三里]</span>　　　<span class="acu-node" data-acu="li">[三里]</span>
　　　　｜　　　　　｜
　　　<span class="acu-node" data-acu="quan">[湧泉]</span>　　　<span class="acu-node" data-acu="quan">[湧泉]</span>
`;

export const MeridianUI = {
    win: null,
    timer: null,

    toggle() {
        if (this.win) this.close();
        else this.open();
    },

    open() {
        let p = GameState.player;
        let activeId = p.internal.active;
        let art = activeId ? DB_INTERNAL[activeId] : null;

        let descHtml = art 
            ? `當前運轉：【${art.name}】<br>${art.desc}`
            : `<span style="color:#888;">尚未運轉任何內功，經脈沉寂。</span>`;
        let color = art ? art.color : '#888';

        let html = `
            <div id="meridian-container" style="background:#000; padding: 20px; text-align:center; font-family:'PMingLiU', 'MingLiU', monospace; font-size:16px; line-height:1.4; position:relative;">
                <div style="white-space: pre; display: inline-block; text-align: left; color: #333;">${MAP_AA}</div>
                <div id="meridian-desc" style="margin-top:20px; font-size:14px; color:${color}; text-shadow: 0 0 5px ${color};">
                    ${descHtml}
                </div>
            </div>
        `;
        
        this.win = WindowManager.create("【經脈周天圖】", html);

        // 利用 requestAnimationFrame 在視窗建立後立刻抓取寬高，進行對齊主遊戲介面的完美置中
        requestAnimationFrame(() => {
            if (!this.win) return;
            let winWidth = this.win.offsetWidth;
            let winHeight = this.win.offsetHeight;
            
            // 【修改】：抓取遊戲主容器的座標，以該容器為中心
            let gameContainer = document.getElementById('game-master-container');
            let left = 0, top = 0;
            
            if (gameContainer) {
                let rect = gameContainer.getBoundingClientRect();
                left = rect.left + (rect.width - winWidth) / 2;
                top = rect.top + (rect.height - winHeight) / 2;
            } else {
                // 如果找不到容器的防呆機制，退回全螢幕置中
                left = (window.innerWidth - winWidth) / 2;
                top = (window.innerHeight - winHeight) / 2;
            }

            // 確保視窗不會超出畫面左方與上方
            this.win.style.left = Math.max(10, left-500) + 'px';
            this.win.style.top = Math.max(10, top-300) + 'px';

            // 防呆機制：若玩家螢幕高度不足以顯示整張圖，自動賦予捲動功能並限制高度
            let container = this.win.querySelector('#meridian-container');
            let screenH = window.innerHeight;
            if (container && winHeight > screenH - 40) {
                container.style.maxHeight = (screenH - 80) + 'px';
                container.style.overflowY = 'auto';
            }
        });

        this.updateNodesStatic();
        // 啟動高頻率的粒子發射器，模擬源源不絕的氣流
        this.timer = setInterval(() => this.spawnParticles(), 150); 
    },

    close() {
        if (this.timer) clearInterval(this.timer);
        if (this.win) { this.win.remove(); this.win = null; }
    },

    updateNodesStatic() {
        if (!this.win) return;
        let p = GameState.player;
        let container = this.win.querySelector('#meridian-container');
        let allNodes = container.querySelectorAll('.acu-node');
        
        allNodes.forEach(n => {
            n.className = 'acu-node'; 
            n.style.color = '#333';
            n.style.textShadow = 'none';
        });

        let activeId = p.internal.active;
        if (!activeId) return;

        let activeArt = DB_INTERNAL[activeId];
        let progress = p.internal.progress[activeId] || 0;

        for(let i = 0; i < progress; i++) {
            let acuId = activeArt.path[i];
            let nodes = container.querySelectorAll(`[data-acu="${acuId}"]`);
            
            nodes.forEach(n => {
                n.classList.add('unlocked');
                n.style.color = activeArt.color;
                
                if (i === 0) {
                    n.classList.add('node-origin');
                    n.style.textShadow = `0 0 15px ${activeArt.color}`;
                } else if (i === activeArt.path.length - 1 && i === progress - 1) {
                    n.classList.add('node-terminus');
                    n.style.textShadow = `0 0 25px ${activeArt.color}, 0 0 50px ${activeArt.color}`;
                } else if (i === progress - 1) {
                    n.classList.add('node-frontier');
                } else {
                    n.classList.add('node-transit');
                    n.style.textShadow = `0 0 5px ${activeArt.color}`;
                }
            });
        }
        
        let descEl = container.querySelector('#meridian-desc');
        if(descEl) {
            descEl.innerHTML = `當前運轉：【${activeArt.name}】<br>${activeArt.desc}`;
            descEl.style.color = activeArt.color;
            descEl.style.textShadow = `0 0 5px ${activeArt.color}`;
        }
    },

    spawnParticles() {
        let p = GameState.player;
        let activeId = p.internal.active;
        if (!activeId || !this.win) return;

        let activeArt = DB_INTERNAL[activeId];
        let progress = p.internal.progress[activeId] || 0;
        if (progress < 2) return; 

        let container = this.win.querySelector('#meridian-container');
        if (!container) return;

        let status = p.internal.status || {}; 
        let conf = activeArt.flowConf;

        let spawnChance = 0.2 + (progress * 0.1); 

        for(let i = 0; i < progress - 1; i++) {
            if (Math.random() > spawnChance) continue;

            let startAcu = activeArt.path[i];
            let endAcu = activeArt.path[i+1];
            
            let startNodes = container.querySelectorAll(`[data-acu="${startAcu}"]`);
            let endNodes = container.querySelectorAll(`[data-acu="${endAcu}"]`);

            startNodes.forEach((startEl, idx) => {
                let endEl = endNodes[idx % endNodes.length]; 
                
                let sX = startEl.offsetLeft + startEl.offsetWidth / 2;
                let sY = startEl.offsetTop + startEl.offsetHeight / 2;
                let eX = endEl.offsetLeft + endEl.offsetWidth / 2;
                let eY = endEl.offsetTop + endEl.offsetHeight / 2;

                this.createParticle(container, sX, sY, eX, eY, activeArt, conf, status);
            });
        }
    },

    createParticle(container, sX, sY, eX, eY, art, conf, status) {
        let el = document.createElement('div');
        
        let charList = conf.chars;
        let color = art.color;
        let duration = conf.speed;
        let easing = 'ease-in-out'; 

        if (status.poisoned) {
            charList = ["毒", "厄", "腐", "♨"];
            color = Math.random() > 0.5 ? "#55ff55" : "#aa00ff";
        }
        if (status.injured) {
            charList = ["阻", "滯", "逆", "亂", "⚠"];
            color = Math.random() > 0.5 ? "#ff0000" : "#440000";
            duration *= (1.5 + Math.random()); 
            easing = 'steps(4, end)'; 
        }

        let char = charList[Math.floor(Math.random() * charList.length)];

        el.innerText = char;
        el.style.position = 'absolute';
        el.style.left = '0px';
        el.style.top = '0px';
        el.style.color = color;
        el.style.textShadow = `0 0 8px ${color}`;
        el.style.fontSize = conf.size + 'px';
        el.style.fontWeight = 'bold';
        el.style.pointerEvents = 'none';
        el.style.zIndex = '10';

        container.appendChild(el);

        let midX = (sX + eX)/2 + (Math.random()-0.5)*25;
        let midY = (sY + eY)/2 + (Math.random()-0.5)*25;

        let anim = el.animate([
            { transform: `translate(${sX}px, ${sY}px) scale(0.3)`, opacity: 0 },
            { transform: `translate(${midX}px, ${midY}px) scale(1.2)`, opacity: 0.9 },
            { transform: `translate(${eX}px, ${eY}px) scale(0.5)`, opacity: 0 }
        ], {
            duration: duration,
            easing: easing
        });

        anim.onfinish = () => el.remove();
    }
};