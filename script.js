document.addEventListener('DOMContentLoaded', () => {
  // ---- Configuración editable ----
  const CONFIG = {
    version: "v0.0.2 — Alpha",
    githubUrl: "https://github.com/Jhoan-456/DAWN-QUEST-",
    downloadUrl: "/descarga/descargar.html",
    WhatsappUrl: "https://chat.whatsapp.com/LqbTrx6LKftEvTQrSPUo6a?s=cl&p=a&mlu=4&ilr=4"
  };

  // Asignación segura con validación de existencia de elementos
  const setAttr = (id, attr, value) => {
    const el = document.getElementById(id);
    if (el) el[attr] = value;
  };

  setAttr('version-badge', 'textContent', `Versión: ${CONFIG.version}`);
  setAttr('hero-repo-link', 'href', CONFIG.githubUrl);
  setAttr('repo-btn', 'href', CONFIG.githubUrl);
  setAttr('download-btn', 'href', CONFIG.downloadUrl);
  setAttr('whats-btn', 'href', CONFIG.WhatsappUrl);

  // ---- Navegación por pestañas (Tabs) ----
  const buttons = document.querySelectorAll('.tab-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;
      if (!targetId) return;

      // Desactivar todos los botones
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      // Ocultar todos los paneles dinámicamente
      document.querySelectorAll('.tab-panel, [id^="panel-"]').forEach(p => {
        p.classList.remove('active');
      });

      // Activar el botón y panel objetivo
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetPanel = document.getElementById(`panel-${targetId}`) || document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });

  // ---- Sistema Wiki ----
  const categories = typeof WIKI_CATEGORIES !== 'undefined' ? WIKI_CATEGORIES : [];
  const wikiData = typeof WIKI_DATA !== 'undefined' ? WIKI_DATA : [];

  const wikiCategoriesEl = document.getElementById('wiki-categories');
  const wikiListEl = document.getElementById('wiki-list');
  const wikiDetailEl = document.getElementById('wiki-detail');
  const wikiSearchEl = document.getElementById('wiki-search');

  // Detener inicialización de la wiki si faltan los contenedores esenciales en el HTML
  if (!wikiCategoriesEl || !wikiListEl || !wikiDetailEl) return;

  let activeCategory = 'todos';
  let activeEntryId = wikiData[0] ? wikiData[0].id : null;

  function labelForCategory(catId) {
    const found = categories.find(c => c.id === catId);
    return found ? found.label : catId;
  }

  function renderWikiCategories() {
    wikiCategoriesEl.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `wiki-chip${cat.id === activeCategory ? ' active' : ''}`;
      btn.textContent = cat.label;
      btn.addEventListener('click', () => {
        activeCategory = cat.id;
        renderWikiCategories();
        renderWikiList();
      });
      wikiCategoriesEl.appendChild(btn);
    });
  }

  function renderWikiList() {
    const query = wikiSearchEl ? wikiSearchEl.value.trim().toLowerCase() : '';
    const filtered = wikiData.filter(entry => {
      const matchesCategory = activeCategory === 'todos' || entry.category === activeCategory;
      const matchesQuery = !query ||
        entry.name.toLowerCase().includes(query) ||
        (entry.summary && entry.summary.toLowerCase().includes(query));
      return matchesCategory && matchesQuery;
    });

    wikiListEl.innerHTML = '';

    // Manejo de búsqueda sin resultados
    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'wiki-empty';
      empty.textContent = 'Sin resultados.';
      wikiListEl.appendChild(empty);
      renderWikiDetail(null);
      return;
    }

    // Reasignación segura de elemento activo cuando el filtro excluye al actual
    if (!filtered.some(e => e.id === activeEntryId)) {
      activeEntryId = filtered[0].id;
    }

    filtered.forEach(entry => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = `wiki-item${entry.id === activeEntryId ? ' active' : ''}`;
      btn.innerHTML = `
        <span class="wiki-item-name">${entry.name}</span>
        <span class="wiki-item-cat">${labelForCategory(entry.category)}</span>
      `;
      btn.addEventListener('click', () => {
        activeEntryId = entry.id;
        renderWikiList();
      });
      li.appendChild(btn);
      wikiListEl.appendChild(li);
    });

    renderWikiDetail();
  }

  function renderWikiDetail(overrideEntry = undefined) {
    const entry = overrideEntry === null ? null : wikiData.find(e => e.id === activeEntryId);

    if (!entry) {
      wikiDetailEl.innerHTML = '<p class="wiki-placeholder">Elegí una entrada de la lista para ver el detalle.</p>';
      return;
    }

    let statsHtml = '';
    if (entry.stats && entry.stats.length) {
      const rows = entry.stats.map(s => `<tr><td>${s.label}</td><td>${s.value}</td></tr>`).join('');
      statsHtml = `<table class="wiki-stats">${rows}</table>`;
    }

    wikiDetailEl.innerHTML = `
      <span class="wiki-detail-cat">${labelForCategory(entry.category)}</span>
      <h3>${entry.name}</h3>
      <p class="wiki-summary">${entry.summary || ''}</p>
      ${statsHtml}
      <p class="wiki-description">${entry.description || ''}</p>
    `;
  }

  if (wikiSearchEl) {
    wikiSearchEl.addEventListener('input', renderWikiList);
  }

  // Inicialización
  renderWikiCategories();
  renderWikiList();
});