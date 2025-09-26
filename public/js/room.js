import { detectLanguage, loadMessages, t } from "./lang.js";

// --- グローバル変数 ---
let myToken = null;
let myRole = null;
let ws = null;
let roomId = null;
let closeFlag = false;
let seat = "observer";
let retryCount = 0;
let lang;

// --- debug utility ---
function debugLog(message) {
  const debug = document.getElementById("log");
  if (debug) {
    debug.textContent += message + "\n";
    debug.scrollTop = debug.scrollHeight; // 下までスクロール
  }
}

// --- modal utility ---
function showModal(messageKey, callback, vars = {}) {
  const modal = document.getElementById("modal");
  const msgEl = document.getElementById("modal-message");
  msgEl.textContent = t(messageKey, vars);
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

      // --- 中央4点 (2,2) (6,2) (2,6) (6,6) に接する16マスだけ角丸 ---
      // 星 (2,2)
      if (x === 1 && y === 1) cellEl.classList.add("corner-bottom-right");
      if (x === 2 && y === 1) cellEl.classList.add("corner-bottom-left");
      if (x === 1 && y === 2) cellEl.classList.add("corner-top-right");
      if (x === 2 && y === 2) cellEl.classList.add("corner-top-left");

      // 星 (6,2)
      if (x === 5 && y === 1) cellEl.classList.add("corner-bottom-right");
      if (x === 6 && y === 1) cellEl.classList.add("corner-bottom-left");
      if (x === 5 && y === 2) cellEl.classList.add("corner-top-right");
      if (x === 6 && y === 2) cellEl.classList.add("corner-top-left");

      // 星 (2,6)
      if (x === 1 && y === 5) cellEl.classList.add("corner-bottom-right");
      if (x === 2 && y === 5) cellEl.classList.add("corner-bottom-left");
      if (x === 1 && y === 6) cellEl.classList.add("corner-top-right");
      if (x === 2 && y === 6) cellEl.classList.add("corner-top-left");

      // 星 (6,6)
      if (x === 5 && y === 5) cellEl.classList.add("corner-bottom-right");
      if (x === 6 && y === 5) cellEl.classList.add("corner-bottom-left");
      if (x === 5 && y === 6) cellEl.classList.add("corner-top-right");
      if (x === 6 && y === 6) cellEl.classList.add("corner-top-left");
      // --- ここまで ---

      if (cell === "B") {
        const d = document.createElement("div");
        d.className = "disc black";
        cellEl.appendChild(d);
      } else if (cell === "W") {
        const d = document.createElement("div");
        d.className = "disc white";
        cellEl.appendChild(d);
      } else if (validMap.has(`${x},${y}`)) {
        const dot = document.createElement("div");
        dot.className = "hint-dot";
        cellEl.appendChild(dot);
      }

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

function renderStatus(status) {
  const s = document.getElementById("status");
  s.textContent = `Status: ${status}, You: ${myRole || "?"}`;
}

function connect() {
  ws = new WebSocket(`wss://${location.host}/${roomId}/ws`);

  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ event: "join", seat, token: myToken }));
  });

  ws.addEventListener("close", (event) => {
    if (closeFlag) {
      window.location.href = "/";
    } else {
      retryCount++;
      if (retryCount > 3) {
        showModal("reconnectFailed", () => {
          window.location.href = "/";
        });
      } else {
        debugLog('setTimeout(connect, 500);')
        setTimeout(connect, 500);
      }
    }
  });

  ws.addEventListener("message", (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.event === "ping") return;

      if (msg.event === "join") {
        if (msg.data.token) {
          myToken = msg.data.token
          sessionStorage.setItem(`room-${roomId}-token`, JSON.stringify({
            token: myToken,
            savedAt: Date.now()
          }));
        }
        if (msg.data.role) {
          myRole = msg.data.role;
        }
        if (msg.data.board) {
          renderBoard(msg.data.board, msg.data.status);
        }
        if (msg.data.status) {
          renderStatus(msg.data.status);
        }
      } else if (msg.event === "move") {
        if (msg.data.error) {
          showModal(msg.data.error);
        } else if (msg.data.board) {
          renderBoard(msg.data.board, msg.data.status);

          // --- ゲーム終了チェック ---
          const movesByColor = {
            black: getValidMoves(msg.data.board, "black"),
            white: getValidMoves(msg.data.board, "white"),
          };
/*
          const explanation = await requestExplanation(msg.data.board, msg.data.status, movesByColor);
          const el = document.getElementById("explain");
          if (el) el.textContent = explanation;
*/
          fetch("/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ board: msg.data.board, status: msg.data.status, lang, movesByColor })
          })
          .then(res => res.json())
          .then(data => {
            const el = document.getElementById("explain")
            const elChat = document.getElementById("chatlog")
            if (el) el.textContent = JSON.stringify(data.response, null, 2)
            if (elChat) elChat.textContent = JSON.stringify(data.chat, null, 2)
          })

          // --- ゲーム終了チェック ---
          if (movesByColor.black.length === 0 && movesByColor.white.length === 0) {
            const flat = msg.data.board.join("");
            const blackCount = flat.split("B").length - 1;
            const whiteCount = flat.split("W").length - 1;

            let winnerKey;
            if (blackCount > whiteCount) winnerKey = "blackWins";
            else if (whiteCount > blackCount) winnerKey = "whiteWins";
            else winnerKey = "draw";

            showModal(
              t("gameOver") + "\n" +
              t("scoreFormat", { black: blackCount, white: whiteCount }) + "\n" +
              t(winnerKey), () => {
                ws.send(JSON.stringify({ event: "join", token: myToken }));
              }
            );
            return;
          }

          // --- パスチェック ---
          if (msg.data.status === myRole && movesByColor[myRole].length === 0) {
            ws.send(JSON.stringify({
              event: "move",
              token: myToken,
              x: null,
              y: null
            }));
          }
        }
      } else if (msg.event === "pass") {
        // --- Pass notification from server ---
        showModal("youPassed");
      } else if (msg.event === "leave") {
        const { board, status, black, white } = msg.data;
        if (board) renderBoard(board ,status);
        renderStatus(status);

        if ((myRole === "black" && black && !white) ||
            (myRole === "white" && white && !black)) {
          showModal("opponentLeft", () => {
            ws.send(JSON.stringify({ event: "join", token: myToken }));
          });
        }
      } else if (msg.event === "error") {
        showModal(msg.data.reason || "An error occurred");
      }
    } catch (e) {
      //console.error("invalid message:", evt.data);
    }
  });
}

// --- 実行部分 ---
(async () => {
  const params = new URLSearchParams(location.search); 
  roomId = params.get("id");
  seat = params.get("seat");
  
  document.body.innerHTML = document.body.innerHTML.replaceAll("#{id}", roomId);
  
  lang = detectLanguage(params.get("lang"));

  await loadMessages(lang);

  // 起動時に「ロビーへ」を差し替え
  const lobbyLink = document.getElementById("to-lobby");
  if (lobbyLink) lobbyLink.textContent = t("toLobby");
  
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
  
  connect();
  
  // --- ロビーへボタン ---
  document.getElementById("to-lobby").addEventListener("click", (e) => {
    e.preventDefault();
    //if (myToken) {
      ws.send(JSON.stringify({ event: "leave", token: myToken }));
      sessionStorage.removeItem(`room-${roomId}-token`);
    //}
    closeFlag=true
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