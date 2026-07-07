// ============================================================
// MU Tracker — popup.js v2 (Compact + Panel)
// ============================================================

// ---- Detección de modo panel ----
const IS_PANEL = new URLSearchParams(window.location.search).has('panel');

// ---- Estado global ----
let lists        = [];
let selectedListId = null;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (IS_PANEL) {
    document.documentElement.classList.add('panel-mode');
    document.title = 'MU Tracker — Panel';
  }

  await loadData();
  renderAll();
  bindEvents();
  startCountdown();
});

// Actualización desde background (polling automático)
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'POLL_COMPLETE') {
    loadData().then(renderCharacters);
  }
});

// ============================================================
// STORAGE
// ============================================================
async function loadData() {
  const data = await chrome.storage.local.get('lists');
  lists = data.lists || [];
}

async function saveData() {
  await chrome.storage.local.set({ lists });
}

// ============================================================
// RENDER PRINCIPAL
// ============================================================
function renderAll() {
  renderTabs();

  if (lists.length === 0) {
    showView('empty');
    setAddPanelEnabled(false);
    return;
  }

  if (!selectedListId || !lists.find(l => l.id === selectedListId)) {
    selectedListId = lists[0].id;
  }

  showView('list');
  renderListHeader();
  renderCharacters();
  setAddPanelEnabled(true);
  updateAddBtn();
}

function renderTabs() {
  const container = document.getElementById('lists-tabs');
  container.innerHTML = '';

  lists.forEach(list => {
    const tab = document.createElement('div');
    tab.className = [
      'list-tab',
      list.id === selectedListId ? 'selected' : '',
      list.active ? 'is-active' : 'is-inactive'
    ].filter(Boolean).join(' ');
    tab.dataset.id = list.id;
    tab.title = `${list.name} — ${list.characters.length} personaje(s)`;

    const dot = document.createElement('span');
    dot.className = 'tab-dot';

    const label = document.createElement('span');
    label.textContent = list.name;

    // Badge count si tiene personajes
    if (list.characters.length > 0) {
      const cnt = document.createElement('span');
      cnt.style.cssText = 'font-size:9px;color:var(--text-dim);';
      cnt.textContent = list.characters.length;
      tab.appendChild(dot);
      tab.appendChild(label);
      tab.appendChild(cnt);
    } else {
      tab.appendChild(dot);
      tab.appendChild(label);
    }

    tab.addEventListener('click', () => selectList(list.id));
    container.appendChild(tab);
  });
}

function renderListHeader() {
  const list = getSelectedList();
  if (!list) return;

  document.getElementById('list-name-display').textContent = list.name;
  document.getElementById('list-active-toggle').checked = list.active;
  document.getElementById('toggle-label').textContent = list.active ? 'Activa' : 'Inact.';
  document.getElementById('chars-count').textContent = `${list.characters.length} pers.`;
}

function renderCharacters() {
  const list = getSelectedList();
  if (!list) return;

  const container = document.getElementById('chars-list');
  container.innerHTML = '';

  const noChars = document.getElementById('no-characters');
  const colHdr  = document.querySelector('.chars-col-header');

  if (list.characters.length === 0) {
    noChars.classList.remove('hidden');
    if (colHdr) colHdr.style.display = 'none';
    return;
  }

  noChars.classList.add('hidden');
  if (colHdr) colHdr.style.display = '';

  list.characters.forEach(char => {
    container.appendChild(buildCharRow(char));
  });

  // Actualizar counter
  document.getElementById('chars-count').textContent = `${list.characters.length} pers.`;
}

