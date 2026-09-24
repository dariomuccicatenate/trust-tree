<#
    Avvia i tre container di Trust Tree (db, api, frontend) e apre il frontend nel browser.

    Uso:
      .\avvia.ps1              avvia lo stack e apre http://localhost:8080
      .\avvia.ps1 -Rebuild     ricostruisce le immagini di api e frontend
      .\avvia.ps1 -Seed        ricarica i dati di esempio (li sostituisce)
      .\avvia.ps1 -NoBrowser   non apre il browser
#>
param(
    [switch]$Rebuild,
    [switch]$Seed,
    [switch]$NoBrowser
)

$ErrorActionPreference = 'Stop'
Set-Location -Path $PSScriptRoot

$indirizzo = 'http://localhost:8080'

function Test-DockerAttivo {
    # I comandi nativi che scrivono su stderr non devono interrompere lo script.
    $precedente = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try {
        docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
        return ($LASTEXITCODE -eq 0)
    } catch {
        return $false
    } finally {
        $ErrorActionPreference = $precedente
    }
}

function Start-Docker {
    Write-Host '==> Docker non e'' in esecuzione: lo avvio' -ForegroundColor Cyan

    # Docker Desktop recente espone il comando; altrimenti si apre l'eseguibile.
    $precedente = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    docker desktop start 2>$null | Out-Null
    $avviato = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = $precedente

    if (-not $avviato) {
        $percorsi = @(
            (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'),
            (Join-Path ${env:ProgramFiles(x86)} 'Docker\Docker\Docker Desktop.exe'),
            (Join-Path $env:LOCALAPPDATA 'Docker\Docker Desktop.exe')
        )
        $eseguibile = $percorsi | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1

        if (-not $eseguibile) {
            throw 'Docker non trovato. Installa Docker Desktop oppure avvialo a mano, poi rilancia lo script.'
        }
        Start-Process -FilePath $eseguibile | Out-Null
    }

    Write-Host '    attendo che il motore risponda (puo'' richiedere un minuto)'
    $scadenzaDocker = (Get-Date).AddMinutes(3)
    while ((Get-Date) -lt $scadenzaDocker) {
        if (Test-DockerAttivo) {
            Write-Host '    Docker pronto' -ForegroundColor Green
            return
        }
        Start-Sleep -Seconds 3
    }

    throw 'Docker non e'' diventato disponibile entro 3 minuti: controlla Docker Desktop.'
}

if (-not (Test-DockerAttivo)) {
    Start-Docker
}

Write-Host '==> Avvio dei container (db, api, frontend)' -ForegroundColor Cyan
if ($Rebuild) {
    docker compose up -d --build
} else {
    docker compose up -d
}
if ($LASTEXITCODE -ne 0) {
    throw 'Avvio non riuscito: Docker e'' in esecuzione?'
}

Write-Host '==> Attendo che l''API sia pronta' -ForegroundColor Cyan
$scadenza = (Get-Date).AddSeconds(120)
$pronta = $false
while ((Get-Date) -lt $scadenza) {
    try {
        $stato = docker inspect -f '{{.State.Health.Status}}' trust-tree-api
    } catch {
        $stato = 'starting'
    }
    if ($stato -eq 'healthy') {
        $pronta = $true
        break
    }
    Start-Sleep -Seconds 2
}
if (-not $pronta) {
    Write-Warning 'L''API non risulta pronta. Log: docker compose logs -f api'
}

# Al primo avvio il database e' vuoto: carica i dati di esempio.
$conteggio = docker compose exec -T db psql -U trust -d trust_tree -tAc 'select count(*) from professionista'
if ($LASTEXITCODE -ne 0) {
    $conteggio = '0'
}
$conteggio = "$conteggio".Trim()

if ($Seed -or $conteggio -eq '0') {
    Write-Host '==> Carico i dati di esempio' -ForegroundColor Cyan
    if ($Seed -and $conteggio -ne '0') {
        docker compose exec -T db psql -q -U trust -d trust_tree -c 'TRUNCATE recensione, utente, professionista CASCADE' | Out-Null
    }
    Get-Content -Raw 'db/seed/001_dati_esempio.sql' | docker compose exec -T db psql -q -v ON_ERROR_STOP=1 -U trust -d trust_tree | Out-Null
}

docker compose ps --format "{{.Service}}`t{{.Status}}`t{{.Ports}}"

Write-Host ''
Write-Host "Frontend:  $indirizzo" -ForegroundColor Green
Write-Host '  API:     http://localhost:3000/api  (OpenAPI su /api/docs)'
Write-Host '  Database: postgresql://trust:trust@localhost:5432/trust_tree'
Write-Host '  Log:     docker compose logs -f api'
Write-Host '  Stop:    docker compose down'

if (-not $NoBrowser) {
    Start-Process $indirizzo
}
