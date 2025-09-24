// 各ルームに observer として接続
document.querySelectorAll(".room").forEach(roomEl => {
  const id = roomEl.dataset.id;
  const ws = new WebSocket(`wss://${location.host}/${id}/ws`);

  ws.addEventListener("open", () => {
    ws.send(JSON.stringify({ event: "join", seat: "observer" }));
  });

  ws.addEventListener("message", evt => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.event === "ping") return;

      if (msg.data) {
        // black/white の状態に応じてボタン切り替え
        ["black", "white"].forEach(seat => {
          const btn = roomEl.querySelector(`.seat.${seat}`);
          if (!btn) return;
          if (msg.data[seat]) {
            btn.classList.remove("active");
            btn.classList.add("inactive");
            btn.disabled = true;
          } else {
            btn.classList.remove("inactive");
            btn.classList.add("active");
            btn.disabled = false;
            btn.onclick = () => {
              window.location.href = `room.html?id=${id}&seat=${seat}`;
            };
          }
        });

        // Observer は常に有効
        const obsBtn = roomEl.querySelector(".seat.observer");
        obsBtn.classList.add("active");
        obsBtn.disabled = false;
        obsBtn.onclick = () => {
          window.location.href = `room.html?id=${id}&seat=observer`;
        };

        // Reset ボタン
        const resetBtn = roomEl.querySelector(".reset");
        resetBtn.onclick = () => {
          const wsTmp = new WebSocket(`wss://${location.host}/${id}/ws`);
          wsTmp.addEventListener("open", () => {
            wsTmp.send(JSON.stringify({ event: "reset" }));
            wsTmp.close();
          });
        };
      }
    } catch (e) {
      console.error("invalid message:", evt.data);
    }
  });
});