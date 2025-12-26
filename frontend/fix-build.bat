@echo off
echo ========================================
echo Fixing Next.js Build Error
echo ========================================
echo.
echo Step 1: Stopping any running Next.js processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.
echo Step 2: Clearing Next.js cache...
if exist .next (
    echo Deleting .next directory...
    rmdir /s /q .next
    echo Cache cleared!
) else (
    echo No .next directory found.
)
echo.
echo Step 3: Clearing node_modules/.cache if it exists...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo node_modules cache cleared!
)
echo.
echo ========================================
echo Cache cleared successfully!
echo ========================================
echo.
echo Please restart your dev server with:
echo   npm run dev
echo.
pause



