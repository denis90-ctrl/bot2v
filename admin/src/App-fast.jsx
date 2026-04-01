import React, { useState, useEffect, useCallback } from 'react';
import { apiServiceFast } from './services/api-fast';
import VirtualizedUserList from './components/VirtualizedUserList';
import ChatWindowSimple from './components/ChatWindow-simple';
import { useUsersFast } from './hooks/useUsers-fast';
import { useMessagesFast } from './hooks/useMessages-fast';
import { Bot } from 'lucide-react';

function AppFast() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');

  // Используем кастомные хуки с быстрым API
  const { 
    users, 
    loading: usersLoading, 
    error: usersError, 
    loadUsers 
  } = useUsersFast();

  const {
    messages,
    loading: messagesLoading,
    error: messagesError,
    sending,
    sendMessage,
    editMessage,
    deleteMessage,
    setError: setMessagesError
  } = useMessagesFast(selectedUser?.telegramId);

  // Быстрая проверка подключения к серверу
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

  // Обработка ошибок
  useEffect(() => {
    if (usersError) setError(usersError);
    if (messagesError) setError(messagesError);
  }, [usersError, messagesError]);

  // Выбор пользователя
  const handleUserSelect = useCallback((user) => {
    setSelectedUser(user);
  }, []);

  // Инициализация и периодическая проверка
  useEffect(() => {
    checkServerConnection();
    loadUsers();

    const interval = setInterval(() => {
      checkServerConnection();
    }, 15000); // Проверка каждые 15 секунд

    return () => clearInterval(interval);
  }, [checkServerConnection, loadUsers]);

  // Обработчик онлайн/оффлайн статуса
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
          <VirtualizedUserList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            loading={usersLoading}
            height={window.innerHeight - 200}
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
            onError={setMessagesError}
            loading={messagesLoading}
            sending={sending}
            setSending={() => {}}
            apiService={apiServiceFast}
            setMessages={() => {}}
            setUsers={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

export default AppFast; 