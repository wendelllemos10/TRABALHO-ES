@echo off
title Servidor do FastAPI - Uvicorn
echo Iniciando o servidor do projeto de alagamentos...
echo.

cd /d "%~dp0\backend"

python -m uvicorn main:app --reload

if %errorlevel% neq 0 (
    echo.
    echo [ERRO] O Windows nao conseguiu encontrar o comando 'python'.
    echo Verifique se o Python esta instalado corretamente neste computador.
)

pause