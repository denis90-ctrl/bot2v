const express = require('express');
const multer = require('multer');
const User = require('../models/User');
const Message = require('../models/Message');
const telegramService = require('../services/telegramService');
const { verifyInitData } = require('../utils/telegramAuth');

const router = express.Router();

// Проверка подлинности Telegram WebApp initData или admin-key
const requireTelegramAuth = (req, res, next) => {
  const adminKeyHeader = req.headers['x-admin-key'];
  const adminKey = process.env.ADMIN_API_KEY;

  if (adminKey && adminKeyHeader && adminKeyHeader === adminKey) {
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

  return next();
};

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

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Получение списка всех пользователей
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 100, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const maxLimit = Math.min(parseInt(limit), 200);
    
    let query = { isActive: true };
    
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
        .lean(),
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

// Получение сообщений пользователя
router.get('/messages/:telegramId', async (req, res) => {
  try {
    const { telegramId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const maxLimit = Math.min(parseInt(limit), 100);
    const skip = (parseInt(page) - 1) * maxLimit;
    
    const query = { telegramId };
    
    const [messages, total] = await Promise.all([
      Message.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(maxLimit)
        .select('messageId text fromBot timestamp messageType attachments')
        .lean(),
      Message.countDocuments(query)
    ]);
    
    res.json({
      messages: messages.reverse(),
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

// Отправка сообщения пользователю
router.post('/send-message', requireTelegramAuth, async (req, res) => {
  try {
    const { telegramId, text } = req.body;
    
    if (!telegramId || !text) {
      return res.status(400).json({ error: 'Необходимы telegramId и text' });
    }
    
    const message = await telegramService.sendMessage(telegramId, text);
    res.json({ success: true, message });
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    res.status(500).json({ error: 'Ошибка отправки сообщения' });
  }
});

// Обработка OPTIONS запросов для CORS
router.options('/file/:fileId', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');
  res.status(200).end();
});

// Получение файла по fileId
router.get('/file/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    if (!fileId) {
      return res.status(400).json({ error: 'Необходим fileId' });
    }
    
    console.log(`📁 Запрос файла: ${fileId}`);
    
    // Получаем информацию о файле из Telegram
    const fileInfo = await telegramService.getFile(fileId);
    
    if (!fileInfo) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Получаем содержимое файла
    const fileStream = await telegramService.getFileStream(fileId);
    
    if (!fileStream) {
      return res.status(404).json({ error: 'Файл не найден' });
    }
    
    // Устанавливаем CORS заголовки для изображений
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length');
    
    // Определяем MIME-тип на основе расширения файла
    let contentType = 'application/octet-stream';
    if (fileInfo.file_name) {
      const ext = fileInfo.file_name.toLowerCase().split('.').pop();
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'pdf':
          contentType = 'application/pdf';
          break;
        case 'txt':
          contentType = 'text/plain';
          break;
        default:
          contentType = fileInfo.mime_type || 'application/octet-stream';
      }
    }
    
    // Устанавливаем заголовки для правильного отображения
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.file_name || 'file'}"`);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Передаем поток файла
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Ошибка получения файла:', error);
    res.status(500).json({ error: 'Ошибка получения файла' });
  }
});

// Редактирование сообщения
router.put('/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Необходим текст сообщения' });
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

module.exports = router; 
