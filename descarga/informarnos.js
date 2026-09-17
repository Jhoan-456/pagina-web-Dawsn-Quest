// ---- Buzones de errores e ideas (Firebase Firestore + login de admin) ----
// Cualquiera puede leer y enviar mensajes.
// Solo un admin logueado (correo/contraseña de Firebase Authentication) puede
// responder públicamente o borrar cualquier mensaje. Esto también está reforzado
// en las reglas de seguridad de Firestore, así que no depende solo de este código.

import {
  collection, addDoc, onSnapshot,
  doc, updateDoc, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { db, auth } from "/descarga/FireBaseInit.js";

const COLLECTION_NAME = 'buzon_mensajes';

let isAdmin = false;
let currentAdminEmail = null;
let activeReportType = 'error';
let allMessages = []; // se actualiza solo, en tiempo real, desde Firestore

function formatFecha(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ================== ADMIN: login/logout ==================

function injectAdminLoginUI() {
  const panel = document.getElementById('panel-informarnos');
  if (!panel) return;

  const style = document.createElement('style');
  style.textContent = `
    .admin-box{background:#141b2e;border:1px solid #2c3550;border-radius:10px;padding:14px 16px;margin-bottom:24px}
    .admin-box.logged-in{border-color:#c9a24b}
    .admin-toggle-link{color:#c9a24b;cursor:pointer;text-decoration:underline;font-size:14px;background:none;border:none;padding:0}
    .admin-login-form{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
    .admin-login-form input{flex:1;min-width:140px;padding:8px 10px;border-radius:6px;border:1px solid #2c3550;background:#0e1424;color:#eee}
    .admin-login-form button{padding:8px 16px;border-radius:6px;border:none;background:#c9a24b;color:#111;font-weight:600;cursor:pointer}
    .admin-status{color:#8fd694;font-size:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}
    .admin-status button{padding:6px 12px;border-radius:6px;border:1px solid #ff8b8b;background:transparent;color:#ff8b8b;cursor:pointer}
    .admin-error{color:#ff8b8b;font-size:13px;margin-top:8px}
    .buzon-item-reply{margin-top:8px;padding:10px 12px;background:#0e1424;border-left:3px solid #c9a24b;border-radius:6px;font-size:14px}
    .buzon-item-reply-label{color:#c9a24b;font-weight:600;margin-bottom:4px;display:block}
    .buzon-reply-form{margin-top:8px;display:flex;flex-direction:column;gap:6px}
    .buzon-item-actions{margin-top:8px;display:flex;gap:8px;flex-wrap:wrap}
  `;
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id = 'admin-box';
  box.className = 'admin-box';
  box.innerHTML = `
    <button class="admin-toggle-link" id="admin-toggle-link">Acceso de administrador</button>
    <div id="admin-login-area"></div>
  `;
  panel.insertBefore(box, panel.firstChild);

  document.getElementById('admin-toggle-link').addEventListener('click', () => {
    renderAdminArea(true);
  });

  renderAdminArea(false);
}

function renderAdminArea(open) {
  const area = document.getElementById('admin-login-area');
  const toggleLink = document.getElementById('admin-toggle-link');
  const box = document.getElementById('admin-box');
  if (!area || !toggleLink || !box) return;

  if (isAdmin) {
    box.classList.add('logged-in');
    toggleLink.style.display = 'none';
    area.innerHTML = `
      <div class="admin-status">
        Conectado como admin: <strong>${currentAdminEmail}</strong>
        <button id="admin-logout-btn" type="button">Cerrar sesión</button>
      </div>
    `;
    document.getElementById('admin-logout-btn').addEventListener('click', () => signOut(auth));
    return;
  }

  box.classList.remove('logged-in');

  if (!open) {
    toggleLink.style.display = 'inline';
    area.innerHTML = '';
    return;
  }

  toggleLink.style.display = 'none';
  area.innerHTML = `
    <form class="admin-login-form" id="admin-login-form">
      <input type="email" id="admin-email" placeholder="Correo de admin" required>
      <input type="password" id="admin-password" placeholder="Contraseña" required>
      <button type="submit">Entrar</button>
    </form>
    <div class="admin-error" id="admin-error"></div>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const errorEl = document.getElementById('admin-error');
    errorEl.textContent = '';
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      errorEl.textContent = 'No se pudo iniciar sesión. Revisá el correo y la contraseña.';
    }
  });
}

onAuthStateChanged(auth, (user) => {
  isAdmin = !!user;
  currentAdminEmail = user ? user.email : null;
  renderAdminArea(isAdmin);
  renderAll();
});

// ================== Render de los buzones ==================

function renderBuzon(type) {
  const listEl = document.getElementById('list-' + type);
  const countEl = document.getElementById('count-' + type);
  if (!listEl || !countEl) return;

  const items = allMessages.filter(m => m.type === type);
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

    // Respuesta del admin, visible para todos si existe
    if (item.respuesta) {
      const replyEl = document.createElement('div');
      replyEl.className = 'buzon-item-reply';
      replyEl.innerHTML = `<span class="buzon-item-reply-label">Respuesta del equipo</span>`;
      const replyText = document.createElement('span');
      replyText.textContent = item.respuesta;
      replyEl.appendChild(replyText);
      li.appendChild(replyEl);
    }

    // Controles solo para admins logueados
    if (isAdmin) {
      const actionsEl = document.createElement('div');
      actionsEl.className = 'buzon-item-actions';

      const replyBtn = document.createElement('button');
      replyBtn.className = 'buzon-item-btn';
      replyBtn.textContent = item.respuesta ? 'Editar respuesta' : 'Responder';
      replyBtn.addEventListener('click', () => startReply(item, li));

      const delBtn = document.createElement('button');
      delBtn.className = 'buzon-item-btn buzon-item-btn-danger';
      delBtn.textContent = 'Borrar';
      delBtn.addEventListener('click', () => deleteItem(item.id));

      actionsEl.appendChild(replyBtn);
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

// ================== Acciones ==================

async function addItem(type, text) {
  try {
    await addDoc(collection(db, COLLECTION_NAME), {
      type,
      text,
      created: Date.now()
    });
  } catch (e) {
    console.error('No se pudo enviar el mensaje:', e);
    alert('No se pudo enviar el mensaje. Revisá tu conexión e intentá de nuevo.');
  }
}

async function deleteItem(id) {
  if (!confirm('¿Borrar este mensaje?')) return;
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (e) {
    console.error('No se pudo borrar:', e);
    alert('No se pudo borrar el mensaje. ¿Seguís logueado como admin?');
  }
}

function startReply(item, liEl) {
  const actionsEl = liEl.querySelector('.buzon-item-actions');
  if (!actionsEl) return;

  const formEl = document.createElement('div');
  formEl.className = 'buzon-reply-form';

  const textarea = document.createElement('textarea');
  textarea.className = 'report-textarea';
  textarea.value = item.respuesta || '';
  textarea.placeholder = 'Escribí la respuesta que van a ver todos los visitantes...';

  const btnRow = document.createElement('div');
  btnRow.className = 'buzon-item-actions';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'buzon-item-btn';
  saveBtn.textContent = 'Guardar respuesta';
  saveBtn.addEventListener('click', async () => {
    const newReply = textarea.value.trim();
    try {
      await updateDoc(doc(db, COLLECTION_NAME, item.id), { respuesta: newReply });
    } catch (e) {
      console.error('No se pudo guardar la respuesta:', e);
      alert('No se pudo guardar la respuesta. ¿Seguís logueado como admin?');
    }
  });

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'buzon-item-btn';
  cancelBtn.textContent = 'Cancelar';
  cancelBtn.addEventListener('click', renderAll);

  btnRow.appendChild(saveBtn);
  btnRow.appendChild(cancelBtn);
  formEl.appendChild(textarea);
  formEl.appendChild(btnRow);

  actionsEl.replaceWith(formEl);
  textarea.focus();
}

// ================== Inicialización ==================

function initInformarnos() {
  const panelExists = document.getElementById('panel-informarnos');
  if (!panelExists) return; // el panel no está en esta página

  injectAdminLoginUI();

  const typeButtons = document.querySelectorAll('.report-type-btn');
  const textArea = document.getElementById('report-text');
  const submitBtn = document.getElementById('report-submit');

  if (!submitBtn) return;

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

  const q = query(collection(db, COLLECTION_NAME), orderBy('created', 'desc'));
  onSnapshot(q, (snapshot) => {
    allMessages = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAll();
  }, (error) => {
    console.error('Error escuchando el buzón:', error);
  });
}

initInformarnos();