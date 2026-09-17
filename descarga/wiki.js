// ---- Wiki de Dawn Quest, conectada a Firestore ----
// Todos pueden leer. Solo un admin logueado (mismo login que el buzón)
// puede agregar, editar o borrar entradas.

import {
  collection, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db, auth } from "/descarga/FireBaseInit.js";

const COLLECTION_NAME = 'wiki_entradas';

// Categorías conocidas de entrada (si aparece una categoría nueva en los datos
// que no está en esta lista, se agrega sola a los filtros con su propio id como nombre)
const BASE_CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'enemigos', label: 'Enemigos' },
  { id: 'jefes', label: 'Jefes' },
  { id: 'personaje', label: 'Personajes' },
  { id: 'armas', label: 'Armas' },
  { id: 'objetos', label: 'Objetos' },
  { id: 'mapa-bioma', label: 'Bioma' }
];

// Datos actuales, para importar una sola vez a Firestore (botón de admin).
// No se vuelven a usar después de la migración: la fuente de verdad pasa a ser Firestore.
const SEED_DATA = [
  {
    id: "Esfera-Maligna", category: "enemigos", name: "Esfera Maligna",
    summary: "Primer Enemigo que te encuentrar en tu primera partida",
    stats: [
      { label: "Tipo", value: "Rango / Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value: "Bosque" },
      { label: "Vida", value: "35.0" }
    ],
    description: "Es un enemigo comun pero no te dejes engañar, cuando llega a la mitad de vida se duplica en 2 mini esferas malignas, y envez de generar 8 proyectiles, ahora solo genera 5 cada Esfera Mini"
  },
  {
    id: "Esferas-Minis", category: "enemigos", name: "Esferas Malignas Minis",
    summary: "Estan cuando a la Esfera Maligna la dejas a mitad de vida y se divide en 2 minis Esferas ",
    stats: [
      { label: "Tipo", value: "Rango / Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value: "Bosque" },
      { label: "Vida", value: "8.75" }
    ],
    description: "Es hijo de la Esfera Maligan, esta aqui para vengar la muestre de su padre"
  },
  {
    id: "Slime", category: "enemigos", name: "Slime",
    summary: "Es tu Segundo Enemigo que te encuentrar en tus primeras partidas",
    stats: [
      { label: "Tipo", value: "Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value: "Bosque" },
      { label: "Vida", value: "15.0" }
    ],
    description: "Es lento pero peligroso"
  },
  {
    id: "bulbo-Plantera", category: "jefes", name: "Plantera",
    summary: "Es el primer Jefe del bioma",
    stats: [
      { label: "Tipo", value: "Rango" },
      { label: "Comportamiento", value: "Dispara Proyectiles a todas las direcciones" },
      { label: "Bioma Respectivo", value: "Bosque" },
      { label: "Vida", value: "500.0" },
      { label: "Cantidad de Fases", value: "3" }
    ],
    description: "Plantera Odia que le digas Bulbo, pero toco decirle asi :)"
  },
  {
    id: "personaje-byte", category: "personaje", name: "Byte",
    summary: "Es un nuevo personaje agregado al juego que utiliza atributos que cambian las caracheristicas base de las armas",
    stats: [
      { label: "Vida", value: "160.0" },
      { label: "Escudo", value: "150.0" },
      { label: "Energia", value: "400.0" },
      { label: "Fuerza", value: "5" },
      { label: "Inteligencia", value: "9" },
      { label: "Velocidad de Ataque", value: "6.5" },
      { label: "Velocidad de Proyectil", value: "14.0" },
      { label: "Velocidad de Movimiento", value: "10.0" },
      { label: "Probabilidad de Critico", value: "1.5" },
      { label: "Suerte", value: "1.2" },
      { label: "Activo", value: "Ítem inicial: Bateria Portatil (Al usarla recarga instantáneamente la pasiva y da un pequeño escudo)" },
      { label: "Pasivo", value: "SobreCarga (Cada 8s su proximo disparo no fisico hacen un 30% mas de daño y deja un pequeño rastro eléctrico)" }
    ],
    description: "Es un poco timido pero le coges cariño como a mi y a los otros desarrolladores"
  },
  {
    id: "arma-default", category: "armas", name: "Arma Default",
    summary: "Arma inicial del personaje Default",
    stats: [
      { label: "Costo de Energia", value: "1.0" },
      { label: "Tipo de Clase", value: "Rango" },
      { label: "Atributos", value: "Depende del Personaje que lo tenga Equipado" }
    ],
    description: "Esta arma fue traida al mundo y desde estonces le gusto al creador, tiene un daño, cadencia y velocidad increible que pesar que solo los desarrolladores lo utilizan para pruebas"
  },
  {
    id: "baculo", category: "armas", name: "Báculo",
    summary: "Primera Arma de la Clase Mago y primera en utilizar estadisticas que suman los atributos del personaje que lo tiene equipado",
    stats: [
      { label: "Costo de Energia", value: "5.0" },
      { label: "Tipo de Clase", value: "Mago" },
      { label: "Daño base", value: "3.0" },
      { label: "Escalado de Inteligencia", value: "0.68" },
      { label: "Escalado de Fuerza", value: "0.0" },
      { label: "Cadencia Base", value: "0.7" },
      { label: "Multiplicador de Velocidad del Proyectil", value: "1.0" },
      { label: "Extra", value: "Aplica Quemadura durante 2s" }
    ],
    description: "Si quieres ser violento y quiere ser tryhard esta arma para empezar es muy buena aunque estaprimera version la siento desvalanciada "
  },
  {
    id: "moneda", category: "objetos", name: "Moneda",
    summary: "La moneda del juego. La sueltan los enemigos al morir.",
    stats: [
      { label: "Se obtiene", value: "Derrotando enemigos (50%)" },
      { label: "Se muestra en", value: "Cualquier Sala" }
    ],
    description: "Cada Enemigo derrotado te dara una probabilidad del 50 % de que te den una moneda"
  },
  {
    id: "bosque", category: "mapa-bioma", name: "El bosque",
    summary: "El escenario principal: donde inicias tus primeras partidas y aprendes con el tutorial",
    stats: [
      { label: "Cantidad de Capitulos", value: "5" },
      { label: "Cantidad de Episodios", value: "5" }
    ],
    description: "Este nivel te va a llenar de emociones el primer segundo que lo juegas....disfrutalo de verdad"
  }
];

const wikiCategoriesEl = document.getElementById('wiki-categories');
const wikiListEl = document.getElementById('wiki-list');
const wikiDetailEl = document.getElementById('wiki-detail');
const wikiSearchEl = document.getElementById('wiki-search');

if (wikiCategoriesEl && wikiListEl && wikiDetailEl) {
  initWiki();
}

function initWiki() {
  injectAdminStyles();

  let entries = [];
  let isAdmin = false;
  let activeCategory = 'todos';
  let activeEntryId = null;

  function allCategories() {
    const extra = [];
    entries.forEach(e => {
      if (!BASE_CATEGORIES.some(c => c.id === e.category) && !extra.some(c => c.id === e.category)) {
        extra.push({ id: e.category, label: e.category });
      }
    });
    return [...BASE_CATEGORIES, ...extra];
  }

  function labelForCategory(catId) {
    const found = allCategories().find(c => c.id === catId);
    return found ? found.label : catId;
  }

  // ---------- Panel de admin (arriba de la lista) ----------
  function renderAdminBar() {
    let bar = document.getElementById('wiki-admin-bar');
    if (!isAdmin) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'wiki-admin-bar';
      bar.className = 'wiki-admin-bar';
      wikiCategoriesEl.parentElement.insertBefore(bar, wikiCategoriesEl);
    }
    bar.innerHTML = `
      <button class="wiki-admin-btn" id="wiki-new-entry-btn" type="button">+ Nueva entrada</button>
      <button class="wiki-admin-btn wiki-admin-btn-secondary" id="wiki-import-btn" type="button">Importar datos actuales</button>
    `;
    document.getElementById('wiki-new-entry-btn').addEventListener('click', () => openForm(null));
    document.getElementById('wiki-import-btn').addEventListener('click', importSeedData);
  }

  async function importSeedData() {
    const toImport = SEED_DATA.filter(seed => !entries.some(e => e.id === seed.id));
    if (toImport.length === 0) {
      alert('Ya están todas las entradas originales en Firestore, no hay nada nuevo para importar.');
      return;
    }
    if (!confirm(`Se van a crear ${toImport.length} entradas en Firestore. ¿Continuar?`)) return;
    try {
      for (const seed of toImport) {
        const { id, ...data } = seed;
        await setDoc(doc(db, COLLECTION_NAME, id), data);
      }
      alert('Listo, se importaron las entradas.');
    } catch (e) {
      console.error(e);
      alert('Algo falló importando los datos. Mirá la consola para más detalle.');
    }
  }

  // ---------- Chips de categoría ----------
  function renderWikiCategories() {
    wikiCategoriesEl.innerHTML = '';
    allCategories().forEach(cat => {
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

  // ---------- Lista de entradas ----------
  function renderWikiList() {
    const q = wikiSearchEl ? wikiSearchEl.value.trim().toLowerCase() : '';
    const filtered = entries.filter(entry => {
      const matchesCategory = activeCategory === 'todos' || entry.category === activeCategory;
      const matchesQuery = !q ||
        entry.name.toLowerCase().includes(q) ||
        (entry.summary && entry.summary.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });

    wikiListEl.innerHTML = '';

    if (filtered.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'wiki-empty';
      empty.textContent = entries.length === 0 ? 'Todavía no hay entradas en la wiki.' : 'Sin resultados.';
      wikiListEl.appendChild(empty);
      renderWikiDetail(null);
      return;
    }

    if (!filtered.some(e => e.id === activeEntryId)) {
      activeEntryId = filtered[0].id;
    }

    filtered.forEach(entry => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = `wiki-item${entry.id === activeEntryId ? ' active' : ''}`;
      btn.innerHTML = `
        <span class="wiki-item-name">${escapeHtml(entry.name)}</span>
        <span class="wiki-item-cat">${escapeHtml(labelForCategory(entry.category))}</span>
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

  // ---------- Detalle ----------
  function renderWikiDetail(overrideEntry = undefined) {
    const entry = overrideEntry === null ? null : entries.find(e => e.id === activeEntryId);

    if (!entry) {
      wikiDetailEl.innerHTML = '<p class="wiki-placeholder">Elegí una entrada de la lista para ver el detalle.</p>';
      return;
    }

    let statsHtml = '';
    if (entry.stats && entry.stats.length) {
      const rows = entry.stats.map(s => `<tr><td>${escapeHtml(s.label)}</td><td>${escapeHtml(s.value)}</td></tr>`).join('');
      statsHtml = `<table class="wiki-stats">${rows}</table>`;
    }

    const adminButtons = isAdmin ? `
      <div class="wiki-admin-detail-actions">
        <button class="wiki-admin-btn" id="wiki-edit-entry-btn" type="button">Editar</button>
        <button class="wiki-admin-btn wiki-admin-btn-danger" id="wiki-delete-entry-btn" type="button">Borrar</button>
      </div>
    ` : '';

    wikiDetailEl.innerHTML = `
      <span class="wiki-detail-cat">${escapeHtml(labelForCategory(entry.category))}</span>
      <h3>${escapeHtml(entry.name)}</h3>
      <p class="wiki-summary">${escapeHtml(entry.summary || '')}</p>
      ${statsHtml}
      <p class="wiki-description">${escapeHtml(entry.description || '')}</p>
      ${adminButtons}
    `;

    if (isAdmin) {
      document.getElementById('wiki-edit-entry-btn').addEventListener('click', () => openForm(entry));
      document.getElementById('wiki-delete-entry-btn').addEventListener('click', () => deleteEntry(entry));
    }
  }

  async function deleteEntry(entry) {
    if (!confirm(`¿Borrar "${entry.name}" de la wiki? Esto no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, entry.id));
    } catch (e) {
      console.error(e);
      alert('No se pudo borrar. ¿Seguís logueado como admin?');
    }
  }

  // ---------- Formulario de alta / edición ----------
  function openForm(entry) {
    closeForm();

    const isEdit = !!entry;
    const overlay = document.createElement('div');
    overlay.id = 'wiki-form-overlay';
    overlay.className = 'wiki-form-overlay';

    const knownCats = BASE_CATEGORIES.filter(c => c.id !== 'todos');
    const currentCat = entry ? entry.category : '';
    const isCustomCat = currentCat && !knownCats.some(c => c.id === currentCat);

    const catOptions = knownCats.map(c =>
      `<option value="${c.id}" ${c.id === currentCat ? 'selected' : ''}>${c.label}</option>`
    ).join('');

    overlay.innerHTML = `
      <div class="wiki-form-box">
        <h3>${isEdit ? 'Editar entrada' : 'Nueva entrada'}</h3>
        <form id="wiki-entry-form">
          <label>Categoría</label>
          <select id="wf-category">
            ${catOptions}
            <option value="__custom__" ${isCustomCat ? 'selected' : ''}>Otra (escribir abajo)</option>
          </select>
          <input type="text" id="wf-category-custom" placeholder="Nombre de la categoría nueva"
            value="${isCustomCat ? escapeAttr(currentCat) : ''}"
            style="display:${isCustomCat ? 'block' : 'none'}">

          <label>Nombre</label>
          <input type="text" id="wf-name" required value="${entry ? escapeAttr(entry.name) : ''}">

          <label>Resumen (una línea corta)</label>
          <input type="text" id="wf-summary" value="${entry ? escapeAttr(entry.summary || '') : ''}">

          <label>Descripción</label>
          <textarea id="wf-description" rows="4">${entry ? escapeHtml(entry.description || '') : ''}</textarea>

          <label>Atributos</label>
          <div id="wf-stats-rows"></div>
          <button type="button" class="wiki-admin-btn wiki-admin-btn-secondary" id="wf-add-stat">+ Agregar atributo</button>

          <div class="wiki-form-actions">
            <button type="submit" class="wiki-admin-btn">${isEdit ? 'Guardar cambios' : 'Crear entrada'}</button>
            <button type="button" class="wiki-admin-btn wiki-admin-btn-secondary" id="wf-cancel">Cancelar</button>
          </div>
          <div class="wiki-form-error" id="wf-error"></div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const rowsEl = overlay.querySelector('#wf-stats-rows');
    const initialStats = (entry && entry.stats && entry.stats.length) ? entry.stats : [{ label: '', value: '' }];
    initialStats.forEach(s => addStatRow(rowsEl, s.label, s.value));

    overlay.querySelector('#wf-add-stat').addEventListener('click', () => addStatRow(rowsEl, '', ''));

    overlay.querySelector('#wf-category').addEventListener('change', (e) => {
      overlay.querySelector('#wf-category-custom').style.display = e.target.value === '__custom__' ? 'block' : 'none';
    });

    overlay.querySelector('#wf-cancel').addEventListener('click', closeForm);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });

    overlay.querySelector('#wiki-entry-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveForm(overlay, entry);
    });
  }

  function addStatRow(rowsEl, label, value) {
    const row = document.createElement('div');
    row.className = 'wf-stat-row';
    row.innerHTML = `
      <input type="text" class="wf-stat-label" placeholder="Etiqueta (ej: Vida)" value="${escapeAttr(label)}">
      <input type="text" class="wf-stat-value" placeholder="Valor (ej: 35.0)" value="${escapeAttr(value)}">
      <button type="button" class="wf-stat-remove" title="Quitar">✕</button>
    `;
    row.querySelector('.wf-stat-remove').addEventListener('click', () => row.remove());
    rowsEl.appendChild(row);
  }

  async function saveForm(overlay, entry) {
    const errorEl = overlay.querySelector('#wf-error');
    errorEl.textContent = '';

    const catSelect = overlay.querySelector('#wf-category').value;
    const catCustom = overlay.querySelector('#wf-category-custom').value.trim();
    const category = catSelect === '__custom__' ? catCustom : catSelect;

    const name = overlay.querySelector('#wf-name').value.trim();
    const summary = overlay.querySelector('#wf-summary').value.trim();
    const description = overlay.querySelector('#wf-description').value.trim();

    const stats = Array.from(overlay.querySelectorAll('.wf-stat-row')).map(row => ({
      label: row.querySelector('.wf-stat-label').value.trim(),
      value: row.querySelector('.wf-stat-value').value.trim()
    })).filter(s => s.label || s.value);

    if (!name) { errorEl.textContent = 'El nombre es obligatorio.'; return; }
    if (!category) { errorEl.textContent = 'Elegí o escribí una categoría.'; return; }

    const data = { name, category, summary, description, stats };

    try {
      if (entry) {
        await updateDoc(doc(db, COLLECTION_NAME, entry.id), data);
      } else {
        await addDoc(collection(db, COLLECTION_NAME), data);
      }
      closeForm();
    } catch (e) {
      console.error(e);
      errorEl.textContent = 'No se pudo guardar. ¿Seguís logueado como admin?';
    }
  }

  function closeForm() {
    const overlay = document.getElementById('wiki-form-overlay');
    if (overlay) overlay.remove();
  }

  // ---------- Búsqueda ----------
  if (wikiSearchEl) {
    wikiSearchEl.addEventListener('input', renderWikiList);
  }

  // ---------- Estado de admin ----------
  onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    renderAdminBar();
    renderWikiList();
  });

  // ---------- Carga en tiempo real desde Firestore ----------
  onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderWikiCategories();
    renderWikiList();
  }, (error) => {
    console.error('Error cargando la wiki:', error);
    wikiDetailEl.innerHTML = '<p class="wiki-placeholder">No se pudo cargar la wiki. Probá recargar la página.</p>';
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}
function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, '&quot;');
}

function injectAdminStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .wiki-admin-bar{display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap}
    .wiki-admin-btn{padding:8px 16px;border-radius:6px;border:none;background:#c9a24b;color:#111;font-weight:600;cursor:pointer;font-size:14px}
    .wiki-admin-btn-secondary{background:transparent;border:1px solid #c9a24b;color:#c9a24b}
    .wiki-admin-btn-danger{background:transparent;border:1px solid #ff8b8b;color:#ff8b8b}
    .wiki-admin-detail-actions{display:flex;gap:10px;margin-top:18px}
    .wiki-form-overlay{position:fixed;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;padding:20px;z-index:999}
    .wiki-form-box{background:#141b2e;border:1px solid #2c3550;border-radius:12px;padding:24px;max-width:520px;width:100%;max-height:88vh;overflow:auto}
    .wiki-form-box h3{margin-top:0;color:#c9a24b}
    .wiki-form-box label{display:block;margin:14px 0 6px;font-size:13px;color:#bcc4d6}
    .wiki-form-box input[type=text],.wiki-form-box select,.wiki-form-box textarea{
      width:100%;padding:9px 10px;border-radius:6px;border:1px solid #2c3550;background:#0e1424;color:#eee;font-family:inherit;font-size:14px;box-sizing:border-box}
    .wf-stat-row{display:flex;gap:8px;margin-bottom:8px}
    .wf-stat-row input{flex:1}
    .wf-stat-remove{background:transparent;border:1px solid #ff8b8b;color:#ff8b8b;border-radius:6px;padding:0 12px;cursor:pointer}
    .wiki-form-actions{display:flex;gap:10px;margin-top:18px}
    .wiki-form-error{color:#ff8b8b;font-size:13px;margin-top:10px}
  `;
  document.head.appendChild(style);
}