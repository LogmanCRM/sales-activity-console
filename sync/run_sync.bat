@echo off
REM ============================================================
REM  run_sync.bat  —  Sales Activity Console weekly sync
REM  Primary schedule: every TUESDAY 15:00 (Task Scheduler)
REM  Fallback:         every WEDNESDAY 10:00 via run_sync_fallback.bat
REM ============================================================

cd /d "%~dp0.."

echo [%DATE% %TIME%] Starting Sales Activity Sync...

SET PYTHON=C:\Users\SALES_48\anaconda3\python.exe

REM Install / upgrade dependencies (silent)
%PYTHON% -m pip install -q -r sync\requirements.txt

REM Run ETL
%PYTHON% sync\sync_excel.py

IF %ERRORLEVEL% EQU 0 (
    echo [%DATE% %TIME%] Sync complete successfully.
) ELSE (
    echo [%DATE% %TIME%] SYNC FAILED - errorlevel %ERRORLEVEL%
)

REM Uncomment the line below to open the dashboard after sync:
REM start "" "http://localhost:3457"
