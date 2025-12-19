@echo off
echo ========================================
echo   Initialize Talent and Business Profiles
echo ========================================
echo.

cd /d "%~dp0backend"

echo Calling initialization endpoint...
curl -X POST http://localhost:8000/api/init-profiles

echo.
echo.
echo If curl is not available, you can also:
echo 1. Open http://localhost:8000/api/init-profiles in your browser
echo 2. Or use Postman/Insomnia to POST to that endpoint
echo.
pause
