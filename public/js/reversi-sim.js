// reversi-sim.js

// 盤面に1手を打ってシミュレーションする
export function simulateMove(board, move, color) {
  // board: string[]（1行8文字の配列）
  // move: {x,y}, color: "black" | "white"
  // → 新しい盤面を返す
  const newBoard = board.map(row => row.split("")); // deep copy
  const opponent = color === "black" ? "W" : "B";
  const me = color === "black" ? "B" : "W";

  // 打った位置に自分の石を置く
  newBoard[move.y][move.x] = me;

  // 裏返し処理（8方向）
  const directions = [
    [1,0], [-1,0], [0,1], [0,-1],
    [1,1], [1,-1], [-1,1], [-1,-1]
  ];
  for (const [dx,dy] of directions) {
    let x = move.x + dx, y = move.y + dy;
    const flips = [];
    while (x >= 0 && x < 8 && y >= 0 && y < 8) {
      if (newBoard[y][x] === opponent) {
        flips.push([x,y]);
      } else if (newBoard[y][x] === me) {
        // はさんだ石を全部裏返す
        for (const [fx,fy] of flips) {
          newBoard[fy][fx] = me;
        }
        break;
      } else {
        break;
      }
      x += dx;
      y += dy;
    }
  }

  // 新しい盤面を返す
  return newBoard.map(row => row.join(""));
}

// 候補手から「角優先 → 石数ゲイン最大 → 同点ならランダム」で最善手を選ぶ
export function pickBestMove(board, moves, color) {
  if (!moves || moves.length === 0) return null;   // パス
  if (moves.length === 1) return moves[0];         // 確定

  const me = color === "black" ? "B" : "W";

  // 角の座標
  const corners = [
    {x:0, y:0}, {x:7, y:0},
    {x:0, y:7}, {x:7, y:7}
  ];

  // 角が取れるなら即決
  for (const move of moves) {
    if (corners.some(c => c.x === move.x && c.y === move.y)) {
      return move;
    }
  }

  // 通常は「増えた石の数」が最大の手
  let bestMoves = [];
  let bestGain = -1;

  for (const move of moves) {
    const newBoard = simulateMove(board, move, color);

    const oldCount = board.join("").split(me).length - 1;
    const newCount = newBoard.join("").split(me).length - 1;
    const gain = newCount - oldCount;

    if (gain > bestGain) {
      bestGain = gain;
      bestMoves = [move];
    } else if (gain === bestGain) {
      bestMoves.push(move);
    }
  }

  // 同点ならランダム
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}