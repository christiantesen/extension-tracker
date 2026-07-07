# ⚔ MU Tracker — Extensión para Chrome / Brave

Extensión de navegador para hacer tracking de personajes en **Nexus Fast** (fast.nexus-mu.com). Muestra el **mapa** y **coordenadas (X, Y)** de cada personaje en tiempo real.

---

## 📦 Instalación

### Paso 1 — Cargar en Chrome o Brave

1. Abre tu navegador y ve a:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`

2. Activa el **Modo desarrollador** (toggle en la esquina superior derecha)

3. Haz clic en **"Cargar descomprimida"** (Load unpacked)

4. Selecciona la carpeta `extension/` de este proyecto

5. La extensión aparecerá en la barra de herramientas — fíjala con el ícono de piezas 🧩

---

## 🚀 Uso

### Crear una lista
- Haz clic en **＋** en la barra de listas
- Asigna un nombre (ej: `Enemigos`, `Rivales`, `Objetivo`)

### Agregar personajes
- Selecciona la lista
- Haz clic en **➕ Agregar Personajes**
- Pega uno o más links completos, uno por línea:
  ```
  https://fast.nexus-mu.com/rankings/character-profile/hZkWOagSsLP-jgoaBl0T6Q==/
  https://fast.nexus-mu.com/rankings/character-profile/OTRO_UUID==/
  ```
- Clic en **Agregar**

### Actualizar un personaje
- Haz clic en el botón **↻** al lado derecho de cada personaje

### Activar / Desactivar una lista
- Usa el toggle **Activa / Inactiva** en el header de la lista
- Solo las listas **activas** son monitoreadas automáticamente cada 10 minutos

### Notificaciones de cambio de mapa
- Si un personaje cambia de mapa durante el polling automático, recibirás una notificación del navegador

---

## ⚙️ Comportamiento

| Función | Detalle |
|---|---|
| **Polling automático** | Cada 10 minutos, solo listas activas |
| **Refresh manual** | Unitario por personaje con botón ↻ |
| **Datos mostrados** | Nombre, Mapa, (X, Y), Última actualización |
| **Persistencia** | Los datos se guardan localmente en el navegador |
| **Notificaciones** | Cuando un personaje cambia de mapa |

---

## 🗂 Estructura de archivos

```
extension/
├── manifest.json      ← Configuración MV3
├── background.js      ← Service worker (polling cada 10min)
├── popup.html         ← Interfaz del popup
├── popup.js           ← Lógica de la UI
├── styles/
│   └── popup.css      ← Estilos (tema oscuro MU Online)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
