@echo off
echo Starting Creerlio Backend Server...
cd /d %~dp0
call venv\Scripts\activate.bat
python main.py
pause

