// ---- Configuración editable ----
// Cambiá estos tres valores cuando tengan el repo y el link de descarga listos.
const CONFIG = {
  version: "v0.0.2 — Alpha",
  githubUrl: "https://github.com/Jhoan-456/DAWN-QUEST-",
  downloadUrl: "/descarga/descargar.html",
  WhatsappUrl: "https://chat.whatsapp.com/LqbTrx6LKftEvTQrSPUo6a?s=cl&p=a&mlu=4&ilr=4"
};

document.getElementById('version-badge').textContent = "Versión: " + CONFIG.version;
document.getElementById('hero-repo-link').href = CONFIG.githubUrl;
document.getElementById('repo-btn').href = CONFIG.githubUrl;
document.getElementById('download-btn').href = CONFIG.downloadUrl;
document.getElementById('whats-btn').href = CONFIG.WhatsappUrl;

// ---- Tabs ----
const buttons = document.querySelectorAll('.tab-btn');
const panels = {
  historia: document.getElementById('panel-historia'),
  repo: document.getElementById('panel-repo'),
  avances: document.getElementById('panel-avances'),
  wiki: document.getElementById('panel-wiki'),
  informarnos: document.getElementById('panel-informarnos'),
};

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    Object.values(panels).forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    panels[btn.dataset.tab].classList.add('active');
  });
});

// ---- Wiki ----
const wikiCategoriesEl = document.getElementById('wiki-categories');
const wikiListEl = document.getElementById('wiki-list');
const wikiDetailEl = document.getElementById('wiki-detail');
const wikiSearchEl = document.getElementById('wiki-search');

let activeCategory = 'todos';
let activeEntryId = WIKI_DATA[0] ? WIKI_DATA[0].id : null;

function renderWikiCategories(){
  wikiCategoriesEl.innerHTML = '';
  WIKI_CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'wiki-chip' + (cat.id === activeCategory ? ' active' : '');
    btn.textContent = cat.label;
    btn.addEventListener('click', () => {
      activeCategory = cat.id;
      renderWikiCategories();
      renderWikiList();
    });
    wikiCategoriesEl.appendChild(btn);
  });
}

function renderWikiList(){
  const query = wikiSearchEl.value.trim().toLowerCase();
  const filtered = WIKI_DATA.filter(entry => {
    const matchesCategory = activeCategory === 'todos' || entry.category === activeCategory;
    const matchesQuery = !query || entry.name.toLowerCase().includes(query) || entry.summary.toLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });

  wikiListEl.innerHTML = '';
  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'wiki-empty';
    empty.textContent = 'Sin resultados.';
    wikiListEl.appendChild(empty);
    return;
  }

  filtered.forEach(entry => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'wiki-item' + (entry.id === activeEntryId ? ' active' : '');
    btn.innerHTML = '<span class="wiki-item-name">' + entry.name + '</span>' +
      '<span class="wiki-item-cat">' + labelForCategory(entry.category) + '</span>';
    btn.addEventListener('click', () => {
      activeEntryId = entry.id;
      renderWikiList();
      renderWikiDetail();
    });
    li.appendChild(btn);
    wikiListEl.appendChild(li);
  });

  // si la entrada activa quedó filtrada afuera, mostrar la primera visible
  if (!filtered.some(e => e.id === activeEntryId)) {
    activeEntryId = filtered[0].id;
    renderWikiDetail();
  }
}

function labelForCategory(catId){
  const found = WIKI_CATEGORIES.find(c => c.id === catId);
  return found ? found.label : catId;
}

function renderWikiDetail(){
  const entry = WIKI_DATA.find(e => e.id === activeEntryId);
  if (!entry) {
    wikiDetailEl.innerHTML = '<p class="wiki-placeholder">Elegí una entrada de la lista para ver el detalle.</p>';
    return;
  }

  let statsHtml = '';
  if (entry.stats && entry.stats.length) {
    statsHtml = '<table class="wiki-stats">' + entry.stats.map(s =>
      '<tr><td>' + s.label + '</td><td>' + s.value + '</td></tr>'
    ).join('') + '</table>';
  }

  wikiDetailEl.innerHTML =
    '<span class="wiki-detail-cat">' + labelForCategory(entry.category) + '</span>' +
    '<h3>' + entry.name + '</h3>' +
    '<p class="wiki-summary">' + entry.summary + '</p>' +
    statsHtml +
    '<p class="wiki-description">' + entry.description + '</p>';
}

wikiSearchEl.addEventListener('input', renderWikiList);

renderWikiCategories();
renderWikiList();
renderWikiDetail();