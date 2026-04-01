#!/bin/bash

echo "Setting up INTURU Shop environment..."

# Check if .env exists
if [ -f .env ]; then
    echo ".env file already exists!"
    echo "Please backup your current .env file if needed."
    exit 1
fi

# Copy .env.example to .env
if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env file from .env.example"
    echo ""
    echo "Please edit .env file and add your Telegram Bot Token and Chat ID"
    echo ""
    echo "Example:"
    echo "REACT_APP_TELEGRAM_BOT_TOKEN=your_bot_token_here"
    echo "REACT_APP_TELEGRAM_CHAT_ID=your_chat_id_here"
    echo ""
else
    echo ".env.example file not found!"
    echo "Please create .env file manually with your Telegram Bot configuration."
    exit 1
fi 