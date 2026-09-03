document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("cards-container");
  const drawer = document.getElementById("note-drawer");
  const overlay = document.getElementById("drawer-overlay");
  const closeBtn = document.getElementById("drawer-close");
  const drawerContent = document.getElementById("drawer-content");
  const drawerId = document.getElementById("drawer-id");

  // tanks.json を読み込み
  fetch("tanks.json")
    .then(res => res.json())
    .then(data => {
      return Promise.all(data.map(path => fetchLog(path)));
    })
    .then(logs => {
      renderCards(logs);

      const targetId = new URLSearchParams(window.location.search).get("id");
      const item = logs.find(log => log.id === targetId);
      if (item) openDrawer(item);
    })
    .catch(err => console.error("データ読み込み失敗:", err));

  function fetchLog(path) {
    return fetch(path)
      .then(res => {
        if (!res.ok) throw new Error("手記ファイルが見つかりません");
        return res.text();
      })
      .then(markdown => ({ ...parseFrontMatter(markdown), content: path }));
  }

  function parseFrontMatter(markdown) {
    const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
    const metadata = {};

    if (match) {
      match[1].split("\n").forEach(line => {
        const separator = line.indexOf(":");
        if (separator > 0) {
          const key = line.slice(0, separator).trim();
          const value = line.slice(separator + 1).trim();
          metadata[key] = value.replace(/^['"]|['"]$/g, "");
        }
      });
    }

    return { ...metadata, markdown: match ? markdown.slice(match[0].length) : markdown };
  }

  // カード一覧の描画
  function renderCards(list) {
    cardsContainer.innerHTML = list.map(item => `
      <article class="specimen-card" data-id="${item.id}">
        <div class="card-image-box">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
        </div>

        <h2 class="card-title">${item.title}</h2>
      </article>
    `).join("");

    // 各カードにクリックイベントを付与
    document.querySelectorAll(".specimen-card").forEach(card => {
      card.addEventListener("click", () => {
        const id = card.getAttribute("data-id");
        const item = list.find(log => log.id === id);
        if (item) openDrawer(item);
      });
    });
  }

  // ドロワーを開いてMDをレンダリング
  function openDrawer(item) {
    drawerId.textContent = `${item.id} ｜ ${item.aquarium}`;
    drawerContent.innerHTML = "<p class='loading-text'>手記を読み込み中...</p>";
    drawer.classList.add("is-open");
    overlay.classList.add("is-visible");

    // Markdownファイルの取得
    drawerContent.innerHTML = marked.parse(item.markdown);
  }

  // ドロワーを閉じる
  function closeDrawer() {
    drawer.classList.remove("is-open");
    overlay.classList.remove("is-visible");
  }

  closeBtn.addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
});