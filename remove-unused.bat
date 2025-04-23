@echo off
echo ======================================
echo  Removing Unused SolvYaar Components
echo ======================================
echo.

echo Creating backup folder...
mkdir unused-components-backup

echo.
echo Backing up unused components...
if exist "src\components\math-chaos\sections\ConfessionBooth.tsx" (
  copy "src\components\math-chaos\sections\ConfessionBooth.tsx" "unused-components-backup\"
  copy "src\components\math-chaos\sections\ConfessionBooth.css" "unused-components-backup\"
  echo Backed up ConfessionBooth components
)

if exist "src\components\math-chaos\sections\MathLore.tsx" (
  copy "src\components\math-chaos\sections\MathLore.tsx" "unused-components-backup\"
  copy "src\components\math-chaos\sections\MathLore.css" "unused-components-backup\"
  echo Backed up MathLore components
)

if exist "src\components\math-chaos\sections\HotTakes.tsx" (
  copy "src\components\math-chaos\sections\HotTakes.tsx" "unused-components-backup\"
  copy "src\components\math-chaos\sections\HotTakes.css" "unused-components-backup\"
  echo Backed up HotTakes components
)

echo.
echo Removing unused components...
if exist "src\components\math-chaos\sections\ConfessionBooth.tsx" del /F "src\components\math-chaos\sections\ConfessionBooth.tsx"
if exist "src\components\math-chaos\sections\ConfessionBooth.css" del /F "src\components\math-chaos\sections\ConfessionBooth.css"
if exist "src\components\math-chaos\sections\MathLore.tsx" del /F "src\components\math-chaos\sections\MathLore.tsx" 
if exist "src\components\math-chaos\sections\MathLore.css" del /F "src\components\math-chaos\sections\MathLore.css"
if exist "src\components\math-chaos\sections\HotTakes.tsx" del /F "src\components\math-chaos\sections\HotTakes.tsx"
if exist "src\components\math-chaos\sections\HotTakes.css" del /F "src\components\math-chaos\sections\HotTakes.css"

echo.
echo ======================================
echo       Removal Complete!
echo ======================================
echo.
echo The following files have been removed:
echo - ConfessionBooth.tsx and ConfessionBooth.css
echo - MathLore.tsx and MathLore.css
echo - HotTakes.tsx and HotTakes.css
echo.
echo All removed files have been backed up to the "unused-components-backup" folder.
echo.
echo Note: These components were not used in the MathChaos component or referenced 
echo anywhere else in the application, so their removal will not affect functionality.

pause 