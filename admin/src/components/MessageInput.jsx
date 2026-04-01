import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';

const MessageInput = ({ onSendMessage, onSendAttachment, disabled = false }) => {
  const [messageText, setMessageText] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim() && !disabled) {
      onSendMessage(messageText.trim());
      setMessageText('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      onSendAttachment(file);
    });
    e.target.value = '';
  };

  const handleEmojiClick = (emoji) => {
    setMessageText(prev => prev + emoji);
    setIsEmojiPickerOpen(false);
  };

  const commonEmojis = ['😊', '👍', '❤️', '😂', '😍', '🎉', '🔥', '💯', '👏', '🙏'];

  return (
    <div className="px-4 py-3 border-t border-gray-700 bg-gray-800">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Кнопка вложений */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-200 disabled:text-gray-600 transition-colors"
        >
          <Paperclip size={20} />
        </button>

        {/* Скрытый input для файлов */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,application/pdf,text/*"
        />

        {/* Поле ввода */}
        <div className="flex-1 relative">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            disabled={disabled}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            rows="1"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji picker */}
          {isEmojiPickerOpen && (
            <div className="absolute bottom-full mb-2 left-0 bg-gray-800 border border-gray-600 rounded-lg shadow-lg p-2 z-10">
              <div className="grid grid-cols-5 gap-1">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiClick(emoji)}
                    className="p-2 hover:bg-gray-700 rounded text-lg"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Кнопка emoji */}
        <button
          type="button"
          onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
          disabled={disabled}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-200 disabled:text-gray-600 transition-colors"
        >
          <Smile size={20} />
        </button>

        {/* Кнопка отправки */}
        <button
          type="submit"
          disabled={!messageText.trim() || disabled}
          className="flex-shrink-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput; 