document.addEventListener("DOMContentLoaded", () => {
  const cardsContainer = document.getElementById("cards-container");
  const drawer = document.getElementById("note-drawer");
  const overlay = document.getElementById("drawer-overlay");
  const closeBtn = document.getElementById("drawer-close");
  const drawerContent = document.getElementById("drawer-content");
  const drawerId = document.getElementById("drawer-id");
  const aquariumCategories = document.getElementById("aquarium-categories");
  const speciesCategories = document.getElementById("species-categories");
  const archiveLayout = document.getElementById("archive-layout");
  const detailContainer = document.getElementById("record-detail");
  const archiveTitle = document.querySelector(".archive-title");

  // tanks.json を読み込み
  fetch("tanks.json")
    .then(res => res.json())
    .then(data => {
      return Promise.all(data.map(path => fetchLog(path)));
    })
    .then(logs => {
      renderCategories(logs);
      const params = new URLSearchParams(window.location.search);
      const category = params.get("category");
      if (category) {
        archiveTitle.textContent = category;
        archiveTitle.previousElementSibling.textContent = "カテゴリ";
      }
      renderCards(category ? logs.filter(log => getCategories(log).includes(category)) : logs);

      const targetId = new URLSearchParams(window.location.search).get("id");
      const item = logs.find(log => log.id === targetId);
      if (item) renderDetail(item);
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

  function getCategories(item) {
    return [item.aquarium, ...(item.species || "").split(/[、,]/)]
      .map(value => value.trim())
      .filter(Boolean);
  }

  function renderCategories(logs) {
    const renderGroup = (key, target) => {
      const counts = new Map();
      logs.forEach(log => {
        (key === "species" ? (log.species || "").split(/[、,]/) : [log.aquarium])
          .map(value => value.trim())
          .filter(Boolean)
          .forEach(value => counts.set(value, (counts.get(value) || 0) + 1));
      });

      target.innerHTML = [...counts.entries()].sort().map(([name, count]) => `
        <li><a href="archive.html?category=${encodeURIComponent(name)}"><span class="category-link-label">${name}<span class="category-link-count">(${count})</span></span></a></li>
      `).join("");
    };

    renderGroup("aquarium", aquariumCategories);
    renderGroup("species", speciesCategories);
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
        window.location.href = `archive.html?id=${encodeURIComponent(id)}`;
      });
    });
  }

  function renderCardTags(item) {
    const species = (item.species || "").split(/[、,]/)
      .map(value => value.trim())
      .filter(Boolean);
    const renderGroup = (label, tags) => `
      <div class="card-tag-group">
        <span class="card-tag-label">${label}：</span>
        ${tags.map(tag => `
          <a href="archive.html?category=${encodeURIComponent(tag)}" class="card-tag" onclick="event.stopPropagation()">${tag}</a>
        `).join("、")}
      </div>
    `;

    return renderGroup("施設", [item.aquarium].filter(Boolean))
      + renderGroup("生き物", species);
  }

  function renderDetail(item) {
    document.body.classList.add("is-detail-page");
    archiveLayout.hidden = true;
    detailContainer.hidden = false;
    detailContainer.innerHTML = `
      <nav class="detail-navigation" aria-label="詳細ページナビゲーション">
        <a href="archive.html" class="detail-back-link">◀ カード一覧へ戻る</a>
        <a href="random.html" class="detail-back-link">ランダムカードを引く ↗</a>
      </nav>
      <article class="record-detail-card">
        <div class="card-meta"><span>${item.id}</span><span>${item.date || ""}</span></div>
        <div class="record-detail-grid">
          <div class="card-image-box"><img src="${item.image}" alt="${item.title}"></div>
          <div class="record-detail-text">
            <div class="record-detail-summary">
              <div class="card-scale-tag">${item.aquarium || ""}</div>
              <span class="doc-tag detail-doc-tag">水族館の記録</span>
              <h1 class="card-title">${item.title}</h1>
              <p class="card-species">${item.species || ""}</p>
              <div class="card-tags">${renderCardTags(item)}</div>
              <p>${item.observer_note || ""}</p>
            </div>
            <div class="record-detail-content">${marked.parse(item.markdown)}</div>
          </div>
        </div>
      </article>
    `;
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