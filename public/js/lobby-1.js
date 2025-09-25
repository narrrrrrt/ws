(() => {
  const sockets = new Map(); // roomId -> WebSocket

  function connectRoom(roomEl) {
    const id = roomEl.dataset.id;

    // もし既存の接続があれば閉じる
    if (sockets.has(id)) {
      try {
        sockets.get(id).close();
      } catch (e) {
        console.warn("close error:", e);
      }
    }

    const ws = new WebSocket(`wss://${location.host}/${id}/ws`);
    sockets.set(id, ws);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ event: "join", seat: "observer" }));
    });

    ws.addEventListener("message", evt => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.event === "ping") return;

        if (msg.data) {
          // black / white の座席状態を反映
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

          // observer は常に有効
          const obsBtn = roomEl.querySelector(".seat.observer");
          obsBtn.classList.add("active");
          obsBtn.disabled = false;
          obsBtn.onclick = () => {
            window.location.href = `room.html?id=${id}&seat=observer`;
          };
        }
      } catch (e) {
        console.error("invalid message:", evt.data);
      }
    });
  }

  function reconnectAll() {
    document.querySelectorAll(".room").forEach(roomEl => {
      connectRoom(roomEl);
    });
  }

  // 初回接続
  reconnectAll();

  // バックグラウンド → フォアグラウンドで再接続
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      reconnectAll();
    }
  });

  // キャッシュから戻った場合にも対応
  window.addEventListener("pageshow", evt => {
    if (evt.persisted) {
      reconnectAll();
    }
  });
})();