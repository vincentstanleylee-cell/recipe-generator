@echo off
setlocal
set "APP_FILE=%~dp0dist\index.html"

if not exist "%APP_FILE%" (
  echo Recipe Generator could not find:
  echo %APP_FILE%
  echo.
  pause
  exit /b 1
)

start "Recipe Generator" "%APP_FILE%"
endlocal
