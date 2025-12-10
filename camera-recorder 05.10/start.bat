@echo off
echo ========================================
echo   Camera Recorder - Demarrage
echo ========================================
echo.

REM Verifier si l'environnement virtuel existe
if not exist "venv\" (
    echo Creation de l'environnement virtuel...
    python -m venv venv
    if errorlevel 1 (
        echo ERREUR: Impossible de creer l'environnement virtuel
        echo Verifiez que Python 3.10+ est installe
        pause
        exit /b 1
    )
)

REM Activer l'environnement virtuel
echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

REM Installer les dependances si necessaire
if not exist "venv\Lib\site-packages\fastapi\" (
    echo Installation des dependances...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERREUR: Installation des dependances echouee
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo   Demarrage de l'application
echo ========================================
echo.
echo Interface disponible sur: http://127.0.0.1:8000
echo.
echo Appuyez sur Ctrl+C pour arreter
echo.

REM Demarrer l'application
python -m app.main

pause
