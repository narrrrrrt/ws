// js/room.js
let ws;
let myToken = null;
let myRole = null;
let currentBoard = null;
let currentStatus = null;

let currentModalType = null; // "finish" | "leave" | "error" | "info" | null
let pendingLeave = false;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const modalEl = document.getElementById("modal");
const modalMsgEl = document.getElementById("modal-message");
const modalBtnEl = document.getElementById("modal-button");

// クエリパラメータから roomId / seat を取得
const url = new URL(window.location.href);
const roomId = url.searchParams.get("id");
const seat = url.searchParams.get("seat") || "observer";

function log(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  logEl.appendChild(div);
}

function showModal(message, onOk, type = null) {
  currentModalType = type;
  modalMsgEl.textContent = message;
  modalEl.style.display = "flex";
  modalBtnEl.onclick = () => {
    modalEl.style.display = "none";
    currentModalType = null;
    if (onOk) onOk();

    // finish 中に leave が来ていた場合 → OK 時に再 join
    if (type === "finish" && pendingLeave) {
      ws.send(JSON.stringify({ event: "join", token: myToken }));
      pendingLeave = false;
    }

    // leave 中に join が来ていた場合 → OK 時に再 join
    if (type === "leave" && pendingLeave) {
      ws.send(JSON.stringify({ event: "join", token: myToken }));
      pendingLeave = false;
    }
  };
}

function hideModal() {
  modalEl.style.display = "none";
  currentModalType = null;
}

function connect() {
  ws = new WebSocket(`wss://${window.location.host}/${roomId}/ws`);

  // 接続オープン
  ws.addEventListener("open", () => {
    log("connected");
    let saved = JSON.parse(sessionStorage.getItem(`reversiToken_${roomId}`) || "null");
    if (saved && Date.now() - saved.savedAt < 1000) {
      myToken = saved.token;
    }
    ws.send(JSON.stringify({ event: "join", seat, token: myToken }));
  });

  // メッセージ受信
  ws.addEventListener("message", (ev) => {
    const msg = JSON.parse(ev.data);
    log("raw: " + JSON.stringify(msg));

    if (msg.event === "join") {
      // finish/leave モーダル中なら → OK 時に再 join するのでここでは閉じない
      if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
      }
    }

    else if (msg.event === "move") {
      if (msg.data.error) {
        showModal("Error: " + msg.data.error, null, "error");
      }
      if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
      }
    }

    else if (msg.event === "leave") {
      if (currentModalType === "finish") {
        // finish 中に leave → pending フラグを立てる
        pendingLeave = true;
        return;
      }

      if (msg.data[myRole] === true) {
        showModal("Your opponent has left.", () => {
          ws.send(JSON.stringify({ event: "join", token: myToken }));
        }, "leave");
      }
    }

    else if (msg.event === "finish") {
      if (currentModalType === "leave") {
        // leave モーダル → finish 優先
        hideModal();
      }

      let black = 0, white = 0;
      msg.data.board.forEach(row => {
        for (let c of row) {
          if (c === "B") black++;
          if (c === "W") white++;
        }
      });
      let winner = black > white ? "Black" : white > black ? "White" : "Draw";

      showModal(`Black: ${black}, White: ${white}, Winner: ${winner}`, () => {
        ws.send(JSON.stringify({ event: "join", token: myToken }));
      }, "finish");
    }
  });

  // ページ遷移でトークン保存
  window.addEventListener("pagehide", () => {
    if (myToken) {
      sessionStorage.setItem(`reversiToken_${roomId}`, JSON.stringify({ token: myToken, savedAt: Date.now() }));
    }
  });
}

// 盤面描画
function renderBoard(board, status) {
  boardEl.innerHTML = "";
  const table = document.createElement("table");

  let legalMovesCount = 0;

  for (let y = 0; y < 8; y++) {
    const tr = document.createElement("tr");
    for (let x = 0; x < 8; x++) {
      const td = document.createElement("td");
      td.className = "cell";

      if (board[y][x] === "B") {
        td.innerHTML = `<div class="disc black"></div>`;
      } else if (board[y][x] === "W") {
        td.innerHTML = `<div class="disc white"></div>`;
      } else {
        // 空きマス → 合法手チェック
        if (myRole && myRole === status) {
          if (isLegalMove(board, x, y, myRole)) {
            legalMovesCount++;
            const dot = document.createElement("div");
            dot.className = "legal";
            dot.addEventListener("click", () => {
              ws.send(JSON.stringify({ event: "move", token: myToken, x, y }));
            });
            td.appendChild(dot);
          }
        }
      }
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }

  boardEl.appendChild(table);

  // 合法手ゼロで自分の手番ならパス
  if (myRole && myRole === status && legalMovesCount === 0) {
    showModal("No legal moves. Passing turn.", () => {
      ws.send(JSON.stringify({ event: "move", token: myToken, x: null, y: null }));
    }, "info");
  }
}

// 合法手判定
function isLegalMove(board, x, y, role) {
  if (board[y][x] !== "-") return false;
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
  const me = role === "black" ? "B" : "W";
  const opp = role === "black" ? "W" : "B";

  for (let [dx,dy] of dirs) {
    let nx = x+dx, ny = y+dy, foundOpp = false;
    while (nx>=0 && nx<8 && ny>=0 && ny<8) {
      if (board[ny][nx] === opp) {
        foundOpp = true;
      } else if (board[ny][nx] === me) {
        if (foundOpp) return true;
        break;
      } else {
        break;
      }
      nx += dx; ny += dy;
    }
  }
  return false;
}

connect();