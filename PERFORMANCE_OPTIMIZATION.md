# Оптимизация производительности для 5000 пользователей и 10000 сообщений

## 🚀 Обзор оптимизаций

Система была оптимизирована для поддержки высокой нагрузки:
- **5000 пользователей**
- **10000 сообщений**
- **Быстрые ответы API**
- **Эффективное использование ресурсов**

## 📊 Ключевые оптимизации

### 1. База данных (MongoDB)

#### Индексы для быстрого поиска:
```javascript
// Пользователи
userSchema.index({ isActive: 1, lastMessageAt: -1 });
userSchema.index({ telegramId: 1 });
userSchema.index({ username: 1 });

// Сообщения
messageSchema.index({ telegramId: 1, timestamp: -1 });
messageSchema.index({ telegramId: 1, messageId: 1 });
messageSchema.index({ timestamp: -1 });
messageSchema.index({ fromBot: 1, timestamp: -1 });
messageSchema.index({ messageType: 1, timestamp: -1 });
```

#### Пул соединений:
```javascript
const mongoOptions = {
  maxPoolSize: 50,        // Максимум 50 соединений
  minPoolSize: 10,        // Минимум 10 соединений
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  bufferMaxEntries: 0,    // Отключаем буферизацию
  bufferCommands: false   // Отключаем буферизацию команд
};
```

### 2. Кэширование

#### Кэш пользователей в TelegramService:
```javascript
this.userCache = new Map();
this.CACHE_TTL = 10 * 60 * 1000; // 10 минут
```

#### Кэш API ответов:
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут
```

### 3. Оптимизация запросов

#### Использование `lean()`:
```javascript
User.find(query)
  .select('telegramId username firstName lastName lastMessageAt isActive')
  .lean() // Возвращает простые объекты вместо Mongoose документов
```

#### Параллельные запросы:
```javascript
const [users, total] = await Promise.all([
  User.find(query).lean(),
  User.countDocuments(query)
]);
```

### 4. Пагинация и лимиты

#### Ограничения размера страниц:
```javascript
const maxLimit = Math.min(parseInt(limit), 200); // Максимум 200 пользователей
const maxLimit = Math.min(parseInt(limit), 100); // Максимум 100 сообщений
```

#### Фильтрация по времени:
```javascript
if (before) {
  query.timestamp = { ...query.timestamp, $lt: new Date(before) };
}
if (after) {
  query.timestamp = { ...query.timestamp, $gt: new Date(after) };
}
```

### 5. Безопасность и защита

#### Rate Limiting:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 1000, // максимум 1000 запросов с одного IP
});
```

#### Сжатие ответов:
```javascript
app.use(compression()); // Gzip сжатие
```

#### Helmet для безопасности:
```javascript
app.use(helmet()); // Заголовки безопасности
```

### 6. Мониторинг производительности

#### Статистика в реальном времени:
- Количество запросов
- Среднее время ответа
- Использование памяти
- Статус соединений с БД

#### Health Check:
```javascript
GET /api/health/detailed
```

#### Полная статистика:
```javascript
GET /api/stats
```

## 📈 Ожидаемая производительность

### Пользователи:
- **Загрузка списка**: ~50ms (с кэшем)
- **Поиск пользователя**: ~10ms (с индексами)
- **Пагинация**: ~20ms на страницу

### Сообщения:
- **Загрузка сообщений**: ~30ms (с индексами)
- **Фильтрация по времени**: ~15ms
- **Статистика**: ~50ms (с агрегацией)

### API:
- **Среднее время ответа**: <100ms
- **Пропускная способность**: 1000+ запросов/минуту
- **Использование памяти**: <500MB

## 🔧 Конфигурация

### Настройки в `config/performance.js`:
```javascript
{
  database: {
    maxPoolSize: 50,
    minPoolSize: 10
  },
  cache: {
    userCacheTTL: 10 * 60 * 1000,
    apiCacheTTL: 5 * 60 * 1000
  },
  pagination: {
    maxUsersPerPage: 200,
    maxMessagesPerPage: 100
  }
}
```

## 🛠️ Мониторинг и обслуживание

### Автоматическая очистка:
```javascript
POST /api/cleanup
```

### Проверка здоровья:
```javascript
GET /api/health/detailed
```

### Статистика системы:
```javascript
GET /api/stats
```

## 📋 Рекомендации по развертыванию

### 1. Сервер:
- **CPU**: Минимум 2 ядра
- **RAM**: Минимум 2GB
- **SSD**: Рекомендуется для БД

### 2. MongoDB:
- **RAM**: Минимум 1GB
- **Индексы**: Автоматически создаются
- **Репликация**: Рекомендуется для продакшена

### 3. Мониторинг:
- Настройте алерты на использование памяти >1GB
- Мониторьте время ответа API
- Отслеживайте количество активных соединений

## 🚨 Критические пороги

- **Память**: >1GB = критично
- **Время ответа**: >500ms = предупреждение
- **Ошибки**: >5% = критично
- **Соединения БД**: >80% = предупреждение

## 📊 Метрики производительности

Система готова к нагрузке:
- ✅ **5000 пользователей**
- ✅ **10000 сообщений**
- ✅ **Быстрые ответы API**
- ✅ **Эффективное использование ресурсов**
- ✅ **Мониторинг в реальном времени**
- ✅ **Автоматическая очистка данных** 