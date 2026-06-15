@echo off
title Limpar Banco de Dados
echo Deletando o banco de dados atual...
echo.

if exist "backend\alagamentos.db" (
    del /f /q "backend\alagamentos.db"
    echo [SUCESSO] O banco de dados foi zerado!
) else (
    echo [AVISO] O arquivo alagamentos.db nao foi encontrado ou ja estava apagado.
)

echo.
pause