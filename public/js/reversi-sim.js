// reversi-sim.js

// 盤面に1手を打ってシミュレーションする
export function simulateMove(board, move, color) {
  // board: string[]（1行8文字の配列）
  // move: {x,y}, color: "black" | "white"
  // → 新しい盤面を返す
  const newBoard = board.map(row => row.split("")); // deep copy
  const opponent = color === "black" ? "W" : "B";
  const me = color === "black" ? "B" : "W";

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

  return newBoard.map(row => row.join(""));
}

// 候補手から「取れる石が一番多い手」を選ぶ
export function pickBestMove(board, moves, color) {
  if (!moves || moves.length === 0) return null;   // パス
  if (moves.length === 1) return moves[0];         // 確定

  let bestMoves = [];
  let bestScore = -1;
  const me = color === "black" ? "B" : "W";

  for (const move of moves) {
    const newBoard = simulateMove(board, move, color);

    // 「増えた石の数」をスコアにする
    const oldCount = board.join("").split(me).length - 1;
    const newCount = newBoard.join("").split(me).length - 1;
    const gain = newCount - oldCount;

    if (gain > bestScore) {
      bestScore = gain;
      bestMoves = [move];
    } else if (gain === bestScore) {
      bestMoves.push(move);
    }
  }

  // 同点ならランダム
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}