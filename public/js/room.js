const params = new URLSearchParams(location.search)
const roomId = params.get("id")
const seat = params.get("seat") || "observer"

const boardEl = document.getElementById("board")
const statusEl = document.getElementById("status")
const modalEl = document.getElementById("modal")
const modalMessage = document.getElementById("modalMessage")
const modalOk = document.getElementById("modalOk")
const logEl = document.getElementById("log")

let ws
let currentBoard = []
let myToken = sessionStorage.getItem("token")
let lastSaved = parseInt(sessionStorage.getItem("savedAt") || "0")
if (Date.now() - lastSaved > 1000) {
  myToken = null
}

// --- ユーティリティ ---
function showModal(msg, onOk) {
  modalMessage.textContent = msg
  modalEl.style.display = "flex"
  modalOk.onclick = () => {
    modalEl.style.display = "none"
    if (onOk) onOk()
  }
}

function logMessage(msg) {
  const entry = document.createElement("div")
  entry.textContent = msg
  logEl.appendChild(entry)
  logEl.scrollTop = logEl.scrollHeight
}

// --- 合法手判定 ---
function computeLegalMoves(board, player) {
  const opponent = player === "B" ? "W" : "B"
  const moves = []
  const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]
  for (let y=0;y<8;y++) {
    for (let x=0;x<8;x++) {
      if (board[y][x] !== "-") continue
      for (const [dx,dy] of dirs) {
        let cx=x+dx, cy=y+dy, found=false
        while (cx>=0&&cx<8&&cy>=0&&cy<8&&board[cy][cx]===opponent) {
          cx+=dx; cy+=dy; found=true
        }
        if (found && cx>=0&&cx<8&&cy>=0&&cy<8&&board[cy][cx]===player) {
          moves.push([x,y])
          break
        }
      }
    }
  }
  return moves
}

// --- ボード描画 ---
function renderBoard(board, status) {
  currentBoard = board
  boardEl.innerHTML = ""

  const legalMoves = (seat !== "observer" && status && status.toLowerCase() === seat)
    ? computeLegalMoves(board, seat === "black" ? "B" : "W")
    : []

  for (let y=0;y<8;y++) {
    for (let x=0;x<8;x++) {
      const c = board[y][x]
      const cellEl = document.createElement("div")
      cellEl.className = "cell"

      if (c === "B" || c === "W") {
        const disc = document.createElement("div")
        disc.className = "disc " + (c === "B" ? "black" : "white")
        cellEl.appendChild(disc)
      } else if (legalMoves.some(([lx,ly]) => lx===x && ly===y)) {
        const hint = document.createElement("div")
        hint.className = "hint"
        hint.addEventListener("click", ()=> sendMove(x,y))
        cellEl.appendChild(hint)
      } else {
        cellEl.addEventListener("click", ()=> {
          if (seat !== "observer" && status && status.toLowerCase() === seat) {
            showModal("This is not a legal move.")
          }
        })
      }
      boardEl.appendChild(cellEl)
    }
  }
}

// --- サーバー送信 ---
function sendJoin() {
  const msg = { event:"join", seat }
  if (myToken) msg.token = myToken
  ws.send(JSON.stringify(msg))
}

function sendMove(x,y) {
  if (!myToken) {
    showModal("No token, cannot move.")
    return
  }
  ws.send(JSON.stringify({ event:"move", token:myToken, x, y }))
}

// --- WebSocket ---
ws = new WebSocket(`wss://${location.host}/${roomId}/ws`)

ws.addEventListener("open", () => { sendJoin() })

ws.addEventListener("message", (ev) => {
  logMessage("raw: " + ev.data)
  const msg = JSON.parse(ev.data)

  if (msg.event === "join") {
    if (msg.data.token) myToken = msg.data.token
    if (msg.data && msg.data.board) {
      renderBoard(msg.data.board, msg.data.status)
      statusEl.textContent = "Status: " + msg.data.status
    }
  }

  if (msg.event === "move") {
    renderBoard(msg.data.board, msg.data.status)
    statusEl.textContent = "Status: " + msg.data.status
  }

  if (msg.event === "leave") {
    showModal("Your opponent has left.", ()=> { sendJoin() })
  }

  if (msg.event === "finish") {
    const board = msg.data.board
    let black=0, white=0
    for (let row of board) {
      for (let c of row) {
        if (c==="B") black++
        if (c==="W") white++
      }
    }
    let result="Draw"
    if (black>white) result="Black wins"
    else if (white>black) result="White wins"
    showModal(`Game finished.\nBlack: ${black}, White: ${white}\n${result}`, ()=> {
      sendJoin()
    })
  }

  if (msg.event === "error") {
    showModal("Error: " + msg.reason)
  }
})

// --- token管理 ---
window.addEventListener("pagehide", ()=> {
  if (myToken) {
    sessionStorage.setItem("token", myToken)
    sessionStorage.setItem("savedAt", Date.now().toString())
  }
})

// --- ロビーへ ---
document.getElementById("lobby").addEventListener("click", ()=> {
  ws.close()
})