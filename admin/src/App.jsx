import React, { useState, useEffect, useCallback, Profiler } from 'react';
import { apiService } from './services/api';
import VirtualizedUserList from './components/VirtualizedUserList';
import ChatWindow from './components/ChatWindow';
import { useUsers } from './hooks/useUsers';
import { useMessages } from './hooks/useMessages';
import { PerformanceMonitor, PerformanceMetrics, useDataSize } from './components/PerformanceMonitor';
import { generateTestUsers, generateTestMessages, analyzePerformance } from './utils/performanceTest';
import { Bot } from 'lucide-react';

function App() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [testMode, setTestMode] = useState(false);

  // Используем кастомные хуки
  const { 
    users: realUsers, 
    loading: usersLoading, 
    error: usersError, 
    loadUsers, 
    updateUser 
  } = useUsers();

  const {
    messages: realMessages,
    loading: messagesLoading,
    error: messagesError,
    sending,
    sendMessage,
    sendFile,
    editMessage,
    deleteMessage,
    setError: setMessagesError
  } = useMessages(selectedUser?.telegramId);

  // Используем тестовые данные в режиме тестирования
  const users = testMode ? generateTestUsers(1000, realUsers[0]?.telegramId) : realUsers;
  const messages = testMode ? generateTestMessages(2000, realUsers[0]?.telegramId) : realMessages;

  // Профилирование данных
  useDataSize(users);
  useDataSize(messages);

  // Callback для React Profiler
  const onRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
    console.log(`🎯 Profiler [${id}]: ${phase} - ${actualDuration.toFixed(2)}ms (base: ${baseDuration.toFixed(2)}ms)`);
  };

  // Функция для запуска тестов производительности
  const runPerformanceTest = useCallback(() => {
    console.log('🧪 Starting Performance Test...');
    
    // Проверяем, есть ли реальные пользователи
    if (realUsers.length === 0) {
      console.warn('⚠️ Нет реальных пользователей для тестирования. Используйте реальные данные.');
      return;
    }
    
    // Используем первого реального пользователя для тестовых сообщений
    const realUserId = realUsers[0]?.telegramId;
    if (!realUserId) {
      console.warn('⚠️ Не удалось получить ID реального пользователя');
      return;
    }
    
    const testUsers = generateTestUsers(1000, realUserId);
    const testMessages = generateTestMessages(2000, realUserId);
    
    analyzePerformance(testUsers, testMessages);
    
    // Временно заменяем данные на тестовые
    setTestMode(true);
    setTimeout(() => setTestMode(false), 10000); // 10 секунд теста
  }, [realUsers]);

  // Проверка подключения к серверу
  const checkServerConnection = useCallback(async () => {
    try {
      await apiService.healthCheck();
      setIsOnline(true);
      setError(null);
    } catch (error) {
      setIsOnline(false);
      setError('Нет подключения к серверу');
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

  // Периодическая проверка подключения
  useEffect(() => {
    checkServerConnection();

    const interval = setInterval(() => {
      checkServerConnection();
    }, 30000); // Проверка каждые 30 секунд

    return () => clearInterval(interval);
  }, [checkServerConnection]);

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
      {/* Заголовок в стиле INTURU */}
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
            {/* Кнопка тестирования производительности */}
            <button
              onClick={runPerformanceTest}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
              title="Запустить тест производительности"
            >
              🧪 Test
            </button>
            
            {/* Статус подключения */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <div className="flex items-center space-x-1 text-purple-400">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-sm">Онлайн</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-gray-400">
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
      <div className="flex-1 flex flex-row overflow-hidden main-content">
        {/* Список пользователей */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 user-panel">
          <Profiler id="UserList" onRender={onRenderCallback}>
            <VirtualizedUserList
              users={users}
              selectedUser={selectedUser}
              onUserSelect={handleUserSelect}
              loading={usersLoading}
              height={window.innerHeight - 200}
            />
          </Profiler>
        </div>

        {/* Окно чата */}
        <div className="flex-1 bg-gray-900 chat-panel">
          <Profiler id="ChatWindow" onRender={onRenderCallback}>
            <ChatWindow
              selectedUser={selectedUser}
              messages={messages}
              onSendMessage={sendMessage}
              onEditMessage={editMessage}
              onDeleteMessage={deleteMessage}
              onError={setMessagesError}
              loading={messagesLoading}
              sending={sending}
              setSending={() => {}}
              apiService={apiService}
              setMessages={() => {}}
              setUsers={() => {}}
            />
          </Profiler>
        </div>
      </div>

      {/* Метрики производительности */}
      <PerformanceMetrics users={users} messages={messages} />
    </div>
  );
 }

export default App; 