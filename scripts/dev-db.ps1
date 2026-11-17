#requires -Version 5.1
<#
  本地 PostgreSQL 开发库（不碰你系统里已安装的那个服务）

  用法：
    powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 start
    powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 stop
    powershell -ExecutionPolicy Bypass -File scripts/dev-db.ps1 status

  说明：
    - 数据目录：<项目>/.pgdata（已加入 .gitignore）
    - 端口：55432（系统自带的 5432 不会被占用）
    - 认证：trust（只监听 127.0.0.1，仅本机可用）
    - 需要机器上装有 PostgreSQL 二进制；默认从 D:\Program Files\PostgreSQL\18\bin 读取，
      也可以用环境变量 PG_BIN 指定。
#>
param(
  [ValidateSet("start", "stop", "status", "reset")]
  [string]$Action = "start"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DataDir = Join-Path $ProjectRoot ".pgdata"
$Port = 55432
$PgBin = if ($env:PG_BIN) { $env:PG_BIN } else { "D:\Program Files\PostgreSQL\18\bin" }

function Test-Port {
  param([int]$PortNumber)
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $client.Connect("127.0.0.1", $PortNumber)
    $client.Close()
    return $true
  } catch {
    return $false
  }
}

function Invoke-Psql {
  param([string[]]$Arguments)
  & (Join-Path $PgBin "psql.exe") -h 127.0.0.1 -p $Port -U postgres @Arguments
}

if (-not (Test-Path (Join-Path $PgBin "postgres.exe"))) {
  Write-Host "找不到 PostgreSQL 二进制：$PgBin" -ForegroundColor Red
  Write-Host "请安装 PostgreSQL，或设置环境变量 PG_BIN 指向它的 bin 目录。" -ForegroundColor Yellow
  exit 1
}

switch ($Action) {
  "status" {
    if (Test-Port $Port) {
      Write-Host "PostgreSQL 正在 127.0.0.1:$Port 运行" -ForegroundColor Green
    } else {
      Write-Host "PostgreSQL 未运行（端口 $Port 未监听）" -ForegroundColor Yellow
    }
  }

  "start" {
    if (Test-Port $Port) {
      Write-Host "已在运行：127.0.0.1:$Port" -ForegroundColor Green
      exit 0
    }

    if (-not (Test-Path (Join-Path $DataDir "PG_VERSION"))) {
      Write-Host "初始化数据目录 $DataDir ..." -ForegroundColor Cyan
      & (Join-Path $PgBin "initdb.exe") -D $DataDir -U postgres -A trust -E UTF8 --locale=C | Out-Null
    }

    Write-Host "启动 PostgreSQL（端口 $Port）..." -ForegroundColor Cyan
    Start-Process -FilePath (Join-Path $PgBin "postgres.exe") `
      -ArgumentList @("-D", "`"$DataDir`"", "-p", "$Port", "-c", "listen_addresses=127.0.0.1") `
      -WindowStyle Hidden | Out-Null

    for ($i = 0; $i -lt 30; $i++) {
      Start-Sleep -Milliseconds 500
      if (Test-Port $Port) { break }
    }

    if (-not (Test-Port $Port)) {
      Write-Host "启动失败，检查 $DataDir\log 下的日志。" -ForegroundColor Red
      exit 1
    }

    # 端口通了不代表已经能接受查询（可能还在 recovery），轮询一次 select 1
    Write-Host "等待数据库就绪 ..." -ForegroundColor Cyan
    $ready = $false
    for ($i = 0; $i -lt 60; $i++) {
      $probe = & (Join-Path $PgBin "psql.exe") -h 127.0.0.1 -p $Port -U postgres -tAc "select 1" 2>$null
      if ("$probe".Trim() -eq "1") { $ready = $true; break }
      Start-Sleep -Milliseconds 500
    }

    if (-not $ready) {
      Write-Host "数据库没有在 30 秒内就绪，检查 $DataDir\log 下的日志。" -ForegroundColor Red
      exit 1
    }

    $exists = & (Join-Path $PgBin "psql.exe") -h 127.0.0.1 -p $Port -U postgres -tAc "select 1 from pg_database where datname='mashiro'" 2>$null
    if ("$exists".Trim() -ne "1") {
      Write-Host "创建数据库 mashiro ..." -ForegroundColor Cyan
      & (Join-Path $PgBin "createdb.exe") -h 127.0.0.1 -p $Port -U postgres mashiro
    }

    Write-Host "就绪：postgresql://postgres@127.0.0.1:$Port/mashiro" -ForegroundColor Green
    Write-Host "记得在 .env 里加上 DATABASE_URL（见 .env.example）。" -ForegroundColor DarkGray
  }

  "stop" {
    $pidFile = Join-Path $DataDir "postmaster.pid"
    if (-not (Test-Path $pidFile)) {
      Write-Host "没有找到运行中的进程（postmaster.pid 不存在）" -ForegroundColor Yellow
      exit 0
    }
    $serverPid = (Get-Content $pidFile -First 1).Trim()
    Write-Host "停止进程 $serverPid ..." -ForegroundColor Cyan
    Stop-Process -Id ([int]$serverPid) -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
    if (Test-Port $Port) { Write-Host "端口仍被占用" -ForegroundColor Red } else { Write-Host "已停止" -ForegroundColor Green }
  }

  "reset" {
    Write-Host "这会删除 $DataDir 里的数据。" -ForegroundColor Yellow
    $confirm = Read-Host "输入 yes 继续"
    if ($confirm -ne "yes") { exit 0 }
    & $PSCommandPath stop
    Remove-Item $DataDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "已删除，下次 start 会重新初始化。" -ForegroundColor Green
  }
}
