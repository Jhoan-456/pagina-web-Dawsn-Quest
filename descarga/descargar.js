// ---- Configuración editable ----
// Reemplazá cada URL cuando tengan los builds subidos (GitHub Releases, Drive, itch.io, etc.)
const CONFIG = {
  version: "v0.0.2 — Alpha",
  windows: {
    url: "https://github.com/Jhoan-456/DAWN-QUEST-/releases/download/DAWN_QUEST/Dawn_Quest_Beta.exe",
    size: "105 MB"
  },
  android: {
    url: "https://github.com/Jhoan-456/DAWN-QUEST-/releases/download/DAWN_QUEST/Dawn.Quest.apk",
    size: "41.8 MB"
  }
};

// Rellenar tamaños/enlaces en los botones
document.getElementById('version-badge').textContent = "Versión: " + CONFIG.version;
document.getElementById('windows-size').textContent = CONFIG.windows.size;
document.getElementById('windows-btn').href = CONFIG.windows.url;
document.getElementById('android-size').textContent = CONFIG.android.size;
document.getElementById('android-btn').href = CONFIG.android.url;

// ---- Detección simple de plataforma ----
function detectPlatform() {
  const ua = navigator.userAgent || navigator.vendor || "";
  const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);
  return isMobile ? "celular" : "pc";
}

const detected = detectPlatform();
const noticeEl = document.getElementById('detected-text');
noticeEl.textContent = detected === "celular" ?
  "Detectamos que estás entrando desde un celular." :
  "Detectamos que estás entrando desde una PC.";

// ---- Toggle de plataforma ----
const toggleButtons = document.querySelectorAll('.toggle-btn');
const panels = {
  pc: document.getElementById('panel-pc'),
  celular: document.getElementById('panel-celular'),
};

function activatePlatform(platform) {
  toggleButtons.forEach(b => {
    const isActive = b.dataset.platform === platform;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
  Object.entries(panels).forEach(([key, panel]) => {
    panel.classList.toggle('active', key === platform);
  });
}

toggleButtons.forEach(btn => {
  btn.addEventListener('click', () => activatePlatform(btn.dataset.platform));
});

// Al cargar, mostrar automáticamente la pestaña detectada
activatePlatform(detected);