// ---- Buzones de errores e ideas (Firebase Firestore) ----
// Los mensajes ahora se guardan en la nube: los ve cualquiera que entre a la página.
// Cada navegador solo puede editar/borrar los mensajes que ÉL creó (se recuerda con localStorage),
// pero todos pueden LEER todos los mensajes.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, onSnapshot,
  doc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ---- Configuración de tu proyecto Firebase ----
const firebaseConfig = {
  apiKey: "AIzaSyCAoxmKxlM-VfaSqO2dc268E5ErDRr1bu8",
  authDomain: "dawn-quest-web.firebaseapp.com",
  projectId: "dawn-quest-web",
  storageBucket: "dawn-quest-web.firebasestorage.app",
  messagingSenderId: "669790589335",
  appId: "1:669790589335:web:b2af282cbc47388aa474d2",
  measurementId: "G-H6C8NH91KZ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION_NAME = 'buzon_mensajes';

// ---- Qué mensajes son "míos" (para mostrar editar/borrar solo en los propios) ----
const MY_MESSAGES_KEY = 'dawnquest_mis_mensajes';

function getMyMessageIds() {
  try {
    const raw = localStorage.getItem(MY_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
function addMyMessageId(id) {
  const ids = getMyMessageIds();
  ids.push(id);
  localStorage.setItem(MY_MESSAGES_KEY, JSON.stringify(ids));
}
function removeMyMessageId(id) {
  const ids = getMyMessageIds().filter(i => i !== id);
  localStorage.setItem(MY_MESSAGES_KEY, JSON.stringify(ids));
}

let activeReportType = 'error';
let allMessages = []; // se actualiza solo, en tiempo real, desde Firestore

function formatFecha(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderBuzon(type) {
  const listEl = document.getElementById('list-' + type);
  const countEl = document.getElementById('count-' + type);
  if (!listEl || !countEl) return;

  const items = allMessages.filter(m => m.type === type);
  const myIds = getMyMessageIds();

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

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'buzon-item';

    const textEl = document.createElement('p');
    textEl.className = 'buzon-item-text';
    textEl.textContent = item.text;

    const metaEl = document.createElement('div');
    metaEl.className = 'buzon-item-meta';
    metaEl.textContent = formatFecha(item.created);

    li.appendChild(textEl);
    li.appendChild(metaEl);

    // Solo mostrar Editar/Borrar si este mensaje lo creó este mismo navegador
    if (myIds.includes(item.id)) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'buzon-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'buzon-item-btn';
      editBtn.textContent = 'Editar';
      editBtn.addEventListener('click', () => startEdit(item, li, textEl));

      const delBtn = document.createElement('button');
      delBtn.className = 'buzon-item-btn buzon-item-btn-danger';
      delBtn.textContent = 'Borrar';
      delBtn.addEventListener('click', () => deleteItem(item.id));

      actionsEl.appendChild(editBtn);
      actionsEl.appendChild(delBtn);
      li.appendChild(actionsEl);
    }

    listEl.appendChild(li);
  });
}

function renderAll() {
  renderBuzon('error');
  renderBuzon('idea');
}

async function addItem(type, text) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      type,
      text,
      created: Date.now()
    });
    addMyMessageId(docRef.id);
  } catch (e) {
    console.error('No se pudo enviar el mensaje:', e);
    alert('No se pudo enviar el mensaje. Revisá tu conexión e intentá de nuevo.');
  }
}

async function deleteItem(id) {
  if (!confirm('¿Borrar este mensaje?')) return;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
    removeMyMessageId(id);
  } catch (e) {
    console.error('No se pudo borrar:', e);
    alert('No se pudo borrar el mensaje.');
  }
}

function startEdit(item, liEl, textEl) {
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
  saveBtn.addEventListener('click', async () => {
    const newText = textarea.value.trim();
    if (!newText) return;
    try {
      await updateDoc(doc(db, COLLECTION_NAME, item.id), { text: newText });
    } catch (e) {
      console.error('No se pudo editar:', e);
      alert('No se pudo guardar el cambio.');
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'buzon-item-btn';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', renderAll);

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

  submitBtn.addEventListener('click', async () => {
    const text = textArea.value.trim();
    if (!text) {
      textArea.focus();
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    await addItem(activeReportType, text);
    textArea.value = '';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Enviar';
  });

  // Escucha en tiempo real: cuando alguien agrega/edita/borra, se actualiza para todos
  const q = query(collection(db, COLLECTION_NAME), orderBy('created', 'desc'));
  onSnapshot(q, (snapshot) => {
    allMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  }, (error) => {
    console.error('Error escuchando el buzón:', error);
  });
}

initInformarnos();