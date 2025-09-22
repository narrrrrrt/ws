// js/room.js

let ws;
let myRole = null;
let myToken = null;
let currentBoard = null;
let currentStatus = null;
let currentModalType = null;
let pendingLeave = false;

const boardEl = document.querySelector(".board");
const statusEl = document.getElementById("status");
const modalEl = document.getElementById("modal");
const modalContentEl = document.getElementById("modalContent");
const logEl = document.getElementById("log");

// ---------- util ----------
function log(msg) {
  logEl.textContent += msg + "\n";
  logEl.scrollTop = logEl.scrollHeight;
}

function showModal(message, onOk, type) {
  currentModalType = type;
  modalContentEl.innerHTML = `
    <p>${message}</p>
    <button id="modalOk">OK</button>
  `;
  modalEl.style.display = "flex";
  document.getElementById("modalOk").onclick = () => {
    modalEl.style.display = "none";
    currentModalType = null;
    if (type === "leave" || pendingLeave) {
      pendingLeave = false;
      sendJoin(myRole, myToken);
    } else if (type === "finish") {
      sendJoin(myRole, myToken);
    } else if (type === "pass") {
      sendMove(null, null); // パス送信
    }
    if (onOk) onOk();
  };
}

function hideModal() {
  modalEl.style.display = "none";
  currentModalType = null;
}

// ---------- board rendering ----------
function renderBoard(board, status) {
  boardEl.innerHTML = "";
  const legalMoves = getLegalMoves(board, status);

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (board[y][x] === "B") {
        const disc = document.createElement("div");
        disc.className = "disc black";
        cell.appendChild(disc);
      } else if (board[y][x] === "W") {
        const disc = document.createElement("div");
        disc.className = "disc white";
        cell.appendChild(disc);
      } else {
        const move = legalMoves.find(m => m.x === x && m.y === y);
        if (move) {
          const hint = document.createElement("div");
          hint.className = "hint";
          hint.addEventListener("click", () => {
            sendMove(x, y);
          });
          cell.appendChild(hint);
        }
      }

      boardEl.appendChild(cell);
    }
  }
}

// ---------- move calc ----------
function getLegalMoves(board, status) {
  if (status !== myRole) return [];
  const moves = [];
  const dirs = [
    [1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]
  ];
  const myDisc = status === "black" ? "B" : "W";
  const oppDisc = status === "black" ? "W" : "B";

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] !== "-") continue;
      for (const [dx,dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        let foundOpp = false;
        while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
          if (board[ny][nx] === oppDisc) {
            foundOpp = true;
          } else if (board[ny][nx] === myDisc && foundOpp) {
            moves.push({x,y});
            nx = -1; // break outer
            ny = -1;
          } else {
            break;
          }
          nx += dx;
          ny += dy;
        }
      }
    }
  }
  return moves;
}

// ---------- ws ----------
function connect() {
  const params = new URLSearchParams(location.search);
  const roomId = params.get("id");
  const seat = params.get("seat");

  ws = new WebSocket(`wss://${location.host}/${roomId}/ws`);

  ws.addEventListener("open", () => {
    log("connected");
    const saved = JSON.parse(sessionStorage.getItem("token-" + roomId) || "{}");
    if (saved.token && Date.now() - saved.savedAt < 1000) {
      myToken = saved.token;
    }
    sendJoin(seat, myToken);
  });

  ws.addEventListener("message", (ev) => {
    log("raw: " + ev.data);
    const msg = JSON.parse(ev.data);

    if (msg.event === "join") {
      if (msg.data.role) {
        myRole = msg.data.role;
        myToken = msg.data.token;
        sessionStorage.setItem("token-" + roomId, JSON.stringify({token: myToken, savedAt: Date.now()}));
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
        showModal("Error: " + msg.data.error, null, "error");
      } else if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
      }
    }

    else if (msg.event === "leave") {
      if (msg.data[myRole]) {
        if (currentModalType === "finish") {
          pendingLeave = true;
        } else {
          showModal("Your opponent has left.", null, "leave");
        }
      }
    }

    else if (msg.event === "finish") {
      if (currentModalType === "leave") return;
      let blackCount = 0, whiteCount = 0;
      for (let row of msg.data.board) {
        for (let c of row) {
          if (c === "B") blackCount++;
          if (c === "W") whiteCount++;
        }
      }
      let winner = blackCount > whiteCount ? "Black" :
                   whiteCount > blackCount ? "White" : "Draw";
      showModal(`Game Over\nBlack: ${blackCount}, White: ${whiteCount}\nWinner: ${winner}`, null, "finish");
    }

    else if (msg.event === "error") {
      showModal("Error: " + msg.data.reason, null, "error");
    }
  });

  window.addEventListener("pagehide", () => {
    const params = new URLSearchParams(location.search);
    const roomId = params.get("id");
    if (myToken) {
      sessionStorage.setItem("token-" + roomId, JSON.stringify({token: myToken, savedAt: Date.now()}));
    }
  });
}

function sendJoin(seat, token) {
  ws.send(JSON.stringify({event: "join", seat, token}));
}

function sendMove(x, y) {
  ws.send(JSON.stringify({event: "move", token: myToken, x, y}));
}

// ---------- start ----------
(async () => {
  connect();
})();