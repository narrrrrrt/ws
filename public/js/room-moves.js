export function getValidMoves(board, color) {
  const size = 8;
  const myDisc = color === "black" ? "B" : "W";
  const oppDisc = color === "black" ? "W" : "B";
  const moves = [];

  // --- デバッグ用に盤面全体を横一列に出力 ---
  const flatBoard = board
    .map(row => (typeof row === "string" ? row : row.join("")))
    .join("");
  //debugLog(`board(${color}): ${flatBoard}`);

  const directions = [
    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },                   { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // 空マスだけ調べる
      if (board[y][x] !== "-") continue;

      let valid = false;

      for (const { dx, dy } of directions) {
        let nx = x + dx;
        let ny = y + dy;

        // まず隣が相手の石じゃないとダメ
        if (
          nx < 0 || nx >= size || ny < 0 || ny >= size ||
          board[ny][nx] !== oppDisc
        ) continue;

        // 相手の石を飛ばしながら進む
        while (true) {
          nx += dx;
          ny += dy;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) break;

          if (board[ny][nx] === oppDisc) {
            continue; // まだ相手の石 → さらに進む
          }
          if (board[ny][nx] === myDisc) {
            valid = true; // 自分の石で挟めた
          }
          break; // この方向はここで終わり
        }

        if (valid) break; // どの方向かで一つでも挟めたらOK
      }

      if (valid) {
        moves.push({ x, y });
        //debugLog(`valid move for ${color}: (${x},${y})`);
      }
    }
  }

  //debugLog(`getValidMoves(${color}) -> ${moves.length} moves`);
  return moves;
}