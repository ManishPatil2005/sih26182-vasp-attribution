@echo off
title CRIMEGRAPH AI - Backend Server
echo ========================================================
echo   CRIMEGRAPH AI - Backend Server (FastAPI)
echo   Ministry of Home Affairs - NCRB PS 26189
echo ========================================================
echo.
cd /d "%~dp0backend"
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
pause
