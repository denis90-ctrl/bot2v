@echo off
echo Setting up INTURU Shop environment...

REM Check if .env exists
if exist .env (
    echo .env file already exists!
    echo Please backup your current .env file if needed.
    pause
    exit /b
)

REM Copy .env.example to .env
if exist .env.example (
    copy .env.example .env
    echo Created .env file from .env.example
    echo.
    echo Please edit .env file and add your Telegram Bot Token and Chat ID
    echo.
    echo Example:
    echo REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token_here
    echo REACT_APP_TELEGRAM_CHAT_ID=your_chat_id_here
    echo.
    pause
) else (
    echo .env.example file not found!
    echo Please create .env file manually with your Telegram Bot configuration.
    pause
) 