// js/data/db_maps.js
export const DB_MAPS = {
    'map_start': {
        name: "無名小村",
        width: 15, height: 10,
        matrix: [
            "###############",
            "#.......#.....#",
            "#.T.....#.....#",
            "#.............#",
            "####.##########",
            "#......1......#",
            "#.............#",
            "###.###########",
            "#......2....3.#",
            "###############"
        ],
        symbols: {
            '#': { type: 'wall', char: '▓', color: '#555' },
            '.': { type: 'floor', char: '·', color: '#222' },
            'T': { type: 'event', char: '匠', color: '#55ffff' }, // 鐵匠
            '1': { type: 'event', char: '惡', color: '#ffaaaa' }, // 惡霸
            '2': { type: 'event', char: '徒', color: '#ff5555' }, // 教徒
            '3': { type: 'event', char: '護', color: '#ff0000' }  // 護法
        },
        events: {
            "2,2": "evt_npc_blacksmith",
            "7,5": "evt_fight_thug",
            "7,8": "evt_fight_cultist",
            "12,8": "evt_fight_boss"
        }
    }
};