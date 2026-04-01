@echo off
echo ========================================
echo Telegram Bot Admin Interface
echo ========================================

echo.
echo Установка зависимостей...
call npm run install:all

echo.
echo Запуск в режиме разработки...
echo Бэкенд: http://localhost:3001
echo Фронтенд: http://localhost:3000
echo.
call npm run dev

pause 