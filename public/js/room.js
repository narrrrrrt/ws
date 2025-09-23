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
const roleEl = document.getElementById("role");
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
    
    if (type === "leave" || pendingLeave) {
      pendingLeave = false;
      sendJoin(myRole, myToken);
    } else if (type === "finish") {
      sendJoin(myRole, myToken);
    } else if (type === "pass") {
      sendMove(null, null); // パス送信
    }
    if (onOk) onOk();
    //currentModalType = null;
  };
}

function hideModal() {
  modalEl.style.display = "none";
  currentModalType = null;
}

// ---------- board rendering ----------
function renderBoard(board, status) {
  boardEl.innerHTML = "";

  // 現在のターンの合法手を計算（表示するかはこの後の条件で決める）
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
        // 👇 自分の番のときだけ合法手を表示する
        const move = legalMoves.find(m => m.x === x && m.y === y);
        if (move && status === myRole) {
          const hint = document.createElement("div");
          hint.className = "hint";
          hint.addEventListener("click", () => {
            //if (!currentModalType) sendMove(x, y);
            if (currentStatus === myRole) sendMove(x, y);
          });
          cell.appendChild(hint);
        }
      }

      boardEl.appendChild(cell);
    }
  }

  // 👇 パス or 終了判定
  if (status === myRole && legalMoves.length === 0) {
    const opp = status === "black" ? "white" : "black";
    const oppMoves = getLegalMoves(board, opp);

    if (oppMoves.length === 0) {
      // 双方合法手なし → 終了
      let blackCount = 0, whiteCount = 0;
      for (let row of board) {
        for (let c of row) {
          if (c === "B") blackCount++;
          if (c === "W") whiteCount++;
        }
      }
      let winner = blackCount > whiteCount ? "Black" :
                   whiteCount > blackCount ? "White" : "Draw";

      showModal(
        `Game Over\nBlack: ${blackCount}, White: ${whiteCount}\nWinner: ${winner}`,
        () => {
          sendJoin(myRole, myToken); // 再ジョイン
        },
        "finish"
      );
    } else {
      // 自分だけ合法手なし → パス
      showModal("No legal moves. Pass your turn.", () => {
        sendMove(null, null); // パス送信
      }, "pass");
    }
  }
}

// ---------- move calc ----------
function getLegalMoves(board, role) {
  // 👇 まず安全策。黒か白以外なら合法手なしを返す
  if (role !== "black" && role !== "white") {
    return [];
  }

  const moves = [];
  const dirs = [
    [1,0], [-1,0], [0,1], [0,-1],
    [1,1], [1,-1], [-1,1], [-1,-1]
  ];
  const myDisc  = role === "black" ? "B" : "W";
  const oppDisc = role === "black" ? "W" : "B";

  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      if (board[y][x] !== "-") continue;

      for (const [dx, dy] of dirs) {
        let nx = x + dx, ny = y + dy;
        let foundOpp = false;

        while (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
          if (board[ny][nx] === oppDisc) {
            foundOpp = true;
          } else if (board[ny][nx] === myDisc && foundOpp) {
            // 👇 一度でも相手の石を挟んで自分の石があれば合法手
            moves.push({ x, y });
            nx = -1; // 強制脱出
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

// ---------- ws send ----------
function sendJoin(seat, token) {
  ws.send(JSON.stringify({event: "join", seat, token}));
}

function sendMove(x, y) {
  ws.send(JSON.stringify({event: "move", token: myToken, x, y}));
}

// ---------- main (IIFE) ----------
(async () => {
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
    const msg = JSON.parse(ev.data);
    if (msg.event === "ping") return;
    log("raw: " + ev.data);

    if (msg.event === "join") {
      if (msg.data.role) {
        myRole = msg.data.role;
        myToken = msg.data.token;
        sessionStorage.setItem("token-" + roomId, JSON.stringify({token: myToken, savedAt: Date.now()}));
        roleEl.textContent = "You are " + myRole;
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
        currentStatus = msg.data.status;
        showModal("Error: " + msg.data.error, null, "error");
      } 
      if (msg.data.board) {
        currentBoard = msg.data.board;
        currentStatus = msg.data.status;
        renderBoard(currentBoard, currentStatus);
        statusEl.textContent = "Status: " + currentStatus;
        
        //if (currentModalType === "pass") {
        //  currentModalType = null;
        //}
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
/*
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
*/

    else if (msg.event === "error") {
      showModal("Error: " + msg.data.reason, null, "error");
    }
  });

  window.addEventListener("pagehide", () => {
    if (myToken) {
      sessionStorage.setItem("token-" + roomId, JSON.stringify({token: myToken, savedAt: Date.now()}));
    }
  });
})();