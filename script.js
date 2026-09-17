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

});