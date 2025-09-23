// --- グローバル変数 ---
let myToken = null;
let myRole = null;
let ws = null;
let roomId = null;

// --- modal utility ---
function showModal(message, callback) {
  const modal = document.getElementById("modal");
  const msgEl = document.getElementById("modal-message");
  msgEl.textContent = message;
  modal.style.display = "flex";

  const okBtn = document.getElementById("modal-ok");
  const handler = () => {
    modal.style.display = "none";
    okBtn.removeEventListener("click", handler);
    if (callback) callback();
  };
  okBtn.addEventListener("click", handler);
}

// --- UI 更新関数 ---
function renderBoard(board) {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
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
      }

      // --- クリックで move 送信 ---
      cellEl.addEventListener("click", () => {
        if (!myToken || myRole === "observer") {
          console.warn("Observer or no token, cannot move");
          return;
        }
        ws.send(JSON.stringify({
          event: "move",
          token: myToken,
          x, y
        }));
      });

      boardEl.appendChild(cellEl);
    });
  });
}

function renderStatus(status, black, white) {
  const s = document.getElementById("status");
  s.textContent = `Status: ${status}, Black: ${black}, White: ${white}, You: ${myRole || "?"}`;
}

// --- 実行部分 ---
(async () => {
  const params = new URLSearchParams(location.search);
  roomId = params.get("id");
  const seat = params.get("seat") || "observer";

  ws = new WebSocket(`wss://${location.host}/${roomId}/ws`);

  // --- token を 1秒有効にする ---
  const saved = sessionStorage.getItem(`room-${roomId}-token`);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Date.now() - parsed.savedAt < 1000) {
        myToken = parsed.token;
      } else {
        sessionStorage.removeItem(`room-${roomId}-token`);
      }
    } catch {
      sessionStorage.removeItem(`room-${roomId}-token`);
    }
  }

  // --- WebSocket ---
  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ event: "join", seat, token: myToken }));
  });

  ws.addEventListener("message", (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.event === "ping") return;
      console.log("recv:", msg);

      const debug = document.getElementById("log");
      debug.textContent += `[${msg.event}] ${JSON.stringify(msg.data)}\n`;

      if (msg.event === "join") {
        if (msg.data.token) {
          myToken = msg.data.token;
          sessionStorage.setItem(`room-${roomId}-token`, JSON.stringify({
            token: myToken,
            savedAt: Date.now()
          }));
        }
        if (msg.data.role) {
          myRole = msg.data.role;
          document.getElementById("role").textContent = "You are " + myRole;
        }
        if (msg.data.board) {
          renderBoard(msg.data.board);
        }
        if (msg.data.status) {
          renderStatus(msg.data.status, msg.data.black, msg.data.white);
        }
      } else if (msg.event === "move") {
        if (msg.data.error) {
          showModal(msg.data.error);
        } else if (msg.data.board) {
          renderBoard(msg.data.board);
          renderStatus(msg.data.status, msg.data.black, msg.data.white);
        }
      } else if (msg.event === "leave") {
        const { board, status, black, white } = msg.data;
        if (board) renderBoard(board);
        renderStatus(status, black, white);

        if ((myRole === "black" && black && !white) ||
            (myRole === "white" && white && !black)) {
          showModal("Opponent has left", () => {
            ws.send(JSON.stringify({ event: "join", token: myToken }));
          });
        }
      } else if (msg.event === "error") {
        showModal(msg.data.reason || "An error occurred");
      }
    } catch (e) {
      console.error("invalid message:", evt.data);
    }
  });

  // --- ロビーへボタン ---
  document.getElementById("to-lobby").addEventListener("click", (e) => {
    e.preventDefault();
    if (myToken) {
      ws.send(JSON.stringify({ event: "leave", token: myToken }));
      sessionStorage.removeItem(`room-${roomId}-token`);
    }
    window.location.href = "/";
  });

  // --- ページが閉じる直前に savedAt を更新 ---
  window.addEventListener("pagehide", () => {
    if (myToken) {
      sessionStorage.setItem(`room-${roomId}-token`, JSON.stringify({
        token: myToken,
        savedAt: Date.now()
      }));
    }
  });
})();