@echo off
echo ========================================
echo FORCE REBUILD - Clearing ALL caches
echo ========================================
echo.
echo This will:
echo   1. Stop all Node processes
echo   2. Delete .next build cache
echo   3. Delete node_modules/.cache
echo   4. Clear npm cache
echo.
pause

echo.
echo Step 1: Stopping Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Deleting .next directory...
if exist .next (
    rmdir /s /q .next
    echo .next deleted!
) else (
    echo .next not found.
)

echo.
echo Step 3: Deleting node_modules/.cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo node_modules/.cache deleted!
) else (
    echo node_modules/.cache not found.
)

echo.
echo Step 4: Clearing npm cache...
call npm cache clean --force
echo npm cache cleared!

echo.
echo ========================================
echo All caches cleared!
echo ========================================
echo.
echo Now restart your dev server:
echo   npm run dev
echo.
pause



