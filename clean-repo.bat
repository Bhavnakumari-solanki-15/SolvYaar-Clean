@echo off
echo ======================================
echo   Cleaning Repository for GitHub Push
echo ======================================
echo.

echo Step 1: Removing large and unnecessary directories...
if exist dist.zip del /F /Q dist.zip
if exist dist rd /S /Q dist
if exist node_modules rd /S /Q node_modules
if exist cache rd /S /Q cache
if exist artifacts rd /S /Q artifacts
if exist venv rd /S /Q venv
if exist __pycache__ rd /S /Q __pycache__
if exist .cache rd /S /Q .cache
if exist .vercel rd /S /Q .vercel
if exist bun.lockb del /F /Q bun.lockb

echo.
echo Step 2: Backing up environment files...
if exist .env copy .env .env.backup
if exist .env.production copy .env.production .env.production.backup

echo.
echo Step 3: Applying .gitignore rules...
git add .
git status

echo.
echo ======================================
echo   Repository Cleaning Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Review the files with 'git status'
echo 2. Commit your changes: git commit -m "Your commit message"
echo 3. Push to GitHub: git push origin main
echo.
echo Note: Your original .env files have been backed up as .env.backup

pause 