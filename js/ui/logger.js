// js/ui/logger.js

export const Logger = {
    el: null,

    init() {
        this.el = document.getElementById('log-content');
    },

    add(msg, className = 'sys-msg') {
        if (!this.el) return;
        this.el.innerHTML += `<div class="${className}">>> ${msg}</div>`;
        // 自動捲動到最底部
        this.el.parentElement.scrollTop = this.el.parentElement.scrollHeight;
    }
};