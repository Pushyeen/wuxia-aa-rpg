// js/core/window_manager.js

export const WindowManager = {
    container: null,
    zIndex: 50,

    // 初始化：取得視窗容器
    init() {
        this.container = document.getElementById('floating-windows-container');
    },

    // 建立新視窗
    create(title, contentHTML, isBattle = false) {
        if (!this.container) this.init();

        const win = document.createElement('div');
        win.className = 'draggable-window';
        win.style.zIndex = ++this.zIndex;
        
        // 戰鬥視窗固定在畫面上方，事件視窗則隨機產生些微偏移，避免多個視窗完全重疊
        win.style.top = isBattle ? '10%' : `calc(30% + ${Math.random() * 20}px)`; 
        win.style.left = isBattle ? '35%' : `calc(40% + ${Math.random() * 20}px)`;
        
        win.innerHTML = `
            <div class="drag-header"><span>${title}</span></div>
            <div class="drag-content">${contentHTML}</div>
        `;
        this.container.appendChild(win);
        
        // ==========================================
        // 拖曳邏輯綁定
        // ==========================================
        const header = win.querySelector('.drag-header');
        let isDrag = false, startX, startY, initX, initY;
        
        header.onmousedown = (e) => { 
            isDrag = true; 
            startX = e.clientX; 
            startY = e.clientY; 
            
            // 【核心修正】：直接讀取元素當前真實的渲染偏移量(px)
            // 避免舊寫法 parseInt(win.style.left) 在遇到 calc() 或 % 時解析為 NaN 導致漂移
            initX = win.offsetLeft; 
            initY = win.offsetTop; 
            
            // 清除可能干擾絕對定位的屬性
            win.style.bottom = 'auto';
            win.style.right = 'auto';
        };
        
        window.addEventListener('mousemove', e => { 
            if (isDrag) { 
                // 根據滑鼠移動的差值，精準更新視窗的 px 座標
                win.style.left = `${initX + e.clientX - startX}px`; 
                win.style.top = `${initY + e.clientY - startY}px`; 
            }
        });
        
        window.addEventListener('mouseup', () => isDrag = false);
        
        // 點擊視窗任何地方時，自動將該視窗置於最上層
        win.onmousedown = () => win.style.zIndex = ++this.zIndex;
        
        return win;
    }
};