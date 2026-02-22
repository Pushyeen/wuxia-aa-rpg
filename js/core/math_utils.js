// js/core/math_utils.js

export const MathUtil = {
    // 線性插值：在 a 和 b 之間取比例 t 的值
    lerp: (a, b, t) => a + (b - a) * t,
    
    // 根據生命週期比例 (t) 從陣列中取出對應的元素 (語義變形核心)
    getArrayElementByRatio: (arr, t) => {
        return arr[Math.min(Math.floor(t * arr.length), arr.length - 1)];
    },
    
    // 根據定義的曲線字典，計算當前比例 t 的數值 (動態縮放核心)
    getValueFromCurve: (curve, t) => {
        const keys = Object.keys(curve).map(Number).sort((a, b) => a - b);
        let k1 = keys[0], k2 = keys[keys.length - 1];
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (t >= keys[i] && t <= keys[i+1]) {
                k1 = keys[i];
                k2 = keys[i+1];
                break;
            }
        }
        
        if (k1 === k2) return curve[k1];
        return MathUtil.lerp(curve[k1], curve[k2], (t - k1) / (k2 - k1));
    }
};