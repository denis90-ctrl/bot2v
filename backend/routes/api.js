const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const Message = require('../models/Message');
const telegramService = require('../services/telegramService');
const performanceMonitor = require('../utils/performance');
const { verifyInitData } = require('../utils/telegramAuth');

const router = express.Router();

// Настройка multer для загрузки файлов
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Разрешаем изображения, документы, видео и аудио
    if (file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') || 
        file.mimetype.startsWith('audio/') || 
        file.mimetype === 'application/pdf' ||
        file.mimetype.startsWith('text/')) {
      cb(null, true);
    } else {
      cb(new Error('Неподдерживаемый тип файла'), false);
    }
  }
});

// Простое кэширование для часто запрашиваемых данных
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 минут

// Middleware для кэширования
const cacheMiddleware = (duration = CACHE_TTL) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < duration) {
      return res.json(cached.data);
    }
    
    res.sendResponse = res.json;
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      res.sendResponse(data);
    };
    
    next();
  };
};

// Middleware для мониторинга производительности
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    performanceMonitor.updateRequestStats(responseTime, res.statusCode >= 400);
  });
  
  next();
};

// Применяем мониторинг производительности ко всем роутам
router.use(performanceMiddleware);

// Проверка подлинности Telegram WebApp initData
const requireTelegramAuth = (req, res, next) => {
  const adminKeyHeader = req.headers['x-admin-key'];
  const adminKey = process.env.ADMIN_API_KEY;

  if (adminKey && adminKeyHeader && adminKeyHeader === adminKey) {
    req.telegramUserId = null;
    return next();
  }

  const initData = req.body?.initData || req.headers['x-telegram-init-data'];
  if (!initData) {
    return res.status(401).json({ error: 'initData отсутствует' });
  }

  const result = verifyInitData(initData, process.env.TELEGRAM_BOT_TOKEN);
  if (!result.ok) {
    return res.status(401).json({ error: 'initData недействителен' });
  }

  const adminId = process.env.ADMIN_CHAT_ID;
  if (adminId && result.userId && result.userId !== String(adminId)) {
    return res.status(403).json({ error: 'Недостаточно прав' });
  }

  req.telegramUserId = result.userId || null;
  return next();
};

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Получение полной статистики системы
router.get('/stats', cacheMiddleware(1 * 60 * 1000), async (req, res) => {
  try {
    const stats = await performanceMonitor.getFullStats();
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка здоровья системы
router.get('/health/detailed', async (req, res) => {
  try {
    const health = await performanceMonitor.healthCheck();
    res.json(health);
  } catch (error) {
    console.error('Ошибка проверки здоровья:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Очистка старых данных
router.post('/cleanup', async (req, res) => {
  try {
    const result = await performanceMonitor.cleanupOldData();
    res.json(result);
  } catch (error) {
    console.error('Ошибка очистки данных:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение списка всех пользователей с оптимизированной пагинацией
router.get('/users', cacheMiddleware(2 * 60 * 1000), async (req, res) => {
  try {
    // Проверяем доступность MongoDB
    if (!User || !User.find) {
      return res.json({
        users: [],
        total: 0,
        page: 1,
        pages: 0,
        hasMore: false,
        note: 'MongoDB недоступна'
      });
    }

    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Ограничиваем максимальный размер страницы
    const maxLimit = Math.min(parseInt(limit), 200);
    
    let query = { isActive: true };
    
    // Добавляем поиск по username или firstName
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(maxLimit)
        .select('telegramId username firstName lastName lastMessageAt isActive')
        .lean(), // Используем lean() для лучшей производительности
      User.countDocuments(query)
    ]);
    
    res.json({
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / maxLimit),
      hasMore: skip + users.length < total
    });
  } catch (error) {
    console.error('Ошибка получения пользователей:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статистики пользователей
router.get('/users/stats', cacheMiddleware(5 * 60 * 1000), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: ['$isActive', 1, 0] } },
          avgLastMessageAt: { $avg: { $toDate: '$lastMessageAt' } }
        }
      }
    ]);
    
    res.json(stats[0] || { totalUsers: 0, activeUsers: 0, avgLastMessageAt: null });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение сообщений пользователя с оптимизированной пагинацией
router.get('/messages/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    
    // Ограничиваем максимальный размер страницы
    const maxLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * maxLimit;
    
    let query = { telegramId };
    
    // Добавляем фильтры по времени для оптимизации
    if (before) {
      query.timestamp = { ...query.timestamp, $lt: new Date(before) };
    }
    if (after) {
      query.timestamp = { ...query.timestamp, $gt: new Date(after) };
    }
    
    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(maxLimit)
        .select('messageId text fromBot timestamp messageType attachments')
        .lean(), // Используем lean() для лучшей производительности
      Message.countDocuments(query)
    ]);
    
    res.json({
      messages: messages.reverse(), // Возвращаем в хронологическом порядке
      total,
      page: parseInt(page),
      pages: Math.ceil(total / maxLimit),
      hasMore: skip + messages.length < total
    });
  } catch (error) {
    console.error('Ошибка получения сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Получение статистики сообщений
router.get('/messages/:telegramId/stats', cacheMiddleware(2 * 60 * 1000), async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const stats = await Message.aggregate([
      { $match: { telegramId } },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          botMessages: { $sum: { $cond: ['$fromBot', 1, 0] } },
          userMessages: { $sum: { $cond: ['$fromBot', 0, 1] } },
          avgMessageLength: { $avg: { $strLenCP: '$text' } }
        }
      }
    ]);
    
    res.json(stats[0] || { totalMessages: 0, botMessages: 0, userMessages: 0, avgMessageLength: 0 });
  } catch (error) {
    console.error('Ошибка получения статистики сообщений:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Отправка сообщения пользователю
router.post('/send-message', requireTelegramAuth, async (req, res) => {
  try {
    const { telegramId, text } = req.body;
    
    if (!telegramId || !text) {
      return res.status(400).json({ error: 'Необходимы telegramId и text' });
    }
    
    // Очищаем кэш для этого пользователя
    cache.delete(`/api/messages/${telegramId}`);
    cache.delete(`/api/messages/${telegramId}/stats`);
    
    const message = await telegramService.sendMessage(telegramId, text);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Отправка файла пользователю
router.post('/send-file', requireTelegramAuth, upload.single('file'), async (req, res) => {
  try {
    const { telegramId, caption } = req.body;
    const file = req.file;
    
    if (!telegramId || !file) {
      return res.status(400).json({ error: 'Необходимы telegramId и file' });
    }
    
    // Очищаем кэш для этого пользователя
    cache.delete(`/api/messages/${telegramId}`);
    cache.delete(`/api/messages/${telegramId}/stats`);
    
    const message = await telegramService.sendFile(telegramId, file, caption);
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Ошибка отправки файла:', error);
    res.status(500).json({ error: 'Ошибка отправки файла' });
  }
});

// Получение информации о пользователе
router.get('/user/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    
    const user = await User.findOne({ telegramId });
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Ошибка получения информации о пользователе:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});



// Редактирование сообщения
// Уведомление о заказе администратору
router.post('/notify-order', async (req, res) => {
  try {
    const { user, items, total } = req.body || {};

    if (!user || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Некорректные данные заказа' });
    }

    const adminChatId = process.env.ADMIN_CHAT_ID || process.env.REACT_APP_ADMIN_CHAT_ID;
    if (!adminChatId) {
      return res.status(500).json({ error: 'ADMIN_CHAT_ID не настроен' });
    }

    const lines = items.map((item, idx) => {
      const priceText = Number.isFinite(item.price) && item.price > 0 ? `${item.price} ₽` : 'Скоро';
      const qtyText = item.quantity ? ` x${item.quantity}` : '';
      return `${idx + 1}. ${item.name}${qtyText} — ${priceText}`;
    });

    const totalText = Number.isFinite(total) ? `${total} ₽` : '—';
    const message = [
      '🛒 Новый заказ',
      '',
      `👤 Пользователь: ${user.name || '—'}`,
      `🆔 ID: ${user.id || '—'}`,
      `🔗 Username: ${user.username ? '@' + user.username : '—'}`,
      '',
      '📦 Состав:',
      ...lines,
      '',
      `💰 Итого: ${totalText}`
    ].join('\n');

    await telegramService.sendMessage(adminChatId, message);

    return res.json({ success: true });
  } catch (error) {
    console.error('Ошибка уведомления о заказе:', error);
    return res.status(500).json({ error: 'Ошибка уведомления о заказе' });
  }
});
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Необходим текст сообщения' });
    }
    
    // Проверяем, является ли messageId валидным ObjectId
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Неверный формат ID сообщения' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    // Редактируем сообщение в Telegram (только для сообщений от бота)
    if (message.fromBot) {
      try {
        await telegramService.editMessage(message.telegramId, message.messageId, text);
      } catch (telegramError) {
        console.error('Ошибка редактирования в Telegram:', telegramError);
        // Продолжаем выполнение, даже если редактирование в Telegram не удалось
      }
    }
    
    // Обновляем сообщение в базе данных
    message.text = text;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Ошибка редактирования сообщения:', error);
    res.status(500).json({ error: 'Ошибка редактирования сообщения' });
  }
});

// Удаление сообщения
router.delete('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Проверяем, является ли messageId валидным ObjectId
    if (!messageId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Неверный формат ID сообщения' });
    }
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    
    // Удаляем сообщение из Telegram (только для сообщений от бота)
    if (message.fromBot) {
      try {
        await telegramService.deleteMessage(message.telegramId, message.messageId);
      } catch (telegramError) {
        console.error('Ошибка удаления из Telegram:', telegramError);
        // Продолжаем выполнение, даже если удаление из Telegram не удалось
      }
    }
    
    // Удаляем сообщение из базы данных
    await Message.findByIdAndDelete(messageId);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления сообщения:', error);
    res.status(500).json({ error: 'Ошибка удаления сообщения' });
  }
});

// Получение файла по fileId
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'Необходим fileId' });
    }
    
    console.log(`📁 Запрос файла: ${fileId}`);
    
    // Получаем файл через Telegram API
    const fileStream = await telegramService.getFileStream(fileId);
    
    if (!fileStream) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Устанавливаем заголовки для правильного отображения
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Кэшируем на 1 час
    
    // Передаем поток файла
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Ошибка получения файла:', error);
    res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

// Webhook для получения сообщений от Telegram
router.post('/webhook', async (req, res) => {
  try {
    const update = req.body;
    // Обрабатываем update в webhook-режиме
    telegramService.processUpdate(update);
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Ошибка webhook:', error);
    res.status(500).json({ error: 'Ошибка webhook' });
  }
});

module.exports = router; 

