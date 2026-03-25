@echo off
setlocal
echo ========================================
echo 📺 PC REMOTE - TV APP BUILDER
echo ========================================

:: Step 1: Build the Web App
echo [1/3] Building Web Files...
call npm run build

:: Step 2: Sync to Android
echo.
echo [2/3] Syncing to Android Platform...
call npx cap sync android

:: Step 3: Open Android Studio
echo.
echo [3/3] Opening Android Studio...
echo.
echo * IN ANDROID STUDIO: 
echo   1. Click 'Build' -> 'Build Bundle(s) / APK(s)' -> 'Build APK(s)'
echo   2. Wait for the build to finish.
echo   3. Click 'Locate' in the bottom-right popup to find your .apk.
echo.
call npx cap open android

echo.
echo ========================================
echo ✅ BUILD READY
echo ========================================
pause
