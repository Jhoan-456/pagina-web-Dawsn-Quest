// ---- Avances del proyecto (Firebase Firestore + admin panel) ----
// Todos pueden ver. Solo admins pueden agregar, editar o borrar avances.

import {
  collection, addDoc, updateDoc, deleteDoc,
  onSnapshot, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db, auth } from "/descarga/FireBaseInit.js";

const COLLECTION_NAME = 'avances_entradas';

const timelineEl = document.querySelector('.timeline');
if (!timelineEl) {
  // No hay sección de avances en esta página
} else {
  initAvances();
}

function initAvances() {
  injectAdminStyles();

  let avances = [];
  let isAdmin = false;

  function renderTimeline() {
    timelineEl.innerHTML = '';

    if (avances.length === 0) {
      const li = document.createElement('li');
      li.className = 'timeline-empty';
      li.textContent = isAdmin ? 'Sin avances. Agregá uno con el botón arriba.' : 'Sin avances por el momento.';
      timelineEl.appendChild(li);
      return;
    }

    // Ordenar por fecha (descendente, más reciente primero)
    const sorted = [...avances].sort((a, b) => {
      const aDate = new Date(a.fecha || 0).getTime();
      const bDate = new Date(b.fecha || 0).getTime();
      return bDate - aDate;
    });

    sorted.forEach(avance => {
      const li = document.createElement('li');
      li.className = 'timeline-item';

      const dateEl = document.createElement('span');
      dateEl.className = 't-date';
      dateEl.textContent = avance.fecha || 'Sin fecha';

      const titleEl = document.createElement('h4');
      titleEl.textContent = avance.titulo || 'Sin título';

      const descEl = document.createElement('p');
      descEl.textContent = avance.descripcion || '';

      li.appendChild(dateEl);
      li.appendChild(titleEl);
      li.appendChild(descEl);

      // Galería de imágenes
      if (avance.imagenes && avance.imagenes.length > 0) {
        avance.imagenes.forEach(img => {
          const figure = document.createElement('figure');
          figure.className = 'devlog-shot';

          const imgEl = document.createElement('img');
          imgEl.src = img.data;
          imgEl.alt = img.caption || '';

          const caption = document.createElement('figcaption');
          caption.textContent = img.caption || '';

          figure.appendChild(imgEl);
          figure.appendChild(caption);
          li.appendChild(figure);
        });
      }

      // Botones de admin
      if (isAdmin) {
        const actionsEl = document.createElement('div');
        actionsEl.className = 'timeline-item-actions';

        const editBtn = document.createElement('button');
        editBtn.className = 'wiki-admin-btn';
        editBtn.textContent = 'Editar';
        editBtn.addEventListener('click', () => openForm(avance));

        const delBtn = document.createElement('button');
        delBtn.className = 'wiki-admin-btn wiki-admin-btn-danger';
        delBtn.textContent = 'Borrar';
        delBtn.addEventListener('click', () => deleteAvance(avance));

        actionsEl.appendChild(editBtn);
        actionsEl.appendChild(delBtn);
        li.appendChild(actionsEl);
      }

      timelineEl.appendChild(li);
    });
  }

  // ---------- Panel de admin (botón arriba de la timeline) ----------
  function renderAdminBar() {
    let bar = document.getElementById('avances-admin-bar');
    if (!isAdmin) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'avances-admin-bar';
      bar.className = 'wiki-admin-bar';
      timelineEl.parentElement.insertBefore(bar, timelineEl);
    }
    bar.innerHTML = `<button class="wiki-admin-btn" id="avances-new-btn" type="button">+ Nuevo avance</button>`;
    document.getElementById('avances-new-btn').addEventListener('click', () => openForm(null));
  }

  // ---------- Modal de edición ----------
  function openForm(avance) {
    closeForm();

    const isEdit = !!avance;
    const overlay = document.createElement('div');
    overlay.id = 'avances-form-overlay';
    overlay.className = 'wiki-form-overlay';

    overlay.innerHTML = `
      <div class="wiki-form-box">
        <h3>${isEdit ? 'Editar avance' : 'Nuevo avance'}</h3>
        <form id="avances-entry-form">
          <label>Fecha / Etapa (ej: "Etapa actual 0.0.2 Alpha")</label>
          <input type="text" id="af-fecha" required value="${escapeAttr(avance?.fecha || '')}">

          <label>Título</label>
          <input type="text" id="af-titulo" required value="${escapeAttr(avance?.titulo || '')}">

          <label>Descripción</label>
          <textarea id="af-descripcion" rows="5">${escapeHtml(avance?.descripcion || '')}</textarea>

          <label>Imágenes</label>
          <div id="af-images-container"></div>
          <button type="button" class="wiki-admin-btn wiki-admin-btn-secondary" id="af-add-image">+ Agregar imagen</button>

          <div class="wiki-form-actions">
            <button type="submit" class="wiki-admin-btn">${isEdit ? 'Guardar cambios' : 'Crear avance'}</button>
            <button type="button" class="wiki-admin-btn wiki-admin-btn-secondary" id="af-cancel">Cancelar</button>
          </div>
          <div class="wiki-form-error" id="af-error"></div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const imgsContainer = overlay.querySelector('#af-images-container');
    const initialImages = (avance && avance.imagenes && avance.imagenes.length)
      ? avance.imagenes
      : [{ data: '', caption: '' }];

    initialImages.forEach(img => addImageRow(imgsContainer, img.data, img.caption));

    overlay.querySelector('#af-add-image').addEventListener('click', () => addImageRow(imgsContainer, '', ''));
    overlay.querySelector('#af-cancel').addEventListener('click', closeForm);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });

    overlay.querySelector('#avances-entry-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveForm(overlay, avance);
    });
  }

  function addImageRow(container, imageData, caption) {
    const row = document.createElement('div');
    row.className = 'af-image-row';
    row.innerHTML = `
      <div class="af-image-preview-box">
        <img class="af-image-preview" src="${imageData || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%232c3550%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'}" alt="preview">
        <input type="file" class="af-file-input" accept="image/*" style="display:none;">
        <button type="button" class="af-upload-btn" title="Subir imagen">📤</button>
      </div>
      <div class="af-image-info">
        <input type="text" class="af-caption" placeholder="Caption de la imagen" value="${escapeAttr(caption)}">
        <button type="button" class="af-remove-image" title="Quitar imagen">✕ Quitar</button>
      </div>
    `;

    const fileInput = row.querySelector('.af-file-input');
    const uploadBtn = row.querySelector('.af-upload-btn');
    const preview = row.querySelector('.af-image-preview');
    const removeBtn = row.querySelector('.af-remove-image');

    uploadBtn.addEventListener('click', (e) => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target.result;
        row.dataset.imageData = base64;
        preview.src = base64;
        preview.style.opacity = '1';
      };
      reader.readAsDataURL(file);
    });

    removeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      row.remove();
    });

    if (imageData) {
      row.dataset.imageData = imageData;
    }

    container.appendChild(row);
  }

  async function saveForm(overlay, avance) {
    const errorEl = overlay.querySelector('#af-error');
    errorEl.textContent = '';

    const fecha = overlay.querySelector('#af-fecha').value.trim();
    const titulo = overlay.querySelector('#af-titulo').value.trim();
    const descripcion = overlay.querySelector('#af-descripcion').value.trim();

    if (!fecha || !titulo) {
      errorEl.textContent = 'Fecha y título son obligatorios.';
      return;
    }

    const imagenes = Array.from(overlay.querySelectorAll('.af-image-row'))
      .map(row => {
        const data = row.dataset.imageData || '';
        const caption = row.querySelector('.af-caption').value.trim();
        return { data, caption };
      })
      .filter(img => img.data); // Solo guardar imágenes que tengan data

    const data = { fecha, titulo, descripcion, imagenes };

    try {
      if (avance) {
        await updateDoc(doc(db, COLLECTION_NAME, avance.id), data);
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
    const overlay = document.getElementById('avances-form-overlay');
    if (overlay) overlay.remove();
  }

  async function deleteAvance(avance) {
    if (!confirm(`¿Borrar el avance "${avance.titulo}"? Esto no se puede deshacer.`)) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, avance.id));
    } catch (e) {
      console.error(e);
      alert('No se pudo borrar. ¿Seguís logueado como admin?');
    }
  }

  // ---------- Estado de admin ----------
  onAuthStateChanged(auth, (user) => {
    isAdmin = !!user;
    renderAdminBar();
    renderTimeline();
  });

  // ---------- Carga en tiempo real desde Firestore ----------
  onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    avances = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTimeline();
  }, (error) => {
    console.error('Error cargando los avances:', error);
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
    .timeline-item-actions { display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
    .af-image-row { display: flex; gap: 12px; margin-bottom: 14px; padding: 12px; background: #0e1424; border-radius: 6px; }
    .af-image-preview-box { position: relative; width: 100px; height: 100px; flex-shrink: 0; }
    .af-image-preview { width: 100%; height: 100%; object-fit: cover; border-radius: 6px; border: 1px solid #2c3550; opacity: 0.6; }
    .af-upload-btn { position: absolute; bottom: 4px; right: 4px; background: #c9a24b; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; }
    .af-image-info { flex: 1; display: flex; flex-direction: column; gap: 6px; }
    .af-caption { padding: 8px 10px; border-radius: 6px; border: 1px solid #2c3550; background: transparent; color: #eee; font-size: 13px; }
    .af-remove-image { background: transparent; border: 1px solid #ff8b8b; color: #ff8b8b; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-size: 13px; }
  `;
  document.head.appendChild(style);
}