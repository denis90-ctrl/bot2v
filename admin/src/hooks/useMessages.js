import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../services/api';

export const useMessages = (selectedUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);

  // Кеш сообщений по пользователям
  const messagesCache = useMemo(() => new Map(), []);

  // Загрузка сообщений с пагинацией
  const loadMessages = useCallback(async (telegramId, force = false) => {
    if (!telegramId) return;

    try {
      // Проверяем кеш
      const cacheKey = `${telegramId}_${page}`;
      if (!force && messagesCache.has(cacheKey)) {
        const cached = messagesCache.get(cacheKey);
        setMessages(cached.messages);
        setHasMore(cached.hasMore);
        return;
      }

      setLoading(true);
      setError(null);

      const messagesData = await apiService.getMessages(telegramId, page, 50);
      
      // Обрабатываем сообщения
      const processedMessages = (messagesData.messages || []).map(message => {
        const messageId = message._id || message.messageId;
        
        // Логируем сообщения без ID для отладки
        if (!messageId) {
          console.warn('Сообщение без ID:', message);
        }
        
        return {
          ...message,
          fromBot: !message.fromBot, // Инвертируем логику
          _id: messageId
        };
      });

      // Сортируем сообщения
      const sortedMessages = processedMessages.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );

      // Обновляем кеш
      messagesCache.set(cacheKey, {
        messages: sortedMessages,
        hasMore: messagesData.hasMore || false
      });

      // Если это первая загрузка (пустой список), заменяем сообщения
      // Иначе добавляем только новые сообщения
      if (messages.length === 0) {
        console.log('Первая загрузка сообщений:', sortedMessages.length);
        setMessages(sortedMessages);
      } else {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          // Фильтруем сообщения, которые не являются временными (не начинаются с 'temp_')
          const newMessages = sortedMessages.filter(m => 
            !existingIds.has(m._id) && !m._id.startsWith('temp_')
          );
          if (newMessages.length > 0) {
            console.log('Добавлено новых сообщений:', newMessages.length);
            const updatedMessages = [...prev, ...newMessages];
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prev;
        });
      }

      // Обновляем кеш только если есть новые сообщения
      if (messages.length === 0 || sortedMessages.length > 0) {
        messagesCache.set(cacheKey, {
          messages: sortedMessages,
          hasMore: messagesData.hasMore || false
        });
      }
      
      setHasMore(messagesData.hasMore || false);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setError('Ошибка загрузки сообщений');
    } finally {
      setLoading(false);
    }
  }, [page, messagesCache]);

  // Отправка сообщения
  const sendMessage = useCallback(async (telegramId, text) => {
    try {
      setSending(true);
      const result = await apiService.sendMessage(telegramId, text);
      
      const newMessage = {
        _id: result.message._id || result.message.messageId || `temp_${Date.now()}_${Math.random()}`,
        telegramId,
        text,
        fromBot: false,
        timestamp: result.message.timestamp || new Date().toISOString(),
        messageType: 'text'
      };
      
      // Немедленно добавляем отправленное сообщение в список
      console.log('Отправлено текстовое сообщение:', newMessage);
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

      // Обновляем кеш с новым сообщением
      const cacheKey = `${telegramId}_${page}`;
      const cached = messagesCache.get(cacheKey);
      if (cached) {
        const updatedCachedMessages = [...cached.messages, newMessage];
        messagesCache.set(cacheKey, {
          messages: updatedCachedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
          hasMore: cached.hasMore
        });
      }

      return newMessage;
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      setError('Ошибка отправки сообщения');
      throw error;
    } finally {
      setSending(false);
    }
  }, []);

  // Отправка файла
  const sendFile = useCallback(async (telegramId, file, caption = '') => {
    try {
      setSending(true);
      const result = await apiService.sendFile(telegramId, file, caption);
      
      const newMessage = {
        _id: result.message._id,
        telegramId,
        text: result.message.text,
        fromBot: false,
        timestamp: result.message.timestamp,
        messageType: result.message.messageType,
        attachments: result.message.attachments || []
      };
      
      // Немедленно добавляем отправленное сообщение в список
      console.log('Отправлен файл:', newMessage);
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

      // Обновляем кеш с новым сообщением
      const cacheKey = `${telegramId}_${page}`;
      const cached = messagesCache.get(cacheKey);
      if (cached) {
        const updatedCachedMessages = [...cached.messages, newMessage];
        messagesCache.set(cacheKey, {
          messages: updatedCachedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
          hasMore: cached.hasMore
        });
      }

      return newMessage;
    } catch (error) {
      console.error('Ошибка отправки файла:', error);
      setError('Ошибка отправки файла');
      throw error;
    } finally {
      setSending(false);
    }
  }, []);

  // Редактирование сообщения
  const editMessage = useCallback(async (messageId, newText) => {
    try {
      await apiService.editMessage(messageId, newText);
      
      setMessages(prev => 
        prev.map(message => 
          message._id === messageId 
            ? { 
                ...message, 
                text: newText, 
                isEdited: true,
                editedAt: new Date().toISOString()
              }
            : message
        )
      );
    } catch (error) {
      console.error('Ошибка редактирования сообщения:', error);
      setError('Ошибка редактирования сообщения');
      throw error;
    }
  }, []);

  // Удаление сообщения
  const deleteMessage = useCallback(async (messageId) => {
    try {
      await apiService.deleteMessage(messageId);
      
      setMessages(prev => prev.filter(message => message._id !== messageId));
    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
      setError('Ошибка удаления сообщения');
      throw error;
    }
  }, []);

  // Загрузка следующей страницы
  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  }, [hasMore, loading]);

  // Сброс при смене пользователя
  useEffect(() => {
    if (selectedUserId) {
      setMessages([]);
      setPage(1);
      setHasMore(true);
      setError(null);
      // Загружаем сообщения без принудительного обновления
      loadMessages(selectedUserId, false);
    }
  }, [selectedUserId, loadMessages]);

  // Автоматическое обновление сообщений каждые 3 секунды
  useEffect(() => {
    if (!selectedUserId) return;

    const interval = setInterval(() => {
      loadMessages(selectedUserId, false);
    }, 3000); // Обновляем каждые 3 секунды

    return () => clearInterval(interval);
  }, [selectedUserId, loadMessages]);

  return {
    messages,
    loading,
    error,
    sending,
    hasMore,
    sendMessage,
    sendFile,
    editMessage,
    deleteMessage,
    loadMore,
    setError
  };
}; 