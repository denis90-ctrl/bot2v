import React, { useRef, useEffect, useState, memo } from 'react';
import { User, Bot, MessageCircle } from 'lucide-react';
import VirtualizedMessageList from './VirtualizedMessageList';
import MessageInput from './MessageInput';

const ChatWindow = memo(({ selectedUser, messages, onSendMessage, onEditMessage, onDeleteMessage, onError, loading, sending, setSending, apiService, setMessages, setUsers }) => {
  const bottomRef = useRef(null);
  const chatWindowRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Автоматическая прокрутка к новому сообщению
  const scrollToNewMessage = () => {
    if (shouldAutoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Проверяем, находится ли пользователь внизу чата
  const handleScroll = () => {
    if (chatWindowRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatWindowRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
      setShouldAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    scrollToNewMessage();
  }, [messages]);

  useEffect(() => {
    const container = chatWindowRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleSendMessage = (text) => {
    if (selectedUser && !sending) {
      onSendMessage(selectedUser.telegramId, text);
    }
  };

  const handleSendAttachment = async (file) => {
    if (selectedUser && !sending) {
             try {
         setSending(true);
         const result = await apiService.sendFile(selectedUser.telegramId, file);
         
         // Добавляем отправленное сообщение в список
         const newMessage = {
           _id: result.message._id,
           telegramId: selectedUser.telegramId,
           text: result.message.text,
           fromBot: false,
           timestamp: result.message.timestamp,
           messageType: result.message.messageType,
           attachments: result.message.attachments || []
         };
         
                   setMessages(prev => {
            const updatedMessages = [...prev, newMessage];
            // Сортируем сообщения от старых к новым
            return updatedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          });
        
        // Обновляем время последнего сообщения пользователя
        setUsers(prev => 
          prev.map(user => 
            user.telegramId === selectedUser.telegramId 
              ? { ...user, lastMessageAt: new Date().toISOString() }
              : user
          )
        );
      } catch (error) {
        console.error('Ошибка отправки файла:', error);
        onError('Ошибка отправки файла');
      } finally {
        setSending(false);
      }
    }
  };

  const getUserDisplayName = (user) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
      return user.firstName;
    } else if (user.username) {
      return `@${user.username}`;
    } else {
      return `ID: ${user.telegramId}`;
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <Bot size={24} className="text-gray-500" />
        </div>
        <p className="text-base font-medium mb-1">Выберите пользователя</p>
        <p className="text-sm text-gray-500 text-center">Выберите пользователя из списка для начала чата</p>
      </div>
    );
  }

     return (
     <div className="flex flex-col h-full chat-layout" style={{ marginTop: '-64px' }}>
              {/* Заголовок чата */}
        <div className="flex items-center space-x-3 px-4 py-2 border-b border-gray-700 bg-gray-800">
         <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
           <User size={16} className="text-gray-300" />
         </div>
         <div className="flex-1">
           <h3 className="text-sm font-medium text-white">
             {getUserDisplayName(selectedUser)}
           </h3>
           <div className="flex items-center space-x-2 mt-0.5">
             <span className="text-xs text-gray-400">
               ID: {selectedUser.telegramId}
             </span>
             {selectedUser.username && (
               <span className="text-xs text-purple-400">
                 @{selectedUser.username}
               </span>
             )}
           </div>
         </div>
       </div>

      {/* Прокручиваемое окно чата */}
      <div 
        ref={chatWindowRef}
        className="chat-window bg-gray-900"
        style={{
          height: '100%',
          maxHeight: 'calc(100vh - 116px)', // Учитываем поднятие чата
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Загрузка...</span>
            </div>
          </div>
                 ) : messages && messages.length > 0 ? (
           <div className="relative">
             {loading && (
               <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                 <div className="bg-gray-800 px-3 py-1 rounded-full text-xs text-gray-300 flex items-center space-x-2">
                   <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                   <span>Обновление...</span>
                 </div>
               </div>
             )}
             <VirtualizedMessageList
               messages={messages}
               onEdit={onEditMessage}
               onDelete={onDeleteMessage}
               height={window.innerHeight - 200}
               onScroll={handleScroll}
               selectedUserId={selectedUser?.telegramId}
             />
           </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
              <MessageCircle size={24} className="text-gray-500" />
            </div>
            <p className="text-base font-medium mb-1">Нет сообщений</p>
            <p className="text-sm text-gray-500 text-center">Начните разговор, отправив первое сообщение</p>
          </div>
        )}
      </div>

      {/* Форма отправки сообщения */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onSendAttachment={handleSendAttachment}
        disabled={sending}
      />
    </div>
  );
});

ChatWindow.displayName = 'ChatWindow';
export default ChatWindow; 