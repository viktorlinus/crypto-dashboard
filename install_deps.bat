@echo off
echo Installing Python dependencies for Crypto Dashboard Flask server...
pip install flask flask_caching pandas plotly google-api-python-client google-auth google-auth-oauthlib ta kaleido
echo.
echo Dependencies installed! You can now run the Flask server with:
echo python server.py
pause
