@echo off
title Fahadderek AI – Local Server
color 0B
cls

echo.
echo  ================================================
echo   Fahadderek AI — Local Development Server
echo  ================================================
echo.

:: Check for Python
where python >nul 2>&1
if %errorlevel% == 0 (
    echo  [INFO] Python found. Starting server on port 8080...
    echo  [INFO] Open your browser at: http://localhost:8080
    echo  [INFO] Press Ctrl+C to stop the server.
    echo.
    python -m http.server 8080 --directory "%~dp0"
    goto :end
)

:: Check for Python3
where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo  [INFO] Python3 found. Starting server on port 8080...
    echo  [INFO] Open your browser at: http://localhost:8080
    echo  [INFO] Press Ctrl+C to stop the server.
    echo.
    python3 -m http.server 8080 --directory "%~dp0"
    goto :end
)

:: Check for Node.js / npx
where npx >nul 2>&1
if %errorlevel% == 0 (
    echo  [INFO] Node.js found. Starting server with npx serve...
    echo  [INFO] Open your browser at: http://localhost:8080
    echo  [INFO] Press Ctrl+C to stop the server.
    echo.
    npx serve -p 8080 "%~dp0"
    goto :end
)

:: Check for PHP
where php >nul 2>&1
if %errorlevel% == 0 (
    echo  [INFO] PHP found. Starting server on port 8080...
    echo  [INFO] Open your browser at: http://localhost:8080
    echo  [INFO] Press Ctrl+C to stop the server.
    echo.
    php -S localhost:8080 -t "%~dp0"
    goto :end
)

:: Nothing found
echo  [ERROR] No suitable server found!
echo.
echo  Please install one of the following:
echo.
echo  OPTION 1 (Recommended) — Python:
echo    https://python.org/downloads/
echo    Then run: python -m http.server 8080
echo.
echo  OPTION 2 — Node.js:
echo    https://nodejs.org/
echo    Then run: npx serve -p 8080
echo.
echo  OPTION 3 — VS Code Extension:
echo    Install "Live Server" extension in VS Code,
echo    right-click index.html and select "Open with Live Server"
echo.

:end
pause
