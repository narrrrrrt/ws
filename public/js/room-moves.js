/**
 * 指定された盤面と手番カラーから合法手を返す
 * @param {string[]} board - 8行の文字列配列（"........", "B..W...." など）
 * @param {"black"|"white"} color - 自分の手番 ("black" or "white")
 * @returns {{x:number, y:number}[]} - 打てるマスの配列
 */
function getValidMoves(board, color) {
  const size = 8;
  const myDisc = color === "black" ? "B" : "W";
  const oppDisc = color === "black" ? "W" : "B";
  const moves = [];

  const directions = [
    { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
    { dx: -1, dy: 0 },                   { dx: 1, dy: 0 },
    { dx: -1, dy: 1 },  { dx: 0, dy: 1 },  { dx: 1, dy: 1 }
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== ".") continue; // 空マスのみ

      let valid = false;

      for (const { dx, dy } of directions) {
        let nx = x + dx;
        let ny = y + dy;
        let foundOpp = false;

        // まず隣が相手の石でなければダメ
        if (
          nx < 0 || nx >= size || ny < 0 || ny >= size ||
          board[ny][nx] !== oppDisc
        ) continue;

        // 相手の石を挟んで自分の石に届くかどうかチェック
        while (true) {
          nx += dx;
          ny += dy;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) break;

          if (board[ny][nx] === oppDisc) {
            foundOpp = true;
            continue;
          }
          if (board[ny][nx] === myDisc) {
            valid = true;
          }
          break;
        }

        if (valid) break;
      }

      if (valid) {
        moves.push({ x, y });
      }
    }
  }

  return moves;
}