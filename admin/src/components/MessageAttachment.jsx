import React, { useState, useEffect } from 'react';
import { File, Download } from 'lucide-react';
import { getCachedImage } from '../services/imageProxy';

const MessageAttachment = ({ attachment }) => {
  const { type, mimeType, fileId, filename, size } = attachment;
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const isImage = mimeType?.startsWith('image/') || type === 'photo';
  const isDocument = mimeType?.startsWith('application/') || mimeType?.startsWith('text/') || type === 'document';

  // Загружаем изображение через прокси
  useEffect(() => {
    if (isImage && fileId && !imageSrc && !imageLoading && !imageError) {
      setImageLoading(true);
      getCachedImage(fileId)
        .then((base64) => {
          if (base64) {
            setImageSrc(base64);
          } else {
            setImageError(true);
          }
        })
        .catch(() => {
          setImageError(true);
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
  }, [isImage, fileId, imageSrc, imageLoading, imageError]);

  if (isImage) {
    
    return (
      <div className="mt-2">
        {imageLoading && (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <File size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  Загрузка изображения...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {imageSrc && !imageLoading && (
          <img 
            src={imageSrc} 
            alt={filename}
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(imageSrc, '_blank')}
            onError={() => {
              console.error('Ошибка отображения изображения:', fileId);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ Изображение отображено:', fileId);
            }}
          />
        )}
        
        {(!imageSrc || imageError) && !imageLoading && (
          <div className="p-3 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <File size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {filename}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(size)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (isDocument) {
    const downloadUrl = fileId ? `http://localhost:3001/api/file/${fileId}` : null;
    
    return (
      <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <File size={20} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {filename}
            </p>
            <p className="text-xs text-gray-400">
              {formatFileSize(size)}
            </p>
          </div>
          {downloadUrl && (
            <button
              onClick={() => window.open(downloadUrl, '_blank')}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  const downloadUrl = fileId ? `http://localhost:3001/api/file/${fileId}` : null;
  
  return (
    <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-600">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <File size={20} className="text-gray-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {filename}
          </p>
          <p className="text-xs text-gray-400">
            {formatFileSize(size)}
          </p>
        </div>
        {downloadUrl && (
          <button
            onClick={() => window.open(downloadUrl, '_blank')}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <Download size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageAttachment; 