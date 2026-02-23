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
            <div id="meridian-container" style="background:#000; padding: 20px; text-align:center; font-family:'PMingLiU', 'MingLiU', monospace; font-size:16px; line-height:1.4; position:relative; overflow:hidden;">
                <div style="white-space: pre; display: inline-block; text-align: left; color: #333;">${MAP_AA}</div>
                <div id="meridian-desc" style="margin-top:20px; font-size:14px; color:${color}; text-shadow: 0 0 5px ${color};">
                    ${descHtml}
                </div>
            </div>
        `;
        
        this.win = WindowManager.create("【經脈周天圖】", html);

        this.updateNodesStatic();
        // 啟動高頻率的粒子發射器，模擬源源不絕的氣流
        this.timer = setInterval(() => this.spawnParticles(), 150); 
    },

    close() {
        if (this.timer) clearInterval(this.timer);
        if (this.win) { this.win.remove(); this.win = null; }
    },

    // 靜態更新：賦予各穴位不同的重要程度與動畫
    updateNodesStatic() {
        if (!this.win) return;
        let p = GameState.player;
        let container = this.win.querySelector('#meridian-container');
        let allNodes = container.querySelectorAll('.acu-node');
        
        allNodes.forEach(n => {
            n.className = 'acu-node'; // 重置
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
                
                // 【核心展演】：依據穴位在此內功中的地位，給予不同特效
                if (i === 0) {
                    // 起點 (通常是丹田)：如引擎般強烈搏動
                    n.classList.add('node-origin');
                    n.style.textShadow = `0 0 15px ${activeArt.color}`;
                } else if (i === activeArt.path.length - 1 && i === progress - 1) {
                    // 終點 (大圓滿)：散發極強的光芒
                    n.classList.add('node-terminus');
                    n.style.textShadow = `0 0 25px ${activeArt.color}, 0 0 50px ${activeArt.color}`;
                } else if (i === progress - 1) {
                    // 當前衝穴的關口 (最前線)：閃爍不定，表現突破中的狀態
                    n.classList.add('node-frontier');
                } else {
                    // 途經節點：平穩的光暈
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

    // 動態更新：發射流動的文字真氣
    spawnParticles() {
        let p = GameState.player;
        let activeId = p.internal.active;
        if (!activeId || !this.win) return;

        let activeArt = DB_INTERNAL[activeId];
        let progress = p.internal.progress[activeId] || 0;
        if (progress < 2) return; // 至少要打通兩個穴位才能流動

        let container = this.win.querySelector('#meridian-container');
        if (!container) return;

        let status = p.internal.status;
        let conf = activeArt.flowConf;

        // 內力強度展演：打通越多穴位，氣流越密集 (生成機率越高)
        let spawnChance = 0.2 + (progress * 0.1); 

        // 遍歷已打通的經脈路徑，在相鄰穴位間生成氣流
        for(let i = 0; i < progress - 1; i++) {
            if (Math.random() > spawnChance) continue;

            let startAcu = activeArt.path[i];
            let endAcu = activeArt.path[i+1];
            
            let startNodes = container.querySelectorAll(`[data-acu="${startAcu}"]`);
            let endNodes = container.querySelectorAll(`[data-acu="${endAcu}"]`);

            // 自動配對左右對稱的穴位分支 (如：左肩流向左手，右肩流向右手)
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

    // 實作文字飛行特效
    createParticle(container, sX, sY, eX, eY, art, conf, status) {
        let el = document.createElement('div');
        
        let charList = conf.chars;
        let color = art.color;
        let duration = conf.speed;
        let easing = 'ease-in-out'; // 預設順暢的真氣流動

        // 異常屬性覆寫：中毒
        if (status.poisoned) {
            charList = ["毒", "厄", "腐", "♨"];
            color = Math.random() > 0.5 ? "#55ff55" : "#aa00ff";
        }
        // 異常屬性覆寫：內傷 (走火入魔)
        if (status.injured) {
            charList = ["阻", "滯", "逆", "亂", "⚠"];
            color = Math.random() > 0.5 ? "#ff0000" : "#440000";
            duration *= (1.5 + Math.random()); // 速度忽快忽慢
            easing = 'steps(4, end)'; // 呈現卡頓、跳躍式的流動感
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

        // 氣流飄浮的隨機偏移 (讓氣流不會走死板的直線)
        let midX = (sX + eX)/2 + (Math.random()-0.5)*25;
        let midY = (sY + eY)/2 + (Math.random()-0.5)*25;

        // Web Animations API
        let anim = el.animate([
            { transform: `translate(${sX}px, ${sY}px) scale(0.3)`, opacity: 0 },
            { transform: `translate(${midX}px, ${midY}px) scale(1.2)`, opacity: 0.9 },
            { transform: `translate(${eX}px, ${eY}px) scale(0.5)`, opacity: 0 }
        ], {
            duration: duration,
            easing: easing
        });

        // 動畫結束後自動銷毀 DOM 節點，維持效能
        anim.onfinish = () => el.remove();
    }
};