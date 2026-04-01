import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiServiceFast } from '../services/api-fast';

export const useMessagesFast = (selectedUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);

  // Кеш сообщений по пользователям
  const messagesCache = useMemo(() => new Map(), []);

  // Быстрая загрузка сообщений
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

      const messagesData = await apiServiceFast.getMessages(telegramId, page, 20); // Уменьшаем лимит для быстрой загрузки
      
      // Обрабатываем сообщения
      const processedMessages = (messagesData.messages || []).map(message => {
        const messageId = message._id || message.messageId;
        
        return {
          ...message,
          fromBot: !message.fromBot,
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

      // Если это первая загрузка, заменяем сообщения
      if (messages.length === 0) {
        setMessages(sortedMessages);
      } else {
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m._id));
          const newMessages = sortedMessages.filter(m => 
            !existingIds.has(m._id) && !m._id.startsWith('temp_')
          );
          if (newMessages.length > 0) {
            const updatedMessages = [...prev, ...newMessages];
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prev;
        });
      }
      
      setHasMore(messagesData.hasMore || false);
    } catch (error) {
      console.error('Ошибка загрузки сообщений:', error);
      setError('Ошибка загрузки сообщений');
    } finally {
      setLoading(false);
    }
  }, [page, messagesCache, messages.length]);

  // Отправка сообщения
  const sendMessage = useCallback(async (telegramId, text) => {
    try {
      setSending(true);
      const result = await apiServiceFast.sendMessage(telegramId, text);
      
      const newMessage = {
        _id: result.message._id || result.message.messageId || `temp_${Date.now()}_${Math.random()}`,
        telegramId,
        text,
        fromBot: false,
        timestamp: result.message.timestamp || new Date().toISOString(),
        messageType: 'text'
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

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
      const result = await apiServiceFast.sendFile(telegramId, file, caption);
      
      const newMessage = {
        _id: result.message._id,
        telegramId,
        text: result.message.text,
        fromBot: false,
        timestamp: result.message.timestamp,
        messageType: result.message.messageType,
        attachments: result.message.attachments || []
      };
      
      setMessages(prev => {
        const updatedMessages = [...prev, newMessage];
        return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      });

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
      await apiServiceFast.editMessage(messageId, newText);
      
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
      await apiServiceFast.deleteMessage(messageId);
      
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
      loadMessages(selectedUserId, false);
    }
  }, [selectedUserId, loadMessages]);

  // Автоматическое обновление сообщений каждые 5 секунд (быстрее)
  useEffect(() => {
    if (!selectedUserId) return;

    const interval = setInterval(() => {
      loadMessages(selectedUserId, false);
    }, 5000); // Обновляем каждые 5 секунд

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