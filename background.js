// ============================================================
// MU Tracker - Background Service Worker
// Polling cada 10 minutos para listas activas
// ============================================================

const ALARM_NAME = 'mu-tracker-poll';
const POLL_INTERVAL_MINUTES = 10;

// -----------------------------------------------------------
// Inicialización del alarm al instalar la extensión
// -----------------------------------------------------------
chrome.runtime.onInstalled.addListener(() => {
  setupAlarm();
  console.log('[MU Tracker] Extensión instalada. Polling cada 10 minutos.');
});

// Re-crear el alarm si el service worker se reinicia
setupAlarm();

// -----------------------------------------------------------
// Limpiar ID del panel cuando el usuario cierra la ventana
// -----------------------------------------------------------
chrome.windows.onRemoved.addListener(async (windowId) => {
  const data = await chrome.storage.local.get('panelWindowId');
  if (data.panelWindowId === windowId) {
    await chrome.storage.local.remove('panelWindowId');
    console.log('[MU Tracker] Panel window closed, ID cleared.');
  }
});


function setupAlarm() {
  chrome.alarms.get(ALARM_NAME, (alarm) => {
    if (!alarm) {
      chrome.alarms.create(ALARM_NAME, {
        delayInMinutes: POLL_INTERVAL_MINUTES,
        periodInMinutes: POLL_INTERVAL_MINUTES
      });
    }
  });
}

// -----------------------------------------------------------
// Handler del alarm → polling automático
// -----------------------------------------------------------
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    pollAllActiveLists();
  }
});

// -----------------------------------------------------------
// Mensajes desde el popup
// -----------------------------------------------------------
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_CHARACTER') {
    fetchCharacterData(msg.url)
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ error: err.message || 'Error desconocido' }));
    return true; // mantiene el canal async
  }

  if (msg.type === 'POLL_NOW') {
    pollAllActiveLists()
      .then(() => sendResponse({ ok: true }))
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }
});

// -----------------------------------------------------------
// Fetch y parseo del perfil de personaje
// -----------------------------------------------------------
async function fetchCharacterData(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    return parseCharacterProfile(html, url);

  } catch (error) {
    console.error(`[MU Tracker] Error fetching ${url}:`, error.message);
    return { error: error.message || 'Error de conexión' };
  }
}

function parseCharacterProfile(html, url) {
  // --- Nombre del personaje ---
  // Prioridad 1: breadcrumb "Perfil del Personaje > NOMBRE"
  let name = null;
  const nameMatch = html.match(/Perfil del Personaje\s*(?:&gt;|>|»)\s*([^<"]{1,60}?)(?=\s*<\/a>)/);
  if (nameMatch) {
    name = decodeEntities(nameMatch[1].trim());
  }
  // Prioridad 2: fila "Personaje" en la tabla de info
  if (!name) {
    const tblName = html.match(/Personaje<\/td>\s*<td>([^<]{1,60}?)<\/td>/);
    if (tblName) name = decodeEntities(tblName[1].trim());
  }

  // --- Ubicación (Mapa + Coordenadas) ---
  // ESTRATEGIA: buscar directamente el patrón X: NNN, Y: NNN (único en la página)
  // y recuperar el nombre del mapa desde el mismo <td>
  let map = null, x = null, y = null;

  // Patrón 1: <td>MAPA ( X: NNN, Y: NNN )</td>  — cualquier espaciado
  const p1 = html.match(/<td>([^<(]{1,40}?)\s*\(\s*X:\s*(\d+)\s*,\s*Y:\s*(\d+)\s*\)\s*<\/td>/i);
  if (p1) {
    map = decodeEntities(p1[1].trim());
    x   = parseInt(p1[2], 10);
    y   = parseInt(p1[3], 10);
  }

  // Patrón 2 (fallback): buscar "X: NNN, Y: NNN" en cualquier contexto
  // y extraer el texto previo como nombre del mapa
  if (!map) {
    const p2 = html.match(/([A-Za-z][\w\s]{1,30}?)\s*\(\s*X:\s*(\d+)\s*,\s*Y:\s*(\d+)\s*\)/);
    if (p2) {
      map = decodeEntities(p2[1].trim());
      x   = parseInt(p2[2], 10);
      y   = parseInt(p2[3], 10);
    }
  }

  return { name, map, x, y, url };
}

function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// -----------------------------------------------------------
// Polling de todas las listas activas
// -----------------------------------------------------------
async function pollAllActiveLists() {
  console.log('[MU Tracker] Iniciando polling automático...');

  const data = await chrome.storage.local.get('lists');
  const lists = data.lists || [];

  const activeLists = lists.filter(l => l.active && l.characters.length > 0);

  if (activeLists.length === 0) {
    console.log('[MU Tracker] Sin listas activas con personajes.');
    return;
  }

  let anyUpdated = false;

  for (const list of activeLists) {
    for (const char of list.characters) {
      const result = await fetchCharacterData(char.url);

      if (result.error) {
        char.error = result.error;
      } else {
        // Notificar cambio de mapa si el personaje tenía datos previos
        if (char.map && result.map && char.map !== result.map) {
          notifyMapChange(char.name || 'Personaje', char.map, result.map);
        }
        char.name = result.name || char.name;
        char.map = result.map;
        char.x = result.x;
        char.y = result.y;
        char.error = null;
      }

      char.lastUpdated = new Date().toISOString();
      char.loading = false;
      anyUpdated = true;
    }
  }

  if (anyUpdated) {
    await chrome.storage.local.set({ lists });
    // Notificar al popup si está abierto
    chrome.runtime.sendMessage({ type: 'POLL_COMPLETE' }).catch(() => {
      // El popup no está abierto, ignorar
    });
  }

  console.log('[MU Tracker] Polling completo.');
}

// -----------------------------------------------------------
// Notificación de cambio de mapa
// -----------------------------------------------------------
function notifyMapChange(charName, oldMap, newMap) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: '⚔ MU Tracker — Cambio de Mapa',
    message: `${charName}: ${oldMap} → ${newMap}`,
    silent: false
  });
}
