
const InitGameBoard = [
    '车 马 相 士 帅 士 相 马 车'.split(' '),
    'ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ'.split(' '),
    'ⓧ 炮 ⓧ ⓧ ⓧ ⓧ ⓧ 炮 ⓧ'.split(' '),
    '兵 ⓧ 兵 ⓧ 兵 ⓧ 兵 ⓧ 兵'.split(' '),
    'ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ'.split(' '),
    'ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ'.split(' '),
    '卒 ⓧ 卒 ⓧ 卒 ⓧ 卒 ⓧ 卒'.split(' '),
    'ⓧ 砲 ⓧ ⓧ ⓧ ⓧ ⓧ 砲 ⓧ'.split(' '),
    'ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ ⓧ'.split(' '),
    '車 馬 象 仕 將 仕 象 馬 車'.split(' '),
];

const items = (() => {
    const keys = 'P N B R K A C p n b r k a c'.split(' ');
    const values = '兵 马 相 车 帅 仕 炮 卒 馬 象 車 將 士 砲'.split(' ');
    const m = keys.reduce((m, k, i) => m.set(k, values[i]), new Map());
    return m;
})();

const redItems = (() => {
    const keys = '兵 马 相 车 帅 士 炮'.split(' ');
    const values = 'P N B R K A C'.split(' ');
    const m = keys.reduce((m, k, i) => m.set(k, values[i]), new Map());
    return m;
})();
const blackItems = (() => {
    const keys = '卒 马 象 车 将 士 炮'.split(' ');
    const values = 'p n b r k a c'.split(' ');
    const m = keys.reduce((m, k, i) => m.set(k, values[i]), new Map());
    return m;
})();
const AllItems = (() => {
    const keys = '兵 马 相 车 帅 士 炮 卒 象 将'.split(' ');
    const values = 'p n b r k a c p b k'.split(' ');
    const m = keys.reduce((m, k, i) => m.set(k, values[i]), new Map());
    return m;
})();

const EmptyItem = '.';
const ActionLeap = '进';
const ActionRetreat = '退';
const ActionShift = '平';

function fen2board(fenString) {
    const rows = fenString.split('/');
    const board = [];
    for (const row of rows) {
        const boardRow = [];
        for (const char of row) {
            if (char >= '1' && char <= '9') {
                for (let i = 0; i < parseInt(char); i++) {
                    boardRow.push(EmptyItem);
                }
            } else {
                boardRow.push(char);
            }
        }
        board.push(boardRow);
    }
    return board;
}

