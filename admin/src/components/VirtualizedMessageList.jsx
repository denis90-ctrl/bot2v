import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import Message from './Message';

// Мемоизированное сообщение
const VirtualizedMessage = memo(({ message, isFromBot, onEdit, onDelete }) => {
  return (
    <Message
      message={message}
      isFromBot={isFromBot}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
});

VirtualizedMessage.displayName = 'VirtualizedMessage';

// Компонент строки для виртуализации
const MessageRow = memo(({ index, style, data }) => {
  const { messages, onEdit, onDelete } = data;
  const message = messages[index];
  
  if (!message) return null;
  
  return (
    <div style={style} className="px-4">
      <VirtualizedMessage
        message={message}
        isFromBot={message.fromBot}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
});

MessageRow.displayName = 'MessageRow';

// Основной компонент виртуализированного списка сообщений
const VirtualizedMessageList = ({ 
  messages, 
  onEdit, 
  onDelete, 
  height = 600,
  onScroll,
  selectedUserId 
}) => {
  const listRef = useRef(null);
  const itemSize = 120; // Примерная высота сообщения
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  
  const itemData = useCallback(() => ({
    messages,
    onEdit,
    onDelete
  }), [messages, onEdit, onDelete]);

  // Автоскролл вниз при новых сообщениях и при первой загрузке
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      // Если пользователь не прокрутил вверх, скроллим вниз
      if (!userScrolledUp) {
        const scrollToBottom = () => {
          if (listRef.current?._outerRef) {
            const container = listRef.current._outerRef;
            container.scrollTop = container.scrollHeight;
          }
        };

        // Множественные попытки скролла
        setTimeout(scrollToBottom, 50);
        setTimeout(scrollToBottom, 150);
        setTimeout(scrollToBottom, 250);
      }
    }
  }, [messages.length, messages, userScrolledUp]);

  // Принудительный скролл вниз при первой загрузке
  useEffect(() => {
    if (listRef.current && messages.length > 0) {
      // Используем requestAnimationFrame для надежного скролла
      const scrollToBottom = () => {
        if (listRef.current?._outerRef) {
          const container = listRef.current._outerRef;
          container.scrollTop = container.scrollHeight;
        }
      };

      // Первая попытка через 100ms
      setTimeout(scrollToBottom, 100);
      
      // Вторая попытка через 300ms
      setTimeout(scrollToBottom, 300);
      
      // Третья попытка через 500ms
      setTimeout(scrollToBottom, 500);
      
      // Четвертая попытка через 1000ms
      setTimeout(scrollToBottom, 1000);
    }
  }, [selectedUserId, messages.length]); // Срабатывает при смене пользователя и изменении сообщений

  // Обработчик скролла для отслеживания позиции пользователя
  const handleScroll = useCallback(({ scrollTop, scrollHeight, clientHeight }) => {
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50; // 50px tolerance
    setUserScrolledUp(!isAtBottom);
  }, []);

  // Сброс состояния при смене пользователя
  useEffect(() => {
    setUserScrolledUp(false);
    // Принудительно скроллим вниз при смене пользователя
    if (listRef.current && messages.length > 0) {
      const scrollToBottom = () => {
        if (listRef.current?._outerRef) {
          const container = listRef.current._outerRef;
          container.scrollTop = container.scrollHeight;
        }
      };

      // Множественные попытки скролла при смене пользователя
      setTimeout(scrollToBottom, 100);
      setTimeout(scrollToBottom, 300);
      setTimeout(scrollToBottom, 500);
      setTimeout(scrollToBottom, 800);
    }
  }, [selectedUserId, messages.length]);

  if (!messages || messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm">Нет сообщений</p>
        </div>
      </div>
    );
  }

  return (
    <List
      ref={listRef}
      height={height}
      itemCount={messages.length}
      itemSize={itemSize}
      itemData={itemData()}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
      onScroll={handleScroll}
    >
      {MessageRow}
    </List>
  );
};

export default memo(VirtualizedMessageList); 