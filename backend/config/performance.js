module.exports = {
  // Настройки базы данных
  database: {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferCommands: true // Включаем буферизацию команд для стабильности
  },

  // Настройки кэширования
  cache: {
    userCacheTTL: 10 * 60 * 1000, // 10 минут
    apiCacheTTL: 5 * 60 * 1000, // 5 минут
    maxCacheSize: 1000 // Максимальное количество элементов в кэше
  },

  // Настройки пагинации
  pagination: {
    maxUsersPerPage: 200,
    maxMessagesPerPage: 100,
    defaultUsersPerPage: 100,
    defaultMessagesPerPage: 50
  },

  // Настройки rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 1000, // максимум 1000 запросов с одного IP
    message: 'Слишком много запросов с этого IP'
  },

  // Настройки Telegram бота
  telegram: {
    pollingTimeout: 10,
    pollingLimit: 100,
    allowedUpdates: ['message', 'edited_message']
  },

  // Настройки мониторинга
  monitoring: {
    memoryWarningThreshold: 500, // MB
    memoryCriticalThreshold: 1000, // MB
    uptimeWarningThreshold: 24, // hours
    cleanupInterval: 24 * 60 * 60 * 1000, // 24 часа
    oldDataThreshold: 30 * 24 * 60 * 60 * 1000 // 30 дней
  },

  // Настройки безопасности
  security: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'text/'
    ]
  },

  // Настройки логирования
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enablePerformanceLogging: true,
    enableErrorLogging: true
  }
}; 