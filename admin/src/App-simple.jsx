import React, { useState, useEffect, useCallback } from 'react';
import { apiServiceFast } from './services/api-fast';
import SimpleUserList from './components/SimpleUserList';
import ChatWindowSimple from './components/ChatWindow-simple';
import { Bot } from 'lucide-react';

function AppSimple() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Загрузка пользователей
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔄 Загружаем пользователей...');
      const data = await apiServiceFast.getUsers();
      console.log('✅ Получены данные:', data);
      const usersData = data.users || data || [];
      console.log('📋 Пользователи для отображения:', usersData);
      setUsers(usersData);
    } catch (err) {
      console.error('❌ Ошибка загрузки пользователей:', err);
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка сообщений
  const loadMessages = useCallback(async (telegramId) => {
    if (!telegramId) return;
    
    try {
      const data = await apiServiceFast.getMessages(telegramId);
      const processedMessages = (data.messages || []).map(message => ({
        ...message,
        fromBot: !message.fromBot, // Инвертируем логику: сообщения от пользователя = fromBot: true
        _id: message._id || message.messageId || `temp_${Date.now()}`
      }));
      console.log('📨 Загружены сообщения:', processedMessages);
      setMessages(processedMessages);
    } catch (err) {
      console.error('Ошибка загрузки сообщений:', err);
    }
  }, []);

  // Отправка сообщения
  const sendMessage = useCallback(async (telegramId, text) => {
    try {
      const result = await apiServiceFast.sendMessage(telegramId, text);
      const newMessage = {
        _id: result.message._id || `temp_${Date.now()}`,
        telegramId,
        text,
        fromBot: false, // Сообщения от админа = справа
        timestamp: new Date().toISOString(),
        messageType: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
    }
  }, []);

  // Редактирование сообщения
  const editMessage = useCallback(async (messageId, newText) => {
    try {
      console.log('✏️ Редактируем сообщение:', messageId, newText);
      const result = await apiServiceFast.editMessage(messageId, newText);
      setMessages(prev => 
        prev.map(msg => 
          msg._id === messageId 
            ? { ...msg, text: newText }
            : msg
        )
      );
      console.log('✅ Сообщение отредактировано:', result);
    } catch (err) {
      console.error('❌ Ошибка редактирования сообщения:', err);
    }
  }, []);

  // Удаление сообщения
  const deleteMessage = useCallback(async (messageId) => {
    try {
      console.log('🗑️ Удаляем сообщение:', messageId);
      const result = await apiServiceFast.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      console.log('✅ Сообщение удалено:', result);
    } catch (err) {
      console.error('❌ Ошибка удаления сообщения:', err);
    }
  }, []);

  // Выбор пользователя
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
    loadMessages(user.telegramId);
  }, [loadMessages]);

  // Проверка подключения к серверу
  const checkServerConnection = useCallback(async () => {
    try {
      setServerStatus('checking');
      const health = await apiServiceFast.healthCheck();
      if (health.status === 'OK') {
        setIsOnline(true);
        setError(null);
        setServerStatus('connected');
      } else {
        setIsOnline(false);
        setError('Сервер недоступен');
        setServerStatus('error');
      }
    } catch (error) {
      setIsOnline(false);
      setError('Нет подключения к серверу');
      setServerStatus('error');
    }
  }, []);

  // Инициализация
  useEffect(() => {
    checkServerConnection();
    loadUsers();
  }, [checkServerConnection, loadUsers]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Заголовок */}
      <header className="bg-gray-800 px-4 py-3 shadow-sm border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-white">INTURU Admin</h1>
              <p className="text-xs text-gray-300">Панель управления ботом</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Статус подключения */}
            <div className="flex items-center space-x-2">
              {serverStatus === 'checking' && (
                <div className="flex items-center space-x-1 text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Проверка...</span>
                </div>
              )}
              {serverStatus === 'connected' && isOnline && (
                <div className="flex items-center space-x-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm">Онлайн</span>
                </div>
              )}
              {serverStatus === 'error' && (
                <div className="flex items-center space-x-1 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-sm">Оффлайн</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Сообщение об ошибке */}
      {error && (
        <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-300 hover:text-red-100 text-sm font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Основной контент */}
      <div className="flex-1 flex flex-row overflow-hidden">
        {/* Список пользователей */}
        <div className="w-80 bg-gray-800 border-r border-gray-700">
          <SimpleUserList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            loading={loading}
          />
        </div>

        {/* Окно чата */}
        <div className="flex-1 bg-gray-900">
                     <ChatWindowSimple
             selectedUser={selectedUser}
             messages={messages}
             onSendMessage={sendMessage}
             onEditMessage={editMessage}
             onDeleteMessage={deleteMessage}
             onError={(error) => console.error('Ошибка чата:', error)}
             loading={false}
             sending={false}
             setSending={() => {}}
             apiService={apiServiceFast}
             setMessages={setMessages}
             setUsers={setUsers}
           />
        </div>
      </div>
    </div>
  );
}

export default AppSimple; 