class MoveParser {
    constructor() {
        this.board = [];
    }
    setBoard(board) {
        this.board = board;
    }
    parse(move) {
        let [piece, pos, act, target] = move.split('');
        let index = '';
        const isBlack = /[１２３４５６７８９]/.test(target);
        if (['前', '后', '中', '一', '二', '三', '四', '五'].indexOf(piece) >= 0) {
            index = move[0]
            piece = move[1]
            pos = '';
        }
        piece = AllItems.get(piece);
        if (!isBlack) {
            piece = piece.toUpperCase();
        }
        const col = this.pos2col(pos);
        const locs = this.findPieceLocations(piece, this.board, col);
        const startLoc = this.filterPieceLoc(piece, locs, index, act, isBlack);
        const endLoc = [0, 0];

        if (['p', 'P', 'c', 'C', 'r', 'R', 'k', 'K'].indexOf(piece) >= 0) {
            if (act == ActionLeap) {
                const step = this.parseSteps(target);
                endLoc[0] = startLoc[0] + step * (isBlack ? 1 : -1);
                endLoc[1] = startLoc[1];
            }
            else if (act == ActionRetreat) {
                const step = this.parseSteps(target);
                endLoc[0] = startLoc[0] + step * (isBlack ? -1 : 1);
                endLoc[1] = startLoc[1];
            }
            else if (act == ActionShift){
                const col = this.pos2col(target);
                endLoc[0] = startLoc[0];
                endLoc[1] = col;
            }
        }
        else if (['n', 'N', 'b', 'B', 'a', 'A'].indexOf(piece) >= 0) {
            const col = this.pos2col(target);
            const dy = col - startLoc[1];
            const d = (() => {
                if (piece == 'n' || piece ==  'N') {
                    return 3;
                }
                else if (piece == 'b' || piece == 'B') {
                    return 4;
                }
                else if (piece == 'a' || piece == 'A') {
                    return 2;
                }
            })();
            const dx = d - Math.abs(dy);
            const isForward = act == ActionLeap;
            endLoc[0] = startLoc[0] + dx * (isBlack ? 1 : -1) * (isForward ? 1 : -1);
            endLoc[1] = col;
        }
        return {
            piece, startLoc, endLoc, move, isBlack
        }
    }
    pos2col(pos) {
        const posMap = new Map([
            ['一', 9], ['二', 8], ['三', 7], ['四', 6], ['五', 5], ['六', 4], ['七', 3], ['八', 2], ['九', 1],
            ['１', 1], ['２', 2], ['３', 3], ['４', 4], ['５', 5], ['６', 6], ['７', 7], ['８', 8], ['９', 9],
        ]);
        return (posMap.get(pos) || 0) - 1;
    }
    parseSteps(step) {
        const stepMap = new Map([
            ['一', 1], ['二', 2], ['三', 3], ['四', 4], ['五', 5], ['六', 6], ['七', 7], ['八', 8], ['九', 9],
            ['１', 1], ['２', 2], ['３', 3], ['４', 4], ['５', 5], ['６', 6], ['７', 7], ['８', 8], ['９', 9],
        ]);
        return stepMap.get(step);
    }
    filterPieceLoc(piece, locs, index, act, isBlack) {
        let loc;
        if (locs.length > 1) {
            if (piece == 'a' || piece == 'b' || piece == 'A' || piece == 'B') {
                index = act == ActionLeap ? '后' : '前';
            }
            if (index == '前') {
                loc = isBlack ? locs[locs.length - 1] : locs[0];
            }
            else if (index == '后') {
                loc = isBlack ? locs[0] : locs[locs.length - 1];
            }
            else if (index == '中' && locs.length === 3) {
                loc = locs[1];
            }
        }
        else {
            loc = locs[0];
        }
        // todo: 处理兵卒的一二三四五
        return loc;
    }
    findPieceLocations(piece, board, col=-1) {
        const locs = []
        for (let i = 0; i < board.length; i++) {
            for (let j = 0; j < board[i].length; j++) {
                if (board[i][j] == piece && (col == -1 || col == j)) {
                    locs.push([i, j]);
                }
            }
        }
        return locs;
    }
}

class ChineseChess {
    constructor(fen=null) {
        this.gameBoard = [];
        if (fen) {
            this.loadFromFEN(fen);
        }
        this.moveParser = new MoveParser();
    }
    loadFromFEN(fen) {
        this.gameBoard = fen2board(fen.split(' ')[0]);
    }
    toFEN() {
        return this.gameBoard.map(row => row.reduce((p, c, i) => {
            if (c == '.') {
                p.n++;
            }
            else {
                if (p.n > 0) {
                    p.s = p.s + p.n;
                }
                p.s = p.s + c;
                p.n = 0;
            }
            if (i === 8 && p.n > 0) {
                p.s = p.s + p.n;
            }
            return p;
        }, {s: "", n: 0}).s).join('/');
    }

