@echo off
echo Installing Fluvio in WSL Ubuntu...
wsl bash -c "curl -fsS https://packages.fluvio.io/v1/install.sh -o install-fluvio.sh"
wsl bash -c "chmod +x install-fluvio.sh"
wsl bash -c "./install-fluvio.sh"
echo.
echo Adding Fluvio to PATH...
wsl bash -c "echo 'export PATH=\"\$HOME/.fluvio/bin:\$PATH\"' >> ~/.bashrc"
echo.
echo Trying to start Fluvio cluster...
wsl bash -c "source ~/.bashrc && fluvio cluster delete --force || true"
wsl bash -c "source ~/.bashrc && fluvio cluster start || echo 'Could not start Fluvio cluster. You may need to restart WSL.'"
echo.
echo "Also, let's create a fallback server that doesn't require Fluvio"
echo.
echo Done! Run "npm run server:collab" to start the collaborative server.
pause 