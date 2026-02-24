// 請修改 js/data/db_maps.js 覆蓋 map_start 的設定
export const DB_MAPS = {
    'map_start': {
        name: "無名小村與周邊",
        width: 25, height: 15,
        matrix: [
            "#########################",
            "#8......#...........#...#",
            "#.T.....#..4........#...#",
            "#.......#...........#...#",
            "####.##########.#####...#",
            "#......1............#...#",
            "#.5.................#.6.#",
            "###.###########.#####...#",
            "#......2....3.#.........#",
            "#.............#.........#",
            "###############.#########",
            "#.......................#",
            "#...........7...........#",
            "#.......................#",
            "#########################"
        ],
        symbols: {
            '#': { type: 'wall', char: '▓', color: '#555' },
            '.': { type: 'floor', char: '·', color: '#222' },
            'T': { type: 'event', char: '匠', color: '#55ffff' }, 
            '1': { type: 'event', char: '惡', color: '#ffaaaa' }, 
            '2': { type: 'event', char: '徒', color: '#ff5555' }, 
            '3': { type: 'event', char: '護', color: '#ff0000' },
            '4': { type: 'event', char: '測', color: '#cc55ff' },
            '5': { type: 'event', char: '蘭', color: '#ff77aa' },
            '6': { type: 'event', char: '翎', color: '#aaffaa' },
            '7': { type: 'event', char: '武', color: '#ffaa00' }, // <-- 武男
            '8': { type: 'event', char: '若', color: '#ffffff' } // 白色的洛神
        },
        events: {
            "2,2": "evt_npc_blacksmith",
            "7,5": "evt_fight_thug",
            "7,8": "evt_fight_cultist",
            "12,8": "evt_fight_boss",
            "11,2": "evt_fight_moce",
            "2,6": "evt_fight_youlan",
            "22,6": "evt_fight_tang", // <-- 綁定唐翎的遭遇事件
            "13,12": "evt_fight_wunan", // <-- 綁定事件
            "1,1": "evt_fight_pianruo" // 地圖左上角
        }
    }
};