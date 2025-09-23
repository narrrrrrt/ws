function renderBoard(board, status) {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";

  // --- 合法手を出す条件 ---
  let validMoves = [];
  if (myRole && myRole !== "observer" && myRole === status.toLowerCase()) {
    validMoves = getValidMoves(board, myRole);
  }
  const validMap = new Set(validMoves.map(m => `${m.x},${m.y}`));

  board.forEach((row, y) => {
    row.split("").forEach((cell, x) => {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";

      if (cell === "B") {
        const d = document.createElement("div");
        d.className = "disc black";
        cellEl.appendChild(d);
      } else if (cell === "W") {
        const d = document.createElement("div");
        d.className = "disc white";
        cellEl.appendChild(d);
      } else if (validMap.has(`${x},${y}`)) {
        // --- 合法手のガイドをオレンジの点で表示 ---
        const dot = document.createElement("div");
        dot.className = "hint-dot";
        cellEl.appendChild(dot);
      }

      // --- 合法手だけクリック可能 ---
      if (validMap.has(`${x},${y}`)) {
        cellEl.addEventListener("click", () => {
          if (!myToken || myRole === "observer") return;
          ws.send(JSON.stringify({
            event: "move",
            token: myToken,
            x, y
          }));
        });
      }

      boardEl.appendChild(cellEl);
    });
  });
}