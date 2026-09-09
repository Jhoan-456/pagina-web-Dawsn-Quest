// ---- Buzones de errores e ideas ----
// Los mensajes se guardan en localStorage, en el navegador de cada visitante.
// No hay servidor: esto no comparte los mensajes entre distintas personas.

const STORAGE_KEYS = {
  error: 'dawnquest_buzon_errores',
  idea: 'dawnquest_buzon_ideas',
};

let activeReportType = 'error';

function loadBuzon(type) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[type]);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('No se pudo leer el buzón:', e);
    return [];
  }
}

function saveBuzon(type, items) {
  try {
    localStorage.setItem(STORAGE_KEYS[type], JSON.stringify(items));
  } catch (e) {
    console.error('No se pudo guardar el buzón:', e);
  }
}

function formatFecha(timestamp) {
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderBuzon(type) {
  const items = loadBuzon(type);
  const listEl = document.getElementById('list-' + type);
  const countEl = document.getElementById('count-' + type);
  if (!listEl || !countEl) return;

  countEl.textContent = items.length;
  listEl.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'buzon-empty';
    empty.textContent = type === 'error'
      ? 'Todavía no hay errores reportados.'
      : 'Todavía no hay ideas agregadas.';
    listEl.appendChild(empty);
    return;
  }

  // Más nuevos primero
  items.slice().reverse().forEach(item => {
    const li = document.createElement('li');
    li.className = 'buzon-item';

    const textEl = document.createElement('p');
    textEl.className = 'buzon-item-text';
    textEl.textContent = item.text;

    const metaEl = document.createElement('div');
    metaEl.className = 'buzon-item-meta';
    metaEl.textContent = formatFecha(item.created);

    const actionsEl = document.createElement('div');
    actionsEl.className = 'buzon-item-actions';

    const editBtn = document.createElement('button');
    editBtn.className = 'buzon-item-btn';
    editBtn.textContent = 'Editar';
    editBtn.addEventListener('click', () => startEdit(type, item.id, li, textEl));

    const delBtn = document.createElement('button');
    delBtn.className = 'buzon-item-btn buzon-item-btn-danger';
    delBtn.textContent = 'Borrar';
    delBtn.addEventListener('click', () => deleteItem(type, item.id));

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(delBtn);

    li.appendChild(textEl);
    li.appendChild(metaEl);
    li.appendChild(actionsEl);
    listEl.appendChild(li);
  });
}

function addItem(type, text) {
  const items = loadBuzon(type);
  items.push({
    id: Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    text: text,
    created: Date.now(),
  });
  saveBuzon(type, items);
  renderBuzon(type);
}

function deleteItem(type, id) {
  if (!confirm('¿Borrar este mensaje?')) return;
  const items = loadBuzon(type).filter(i => i.id !== id);
  saveBuzon(type, items);
  renderBuzon(type);
}

function startEdit(type, id, liEl, textEl) {
  const items = loadBuzon(type);
  const item = items.find(i => i.id === id);
  if (!item) return;

  const textarea = document.createElement('textarea');
  textarea.className = 'report-textarea buzon-edit-textarea';
  textarea.value = item.text;
  liEl.insertBefore(textarea, textEl);
  liEl.removeChild(textEl);

  const actionsEl = liEl.querySelector('.buzon-item-actions');
  actionsEl.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'buzon-item-btn';
  saveBtn.textContent = 'Guardar';
  saveBtn.addEventListener('click', () => {
    const newText = textarea.value.trim();
    if (!newText) return;
    item.text = newText;
    saveBuzon(type, items);
    renderBuzon(type);
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'buzon-item-btn';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', () => renderBuzon(type));

  actionsEl.appendChild(saveBtn);
  actionsEl.appendChild(cancelBtn);
  textarea.focus();
}

function initInformarnos() {
  const typeButtons = document.querySelectorAll('.report-type-btn');
  const textArea = document.getElementById('report-text');
  const submitBtn = document.getElementById('report-submit');

  if (!submitBtn) return; // el panel no está en esta página

  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      typeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeReportType = btn.dataset.type;
      textArea.placeholder = activeReportType === 'error'
        ? 'Contanos qué pasó, en qué pantalla, y qué esperabas que pasara...'
        : 'Contanos tu idea para el juego...';
    });
  });

  submitBtn.addEventListener('click', () => {
    const text = textArea.value.trim();
    if (!text) {
      textArea.focus();
      return;
    }
    addItem(activeReportType, text);
    textArea.value = '';
  });

  renderBuzon('error');
  renderBuzon('idea');
}

initInformarnos();
