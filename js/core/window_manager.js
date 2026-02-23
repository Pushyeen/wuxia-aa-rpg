// js/core/window_manager.js

export const WindowManager = {
    container: null,
    zIndex: 50,

    init() {
        this.container = document.getElementById('floating-windows-container');
    },

    create(title, contentHTML, isBattle = false) {
        if (!this.container) this.init();

        const win = document.createElement('div');
        win.className = 'draggable-window';
        win.style.zIndex = ++this.zIndex;
        
        // 【修復視窗過大】：設定 max-content 的同時，限制極限寬度避免撐破螢幕
        win.style.width = 'max-content';
        win.style.maxWidth = '600px'; 

        win.style.top = isBattle ? '10%' : `calc(30% + ${Math.random() * 20}px)`; 
        win.style.left = isBattle ? '25%' : `calc(40% + ${Math.random() * 20}px)`;
        
        win.innerHTML = `
            <div class="drag-header"><span>${title}</span></div>
            <div class="drag-content">${contentHTML}</div>
        `;
        this.container.appendChild(win);
        
        const header = win.querySelector('.drag-header');
        
        header.onmousedown = (e) => { 
            e.preventDefault(); // 防止文字反白干擾
            
            let startX = e.clientX; 
            let startY = e.clientY; 
            
            // 【修復拖曳位移】：必須使用 offsetLeft/offsetTop 獲取相對父容器的正確座標
            let initX = win.offsetLeft; 
            let initY = win.offsetTop; 
            
            win.style.bottom = 'auto';
            win.style.right = 'auto';
            win.style.left = `${initX}px`;
            win.style.top = `${initY}px`;
            
            win.style.zIndex = ++this.zIndex;

            const onMouseMove = (moveEvent) => {
                win.style.left = `${initX + moveEvent.clientX - startX}px`; 
                win.style.top = `${initY + moveEvent.clientY - startY}px`; 
            };

            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        };
        
        win.onmousedown = () => win.style.zIndex = ++this.zIndex;
        
        return win;
    }
};