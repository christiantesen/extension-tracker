# ⚔ MU Tracker — Extensión para Chrome / Brave

Extensión de navegador para hacer **tracking de personajes** en **Nexus Fast** (`fast.nexus-mu.com`).  
Muestra el **mapa** y **coordenadas (X, Y)** de cada personaje, con polling automático cada 10 minutos.

---

## 📦 Instalación

### Opción A — Automática con `INSTALAR.bat` (recomendado)

1. Abre la carpeta `extension/`
2. Ejecuta **`INSTALAR.bat`** como doble clic
3. El script hará automáticamente:
   - ✅ Copiar la extensión a una ruta permanente en tu PC
   - ✅ Detectar Chrome o Brave
   - ✅ Crear acceso directo **"MU Tracker"** en el Escritorio
   - ✅ Abrir la página de extensiones del navegador

4. Para **instalación permanente** (una vez, 3 clics):
   - Ve a `chrome://extensions/`
   - Activa **"Modo de desarrollador"** (toggle arriba derecha)
   - Clic en **"Cargar extensión sin empaquetar"**
   - Selecciona la carpeta que te indica el instalador:
     ```
     C:\Users\TU_USUARIO\AppData\Local\MUTracker\extension
     ```

> **Actualizar**: solo ejecuta `INSTALAR.bat` de nuevo. Los datos guardados no se pierden.

---

### Opción B — Manual

1. Abre tu navegador:
   - **Chrome**: `chrome://extensions/`
   - **Brave**: `brave://extensions/`

2. Activa el **Modo desarrollador** (toggle en la esquina superior derecha)

3. Clic en **"Cargar descomprimida"** (Load unpacked)

4. Selecciona la carpeta `extension/` de este proyecto

5. Fija la extensión con el ícono de piezas 🧩

---

## 🚀 Uso

### Crear una lista
Haz clic en **＋** en la barra de listas y asigna un nombre (`Enemigos`, `Rivales`, etc.)

### Agregar personajes
1. Selecciona la lista
2. Haz clic en **➕ Agregar Personajes**
3. Pega uno o más links de perfil (uno por línea):
   ```
   https://fast.nexus-mu.com/rankings/character-profile/hZkWOagSsLP-jgoaBl0T6Q==/
   https://fast.nexus-mu.com/rankings/character-profile/OTRO_UUID==/
   ```
4. Clic en **Agregar**

### Actualizar un personaje
Haz clic en **↻** al lado derecho de cada fila

### Activar / Desactivar una lista
Usa el toggle **Activa / Inactiva** — solo las listas activas se monitorean automáticamente

### Panel flotante (siempre visible)
Haz clic en el botón **⧉** en el header del popup para abrir un panel independiente que no se cierra al hacer clic afuera

---

## ⚙️ Comportamiento

| Función | Detalle |
|---|---|
| **Polling automático** | Cada 10 minutos, solo listas activas |
| **Refresh manual** | Unitario por personaje con botón `↻` |
| **Datos mostrados** | Nombre, Mapa, (X, Y), Última actualización |
| **Persistencia** | Datos guardados localmente en el navegador |
| **Notificaciones** | Cuando un personaje cambia de mapa |
| **Panel flotante** | Ventana separada siempre visible (`⧉`) |

---

## 🗂 Estructura de archivos

```
extension/
├── INSTALAR.bat       ← Instalador automático (Windows)
├── manifest.json      ← Configuración MV3
├── background.js      ← Service worker (polling cada 10 min)
├── popup.html         ← Interfaz del popup
├── popup.js           ← Lógica de la UI
├── styles/
│   └── popup.css      ← Estilos (tema oscuro MU Online)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```
