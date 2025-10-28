@echo off
REM Local Development Server for NZNO Expense Claim Form
REM Starts a simple HTTP server on port 8000

echo Starting local development server...
echo.
echo Access the application at: http://localhost:8000/index.html
echo.
echo Press Ctrl+C to stop the server
echo.

python -m http.server 8000
