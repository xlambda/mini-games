'use client'
import Image from 'next/image'
import styles from './page.module.css'
import { useRef, useEffect, useState } from 'react'
import { ChineseChess, isRedItem, boardStr2fen, parseBoardStr, parseMoveStr } from '@/games/chess_init'

    function easeInExpo(t, b, c, d) {
      return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
    }
    function easeInOutQuart (t, b, c, d) {
      if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
      return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
    }
    function easeInQuint (t, b, c, d) {
      return c * (t /= d) * t * t * t * t + b;
    }

const ItemState = {
  NORMAL: 0,
  SELECTED: 1,
  MOVABLE: 2,
};


function getImage(url) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}


class BoardDraw {
  constructor (canvas) {
    canvas.width = 600;
    canvas.height = 600;
    this.itemWidth = 58;
    this.context = canvas.getContext('2d');
    this.highlightPosList = [];
    this.resources = [];
    this.readyPromise = Promise.all([getImage('/board.png'), getImage('/items2.png')]).then(resources => {
      this.resources = resources;
    });;
    this.resourceIndex = new Map([
      ['K', [0, 170, 82, 251]],
      ['A', [89, 170, 170, 251]],
      ['B', [171, 170, 255, 253]],
      ['N', [256, 170, 338, 255]],
      ['C', [344, 175, 429, 258]],
      ['R', [430, 174, 512, 258]],
      ['P', [513, 174, 596, 258]],
      ['k', [0, 343, 82, 427]],
      ['a', [89, 343, 170, 427]],
      ['b', [171, 343, 255, 432]],
      ['n', [261, 343, 344, 427]],
      ['c', [344, 348, 434, 435]],
      ['r', [430, 347, 520, 433]],
      ['p', [522, 347, 605, 433]],
    ]);
    this.lastImage = null;
    this.lastHighlight = [];
  }

  ready() {
    return this.readyPromise;
  }

  drawItemByXY(item, x, y, state=ItemState.NORMAL) {
    const { context } = this;
    const d = this.itemWidth;

    if (this.resourceIndex.has(item)) {
      const [sx, sy, sx2, sy2] = this.resourceIndex.get(item);
      const sw = sx2 - sx, sh = sy2 - sy;
      context.save();
      context.beginPath();
      context.arc(x + d / 2, y + d / 2, d / 2 - 5, 0, 360);
      context.closePath();
      context.fillStyle = "white"
      context.fill();
      if (state !== ItemState.SELECTED) {
        context.strokeStyle = isRedItem(item) ? "red" : "black";
        context.lineWidth = 6;
        context.stroke();
      }
      context.restore();
      context.drawImage(this.resources[1], sx, sy, sw, sh, x, y, d, d);
    }
  }

  setHighlightList(highlightList) {
    this.highlightPosList = highlightList;
  }

  drawHighlight(row, col) {
    const d = this.itemWidth;
    const x = 40 + col * d;
    const y = 10 + row * d;
    const { context } = this;

    context.save();
    context.beginPath();
    context.moveTo(x, y + d / 3);
    context.lineTo(x, y);
    context.lineTo(x + d / 3, y);

    context.moveTo(x + 2 * d / 3, y);
    context.lineTo(x + d, y);
    context.lineTo(x + d, y + d / 3);

    context.moveTo(x + 2 * d / 3, y + d);
    context.lineTo(x + d, y + d);
    context.lineTo(x + d, y + 2 * d / 3);

    context.moveTo(x, y + 2 * d / 3);
    context.lineTo(x, y + d);
    context.lineTo(x + d / 3, y + d);
    context.moveTo(x + d / 3, y + d);

    context.closePath();
    context.strokeStyle = "red"
    context.lineWidth = 6;
    context.stroke();
    context.restore();
  }

  drawHint(row, col) {
    const { context } = this;
    const d = this.itemWidth;
    const x = 40 + col * d;
    const y = 10 + row * d;
    context.save();
    context.beginPath();
    context.arc(x + d / 2, y + d / 2, d / 4, 0, 360);
    context.closePath();
    context.fillStyle = "rgba(50, 50, 50, 0.5)";
    context.fill();
    context.strokeStyle = "green"
    context.lineWidth = 6;
    // context.stroke();
    context.restore();
  }

  drawArrow(formRow, fromCol, toRow, toCol) {
    const { context, itemWidth } = this;
    const fx = 40 + fromCol * itemWidth;
    const fy = 10 + formRow * itemWidth;
    const tx = 40 + toCol * itemWidth;
    const ty = 10 + toRow * itemWidth;
    context.save();
    context.beginPath();
    context.arc(fx + itemWidth / 2, fy + itemWidth / 2, itemWidth / 5, 0, 360);
    context.moveTo(fx + itemWidth / 2, fy + itemWidth / 2);
    context.lineTo(tx + itemWidth / 2, ty + itemWidth / 2);
    context.moveTo(tx + itemWidth / 2, ty + itemWidth / 2);
    // context.arc(tx + itemWidth / 2, ty + itemWidth / 2, itemWidth / 2, 0, 360);
    context.closePath();
    context.strokeStyle = "red"
    context.lineWidth = 10;
    context.stroke();
    context.restore();
  }

