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
      // 空マス判定を "-" に変更
      if (board[y][x] !== "-") continue;

      let valid = false;

      for (const { dx, dy } of directions) {
        let nx = x + dx;
        let ny = y + dy;

        if (
          nx < 0 || nx >= size || ny < 0 || ny >= size ||
          board[ny][nx] !== oppDisc
        ) continue;

        while (true) {
          nx += dx;
          ny += dy;
          if (nx < 0 || nx >= size || ny < 0 || ny >= size) break;

          if (board[ny][nx] === oppDisc) continue;
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