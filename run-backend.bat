@echo off
cd /d "%~dp0Aura Platform Backend"
call "%~dp0aura-s\Scripts\activate.bat"
echo Starting AuRA API on http://localhost:8000
uvicorn main:app --reload --port 8000
