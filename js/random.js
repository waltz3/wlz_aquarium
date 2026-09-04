document.addEventListener("DOMContentLoaded", () => {
  const cardContainer = document.getElementById("random-card");
  const drawButton = document.getElementById("draw-button");
  let logs = [];

  fetch("tanks.json")
    .then(response => response.json())
    .then(paths => Promise.all(paths.map(fetchLog)))
    .then(loadedLogs => {
      logs = loadedLogs;
      drawCard();
    })
    .catch(error => {
      console.error("データ読み込み失敗:", error);
      cardContainer.innerHTML = "<p>カードを読み込めませんでした。</p>";
    });

  function fetchLog(path) {
    return fetch(path).then(response => response.text()).then(markdown => ({
      ...parseFrontMatter(markdown),
      content: path
    }));
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

  function drawCard() {
    const item = logs[Math.floor(Math.random() * logs.length)];
    cardContainer.innerHTML = `
      <article class="specimen-card random-card" data-id="${item.id}">
        <div class="card-image-box"><img src="${item.image}" alt="${item.title}"></div>
        <h2 class="random-card-title">${item.title}</h2>
      </article>
    `;
    cardContainer.querySelector(".random-card").addEventListener("click", () => {
      window.location.href = `archive.html?id=${encodeURIComponent(item.id)}`;
    });
  }

  function renderCardTags(item) {
    const tags = [item.aquarium, ...(item.species || "").split(/[、,]/)]
      .map(value => value.trim())
      .filter(Boolean);

    return tags.map(tag => `
      <a href="archive.html?category=${encodeURIComponent(tag)}" class="card-tag" onclick="event.stopPropagation()">${tag}</a>
    `).join("");
  }

  drawButton.addEventListener("click", drawCard);
});
