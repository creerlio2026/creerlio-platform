# Terminal Launch Issue - Workaround Guide

## Issue
Cursor IDE shows "The terminal process failed to launch (exit code: 1)" when trying to open integrated terminals.

## Root Cause
This appears to be a Cursor-specific issue with terminal process launching, despite:
- ✅ PowerShell and cmd.exe both work correctly
- ✅ Settings files are valid JSON
- ✅ All terminal executables are accessible
- ✅ File permissions are correct

## Solutions

### Solution 1: Use External Terminal (Recommended)
Instead of using Cursor's integrated terminal, use external terminals:

**Windows:**
1. Press `Win + R`
2. Type `cmd` and press Enter
3. Navigate to your project: `cd C:\Users\simon\Projects2025\Creerlio_V2\creerlio-platform`

**Or use the batch file:**
- Double-click `start-servers-reliable.bat` in the project root
- This opens both servers in separate command windows

### Solution 2: Use Batch Files
All server startup scripts work independently of Cursor's terminal:

- `start-servers-reliable.bat` - Starts both backend and frontend
- `AUTO_START_BACKEND.bat` - Starts backend only
- `START_FRONTEND_NOW.bat` - Starts frontend only

### Solution 3: Manual Terminal Launch
1. Open Command Prompt or PowerShell outside of Cursor
2. Navigate to project directory
3. Run commands manually:
   ```cmd
   cd backend
   .\venv\Scripts\activate
   python main.py
   ```

### Solution 4: Try Cursor Settings Reset
1. Close Cursor completely
2. Delete `.vscode/settings.json` and `.cursor/settings.json`
3. Reopen Cursor
4. Let it use default terminal settings

## Current Configuration
The settings files have been simplified to minimal configuration:
- Default profile: Command Prompt
- No custom paths or automation profiles
- Let Cursor use its built-in defaults

## Verification
To verify terminals work outside Cursor:
```cmd
C:\Windows\System32\cmd.exe /c echo "Terminal works"
```

This should output "Terminal works" without errors.

## Next Steps
If the issue persists:
1. Report to Cursor support as a potential IDE bug
2. Continue using external terminals or batch files
3. Check Cursor updates for terminal launch fixes
