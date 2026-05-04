'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  accept?: string;
  hint?: string;
  maxSizeMB?: number;
}

export default function FileUpload({
  value,
  onChange,
  label,
  accept = '*/*',
  hint = 'Any file type',
  maxSizeMB = 10,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'hackmate/assets');

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Upload failed');
    }
    const data = await res.json();
    return data.url;
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError('');

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await processFile(file);
  }, []);

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setError('');

    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlInput = (url: string) => {
    onChange(url);
    setFileName('');
  };

  const handleRemove = () => {
    onChange('');
    setFileName('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const isImage = value && (value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i) || fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)/i));

  return (
    <div className="fu-container">
      <label className="fu-label">
        {label}
        {hint && <span className="fu-hint">{hint}</span>}
      </label>

      {!value ? (
        <div
          className={`fu-dropzone ${isDragging ? 'fu-dropzone-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileInput}
            className="fu-input-hidden"
          />

          <div className="fu-dropzone-content">
            <div className="fu-dropzone-icon">
              <Upload size={24} />
            </div>
            <p className="fu-dropzone-text">
              Drop your file here or <span className="fu-dropzone-link">browse</span>
            </p>
            <p className="fu-dropzone-hint">Max {maxSizeMB}MB</p>
          </div>

          {isLoading && (
            <div className="fu-loading">
              <div className="fu-spinner" />
            </div>
          )}
        </div>
      ) : (
        <div className="fu-preview">
          <div className="fu-preview-content">
            {isImage ? (
              <img src={value} alt={label} className="fu-preview-image" />
            ) : (
              <div className="fu-preview-file">
                <FileText size={32} />
                <span className="fu-preview-filename">{fileName || 'Uploaded file'}</span>
              </div>
            )}
            <div className="fu-preview-overlay">
              <button
                type="button"
                className="fu-preview-btn"
                onClick={handleRemove}
              >
                <X size={16} />
                Remove
              </button>
            </div>
          </div>
          <a 
            href={value} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fu-preview-link"
          >
            View file
          </a>
        </div>
      )}

      <div className="fu-url-input">
        <input
          type="text"
          className="org-input"
          placeholder="Or paste URL..."
          value={value && !value.startsWith('blob:') ? value : ''}
          onChange={(e) => handleUrlInput(e.target.value)}
        />
      </div>

      {error && <p className="fu-error">{error}</p>}
    </div>
  );
}
