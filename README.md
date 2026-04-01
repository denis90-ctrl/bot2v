# Telegram Bot Admin Interface

Веб-интерфейс для администрирования Telegram-бота с возможностью просмотра и ответа на сообщения пользователей.

## 🚀 Возможности

- **Список пользователей** - просмотр всех пользователей, которые писали боту
- **Чат в реальном времени** - просмотр переписки с каждым пользователем
- **Отправка сообщений** - ответ пользователям от имени бота
- **Поддержка Markdown** - форматирование сообщений
- **Автообновление** - автоматическое обновление списка пользователей и сообщений
- **Темная тема** - современный темный интерфейс

## 📋 Требования

- Node.js >= 16.0.0
- MongoDB
- Telegram Bot Token

## 🛠 Установка

1. **Клонируйте репозиторий:**
```bash
git clone <repository-url>
cd telegram-bot-admin
```

2. **Установите зависимости:**
```bash
npm run install:all
```

3. **Настройте переменные окружения:**

Создайте файл `backend/config.env`:
```env
MONGODB_URI=mongodb://localhost:27017/telegram-bot-admin
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_CHAT_ID=your_admin_chat_id_here
ADMIN_API_KEY=your_admin_api_key_here
PORT=3001
WEBHOOK_URL=https://your-domain.com/api/webhook
```

Создайте файл `admin/.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_ADMIN_API_KEY=your_admin_api_key_here
```

4. **Запустите MongoDB:**
```bash
# Локально
mongod

# Или используйте MongoDB Atlas
```

## 🚀 Запуск

### Разработка
```bash
# Запуск бэкенда и фронтенда одновременно
npm run dev

# Или по отдельности:
npm run dev:backend  # Бэкенд на порту 3001
npm run dev:admin    # Фронтенд на порту 3000
```

### Продакшн
```bash
# Сборка фронтенда
npm run build:admin

# Запуск бэкенда
npm run start:backend
```

## 🔧 Настройка Webhook

1. **Настройте домен и SSL сертификат** (обязательно для webhook)

2. **Обновите WEBHOOK_URL в config.env:**
```env
WEBHOOK_URL=https://your-domain.com/api/webhook
```

3. **Установите webhook:**
```bash
npm run setup-webhook
```

## 📁 Структура проекта

```
telegram-bot-admin/
├── backend/                 # Бэкенд (Node.js + Express)
│   ├── models/             # MongoDB модели
│   ├── routes/             # API роуты
│   ├── services/           # Бизнес-логика
│   ├── server.js           # Основной сервер
│   └── config.env          # Конфигурация
├── admin/                  # Фронтенд (React)
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── services/       # API сервисы
│   │   └── App.jsx         # Главный компонент
│   └── public/             # Статические файлы
├── scripts/                # Вспомогательные скрипты
└── package.json            # Управление проектом
```

## 🔌 API Endpoints

### Пользователи
- `GET /api/users` - Список всех пользователей
- `GET /api/user/:telegramId` - Информация о пользователе

### Сообщения
- `GET /api/messages/:telegramId` - Сообщения пользователя
- `POST /api/send-message` - Отправка сообщения

### Webhook
- `POST /api/webhook` - Получение сообщений от Telegram

## 🎨 Интерфейс

### Основные компоненты:
- **UserList** - Список пользователей с информацией о последнем сообщении
- **ChatWindow** - Окно чата с историей сообщений и формой отправки
- **App** - Главный компонент с управлением состоянием

### Особенности:
- Автоматическая прокрутка к новым сообщениям
- Поддержка Markdown в сообщениях
- Индикатор онлайн/оффлайн статуса
- Обработка ошибок с уведомлениями
- Адаптивный дизайн

## 🔒 Безопасность

- Валидация входящих данных
- Обработка ошибок API
- CORS настройки
- Проверка подключения к серверу

## 🚀 Развертывание

### Локально:
1. Установите MongoDB
2. Настройте переменные окружения
3. Запустите `npm run dev`

### На сервере:
1. Настройте домен с SSL
2. Обновите WEBHOOK_URL
3. Запустите бэкенд: `npm run start:backend`
4. Разверните фронтенд: `npm run build:admin`

## 📝 Логирование

Бэкенд логирует:
- Подключение к MongoDB
- Входящие сообщения
- Ошибки API
- Статус webhook

## 🔧 Отладка

### Проверка подключения:
```bash
curl http://localhost:3001/health
```

### Проверка webhook:
```bash
curl -X POST http://localhost:3001/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"message":{"from":{"id":123,"username":"test"},"text":"test"}}'
```

## 🤝 Вклад в проект

1. Fork репозиторий
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License
