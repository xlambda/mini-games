const ItemNames = new Map([
    ['p', '卒'],
    ['r', '车'],
    ['n', '马'],
    ['b', '象'],
    ['a', '士'],
    ['k', '将'],
    ['c', '炮'],
    ['P', '兵'],
    ['R', '車'],
    ['N', '馬'],
    ['B', '相'],
    ['A', '仕'],
    ['K', '帅'],
    ['C', '砲']
]);

function isRedItem(item) {
    return ['R', 'B', 'N', 'K', 'P', 'A', 'C'].includes(item);
}

class MoveTranslator {
    constructor() {
    }
    translateDistance(distance, isRed) {
        // assert 1 <= col <= 9
        return (isRed ? '一二三四五六七八九' : '１２３４５６７８９').charAt(distance - 1);
    }
    translateCol(col, isRed) {
        // assert 0 <= col < 9
        return (isRed ? '九八七六五四三二一' : '１２３４５６７８９').charAt(col);
    }
    translate([fromRow, fromCol], [toRow, toCol], item, locations) {
        const itemName = ItemNames.get(item);
        const isRed = isRedItem(item);
        let itemIndexStr = `${itemName}${this.translateCol(fromCol, isRed)}`
        const dupLocs = locations.filter(([row, col]) => col === fromCol && row !== fromRow);
        if (item == 'p' || item == 'P') {
            let pre = '';
            if (dupLocs.length === 0) {
            }
            else if (locations.length - dupLocs.length <= 2) {
                pre = '中';
                if (dupLocs.length === 1) {
                    pre = (isRed === (fromRow > dupLocs[0][0]) ? '后' : '前');
                }
                else if (dupLocs.length === 2) {
                    const firstRow = dupLocs[0][0];
                    const secondRow = dupLocs[1][0];
                    if (fromRow > firstRow && fromRow > secondRow) {
                        pre = isRed ? '后' : '前';
                    }
                    else if (fromRow < firstRow && fromRow < secondRow) {
                        pre = isRed ? '前' : '后';
                    }
                }
                else {
                    let prevNum = dupLocs.filter(([row, col]) => row < fromRow).length;
                    if (!isRed) {
                        prevNum = dupLocs.length - prevNum;
                    }
                    pre = '一二三四五'.charAt(prevNum);
                }
                itemIndexStr = `${pre}${itemName}`
            }
            else {
                const others = locations.filter(([row, col]) => col !== fromCol);
                const isDup = others.reduce((acc, [row, col]) => {
                    if (!acc.includes(col)) {
                        acc.push(col);
                    }
                    return acc;
                }, []).length < others.length;
                if (isDup) {
                    locations.sort(([row1, col1], [row2, col2]) => {
                        return (isRed ? (col1 === col2 ? row1 - row2 : col2 - col1) : (col1 === col2 ? row2 - row1 : col1 - col2));
                    });
                    for (let i = 0; i < locations.length; i++) {
                        if (locations[i][0] === fromRow && locations[i][1] === fromCol) {
                            pre = '一二三四五'.charAt(i);
                        }
                    }
                }
                itemIndexStr = `${pre}${itemName}`
            }
        }
        else if (dupLocs.length === 1) {
            const pre = (isRed === (fromRow > dupLocs[0][0]) ? '后' : '前');
            itemIndexStr = `${pre}${itemName}`
        }
        if (fromRow === toRow) {
            return `${itemIndexStr}平${this.translateCol(toCol, isRed)}`;
        }
        else {
            const act = (isRed === (fromRow > toRow) ? '进' : '退');
            if ("rRpPcCkK".includes(item)) {
                return `${itemIndexStr}${act}${this.translateDistance(Math.abs(fromRow - toRow), isRed)}`;
            }
            else { // "nNbBaA"
                return `${itemIndexStr}${act}${this.translateCol(toCol, isRed)}`;
            }
        }
    }
}

const RedSide = 0;
const BlackSide = 1;

class MoveSequence {
    constructor() {
        ;
    }
}
class ChineseChess {
    constructor() {
        this.items = new Map();
        this.currentSide = RedSide;
        this.peaceStep = 0;
        this.currentStep = 0;
        this.translator = new MoveTranslator();
        this.moves = [];
    }

    clear() {
        this.items = new Map();
        this.currentSide = RedSide;
        this.peaceStep = 0;
        this.currentStep = 0;
    }

    putItem(row, col, item) {
        this.items.set(row * 10 + col, item);
    }

    removeItem(row, col) {
        this.items.delete(row * 10 + col);
    }

    getItem(row, col) {
        return this.items.get(row * 10 + col);
    }

    apply([fromRow, fromCol], [toRow, toCol]) {
        const item = this.getItem(fromRow, fromCol);
        this.putItem(toRow, toCol, item);
        this.removeItem(fromRow, fromCol);
    }

    getItemLocations(item) {
        const locations = [];
        for (const [key, value] of this.items) {
            if (value == item) {
                locations.push([Math.floor(key / 10), key % 10]);
            }
        }
        return locations;
    }

