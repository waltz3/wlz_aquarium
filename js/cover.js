document.addEventListener("DOMContentLoaded", () => {
  const recordsList = document.getElementById("latest-records-list");

  fetch("tanks.json")
    .then(response => response.json())
    .then(paths => Promise.all(paths.map(path => fetch(path)
      .then(response => response.text())
      .then(markdown => ({ ...parseFrontMatter(markdown), path })))))
    .then(records => {
      records
        .sort((first, second) => (second.date || "").localeCompare(first.date || ""))
        .slice(0, 2)
        .forEach(record => {
          const image = (record.image || record.images || "")
            .replace(/^\[|\]$/g, "")
            .split(/\s*,\s*/)[0]
            .replace(/^['"]|['"]$/g, "");
          const link = document.createElement("a");
          link.className = "latest-record";
          link.href = `archive.html?id=${encodeURIComponent(record.id)}`;
          link.innerHTML = `
            <img class="latest-record-image" src="${image}" alt="${record.title || "最新の記録"}">
          `;
          recordsList.appendChild(link);
        });
    })
    .catch(() => {
      recordsList.hidden = true;
    });

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

    return metadata;
  }
});
