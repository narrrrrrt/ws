(() => {
  const sockets = new Map();     // roomId -> WebSocket
  const gens = new Map();        // roomId -> generation
  let genCounter = 0;

  function updateSeatButton(roomEl, id, seat, occupied) {
    const btn = roomEl.querySelector(`.seat.${seat}`);
    if (!btn) return;

    // まず必ずリセット（前状態を引きずらない）
    btn.classList.remove("active", "inactive");
    btn.disabled = false;
    btn.onclick = null;

    if (occupied === true) {
      // 使用中
      btn.classList.add("inactive");
      btn.disabled = true;
    } else if (occupied === false) {
      // 空き
      btn.classList.add("active");
      btn.disabled = false;
      btn.onclick = () => {
        window.location.href = `room.html?id=${id}&seat=${seat}`;
      };
    }
  }

  function applyState(roomEl, id, data) {
    ["black", "white"].forEach(seat => {
      if (seat in data) {
        updateSeatButton(roomEl, id, seat, data[seat]);
      }
    });

    // observer は常に有効
    const obsBtn = roomEl.querySelector(".seat.observer");
    if (obsBtn) {
      obsBtn.classList.add("active");
      obsBtn.disabled = false;
      obsBtn.onclick = () => {
        window.location.href = `room.html?id=${id}&seat=observer`;
      };
    }
  }

  function connectRoom(roomEl) {
    const id = roomEl.dataset.id;

    // 既存を確実に無効化してから閉じる
    const old = sockets.get(id);
    if (old) {
      try {
        old.onopen = old.onmessage = old.onclose = old.onerror = null;
        if (old.readyState === WebSocket.OPEN || old.readyState === WebSocket.CONNECTING) {
          old.close(1000, "reconnect");
        }
      } catch (_) {}
    }

    const ws = new WebSocket(`wss://${location.host}/${id}/ws`);
    const gen = ++genCounter;
    sockets.set(id, ws);
    gens.set(id, gen);

    ws.onopen = () => {
      if (gens.get(id) !== gen) return; // 旧世代を無視
      ws.send(JSON.stringify({ event: "join", seat: "observer" }));
    };

    ws.onmessage = (evt) => {
      if (gens.get(id) !== gen) return; // 旧世代を無視
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      if (msg.event === "ping") return;
      if (msg && msg.data) applyState(roomEl, id, msg.data);
    };

    ws.onerror = () => { /* no-op */ };
    ws.onclose = () => { /* 必要なら再接続トリガを入れてもOK */ };
  }

  function reconnectAll() {
    document.querySelectorAll(".room").forEach(connectRoom);
  }

  // 初回
  reconnectAll();

  // 復帰時の再接続
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") reconnectAll();
  });
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) reconnectAll();
  });

  // 保険：閉じてたら張り直す（iOS は寝がち）
  setInterval(() => {
    document.querySelectorAll(".room").forEach(roomEl => {
      const id = roomEl.dataset.id;
      const ws = sockets.get(id);
      if (!ws || ws.readyState === WebSocket.CLOSED) connectRoom(roomEl);
    });
  }, 15000);
})();