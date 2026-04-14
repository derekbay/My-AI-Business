# ============================================================
# Fahadderek AI — PowerShell Local Server Launcher
# Supports: Python, Node.js/npx, PHP
# Usage: Right-click → "Run with PowerShell"
# ============================================================

$Host.UI.RawUI.WindowTitle = "Fahadderek AI – Local Server"
$port = 8080
$dir  = $PSScriptRoot

Write-Host ""
Write-Host " ================================================" -ForegroundColor Cyan
Write-Host "  Fahadderek AI — Local Development Server" -ForegroundColor Cyan
Write-Host " ================================================" -ForegroundColor Cyan
Write-Host ""

# ---- Try Python ----
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command python3 -ErrorAction SilentlyContinue
}

if ($python) {
    Write-Host " [INFO] Python found at: $($python.Source)" -ForegroundColor Green
    Write-Host " [INFO] Starting HTTP server on port $port..." -ForegroundColor Green
    Write-Host ""
    Write-Host " ➜  Open: " -NoNewline
    Write-Host "http://localhost:$port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Press Ctrl+C to stop." -ForegroundColor DarkGray
    Write-Host ""

    # Auto-open browser after 1 second
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 1
        Start-Process "http://localhost:8080"
    } | Out-Null

    & $python.Source -m http.server $port --directory $dir
    exit
}

# ---- Try Node.js / npx ----
$npx = Get-Command npx -ErrorAction SilentlyContinue
if ($npx) {
    Write-Host " [INFO] Node.js (npx) found. Using 'serve'..." -ForegroundColor Green
    Write-Host ""
    Write-Host " ➜  Open: " -NoNewline
    Write-Host "http://localhost:$port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Press Ctrl+C to stop." -ForegroundColor DarkGray
    Write-Host ""

    Start-Job -ScriptBlock { Start-Sleep -Seconds 2; Start-Process "http://localhost:8080" } | Out-Null
    & $npx.Source serve -p $port $dir
    exit
}

# ---- Try PHP ----
$php = Get-Command php -ErrorAction SilentlyContinue
if ($php) {
    Write-Host " [INFO] PHP found. Starting built-in server..." -ForegroundColor Green
    Write-Host ""
    Write-Host " ➜  Open: " -NoNewline
    Write-Host "http://localhost:$port" -ForegroundColor Yellow
    Write-Host ""
    Write-Host " Press Ctrl+C to stop." -ForegroundColor DarkGray
    Write-Host ""

    Start-Job -ScriptBlock { Start-Sleep -Seconds 1; Start-Process "http://localhost:8080" } | Out-Null
    & $php.Source -S "localhost:$port" -t $dir
    exit
}

# ---- PowerShell built-in HTTP listener (fallback — no external tools needed) ----
Write-Host " [INFO] No external server found. Using PowerShell HTTP listener..." -ForegroundColor Yellow
Write-Host ""
Write-Host " ➜  Open: " -NoNewline
Write-Host "http://localhost:$port" -ForegroundColor Yellow
Write-Host ""
Write-Host " Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://localhost:$port/")  # localhost-only, no admin required
try { $listener.Start() } catch {
    Write-Host " [ERROR] Could not start server: $_" -ForegroundColor Red
    Write-Host " Try running as Administrator, or use VS Code Live Server instead." -ForegroundColor Yellow
    pause; exit 1
}

# Open browser
Start-Job -ScriptBlock { Start-Sleep 1; Start-Process "http://localhost:8080" } | Out-Null

$mimeTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.ico'  = 'image/x-icon'
    '.webp' = 'image/webp'
    '.txt'  = 'text/plain'
    '.xml'  = 'application/xml'
    '.woff2'= 'font/woff2'
    '.woff' = 'font/woff'
}

Write-Host " [OK] Server running. Ctrl+C to stop." -ForegroundColor Green

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request  = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq '/') { $urlPath = '/index.html' }

        $filePath = Join-Path $dir ($urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $filePath -PathType Leaf) {
            $ext  = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { 'application/octet-stream' }

            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType   = $mime
            $response.ContentLength64 = $bytes.Length
            $response.StatusCode    = 200

            # Cache headers
            $response.AddHeader('Cache-Control', 'no-cache')
            $response.AddHeader('X-Content-Type-Options', 'nosniff')

            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            # 404 fallback
            $body  = [System.Text.Encoding]::UTF8.GetBytes('<h1>404 Not Found</h1>')
            $response.StatusCode    = 404
            $response.ContentType   = 'text/html; charset=utf-8'
            $response.ContentLength64 = $body.Length
            $response.OutputStream.Write($body, 0, $body.Length)
        }

        $response.OutputStream.Close()
        Write-Host " $(Get-Date -Format 'HH:mm:ss') $($request.HttpMethod) $urlPath [$($response.StatusCode)]" -ForegroundColor DarkGray
    }
} finally {
    $listener.Stop()
    Write-Host ""
    Write-Host " [INFO] Server stopped." -ForegroundColor Yellow
}
