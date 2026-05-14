# setup_scheduler.ps1 - Register Windows Scheduled Tasks for Sales Activity Console
#
# Run once (as current user, no admin needed):
#   powershell -ExecutionPolicy Bypass -File sync\setup_scheduler.ps1
#
# Creates two tasks:
#   "SalesSync-Primary"  - Tuesday 15:00  (main sync)
#   "SalesSync-Fallback" - Wednesday 10:00 (only runs if Tuesday failed)

$RepoRoot = Split-Path -Parent $PSScriptRoot
$SyncBat  = Join-Path $RepoRoot "sync\run_sync.bat"
$FallBat  = Join-Path $RepoRoot "sync\run_sync_fallback.bat"
$LogDir   = Join-Path $RepoRoot "sync\.cache"

if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }

$LogPrimary  = Join-Path $LogDir "sync_primary.log"
$LogFallback = Join-Path $LogDir "sync_fallback.log"

function Register-SyncTask {
    param (
        [string]$TaskName,
        [string]$BatFile,
        [string]$LogFile,
        [string]$Day,
        [string]$Time
    )

    $Action = New-ScheduledTaskAction `
        -Execute "cmd.exe" `
        -Argument ("/C `"" + $BatFile + "`" >> `"" + $LogFile + "`" 2>&1") `
        -WorkingDirectory $RepoRoot

    $Trigger = New-ScheduledTaskTrigger `
        -Weekly `
        -DaysOfWeek $Day `
        -At $Time

    $Settings = New-ScheduledTaskSettingsSet `
        -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -WakeToRun:$false

    $CurrentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $Principal = New-ScheduledTaskPrincipal `
        -UserId $CurrentUser `
        -LogonType "Interactive" `
        -RunLevel "Limited"

    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host ("  Removed existing task: " + $TaskName)
    }

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Sales Activity Console - auto-sync from SharePoint/OneDrive" | Out-Null

    Write-Host ("  Registered: " + $TaskName + "  (" + $Day + " " + $Time + ")")
}

Write-Host ""
Write-Host "=== Setting up Sales Activity Sync Tasks ==="
Write-Host ""

Register-SyncTask -TaskName "SalesSync-Primary"  -BatFile $SyncBat -LogFile $LogPrimary  -Day "Tuesday"   -Time "15:00"
Register-SyncTask -TaskName "SalesSync-Fallback" -BatFile $FallBat -LogFile $LogFallback -Day "Wednesday" -Time "10:00"

Write-Host ""
Write-Host "Done!  Two tasks registered:"
Write-Host "  SalesSync-Primary   - every Tuesday  15:00  (full sync)"
Write-Host "  SalesSync-Fallback  - every Wednesday 10:00 (only if Tuesday failed)"
Write-Host ""
Write-Host "IMPORTANT - First-time Microsoft 365 login:"
Write-Host "  Run the sync once manually to cache your credentials:"
Write-Host ("  cd `"" + $RepoRoot + "`"")
Write-Host "  sync\run_sync.bat"
Write-Host ""
Write-Host "  The script will print a short code.  Open:"
Write-Host "    https://microsoft.com/devicelogin"
Write-Host "  and enter that code.  After this one-time step, all"
Write-Host "  scheduled runs will be fully automatic for ~90 days."
Write-Host ""