    translateMove([fromRow, fromCol], [toRow, toCol]) {
        const item = this.getItem(fromRow, fromCol);
        const locations = this.getItemLocations(item);
        return this.translator.translate([fromRow, fromCol], [toRow, toCol], item, locations);
    }

    loadFEN(fen) {
        this.clear();
        const [f, side, _, __, pieceStep, step] = fen.split(' ');
        this.currentSide = side === 'b' ? BlackSide : RedSide;
        this.pieceStep = parseInt(pieceStep);
        this.currentStep = parseInt(step);
        let row = 0, col = 0;
        for (let ch of f.split('')) {
            if (ch === '/') {
                row++;
                col = 0;
            }
            else if (ch >= '0' && ch <= '9') {
                col += parseInt(ch);
            }
            else {
                this.putItem(row, col, ch);
                col++;
            }
        }
    }

    toFEN() {
        const f = [];
        for (let row = 0; row < 10; row++) {
            let empty = 0;
            for (let col = 0; col < 9; col++) {
                const item = this.items.get(row * 10 + col);
                if (item) {
                    if (empty > 0) {
                        f.push(empty);
                        empty = 0;
                    }
                    f.push(item);
                }
                else {
                    empty++;
                }
            }
            if (empty > 0) {
                f.push(empty);
            }
            f.push('/');
        }
        f.pop();
        return `${f.join('')} ${this.currentSide === RedSide ? 'r' : 'b'} - - ${this.peaceStep} ${this.currentStep}`;
    }

    toString() {
        const f = [];
        for (let row = 0; row < 10; row++) {
            for (let col = 0; col < 9; col++) {
                let item = this.items.get(row * 10 + col);
                let ch = '─┼─';
                if (item) {
                    ch = ItemNames.get(item);
                    if (col === 8) {
                        ch = '─' + ch;
                    }
                    else {
                        ch = ch + '─';
                    }
                }
                else {
                    if (row === 0 && col === 0) { ch = '┌──'; }
                    else if (row === 0 && col === 8) {ch = '──┐'; }
                    else if (row === 9 && col === 0) {ch = '└──'; }
                    else if (row === 9 && col === 8) {ch = '──┘'; }
                    else if ((row === 1 || row === 8) && col === 4) {ch = '─※─'; }
                    else if (col === 0) {ch = '├──'; }
                    else if (col === 8) {ch = '──┤'; }
                    else if (row === 0 || row === 5) {ch = '─┬─'; }
                    else if (row === 9 || row === 4) {ch = '─┴─'; }
                }
                f.push(ch);
            }
            f.push('\n');
        }
        return f.join('');
    }
}

const ItemMap = new Map([
    [0, "R"], [1, "N"], [2, "B"], [3, "A"], [4, "K"], [5, "A"], [6, "B"], [7, "N"], [8, "R"], [9, "C"], [10, "C"], [11, "P"], [12, "P"], [13, "P"], [14, "P"], [15, "P"],
    [16, "r"], [17, "n"], [18, "b"], [19, "a"], [20, "k"], [21, "a"], [22, "b"], [23, "n"], [24, "r"], [25, "c"], [26, "c"], [27, "p"], [28, "p"], [29, "p"], [30, "p"], [31, "p"]
]);
function parseInitBoard(boardStr) {
    // assert boardStr.length === 64
    const board = new ChineseChess();
    for (let i = 0; i < 32; i++) {
        const row = parseInt(boardStr[i * 2]);
        const col = parseInt(boardStr[i * 2 + 1]);
        if (!(row === 9 && col === 9)) {
            board.putItem(col, row, ItemMap.get(i));
        }
    }
    console.log(board.items, board.toFEN());
    return board;
}

function parseChessMove(board, moveStr) {
    // assert moveStr.length % 4 === 0
    const moves = [];
    for (let i = 0; i < moveStr.length; i += 4) {
        const fromCol = (parseInt(moveStr[i]));
        const fromRow = (parseInt(moveStr[i + 1]));
        const toCol = (parseInt(moveStr[i + 2]));
        const toRow = (parseInt(moveStr[i + 3]));
        const m = board.translateMove([fromRow, fromCol], [toRow, toCol])
        board.apply([fromRow, fromCol], [toRow, toCol]);
        moves.push(m);
    }
    return moves;
}

function test() {
parseInitBoard("8499879939996983799999999999461048994230504164999999993747999999")
let board = parseInitBoard("9999999949999999699999999999995299990299419999999999992747589999")

parseChessMove(board, "6961414052424030423230404939272861604041324241516061515061212838393858483839473721283738283848383938")
console.log(board.toString());

board.clear();
board.putItem(0, 0, 'p');
board.putItem(1, 0, 'p');
board.putItem(2, 0, 'p');
board.putItem(3, 0, 'p');
parseChessMove(board, "0010011110201121");
console.log(board.toString());

board.clear();
board.loadFEN("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1");
parseChessMove(board, "774712428988")
console.log(board.toFEN());
console.log(board.toString());
}