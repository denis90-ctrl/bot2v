import React, { useState, memo, useMemo } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import MessageAttachment from './MessageAttachment';

const Message = memo(({ message, isFromBot, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text || '');

  const formatMessageTime = useMemo(() => (timestamp) => {
    return format(new Date(timestamp), 'HH:mm', { locale: ru });
  }, []);

  // Мемоизируем компоненты ReactMarkdown
  const markdownComponents = useMemo(() => ({
    p: ({ children }) => <span>{children}</span>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-gray-200 p-2 rounded text-xs font-mono overflow-x-auto my-2">{children}</pre>
    )
  }), []);

  const handleEdit = () => {
    if (editText.trim() !== message.text) {
      // Проверяем, что message._id существует
      if (!message._id) {
        console.error('Ошибка: message._id не определен для редактирования', message);
        return;
      }
      onEdit(message._id, editText.trim());
    }
    setIsEditing(false);
  };

  // Проверяем, можно ли редактировать сообщение (только текстовые сообщения)
  const canEdit = useMemo(() => 
    message.messageType === 'text' || (message.attachments && message.attachments.length === 0),
    [message.messageType, message.attachments]
  );

  const handleCancel = () => {
    setEditText(message.text || '');
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить это сообщение?')) {
      // Проверяем, что message._id существует
      if (!message._id) {
        console.error('Ошибка: message._id не определен', message);
        return;
      }
      onDelete(message._id);
    }
  };

  return (
    <div className={`flex ${isFromBot ? 'justify-start' : 'justify-end'} mb-2 group`}>
      <div className={`message-bubble ${isFromBot ? 'bot' : 'user'} fade-in max-w-[70%] relative ${isFromBot ? 'border-l-2 border-green-500' : ''}`}>
        {/* Кнопки действий (только для сообщений от админа с ID) */}
        {!isFromBot && message._id && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 message-actions">
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-6 h-6 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Редактировать"
              >
                <Edit2 size={12} />
              </button>
            )}
            <button
              onClick={handleDelete}
              className="w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xs transition-colors"
              title="Удалить"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}

        {/* Режим редактирования */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-cyan-400"
              rows={Math.max(2, editText.split('\n').length)}
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs transition-colors flex items-center space-x-1"
              >
                <X size={12} />
                <span>Отмена</span>
              </button>
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 rounded text-white text-xs transition-colors flex items-center space-x-1"
              >
                <Check size={12} />
                <span>Сохранить</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Текст сообщения */}
            {message.text && (
              <div className="text-sm leading-relaxed">
                <ReactMarkdown components={markdownComponents}>
                  {message.text}
                </ReactMarkdown>
              </div>
            )}

            {/* Вложения */}
            {message.attachments && message.attachments.map((attachment, index) => (
              <MessageAttachment key={index} attachment={attachment} />
            ))}

            {/* Временная метка */}
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs opacity-75">
                {formatMessageTime(message.timestamp)}
              </span>
              {message.isEdited && (
                <span className="text-xs opacity-75 ml-1">(ред.)</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';
export default Message; 