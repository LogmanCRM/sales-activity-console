@echo off
REM ============================================================
REM  run_sync_fallback.bat  —  Wednesday 10:00 fallback sync
REM  Only runs the ETL if Tuesday's primary sync failed/was skipped.
REM  Registered by setup_scheduler.ps1
REM ============================================================

cd /d "%~dp0.."

echo [%DATE% %TIME%] Fallback sync check...

SET PYTHON=C:\Users\SALES_48\anaconda3\python.exe

REM Install / upgrade dependencies (silent)
%PYTHON% -m pip install -q -r sync\requirements.txt

REM Run ETL in fallback mode (skips if last run was already successful)
%PYTHON% sync\sync_excel.py --fallback

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Fallback check complete.
) ELSE (
    echo [%DATE% %TIME%] FALLBACK SYNC FAILED - errorlevel %ERRORLEVEL%
)