// ============================================================
// CONSTRUCCIÓN DE FILA COMPACTA
// ============================================================
function buildCharRow(char) {
  const row      = document.createElement('div');
  const isLoading = !!char.loading;
  const hasError  = !isLoading && !!char.error;
  const hasData   = !isLoading && !hasError && char.map != null;

  row.className = [
    'char-row',
    isLoading ? 'row-loading' : '',
    hasError  ? 'row-error'   : ''
  ].filter(Boolean).join(' ');

  // Barra lateral de estado
  const statusBar = document.createElement('div');
  statusBar.className = 'row-status-bar';

  // Nombre
  const displayName = char.name || extractUuidFromUrl(char.url);
  const nameEl = document.createElement('span');
  nameEl.className = 'row-name' + (isLoading || !char.name ? ' name-dim' : '');
  nameEl.textContent = isLoading ? 'Cargando...' : displayName;
  nameEl.title = displayName;

  // Ubicación
  const locEl = document.createElement('div');
  locEl.className = 'row-loc';

  if (isLoading) {
    const s = document.createElement('span');
    s.className = 'row-no-data';
    s.textContent = '—';
    locEl.appendChild(s);
  } else if (hasError) {
    const e = document.createElement('span');
    e.className = 'row-error-txt';
    e.textContent = '⚠ ' + char.error;
    e.title = char.error;
    locEl.appendChild(e);
  } else if (hasData) {
    const mapEl = document.createElement('span');
    mapEl.className = 'row-map';
    mapEl.textContent = char.map;
    mapEl.title = char.map;

    const coordEl = document.createElement('span');
    coordEl.className = 'row-coords';
    coordEl.textContent = `(${char.x}, ${char.y})`;

    locEl.appendChild(mapEl);
    locEl.appendChild(coordEl);
  } else {
    const nd = document.createElement('span');
    nd.className = 'row-no-data';
    nd.textContent = 'Sin datos';
    locEl.appendChild(nd);
  }

  // Tiempo transcurrido (compacto: "3m", "1h", "ya")
  const ageEl = document.createElement('span');
  ageEl.className = 'row-age';
  if (char.lastUpdated && !isLoading) {
    ageEl.textContent = formatCompactTime(char.lastUpdated);
    ageEl.title = 'Actualizado: ' + new Date(char.lastUpdated).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  }

  // Acciones
  const actionsEl = document.createElement('div');
  actionsEl.className = 'row-actions';

  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'row-refresh' + (isLoading ? ' spinning' : '');
  refreshBtn.textContent = '↻';
  refreshBtn.title = 'Actualizar ahora';
  refreshBtn.addEventListener('click', () => onRefreshChar(char.url));

  const removeBtn = document.createElement('button');
  removeBtn.className = 'row-remove';
  removeBtn.textContent = '✕';
  removeBtn.title = 'Quitar de la lista';
  removeBtn.addEventListener('click', () => onRemoveChar(char.url));

  actionsEl.appendChild(refreshBtn);
  actionsEl.appendChild(removeBtn);

  row.appendChild(statusBar);
  row.appendChild(nameEl);
  row.appendChild(locEl);
  row.appendChild(ageEl);
  row.appendChild(actionsEl);

  return row;
}

// ============================================================
// EVENTOS
// ============================================================
function bindEvents() {
  // Nueva lista
  document.getElementById('btn-new-list').addEventListener('click', openModal);

  // Pop-out panel
  document.getElementById('btn-popout').addEventListener('click', popOut);

  // Modal
  document.getElementById('btn-confirm-modal').addEventListener('click', confirmCreateList);
  document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
  document.getElementById('new-list-name-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter')  confirmCreateList();
    if (e.key === 'Escape') closeModal();
  });
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });

  // Toggle activa/inactiva
  document.getElementById('list-active-toggle').addEventListener('change', async (e) => {
    const list = getSelectedList();
    if (!list) return;
    list.active = e.target.checked;
    document.getElementById('toggle-label').textContent = list.active ? 'Activa' : 'Inact.';
    await saveData();
    // Actualizar dot del tab
    const tab = document.querySelector(`.list-tab[data-id="${selectedListId}"]`);
    if (tab) {
      tab.classList.toggle('is-active',   list.active);
      tab.classList.toggle('is-inactive', !list.active);
    }
  });

  // Eliminar lista
  document.getElementById('btn-delete-list').addEventListener('click', onDeleteList);

  // Panel agregar
  document.getElementById('btn-toggle-add').addEventListener('click', toggleAddPanel);

  document.getElementById('links-textarea').addEventListener('input', () => {
    const val = document.getElementById('links-textarea').value.trim();
    document.getElementById('btn-add-chars').disabled = val.length === 0 || !selectedListId;
  });

  document.getElementById('btn-add-chars').addEventListener('click', onAddCharacters);

  // Importar / Exportar
  document.getElementById('btn-export').addEventListener('click', onExportLists);
  document.getElementById('btn-import').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('import-file').addEventListener('change', handleImportFile);
}