    toString() {
        return this.gameBoard.map(row => row.join('')).join('\n');
    }
    toChineseString() {
        const s = this.toString();
        return s.split('').map((c, i) => {
            if (c == '\n') {
                return c;
            }
            else if (c == EmptyItem) {
                if (i === 0) { return '┌──'; }
                else if (i === 8) {return '──┐'; }
                else if (i === 90) {return '└──'; }
                else if (i === 98) {return '──┘'; }
                else if (i === 14 || i === 84) {return '─※─'; }
                else if (i < 10) {return '─┬─'; }
                else if (i > 90) {return '─┴─'; }
                else if (i % 10 === 0) {return '├──'; }
                else if (i % 10 === 8) {return '──┤'; }
                else return '─┼─';
            }
            else {
                const ch = items.get(c);
                if (i % 10 === 8) {
                    return '─' + ch;
                }
                return ch + '─';
            }
        }).join('');
    }
    parseChineseInstruct(instruct) {
        this.moveParser.setBoard(this.gameBoard);
        return this.moveParser.parse(instruct);
    }
    checkMove(move) {
        const [sx, sy] = move.startLoc;
        const [ex, ey] = move.endLoc;
        if (this.gameBoard[sx][sy] == move.piece) {

        };
        return false;
    }
    getPiece(row, col) {
        return this.gameBoard[row][col];
    }
    play(move) {
        const [sx, sy] = move.startLoc;
        const [ex, ey] = move.endLoc;
        const e = this.gameBoard[sx][sy]
        this.gameBoard[ex][ey] = e;
        this.gameBoard[sx][sy] = EmptyItem;
    }
}

class GameLogic {
    constructor () {
        this.cc = new ChineseChess();
        this.cc.loadFromFEN("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR");
    }
    playNumberCommand(command) {
        if (command.length % 4 !== 0) {
            return;
        }
        for (let i = 0; i < command.length; i += 4) {
            const move = {
                startLoc: [command.codePointAt(i) - 48, command.codePointAt(i + 1) - 48],
                endLoc: [command.codePointAt(i + 2) - 48, command.codePointAt(i + 3) - 48]
            }
            this.cc.play(move);
            console.log(this.cc.toChineseString());
            console.log("=====")
        }
    }
}

function test() {
const cc = new ChineseChess("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR");
cc.loadFromFEN("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR ")

console.log(cc.toString());
console.log(cc.toChineseString());
console.log(cc.toFEN());

const instructs = "炮八平五 炮８平５ 炮五进五 象７进５ 炮二平五 马８进７ 马二进三 车９平８ 马八进七 马２进１ 车九平六 车１平２".split(' ');
for (let ins of instructs) {
    let move = cc.parseChineseInstruct(ins);
    console.log(move);
    cc.play(move);
    console.log(cc.toChineseString());
}
// console.log(cc.parseChineseMove("前炮退二"));
}

function test2() {
    const t = "62522122777402249776324298974252927008187434031470520113345400017172072897471815722227224743133243333240918340619091154591713848665628473332222352744543836243639584230354446140444101023202240241440224624140615646476646366343716143444133032361011403012105142123443423133436331236321233304074563242131242431232"
    const s = "23241727724229477062262580702524200289884246394802241938464409191222798770758858222777277535382635362605103105130010585510128685636487753626273724425535312335335041373944451305451519292629472915452947231505136465756365663335121335451536393713194839191759481737454637384666362866262836060542642625382825352826"
    const tt = [];
    for (let i = 0; i < s.length / 2; i++) {
        // console.log("ddd", s.charAt(2 * i + 1), s.charAt(2 * i), (9 - parseInt(s.charAt(2 * i+1))) + s[2 * i]);
        tt.push((9 - parseInt(s[2 * i+1])) + s[2 * i]);
        // (9-parseInt(aDHJ[34].charAt(i*2+1)))+aDHJ[34].charAt(i*2)
    }
    const f = tt.join('');
    console.log(f, f == t, s);
}
// test2();
function test3() {
    const gl = new GameLogic();
    gl.playNumberCommand("62522122777402249776324298974252927008187434031470520113345400017172072897471815722227224743133243333240918340619091154591713848665628473332222352744543836243639584230354446140444101023202240241440224624140615646476646366343716143444133032361011403012105142123443423133436331236321233304074563242131242431232")
}
test3();
