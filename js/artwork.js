(() => {
    'use strict';

    // Intersect each row at its pixel centers, so sloping metal panels share
    // crisp edges and remain entirely free of antialiasing when enlarged.
    class PixelPainter {
        constructor(context) {
            this.context = context;
        }

        dot(x, y, color) {
            this.context.fillStyle = color;
            this.context.fillRect(Math.round(x), Math.round(y), 1, 1);
        }

        line(from, to, color) {
            let [x, y] = from.map(Math.round);
            const [endX, endY] = to.map(Math.round);
            const dx = Math.abs(endX - x);
            const dy = -Math.abs(endY - y);
            const stepX = x < endX ? 1 : -1;
            const stepY = y < endY ? 1 : -1;
            let error = dx + dy;
            this.context.fillStyle = color;
            while (true) {
                this.context.fillRect(x, y, 1, 1);
                if (x === endX && y === endY) break;
                const twiceError = 2 * error;
                if (twiceError >= dy) {
                    error += dy;
                    x += stepX;
                }
                if (twiceError <= dx) {
                    error += dx;
                    y += stepY;
                }
            }
        }

        path(points, color) {
            for (let i = 1; i < points.length; i++) {
                this.line(points[i - 1], points[i], color);
            }
        }

        polygon(points, color) {
            const ys = points.map(point => point[1]);
            const firstY = Math.ceil(Math.min(...ys) - 0.5);
            const lastY = Math.floor(Math.max(...ys) - 0.5);
            this.context.fillStyle = color;
            for (let y = firstY; y <= lastY; y++) {
                const crossings = [];
                const row = y + 0.5;
                for (let i = 0; i < points.length; i++) {
                    const [x1, y1] = points[i];
                    const [x2, y2] = points[(i + 1) % points.length];
                    if ((y1 <= row && y2 > row) || (y2 <= row && y1 > row)) {
                        crossings.push(x1 + (row - y1) * (x2 - x1) / (y2 - y1));
                    }
                }
                crossings.sort((a, b) => a - b);
                for (let i = 0; i + 1 < crossings.length; i += 2) {
                    const left = Math.ceil(crossings[i] - 0.5);
                    const right = Math.ceil(crossings[i + 1] - 0.5);
                    this.context.fillRect(left, y, right - left, 1);
                }
            }
        }

        face(project, points, color) {
            this.polygon(points.map(point => project(...point)), color);
        }

        edge(project, points, color) {
            this.path(points.map(point => project(...point)), color);
        }

        panel(project, x, y, w, h, color) {
            this.face(project, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], color);
        }
    }

    const casing = {
        deep: '#17233a', seam: '#2b3b54', shade: '#43566e', side: '#687c91',
        mid: '#889ba9', face: '#b2c0c6', silver: '#cbd5d5',
        pale: '#e1e5dc', light: '#f4f1df', blue: '#5689a0',
    };

    function chamfer(x, y, w, h, cut) {
        return [[x + cut, y], [x + w - cut, y], [x + w, y + cut],
            [x + w, y + h - cut], [x + w - cut, y + h], [x + cut, y + h],
            [x, y + h - cut], [x, y + cut]];
    }

    // Coordinates are width, distance toward the back, and height.
    function project(x, depth, height) {
        return [57 + x + depth * 0.74, 151 + x * 0.17 - depth * 0.42 - height];
    }

    function drawBlock(p, map, x, depth, width, length, bottom, top, colors) {
        const frontL = [x, depth], frontR = [x + width, depth];
        const backL = [x, depth + length], backR = [x + width, depth + length];
        p.polygon([map(...frontL, top), map(...frontR, top), map(...frontR, bottom), map(...frontL, bottom)], colors.front);
        p.polygon([map(...frontR, top), map(...backR, top), map(...backR, bottom), map(...frontR, bottom)], colors.side);
        p.polygon([map(...frontL, top), map(...backL, top), map(...backR, top), map(...frontR, top)], colors.top);
    }

    function drawBase(p) {
        const front = (u, v) => project(u, 0, 15 - v);
        const side = (d, v) => project(145, d, 15 - v);
        const lid = (u, d) => project(u, d, 16);
        drawBlock(p, project, 3, 1, 140, 65, 0, 4, {top: casing.shade, front: casing.seam, side: casing.deep});
        drawBlock(p, project, 0, 0, 145, 68, 3, 16, {top: casing.silver, front: casing.face, side: casing.side});
        p.edge(lid, [[0, 0], [0, 68], [145, 68]], casing.pale);
        p.edge(lid, [[0, 0], [145, 0]], casing.light);
        p.edge(lid, [[145, 0], [145, 68]], '#93a6ac');
        p.panel(front, 0, 9, 145, 3, '#99aeb8');
        p.edge(front, [[0, 12], [145, 12]], '#677d8b');
        p.edge(side, [[0, 12], [68, 12]], '#465770');
        p.edge(side, [[0, 1], [68, 1]], '#a2b4b8');

        // A blue foil badge, grille, and recessed floppy drive.
        p.panel(front, 5, 3, 8, 6, casing.shade);
        p.panel(front, 6, 3, 6, 5, '#7399a6');
        p.panel(front, 7, 4, 2, 2, '#bcdedb');
        for (let x = 19; x < 55; x += 4) {
            p.edge(front, [[x, 4], [x, 8]], '#7a8d9a');
            p.edge(front, [[x + 1, 4], [x + 1, 8]], casing.pale);
        }
        p.panel(front, 66, 3, 7, 5, '#6e8595');
        p.panel(front, 67, 3, 5, 3, '#adc3c7');
        p.panel(front, 79, 2, 50, 8, '#718795');
        p.panel(front, 80, 3, 48, 6, '#9baaaf');
        p.panel(front, 83, 4, 38, 2, '#334354');
        p.panel(front, 98, 5, 11, 2, '#26354a');
        p.panel(front, 123, 6, 3, 2, casing.pale);
        p.panel(front, 133, 4, 4, 2, '#427184');
        p.panel(front, 134, 4, 2, 1, '#9adde0');
        for (let d = 25; d < 57; d += 4) p.edge(side, [[d, 4], [d, 8]], '#4c6178');
        for (let x = 127; x < 139; x += 3) p.edge(lid, [[x, 24], [x, 49]], '#99aab2');
        p.edge(lid, [[3, 3], [141, 3], [141, 64]], '#a6b6bf');
    }

    function drawStand(p) {
        drawBlock(p, project, 18, 10, 103, 43, 16, 19, {top: '#b4c1c5', front: '#6c8290', side: '#52667b'});
        p.line(project(18, 10, 19), project(121, 10, 19), '#dbe1da');
        drawBlock(p, project, 28, 15, 83, 31, 19, 26, {top: '#a1b3ba', front: '#889dab', side: '#5c7184'});
        p.line(project(28, 15, 21), project(111, 15, 21), '#637c8a');
        p.line(project(28, 15, 25), project(111, 15, 25), '#b7c6ca');
    }

    const tube = (u, d, v) => project(9 + u, 14 + d, 106 - v);
    const tubeFront = (u, v) => tube(u, 0, v);

    function drawCase(p) {
        const sideFace = (d, v) => tube(114 - d * 0.105, d, v + d * 0.095);
        const lid = (u, d) => tube(u, d, d * 0.1);
        p.face(tube, [[0, 0, 5], [4, 0, 0], [12, 56, 5], [19, 62, 6], [104, 62, 6],
            [108, 58, 6], [108, 58, 63], [104, 58, 70], [110, 6, 79], [108, 0, 79],
            [5, 0, 80], [0, 0, 75]], '#8b9aa7');
        p.face(tube, [[2, 0, 3], [5, 4, 0], [12, 56, 5], [19, 62, 6], [104, 62, 6],
            [109, 55, 5], [114, 4, 3], [110, 0, 0]], casing.pale);
        p.face(tube, [[3, 1, 2], [6, 4, 0], [12, 56, 5], [19, 62, 6], [25, 62, 6], [18, 57, 5]], '#e9e8db');
        p.face(tube, [[87, 0, 0], [97, 0, 0], [105, 56, 5], [97, 61, 6], [94, 61, 6]], '#d7dcd6');
        p.edge(tube, [[12, 56, 5], [19, 62, 6], [104, 62, 6]], '#f0ecda');
        p.edge(tube, [[8, 14, 1], [107, 14, 1], [111, 10, 1]], '#b0bec1');
        p.edge(tube, [[8, 15, 1], [107, 15, 1]], '#f7f0dc');
        for (let x = 38; x < 88; x += 3) {
            p.edge(lid, [[x, 38], [x, 53]], '#a0afb3');
            p.edge(lid, [[x + 1, 39], [x + 1, 53]], '#c8d1d0');
        }
        p.face(tube, [[109, 0, 0], [114, 2, 4], [108, 58, 6], [104, 62, 7],
            [104, 62, 62], [102, 58, 70], [110, 6, 79], [108, 0, 79]], casing.shade);
        p.face(sideFace, [[0, 3], [6, 1], [54, 2], [60, 5], [60, 56], [54, 65], [6, 78], [0, 74]], '#8194a2');
        p.face(sideFace, [[5, 3], [12, 3], [12, 71], [5, 74]], '#9cabb2');
        p.edge(sideFace, [[13, 3], [13, 71]], '#627789');
        p.edge(sideFace, [[14, 3], [14, 70]], '#b7c4c8');
        p.face(sideFace, [[18, 12], [54, 12], [56, 15], [56, 49], [52, 55], [18, 58]], '#728696');
        for (let row = 0; row < 9; row++) {
            const v = 17 + row * 4;
            p.edge(sideFace, [[22, v], [52, v]], '#b1bfc3');
            p.edge(sideFace, [[21, v + 1], [52, v + 1]], '#44596d');
            p.edge(sideFace, [[22, v + 2], [51, v + 2]], '#556b7d');
        }
        p.edge(sideFace, [[19, 60], [50, 58]], '#9baeb6');
        p.edge(sideFace, [[56, 8], [56, 12]], '#536b7d');
        p.edge(sideFace, [[18, 65], [18, 67]], '#495d72');
        p.edge(sideFace, [[53, 59], [53, 60]], '#4b6174');

        p.face(tubeFront, chamfer(0, 0, 114, 80, 5), casing.mid);
        p.face(tubeFront, chamfer(0, 0, 112, 77, 4), casing.face);
        p.face(tubeFront, [[1, 4], [5, 1], [108, 1], [112, 5], [111, 7], [107, 4], [6, 4], [3, 7], [3, 72], [1, 70]], casing.pale);
        p.edge(tubeFront, [[0, 6], [4, 1], [108, 1]], casing.light);
        p.face(tubeFront, [[5, 75], [109, 75], [113, 70], [113, 75], [108, 79], [5, 79], [1, 75]], '#879ba7');
        p.edge(tubeFront, [[5, 77], [108, 77], [112, 73]], '#9fb0b8');
        p.edge(tubeFront, [[6, 79], [108, 79]], '#516778');
    }

    const letters = {
        '>': ['100', '010', '001', '010', '100'],
        A: ['010', '101', '111', '101', '101'], H: ['101', '101', '111', '101', '101'],
        I: ['111', '010', '010', '010', '111'], M: ['10001', '11011', '10101', '10001', '10001'],
        O: ['010', '101', '101', '101', '010'], R: ['110', '101', '110', '101', '101'],
        W: ['10001', '10001', '10101', '11011', '10001'], ' ': ['00', '00', '00', '00', '00'],
    };

    function printGlass(p, text, x, y, scale, color) {
        for (const letter of text) {
            const rows = letters[letter];
            for (let row = 0; row < rows.length; row++) {
                for (let col = 0; col < rows[row].length; col++) {
                    if (rows[row][col] !== '1') continue;
                    for (let dx = 0; dx < scale; dx++) {
                        for (let dy = 0; dy < scale; dy++) {
                            p.dot(...tubeFront(x + col * scale + dx, y + row * scale + dy), color);
                        }
                    }
                }
            }
            x += (rows[0].length + 1) * scale;
        }
    }

    // The phosphor gradient, reflections and scan lines follow the curved glass.
    function drawScreen(p, powered) {
        p.face(tubeFront, chamfer(6, 6, 102, 60, 6), casing.silver);
        p.face(tubeFront, chamfer(7, 7, 100, 58, 5), '#748b99');
        p.face(tubeFront, [[7, 12], [12, 7], [100, 7], [106, 12], [103, 16], [98, 12], [15, 12], [11, 16], [11, 57], [8, 60]], '#4a606f');
        p.face(tubeFront, [[8, 59], [12, 64], [100, 64], [106, 59], [106, 13], [103, 15], [102, 56], [98, 60], [14, 60], [11, 57]], '#c5d0d0');
        p.face(tubeFront, chamfer(10, 10, 94, 52, 6), '#273c4c');
        p.face(tubeFront, chamfer(12, 12, 90, 48, 5), '#102d3a');
        const lit = ['#10313e', '#103b46', '#104751', '#12535b', '#176269', '#1a6d70', '#217777', '#287f7d'];
        const unlit = ['#192b39', '#192f3d', '#1d3442', '#203746', '#243d4b', '#25414e', '#294653', '#2c4956'];
        const palette = powered ? lit : unlit;
        for (let y = 13; y <= 59; y++) {
            for (let x = 13; x <= 100; x++) {
                const nx = (x - 56.5) / 44;
                const ny = (y - 35.5) / 23;
                if (Math.pow(Math.abs(nx), 7) + Math.pow(Math.abs(ny), 6) > 1.03) continue;
                let level = 5.9 - nx * nx * 1.8 - ny * ny * 1.9 - ny * 0.7;
                if (y % 3 === 0) level -= 1.1;
                if (x + y * 0.85 > 86 && x + y * 0.85 < 98) level += 0.7;
                if ((x + 2 * y) % 4 === 0) level += 0.24;
                const shade = Math.max(0, Math.min(palette.length - 1, Math.floor(level)));
                p.dot(...tubeFront(x, y), palette[shade]);
            }
        }
        p.edge(tubeFront, [[17, 17], [20, 15], [38, 15]], powered ? '#507e7e' : '#465e69');
        p.edge(tubeFront, [[91, 55], [95, 55], [99, 52]], powered ? '#4c8680' : '#3f5461');
        if (powered) {
            printGlass(p, '> WHOAMI', 20, 21, 1, '#9bdfc9');
            printGlass(p, 'RIO IMAI', 20, 33, 2, '#478e87');
            printGlass(p, 'RIO IMAI', 20, 32, 2, '#b9ffe2');
            p.panel(tubeFront, 20, 51, 6, 2, '#81dbca');
        }
        // A physical switch, status lamp, and recessed brightness dial.
        p.panel(tubeFront, 9, 70, 13, 3, '#8197a4');
        p.panel(tubeFront, 10, 70, 4, 2, '#437b94');
        p.panel(tubeFront, 14, 70, 6, 1, '#d9e4df');
        p.edge(tubeFront, [[80, 71], [87, 71]], '#768b96');
        p.edge(tubeFront, [[81, 72], [86, 72]], '#d8dfd9');
        p.panel(tubeFront, 92, 69, 3, 3, '#66838a');
        p.panel(tubeFront, 92, 69, 2, 2, powered ? '#a1f3ca' : '#526a77');
        p.panel(tubeFront, 99, 68, 7, 5, '#8298a1');
        p.panel(tubeFront, 99, 68, 6, 3, '#dbe2da');
    }

    const keyboard = (x, depth, height) => [24 + x + depth * 0.68, 179 + x * 0.145 - depth * 0.65 - height];
    const keyColors = {
        pale: ['#dbe1d9', '#7e909c', '#eef0df'], grey: ['#b2c1c8', '#687d8b', '#d0dbd8'],
        dark: ['#728c9b', '#4a657a', '#a1b4bc'], accent: ['#6a9baa', '#476f84', '#a7cccb'],
    };

    function drawKey(p, x, depth, width, tone, mark) {
        const top = (u, d) => keyboard(u, d, 4.4 + d * 0.077);
        const bottom = (u, d) => keyboard(u, d, 3.1 + d * 0.077);
        const [face, wall, edge] = keyColors[tone];
        p.polygon([top(x, depth), top(x + width, depth), bottom(x + width, depth), bottom(x, depth)], wall);
        p.polygon([top(x + width, depth), top(x + width, depth + 4), bottom(x + width, depth + 4), bottom(x + width, depth)], wall);
        p.face(top, [[x, depth], [x + width, depth], [x + width, depth + 4], [x + 0.5, depth + 4]], face);
        if (width > 7) p.edge(top, [[x + 1, depth + 4], [x + width - 1, depth + 4]], edge);
        if (mark) p.dot(...top(x + 1.7, depth + 2.1), tone === 'pale' ? '#99a9aa' : '#778a97');
    }

    function drawKeyboard(p) {
        const front = (x, v) => keyboard(x, 0, 4 - v);
        const top = (x, d) => keyboard(x, d, 3 + d * 0.077);
        const outline = [[1, 1], [3, 0], [125, 0], [128, 2], [128, 33], [126, 35], [3, 35], [0, 33]];
        p.face((x, d) => keyboard(x + 1, d - 0.5, -1), outline, casing.deep);
        p.face(top, outline, casing.silver);
        p.face(front, [[0, 0], [126, 0], [127, 1], [126, 4], [2, 4], [0, 2]], '#8e9fa9');
        p.polygon([keyboard(127, 1, 4), keyboard(128, 33, 5.5), keyboard(128, 33, 2), keyboard(127, 1, 0)], '#677e90');
        p.edge(top, [[1, 2], [2, 1], [125, 1]], '#e8e9db');
        p.edge(top, [[1, 3], [1, 32], [4, 34], [125, 34]], '#f0ecda');
        p.face(top, [[4, 4], [100, 4], [100, 30], [4, 30]], '#647b88');
        p.face(top, [[104, 5], [124, 5], [124, 26], [104, 26]], '#718693');
        const rows = [
            [9, 5, 5, 41, 5, 5, 10, 6],
            [11, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 17],
            [8, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 12],
            [7, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 11],
        ];
        rows.forEach((widths, row) => {
            let x = 5;
            widths.forEach((width, index) => {
                const tone = width > 15 && row > 0 ? 'dark' : (row === 0 || width > 6 ? 'grey' : 'pale');
                drawKey(p, x, 5 + row * 5.6, width, tone, row > 0 && index % 2 === 0);
                x += width + 1.6;
            });
        });
        for (let i = 0; i < 14; i++) {
            drawKey(p, 5 + i * 6.4 + Math.floor(i / 4) * 1.4, 27.5, 4.6, i === 0 ? 'accent' : 'grey', false);
        }
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 3; col++) {
                drawKey(p, 105 + col * 6.1, 6 + row * 5.4, 4.7, col === 2 ? 'grey' : 'pale', col === 0);
            }
        }
        p.edge(top, [[106, 30], [113, 30]], '#88a3ac');
        p.edge(top, [[117, 30], [119, 30]], '#67ada6');
    }

    function drawCables(p) {
        const keyboardCord = [[70, 149], [65, 148], [61, 147], [55, 147], [50, 149],
            [48, 151], [49, 153], [53, 154], [64, 155], [68, 157], [68, 160]];
        const mouseCord = [[243, 146], [250, 145], [257, 145], [265, 148], [270, 152],
            [272, 156], [272, 160], [269, 163], [263, 165], [256, 165], [246, 162],
            [238, 162], [233, 164], [231, 167], [231, 174]];
        for (const wire of [keyboardCord, mouseCord]) {
            p.path(wire.map(([x, y]) => [x + 1, y + 2]), '#111d30');
            p.path(wire.map(([x, y]) => [x, y + 1]), '#344759');
            p.path(wire, '#8295a2');
        }
    }

    function drawMouse(p) {
        p.polygon([[216, 179], [223, 173], [231, 171], [238, 173], [244, 180], [243, 185],
            [235, 191], [228, 193], [218, 190], [213, 187], [213, 182]], '#273a50');
        p.polygon([[214, 179], [223, 172], [231, 170], [238, 173], [243, 178], [242, 183],
            [234, 189], [228, 191], [217, 188], [213, 185]], '#788d9b');
        p.polygon([[215, 178], [223, 172], [230, 170], [236, 171], [241, 175], [240, 180],
            [234, 186], [228, 188], [217, 185], [213, 182]], '#c3cfce');
        p.path([[215, 179], [223, 173], [229, 171], [234, 171]], casing.light);
        p.polygon([[223, 173], [230, 170], [236, 171], [240, 174], [236, 179], [226, 177], [221, 175]], '#aabcc3');
        p.path([[222, 176], [229, 178], [236, 179], [239, 176]], '#738a99');
        p.path([[228, 177], [232, 174], [234, 172]], '#7b92a1');
        p.path([[226, 173], [230, 171], [233, 171]], '#e0e5da');
        p.path([[217, 185], [227, 188], [231, 187]], '#e0e4d9');
    }

    function drawTerminal(p, powered) {
        p.polygon([[24, 177], [137, 144], [183, 122], [256, 139], [272, 153], [244, 173],
            [246, 186], [230, 198], [191, 190], [157, 209], [27, 187]], 'rgba(2, 8, 19, 0.32)');
        p.polygon([[49, 152], [134, 120], [254, 142], [259, 148], [205, 181], [171, 178],
            [155, 201], [25, 182], [23, 178]], 'rgba(2, 8, 19, 0.50)');
        drawCables(p);
        drawBase(p);
        drawStand(p);
        drawCase(p);
        drawScreen(p, powered);
        drawKeyboard(p);
        drawMouse(p);
    }

    function drawFolder(p) {
        p.polygon([[10, 47], [58, 58], [74, 52], [28, 41]], 'rgba(2, 8, 19, 0.44)');
        // Back cover and the tab that protrudes above the paper.
        p.polygon([[17, 17], [19, 12], [22, 10], [36, 12], [40, 17], [65, 21],
            [69, 24], [66, 47], [63, 51], [17, 46]], '#22517d');
        p.polygon([[18, 17], [21, 11], [34, 13], [38, 18], [65, 22], [67, 24], [64, 47], [17, 44]], '#5797be');
        p.path([[19, 16], [21, 12], [34, 14], [37, 18], [64, 22]], '#9ed5e5');
        p.polygon([[21, 20], [64, 24], [62, 45], [18, 43]], '#335e8a');
        p.polygon([[26, 14], [58, 17], [62, 21], [59, 42], [21, 38]], '#88a9b7');
        p.polygon([[24, 12], [52, 15], [60, 22], [58, 38], [21, 34]], '#e1e8df');
        p.path([[23, 32], [25, 13], [52, 16]], '#fff2d7');
        p.polygon([[52, 15], [60, 22], [52, 21]], '#a3bdc5');
        p.path([[51, 16], [51, 21], [58, 22]], '#c5d4d0');
        // A small profile photo and type on the visible leaf.
        const paper = (x, y) => [28 + x - y * 0.08, 17 + y + x * 0.1];
        p.panel(paper, 0, 0, 11, 11, '#86b9c5');
        p.face(paper, [[4, 2], [7, 2], [8, 4], [7, 6], [4, 6], [3, 4]], '#527d94');
        p.face(paper, [[2, 10], [2, 8], [4, 7], [7, 7], [9, 8], [10, 11]], '#52758a');
        p.panel(paper, 14, 2, 8, 2, '#7d96aa');
        p.panel(paper, 14, 6, 12, 1, '#86a0ac');
        p.panel(paper, 14, 9, 7, 1, '#a1b3b9');
        // The near cover tilts open, exposing the stacked sheets.
        p.polygon([[10, 26], [12, 24], [31, 27], [34, 30], [63, 34], [68, 32],
            [65, 50], [61, 55], [17, 49], [14, 46]], '#245d88');
        p.polygon([[11, 26], [13, 25], [30, 28], [33, 31], [63, 35], [60, 52], [17, 47], [14, 44]], '#549bc5');
        p.polygon([[12, 27], [29, 29], [32, 32], [61, 36], [60, 40], [14, 34]], '#6db5d4');
        p.polygon([[15, 36], [60, 42], [59, 50], [18, 45]], '#4e8eb9');
        p.path([[11, 26], [29, 29], [32, 31], [62, 35]], '#a8e1e3');
        p.path([[15, 44], [18, 47], [59, 53], [62, 52]], '#7bbbcf');
        p.path([[63, 35], [60, 51]], '#91cadd');
        p.polygon([[20, 39], [31, 41], [31, 43], [20, 42]], '#93d2dc');
    }

    function drawController(p) {
        const cable = [[47, 27], [48, 22], [47, 18], [42, 15], [40, 12], [42, 9],
            [47, 8], [52, 9], [57, 12], [62, 13], [65, 12], [67, 9], [67, 7]];
        p.path(cable.map(([x, y]) => [x, y + 1]), '#293e59');
        p.path(cable, '#8aacc0');
        p.polygon([[9, 45], [28, 51], [58, 52], [72, 57], [79, 53], [74, 46], [28, 37]], 'rgba(2, 8, 19, 0.45)');
        const shape = [[12, 31], [18, 23], [24, 20], [34, 19], [41, 22], [55, 24],
            [62, 23], [69, 24], [76, 29], [79, 36], [78, 45], [73, 51], [66, 52],
            [60, 49], [56, 44], [36, 41], [29, 42], [22, 47], [14, 47], [9, 43], [9, 38]];
        p.polygon(shape.map(([x, y]) => [x, y + 3]), '#354960');
        p.polygon(shape.map(([x, y]) => [x, y + 1]), '#75899b');
        p.polygon(shape, '#b4c4cd');
        p.polygon([[12, 33], [19, 24], [25, 21], [32, 20], [39, 23], [54, 26],
            [60, 24], [67, 25], [73, 28], [77, 33], [77, 38], [73, 43], [66, 45],
            [60, 42], [56, 39], [34, 35], [27, 38], [21, 44], [13, 44], [10, 40]], '#d2d9d8');
        p.path([[10, 36], [14, 29], [21, 23], [26, 21], [32, 21]], '#f0eddb');
        p.path([[40, 24], [54, 26], [60, 25], [68, 26]], '#e6e9dc');
        p.path([[14, 46], [20, 46], [28, 41]], '#a1b3be');
        p.path([[61, 47], [67, 50], [72, 49], [77, 44]], '#8d9eaf');
        // A cross-shaped thumb pad seated in a circular recess.
        p.polygon([[18, 30], [22, 27], [28, 26], [34, 28], [35, 32], [33, 36],
            [28, 38], [22, 37], [18, 34]], '#9faebb');
        p.polygon([[24, 27], [29, 28], [29, 31], [34, 31], [33, 35], [28, 34],
            [27, 38], [23, 37], [24, 33], [19, 33], [20, 30], [24, 31]], '#34485c');
        p.path([[20, 31], [25, 31], [25, 28], [28, 29]], '#7b8e9b');
        p.path([[29, 32], [32, 32]], '#708596');
        // Pairs of indigo and cyan action buttons, diagonally staggered.
        function button(x, y, deep, face, glint) {
            const pad = [[x + 1, y], [x + 4, y], [x + 6, y + 2],
                [x + 5, y + 4], [x + 1, y + 5], [x - 1, y + 3], [x - 1, y + 1]];
            p.polygon(pad.map(([u, v]) => [u, v + 1]), deep);
            p.polygon(pad, face);
            p.line([x + 1, y], [x + 3, y], glint);
        }
        button(65, 28, '#5e5b82', '#8b83b6', '#c6b9e4');
        button(58, 32, '#5c5d84', '#a69cc9', '#d1c5e5');
        button(70, 34, '#365b79', '#668fa4', '#a5c7cd');
        button(64, 39, '#45647e', '#85abb8', '#d2ded5');
        p.line([39, 33], [42, 31], '#738794');
        p.line([45, 34], [48, 32], '#738794');
        p.line([39, 34], [42, 32], '#495f73');
        p.line([45, 35], [48, 33], '#495f73');
    }

    function drawDisc(p) {
        const cx = 44, cy = 31;
        const bands = [
            [12, '#cbd8dc'], [22, '#bdc8dc'], [35, '#929fc8'], [46, '#a69dc6'],
            [57, '#cca8c5'], [63, '#f5d4cb'], [69, '#e7e1bf'], [75, '#b9dcbf'],
            [84, '#a1d9cd'], [95, '#93bbc8'], [123, '#a9bbcc'], [142, '#c8d2da'],
            [161, '#e8e7da'], [172, '#dce7dc'], [184, '#b7cbd4'], [198, '#96b5cc'],
            [213, '#879bc4'], [227, '#9797c3'], [236, '#bea7d0'], [244, '#dfb6cf'],
            [251, '#e3c8c5'], [258, '#d1d4b7'], [266, '#a4cdbb'], [279, '#8abcc5'],
            [300, '#829cb5'], [319, '#94acc0'], [334, '#bbcbd4'], [346, '#f0eddb'], [360, '#dce2db'],
        ];
        const geometry = (x, y) => {
            const ny = (y - cy) / 23;
            const nx = (x - cx + (y - cy) * 0.31) / 29;
            return [Math.hypot(nx, ny), (Math.atan2(ny, nx) * 180 / Math.PI + 360) % 360];
        };
        p.polygon([[13, 43], [23, 51], [49, 58], [66, 54], [76, 46], [63, 37]], 'rgba(2, 8, 19, 0.42)');
        for (let y = 7; y <= 57; y++) {
            for (let x = 12; x <= 76; x++) {
                const [rimRadius] = geometry(x, y - 2);
                if (rimRadius <= 1.01 && rimRadius >= 0.17) p.dot(x, y, '#627894');
                const [radius, angle] = geometry(x, y);
                if (radius > 1 || radius < 0.162) continue;
                let color;
                if (radius > 0.962) color = angle < 175 ? '#a5b7c5' : '#edf1e2';
                else if (radius < 0.21) color = angle < 200 ? '#c2d2d4' : '#698698';
                else if (radius < 0.32) color = angle < 180 ? '#8498ab' : '#aebdc4';
                else if (radius < 0.36) color = angle < 125 ? '#d1dad4' : '#93a6b5';
                else {
                    const reflectedAngle = (angle + Math.sin(radius * 13) * 1.3 + 360) % 360;
                    color = bands.find(([end]) => reflectedAngle <= end)[1];
                    if (radius > 0.85 && (radius * 100 | 0) % 5 === 0 && (angle < 40 || angle > 315)) color = '#d4dcda';
                }
                p.dot(x, y, color);
            }
        }
        p.path([[28, 16], [31, 14], [35, 13]], '#edf0df');
        p.path([[19, 23], [22, 20]], '#e6eddf');
        p.path([[55, 48], [59, 47], [63, 45]], '#dacbd7');
    }

    function drawEnvelope(p) {
        p.polygon([[11, 47], [60, 58], [78, 52], [31, 41]], 'rgba(2, 8, 19, 0.44)');
        p.polygon([[11, 31], [37, 12], [42, 10], [47, 11], [71, 33], [70, 51], [64, 55], [15, 47]], '#52728b');
        p.polygon([[12, 30], [38, 12], [43, 11], [47, 13], [71, 32], [64, 41], [19, 36]], '#87aebb');
        p.path([[13, 30], [38, 13], [42, 12], [45, 13], [68, 31]], '#b3d0cf');
        p.polygon([[16, 30], [40, 16], [44, 16], [65, 31], [61, 39], [21, 35]], '#7295a7');
        p.polygon([[22, 16], [51, 17], [59, 24], [60, 42], [22, 39]], '#7894a9');
        p.polygon([[22, 14], [51, 16], [58, 22], [59, 40], [21, 38]], '#e8e9dc');
        p.path([[21, 36], [22, 14], [50, 16]], '#fff0d9');
        p.polygon([[51, 16], [58, 22], [51, 21]], '#aec1c8');
        p.path([[28, 21], [45, 22]], '#86a0af');
        p.path([[28, 24], [50, 26]], '#a4b6bc');
        p.path([[28, 28], [46, 29]], '#a4b6bc');
        // The envelope's front has two folded blue-grey side flaps.
        p.polygon([[11, 28], [34, 39], [43, 40], [71, 30], [69, 50], [66, 54], [13, 47]], '#92aeb9');
        p.polygon([[12, 29], [35, 40], [15, 46]], '#d4ded8');
        p.polygon([[70, 31], [68, 50], [45, 41]], '#afc5ca');
        p.polygon([[13, 47], [36, 38], [41, 38], [68, 51], [66, 53], [16, 47]], '#e0e4d9');
        p.path([[13, 29], [34, 39]], '#f2ecda');
        p.path([[16, 46], [35, 39], [40, 39]], '#f5ecd6');
        p.path([[43, 40], [67, 51]], '#b4c4c4');
        p.path([[47, 40], [68, 32]], '#dce5d8');
        p.path([[15, 47], [65, 53]], '#a5bdc4');
    }

    const drawings = {
        terminal: drawTerminal, profile: drawFolder, play: drawController,
        disc: drawDisc, mail: drawEnvelope,
    };

    function paint(canvas, powered = true) {
        const kind = canvas.dataset.art;
        const draw = drawings[kind];
        const context = canvas.getContext('2d');
        if (!draw || !context) return;
        canvas.width = kind === 'terminal' ? 312 : 88;
        canvas.height = kind === 'terminal' ? 212 : 64;
        draw(new PixelPainter(context), powered);
    }

    window.ProfileArt = {
        setPower(canvas, enabled) {
            if (canvas && canvas.dataset.art === 'terminal') paint(canvas, Boolean(enabled));
        },
    };
    document.querySelectorAll('canvas[data-art]').forEach(canvas => paint(canvas));
})();
