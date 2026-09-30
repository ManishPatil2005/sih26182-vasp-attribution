@echo off
title CRIMEGRAPH AI - Launcher
echo ========================================================
echo   Launching CRIMEGRAPH AI Full-Stack Platform...
echo ========================================================
echo.
start "CRIMEGRAPH AI - Backend" cmd /c "%~dp0run_backend.bat"
timeout /t 2 /nobreak >nul
start "CRIMEGRAPH AI - Frontend" cmd /c "%~dp0run_frontend.bat"
echo.
echo Both servers have been launched in separate windows!
echo Backend:  http://127.0.0.1:8000/docs
echo Frontend: http://localhost:5173
echo.
