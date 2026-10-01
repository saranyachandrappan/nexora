@echo off
title AEC Assist - Annapoorana Engineering College, Salem
echo =========================================================================
echo    🎓 AEC Assist: College Document Q&A Assistant
echo       Annapoorana Engineering College (AEC), Salem
echo       Approved by AICTE, New Delhi & Affiliated to Anna University
echo       NH-47 Sankari Main Road, Periaseeragapadi, Salem - 636308
echo =========================================================================
echo.
echo [1/2] Verifying Python runtime environment...
python -m pip install -q flask flask-cors pypdf python-docx openpyxl python-dotenv
echo Environment ready.
echo.
echo [2/2] Starting AEC Assist RAG Application Server...
echo.
echo Student, Faculty & Admin Web Portal: http://127.0.0.1:5000
echo.
python backend/app.py
pause
