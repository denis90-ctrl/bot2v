# 🚀 Быстрый запуск Telegram Bot Admin

## Шаг 1: Установка MongoDB
1. Скачайте и установите MongoDB с [официального сайта](https://www.mongodb.com/try/download/community)
2. Запустите MongoDB: `mongod`

## Шаг 2: Настройка конфигурации
1. Откройте файл `backend/config.env`
2. Замените `your_bot_token_here` на ваш токен бота
3. Укажите `ADMIN_CHAT_ID` (ваш chat id)
4. Укажите `ADMIN_API_KEY` (секретный ключ для админки)
5. Обновите `WEBHOOK_URL` на ваш домен (для продакшена)

## Шаг 3: Запуск приложения

### Вариант 1: Через PowerShell
```powershell
# Терминал 1 - Бэкенд
cd backend
npm install
npm start

# Терминал 2 - Фронтенд  
cd admin
npm install
npm start
```

Создайте файл `admin/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ADMIN_API_KEY=your_admin_api_key_here
```

### Вариант 2: Через bat файлы
```cmd
# Запустите два файла в разных окнах:
run-backend.bat
run-admin.bat
```

## Шаг 4: Открытие приложения
- Бэкенд: http://localhost:3001
- Админский интерфейс: http://localhost:3000

## 🔧 Настройка Webhook (для продакшена)
```bash
npm run setup-webhook
```

## 📝 Логи
- Бэкенд логирует подключения и ошибки в консоль
- Фронтенд показывает статус подключения в интерфейсе

## 🆘 Решение проблем

### Ошибка подключения к MongoDB
- Убедитесь, что MongoDB запущен
- Проверьте URI в `backend/config.env`

### Ошибка отправки сообщений
- Проверьте токен бота в `backend/config.env`
- Убедитесь, что бот активен

### Проблемы с webhook
- Домен должен иметь SSL сертификат
- URL должен быть публично доступен 
