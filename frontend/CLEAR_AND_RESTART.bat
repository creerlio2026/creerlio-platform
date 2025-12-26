@echo off
echo Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo Deleting .next folder...
if exist .next (
    rmdir /s /q .next
    echo .next folder deleted.
) else (
    echo .next folder not found.
)

echo Clearing npm cache...
call npm cache clean --force

echo.
echo ========================================
echo Cache cleared successfully!
echo.
echo Now run: npm run dev
echo ========================================
pause

