@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title MU Tracker -- Instalador de Extension
mode con: cols=66 lines=48
cls

:: ================================================================
::  MU TRACKER - NEXUS FAST
::  Instalador de Extension para Chrome y Brave
::  Windows 10 / 11
::  ---------------------------------------------------------------
::  Ejecutar desde dentro de la carpeta 'extension\'
::  Los archivos de la extension son los del mismo directorio.
:: ================================================================

color 0E
echo.
echo  +==============================================================+
echo  ^|                                                              ^|
echo  ^|         ***  MU TRACKER - NEXUS FAST  ***                   ^|
echo  ^|           Instalador de Extension v1.0                      ^|
echo  ^|         Compatible con Chrome y Brave                       ^|
echo  ^|                                                              ^|
echo  +==============================================================+
color 07
echo.

:: ----------------------------------------------------------------
:: Paths — la extension ES esta misma carpeta (%~dp0)
:: ----------------------------------------------------------------
set "SCRIPT_DIR=%~dp0"
set "EXT_SRC=%SCRIPT_DIR%"
set "INSTALL_BASE=%LOCALAPPDATA%\MUTracker"
set "EXT_DEST=%INSTALL_BASE%\extension"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\MU Tracker.lnk"

:: ----------------------------------------------------------------
:: [1/4] Verificar archivos de la extension
:: ----------------------------------------------------------------
echo  [1/4] Verificando archivos de la extension...
echo.

if not exist "%EXT_SRC%manifest.json"  goto :err_no_extension
if not exist "%EXT_SRC%background.js"  goto :err_no_extension
if not exist "%EXT_SRC%popup.html"     goto :err_no_extension

echo         OK - Archivos encontrados en:
echo         %EXT_SRC%
echo.

:: ----------------------------------------------------------------
:: [2/4] Copiar a ubicacion permanente
:: ----------------------------------------------------------------
echo  [2/4] Instalando extension en el sistema...
echo.

if exist "%EXT_DEST%\manifest.json" (
    echo         Actualizando instalacion existente...
) else (
    echo         Primera instalacion...
    if not exist "%INSTALL_BASE%" mkdir "%INSTALL_BASE%"
)

:: robocopy: codigos 0-7 = exito, 8+ = error real
robocopy "%EXT_SRC%" "%EXT_DEST%" /E /NFL /NDL /NJH /NJS /NP >nul 2>&1
if %errorlevel% GTR 7 (
    color 0C
    echo.
    echo  [ERROR] No se pudo copiar la extension.
    echo          Verifica permisos en: %INSTALL_BASE%
    echo.
    pause
    exit /b 1
)

echo         OK - Extension instalada en:
echo         %EXT_DEST%
echo.

:: ----------------------------------------------------------------
:: [3/4] Detectar Chrome o Brave
:: ----------------------------------------------------------------
echo  [3/4] Buscando navegador instalado...
echo.

set "BROWSER_EXE="
set "BROWSER_NAME="

:: Brave (tiene prioridad)
for %%P in (
    "%PROGRAMFILES%\BraveSoftware\Brave-Browser\Application\brave.exe"
    "%LOCALAPPDATA%\BraveSoftware\Brave-Browser\Application\brave.exe"
    "%PROGRAMFILES(X86)%\BraveSoftware\Brave-Browser\Application\brave.exe"
) do (
    if not defined BROWSER_EXE (
        if exist %%P (
            set "BROWSER_EXE=%%~P"
            set "BROWSER_NAME=Brave"
        )
    )
)

:: Chrome
for %%P in (
    "%PROGRAMFILES%\Google\Chrome\Application\chrome.exe"
    "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
    "%PROGRAMFILES(X86)%\Google\Chrome\Application\chrome.exe"
) do (
    if not defined BROWSER_EXE (
        if exist %%P (
            set "BROWSER_EXE=%%~P"
            set "BROWSER_NAME=Chrome"
        )
    )
)

if not defined BROWSER_EXE (
    color 0C
    echo  [ERROR] No se encontro Chrome ni Brave instalado.
    echo.
    pause
    exit /b 1
)

echo         OK - !BROWSER_NAME! encontrado
echo         !BROWSER_EXE!
echo.

:: ----------------------------------------------------------------
:: [4/4] Crear acceso directo en el Escritorio
:: ----------------------------------------------------------------
echo  [4/4] Creando acceso directo en el Escritorio...
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([System.Environment]::GetFolderPath('Desktop') + '\MU Tracker.lnk'); $s.TargetPath = '!BROWSER_EXE!'; $s.Arguments = '--load-extension=\"\"%EXT_DEST%\"\"'; $s.WorkingDirectory = '%INSTALL_BASE%'; $s.Description = 'MU Tracker - Nexus Fast'; $s.IconLocation = '!BROWSER_EXE!, 0'; $s.Save()" >nul 2>&1

if exist "%SHORTCUT_PATH%" (
    echo         OK - Acceso directo "MU Tracker" creado en el Escritorio
) else (
    echo         AVISO: No se pudo crear el acceso directo automaticamente.
)
echo.

:: ================================================================
::  RESULTADO FINAL
:: ================================================================
color 0A
echo  +==============================================================+
echo  ^|                  INSTALACION COMPLETADA                     ^|
echo  +==============================================================+
color 07
echo.
echo  Tienes DOS formas de usar la extension:
echo.
echo  ---------------------------------------------------------
echo   OPCION A - Acceso Directo (SIN pasos extra)
echo  ---------------------------------------------------------
echo.
echo   >> Abre "MU Tracker" desde tu Escritorio.
echo      !BROWSER_NAME! se iniciara con la extension activa.
echo.
echo   NOTA: La extension funciona solo en esa ventana del
echo         navegador. Cierra y vuelve a abrir con el atajo
echo         si necesitas reiniciarla.
echo.
echo  ---------------------------------------------------------
echo   OPCION B - Instalacion Permanente (recomendado)
echo  ---------------------------------------------------------
echo.
echo   Solo 3 clics:
echo.
echo   1. Ve a:  chrome://extensions/
echo.
echo   2. Activa "Modo de desarrollador"  (toggle arriba dcha)
echo.
echo   3. Clic "Cargar extension sin empaquetar"
echo      y selecciona esta carpeta:
echo.
color 0E
echo      %EXT_DEST%
color 07
echo.
echo  ---------------------------------------------------------
echo   ACTUALIZAR en el futuro
echo  ---------------------------------------------------------
echo.
echo   Ejecuta este mismo INSTALAR.bat nuevamente.
echo   Los datos guardados NO se pierden.
echo.
echo  ==========================================================
echo.

:: Abrir pagina de extensiones automaticamente
echo  Abriendo chrome://extensions/ en !BROWSER_NAME!...
start "" "!BROWSER_EXE!" "chrome://extensions/"

echo.
echo  Presiona cualquier tecla para cerrar el instalador.
pause >nul
exit /b 0

:: ================================================================
::  ERROR: archivos faltantes
:: ================================================================
:err_no_extension
color 0C
echo.
echo  +--------------------------------------------------------------+
echo  ^|  ERROR: Faltan archivos de la extension en esta carpeta      ^|
echo  +--------------------------------------------------------------+
echo.
echo  Se esperaban los siguientes archivos junto a INSTALAR.bat:
echo.
echo    %EXT_SRC%
echo    ^|-- INSTALAR.bat        (este archivo)
echo    ^|-- manifest.json
echo    ^|-- background.js
echo    ^|-- popup.html
echo    ^|-- popup.js
echo    ^|-- styles\popup.css
echo    ^`-- icons\
echo.
color 07
pause
exit /b 1