  drawBoard() {
    this.context.clearRect(0, 0, 600, 600);
    this.context.drawImage(this.resources[0], 0, 0, this.resources[0].width, this.resources[0].height, 0, 0, 600, 600);
  }

  drawItem(item, row, col, state=ItemState.NORMAL) {
    const d = this.itemWidth;
    this.drawItemByXY(item, 40 + col * d, 10 + row * d, state)
  }

  draw(items) {
    this.drawBoard();
    for (const [row, col, item] of items) {
      this.drawItem(item, row, col, ItemState.NORMAL);
    }
  }
}

const DEFAULT_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR b - - 0 1";
  let bs = "9999999949999999699999999999995299990299419999999999992747589999";
  let ms = "6961414052424030423230404939272861604041324241516061515061212838393858483839473721283738283848383938";
  bs = "8499879939996983799999999999461048994230504164999999993747999999";
  ms = "79704260837150407060415071524041523341316061304133523132524432314423313010203040614140418481414020304030813130406947484723445041442537278765476731356769393827283848283835386968484968386547";

class ChessGame {
  constructor() {
    this.draw = null;
    this.board = new ChineseChess();
    this.drawingInfo = {
      items: [],
      mouseIndicator: null,
      movingItem: null,
      lastImage: null,
      highlightList: []
    }
    this._stop = false;
    this._autoGoTimer = 0;
  }
  stop() {
    this._stop = true;
    this.stopAutoGo();
  }
  setCanvas(canvas) {
    this.draw = new BoardDraw(canvas);
  }
  async update() {
    if (!this.draw) {
      return;
    }
    await this.draw.readyPromise;
    const { lastImage, items, mouseIndicator, movingItem, highlightList } = this.drawingInfo;
    // console.log("update", items, movingItem);
    this.draw.drawBoard();
    if (lastImage) {
      // this.context.putImageData(this.lastImage, 0, 0);
    }
    if (items) {
      this.draw.draw(items);
    }
    if (movingItem) {
      const [item, x, y, fromRow, fromCol] = movingItem;
      // console.log('moving', item, x, y)
      this.draw.drawItemByXY(item, x, y);
      // this.draw.drawHighlight(fromRow, fromCol);
    }
    if (highlightList) {
      for (const [row, col] of highlightList) {
        this.draw.drawHighlight(row, col);
      }
    }
    if (mouseIndicator) {
      this.draw.drawHighlight(mouseIndicator[0], mouseIndicator[1]);
    }
  }
  loadFEN(fen) {
    this.board.loadFEN(fen);
    this.drawingInfo.items = this.board.getAllItems();
    this.update();
  }
  loadMoves(moveStr) {
    this.board.loadMoveHistory(moveStr);
  }
  getMoves() {
    return this.board.moveHistory;
  }
  showBoardBeforeMove(move) {
    this.board.clear();
    this.board.loadFEN(move.fen);
    this.drawingInfo.items = this.board.getAllItems();
    this.drawingInfo.highlightList = [];
    this.update();
  }
  showBoardAfterMove(move) {
    this.board.clear();
    this.board.loadFEN(move.fen);
    this.board.do(move);
    this.drawingInfo.items = this.board.getAllItems();
    this.drawingInfo.highlightList = [[move.fromRow, move.fromCol]];
    this.update();
  }
  animateMove(move) {
    this.board.clear();
    this.board.loadFEN(move.fen);

    this.board.removeItem(move.fromRow, move.fromCol);
    this.drawingInfo.items = this.board.getAllItems();
    this.drawingInfo.highlightList = [[move.fromRow, move.fromCol]];
    this.board.putItem(move.fromRow, move.fromCol, move.item);
    this.board.do(move);

    let startTime = 0;
    const itemWidth = 58;
    const { fromRow, fromCol, toRow, toCol } = move;
    const easingFun = easeInQuint;
    const fx = 40 + fromCol * itemWidth;
    const fy = 10 + fromRow * itemWidth;
    const tx = 40 + toCol * itemWidth;
    const ty = 10 + toRow * itemWidth;
    const dx = tx - fx;
    const dy = ty - fy;
    let lx, ly;
    const duration = 300;
    const animate = (t) => {
      if (this._stop) {
        return;
      }
      const dt = t - startTime;
      if (t > duration) {
        t = duration;
      }
      lx = easingFun(dt, fx, dx, duration);
      ly = easingFun(dt, fy, dy, duration);
      // console.log('animate', startTime, t, dt, duration, lx, ly);
      this.drawingInfo.movingItem = [move.item, lx, ly, fromRow, fromCol];
      this.update();
      if (dt >= duration) {
        this.drawingInfo.movingItem = null;
        this.drawingInfo.items = this.board.getAllItems();
        return;
      }
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(t => {
      startTime = t;
      animate(t);
    })
  }
  autoGo(index) {
    const move = this.board.moveHistory[index];
    if (move) {
      this.go(index);
      this._autoGoTimer = setInterval(() => {
        if (this._stop) {
          return;
        }
        this.go(index++);
        if (index > this.board.moveHistory.length) {
          this.stopAutoGo();
        }
      }, 2000);
    }
  }
  stopAutoGo() {
    if (this._autoGoTimer !== 0) {
      clearInterval(this._autoGoTimer);
      this._autoGoTimer = 0;
    }
  }
  go(index) {
    const moves = this.board.moveHistory;
    if (index === 0) {
      const m = moves[0];
      if (m) {
        this.showBoardBeforeMove(m);
      }
    }
    else if (index > moves.length) {
      const m = moves[moves.length - 1];
      if (m) {
        this.showBoardAfterMove(m);
      }
    }
    else {
      const m = moves[index - 1];
      if (m) {
        this.showBoardBeforeMove(m);
        this.animateMove(m);
      }
    }
  }
  onMouseMove(x, y) {
    const row = Math.floor((y - 10) / 58), col = Math.floor((x - 40) / 58);
    if (0 <= row && row <= 9 && 0 <= col && col <= 8) {
      this.drawingInfo.mouseIndicator = [row, col];
    }
    else {
      this.drawingInfo.mouseIndicator = null;
    }
    this.update();
  }
}
function ChineseChessBoard (props) {
  const canvasRef = useRef(null)
  const gameRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [moves, setMoves] = useState([]);

  useEffect(() => {
    const game = new ChessGame();
    game.loadFEN(props.fen);
    game.loadMoves(props.moveStr);
    game.setCanvas(canvasRef.current);
    game.update();
    setMoves(game.getMoves());
    gameRef.current = game;
    return () => {
      game.stop();
    }
  }, [])

  const onMouseMove = (event) => {
    const game = gameRef.current;
    if (!game) {
      return;
    }
    game.onMouseMove(event.nativeEvent.offsetX / event.target.offsetWidth * 600,
      event.nativeEvent.offsetY / event.target.offsetHeight * 600);
  }
  function go(index) {
    console.log('go', index, (new Date).getTime());
    const game = gameRef.current;
    if (index < 0) {
      index = 0;
    }
    else if (index > game.getMoves().length) {
      index = game.getMoves().length + 1;
    }
    game.go(index);
    setIndex(index);
  }
  function autoGo() {
    setAuto(true);
    go(index + 1);
  }
  function stopAuto() {
    setAuto(false);
  }
  useEffect(() => {
    console.log('effect', auto, index);
    if (auto && index < moves.length) {
      const t = setTimeout(() => go(index + 1), 2000);
      return () => {
        clearTimeout(t);
      }
    }
  }, [auto, index]);

  return (<div className={props.className}>
      <canvas ref={canvasRef} onMouseMove={onMouseMove}/>
      <button onClick={() => { stopAuto(); go(0); }}>开始</button>
      <button onClick={() => { stopAuto(); go(moves.length + 100); }}>结束</button>
      <button onClick={() => go(index - 1)}>上一步</button>
      <button onClick={() => go(index + 1)}>下一步</button>
      <button onClick={() => autoGo()}>自动走棋</button>
      <button onClick={() => stopAuto()}>停止</button>
      <h2>棋谱</h2>
      <MoveText moves={moves} go={go} index={index}/>
    </div>)
}

function toRoundList(moves) {
  const roundList = [];
  let i = 0;
  if (!isRedItem(moves[0].item)) {
    roundList.push([null, moves[0]]);
    i++;
  }
  for (; i < moves.length; i += 2) {
    roundList.push([moves[i], moves[i + 1] || null]);
  }
  return roundList;
}
function MoveText(props) {
  const { moves, index, go } = props;
  if (moves.length === 0) {
    return null;
  }
  const rounds = toRoundList(moves);
  return <div>
    <ol>{
    rounds.map(([move1, move2], ind) => <li key={ind + (move1 ? move1.text : '') + (move2 ? move2.text : '')}>
      {move1 ? <span onClick={() => go(move1.index)} className={[styles.redmove, styles.move, index == move1.index ? styles.currentmove : ''].join(' ')}>{move1.text}</span> : null}
      {move2 ? <span onClick={() => go(move2.index)} className={[styles.blackmove, styles.move, index == move2.index ? styles.currentmove : ''].join(' ')} >{move2.text}</span> : null}
      </li>)
    }</ol>
  </div>
}

export default function Home() {
  return (
    <main className={styles.main}>
      <ChineseChessBoard className={styles.board}
        fen={boardStr2fen("8499879939996983799999999999461048994230504164999999993747999999")}
        moveStr="79704260837150407060415071524041523341316061304133523132524432314423313010203040614140418481414020304030813130406947484723445041442537278765476731356769393827283848283835386968484968386547"/>
    </main>
  )
}
