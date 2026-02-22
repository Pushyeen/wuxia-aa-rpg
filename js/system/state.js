// js/system/state.js

export const GameState = {
    current: 'EXPLORE',
    set(state) {
        this.current = state;
        const el = document.getElementById('sys-state');
        if (!el) return;
        
        if(state === 'EXPLORE') { el.innerText = '【 探 索 中 】'; el.style.color = '#55aaff'; }
        else if(state === 'DIALOGUE') { el.innerText = '【 交 涉 中 】'; el.style.color = '#ffdd55'; }
        else if(state === 'BATTLE') { el.innerText = '【 戰 鬥 中 】'; el.style.color = '#ff5555'; }
        
        const inBattle = (state === 'BATTLE');
        document.getElementById('btn-tick').disabled = !inBattle;
        document.getElementById('btn-auto').disabled = !inBattle;
        document.getElementById('btn-flee').disabled = !inBattle;
        document.getElementById('btn-rest').disabled = inBattle || state === 'DIALOGUE';
    }
};