// ============================================================
// IMPORT / EXPORT
// ============================================================
function onExportLists() {
  if (lists.length === 0) {
    alert('No hay listas para exportar.');
    return;
  }
  
  const dataStr = JSON.stringify({ version: 1, lists: lists }, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `mu_tracker_listas_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

function handleImportFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.lists || !Array.isArray(data.lists)) {
        throw new Error('Formato de archivo inválido.');
      }
      
      const confirmMsg = `¿Deseas reemplazar tus listas actuales por las ${data.lists.length} listas del archivo?\n\n- OK = Reemplazar todo\n- Cancelar = Cancelar importación`;
      if (confirm(confirmMsg)) {
        lists = data.lists;
        await saveData();
        selectedListId = lists.length > 0 ? lists[0].id : null;
        renderAll();
        alert('¡Listas importadas correctamente!');
      }
    } catch (err) {
      alert('Error al importar: ' + err.message);
    } finally {
      // Limpiar el input para permitir importar el mismo archivo de nuevo si se desea
      e.target.value = '';
    }
  };
  reader.readAsText(file);
}

// ============================================================
// LISTAS
// ============================================================
function selectList(id) {
  selectedListId = id;
  showView('list');
  renderTabs();
  renderListHeader();
  renderCharacters();
  setAddPanelEnabled(true);
  updateAddBtn();
}

function showView(view) {
  document.getElementById('view-empty').classList.add('hidden');
  document.getElementById('view-list').classList.add('hidden');
  if (view === 'empty') document.getElementById('view-empty').classList.remove('hidden');
  if (view === 'list')  document.getElementById('view-list').classList.remove('hidden');
}

function openModal() {
  document.getElementById('modal-overlay').classList.remove('hidden');
  const inp = document.getElementById('new-list-name-input');
  inp.value = '';
  setTimeout(() => inp.focus(), 50);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

async function confirmCreateList() {
  const inp  = document.getElementById('new-list-name-input');
  const name = inp.value.trim();
  if (!name) { inp.style.borderColor = 'var(--red)'; setTimeout(() => (inp.style.borderColor = ''), 1200); return; }

  const newList = { id: generateId(), name, active: true, characters: [] };
  lists.push(newList);
  await saveData();
  closeModal();
  selectedListId = newList.id;
  renderAll();
}

async function onDeleteList() {
  const list = getSelectedList();
  if (!list) return;
  if (!confirm(`¿Eliminar "${list.name}"?`)) return;
  lists = lists.filter(l => l.id !== selectedListId);
  selectedListId = null;
  await saveData();
  renderAll();
}

// ============================================================
// PERSONAJES
// ============================================================
async function onRefreshChar(url) {
  const list = getSelectedList();
  if (!list) return;
  const char = list.characters.find(c => c.url === url);
  if (!char || char.loading) return;

  char.loading = true;
  renderCharacters();

  const result = await chrome.runtime.sendMessage({ type: 'FETCH_CHARACTER', url });
  applyFetchResult(char, result);

  await saveData();
  renderCharacters();
}

async function onRemoveChar(url) {
  const list = getSelectedList();
  if (!list) return;
  list.characters = list.characters.filter(c => c.url !== url);
  await saveData();
  renderCharacters();
}

function applyFetchResult(char, result) {
  if (!result || result.error) {
    char.error   = (result && result.error) ? result.error : 'Error de conexión';
    char.loading = false;
  } else {
    char.name        = result.name || extractUuidFromUrl(char.url);
    char.map         = result.map;
    char.x           = result.x;
    char.y           = result.y;
    char.error       = null;
    char.loading     = false;
    char.lastUpdated = new Date().toISOString();
  }
}

// ============================================================
// AGREGAR PERSONAJES
// ============================================================
function toggleAddPanel() {
  const form    = document.getElementById('add-form');
  const chevron = document.getElementById('add-chevron');
  const isOpen  = !form.classList.contains('hidden');
  form.classList.toggle('hidden', isOpen);
  chevron.classList.toggle('open', !isOpen);
}

function setAddPanelEnabled(enabled) {
  const panel = document.getElementById('add-panel');
  panel.style.opacity  = enabled ? '' : '0.4';
  document.getElementById('btn-toggle-add').disabled = !enabled;
}

function updateAddBtn() {
  const list = getSelectedList();
  const btn  = document.getElementById('btn-add-chars');
  const name = document.getElementById('btn-add-list-name');
  if (list) name.textContent = `"${list.name}"`;
  const val = document.getElementById('links-textarea').value.trim();
  btn.disabled = val.length === 0 || !selectedListId;
}

async function onAddCharacters() {
  const list = getSelectedList();
  if (!list) return;

  const raw      = document.getElementById('links-textarea').value;
  const feedback = document.getElementById('add-feedback');
  feedback.className = 'add-feedback hidden';

  const rawLines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  const valid = [], invalid = [];

  rawLines.forEach(line => {
    const url = extractCharUrl(line);
    url ? valid.push(url) : invalid.push(line);
  });

  if (valid.length === 0) {
    feedback.textContent = `Sin links válidos. Deben ser de nexus-mu.com/rankings/character-profile/`;
    feedback.className = 'add-feedback is-error';
    return;
  }

  if (invalid.length > 0) {
    feedback.textContent = `${invalid.length} link(s) ignorado(s). Agregando ${valid.length}.`;
    feedback.className = 'add-feedback is-warn';
  }

  const btn = document.getElementById('btn-add-chars');
  btn.disabled = true;
  btn.textContent = 'Agregando...';

  let added = 0;
  const newChars = [];

  valid.forEach(url => {
    const norm = normalizeUrl(url);
    if (!list.characters.find(c => c.url === norm)) {
      const nc = { url: norm, name: null, map: null, x: null, y: null, lastUpdated: null, error: null, loading: true };
      list.characters.push(nc);
      newChars.push(nc);
      added++;
    }
  });

  if (added === 0) {
    feedback.textContent = 'Todos ya estaban en la lista.';
    feedback.className = 'add-feedback is-warn';
    btn.disabled = false;
    btn.textContent = `Agregar a "${list.name}"`;
    updateAddBtn();
    return;
  }

  await saveData();
  document.getElementById('links-textarea').value = '';
  document.getElementById('no-characters').classList.add('hidden');
  renderCharacters();

  // Fetch en lotes de 3
  await fetchBatch(list, newChars);

  if (invalid.length === 0) {
    feedback.textContent = `✓ ${added} personaje(s) agregado(s).`;
    feedback.className = 'add-feedback is-success';
    setTimeout(() => (feedback.className = 'add-feedback hidden'), 3000);
  }

  btn.disabled = false;
  btn.textContent = 'Agregar a ';
  const span = document.createElement('span');
  span.id = 'btn-add-list-name';
  span.textContent = `"${list.name}"`;
  btn.appendChild(span);
  updateAddBtn();
}

async function fetchBatch(list, chars) {
  const BATCH = 3;
  for (let i = 0; i < chars.length; i += BATCH) {
    const batch = chars.slice(i, i + BATCH);
    await Promise.all(batch.map(async (char) => {
      const result = await chrome.runtime.sendMessage({ type: 'FETCH_CHARACTER', url: char.url });
      applyFetchResult(char, result);
    }));
    await saveData();
    renderCharacters();
  }
}

// ============================================================
// POP-OUT PANEL FLOTANTE
// ============================================================
async function popOut() {
  const data = await chrome.storage.local.get('panelWindowId');
  const existingId = data.panelWindowId;

  if (existingId) {
    try {
      // Si la ventana ya existe, enfocarla
      await chrome.windows.update(existingId, { focused: true, drawAttention: true });
      return;
    } catch (e) {
      // La ventana fue cerrada manualmente
    }
  }

  // Crear nueva ventana panel
  const win = await chrome.windows.create({
    url:     chrome.runtime.getURL('popup.html?panel=1'),
    type:    'popup',
    width:   460,
    height:  680,
    focused: true,
    // alwaysOnTop: true  // Descomentar si tu versión de Chrome lo soporta (v119+)
  });

  await chrome.storage.local.set({ panelWindowId: win.id });
}

// ============================================================
// COUNTDOWN
// ============================================================
function startCountdown() {
  const badge = document.getElementById('poll-countdown');

  function update() {
    chrome.alarms.get('mu-tracker-poll', (alarm) => {
      if (!alarm) { badge.textContent = '↻ --:--'; return; }
      const rem  = Math.max(0, alarm.scheduledTime - Date.now());
      const mins = Math.floor(rem / 60000);
      const secs = Math.floor((rem % 60000) / 1000);
      badge.textContent = `↻ ${mins}:${String(secs).padStart(2, '0')}`;
    });
  }

  update();
  setInterval(update, 5000);
}

// ============================================================
// HELPERS
// ============================================================
function getSelectedList() {
  return lists.find(l => l.id === selectedListId) || null;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function extractCharUrl(input) {
  const m = input.match(/https?:\/\/fast\.nexus-mu\.com\/rankings\/character-profile\/([A-Za-z0-9+/=_\-]+)\/?/);
  if (m) return `https://fast.nexus-mu.com/rankings/character-profile/${m[1]}/`;
  return null;
}

function normalizeUrl(url) {
  return url.endsWith('/') ? url : url + '/';
}

function extractUuidFromUrl(url) {
  const m = url.match(/character-profile\/([^/]+)\/?$/);
  return m ? m[1].slice(0, 12) + '...' : url;
}

/** Tiempo compacto: "ya", "3m", "1h", "2d" */
function formatCompactTime(iso) {
  if (!iso) return '';
  const diffMs  = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return 'ya';
  if (diffMin < 60) return `${diffMin}m`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

/** Tiempo legible completo (para tooltips) */
function formatRelativeTime(iso) {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1)  return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  return h < 24 ? `Hace ${h} h` : `Hace ${Math.floor(h / 24)} d`;
}
