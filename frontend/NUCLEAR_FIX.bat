@echo off
echo ========================================
echo NUCLEAR FIX - Complete Cache Clear
echo ========================================
echo.

echo Step 1: Killing all Node processes...
taskkill /F /IM node.exe >nul 2>&1
if %errorlevel% equ 0 (
    echo   - Node processes killed
) else (
    echo   - No Node processes found (or already stopped)
)
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Deleting .next folder...
if exist .next (
    rmdir /s /q .next
    if exist .next (
        echo   - ERROR: .next folder still exists! You may need to restart your computer.
        echo   - Or manually delete it from File Explorer.
    ) else (
        echo   - .next folder deleted successfully
    )
) else (
    echo   - .next folder not found (already deleted)
)

echo.
echo Step 3: Deleting node_modules\.cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo   - node_modules\.cache deleted
) else (
    echo   - node_modules\.cache not found
)

echo.
echo Step 4: Clearing npm cache...
call npm cache clean --force
echo   - npm cache cleared

echo.
echo Step 5: Temporarily renaming page.tsx to force rebuild...
if exist app\page.tsx (
    ren app\page.tsx page.tsx.temp
    timeout /t 1 /nobreak >nul
    ren app\page.tsx.temp page.tsx
    echo   - File renamed and restored (forces Next.js to see it as new)
) else (
    echo   - page.tsx not found
)

echo.
echo ========================================
echo Cache cleared! Now:
echo 1. Run: npm run dev
echo 2. Wait 1-2 minutes for compilation
echo 3. Open http://localhost:3000
echo ========================================
pause
