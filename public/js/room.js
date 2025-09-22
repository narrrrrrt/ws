// js/room.js
let ws;
let myToken = null;
let myRole = null;
let currentBoard = null;
let currentStatus = null;

const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const modalEl = document.getElementById("modal");
const modalMsgEl = document.getElementById("modal-message");
const modalBtnEl = document.getElementById("modal-button");

function log(msg) {
  const div = document.createElement("div");
  div.textContent = msg;
  logEl.appendChild(div);
}

function showModal(message, onOk) {
  modalMsgEl.textContent = message;
  modalEl.style.display = "flex";
  modalBtnEl.onclick = () => {
    modalEl.style.display = "none";
    if (onOk) onOk();
  };
}

function connect() {
  const url = new URL(window.location.href);
  const parts = url.pathname.split("/");
  const roomId = parts[parts.length - 1];

  ws = new WebSocket(`wss://${window.location.host}/${roomId}/ws`);

  ws.onopen = () => {
    log("connected");
    let saved = JSON.parse(sessionStorage.getItem("reversiToken") || "null");
    if (saved && Date.now() - saved.savedAt < 1000) {
      myToken = saved.token;
    }
    ws.send(JSON.stringify({ event: "join", seat: url.searchParams.get("seat") || "observer", token: myToken }));
  };

  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    log("raw: " + JSON.stringify(msg));

    if (msg.event === "join") {
      if (msg.data.role) myRole = msg.data.role;
      if (msg.data.token) {
        myToken = msg.data.token;
        sessionStorage.setItem("reversiToken", JSON.stringify({ token: myToken, savedAt: Date.now() }));
      }
      if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
      }
    }

    else if (msg.event === "move") {
      if (msg.data.error) {
        showModal("Error: " + msg.data.error);
      }
      if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
      }
    }

    else if (msg.event === "leave") {
      showModal("Your opponent has left.", () => {
        ws.send(JSON.stringify({ event: "join", seat: myRole, token: myToken }));
      });
    }

    else if (msg.event === "finish") {
      let black = 0, white = 0;
      msg.data.board.forEach(row => {
        for (let c of row) {
          if (c === "B") black++;
          if (c === "W") white++;
        }
      });
      let winner = black > white ? "Black" : white > black ? "White" : "Draw";
      showModal(`Black: ${black}, White: ${white}, Winner: ${winner}`, () => {
        ws.send(JSON.stringify({ event: "join", seat: myRole, token: myToken }));
      });
    }
  };

  window.addEventListener("pagehide", () => {
    if (myToken) {
      sessionStorage.setItem("reversiToken", JSON.stringify({ token: myToken, savedAt: Date.now() }));
    }
  });
}

function renderBoard(board, status) {
  boardEl.innerHTML = "";
  const table = document.createElement("table");

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
}

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