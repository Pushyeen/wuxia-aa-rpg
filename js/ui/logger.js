// js/ui/logger.js

export const Logger = {
    el: null,

    init() {
        this.el = document.getElementById('log-content');
    },

    add(msg, className = 'sys-msg') {
        if (!this.el) return;
        
        // 建立新的訊息節點，而非直接 += innerHTML，這對效能更好
        const msgNode = document.createElement('div');
        msgNode.className = className;
        msgNode.innerHTML = `>> ${msg}`;
        
        this.el.appendChild(msgNode);

        // 【修復 Log 滾動】：強制將最新加入的節點滾動到可見範圍底部
        msgNode.scrollIntoView({ behavior: "smooth", block: "end" });
        
        // 雙重保險：強制更新父容器的滾動軸
        this.el.scrollTop = this.el.scrollHeight;
        if (this.el.parentElement) {
            this.el.parentElement.scrollTop = this.el.parentElement.scrollHeight;
        }
    }
};